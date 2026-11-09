import { db } from "@/infrastructure/database";
import { brainDumpItems } from "./schema";
import { projects } from "../projects/schema";
import { disciplines } from "../disciplines/schema";
import { TasksService } from "../tasks/service";
import { ProjectsService } from "../projects/service";
import { eq, and, ilike, desc } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/shared/errors/domain-error";
import type {
  CreateBrainDumpInput,
  UpdateBrainDumpInput,
  ListBrainDumpQuery,
  ConvertBrainDumpToTaskInput,
  ConvertBrainDumpToProjectInput,
  AssociateBrainDumpInput,
} from "./validation";

export class BrainDumpService {
  /**
   * Capture a new raw thought / unclassified item.
   * The only required field is content. Items always start in the inbox.
   */
  static async create(userId: string, input: CreateBrainDumpInput) {
    const [created] = await db
      .insert(brainDumpItems)
      .values({
        userId,
        content: input.content,
        kind: input.kind ?? null,
        status: "inbox",
      })
      .returning();

    return created;
  }

  /**
   * List brain dump items for a user with optional status, kind, and content search.
   * Results are newest-first; records are never hard-deleted.
   */
  static async list(userId: string, filter: ListBrainDumpQuery = {}) {
    const conditions = [eq(brainDumpItems.userId, userId)];

    if (filter.status) {
      conditions.push(eq(brainDumpItems.status, filter.status));
    }
    if (filter.kind) {
      conditions.push(eq(brainDumpItems.kind, filter.kind));
    }
    if (filter.search && filter.search.trim().length > 0) {
      conditions.push(ilike(brainDumpItems.content, `%${filter.search.trim()}%`));
    }

    return db
      .select()
      .from(brainDumpItems)
      .where(and(...conditions))
      .orderBy(desc(brainDumpItems.createdAt));
  }

  /**
   * Fetch a single item, enforcing user ownership.
   */
  static async getById(userId: string, id: string) {
    const [found] = await db
      .select()
      .from(brainDumpItems)
      .where(and(eq(brainDumpItems.id, id), eq(brainDumpItems.userId, userId)));

    if (!found) {
      throw new NotFoundError("Brain dump item", id);
    }
    return found;
  }

  /**
   * Edit the captured content or its optional classification hint.
   * Editing never resolves or deletes the item.
   */
  static async update(userId: string, id: string, input: UpdateBrainDumpInput) {
    await this.getById(userId, id);

    const [updated] = await db
      .update(brainDumpItems)
      .set({
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.kind !== undefined ? { kind: input.kind } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(brainDumpItems.id, id), eq(brainDumpItems.userId, userId)))
      .returning();

    return updated;
  }

  /**
   * Archive an item. The record and its conversion history are preserved.
   */
  static async archive(userId: string, id: string) {
    const existing = await this.getById(userId, id);

    const [updated] = await db
      .update(brainDumpItems)
      .set({
        status: "archived",
        archivedAt: new Date(),
        dismissedAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(brainDumpItems.id, id), eq(brainDumpItems.userId, userId)))
      .returning();

    return updated ?? existing;
  }

  /**
   * Dismiss an item without deleting it. Distinct from archive so the operator
   * can review dismissed noise separately later.
   */
  static async dismiss(userId: string, id: string) {
    await this.getById(userId, id);

    const [updated] = await db
      .update(brainDumpItems)
      .set({
        status: "dismissed",
        dismissedAt: new Date(),
        archivedAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(brainDumpItems.id, id), eq(brainDumpItems.userId, userId)))
      .returning();

    return updated;
  }

  /**
   * Restore an archived or dismissed item to its previous lifecycle state.
   * Converted items return to `converted` so their traceability is preserved.
   */
  static async restore(userId: string, id: string) {
    const existing = await this.getById(userId, id);

    const [updated] = await db
      .update(brainDumpItems)
      .set({
        status: existing.convertedAt ? "converted" : "inbox",
        archivedAt: null,
        dismissedAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(brainDumpItems.id, id), eq(brainDumpItems.userId, userId)))
      .returning();

    return updated;
  }

  /**
   * Convert an item into a Task.
   * A valid, user-owned parent Project is mandatory — tasks can never be orphaned.
   * The original Brain Dump record is preserved and records the task it produced.
   */
  static async convertToTask(userId: string, id: string, input: ConvertBrainDumpToTaskInput) {
    const existing = await this.getById(userId, id);

    if (existing.status === "converted") {
      throw new ConflictError("Brain dump item has already been converted");
    }

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, input.projectId), eq(projects.userId, userId)));

    if (!project) {
      throw new NotFoundError("Project", input.projectId);
    }

    const task = await TasksService.create(userId, {
      projectId: input.projectId,
      title: (input.title ?? existing.content).slice(0, 255),
      description: input.description,
      estimatedDurationSeconds: 0,
    });

    const [updated] = await db
      .update(brainDumpItems)
      .set({
        status: "converted",
        projectId: input.projectId,
        convertedToType: "task",
        convertedToId: task.id,
        convertedAt: new Date(),
        archivedAt: null,
        dismissedAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(brainDumpItems.id, id), eq(brainDumpItems.userId, userId)))
      .returning();

    return { item: updated, task };
  }

  /**
   * Use an item to create a new Project under a user-owned Discipline.
   * The original item is preserved and records the created project.
   */
  static async convertToProject(
    userId: string,
    id: string,
    input: ConvertBrainDumpToProjectInput,
  ) {
    const existing = await this.getById(userId, id);

    if (existing.status === "converted") {
      throw new ConflictError("Brain dump item has already been converted");
    }

    const [discipline] = await db
      .select({ id: disciplines.id })
      .from(disciplines)
      .where(
        and(eq(disciplines.id, input.disciplineId), eq(disciplines.userId, userId)),
      );

    if (!discipline) {
      throw new NotFoundError("Discipline", input.disciplineId);
    }

    const project = await ProjectsService.create(userId, {
      disciplineId: input.disciplineId,
      title: (input.title ?? existing.content).slice(0, 255),
    });

    const [updated] = await db
      .update(brainDumpItems)
      .set({
        status: "converted",
        disciplineId: input.disciplineId,
        projectId: project.id,
        convertedToType: "project",
        convertedToId: project.id,
        convertedAt: new Date(),
        archivedAt: null,
        dismissedAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(brainDumpItems.id, id), eq(brainDumpItems.userId, userId)))
      .returning();

    return { item: updated, project };
  }

  /**
   * Lightweight manual triage: link to an existing project or discipline, or
   * keep the item as a note. This does not create any new hierarchy records.
   */
  static async associate(userId: string, id: string, input: AssociateBrainDumpInput) {
    await this.getById(userId, id);

    let projectId: string | null = null;
    let disciplineId: string | null = null;
    let convertedToType: "project_link" | "discipline_link" | "note" = "note";
    let convertedToId: string | null = null;

    if (input.projectId) {
      const [project] = await db
        .select({ id: projects.id, disciplineId: projects.disciplineId })
        .from(projects)
        .where(and(eq(projects.id, input.projectId), eq(projects.userId, userId)));

      if (!project) {
        throw new NotFoundError("Project", input.projectId);
      }
      projectId = project.id;
      disciplineId = project.disciplineId;
      convertedToType = "project_link";
      convertedToId = project.id;
    } else if (input.disciplineId) {
      const [discipline] = await db
        .select({ id: disciplines.id })
        .from(disciplines)
        .where(
          and(eq(disciplines.id, input.disciplineId), eq(disciplines.userId, userId)),
        );

      if (!discipline) {
        throw new NotFoundError("Discipline", input.disciplineId);
      }
      disciplineId = discipline.id;
      convertedToType = "discipline_link";
      convertedToId = discipline.id;
    }

    const [updated] = await db
      .update(brainDumpItems)
      .set({
        status: "converted",
        ...(projectId ? { projectId } : {}),
        ...(disciplineId ? { disciplineId } : {}),
        ...(input.keepAsNote && !input.projectId && !input.disciplineId
          ? { kind: "note" }
          : {}),
        convertedToType,
        convertedToId,
        convertedAt: new Date(),
        archivedAt: null,
        dismissedAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(brainDumpItems.id, id), eq(brainDumpItems.userId, userId)))
      .returning();

    return updated;
  }
}
