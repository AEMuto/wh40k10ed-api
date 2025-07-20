import { toInt, toBooleanInt } from "../utils/conversion";
import type { TableName, CsvFiles, DatabaseSchema } from "@/core/types";

/**
 * Defines the mapping between CSV files and database tables.
 * This is used to determine which CSV file corresponds to which database table during population.
 * The keys are the names of the CSV files, and the values are the corresponding table names.
 */
export const FILES_TO_TABLE_MAP: Record<CsvFiles, TableName> = {
  "Abilities.csv": "abilities",
  "Datasheets_abilities.csv": "datasheets_abilities",
  "Datasheets_detachment_abilities.csv": "datasheets_detachments_abilities",
  "Datasheets_enhancements.csv": "datasheets_enhancements",
  "Datasheets_keywords.csv": "datasheets_keywords",
  "Datasheets_leader.csv": "datasheets_leaders",
  "Datasheets_models_cost.csv": "datasheets_model_costs",
  "Datasheets_models.csv": "datasheets_models",
  "Datasheets_options.csv": "datasheets_wargear_options",
  "Datasheets_stratagems.csv": "datasheets_stratagems",
  "Datasheets_unit_composition.csv": "datasheets_unit_compositions",
  "Datasheets_wargear.csv": "datasheets_wargears",
  "Datasheets.csv": "datasheets",
  "Detachment_abilities.csv": "detachments_abilities",
  "Enhancements.csv": "enhancements",
  "Factions.csv": "factions",
  "Source.csv": "sources",
  "Stratagems.csv": "stratagems",
};

/**
 * Column names in some of the table determined by schema.sql are different from the CSV headers of the files where they are imported from.
 * This map is used to transform CSV headers to the correct DB column names.
 * Used in DatabaseService._populateTableFromCSV to map CSV headers to DB columns
 */
export const CSV_HEADER_MAP: {
  [T in TableName]?: { [csvHeader: string]: string };
} = {
  datasheets_leaders: {
    leader_id: "leader_datasheet_id",
    attached_id: "unit_datasheet_id",
  },
};

/**
 * Defines functions to convert raw CSV values (strings) to the correct type for each database column.
 * This object is the single source of truth for data transformation.
 */
export const COLUMN_CONVERTERS: {
  [T in TableName]?: { [K in keyof DatabaseSchema[T]]?: (v: any) => any };
} = {
  factions: {
    id: String,
    name: String,
    link: (v) => v || null,
  },
  sources: {
    id: toInt,
    name: String,
    type: (v) => v || null,
    edition: (v) => v || null,
    version: (v) => v || null,
    errata_date: (v) => v || null,
    errata_link: (v) => v || null,
  },
  abilities: {
    id: toInt,
    faction_id: (v) => v || null,
    name: String,
    legend: (v) => v || null,
    description: (v) => v || null,
  },
  stratagems: {
    id: toInt,
    faction_id: (v) => v || null,
    name: String,
    type: (v) => v || null,
    cp_cost: (v) => v || null,
    legend: (v) => v || null,
    turn: (v) => v || null,
    phase: (v) => v || null,
    description: (v) => v || null,
  },
  enhancements: {
    id: toInt,
    faction_id: String,
    name: String,
    cost: (v) => v || null,
    legend: (v) => v || null,
    description: (v) => v || null,
  },
  detachments_abilities: {
    id: toInt,
    name: String,
    legend: (v) => v || null,
    description: (v) => v || null,
  },
  datasheets: {
    id: toInt,
    name: String,
    faction_id: String,
    source_id: toInt,
    role: (v) => v || null,
    legend: (v) => v || null,
    loadout: (v) => v || null,
    transport: (v) => v || null,
    virtual: toBooleanInt,
    leader_head: (v) => v || null,
    leader_footer: (v) => v || null,
    damaged_w: (v) => v || null,
    damaged_description: (v) => v || null,
    link: (v) => v || null,
  },
  datasheets_models: {
    id: toInt,
    datasheet_id: toInt,
    line: toInt,
    name: String,
    M: (v) => v || null,
    T: (v) => v || null,
    Sv: (v) => v || null,
    inv_sv: (v) => v === "-" ? null : v, // Convert "-" to null
    inv_sv_descr: (v) => v || null,
    W: (v) => v || null,
    Ld: (v) => v || null,
    OC: (v) => v || null,
    base_size: (v) => v || null,
    base_size_descr: (v) => v || null,
  },
  datasheets_model_costs: {
    id: toInt,
    datasheet_id: toInt,
    line: toInt,
    description: (v) => v || null,
    cost: (v) => v || null,
  },
  datasheets_unit_compositions: {
    id: toInt,
    datasheet_id: toInt,
    line: toInt,
    description: String,
  },
  datasheets_wargears: {
    id: toInt,
    datasheet_id: toInt,
    line: toInt,
    line_in_wargear: toInt,
    dice: (v) => v || null,
    name: String,
    description: (v) => v || null,
    range: (v) => v || null,
    type: (v) => v || null,
    A: (v) => v || null,
    BS_WS: (v) => v || null,
    S: (v) => v || null,
    AP: (v) => v || null,
    D: (v) => v || null,
  },
  datasheets_wargear_options: {
    id: toInt,
    datasheet_id: toInt,
    line: toInt,
    button: (v) => v || null,
    description: String,
  },
  datasheets_abilities: {
    datasheet_id: toInt,
    ability_id: toInt,
    line: toInt,
    model: (v) => v || null,
    name: (v) => v || null,
    description: (v) => v || null,
    type: (v) => v || null,
    parameter: (v) => v || null,
  },
  datasheets_keywords: {
    datasheet_id: toInt,
    keyword: String,
    model: (v) => v || null,
    is_faction_keyword: toBooleanInt,
  },
  datasheets_leaders: {
    leader_datasheet_id: toInt,
    unit_datasheet_id: toInt,
  },
  datasheets_stratagems: {
    datasheet_id: toInt,
    stratagem_id: toInt,
  },
  datasheets_enhancements: {
    datasheet_id: toInt,
    enhancement_id: toInt,
  },
  datasheets_detachments_abilities: {
    datasheet_id: toInt,
    detachment_ability_id: toInt,
  },
};
