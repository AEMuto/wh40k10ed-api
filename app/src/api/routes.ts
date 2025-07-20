import { Router, Request, Response } from "express";
import db from "../core/database";
import { Faction } from "../core/types";

const router = Router();

// --- Health Check Route ---
router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Example Route: Get all Factions ---
router.get("/factions", (req: Request, res: Response) => {
  try {
    const stmt = db.prepare("SELECT * FROM Factions ORDER BY name");
    const factions: Faction[] = stmt.all() as Faction[];
    res.status(200).json(factions);
  } catch (error) {
    console.error("Failed to fetch factions:", error);
    // Be careful not to leak internal error details in a production environment
    res
      .status(500)
      .json({ error: "Failed to retrieve data from the database." });
  }
});

// --- Placeholder Route: Get a single Datasheet by ID ---
// This is where you will implement the complex logic to join all the tables
// and transform the data into the rich JSON object you designed.
router.get("/datasheets/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare("SELECT * FROM Datasheets WHERE id = ?");
    const datasheet = stmt.get(id);

    if (!datasheet) {
      return res.status(404).json({ error: "Datasheet not found" });
    }

    // TODO:
    // 1. Query all other related tables (Models, Wargear, Keywords, etc.) using the datasheet ID.
    // 2. Process and reshape the data from all those queries.
    // 3. For wargear, parse the HTML description to extract weapon abilities.
    // 4. Assemble the final, rich JSON object based on your 'ApiDatasheet' type.

    res.status(200).json({
      message: "Datasheet found. Transformation logic not yet implemented.",
      data: datasheet,
    });
  } catch (error) {
    console.error(`Failed to fetch datasheet ${id}:`, error);
    res.status(500).json({ error: "Failed to retrieve data." });
  }
});

export default router;
