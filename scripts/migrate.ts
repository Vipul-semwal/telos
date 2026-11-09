import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("Migration failed: DATABASE_URL_UNPOOLED or DATABASE_URL is required.");
    process.exit(1);
  }

  const url = new URL(connectionString);
  console.log(`Connecting to database at ${url.hostname}:${url.port || "5432"}...`);

  const sql = postgres(connectionString, {
    max: 1,
    connect_timeout: 10,
    prepare: false,
  });
  const db = drizzle(sql);

  console.log("Applying migrations from ./drizzle...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations applied successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
