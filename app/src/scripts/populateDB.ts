import { DatabaseService } from "../services/DatabaseService";

// This script is now just a direct entry point to the population logic.

async function main() {
  const databaseService = new DatabaseService();
  await databaseService.populate();
}

main().catch(error => {
  console.error("An unexpected error occurred during manual population:", error);
  process.exit(1);
});