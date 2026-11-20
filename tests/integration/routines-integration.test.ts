import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { disciplines } from "@/modules/disciplines/schema";
import { projects } from "@/modules/projects/schema";
import { tasks } from "@/modules/tasks/schema";
import { timeSessions } from "@/modules/time-tracking/schema";
import {
  routineOccurrences,
  routineVariants,
  routines,
} from "@/modules/routines/schema";
import { RoutineService } from "@/modules/routines/service";
import {
  dailyPlanItems,
  dailyPlans,
} from "@/modules/daily-planning/schema";
import { DailyPlanningService } from "@/modules/daily-planning/service";
import { ValidationError } from "@/shared/errors/domain-error";
import { ReportingService } from "@/modules/reporting/service";

const SUFFIX = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
const USER_ID = `routine-user-${SUFFIX}`;
const MONDAY = new Date("2026-11-16T12:00:00.000Z");
const TUESDAY = new Date("2026-11-17T12:00:00.000Z");

let projectId: string;

describe("weekday routine integration", () => {
  beforeAll(async () => {
    await db.insert(user).values({
      id: USER_ID,
      name: "Routine User",
      email: `routine-${SUFFIX}@telos.internal`,
      username: `routine_${SUFFIX}`,
    });
    const [discipline] = await db
      .insert(disciplines)
      .values({ userId: USER_ID, title: "Health" })
      .returning();
    const [project] = await db
      .insert(projects)
      .values({
        userId: USER_ID,
        disciplineId: discipline.id,
        title: "Exercise",
      })
      .returning();
    projectId = project.id;
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, USER_ID));
  });

  it("creates weekday variants, materializes once, and syncs completion", async () => {
    const routine = await RoutineService.create(USER_ID, {
      projectId,
      title: "Morning movement",
      startDate: "2026-11-16",
      variants: [
        {
          weekday: 1,
          title: "Push-ups",
          plannedDurationSeconds: 2700,
        },
        {
          weekday: 2,
          title: "Squats",
          plannedDurationSeconds: 2700,
        },
      ],
    });

    const variants = await db
      .select()
      .from(routineVariants)
      .where(eq(routineVariants.routineId, routine.id));
    expect(variants).toHaveLength(2);

    const routineTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, USER_ID),
          inArray(tasks.id, variants.map((variant) => variant.taskId)),
        ),
      );
    expect(routineTasks).toHaveLength(2);
    expect(routineTasks.every((task) => task.kind === "routine")).toBe(true);

    await expect(
      DailyPlanningService.addTaskToPlan(USER_ID, {
        date: "2026-11-16",
        taskId: routineTasks[0].id,
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await RoutineService.materializeForUser(USER_ID, MONDAY);
    await RoutineService.materializeForUser(USER_ID, MONDAY);

    const mondayPlan = await DailyPlanningService.getPlanWithItems(
      USER_ID,
      "2026-11-16",
    );
    expect(mondayPlan.items).toHaveLength(1);
    expect(mondayPlan.items[0].taskTitle).toBe("Push-ups");
    expect(mondayPlan.items[0].plannedDurationSeconds).toBe(2700);
    expect(mondayPlan.items[0].sourceType).toBe("routine");

    await DailyPlanningService.updatePlanItem(USER_ID, mondayPlan.items[0].id, {
      status: "completed",
    });
    const [mondayOccurrence] = await db
      .select()
      .from(routineOccurrences)
      .where(
        and(
          eq(routineOccurrences.userId, USER_ID),
          eq(routineOccurrences.localDate, "2026-11-16"),
        ),
      );
    expect(mondayOccurrence.status).toBe("completed");

    await RoutineService.materializeForUser(USER_ID, TUESDAY);
    const tuesdayPlan = await DailyPlanningService.getPlanWithItems(
      USER_ID,
      "2026-11-17",
    );
    expect(tuesdayPlan.items).toHaveLength(1);
    expect(tuesdayPlan.items[0].taskTitle).toBe("Squats");

    const occurrences = await db
      .select()
      .from(routineOccurrences)
      .where(eq(routineOccurrences.routineId, routine.id));
    expect(occurrences).toHaveLength(2);

    const monday = occurrences.find((occurrence) => occurrence.localDate === "2026-11-16")!;
    const tuesday = occurrences.find((occurrence) => occurrence.localDate === "2026-11-17")!;
    await db.insert(timeSessions).values([
      {
        userId: USER_ID,
        taskId: monday.taskId,
        routineOccurrenceId: monday.id,
        startTime: new Date("2026-11-16T08:00:00.000Z"),
        endTime: new Date("2026-11-16T08:30:00.000Z"),
        durationSeconds: 1800,
      },
      {
        userId: USER_ID,
        taskId: tuesday.taskId,
        routineOccurrenceId: tuesday.id,
        startTime: new Date("2026-11-17T08:00:00.000Z"),
        endTime: new Date("2026-11-17T08:10:00.000Z"),
        durationSeconds: 600,
      },
    ]);

    const report = await RoutineService.getReport(USER_ID, routine.id);
    expect(report).not.toBeNull();
    expect(report!.totals.totalActualSeconds).toBe(2400);
    expect(report!.totals.totalPlannedSeconds).toBe(5400);
    expect(report!.totals.completedCount).toBe(1);
    expect(report!.totals.missedCount).toBe(1);
    expect(report!.occurrences[0].localDate).toBe("2026-11-17");
    expect(report!.occurrences[0].actualDurationSeconds).toBe(600);
    expect(report!.occurrences[1].actualDurationSeconds).toBe(1800);

    const overview = await ReportingService.getOverviewReport(USER_ID);
    expect(overview.totals.taskCount).toBe(0);
    expect(overview.totals.trackedSeconds).toBe(2400);
    expect(overview.projectBreakdown[0].taskCount).toBe(0);
    expect(overview.projectBreakdown[0].trackedSeconds).toBe(2400);
  });

  it("pauses routines without creating future occurrences", async () => {
    const [routine] = await db
      .select()
      .from(routines)
      .where(eq(routines.userId, USER_ID));
    await RoutineService.updateStatus(USER_ID, routine.id, { status: "paused" });

    await RoutineService.materializeForUser(
      USER_ID,
      new Date("2026-11-18T12:00:00.000Z"),
    );
    const [wednesdayPlan] = await db
      .select()
      .from(dailyPlans)
      .where(
        and(
          eq(dailyPlans.userId, USER_ID),
          eq(dailyPlans.planDate, "2026-11-18"),
        ),
      );
    expect(wednesdayPlan).toBeUndefined();

    const planItems = await db
      .select()
      .from(dailyPlanItems)
      .where(eq(dailyPlanItems.userId, USER_ID));
    expect(planItems).toHaveLength(2);
  });
});
