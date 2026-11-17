import { connection } from "../src/infrastructure/database/client";
import { MATH_ROADMAP_SEED } from "../src/modules/data-seed/fixtures/math-roadmap";
import { DataSeedService } from "../src/modules/data-seed/service";

const TARGET_USERNAME = "vipul";

async function run() {
  if (process.env.SEED_MATH_ROADMAP !== "true") {
    console.log("Math roadmap seed disabled; set SEED_MATH_ROADMAP=true to enable it.");
    return;
  }

  console.log(`Checking one-time math roadmap seed for user "${TARGET_USERNAME}".`);
  const result = await DataSeedService.seedCurriculum(TARGET_USERNAME, MATH_ROADMAP_SEED);

  if (result.status === "skipped") {
    console.log(`Seed ${result.seedKey} already completed; no changes made.`);
    return;
  }

  console.log(
    [
      `Seed ${result.seedKey} completed.`,
      `Tasks: ${result.taskCount}`,
      `Subtasks: ${result.subtaskCount}`,
      `Task Yard notes: ${result.noteCount}`,
      `Flashcards: ${result.cardCount}`,
    ].join(" "),
  );
}

run()
  .catch((error) => {
    console.error("Math roadmap seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await connection.end();
  });
