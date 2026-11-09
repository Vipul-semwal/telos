import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "../auth/schema";
import { tasks } from "../tasks/schema";

export const taskYards = pgTable(
  "task_yards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tldr: text("tldr"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("task_yards_user_task_unique").on(table.userId, table.taskId),
    index("task_yards_user_idx").on(table.userId),
  ],
);

export const taskYardNotes = pgTable(
  "task_yard_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskYardId: uuid("task_yard_id")
      .notNull()
      .references(() => taskYards.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }),
    contentHtml: text("content_html").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("task_yard_notes_yard_idx").on(table.taskYardId, table.updatedAt),
    index("task_yard_notes_user_idx").on(table.userId),
  ],
);

export const recallCards = pgTable(
  "recall_cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskYardId: uuid("task_yard_id")
      .notNull()
      .references(() => taskYards.id, { onDelete: "cascade" }),
    cardType: varchar("card_type", { length: 20 }).notNull(), // flashcard | reminder | custom
    title: varchar("title", { length: 255 }).notNull(),
    prompt: text("prompt"),
    answer: text("answer"),
    content: text("content"),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active | completed | archived
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("recall_cards_yard_status_idx").on(table.taskYardId, table.status),
    index("recall_cards_user_idx").on(table.userId),
  ],
);

export const recallReviews = pgTable(
  "recall_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => recallCards.id, { onDelete: "cascade" }),
    occurrenceId: uuid("occurrence_id"),
    result: varchar("result", { length: 20 }).notNull(), // remembered | forgotten | completed | dismissed
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("recall_reviews_card_idx").on(table.cardId, table.reviewedAt),
    index("recall_reviews_user_idx").on(table.userId),
  ],
);
