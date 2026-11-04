import { db } from "@/infrastructure/database";
import { brainDumpItems } from "./schema";
import { eq, and } from "drizzle-orm";
import { NotFoundError } from "@/shared/errors/domain-error";
import type { CreateBrainDumpInput, ConvertBrainDumpInput } from "./validation";

export class BrainDumpService {
  /**
   * Capture a new raw thought / unclassified item.
   */
  static async create(userId: string, input: CreateBrainDumpInput) {
    const [created] = await db
      .insert(brainDumpItems)
      .values({
        userId,
        content: input.content,
        status: "inbox",
      })
      .returning();

    return created;
  }

  /**
   * List brain dump items for a user.
   */
  static async list(userId: string, status?: "inbox" | "converted" | "archived") {
    const conditions = [eq(brainDumpItems.userId, userId)];
    if (status) {
      conditions.push(eq(brainDumpItems.status, status));
    }

    return db
      .select()
      .from(brainDumpItems)
      .where(and(...conditions))
      .orderBy(brainDumpItems.createdAt);
  }

  /**
   * Mark an item as converted to a project, task, or subtask.
   */
  static async convert(userId: string, id: string, input: ConvertBrainDumpInput) {
    const [existing] = await db
      .select()
      .from(brainDumpItems)
      .where(and(eq(brainDumpItems.id, id), eq(brainDumpItems.userId, userId)));

    if (!existing) {
      throw new NotFoundError("Brain dump item", id);
    }

    const [updated] = await db
      .update(brainDumpItems)
      .set({
        status: "converted",
        convertedToType: input.convertedToType,
        convertedToId: input.convertedToId,
        updatedAt: new Date(),
      })
      .where(and(eq(brainDumpItems.id, id), eq(brainDumpItems.userId, userId)))
      .returning();

    return updated;
  }

  /**
   * Archive an item.
   */
  static async archive(userId: string, id: string) {
    const [updated] = await db
      .update(brainDumpItems)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(and(eq(brainDumpItems.id, id), eq(brainDumpItems.userId, userId)))
      .returning();

    if (!updated) {
      throw new NotFoundError("Brain dump item", id);
    }
    return updated;
  }
}
