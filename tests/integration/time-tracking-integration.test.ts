import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { disciplines } from "@/modules/disciplines/schema";
import { projects } from "@/modules/projects/schema";
import { tasks, taskHistory } from "@/modules/tasks/schema";
import { timeSessions } from "@/modules/time-tracking/schema";
import { TimeTrackingService } from "@/modules/time-tracking/service";
import { ConflictError, NotFoundError } from "@/shared/errors/domain-error";
import { inArray, eq } from "drizzle-orm";

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const USER_A_ID = `tt-int-a-${SUFFIX}`;
const USER_B_ID = `tt-int-b-${SUFFIX}`;

let taskAId: string;
let taskA2Id: string;
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
  const [taskB] = await db
    .insert(tasks)
    .values({ userId: USER_B_ID, projectId: projB.id, title: "Timed Task B" })
    .returning();
  taskAId = taskA.id;
  taskA2Id = taskA2.id;
  taskBId = taskB.id;
}

beforeEach(async () => {
  await db.delete(timeSessions).where(inArray(timeSessions.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(taskHistory).where(inArray(taskHistory.userId, [USER_A_ID, USER_B_ID]));
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
