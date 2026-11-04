import { pgTable, text, varchar, timestamp, uuid, integer, uniqueIndex, index } from "drizzle-orm/pg-core";
import { user } from "../auth/schema";
import { tasks } from "../tasks/schema";

export const dailyPlans = pgTable(
  "daily_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planDate: varchar("plan_date", { length: 10 }).notNull(), // YYYY-MM-DD
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("daily_plans_user_date_uniq").on(table.userId, table.planDate),
  ],
);

export const dailyPlanItems = pgTable(
  "daily_plan_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dailyPlanId: uuid("daily_plan_id")
      .notNull()
      .references(() => dailyPlans.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    plannedDurationSeconds: integer("planned_duration_seconds").notNull().default(1800),
    status: varchar("status", { length: 20 }).notNull().default("planned"), // planned | in_progress | completed | deferred
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("daily_plan_items_plan_task_uniq").on(table.dailyPlanId, table.taskId),
    index("daily_plan_items_user_status_idx").on(table.userId, table.status),
  ],
);
