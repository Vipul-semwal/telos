import { pgTable, text, varchar, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { user } from "../auth/schema";

export const disciplines = pgTable(
  "disciplines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active | archived
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("disciplines_user_status_idx").on(table.userId, table.status),
  ],
);
