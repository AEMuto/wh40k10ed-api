import { DatabaseService } from "../services/DatabaseService";
import { UpdateService } from "../services/UpdateService";

async function main() {
  const databaseService = new DatabaseService();
  const updateService = new UpdateService(databaseService);

  await updateService.checkForUpdates();
}

main().catch(error => {
  console.error("An unexpected error occurred in the update check process:", error);
  process.exit(1);
});