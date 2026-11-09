import { connection } from "../src/infrastructure/database/client";
import { NotificationService } from "../src/modules/notifications/service";

async function main() {
  await NotificationService.processAll();
  console.log("Notification schedules processed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await connection.end();
  });
