import { db } from "@/infrastructure/database";
import { projects } from "../projects/schema";
import { disciplines } from "../disciplines/schema";
import { tasks } from "../tasks/schema";
import { timeSessions } from "../time-tracking/schema";
import { eq, and, sum, inArray } from "drizzle-orm";

export class ReportingService {
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
    if (taskIds.length > 0) {
      const sessionResult = await db
        .select({
          total: sum(timeSessions.durationSeconds),
        })
        .from(timeSessions)
        .where(
          and(
            eq(timeSessions.userId, userId),
            inArray(timeSessions.taskId, taskIds),
          ),
        );
      totalDurationSeconds = Number(sessionResult[0]?.total ?? 0);
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
    };
  }
}
