import { db } from "@/infrastructure/database";
import { dailyPlans, dailyPlanItems } from "./schema";
import { tasks } from "../tasks/schema";
import { eq, and, sql } from "drizzle-orm";
import { CapacityExceededError, NotFoundError, ConflictError } from "@/shared/errors/domain-error";
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
        taskEstimatedSeconds: tasks.estimatedDurationSeconds,
        plannedDurationSeconds: dailyPlanItems.plannedDurationSeconds,
        status: dailyPlanItems.status,
        sortOrder: dailyPlanItems.sortOrder,
        createdAt: dailyPlanItems.createdAt,
      })
      .from(dailyPlanItems)
      .innerJoin(tasks, eq(dailyPlanItems.taskId, tasks.id))
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
   * Add a task to the daily plan.
   * Enforces rules:
   * 1. Task must belong to the user.
   * 2. Total planned duration cannot exceed 4 hours (14,400 seconds).
   * 3. Task cannot already exist in the same day's plan.
   */
  static async addTaskToPlan(userId: string, input: AddTaskToPlanInput) {
    // 1. Verify task ownership
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, input.taskId), eq(tasks.userId, userId)));

    if (!task) {
      throw new NotFoundError("Task", input.taskId);
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
      input.plannedDurationSeconds ?? (task.estimatedDurationSeconds > 0 ? task.estimatedDurationSeconds : 1800);

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
