import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "../auth/schema";

export const dataSeedRuns = pgTable(
  "data_seed_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    seedKey: varchar("seed_key", { length: 100 }).notNull(),
    metadata: jsonb("metadata"),
    completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("data_seed_runs_user_seed_unique").on(table.userId, table.seedKey),
    index("data_seed_runs_user_idx").on(table.userId),
  ],
);
