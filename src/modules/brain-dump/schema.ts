import { pgTable, text, varchar, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { user } from "../auth/schema";

export const brainDumpItems = pgTable(
  "brain_dump_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("inbox"), // inbox | converted | archived
    convertedToType: varchar("converted_to_type", { length: 20 }), // project | task | subtask
    convertedToId: uuid("converted_to_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("brain_dump_user_status_idx").on(table.userId, table.status),
  ],
);
