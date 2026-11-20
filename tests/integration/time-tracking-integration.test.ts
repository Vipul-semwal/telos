import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { disciplines } from "@/modules/disciplines/schema";
import { projects } from "@/modules/projects/schema";
import { tasks, taskHistory } from "@/modules/tasks/schema";
import { timeSessions } from "@/modules/time-tracking/schema";
import { TimeTrackingService } from "@/modules/time-tracking/service";
import { dailyPlans, dailyPlanItems } from "@/modules/daily-planning/schema";
import { routineVariants } from "@/modules/routines/schema";
import { RoutineService } from "@/modules/routines/service";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/domain-error";
import { getTodayDateString } from "@/shared/utils/date";
import { and, inArray, eq } from "drizzle-orm";

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const USER_A_ID = `tt-int-a-${SUFFIX}`;
const USER_B_ID = `tt-int-b-${SUFFIX}`;

let taskAId: string;
let taskA2Id: string;
let taskA3Id: string;
let taskBId: string;

async function seedBase() {
  await db
    .insert(user)
    .values([
      {
        id: USER_A_ID,
        name: "Time A",
        email: `tt-a-${SUFFIX}@test.com`,
        emailVerified: false,
        username: `tt_a_${SUFFIX}`,
      },
      {
        id: USER_B_ID,
        name: "Time B",
        email: `tt-b-${SUFFIX}@test.com`,
        emailVerified: false,
        username: `tt_b_${SUFFIX}`,
      },
    ])
    .onConflictDoNothing();

  const [discA] = await db
    .insert(disciplines)
    .values({ userId: USER_A_ID, title: "Time Discipline A", status: "active" })
    .returning();
  const [discB] = await db
    .insert(disciplines)
    .values({ userId: USER_B_ID, title: "Time Discipline B", status: "active" })
    .returning();

  const [projA] = await db
    .insert(projects)
    .values({ userId: USER_A_ID, disciplineId: discA.id, title: "Time Project A" })
    .returning();
  const [projB] = await db
    .insert(projects)
    .values({ userId: USER_B_ID, disciplineId: discB.id, title: "Time Project B" })
    .returning();

  const [taskA] = await db
    .insert(tasks)
    .values({
      userId: USER_A_ID,
      projectId: projA.id,
      title: "Timed Task A",
      estimatedDurationSeconds: 600,
    })
    .returning();
  const [taskA2] = await db
    .insert(tasks)
    .values({
      userId: USER_A_ID,
      projectId: projA.id,
      title: "Timed Task A2",
      estimatedDurationSeconds: 3600,
    })
    .returning();
  const [taskA3] = await db
    .insert(tasks)
    .values({
      userId: USER_A_ID,
      projectId: projA.id,
      title: "Unplanned Task A3",
      estimatedDurationSeconds: 1200,
    })
    .returning();
  const [taskB] = await db
    .insert(tasks)
    .values({ userId: USER_B_ID, projectId: projB.id, title: "Timed Task B" })
    .returning();
  taskAId = taskA.id;
  taskA2Id = taskA2.id;
  taskA3Id = taskA3.id;
  taskBId = taskB.id;

  const [plan] = await db
    .insert(dailyPlans)
    .values({
      userId: USER_A_ID,
      planDate: getTodayDateString(),
    })
    .returning();
  await db.insert(dailyPlanItems).values([
    {
      dailyPlanId: plan.id,
      userId: USER_A_ID,
      taskId: taskAId,
      plannedDurationSeconds: 600,
      status: "planned",
    },
    {
      dailyPlanId: plan.id,
      userId: USER_A_ID,
      taskId: taskA2Id,
      plannedDurationSeconds: 3600,
      status: "planned",
    },
  ]);
}

beforeEach(async () => {
  await db.delete(timeSessions).where(inArray(timeSessions.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(taskHistory).where(inArray(taskHistory.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(dailyPlanItems).where(inArray(dailyPlanItems.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(dailyPlans).where(inArray(dailyPlans.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(tasks).where(inArray(tasks.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(projects).where(inArray(projects.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(disciplines).where(inArray(disciplines.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(user).where(inArray(user.id, [USER_A_ID, USER_B_ID]));
  await seedBase();
});

describe("TimeTrackingService Integration", () => {
  it("starts a timer and enforces a single active timer", async () => {
    const session = await TimeTrackingService.startTimer(USER_A_ID, { taskId: taskAId });
    expect(session.endTime).toBeNull();

    const active = await TimeTrackingService.getActiveTimer(USER_A_ID);
    expect(active?.taskId).toBe(taskAId);
    expect(active?.totalRecordedSeconds).toBe(0);

    await expect(
      TimeTrackingService.startTimer(USER_A_ID, { taskId: taskA2Id }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("stops the timer without completing the task", async () => {
    await TimeTrackingService.startTimer(USER_A_ID, { taskId: taskAId });
    const stopped = await TimeTrackingService.stopTimer(USER_A_ID);

    expect(stopped.endTime).not.toBeNull();
    expect(stopped.durationSeconds).toBeGreaterThanOrEqual(1);

    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskAId));
    expect(task.status).toBe("in_progress");
    expect(task.completedAt).toBeNull();

    expect(await TimeTrackingService.getActiveTimer(USER_A_ID)).toBeNull();
  });

  it("logs auditable manual sessions and aggregates totals", async () => {
    await TimeTrackingService.logManualSession(USER_A_ID, {
      taskId: taskAId,
      durationSeconds: 1200,
      notes: "Manual correction",
    });

    const totals = await TimeTrackingService.getTotalRecorded(USER_A_ID);
    expect(totals.totalDurationSeconds).toBe(1200);
    expect(totals.sessionCount).toBe(1);

    const sessions = await TimeTrackingService.listRecentSessions(USER_A_ID);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].isManualCorrection).toBe(true);
    expect(sessions[0].taskTitle).toBe("Timed Task A");
  });

  it("derives red ETA status when recorded time exceeds estimate", async () => {
    await TimeTrackingService.logManualSession(USER_A_ID, {
      taskId: taskAId,
      durationSeconds: 900,
    });

    const metrics = await TimeTrackingService.getTaskMetrics(USER_A_ID, taskAId);
    expect(metrics.estimatedDurationSeconds).toBe(600);
    expect(metrics.actualDurationSeconds).toBe(900);
    expect(metrics.etaStatus).toBe("red");
  });

  it("includes prior task time in the active timer aggregate", async () => {
    await TimeTrackingService.logManualSession(USER_A_ID, {
      taskId: taskAId,
      durationSeconds: 900,
    });
    await TimeTrackingService.startTimer(USER_A_ID, { taskId: taskAId });

    const active = await TimeTrackingService.getActiveTimer(USER_A_ID);
    expect(active?.totalRecordedSeconds).toBe(900);
  });

  it("only tracks tasks in today's active plan", async () => {
    await expect(
      TimeTrackingService.startTimer(USER_A_ID, { taskId: taskA3Id }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      TimeTrackingService.logManualSession(USER_A_ID, {
        taskId: taskA3Id,
        durationSeconds: 600,
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await db
      .update(tasks)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(tasks.id, taskAId));
    await expect(
      TimeTrackingService.startTimer(USER_A_ID, { taskId: taskAId }),
    ).rejects.toBeInstanceOf(ValidationError);

    await db
      .update(tasks)
      .set({ status: "todo", completedAt: null })
      .where(eq(tasks.id, taskAId));
    await db
      .update(dailyPlanItems)
      .set({ status: "deferred" })
      .where(
        and(
          eq(dailyPlanItems.userId, USER_A_ID),
          eq(dailyPlanItems.taskId, taskAId),
        ),
      );
    await expect(
      TimeTrackingService.startTimer(USER_A_ID, { taskId: taskAId }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("resets active-timer ETA to the current routine occurrence", async () => {
    const [taskProject] = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .where(eq(tasks.id, taskAId));
    const today = getTodayDateString();
    const day = new Date(`${today}T00:00:00.000Z`).getUTCDay();
    const weekday = day === 0 ? 7 : day;

    const routine = await RoutineService.create(USER_A_ID, {
      projectId: taskProject.projectId,
      title: "Current day routine",
      startDate: today,
      variants: [
        {
          weekday,
          title: "Routine reset task",
          plannedDurationSeconds: 2700,
        },
      ],
    });
    const [variant] = await db
      .select()
      .from(routineVariants)
      .where(eq(routineVariants.routineId, routine.id));

    await RoutineService.materializeForUser(USER_A_ID, new Date());
    await TimeTrackingService.startTimer(USER_A_ID, { taskId: variant.taskId });
    await TimeTrackingService.stopTimer(USER_A_ID);

    await db.insert(timeSessions).values({
      userId: USER_A_ID,
      taskId: variant.taskId,
      startTime: new Date(Date.now() - 3_600_000),
      endTime: new Date(Date.now() - 2_700_000),
      durationSeconds: 900,
    });

    await TimeTrackingService.startTimer(USER_A_ID, { taskId: variant.taskId });
    const active = await TimeTrackingService.getActiveTimer(USER_A_ID);
    expect(active?.estimatedDurationSeconds).toBe(2700);
    expect(active?.totalRecordedSeconds).toBeLessThan(5);
  });

  it("prevents cross-tenant timer control", async () => {
    await expect(
      TimeTrackingService.startTimer(USER_B_ID, { taskId: taskAId }),
    ).rejects.toBeInstanceOf(NotFoundError);

    await TimeTrackingService.startTimer(USER_A_ID, { taskId: taskAId });

    // User B has no active timer, so stopping must fail without touching A's session.
    await expect(TimeTrackingService.stopTimer(USER_B_ID)).rejects.toBeInstanceOf(
      NotFoundError,
    );

    const activeForA = await TimeTrackingService.getActiveTimer(USER_A_ID);
    expect(activeForA).not.toBeNull();
  });
});
