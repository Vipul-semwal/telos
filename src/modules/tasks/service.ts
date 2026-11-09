import { db } from "@/infrastructure/database";
import { tasks, taskHistory } from "./schema";
import { projects } from "../projects/schema";
import { timeSessions } from "../time-tracking/schema";
import { eq, and, isNull, inArray, ilike, or, sql, desc, asc } from "drizzle-orm";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-error";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  TaskPriority,
} from "./validation";
import type { Task, TaskWithSubtasks } from "./domain/types";

export interface ListTasksFilter {
  projectId?: string;
  parentTaskId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

export class TasksService {
  /**
   * Create a task or subtask.
   * Invariants:
   * 1. Project must belong to the user.
   * 2. Strict hierarchy: Discipline -> Project -> Task -> Subtask.
   *    If parentTaskId is specified:
   *    - Parent must exist and belong to the same user and project.
   *    - Parent task must NOT itself be a subtask (parentTaskId must be null).
   * 3. Subtask cannot contain another subtask (max depth = 1).
   */
  static async create(userId: string, input: CreateTaskInput): Promise<Task> {
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

      // Invariant: Parent task cannot itself be a subtask
      if (parentTask.parentTaskId !== null) {
        throw new ValidationError(
          "Hierarchy violation: Subtasks cannot contain subtasks. Maximum depth is Task -> Subtask.",
        );
      }
    }

    // Calculate orderIndex if not provided
    let calculatedOrder = input.orderIndex;
    if (calculatedOrder === undefined) {
      const maxOrderRes = await db
        .select({
          maxOrder: sql<number>`COALESCE(MAX(${tasks.orderIndex}), -1)`,
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, userId),
            eq(tasks.projectId, input.projectId),
            input.parentTaskId
              ? eq(tasks.parentTaskId, input.parentTaskId)
              : isNull(tasks.parentTaskId),
          ),
        );
      calculatedOrder = (Number(maxOrderRes[0]?.maxOrder) ?? -1) + 1;
    }

    const dueDate = input.dueDate ? new Date(input.dueDate) : null;

    const [created] = await db
      .insert(tasks)
      .values({
        userId,
        projectId: input.projectId,
        parentTaskId: input.parentTaskId ?? null,
        title: input.title,
        description: input.description ?? null,
        estimatedDurationSeconds: input.estimatedDurationSeconds ?? 0,
        status: "todo",
        priority: input.priority ?? "medium",
        dueDate,
        notes: input.notes ?? null,
        orderIndex: calculatedOrder,
      })
      .returning();

    // Preserve lifecycle audit record in taskHistory
    await db.insert(taskHistory).values({
      userId,
      taskId: created.id,
      eventType: "created",
      eventData: JSON.stringify({
        title: created.title,
        estimatedDurationSeconds: created.estimatedDurationSeconds,
        priority: created.priority,
        isSubtask: Boolean(created.parentTaskId),
        parentTaskId: created.parentTaskId,
      }),
    });

    return created as Task;
  }

  /**
   * Get a task by ID, verifying user ownership.
   */
  static async getById(userId: string, id: string): Promise<Task> {
    const [found] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    if (!found) {
      throw new NotFoundError("Task", id);
    }
    return found as Task;
  }

  /**
   * Get a task with its parent, child subtasks, recorded duration, and history.
   */
  static async getByIdWithDetails(userId: string, id: string) {
    const task = await this.getById(userId, id);

    // If subtask, fetch parent
    let parentTask: Task | null = null;
    if (task.parentTaskId) {
      const [parent] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, task.parentTaskId), eq(tasks.userId, userId)));
      parentTask = (parent as Task) ?? null;
    }

    // Fetch child subtasks
    const subtasks = (await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.parentTaskId, id), eq(tasks.userId, userId)))
      .orderBy(asc(tasks.orderIndex), asc(tasks.createdAt))) as Task[];

    // Fetch recorded duration from time_sessions
    const durationResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${timeSessions.durationSeconds}), 0)`,
      })
      .from(timeSessions)
      .where(and(eq(timeSessions.taskId, id), eq(timeSessions.userId, userId)));
    const recordedDurationSeconds = Number(durationResult[0]?.total ?? 0);

    // Fetch history
    const history = await db
      .select()
      .from(taskHistory)
      .where(and(eq(taskHistory.taskId, id), eq(taskHistory.userId, userId)))
      .orderBy(desc(taskHistory.createdAt))
      .limit(20);

    const allSubtasksCompleted =
      subtasks.length > 0 && subtasks.every((st) => st.status === "completed" || st.status === "cancelled");

    return {
      task,
      parentTask,
      subtasks,
      recordedDurationSeconds,
      history,
      allSubtasksCompleted,
    };
  }

  /**
   * List tasks for a user with flexible filtering and sorting.
   */
  static async list(userId: string, filter: ListTasksFilter = {}): Promise<Task[]> {
    const conditions = [eq(tasks.userId, userId)];

    if (filter.projectId) {
      conditions.push(eq(tasks.projectId, filter.projectId));
    }

    if (filter.parentTaskId !== undefined) {
      if (filter.parentTaskId === null) {
        conditions.push(isNull(tasks.parentTaskId));
      } else {
        conditions.push(eq(tasks.parentTaskId, filter.parentTaskId));
      }
    }

    if (filter.status) {
      conditions.push(eq(tasks.status, filter.status));
    }

    if (filter.priority) {
      conditions.push(eq(tasks.priority, filter.priority));
    }

    if (filter.search && filter.search.trim().length > 0) {
      const pattern = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(tasks.title, pattern),
          ilike(tasks.description, pattern),
          ilike(tasks.notes, pattern),
        )!,
      );
    }

    const results = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(asc(tasks.orderIndex), asc(tasks.createdAt));

    return results as Task[];
  }

  /**
   * List root tasks for a project with their nested subtasks aggregated.
   */
  static async listWithSubtasks(
    userId: string,
    projectId: string,
    filter: { status?: TaskStatus; priority?: TaskPriority; search?: string } = {},
  ): Promise<TaskWithSubtasks[]> {
    // 1. Get root tasks matching filter
    const rootTasks = await this.list(userId, {
      projectId,
      parentTaskId: null,
      status: filter.status,
      priority: filter.priority,
      search: filter.search,
    });

    if (rootTasks.length === 0) {
      return [];
    }

    const rootTaskIds = rootTasks.map((t) => t.id);

    // 2. Fetch all subtasks for these root tasks
    const subtaskResults = (await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), inArray(tasks.parentTaskId, rootTaskIds)))
      .orderBy(asc(tasks.orderIndex), asc(tasks.createdAt))) as Task[];

    // 3. Map subtasks by parentTaskId
    const subtasksByParent = new Map<string, Task[]>();
    for (const st of subtaskResults) {
      if (st.parentTaskId) {
        const list = subtasksByParent.get(st.parentTaskId) ?? [];
        list.push(st);
        subtasksByParent.set(st.parentTaskId, list);
      }
    }

    return rootTasks.map((root) => {
      const childSubtasks = subtasksByParent.get(root.id) ?? [];
      const allSubtasksCompleted =
        childSubtasks.length > 0 &&
        childSubtasks.every((st) => st.status === "completed" || st.status === "cancelled");

      return {
        ...root,
        subtasks: childSubtasks,
        allSubtasksCompleted,
      };
    });
  }

  /**
   * Update task details or status.
   */
  static async update(userId: string, id: string, input: UpdateTaskInput): Promise<Task> {
    const existing = await this.getById(userId, id);

    let completedAt = existing.completedAt;
    if (input.status !== undefined) {
      if (input.status === "completed") {
        completedAt = new Date();
      } else {
        completedAt = null;
      }
    }

    const dueDate =
      input.dueDate !== undefined
        ? input.dueDate
          ? new Date(input.dueDate)
          : null
        : existing.dueDate;

    const [updated] = await db
      .update(tasks)
      .set({
        title: input.title ?? existing.title,
        description: input.description !== undefined ? input.description : existing.description,
        estimatedDurationSeconds:
          input.estimatedDurationSeconds !== undefined
            ? input.estimatedDurationSeconds
            : existing.estimatedDurationSeconds,
        status: input.status ?? existing.status,
        priority: input.priority ?? existing.priority,
        dueDate,
        notes: input.notes !== undefined ? input.notes : existing.notes,
        orderIndex: input.orderIndex !== undefined ? input.orderIndex : existing.orderIndex,
        completedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    // Log status or general update
    if (input.status && input.status !== existing.status) {
      await db.insert(taskHistory).values({
        userId,
        taskId: id,
        eventType: "status_changed",
        eventData: JSON.stringify({
          from: existing.status,
          to: input.status,
          isSubtask: Boolean(existing.parentTaskId),
        }),
      });
    } else {
      await db.insert(taskHistory).values({
        userId,
        taskId: id,
        eventType: "updated",
        eventData: JSON.stringify({
          updatedFields: Object.keys(input),
        }),
      });
    }

    return updated as Task;
  }

  /**
   * Status transition with rule enforcement:
   * Completing a subtask does NOT automatically complete the parent task.
   * If all subtasks are complete, returns indicator so UI can suggest completion.
   */
  static async transitionStatus(userId: string, id: string, newStatus: TaskStatus) {
    const updated = await this.update(userId, id, { status: newStatus });

    let parentSuggestion = false;
    let parentTask: Task | null = null;

    if (updated.parentTaskId) {
      parentTask = await this.getById(userId, updated.parentTaskId);
      const siblingSubtasks = await this.list(userId, {
        parentTaskId: updated.parentTaskId,
      });

      const allCompleted =
        siblingSubtasks.length > 0 &&
        siblingSubtasks.every((st) => st.status === "completed" || st.status === "cancelled");

      if (allCompleted && parentTask.status !== "completed") {
        parentSuggestion = true;
      }
    }

    return {
      task: updated,
      parentTask,
      suggestParentCompletion: parentSuggestion,
    };
  }

  /**
   * Delete a task with safe historical auditing.
   * Cascade-deletes subtasks at DB level; records event in taskHistory.
   */
  static async delete(userId: string, id: string): Promise<Task> {
    const existing = await this.getById(userId, id);

    // Record deletion event before deleting
    await db.insert(taskHistory).values({
      userId,
      taskId: id,
      eventType: "deleted",
      eventData: JSON.stringify({
        title: existing.title,
        status: existing.status,
        isSubtask: Boolean(existing.parentTaskId),
        parentTaskId: existing.parentTaskId,
      }),
    });

    await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    return existing;
  }

  /**
   * Batch reorder tasks within a project.
   */
  static async reorder(
    userId: string,
    projectId: string,
    items: { id: string; orderIndex: number }[],
  ): Promise<void> {
    // Verify project exists and belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(tasks)
          .set({ orderIndex: item.orderIndex, updatedAt: new Date() })
          .where(
            and(
              eq(tasks.id, item.id),
              eq(tasks.userId, userId),
              eq(tasks.projectId, projectId),
            ),
          );
      }
    });
  }
}
