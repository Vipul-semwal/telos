import { pgTable, text, varchar, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { user } from "../auth/schema";
import { disciplines } from "../disciplines/schema";
import { projects } from "../projects/schema";

export const brainDumpItems = pgTable(
  "brain_dump_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    // Optional, user-assigned classification hint. Null means unclassified.
    kind: varchar("kind", { length: 20 }), // note | idea | task | question | reference | project_idea | research | problem | info
    // Lifecycle: inbox -> converted | archived | dismissed. Records are never hard-deleted.
    status: varchar("status", { length: 20 }).notNull().default("inbox"),
    // Optional associations recorded during manual triage.
    disciplineId: uuid("discipline_id").references(() => disciplines.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    // Exact record of what the item was resolved into (traceability).
    convertedToType: varchar("converted_to_type", { length: 20 }), // task | project | project_link | discipline_link | note
    convertedToId: uuid("converted_to_id"),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("brain_dump_user_status_idx").on(table.userId, table.status),
    index("brain_dump_user_created_idx").on(table.userId, table.createdAt),
    index("brain_dump_user_kind_idx").on(table.userId, table.kind),
  ],
);
