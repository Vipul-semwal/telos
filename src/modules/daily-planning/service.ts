import { db } from "@/infrastructure/database";
import { dailyPlans, dailyPlanItems } from "./schema";
import { tasks } from "../tasks/schema";
import { projects } from "../projects/schema";
import { eq, and, sql, ne, isNull } from "drizzle-orm";
import {
  CapacityExceededError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from "@/shared/errors/domain-error";
import { MAX_DAILY_PLANNED_SECONDS } from "@/shared/utils/duration";
import type { AddTaskToPlanInput, UpdatePlanItemInput } from "./validation";

export class DailyPlanningService {
  /**
   * Get or create a daily plan record for a given date.
   */
  static async getOrCreatePlan(userId: string, date: string) {
    const [existing] = await db
      .select()
      .from(dailyPlans)
      .where(and(eq(dailyPlans.userId, userId), eq(dailyPlans.planDate, date)));

    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(dailyPlans)
      .values({
        userId,
        planDate: date,
      })
      .onConflictDoNothing()
      .returning();

    if (created) {
      return created;
    }

    // Fallback if concurrent insert
    const [fetched] = await db
      .select()
      .from(dailyPlans)
      .where(and(eq(dailyPlans.userId, userId), eq(dailyPlans.planDate, date)));
    return fetched;
  }

  /**
   * Get the daily plan with all items, calculating allocated and remaining capacity.
   */
  static async getPlanWithItems(userId: string, date: string) {
    const plan = await this.getOrCreatePlan(userId, date);

    const items = await db
      .select({
        id: dailyPlanItems.id,
        dailyPlanId: dailyPlanItems.dailyPlanId,
        taskId: dailyPlanItems.taskId,
        taskTitle: tasks.title,
        taskDescription: tasks.description,
        taskStatus: tasks.status,
        taskEstimatedSeconds: tasks.estimatedDurationSeconds,
        projectId: projects.id,
        projectTitle: projects.title,
        plannedDurationSeconds: dailyPlanItems.plannedDurationSeconds,
        status: dailyPlanItems.status,
        sortOrder: dailyPlanItems.sortOrder,
        createdAt: dailyPlanItems.createdAt,
      })
      .from(dailyPlanItems)
      .innerJoin(tasks, eq(dailyPlanItems.taskId, tasks.id))
      .innerJoin(
        projects,
        and(eq(tasks.projectId, projects.id), eq(projects.userId, userId)),
      )
      .where(and(eq(dailyPlanItems.dailyPlanId, plan.id), eq(dailyPlanItems.userId, userId)))
      .orderBy(dailyPlanItems.sortOrder, dailyPlanItems.createdAt);

    const allocatedSeconds = items.reduce((sum, item) => sum + item.plannedDurationSeconds, 0);
    const remainingSeconds = Math.max(0, MAX_DAILY_PLANNED_SECONDS - allocatedSeconds);

    return {
      plan,
      items,
      capacity: {
        maxSeconds: MAX_DAILY_PLANNED_SECONDS,
        allocatedSeconds,
        remainingSeconds,
        isCapacityReached: allocatedSeconds >= MAX_DAILY_PLANNED_SECONDS,
      },
    };
  }

  /**
   * List tasks eligible to be added to a specific daily plan.
   * Completed and cancelled tasks, tasks already planned for the day,
   * and tasks from inactive projects are excluded server-side.
   */
  static async listEligibleTasks(userId: string, date: string) {
    const plan = await this.getOrCreatePlan(userId, date);

    return db
      .select({
        id: tasks.id,
        title: tasks.title,
        projectId: projects.id,
        projectTitle: projects.title,
        parentTaskId: tasks.parentTaskId,
        priority: tasks.priority,
        status: tasks.status,
        estimatedDurationSeconds: tasks.estimatedDurationSeconds,
        orderIndex: tasks.orderIndex,
      })
      .from(tasks)
      .innerJoin(
        projects,
        and(eq(tasks.projectId, projects.id), eq(projects.userId, userId)),
      )
      .leftJoin(
        dailyPlanItems,
        and(
          eq(dailyPlanItems.taskId, tasks.id),
          eq(dailyPlanItems.dailyPlanId, plan.id),
          eq(dailyPlanItems.userId, userId),
        ),
      )
      .where(
        and(
          eq(tasks.userId, userId),
          eq(projects.status, "active"),
          ne(tasks.status, "completed"),
          ne(tasks.status, "cancelled"),
          isNull(dailyPlanItems.id),
        ),
      )
      .orderBy(
        projects.title,
        sql`CASE WHEN ${tasks.parentTaskId} IS NULL THEN 0 ELSE 1 END`,
        tasks.orderIndex,
        tasks.createdAt,
      );
  }

  /**
   * Add a task to the daily plan.
   * Enforces rules:
   * 1. Task must belong to the user.
   * 2. Total planned duration cannot exceed 4 hours (14,400 seconds).
   * 3. Task cannot already exist in the same day's plan.
   */
  static async addTaskToPlan(userId: string, input: AddTaskToPlanInput) {
    // 1. Verify task ownership
    const [task] = await db
      .select({
        task: tasks,
        projectStatus: projects.status,
      })
      .from(tasks)
      .innerJoin(
        projects,
        and(eq(tasks.projectId, projects.id), eq(projects.userId, userId)),
      )
      .where(and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)));

    if (!task) {
      throw new NotFoundError("Task", input.taskId);
    }
    if (task.task.status === "completed" || task.task.status === "cancelled") {
      throw new ValidationError("Completed or cancelled tasks cannot be added to a daily plan.");
    }
    if (task.projectStatus !== "active") {
      throw new ValidationError("Tasks from paused, completed, or archived projects cannot be planned.");
    }

    const plan = await this.getOrCreatePlan(userId, input.date);

    // 2. Check for duplicate
    const [existingItem] = await db
      .select()
      .from(dailyPlanItems)
      .where(and(eq(dailyPlanItems.dailyPlanId, plan.id), eq(dailyPlanItems.taskId, input.taskId)));

    if (existingItem) {
      throw new ConflictError("Task is already included in today's daily plan");
    }

    // 3. Determine planned duration
    const plannedSeconds =
      input.plannedDurationSeconds ??
      (task.task.estimatedDurationSeconds > 0 ? task.task.estimatedDurationSeconds : 1800);

    // 4. Check daily capacity constraint (max 4 hours = 14,400 seconds)
    const currentItems = await db
      .select({ plannedDurationSeconds: dailyPlanItems.plannedDurationSeconds })
      .from(dailyPlanItems)
      .where(and(eq(dailyPlanItems.dailyPlanId, plan.id), eq(dailyPlanItems.userId, userId)));

    const currentAllocated = currentItems.reduce((acc, curr) => acc + curr.plannedDurationSeconds, 0);

    if (currentAllocated + plannedSeconds > MAX_DAILY_PLANNED_SECONDS) {
      const remaining = Math.max(0, MAX_DAILY_PLANNED_SECONDS - currentAllocated);
      throw new CapacityExceededError(
        `Daily planning capacity exceeded: remaining capacity is ${remaining}s, but task requires ${plannedSeconds}s. Maximum daily planned work is 4 hours (14,400 seconds).`,
      );
    }

    const [created] = await db
      .insert(dailyPlanItems)
      .values({
        dailyPlanId: plan.id,
        userId,
        taskId: input.taskId,
        plannedDurationSeconds: plannedSeconds,
        status: "planned",
        sortOrder: currentItems.length,
      })
      .returning();

    return created;
  }

  /**
   * Update a daily plan item (planned duration, status, or sort order).
   * If the planned duration increases, the 4-hour daily capacity is re-validated.
   */
  static async updatePlanItem(userId: string, itemId: string, input: UpdatePlanItemInput) {
    const [existing] = await db
      .select()
      .from(dailyPlanItems)
      .where(and(eq(dailyPlanItems.id, itemId), eq(dailyPlanItems.userId, userId)));

    if (!existing) {
      throw new NotFoundError("Daily plan item", itemId);
    }

    if (input.plannedDurationSeconds !== undefined) {
      const planItems = await db
        .select({ plannedDurationSeconds: dailyPlanItems.plannedDurationSeconds })
        .from(dailyPlanItems)
        .where(
          and(
            eq(dailyPlanItems.dailyPlanId, existing.dailyPlanId),
            eq(dailyPlanItems.userId, userId),
          ),
        );

      const allocated = planItems.reduce((acc, curr) => acc + curr.plannedDurationSeconds, 0);
      const projected = allocated - existing.plannedDurationSeconds + input.plannedDurationSeconds;

      if (projected > MAX_DAILY_PLANNED_SECONDS) {
        throw new CapacityExceededError(
          `Daily planning capacity exceeded: maximum daily planned work is 4 hours (14,400 seconds).`,
        );
      }
    }

    const [updated] = await db
      .update(dailyPlanItems)
      .set({
        ...(input.plannedDurationSeconds !== undefined
          ? { plannedDurationSeconds: input.plannedDurationSeconds }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(dailyPlanItems.id, itemId), eq(dailyPlanItems.userId, userId)))
      .returning();

    return updated;
  }

  /**
   * Remove a task from the daily plan.
   */
  static async removePlanItem(userId: string, itemId: string) {
    const [deleted] = await db
      .delete(dailyPlanItems)
      .where(and(eq(dailyPlanItems.id, itemId), eq(dailyPlanItems.userId, userId)))
      .returning();

    if (!deleted) {
      throw new NotFoundError("Daily plan item", itemId);
    }
    return deleted;
  }
}
