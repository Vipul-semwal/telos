import { pgTable, text, timestamp, uuid, integer, boolean, index } from "drizzle-orm/pg-core";
import { user } from "../auth/schema";
import { tasks } from "../tasks/schema";

export const timeSessions = pgTable(
  "time_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    notes: text("notes"),
    isManualCorrection: boolean("is_manual_correction").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("time_sessions_user_task_idx").on(table.userId, table.taskId),
    index("time_sessions_user_endtime_idx").on(table.userId, table.endTime),
  ],
);
