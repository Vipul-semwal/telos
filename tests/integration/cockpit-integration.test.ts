import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { DisciplinesService } from "@/modules/disciplines/service";
import { ProjectsService } from "@/modules/projects/service";
import { TasksService } from "@/modules/tasks/service";
import { DailyPlanningService } from "@/modules/daily-planning/service";
import { TimeTrackingService } from "@/modules/time-tracking/service";
import { CockpitService } from "@/modules/cockpit/service";
import { getTodayDateString } from "@/shared/utils/date";

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const USER_ID = `cockpit-int-${SUFFIX}`;

async function seedUser() {
  await db.insert(user).values({
    id: USER_ID,
    name: "Cockpit Audit",
    email: `cockpit-${SUFFIX}@telos.internal`,
    username: `cockpit_${SUFFIX}`,
  });
}

describe("Cockpit next-action integration", () => {
  beforeEach(async () => {
    await db.delete(user).where(eq(user.id, USER_ID));
    await seedUser();
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, USER_ID));
  });

  it("starts a new operator at discipline creation", async () => {
    const overview = await CockpitService.getOverview(USER_ID);
    expect(overview.nextAction.kind).toBe("discipline");
    expect(overview.nextAction.href).toBe("/disciplines");
  });

  it("connects plan and active timer state into the next action", async () => {
    const discipline = await DisciplinesService.create(USER_ID, { title: "Cockpit pursuit" });
    const project = await ProjectsService.create(USER_ID, {
      disciplineId: discipline.id,
      title: "Cockpit project",
      initialStatus: "active",
    });
    const task = await TasksService.create(USER_ID, {
      projectId: project.id,
      title: "Cockpit task",
      priority: "high",
    });

    let overview = await CockpitService.getOverview(USER_ID);
    expect(overview.nextAction.kind).toBe("task");

    await DailyPlanningService.addTaskToPlan(USER_ID, {
      date: getTodayDateString(),
      taskId: task.id,
      plannedDurationSeconds: 1800,
    });
    overview = await CockpitService.getOverview(USER_ID);
    expect(overview.nextAction.kind).toBe("plan");

    await TimeTrackingService.startTimer(USER_ID, { taskId: task.id });
    overview = await CockpitService.getOverview(USER_ID);
    expect(overview.nextAction.kind).toBe("timer");
    expect(overview.nextAction.title).toContain("Cockpit task");
  });
});
