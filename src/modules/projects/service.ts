import { db } from "@/infrastructure/database";
import { projects } from "./schema";
import { disciplines } from "../disciplines/schema";
import { tasks } from "../tasks/schema";
import { timeSessions } from "../time-tracking/schema";
import { eq, and, count, inArray, sum } from "drizzle-orm";
import { CapacityExceededError, NotFoundError, ValidationError } from "@/shared/errors/domain-error";
import type { CreateProjectInput, UpdateProjectInput, ProjectStatus } from "./validation";

export const MAX_ACTIVE_PROJECTS_PER_DISCIPLINE = 3;

export class ProjectsService {
  /**
   * Count ONLY active projects for a given discipline and user.
   * Paused, completed, and archived projects DO NOT consume capacity.
   */
  static async countActive(userId: string, disciplineId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(projects)
      .where(
        and(
          eq(projects.userId, userId),
          eq(projects.disciplineId, disciplineId),
          eq(projects.status, "active"),
        ),
      );
    return Number(result[0]?.count ?? 0);
  }

  /**
   * Create a project under a discipline.
   * Invariants:
   * 1. Every project must belong to exactly one discipline owned by the user.
   * 2. Maximum of 3 active projects per discipline.
   */
  static async create(userId: string, input: CreateProjectInput) {
    // 1. Verify parent discipline exists and belongs to the user
    const [discipline] = await db
      .select()
      .from(disciplines)
      .where(and(eq(disciplines.id, input.disciplineId), eq(disciplines.userId, userId)));

    if (!discipline) {
      throw new NotFoundError("Discipline", input.disciplineId);
    }

    const requestedStatus = input.initialStatus ?? "active";

    // 2. Enforce active capacity limit if creating as active
    if (requestedStatus === "active") {
      const activeCount = await this.countActive(userId, input.disciplineId);
      if (activeCount >= MAX_ACTIVE_PROJECTS_PER_DISCIPLINE) {
        throw new CapacityExceededError(
          `Project capacity reached: maximum of ${MAX_ACTIVE_PROJECTS_PER_DISCIPLINE} active projects allowed per discipline. Pause, complete, or archive an existing project first.`,
        );
      }
    }

    const [created] = await db
      .insert(projects)
      .values({
        userId,
        disciplineId: input.disciplineId,
        title: input.title,
        description: input.description,
        desiredOutcome: input.desiredOutcome,
        status: requestedStatus,
      })
      .returning();

    return created;
  }

  /**
   * List projects for a user, optionally filtered by discipline and status.
   */
  static async list(
    userId: string,
    disciplineId?: string,
    status?: ProjectStatus,
  ) {
    const conditions = [eq(projects.userId, userId)];
    if (disciplineId) {
      conditions.push(eq(projects.disciplineId, disciplineId));
    }
    if (status) {
      conditions.push(eq(projects.status, status));
    }

    return db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(projects.createdAt);
  }

  /**
   * Get a project by ID, verifying user ownership.
   */
  static async getById(userId: string, id: string) {
    const [found] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));

    if (!found) {
      throw new NotFoundError("Project", id);
    }
    return found;
  }

  /**
   * Get a project with related parent discipline and task statistics.
   */
  static async getByIdWithDetails(userId: string, id: string) {
    const project = await this.getById(userId, id);

    const [discipline] = await db
      .select({ title: disciplines.title })
      .from(disciplines)
      .where(and(eq(disciplines.id, project.disciplineId), eq(disciplines.userId, userId)));

    const projectTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        estimatedDurationSeconds: tasks.estimatedDurationSeconds,
        priority: tasks.priority,
        parentTaskId: tasks.parentTaskId,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .where(and(eq(tasks.projectId, id), eq(tasks.userId, userId)))
      .orderBy(tasks.createdAt);

    let totalDurationSeconds = 0;
    const taskIds = projectTasks.map((t) => t.id);
    if (taskIds.length > 0) {
      const sessionResult = await db
        .select({
          total: sum(timeSessions.durationSeconds),
        })
        .from(timeSessions)
        .where(and(eq(timeSessions.userId, userId), inArray(timeSessions.taskId, taskIds)));
      totalDurationSeconds = Number(sessionResult[0]?.total ?? 0);
    }

    return {
      ...project,
      disciplineTitle: discipline?.title ?? "Unknown Discipline",
      tasks: projectTasks,
      taskCount: projectTasks.length,
      completedTaskCount: projectTasks.filter((t) => t.status === "completed").length,
      totalDurationSeconds,
    };
  }

  /**
   * Update a project, verifying ownership and enforcing capacity limits if transitioning to active.
   */
  static async update(userId: string, id: string, input: UpdateProjectInput) {
    const existing = await this.getById(userId, id);

    // If reactivating from paused/completed/archived to active, enforce capacity
    if (input.status === "active" && existing.status !== "active") {
      const activeCount = await this.countActive(userId, existing.disciplineId);
      if (activeCount >= MAX_ACTIVE_PROJECTS_PER_DISCIPLINE) {
        throw new CapacityExceededError(
          `Cannot activate project: maximum of ${MAX_ACTIVE_PROJECTS_PER_DISCIPLINE} active projects allowed per discipline. Pause, complete, or archive an active project first.`,
        );
      }
    }

    const [updated] = await db
      .update(projects)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();

    return updated;
  }

  /**
   * Pause an active project (frees up active project quota).
   */
  static async pause(userId: string, id: string) {
    return this.update(userId, id, { status: "paused" });
  }

  /**
   * Complete a project (frees up active project quota, preserves records).
   */
  static async complete(userId: string, id: string) {
    return this.update(userId, id, { status: "completed" });
  }

  /**
   * Archive a project (frees up active project quota, preserves all tasks/history).
   */
  static async archive(userId: string, id: string) {
    return this.update(userId, id, { status: "archived" });
  }

  /**
   * Restore an archived or paused project.
   * If active capacity has space, restores to 'active'.
   * If active capacity is full, restores as 'paused'.
   */
  static async restore(userId: string, id: string, targetStatus: "active" | "paused" = "active") {
    const existing = await this.getById(userId, id);

    if (targetStatus === "active") {
      const activeCount = await this.countActive(userId, existing.disciplineId);
      if (activeCount >= MAX_ACTIVE_PROJECTS_PER_DISCIPLINE) {
        throw new CapacityExceededError(
          `Cannot restore project as active: maximum of ${MAX_ACTIVE_PROJECTS_PER_DISCIPLINE} active projects already in discipline. You may restore it as paused instead.`,
        );
      }
    }

    return this.update(userId, id, { status: targetStatus });
  }
}
