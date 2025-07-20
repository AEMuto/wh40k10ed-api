import fs from "fs";
import path from "path";
import db from "../core/database";
import { RemoteDataSource } from "./RemoteDataSource";
import { toInt } from "../utils/conversion";
import {
  FILES_TO_TABLE_MAP,
  CSV_HEADER_MAP,
  COLUMN_CONVERTERS,
} from "../config/database.population.config";
import { parseCsvString } from "../utils/parsing";
import { TableName, CsvFiles } from "@/core/types";
import type { Database } from "better-sqlite3";
import type { ParseConfig } from "papaparse";

export class DatabaseService {
  private remoteDataSource: RemoteDataSource;
  private dataDir = path.join(process.cwd(), "data");
  private static readonly PAPA_PARSE_OPTIONS: ParseConfig = {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    delimiter: "|",
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => (value.trim() === "" ? null : value.trim()),
  };

  constructor() {
    this.remoteDataSource = new RemoteDataSource();
  }

  /**
   * The main public method to orchestrate the entire database population process.
   */
  public async populate(): Promise<void> {
    console.log("--- Starting Database Population ---");
    try {
      await this.initializeSchema();

      const csvUrls = Object.keys(FILES_TO_TABLE_MAP).map((fileName) =>
        this.remoteDataSource.getCsvUrl(fileName)
      );
      await this.remoteDataSource.downloadCSVs(csvUrls, this.dataDir);

      this.populateTablesInOrder();

      console.log("--- Database Population Finished Successfully 🎉 ---");
    } catch (error: any) {
      console.error(
        "FATAL: A critical error occurred during database population:",
        error.message
      );
      process.exit(1); // Exit to signal failure
    }
  }

  private async initializeSchema(): Promise<void> {
    console.log("Initializing database schema...");
    const schemaPath = path.resolve(process.cwd(), "schema.sql");
    const schema = await fs.promises.readFile(schemaPath, "utf8");
    db.pragma("foreign_keys = OFF");
    db.exec(schema);
    db.pragma("foreign_keys = ON");
    console.log("Database tables created successfully.");
  }

  private populateTablesInOrder(): void {
    console.log("Populating database tables...");

    this._populateTableFromCSV("Factions.csv", db);
    this._populateTableFromCSV("Source.csv", db);
    this._populateTableFromCSV("Abilities.csv", db);
    this._populateTableFromCSV("Datasheets.csv", db);
    this._populateTableFromCSV("Datasheets_models.csv", db);
    this._populateTableFromCSV("Datasheets_models_cost.csv", db);
    this._populateTableFromCSV("Datasheets_unit_composition.csv", db);
    this._populateTableFromCSV("Datasheets_wargear.csv", db);
    this._populateTableFromCSV("Datasheets_options.csv", db);
    this._populateTableFromCSV("Datasheets_abilities.csv", db);
    this._populateTableFromCSV("Datasheets_keywords.csv", db);
    this._populateTableFromCSV("Datasheets_leader.csv", db);

    this._populateDetachments(db);

    const detachmentMap = this._createDetachmentMap(db);

    this._populateTableWithDetachmentFK("Stratagems.csv", db, detachmentMap);
    this._populateTableWithDetachmentFK("Enhancements.csv", db, detachmentMap);
    // prettier-ignore
    this._populateTableWithDetachmentFK("Detachment_abilities.csv", db, detachmentMap);

    this._populateTableFromCSV("Datasheets_stratagems.csv", db);
    this._populateTableFromCSV("Datasheets_enhancements.csv", db);
    this._populateTableFromCSV("Datasheets_detachment_abilities.csv", db);
  }

  private _populateTableFromCSV<C extends CsvFiles>(csv: C, db: Database) {
    const tableName = FILES_TO_TABLE_MAP[csv];
    if (!tableName) {
      console.error(`No table mapping found for CSV: ${csv}`);
      return;
    }
    console.log(`Populating ${tableName} from CSV...`);
    const filePath = path.join(process.cwd(), "data", `${csv}`);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const rawData = parseCsvString<Record<string, any>>(
      fileContent,
      DatabaseService.PAPA_PARSE_OPTIONS
    );
    if (!rawData.length) {
      console.log(`No data for ${tableName}.`);
      return;
    }
    const headerMap = CSV_HEADER_MAP[tableName];
    const mappedData = headerMap
      ? rawData.map((row) => {
          const newRow: Record<string, any> = {};
          for (const key in row) {
            newRow[headerMap[key] || key] = row[key];
          }
          return newRow;
        })
      : rawData;
    const converters = COLUMN_CONVERTERS[tableName];
    if (!converters) {
      console.error(
        `No converters defined for table ${tableName}. Cannot proceed.`
      );
      return;
    }

    const dbColumns = Object.keys(converters);

    const foreignKeyChecks: {
      fkColumn: string;
      validIds: Set<number>;
    }[] = [];

    const fkParentTableMap: { [fkColumn: string]: TableName } = {
      leader_datasheet_id: "datasheets",
      unit_datasheet_id: "datasheets",
      ability_id: "abilities", // Handles irregular plural 'ability' -> 'abilities'
      detachment_ability_id: "detachments_abilities",
    };

    if (tableName.startsWith("datasheets_")) {
      const fkCols = dbColumns.filter((col) => col.endsWith("_id"));
      for (const fkCol of fkCols) {
        const parentTable =
          fkParentTableMap[fkCol] || fkCol.replace(/_id$/, "s");
        try {
          console.log(
            `Pre-fetching valid IDs from ${parentTable} for ${tableName}...`
          );
          const ids = db.prepare(`SELECT id FROM ${parentTable}`).all() as {
            id: number;
          }[];
          const validIds = new Set(ids.map((row) => row.id));
          foreignKeyChecks.push({ fkColumn: fkCol, validIds });
          console.log(`Found ${validIds.size} valid IDs from ${parentTable}.`);
        } catch (e: any) {
          console.warn(
            `
            ⚠️ While inserting in ${tableName}.
            error: ${JSON.stringify(e)}
            dbColumns: ${JSON.stringify(dbColumns)}
            foreignKeyChecks: ${JSON.stringify(foreignKeyChecks)}
            foreign key check for column '${fkCol}' failed.
            Could not pre-fetch IDs from table '${parentTable}'.
            It might not exist or have a different name.
            Skipping check for this FK.`
          );
        }
      }
    }

    const placeholders = dbColumns.map(() => "?").join(", ");
    const sql = `INSERT OR REPLACE INTO ${tableName} (${dbColumns.join(", ")}) VALUES (${placeholders})`;

    const insertStatement = db.prepare(sql);
    const insertMany = db.transaction((rows: Record<string, any>[]) => {
      const log = {
        skippedCount: 0,
        skippedRows: [] as Record<string, any>[],
        insertedCount: 0,
      };
      for (const row of rows) {
        if (foreignKeyChecks.length > 0) {
          let isValid = true;
          for (const check of foreignKeyChecks) {
            const fkValue = toInt(row[check.fkColumn]);
            if (fkValue !== null && !check.validIds.has(fkValue)) {
              isValid = false;
              break;
            }
          }
          if (!isValid) {
            log.skippedCount++;
            log.skippedRows.push(row);
            continue; // Skip this row
          }
        }
        const values = dbColumns.map((col) => {
          // Here we use the converter for each column to ensure correct data types.
          const converter = converters[col as keyof typeof converters] as
            | ((v: any) => any)
            | undefined;
          return converter ? converter(row[col]) : row[col] || null;
        });
        insertStatement.run(...values);
        log.insertedCount++;
      }
      if (log.skippedCount > 0) {
        console.log(
          `⚠️ Skipped ${log.skippedCount} rows with invalid datasheet foreign keys in ${tableName}.
          This may indicate missing or incorrect datasheet IDs in the CSV. Please check your data.
          `
        );
        console.table(log.skippedRows);
      }
      return log.insertedCount;
    });

    const insertedCount = insertMany(mappedData);
    console.log(`✅ Inserted ${insertedCount} rows into ${tableName}.`);
  }

  private _populateDetachments(db: Database) {
    console.log("Populating special table: Detachments...");
    const detachmentSet = new Set<string>();
    type SourceCsvRow = { faction_id: string; detachment: string };

    const stratagemsPath = path.join(process.cwd(), "data", "Stratagems.csv");
    const enhancementsPath = path.join(
      process.cwd(),
      "data",
      "Enhancements.csv"
    );
    const detachmentAbilitiesPath = path.join(
      process.cwd(),
      "data",
      "Detachment_abilities.csv"
    );

    const stratagems = parseCsvString<SourceCsvRow>(
      fs.readFileSync(stratagemsPath, "utf8"),
      DatabaseService.PAPA_PARSE_OPTIONS
    );

    const enhancements = parseCsvString<SourceCsvRow>(
      fs.readFileSync(enhancementsPath, "utf8"),
      DatabaseService.PAPA_PARSE_OPTIONS
    );

    const detachmentAbilities = parseCsvString<SourceCsvRow>(
      fs.readFileSync(detachmentAbilitiesPath, "utf8"),
      DatabaseService.PAPA_PARSE_OPTIONS
    );

    for (const row of [
      ...stratagems,
      ...enhancements,
      ...detachmentAbilities,
    ]) {
      if (row.faction_id && row.detachment) {
        detachmentSet.add(
          JSON.stringify({ faction_id: row.faction_id, name: row.detachment })
        );
      }
    }

    const uniqueDetachments = Array.from(detachmentSet).map((item) =>
      JSON.parse(item)
    );
    if (!uniqueDetachments.length) {
      console.log(
        "No detachments found in Stratagems, Enhancements, or Detachment_abilities CSVs."
      );
      return;
    }

    const insert = db.prepare(
      "INSERT INTO Detachments (faction_id, name) VALUES (?, ?)"
    );
    const insertMany = db.transaction((detachments) => {
      for (const det of detachments) insert.run(det.faction_id, det.name);
    });
    insertMany(uniqueDetachments);
    console.log(
      `✅ Inserted ${uniqueDetachments.length} rows into Detachments.`
    );
  }

  private _createDetachmentMap(db: Database): Map<string, number> {
    const getDetachments = db.prepare(
      "SELECT id, faction_id, name FROM Detachments"
    );
    const detachmentRows = getDetachments.all() as {
      id: number;
      faction_id: string;
      name: string;
    }[];
    const detachmentMap = new Map<string, number>();
    for (const row of detachmentRows) {
      detachmentMap.set(`${row.faction_id}_${row.name}`, row.id); // row.id is the detachment ID
    }
    console.log(`Created detachment map with ${detachmentMap.size} entries.`);
    return detachmentMap;
  }

  private _populateTableWithDetachmentFK(
    csv: "Stratagems.csv" | "Enhancements.csv" | "Detachment_abilities.csv",
    db: Database,
    detachmentMap: Map<string, number>
  ) {
    const tableName = FILES_TO_TABLE_MAP[csv];
    if (!tableName) {
      console.error(`No table mapping found for CSV: ${csv}`);
      return;
    }
    console.log(`Populating ${tableName} with detachment foreign keys...`);
    type CsvRow = Record<string, any> & {
      detachment?: string;
      faction_id?: string;
    };
    const filePath = path.join(process.cwd(), "data", csv);
    if (!fs.existsSync(filePath)) {
      console.error(`CSV file not found: ${filePath}`);
      return;
    }
    const fileContent = fs.readFileSync(filePath, "utf8");
    const rawData = parseCsvString<CsvRow>(
      fileContent,
      DatabaseService.PAPA_PARSE_OPTIONS
    );
    if (!rawData.length) return;

    const converters = COLUMN_CONVERTERS[tableName];
    if (!converters) return;

    // Dynamically get columns from converters, excluding detachment_id which is handled separately.
    const baseDbColumns = Object.keys(converters);
    const dbColumns = ["detachment_id", ...baseDbColumns];
    const placeholders = dbColumns.map(() => "?").join(", ");
    const sql = `INSERT OR REPLACE INTO ${tableName} (${dbColumns.join(", ")}) VALUES (${placeholders})`;

    const insertStatement = db.prepare(sql);
    const insertMany = db.transaction((rows: CsvRow[]) => {
      for (const row of rows) {
        const detachmentId =
          row.detachment && row.faction_id
            ? detachmentMap.get(`${row.faction_id}_${row.detachment}`) || null
            : null;

        const values = [
          detachmentId,
          ...baseDbColumns.map((key) => {
            const converter = (converters as any)[key];
            return converter(row[key]);
          }),
        ];
        insertStatement.run(...values);
      }
    });

    insertMany(rawData);
    console.log(`✅ Inserted ${rawData.length} rows into ${tableName}.`);
  }
}
