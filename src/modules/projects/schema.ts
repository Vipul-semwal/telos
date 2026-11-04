import { pgTable, text, varchar, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { user } from "../auth/schema";
import { disciplines } from "../disciplines/schema";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    disciplineId: uuid("discipline_id")
      .notNull()
      .references(() => disciplines.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    desiredOutcome: text("desired_outcome"),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active | paused | completed | archived
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("projects_user_discipline_status_idx").on(table.userId, table.disciplineId, table.status),
    index("projects_user_idx").on(table.userId),
  ],
);
