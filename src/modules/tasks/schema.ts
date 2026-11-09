import { pgTable, text, varchar, timestamp, uuid, integer, index, type AnyPgColumn } from "drizzle-orm/pg-core";
import { user } from "../auth/schema";
import { projects } from "../projects/schema";

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: uuid("discipline_project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    parentTaskId: uuid("parent_task_id").references((): AnyPgColumn => tasks.id, {
      onDelete: "cascade",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    estimatedDurationSeconds: integer("estimated_duration_seconds").notNull().default(0),
    status: varchar("status", { length: 20 }).notNull().default("todo"), // todo | in_progress | completed | cancelled
    priority: varchar("priority", { length: 20 }).notNull().default("medium"), // low | medium | high
    dueDate: timestamp("due_date", { withTimezone: true }),
    notes: text("notes"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("tasks_user_project_status_idx").on(table.userId, table.projectId, table.status),
    index("tasks_parent_idx").on(table.parentTaskId),
    index("tasks_user_project_order_idx").on(table.userId, table.projectId, table.orderIndex),
  ],
);

export const taskHistory = pgTable(
  "task_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    eventData: text("event_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("task_history_task_idx").on(table.taskId, table.createdAt),
    index("task_history_user_idx").on(table.userId),
  ],
);
