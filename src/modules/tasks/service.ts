import { db } from "@/infrastructure/database";
import { tasks, taskHistory } from "./schema";
import { projects } from "../projects/schema";
import { eq, and } from "drizzle-orm";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-error";
import type { CreateTaskInput, UpdateTaskInput } from "./validation";

export class TasksService {
  /**
   * Create a task or subtask.
   * Enforces rules:
   * 1. Project must belong to the user.
   * 2. Hierarchy rule: Discipline -> Project -> Task -> Subtask.
   *    If parentTaskId is specified, parent must exist, belong to same user & project,
   *    and must NOT itself have a parentTaskId (preventing nested subtasks).
   */
  static async create(userId: string, input: CreateTaskInput) {
    // 1. Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, input.projectId), eq(projects.userId, userId)));

    if (!project) {
      throw new NotFoundError("Project", input.projectId);
    }

    // 2. Verify subtask hierarchy
    if (input.parentTaskId) {
      const [parentTask] = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.id, input.parentTaskId),
            eq(tasks.userId, userId),
            eq(tasks.projectId, input.projectId),
          ),
        );

      if (!parentTask) {
        throw new NotFoundError("Parent Task", input.parentTaskId);
      }

      // Hierarchy constraint: parent task cannot itself be a subtask
      if (parentTask.parentTaskId !== null) {
        throw new ValidationError(
          "Hierarchy violation: Subtasks cannot be nested further. Only Discipline -> Project -> Task -> Subtask is permitted.",
        );
      }
    }

    const [created] = await db
      .insert(tasks)
      .values({
        userId,
        projectId: input.projectId,
        parentTaskId: input.parentTaskId ?? null,
        title: input.title,
        description: input.description,
        estimatedDurationSeconds: input.estimatedDurationSeconds,
        priority: input.priority,
        status: "todo",
      })
      .returning();

    // Preserve lifecycle in taskHistory
    await db.insert(taskHistory).values({
      userId,
      taskId: created.id,
      eventType: "created",
      eventData: JSON.stringify({
        title: created.title,
        estimatedDurationSeconds: created.estimatedDurationSeconds,
        isSubtask: Boolean(created.parentTaskId),
      }),
    });

    return created;
  }

  /**
   * List tasks for a user, optionally filtered by project or parentTaskId.
   */
  static async list(userId: string, projectId?: string, parentTaskId?: string | null) {
    const conditions = [eq(tasks.userId, userId)];
    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }
    if (parentTaskId !== undefined) {
      if (parentTaskId === null) {
        // Only root tasks (not subtasks)
        conditions.push(eq(tasks.parentTaskId, null as unknown as string));
      } else {
        conditions.push(eq(tasks.parentTaskId, parentTaskId));
      }
    }

    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(tasks.createdAt);
  }

  /**
   * Get a task by ID, verifying user ownership.
   */
  static async getById(userId: string, id: string) {
    const [found] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    if (!found) {
      throw new NotFoundError("Task", id);
    }
    return found;
  }

  /**
   * Update task details or status.
   */
  static async update(userId: string, id: string, input: UpdateTaskInput) {
    const existing = await this.getById(userId, id);

    const completedAt =
      input.status === "completed"
        ? new Date()
        : input.status
          ? null
          : existing.completedAt;

    const [updated] = await db
      .update(tasks)
      .set({
        ...input,
        completedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    // Log status or duration change
    if (input.status && input.status !== existing.status) {
      await db.insert(taskHistory).values({
        userId,
        taskId: id,
        eventType: "status_changed",
        eventData: JSON.stringify({ from: existing.status, to: input.status }),
      });
    }

    return updated;
  }
}
