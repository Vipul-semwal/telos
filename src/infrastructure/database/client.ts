import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "@/shared/config/env";
import * as schema from "./schema";

const connectionString = env.DATABASE_URL;

// Prevent multiple connections in development due to hot module reloading
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

export const connection =
  globalForDb.conn ??
  postgres(connectionString, {
    max: env.NODE_ENV === "production" ? 3 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

if (env.NODE_ENV !== "production") {
  globalForDb.conn = connection;
}

export const db = drizzle(connection, { schema });
export type Database = typeof db;
