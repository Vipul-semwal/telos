import { db } from "@/infrastructure/database";
import { disciplines } from "./schema";
import { eq, and, count } from "drizzle-orm";
import { CapacityExceededError, NotFoundError, ForbiddenError } from "@/shared/errors/domain-error";
import type { CreateDisciplineInput, UpdateDisciplineInput } from "./validation";

export const MAX_ACTIVE_DISCIPLINES = 3;

export class DisciplinesService {
  /**
   * Count active disciplines for a user.
   */
  static async countActive(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(disciplines)
      .where(and(eq(disciplines.userId, userId), eq(disciplines.status, "active")));
    return Number(result[0]?.count ?? 0);
  }

  /**
   * Create a new discipline.
   * Enforces rule: Maximum 3 active disciplines per user.
   */
  static async create(userId: string, input: CreateDisciplineInput) {
    const activeCount = await this.countActive(userId);
    if (activeCount >= MAX_ACTIVE_DISCIPLINES) {
      throw new CapacityExceededError(
        `Discipline capacity reached: maximum of ${MAX_ACTIVE_DISCIPLINES} active disciplines allowed`,
      );
    }

    const [created] = await db
      .insert(disciplines)
      .values({
        userId,
        title: input.title,
        description: input.description,
        status: "active",
      })
      .returning();

    return created;
  }

  /**
   * List all disciplines for a user with optional status filter.
   */
  static async list(userId: string, status?: "active" | "archived") {
    const conditions = [eq(disciplines.userId, userId)];
    if (status) {
      conditions.push(eq(disciplines.status, status));
    }

    return db
      .select()
      .from(disciplines)
      .where(and(...conditions))
      .orderBy(disciplines.createdAt);
  }

  /**
   * Get a discipline by ID, verifying user ownership.
   */
  static async getById(userId: string, id: string) {
    const [found] = await db
      .select()
      .from(disciplines)
      .where(and(eq(disciplines.id, id), eq(disciplines.userId, userId)));

    if (!found) {
      throw new NotFoundError("Discipline", id);
    }
    return found;
  }

  /**
   * Update a discipline, enforcing user ownership and the 3 active disciplines rule if reactivating.
   */
  static async update(userId: string, id: string, input: UpdateDisciplineInput) {
    const existing = await this.getById(userId, id);

    // If attempting to activate an archived discipline, check active capacity
    if (input.status === "active" && existing.status !== "active") {
      const activeCount = await this.countActive(userId);
      if (activeCount >= MAX_ACTIVE_DISCIPLINES) {
        throw new CapacityExceededError(
          `Cannot activate discipline: maximum of ${MAX_ACTIVE_DISCIPLINES} active disciplines allowed`,
        );
      }
    }

    const [updated] = await db
      .update(disciplines)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(disciplines.id, id), eq(disciplines.userId, userId)))
      .returning();

    return updated;
  }

  /**
   * Archive a discipline.
   */
  static async archive(userId: string, id: string) {
    return this.update(userId, id, { status: "archived" });
  }
}
