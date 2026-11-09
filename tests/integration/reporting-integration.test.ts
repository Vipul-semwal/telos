import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/infrastructure/database";
import { user } from "@/modules/auth/schema";
import { disciplines } from "@/modules/disciplines/schema";
import { projects } from "@/modules/projects/schema";
import { tasks } from "@/modules/tasks/schema";
import { timeSessions } from "@/modules/time-tracking/schema";
import { ReportingService } from "@/modules/reporting/service";
import { getTodayDateString } from "@/shared/utils/date";
import { inArray } from "drizzle-orm";

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const USER_A_ID = `rp-int-a-${SUFFIX}`;
const USER_B_ID = `rp-int-b-${SUFFIX}`;
let reportProjectId: string;

async function seedBase() {
  await db
    .insert(user)
    .values([
      {
        id: USER_A_ID,
        name: "Report A",
        email: `rp-a-${SUFFIX}@test.com`,
        emailVerified: false,
        username: `rp_a_${SUFFIX}`,
      },
      {
        id: USER_B_ID,
        name: "Report B",
        email: `rp-b-${SUFFIX}@test.com`,
        emailVerified: false,
        username: `rp_b_${SUFFIX}`,
      },
    ])
    .onConflictDoNothing();

  const [disc] = await db
    .insert(disciplines)
    .values({ userId: USER_A_ID, title: "Report Discipline", status: "active" })
    .returning();
  const [proj] = await db
    .insert(projects)
    .values({
      userId: USER_A_ID,
      disciplineId: disc.id,
      title: "Report Project",
      status: "active",
    })
    .returning();
  reportProjectId = proj.id;

  const [task1] = await db
    .insert(tasks)
    .values({
      userId: USER_A_ID,
      projectId: proj.id,
      title: "Report Task 1",
      status: "completed",
      estimatedDurationSeconds: 1800,
    })
    .returning();
  const [task2] = await db
    .insert(tasks)
    .values({
      userId: USER_A_ID,
      projectId: proj.id,
      title: "Report Task 2",
      status: "in_progress",
      estimatedDurationSeconds: 3600,
    })
    .returning();

  const now = new Date();
  await db.insert(timeSessions).values([
    {
      userId: USER_A_ID,
      taskId: task1.id,
      startTime: now,
      endTime: now,
      durationSeconds: 3600,
    },
    {
      userId: USER_A_ID,
      taskId: task2.id,
      startTime: now,
      endTime: now,
      durationSeconds: 1800,
    },
  ]);
}

beforeEach(async () => {
  await db.delete(timeSessions).where(inArray(timeSessions.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(tasks).where(inArray(tasks.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(projects).where(inArray(projects.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(disciplines).where(inArray(disciplines.userId, [USER_A_ID, USER_B_ID]));
  await db.delete(user).where(inArray(user.id, [USER_A_ID, USER_B_ID]));
  await seedBase();
});

describe("ReportingService Integration", () => {
  it("derives totals from underlying sessions and tasks", async () => {
    const report = await ReportingService.getOverviewReport(USER_A_ID);

    expect(report.totals.trackedSeconds).toBe(5400);
    expect(report.totals.sessionCount).toBe(2);
    expect(report.totals.taskCount).toBe(2);
    expect(report.totals.completedTaskCount).toBe(1);
    expect(report.totals.openTaskCount).toBe(1);
    expect(report.totals.overtimeTaskCount).toBe(1);
    expect(report.totals.disciplineCount).toBe(1);
    expect(report.totals.projectCount).toBe(1);
  });

  it("aggregates time upward into project and discipline breakdowns", async () => {
    const report = await ReportingService.getOverviewReport(USER_A_ID);

    expect(report.projectBreakdown).toHaveLength(1);
    expect(report.projectBreakdown[0].trackedSeconds).toBe(5400);
    expect(report.projectBreakdown[0].completedTaskCount).toBe(1);
    expect(report.projectBreakdown[0].disciplineTitle).toBe("Report Discipline");

    expect(report.disciplineBreakdown).toHaveLength(1);
    expect(report.disciplineBreakdown[0].trackedSeconds).toBe(5400);
    expect(report.disciplineBreakdown[0].activeProjectCount).toBe(1);
    expect(report.disciplineBreakdown[0].taskCount).toBe(2);
  });

  it("records today's tracked seconds in the daily breakdown", async () => {
    const report = await ReportingService.getOverviewReport(USER_A_ID);
    const today = getTodayDateString();
    const todayEntry = report.dailyBreakdown.find((d) => d.date === today);

    expect(todayEntry?.trackedSeconds).toBe(5400);
    expect(report.dailyBreakdown).toHaveLength(14);
  });

  it("derives a project report from task sessions and estimates", async () => {
    const projectReport = await ReportingService.getProjectReport(
      USER_A_ID,
      reportProjectId,
    );

    expect(projectReport).not.toBeNull();
    expect(projectReport?.taskCount).toBe(2);
    expect(projectReport?.completedTaskCount).toBe(1);
    expect(projectReport?.sessionCount).toBe(2);
    expect(projectReport?.totalDurationSeconds).toBe(5400);
    expect(projectReport?.totalEstimatedSeconds).toBe(5400);
    expect(projectReport?.varianceSeconds).toBe(0);
  });

  it("isolates reports by user", async () => {
    const report = await ReportingService.getOverviewReport(USER_B_ID);
    expect(report.totals.trackedSeconds).toBe(0);
    expect(report.totals.taskCount).toBe(0);
    expect(report.disciplineBreakdown).toHaveLength(0);
    expect(report.projectBreakdown).toHaveLength(0);
  });
});
