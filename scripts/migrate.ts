import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { env } from "../src/shared/config/env";

async function runMigrations() {
  console.log("Connecting to database at:", env.DATABASE_URL.replace(/:[^:@]+@/, ":***@"));
  const sql = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  console.log("Applying migrations from ./drizzle...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("? Migrations applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
