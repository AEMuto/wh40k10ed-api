import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Resolve paths relative to the project root where node is running
const dataDir = path.resolve(process.cwd(), "data");
const dbPath = path.resolve(dataDir, "wh40k10ed.db");

// Ensure the data directory exists before trying to access the database file
// This is important for the very first run.
fs.mkdirSync(dataDir, { recursive: true });

console.log(`Connecting to SQLite database at: ${dbPath}`);

const db = new Database(dbPath, {
  // Set verbose to console.log during development to see all executed queries
  verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
});

// Improve performance and safety with WAL mode
db.pragma("journal_mode = WAL");

// Ensure the database connection closes gracefully when the app shuts down
process.on("exit", () => {
  console.log("Closing database connection.");
  db.close();
});

export default db;
