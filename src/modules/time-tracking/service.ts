import { db } from "@/infrastructure/database";
import { timeSessions } from "./schema";
import { tasks, taskHistory } from "../tasks/schema";
import { eq, and, isNull, sum, count } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/shared/errors/domain-error";
import { calculateEtaStatus } from "@/shared/utils/duration";
import type { StartTimerInput, ManualSessionInput } from "./validation";

export class TimeTrackingService {
  /**
   * Find any currently running timer for the user.
   */
  static async getActiveTimer(userId: string) {
    const [active] = await db
      .select({
        id: timeSessions.id,
        taskId: timeSessions.taskId,
        startTime: timeSessions.startTime,
        taskTitle: tasks.title,
        estimatedDurationSeconds: tasks.estimatedDurationSeconds,
      })
      .from(timeSessions)
      .innerJoin(tasks, eq(timeSessions.taskId, tasks.id))
      .where(and(eq(timeSessions.userId, userId), isNull(timeSessions.endTime)));

    return active ?? null;
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
   * Enforces rule: Stopping DOES NOT complete the task.
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
    const durationSeconds = Math.max(
      1,
      Math.floor((now.getTime() - new Date(active.startTime).getTime()) / 1000),
    );

    const [stopped] = await db
      .update(timeSessions)
      .set({
        endTime: now,
        durationSeconds,
        updatedAt: now,
      })
      .where(eq(timeSessions.id, active.id))
      .returning();

    await db.insert(taskHistory).values({
      userId,
      taskId: active.taskId,
      eventType: "session_stopped",
      eventData: JSON.stringify({
        sessionId: stopped.id,
        durationSeconds,
        stoppedAt: now.toISOString(),
      }),
    });

    return stopped;
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

    const now = new Date();
    const startTime = new Date(now.getTime() - input.durationSeconds * 1000);

    const [session] = await db
      .insert(timeSessions)
      .values({
        userId,
        taskId: input.taskId,
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
