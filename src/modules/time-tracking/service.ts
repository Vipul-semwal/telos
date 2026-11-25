import { db } from "@/infrastructure/database";
import { timeSessions } from "./schema";
import { tasks, taskHistory } from "../tasks/schema";
import { routineOccurrences } from "../routines/schema";
import { eq, and, isNull, isNotNull, sum, count, desc } from "drizzle-orm";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/domain-error";
import { calculateEtaStatus } from "@/shared/utils/duration";
import { getTodayDateString } from "@/shared/utils/date";
import { DailyPlanningService } from "../daily-planning/service";
import type { StartTimerInput, ManualSessionInput } from "./validation";

export const MAX_TIMER_SESSION_SECONDS = 45 * 60; // 45 minutes

export class TimeTrackingService {
  private static async finalizeIfExpired(
    userId: string,
    active: { id: string; taskId: string; startTime: Date; notes: string | null },
  ): Promise<boolean> {
    const startMs = new Date(active.startTime).getTime();
    const limitMs = MAX_TIMER_SESSION_SECONDS * 1000;
    if (Date.now() - startMs < limitMs) {
      return false;
    }

    const cappedEndTime = new Date(startMs + limitMs);
    const updatedNotes = active.notes
      ? `${active.notes} [Auto-stopped at 45m limit]`
      : "Auto-stopped after 45m limit";

    const [stopped] = await db
      .update(timeSessions)
      .set({
        endTime: cappedEndTime,
        durationSeconds: MAX_TIMER_SESSION_SECONDS,
        notes: updatedNotes,
        updatedAt: new Date(),
      })
      .where(and(eq(timeSessions.id, active.id), isNull(timeSessions.endTime)))
      .returning();

    if (stopped) {
      await db.insert(taskHistory).values({
        userId,
        taskId: active.taskId,
        eventType: "session_stopped",
        eventData: JSON.stringify({
          sessionId: stopped.id,
          durationSeconds: MAX_TIMER_SESSION_SECONDS,
          stoppedAt: cappedEndTime.toISOString(),
          autoStopped: true,
          reason: "45_minute_limit",
        }),
      });
    }

    return true;
  }

  private static async assertTaskIsInTodayPlan(userId: string, taskId: string) {
    const plan = await DailyPlanningService.getPlanWithItems(
      userId,
      getTodayDateString(),
    );
    const item = plan.items.find((candidate) => candidate.taskId === taskId);

    if (!item || (item.status !== "planned" && item.status !== "in_progress")) {
      throw new ValidationError(
        "Only tasks in today's daily plan can be tracked. Add the task to Today's Plan first.",
      );
    }
    return item;
  }

  /**
   * Find any currently running timer for the user.
   */
  static async getActiveTimer(userId: string) {
    const [active] = await db
      .select({
        id: timeSessions.id,
        taskId: timeSessions.taskId,
        routineOccurrenceId: timeSessions.routineOccurrenceId,
        startTime: timeSessions.startTime,
        notes: timeSessions.notes,
        taskTitle: tasks.title,
        estimatedDurationSeconds: tasks.estimatedDurationSeconds,
      })
      .from(timeSessions)
      .innerJoin(tasks, eq(timeSessions.taskId, tasks.id))
      .where(and(eq(timeSessions.userId, userId), isNull(timeSessions.endTime)));

    if (!active) return null;

    if (await this.finalizeIfExpired(userId, active)) {
      return null;
    }

    const [recorded] = await db
      .select({ total: sum(timeSessions.durationSeconds) })
      .from(timeSessions)
      .where(
        active.routineOccurrenceId
          ? and(
              eq(timeSessions.userId, userId),
              eq(timeSessions.routineOccurrenceId, active.routineOccurrenceId),
            )
          : and(
              eq(timeSessions.userId, userId),
              eq(timeSessions.taskId, active.taskId),
            ),
      );

    const [occurrence] = active.routineOccurrenceId
      ? await db
          .select({ plannedDurationSeconds: routineOccurrences.plannedDurationSeconds })
          .from(routineOccurrences)
          .where(
            and(
              eq(routineOccurrences.id, active.routineOccurrenceId),
              eq(routineOccurrences.userId, userId),
            ),
          )
      : [];

    return {
      ...active,
      estimatedDurationSeconds:
        occurrence?.plannedDurationSeconds ?? active.estimatedDurationSeconds,
      totalRecordedSeconds: Number(recorded?.total ?? 0),
    };
  }

  /**
   * List recent completed/recorded sessions for a user with task context.
   */
  static async listRecentSessions(userId: string, limit = 25) {
    return db
      .select({
        id: timeSessions.id,
        taskId: timeSessions.taskId,
        taskTitle: tasks.title,
        taskEstimatedSeconds: tasks.estimatedDurationSeconds,
        startTime: timeSessions.startTime,
        endTime: timeSessions.endTime,
        durationSeconds: timeSessions.durationSeconds,
        notes: timeSessions.notes,
        isManualCorrection: timeSessions.isManualCorrection,
      })
      .from(timeSessions)
      .innerJoin(tasks, eq(timeSessions.taskId, tasks.id))
      .where(and(eq(timeSessions.userId, userId), isNotNull(timeSessions.endTime)))
      .orderBy(desc(timeSessions.startTime))
      .limit(limit);
  }

  /**
   * Aggregate total recorded seconds and session count for a user.
   */
  static async getTotalRecorded(userId: string) {
    const result = await db
      .select({
        totalDuration: sum(timeSessions.durationSeconds),
        sessionCount: count(),
      })
      .from(timeSessions)
      .where(eq(timeSessions.userId, userId));

    return {
      totalDurationSeconds: Number(result[0]?.totalDuration ?? 0),
      sessionCount: Number(result[0]?.sessionCount ?? 0),
    };
  }

  /**
   * Start a work timer for a task.
   * Enforces rules:
   * 1. Task must belong to the user.
   * 2. Only ONE active timer permitted per user at any given time.
   * 3. Sets task status to in_progress if currently todo.
   */
  static async startTimer(userId: string, input: StartTimerInput) {
    // 1. Verify task ownership
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)));

    if (!task) {
      throw new NotFoundError("Task", input.taskId);
    }
    if (task.status === "completed" || task.status === "cancelled") {
      throw new ValidationError("Completed or cancelled tasks cannot be tracked.");
    }
    const planItem = await this.assertTaskIsInTodayPlan(userId, input.taskId);

    // 2. Prevent multiple simultaneous active timers
    const active = await this.getActiveTimer(userId);
    if (active) {
      throw new ConflictError(
        `A timer is already active for task '${active.taskTitle}'. Please pause or stop the running timer first.`,
      );
    }

    const now = new Date();
    const [session] = await db
      .insert(timeSessions)
      .values({
        userId,
        taskId: input.taskId,
        routineOccurrenceId: planItem.routineOccurrenceId,
        startTime: now,
        endTime: null,
        durationSeconds: 0,
      })
      .returning();

    // Update task to in_progress if it was todo
    if (task.status === "todo") {
      await db
        .update(tasks)
        .set({ status: "in_progress", updatedAt: now })
        .where(eq(tasks.id, task.id));
    }

    await db.insert(taskHistory).values({
      userId,
      taskId: task.id,
      eventType: "session_started",
      eventData: JSON.stringify({ sessionId: session.id, startTime: now.toISOString() }),
    });

    return session;
  }

  /**
   * Stop an active timer.
   * Enforces rules:
   * 1. Stopping DOES NOT complete the task.
   * 2. Maximum session duration is capped at 45 minutes (2,700 seconds).
   */
  static async stopTimer(userId: string) {
    const [active] = await db
      .select()
      .from(timeSessions)
      .where(and(eq(timeSessions.userId, userId), isNull(timeSessions.endTime)));

    if (!active) {
      throw new NotFoundError("Active timer session");
    }

    const now = new Date();
    const startMs = new Date(active.startTime).getTime();
    const rawDurationSeconds = Math.max(1, Math.floor((now.getTime() - startMs) / 1000));
    const autoStopped = rawDurationSeconds >= MAX_TIMER_SESSION_SECONDS;
    const durationSeconds = autoStopped ? MAX_TIMER_SESSION_SECONDS : rawDurationSeconds;
    const endTime = autoStopped
      ? new Date(startMs + MAX_TIMER_SESSION_SECONDS * 1000)
      : now;
    const notes = autoStopped
      ? active.notes
        ? `${active.notes} [Auto-stopped at 45m limit]`
        : "Auto-stopped after 45m limit"
      : active.notes;

    const [stopped] = await db
      .update(timeSessions)
      .set({
        endTime,
        durationSeconds,
        notes,
        updatedAt: now,
      })
      .where(and(eq(timeSessions.id, active.id), isNull(timeSessions.endTime)))
      .returning();

    if (!stopped) {
      throw new NotFoundError("Active timer session");
    }

    await db.insert(taskHistory).values({
      userId,
      taskId: active.taskId,
      eventType: "session_stopped",
      eventData: JSON.stringify({
        sessionId: stopped.id,
        durationSeconds,
        stoppedAt: endTime.toISOString(),
        autoStopped,
        ...(autoStopped ? { reason: "45_minute_limit" } : {}),
      }),
    });

    return { ...stopped, autoStopped };
  }

  /**
   * Log an auditable manual time session or correction.
   */
  static async logManualSession(userId: string, input: ManualSessionInput) {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)));

    if (!task) {
      throw new NotFoundError("Task", input.taskId);
    }
    if (task.status === "completed" || task.status === "cancelled") {
      throw new ValidationError("Completed or cancelled tasks cannot be tracked.");
    }
    const planItem = await this.assertTaskIsInTodayPlan(userId, input.taskId);

    const now = new Date();
    const startTime = new Date(now.getTime() - input.durationSeconds * 1000);

    const [session] = await db
      .insert(timeSessions)
      .values({
        userId,
        taskId: input.taskId,
        routineOccurrenceId: planItem.routineOccurrenceId,
        startTime,
        endTime: now,
        durationSeconds: input.durationSeconds,
        notes: input.notes,
        isManualCorrection: true,
      })
      .returning();

    await db.insert(taskHistory).values({
      userId,
      taskId: task.id,
      eventType: "duration_adjusted",
      eventData: JSON.stringify({
        sessionId: session.id,
        durationSeconds: input.durationSeconds,
        notes: input.notes,
      }),
    });

    return session;
  }

  /**
   * Calculate task aggregated duration and ETA status.
   * ETA status:
   * - Green: actual duration <= estimated duration.
   * - Red: actual duration exceeds estimated duration.
   */
  static async getTaskMetrics(userId: string, taskId: string) {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    if (!task) {
      throw new NotFoundError("Task", taskId);
    }

    const sessions = await db
      .select({
        totalDuration: sum(timeSessions.durationSeconds),
        sessionCount: count(),
      })
      .from(timeSessions)
      .where(and(eq(timeSessions.taskId, taskId), eq(timeSessions.userId, userId)));

    const actualDurationSeconds = Number(sessions[0]?.totalDuration ?? 0);
    const sessionCount = Number(sessions[0]?.sessionCount ?? 0);
    const etaStatus = calculateEtaStatus(actualDurationSeconds, task.estimatedDurationSeconds);

    return {
      taskId: task.id,
      title: task.title,
      estimatedDurationSeconds: task.estimatedDurationSeconds,
      actualDurationSeconds,
      etaStatus,
      sessionCount,
    };
  }
}
