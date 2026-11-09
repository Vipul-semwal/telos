import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { disciplines } from "@/modules/disciplines/schema";
import { projects } from "@/modules/projects/schema";
import { tasks } from "@/modules/tasks/schema";
import { dailyPlans, dailyPlanItems } from "@/modules/daily-planning/schema";
import { DailyPlanningService } from "@/modules/daily-planning/service";
import { CapacityExceededError, ConflictError, NotFoundError } from "@/shared/errors/domain-error";
import { MAX_DAILY_PLANNED_SECONDS } from "@/shared/utils/duration";
import { getTodayDateString } from "@/shared/utils/date";
import { inArray } from "drizzle-orm";

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const USER_A_ID = `dp-int-a-${SUFFIX}`;
const USER_B_ID = `dp-int-b-${SUFFIX}`;
const DATE = getTodayDateString();

let projectAId: string;
let taskAId: string;
let taskA2Id: string;
let taskBId: string;

async function seedBase() {
  await db
    .insert(user)
    .values([
      {
        id: USER_A_ID,
        name: "Plan A",
        email: `dp-a-${SUFFIX}@test.com`,
        emailVerified: false,
        username: `dp_a_${SUFFIX}`,
      },
      {
        id: USER_B_ID,
        name: "Plan B",
        email: `dp-b-${SUFFIX}@test.com`,
        emailVerified: false,
        username: `dp_b_${SUFFIX}`,
      },
    ])
    .onConflictDoNothing();

  const [discA] = await db
    .insert(disciplines)
    .values({ userId: USER_A_ID, title: "Plan Discipline A", status: "active" })
    .returning();
  const [discB] = await db
    .insert(disciplines)
    .values({ userId: USER_B_ID, title: "Plan Discipline B", status: "active" })
    .returning();

  const [projA] = await db
    .insert(projects)
    .values({ userId: USER_A_ID, disciplineId: discA.id, title: "Plan Project A" })
    .returning();
  const [projB] = await db
    .insert(projects)
    .values({ userId: USER_B_ID, disciplineId: discB.id, title: "Plan Project B" })
    .returning();
  projectAId = projA.id;

  const [taskA] = await db
    .insert(tasks)
    .values({
      userId: USER_A_ID,
      projectId: projectAId,
      title: "Plan Task A",
      estimatedDurationSeconds: 1800,
    })
    .returning();
  const [taskA2] = await db
    .insert(tasks)
    .values({
      userId: USER_A_ID,
      projectId: projectAId,
      title: "Plan Task A2",
      estimatedDurationSeconds: 3600,
    })
    .returning();
  const [taskB] = await db
    .insert(tasks)
    .values({ userId: USER_B_ID, projectId: projB.id, title: "Plan Task B" })
    .returning();
  taskAId = taskA.id;
  taskA2Id = taskA2.id;
  taskBId = taskB.id;
}

beforeEach(async () => {
  await db.delete(dailyPlanItems).where(inArray(dailyPlanItems.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(dailyPlans).where(inArray(dailyPlans.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(tasks).where(inArray(tasks.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(projects).where(inArray(projects.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(disciplines).where(inArray(disciplines.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(user).where(inArray(user.id, [USER_A_ID, USER_B_ID]));
  await seedBase();
});

describe("DailyPlanningService Integration", () => {
  it("adds tasks and computes allocated/remaining capacity", async () => {
    await DailyPlanningService.addTaskToPlan(USER_A_ID, {
      date: DATE,
      taskId: taskAId,
      plannedDurationSeconds: 1800,
    });

    const plan = await DailyPlanningService.getPlanWithItems(USER_A_ID, DATE);
    expect(plan.items).toHaveLength(1);
    expect(plan.capacity.allocatedSeconds).toBe(1800);
    expect(plan.capacity.remainingSeconds).toBe(MAX_DAILY_PLANNED_SECONDS - 1800);
    expect(plan.capacity.isCapacityReached).toBe(false);
  });

  it("rejects duplicates and capacity overruns", async () => {
    await DailyPlanningService.addTaskToPlan(USER_A_ID, {
      date: DATE,
      taskId: taskAId,
      plannedDurationSeconds: MAX_DAILY_PLANNED_SECONDS - 3600,
    });

    // Duplicate
    await expect(
      DailyPlanningService.addTaskToPlan(USER_A_ID, {
        date: DATE,
        taskId: taskAId,
        plannedDurationSeconds: 600,
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    // Over capacity
    await expect(
      DailyPlanningService.addTaskToPlan(USER_A_ID, {
        date: DATE,
        taskId: taskA2Id,
        plannedDurationSeconds: 7200,
      }),
    ).rejects.toBeInstanceOf(CapacityExceededError);
  });

  it("allows exactly the 4-hour capacity boundary", async () => {
    await DailyPlanningService.addTaskToPlan(USER_A_ID, {
      date: DATE,
      taskId: taskAId,
      plannedDurationSeconds: 7200,
    });
    await DailyPlanningService.addTaskToPlan(USER_A_ID, {
      date: DATE,
      taskId: taskA2Id,
      plannedDurationSeconds: 7200,
    });

    const plan = await DailyPlanningService.getPlanWithItems(USER_A_ID, DATE);
    expect(plan.capacity.allocatedSeconds).toBe(MAX_DAILY_PLANNED_SECONDS);
    expect(plan.capacity.isCapacityReached).toBe(true);
  });

  it("updates item status and validates duration increases against capacity", async () => {
    const item = await DailyPlanningService.addTaskToPlan(USER_A_ID, {
      date: DATE,
      taskId: taskAId,
      plannedDurationSeconds: 3600,
    });

    const updated = await DailyPlanningService.updatePlanItem(USER_A_ID, item.id, {
      status: "in_progress",
    });
    expect(updated.status).toBe("in_progress");

    await expect(
      DailyPlanningService.updatePlanItem(USER_A_ID, item.id, {
        plannedDurationSeconds: MAX_DAILY_PLANNED_SECONDS + 1,
      }),
    ).rejects.toBeInstanceOf(CapacityExceededError);
  });

  it("removes an item and frees capacity", async () => {
    const item = await DailyPlanningService.addTaskToPlan(USER_A_ID, {
      date: DATE,
      taskId: taskAId,
      plannedDurationSeconds: 1800,
    });

    await DailyPlanningService.removePlanItem(USER_A_ID, item.id);

    const plan = await DailyPlanningService.getPlanWithItems(USER_A_ID, DATE);
    expect(plan.items).toHaveLength(0);
    expect(plan.capacity.allocatedSeconds).toBe(0);
  });

  it("blocks cross-tenant task references and mutations", async () => {
    await expect(
      DailyPlanningService.addTaskToPlan(USER_A_ID, {
        date: DATE,
        taskId: taskBId,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const item = await DailyPlanningService.addTaskToPlan(USER_A_ID, {
      date: DATE,
      taskId: taskAId,
    });

    await expect(
      DailyPlanningService.updatePlanItem(USER_B_ID, item.id, { status: "completed" }),
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      DailyPlanningService.removePlanItem(USER_B_ID, item.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
