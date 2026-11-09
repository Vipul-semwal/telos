import { db } from "@/infrastructure/database";
import { projects } from "../projects/schema";
import { disciplines } from "../disciplines/schema";
import { tasks } from "../tasks/schema";
import { timeSessions } from "../time-tracking/schema";
import { eq, and, sum, count, inArray } from "drizzle-orm";
import { getTodayDateString } from "@/shared/utils/date";

export class ReportingService {
  /**
   * Derive the full operational report for a user.
   * All figures are computed on demand from tasks and immutable session records.
   */
  static async getOverviewReport(userId: string, days = 14) {
    const [userDisciplines, userProjects, userTasks, userSessions] = await Promise.all([
      db.select().from(disciplines).where(eq(disciplines.userId, userId)),
      db.select().from(projects).where(eq(projects.userId, userId)),
      db.select().from(tasks).where(eq(tasks.userId, userId)),
      db.select().from(timeSessions).where(eq(timeSessions.userId, userId)),
    ]);

    const secondsByTask = new Map<string, number>();
    let totalTrackedSeconds = 0;
    for (const session of userSessions) {
      totalTrackedSeconds += session.durationSeconds;
      secondsByTask.set(
        session.taskId,
        (secondsByTask.get(session.taskId) ?? 0) + session.durationSeconds,
      );
    }

    const completedTaskCount = userTasks.filter((t) => t.status === "completed").length;
    const openTaskCount = userTasks.filter(
      (t) => t.status !== "completed" && t.status !== "cancelled",
    ).length;

    const disciplineBreakdown = userDisciplines.map((d) => {
      const disciplineProjects = userProjects.filter((p) => p.disciplineId === d.id);
      const projectIds = new Set(disciplineProjects.map((p) => p.id));
      const disciplineTasks = userTasks.filter((t) => projectIds.has(t.projectId));
      const trackedSeconds = disciplineTasks.reduce(
        (acc, t) => acc + (secondsByTask.get(t.id) ?? 0),
        0,
      );

      return {
        id: d.id,
        title: d.title,
        status: d.status,
        projectCount: disciplineProjects.length,
        activeProjectCount: disciplineProjects.filter((p) => p.status === "active").length,
        taskCount: disciplineTasks.length,
        completedTaskCount: disciplineTasks.filter((t) => t.status === "completed").length,
        trackedSeconds,
      };
    });

    const projectBreakdown = userProjects
      .map((p) => {
        const projectTasks = userTasks.filter((t) => t.projectId === p.id);
        const trackedSeconds = projectTasks.reduce(
          (acc, t) => acc + (secondsByTask.get(t.id) ?? 0),
          0,
        );
        const estimatedSeconds = projectTasks.reduce(
          (acc, t) => acc + t.estimatedDurationSeconds,
          0,
        );

        return {
          id: p.id,
          title: p.title,
          status: p.status,
          disciplineTitle: disciplineBreakdown.find((d) => d.id === p.disciplineId)?.title ?? "—",
          taskCount: projectTasks.length,
          completedTaskCount: projectTasks.filter((t) => t.status === "completed").length,
          trackedSeconds,
          estimatedSeconds,
        };
      })
      .sort((a, b) => b.trackedSeconds - a.trackedSeconds);

    const dailyMap = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyMap.set(getTodayDateString(d), 0);
    }
    for (const session of userSessions) {
      const key = getTodayDateString(new Date(session.startTime));
      if (dailyMap.has(key)) {
        dailyMap.set(key, (dailyMap.get(key) ?? 0) + session.durationSeconds);
      }
    }
    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, trackedSeconds]) => ({
      date,
      trackedSeconds,
    }));

    const overtimeTaskCount = userTasks.filter((t) => {
      if (t.estimatedDurationSeconds <= 0) return false;
      return (secondsByTask.get(t.id) ?? 0) > t.estimatedDurationSeconds;
    }).length;

    return {
      totals: {
        trackedSeconds: totalTrackedSeconds,
        sessionCount: userSessions.length,
        taskCount: userTasks.length,
        completedTaskCount,
        openTaskCount,
        overtimeTaskCount,
        disciplineCount: userDisciplines.length,
        projectCount: userProjects.length,
      },
      disciplineBreakdown,
      projectBreakdown,
      dailyBreakdown,
    };
  }


  /**
   * Derive project time metrics by aggregating from underlying tasks.
   * Project time is derived from task sessions; no independent project timers exist.
   */
  static async getProjectReport(userId: string, projectId: string) {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    if (!project) return null;

    const projectTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        estimatedDurationSeconds: tasks.estimatedDurationSeconds,
      })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.userId, userId)));

    const taskIds = projectTasks.map((t) => t.id);

    let totalDurationSeconds = 0;
    let sessionCount = 0;
    if (taskIds.length > 0) {
      const sessionResult = await db
        .select({
          total: sum(timeSessions.durationSeconds),
          sessionCount: count(),
        })
        .from(timeSessions)
        .where(
          and(
            eq(timeSessions.userId, userId),
            inArray(timeSessions.taskId, taskIds),
          ),
        );
      totalDurationSeconds = Number(sessionResult[0]?.total ?? 0);
      sessionCount = Number(sessionResult[0]?.sessionCount ?? 0);
    }

    const totalEstimatedSeconds = projectTasks.reduce((acc, t) => acc + t.estimatedDurationSeconds, 0);

    return {
      projectId: project.id,
      title: project.title,
      status: project.status,
      taskCount: projectTasks.length,
      completedTaskCount: projectTasks.filter((t) => t.status === "completed").length,
      totalDurationSeconds,
      totalEstimatedSeconds,
      varianceSeconds: totalDurationSeconds - totalEstimatedSeconds,
      sessionCount,
    };
  }
}
