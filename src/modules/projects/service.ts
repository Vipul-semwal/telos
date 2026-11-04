import { db } from "@/infrastructure/database";
import { projects } from "./schema";
import { disciplines } from "../disciplines/schema";
import { eq, and, count } from "drizzle-orm";
import { CapacityExceededError, NotFoundError } from "@/shared/errors/domain-error";
import type { CreateProjectInput, UpdateProjectInput } from "./validation";

export const MAX_ACTIVE_PROJECTS_PER_DISCIPLINE = 3;

export class ProjectsService {
  /**
   * Count active projects for a given discipline and user.
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
   * Enforces rules:
   * 1. Discipline must exist and belong to the user.
   * 2. Maximum 3 active projects per discipline.
   */
  static async create(userId: string, input: CreateProjectInput) {
    // Check discipline ownership
    const [discipline] = await db
      .select()
      .from(disciplines)
      .where(and(eq(disciplines.id, input.disciplineId), eq(disciplines.userId, userId)));

    if (!discipline) {
      throw new NotFoundError("Discipline", input.disciplineId);
    }

    const activeCount = await this.countActive(userId, input.disciplineId);
    if (activeCount >= MAX_ACTIVE_PROJECTS_PER_DISCIPLINE) {
      throw new CapacityExceededError(
        `Project capacity reached: maximum of ${MAX_ACTIVE_PROJECTS_PER_DISCIPLINE} active projects allowed per discipline`,
      );
    }

    const [created] = await db
      .insert(projects)
      .values({
        userId,
        disciplineId: input.disciplineId,
        title: input.title,
        description: input.description,
        status: "active",
      })
      .returning();

    return created;
  }

  /**
   * List projects for a user, optionally filtered by discipline and status.
   */
  static async list(userId: string, disciplineId?: string, status?: "active" | "completed" | "archived") {
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
   * Get project by ID, verifying user ownership.
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
   * Update a project, verifying user ownership and enforcing capacity limits if reactivating.
   */
  static async update(userId: string, id: string, input: UpdateProjectInput) {
    const existing = await this.getById(userId, id);

    if (input.status === "active" && existing.status !== "active") {
      const activeCount = await this.countActive(userId, existing.disciplineId);
      if (activeCount >= MAX_ACTIVE_PROJECTS_PER_DISCIPLINE) {
        throw new CapacityExceededError(
          `Cannot activate project: maximum of ${MAX_ACTIVE_PROJECTS_PER_DISCIPLINE} active projects allowed per discipline`,
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
}
