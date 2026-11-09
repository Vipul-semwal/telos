import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "../auth/schema";
import { disciplines } from "../disciplines/schema";
import { projects } from "../projects/schema";
import { tasks } from "../tasks/schema";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    disciplineId: uuid("discipline_id").references(() => disciplines.id, { onDelete: "set null" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_status_idx").on(table.userId, table.status),
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const notificationSchedules = pgTable(
  "notification_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceType: varchar("source_type", { length: 30 }).notNull(),
    sourceId: uuid("source_id").notNull(),
    timezone: varchar("timezone", { length: 100 }).notNull().default("UTC"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    recurrence: jsonb("recurrence").notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    occurrenceLimit: integer("occurrence_limit"),
    occurrenceCount: integer("occurrence_count").notNull().default(0),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notification_schedules_user_status_idx").on(table.userId, table.status),
    index("notification_schedules_due_idx").on(table.status, table.nextRunAt),
    index("notification_schedules_source_idx").on(table.sourceType, table.sourceId),
  ],
);

export const notificationOccurrences = pgTable(
  "notification_occurrences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => notificationSchedules.id, { onDelete: "cascade" }),
    sourceType: varchar("source_type", { length: 30 }).notNull(),
    sourceId: uuid("source_id").notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("scheduled"),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_occurrences_schedule_time_unique").on(
      table.scheduleId,
      table.scheduledFor,
    ),
    index("notification_occurrences_user_due_idx").on(
      table.userId,
      table.status,
      table.scheduledFor,
    ),
    index("notification_occurrences_source_idx").on(table.sourceType, table.sourceId),
  ],
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    occurrenceId: uuid("occurrence_id")
      .notNull()
      .references(() => notificationOccurrences.id, { onDelete: "cascade" }),
    destination: varchar("destination", { length: 30 }).notNull().default("cockpit"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_deliveries_occurrence_destination_unique").on(
      table.occurrenceId,
      table.destination,
    ),
    index("notification_deliveries_user_status_idx").on(table.userId, table.status),
  ],
);

export const notificationHistory = pgTable(
  "notification_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceType: varchar("source_type", { length: 30 }).notNull(),
    sourceId: uuid("source_id").notNull(),
    eventType: varchar("event_type", { length: 40 }).notNull(),
    eventData: jsonb("event_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notification_history_source_idx").on(table.sourceType, table.sourceId, table.createdAt),
    index("notification_history_user_idx").on(table.userId, table.createdAt),
  ],
);
