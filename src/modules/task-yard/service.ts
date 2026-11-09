import sanitizeHtml from "sanitize-html";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/infrastructure/database";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-error";
import { ProjectsService } from "../projects/service";
import { TasksService } from "../tasks/service";
import { NotificationService } from "../notifications/service";
import type { NotificationSourceType, ScheduleInput } from "../notifications/domain/types";
import type { RecallCardInput } from "../notifications/validation";
import { recallCards, recallReviews, taskYardNotes, taskYards } from "./schema";

const sanitizeRichText = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "h2",
      "h3",
      "a",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    },
  });

function sourceTypeFor(cardType: string): NotificationSourceType {
  return cardType === "flashcard" ? "task_yard_flashcard" : "task_yard_reminder";
}

export class TaskYardService {
  static async ensureYard(userId: string, taskId: string) {
    await TasksService.getById(userId, taskId);
    const [existing] = await db
      .select()
      .from(taskYards)
      .where(and(eq(taskYards.userId, userId), eq(taskYards.taskId, taskId)));
    if (existing) return existing;

    const [created] = await db
      .insert(taskYards)
      .values({ userId, taskId })
      .onConflictDoNothing()
      .returning();
    if (created) return created;

    const [yard] = await db
      .select()
      .from(taskYards)
      .where(and(eq(taskYards.userId, userId), eq(taskYards.taskId, taskId)));
    return yard;
  }

  static async getWorkspace(userId: string, taskId: string) {
    const task = await TasksService.getById(userId, taskId);
    const project = await ProjectsService.getById(userId, task.projectId);
    const yard = await this.ensureYard(userId, taskId);
    const [notes, cards, reviews] = await Promise.all([
      db
        .select()
        .from(taskYardNotes)
        .where(
          and(eq(taskYardNotes.userId, userId), eq(taskYardNotes.taskYardId, yard.id)),
        )
        .orderBy(desc(taskYardNotes.updatedAt)),
      db
        .select()
        .from(recallCards)
        .where(
          and(eq(recallCards.userId, userId), eq(recallCards.taskYardId, yard.id)),
        )
        .orderBy(desc(recallCards.updatedAt)),
      db
        .select()
        .from(recallReviews)
        .where(eq(recallReviews.userId, userId))
        .orderBy(desc(recallReviews.reviewedAt))
        .limit(100),
    ]);

    const cardIds = cards.map((card) => card.id);
    const [flashcardSchedules, reminderSchedules, flashcardOccurrences, reminderOccurrences] =
      await Promise.all([
        NotificationService.listSchedulesForSources(userId, "task_yard_flashcard", cardIds),
        NotificationService.listSchedulesForSources(userId, "task_yard_reminder", cardIds),
        NotificationService.listOccurrencesForSources(userId, "task_yard_flashcard", cardIds),
        NotificationService.listOccurrencesForSources(userId, "task_yard_reminder", cardIds),
      ]);

    return {
      task,
      project,
      yard,
      notes,
      cards,
      reviews: reviews.filter((review) => cardIds.includes(review.cardId)),
      schedules: [...flashcardSchedules, ...reminderSchedules],
      occurrences: [...flashcardOccurrences, ...reminderOccurrences],
    };
  }

  static async updateTldr(userId: string, taskId: string, tldr: string) {
    const yard = await this.ensureYard(userId, taskId);
    const [updated] = await db
      .update(taskYards)
      .set({ tldr: tldr.trim() || null, updatedAt: new Date() })
      .where(and(eq(taskYards.id, yard.id), eq(taskYards.userId, userId)))
      .returning();
    return updated;
  }

  static async createNote(
    userId: string,
    taskId: string,
    input: { title?: string; contentHtml: string },
  ) {
    const yard = await this.ensureYard(userId, taskId);
    const contentHtml = sanitizeRichText(input.contentHtml);
    if (!contentHtml.trim()) throw new ValidationError("Note content is required");
    const [note] = await db
      .insert(taskYardNotes)
      .values({
        userId,
        taskYardId: yard.id,
        title: input.title?.trim() || null,
        contentHtml,
      })
      .returning();
    return note;
  }

  static async updateNote(
    userId: string,
    taskId: string,
    noteId: string,
    input: { title?: string; contentHtml: string },
  ) {
    const yard = await this.ensureYard(userId, taskId);
    const contentHtml = sanitizeRichText(input.contentHtml);
    if (!contentHtml.trim()) throw new ValidationError("Note content is required");
    const [note] = await db
      .update(taskYardNotes)
      .set({
        title: input.title?.trim() || null,
        contentHtml,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(taskYardNotes.id, noteId),
          eq(taskYardNotes.userId, userId),
          eq(taskYardNotes.taskYardId, yard.id),
        ),
      )
      .returning();
    if (!note) throw new NotFoundError("Task Yard note", noteId);
    return note;
  }

  static async deleteNote(userId: string, taskId: string, noteId: string) {
    const yard = await this.ensureYard(userId, taskId);
    const [deleted] = await db
      .delete(taskYardNotes)
      .where(
        and(
          eq(taskYardNotes.id, noteId),
          eq(taskYardNotes.userId, userId),
          eq(taskYardNotes.taskYardId, yard.id),
        ),
      )
      .returning();
    if (!deleted) throw new NotFoundError("Task Yard note", noteId);
    return deleted;
  }

  static async createCard(userId: string, taskId: string, input: RecallCardInput) {
    const yard = await this.ensureYard(userId, taskId);
    const [card] = await db
      .insert(recallCards)
      .values({
        userId,
        taskYardId: yard.id,
        cardType: input.cardType,
        title: input.title,
        prompt: input.prompt || null,
        answer: input.answer || null,
        content: input.content || null,
      })
      .returning();
    await NotificationService.recordHistory(
      userId,
      sourceTypeFor(card.cardType),
      card.id,
      "created",
      input,
    );
    return card;
  }

  static async updateCard(
    userId: string,
    taskId: string,
    cardId: string,
    input: Partial<RecallCardInput>,
  ) {
    const yard = await this.ensureYard(userId, taskId);
    const existing = await this.getCard(userId, taskId, cardId);
    const cardType = existing.cardType;
    const [card] = await db
      .update(recallCards)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.prompt !== undefined ? { prompt: input.prompt || null } : {}),
        ...(input.answer !== undefined ? { answer: input.answer || null } : {}),
        ...(input.content !== undefined ? { content: input.content || null } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(recallCards.id, cardId),
          eq(recallCards.userId, userId),
          eq(recallCards.taskYardId, yard.id),
        ),
      )
      .returning();
    await NotificationService.recordHistory(
      userId,
      sourceTypeFor(cardType),
      cardId,
      "edited",
      input,
    );
    return card;
  }

  static async getCard(userId: string, taskId: string, cardId: string) {
    const yard = await this.ensureYard(userId, taskId);
    const [card] = await db
      .select()
      .from(recallCards)
      .where(
        and(
          eq(recallCards.id, cardId),
          eq(recallCards.userId, userId),
          eq(recallCards.taskYardId, yard.id),
        ),
      );
    if (!card) throw new NotFoundError("Recall card", cardId);
    return card;
  }

  static async deleteCard(userId: string, taskId: string, cardId: string) {
    const card = await this.getCard(userId, taskId, cardId);
    await NotificationService.endSourceSchedules(
      userId,
      sourceTypeFor(card.cardType),
      cardId,
      "card_deleted",
    );
    const [deleted] = await db
      .delete(recallCards)
      .where(and(eq(recallCards.id, cardId), eq(recallCards.userId, userId)))
      .returning();
    return deleted;
  }

  static async completeCard(userId: string, taskId: string, cardId: string) {
    await this.getCard(userId, taskId, cardId);
    const now = new Date();
    const [card] = await db
      .update(recallCards)
      .set({ status: "completed", completedAt: now, updatedAt: now })
      .where(and(eq(recallCards.id, cardId), eq(recallCards.userId, userId)))
      .returning();
    return card;
  }

  static async scheduleCard(
    userId: string,
    taskId: string,
    cardId: string,
    schedule: ScheduleInput,
  ) {
    const card = await this.getCard(userId, taskId, cardId);
    return NotificationService.replaceSourceSchedules(
      userId,
      sourceTypeFor(card.cardType),
      card.id,
      schedule,
    );
  }

  static async reviewCard(
    userId: string,
    taskId: string,
    cardId: string,
    input: { result: "remembered" | "forgotten" | "completed" | "dismissed"; occurrenceId?: string },
  ) {
    const card = await this.getCard(userId, taskId, cardId);
    if (input.occurrenceId) {
      const occurrence = await NotificationService.assertOccurrenceOwner(userId, input.occurrenceId);
      if (occurrence.sourceId !== cardId) throw new ValidationError("Occurrence does not belong to card");
      await NotificationService.completeOccurrence(userId, input.occurrenceId);
    }
    const now = new Date();
    const [review] = await db
      .insert(recallReviews)
      .values({
        userId,
        cardId,
        occurrenceId: input.occurrenceId ?? null,
        result: input.result,
      })
      .returning();
    await db
      .update(recallCards)
      .set({
        lastReviewedAt: now,
        ...(input.result === "completed" ? { status: "completed", completedAt: now } : {}),
        updatedAt: now,
      })
      .where(and(eq(recallCards.id, cardId), eq(recallCards.userId, userId)));
    await NotificationService.recordHistory(
      userId,
      sourceTypeFor(card.cardType),
      cardId,
      "reviewed",
      { result: input.result, occurrenceId: input.occurrenceId ?? null },
    );
    return review;
  }

  static async getDueItems(
    userId: string,
    preloadedRows?: Awaited<ReturnType<typeof NotificationService.getDueOccurrences>>,
  ) {
    const rows = (preloadedRows ?? (await NotificationService.getDueOccurrences(userId))).filter(
      (row) =>
        row.sourceType === "task_yard_flashcard" ||
        row.sourceType === "task_yard_reminder",
    );
    if (rows.length === 0) {
      return { items: [], occurrenceIds: [] as string[] };
    }
    const cardIds = [...new Set(rows.map((row) => row.sourceId))];
    const cards = await db
      .select({
        card: recallCards,
        yard: taskYards,
      })
      .from(recallCards)
      .innerJoin(taskYards, eq(recallCards.taskYardId, taskYards.id))
      .where(
        and(eq(recallCards.userId, userId), inArray(recallCards.id, cardIds)),
      );
    const cardMap = new Map(cards.map((row) => [row.card.id, row]));
    const items = rows.flatMap((row) => {
      const joined = cardMap.get(row.sourceId);
      if (!joined || joined.card.status !== "active") return [];
      return [
        {
          occurrenceId: row.id,
          sourceId: joined.card.id,
          sourceType: row.sourceType,
          cardType: joined.card.cardType,
          title: joined.card.title,
          prompt: joined.card.prompt,
          answer: joined.card.answer,
          message: joined.card.content,
          taskId: joined.yard.taskId,
          taskYardHref: `/tasks/${joined.yard.taskId}/yard`,
          dueAt: new Date(row.effectiveDueAt).toISOString(),
          readAt: row.readAt,
        },
      ];
    });
    return { items, occurrenceIds: items.map((item) => item.occurrenceId) };
  }
}
