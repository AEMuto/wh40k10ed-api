/**
 * Represents the factions table.
 * Core table for different factions in the game.
 */
export interface Faction {
  id: string; // PRIMARY KEY
  name: string;
  link?: string | null;
}

/**
 * Represents the sources table.
 * Lookup table for source materials like books or errata.
 */
export interface Source {
  id: number; // PRIMARY KEY
  name: string;
  type?: string | null;
  edition?: string | null;
  version?: string | null;
  errata_date?: string | null; // Consider using Date type if you parse it
  errata_link?: string | null;
}

/**
 * Represents the detachments table.
 * Contains information about army detachments.
 */
export interface Detachment {
  id: number; // PRIMARY KEY
  faction_id: string; // FOREIGN KEY to Factions
  name: string;
}

/**
 * Represents the abilities table.
 * Core abilities that can be associated with factions or datasheets.
 */
export interface Ability {
  id: number; // PRIMARY KEY
  faction_id?: string | null; // FOREIGN KEY to Factions
  name: string;
  legend?: string | null;
  description?: string | null;
}

/**
 * Represents the detachment_abilities table.
 * Abilities specific to a certain detachment.
 */
export interface DetachmentAbility {
  id: number; // PRIMARY KEY
  detachment_id: number; // FOREIGN KEY to Detachments
  name: string;
  legend?: string | null;
  description?: string | null;
}

/**
 * Represents the stratagems table.
 * Contains rules for stratagems, which can be general or detachment-specific.
 */
export interface Stratagem {
  id: number; // PRIMARY KEY
  detachment_id?: number | null; // FOREIGN KEY to Detachments
  faction_id?: string | null; // FOREIGN KEY to Factions
  name: string;
  type?: string | null;
  cp_cost?: string | null;
  legend?: string | null;
  turn?: string | null;
  phase?: string | null;
  description?: string | null;
}

/**
 * Represents the enhancements table.
 * Contains rules for army enhancements, linked to detachments.
 */
export interface Enhancement {
  id: number; // PRIMARY KEY
  detachment_id: number; // FOREIGN KEY to Detachments
  faction_id: string; // FOREIGN KEY to Factions
  name: string;
  cost?: string | null;
  legend?: string | null;
  description?: string | null;
}

/**
 * Represents the datasheets table.
 * Central table for all unit profiles.
 */
export interface Datasheet {
  id: number; // PRIMARY KEY
  name: string;
  faction_id: string; // FOREIGN KEY to Factions
  source_id: number; // FOREIGN KEY to Sources
  role?: string | null;
  legend?: string | null;
  loadout?: string | null;
  transport?: string | null;
  virtual: number; // 0 for false, 1 for true
  leader_head?: string | null;
  leader_footer?: string | null;
  damaged_w?: string | null;
  damaged_description?: string | null;
  link?: string | null;
}

/**
 * Represents the datasheets_models table.
 * Stats for individual models within a datasheet unit.
 */
export interface DatasheetModel {
  id: number; // PRIMARY KEY
  datasheet_id: number; // FOREIGN KEY to Datasheets
  line: number;
  name: string;
  M?: string | null;
  T?: string | null;
  Sv?: string | null;
  inv_sv?: string | null;
  inv_sv_descr?: string | null;
  W?: string | null;
  Ld?: string | null;
  OC?: string | null;
  base_size?: string | null;
  base_size_descr?: string | null;
}

/**
 * Represents the datasheets_models_costs table.
 * Point costs for models or units.
 */
export interface DatasheetModelCost {
  id: number; // PRIMARY KEY
  datasheet_id: number; // FOREIGN KEY to Datasheets
  line: number;
  description?: string | null;
  cost?: string | null;
}

/**
 * Represents the datasheets_unit_compositions table.
 * Describes the models that make up a unit.
 */
export interface DatasheetUnitComposition {
  id: number; // PRIMARY KEY
  datasheet_id: number; // FOREIGN KEY to Datasheets
  line: number;
  description: string;
}

/**
 * Represents the datasheets_wargears table.
 * Profiles for weapons and other wargear.
 */
export interface DatasheetWargear {
  id: number; // PRIMARY KEY
  datasheet_id: number; // FOREIGN KEY to Datasheets
  line: number;
  line_in_wargear?: number | null;
  dice?: string | null;
  name: string;
  description?: string | null;
  range?: string | null;
  type?: string | null;
  A?: string | null;
  BS_WS?: string | null;
  S?: string | null;
  AP?: string | null;
  D?: string | null;
}

/**
 * Represents the  datasheets_wargear_options table.
 * Describes the choices for equipping a unit.
 */
export interface DatasheetWargearOption {
  id: number; // PRIMARY KEY
  datasheet_id: number; // FOREIGN KEY to Datasheets
  line: number;
  button?: string | null;
  description: string;
}

/**
 * Represents the datasheets_abilities linking table.
 */
export interface DatasheetAbility {
  datasheet_id: number; // PRIMARY KEY, FOREIGN KEY
  ability_id?: number | null; // FOREIGN KEY - UPDATED
  line: number; // PRIMARY KEY
  model?: string | null;
  name?: string | null;
  description?: string | null;
  type?: string | null;
  parameter?: string | null;
}

/**
 * Represents the datasheets_keywords linking table.
 */
export interface DatasheetKeyword {
  datasheet_id: number; // PRIMARY KEY, FOREIGN KEY
  keyword: string; // PRIMARY KEY
  model?: string | null;
  is_faction_keyword: number; // 0 for false, 1 for true
}

/**
 * Represents the datasheets_leaders linking table.
 * Defines which units can lead other units.
 */
export interface DatasheetLeader {
  leader_datasheet_id: number; // PRIMARY KEY, FOREIGN KEY
  unit_datasheet_id: number; // PRIMARY KEY, FOREIGN KEY
}

/**
 * Represents the datasheets_stratagems linking table.
 */
export interface DatasheetStratagem {
  datasheet_id: number; // PRIMARY KEY, FOREIGN KEY
  stratagem_id: number; // PRIMARY KEY, FOREIGN KEY - UPDATED
}

/**
 * Represents the datasheets_enhancements linking table.
 */
export interface DatasheetEnhancement {
  datasheet_id: number; // PRIMARY KEY, FOREIGN KEY
  enhancement_id: number; // PRIMARY KEY, FOREIGN KEY - UPDATED
}

/**
 * Represents the datasheets_detachments_abilities linking table.
 */
export interface DatasheetDetachmentAbility {
  datasheet_id: number; // PRIMARY KEY, FOREIGN KEY
  detachment_ability_id: number; // PRIMARY KEY, FOREIGN KEY - UPDATED
}

/**
 * Represents the last_update table.
 * Stores a single timestamp for the last data update.
 */
export interface LastUpdate {
  last_update: string; // Consider using Date type if you parse it
}

/**
 * A union type representing all possible table names from the schema.
 * This can be used for type-safe queries or generic functions.
 */
export type TableName =
  | "factions"
  | "sources"
  | "detachments"
  | "abilities"
  | "detachments_abilities"
  | "stratagems"
  | "enhancements"
  | "datasheets"
  | "datasheets_models"
  | "datasheets_model_costs"
  | "datasheets_unit_compositions"
  | "datasheets_wargears"
  | "datasheets_wargear_options"
  | "datasheets_abilities"
  | "datasheets_keywords"
  | "datasheets_leaders"
  | "datasheets_stratagems"
  | "datasheets_enhancements"
  | "datasheets_detachments_abilities"
  | "last_update";

export type CsvFiles =
  | "Abilities.csv"
  | "Datasheets_abilities.csv"
  | "Datasheets_detachment_abilities.csv"
  | "Datasheets_enhancements.csv"
  | "Datasheets_keywords.csv"
  | "Datasheets_leader.csv"
  | "Datasheets_models_cost.csv"
  | "Datasheets_models.csv"
  | "Datasheets_options.csv"
  | "Datasheets_stratagems.csv"
  | "Datasheets_unit_composition.csv"
  | "Datasheets_wargear.csv"
  | "Datasheets.csv"
  | "Detachment_abilities.csv"
  | "Enhancements.csv"
  | "Factions.csv"
  | "Source.csv"
  | "Stratagems.csv";

/**
 * A mapping from table names to their corresponding TypeScript interfaces.
 * This allows for creating generic, type-safe functions that operate on
 * different tables. For example, `function get<T extends TableName>(table: T): DatabaseSchema[T][]`
 */
export interface DatabaseSchema {
  factions: Faction;
  sources: Source;
  detachments: Detachment;
  abilities: Ability;
  detachments_abilities: DetachmentAbility;
  stratagems: Stratagem;
  enhancements: Enhancement;
  datasheets: Datasheet;
  datasheets_models: DatasheetModel;
  datasheets_model_costs: DatasheetModelCost;
  datasheets_unit_compositions: DatasheetUnitComposition;
  datasheets_wargears: DatasheetWargear;
  datasheets_wargear_options: DatasheetWargearOption;
  datasheets_abilities: DatasheetAbility;
  datasheets_keywords: DatasheetKeyword;
  datasheets_leaders: DatasheetLeader;
  datasheets_stratagems: DatasheetStratagem;
  datasheets_enhancements: DatasheetEnhancement;
  datasheets_detachments_abilities: DatasheetDetachmentAbility;
  last_update: LastUpdate;
}

export interface DownloadOptions {
  maxRetries: number;
  retryDelay: number;
  rateLimit: number;
  timeout: number;
  cleanupBeforeDownload: boolean;
}

export type HTMLString = string; // Alias for HTML content, can be extended later if needed

// A more complex type representing the final JSON object for a datasheet
// This is the "target" structure your API will build.
export interface ApiDatasheet {
  id: string;
  name: string;
  faction: Faction;
  source: Source;
  legend: string | null;
  role: string;
  virtual: boolean;
  leaderHeader: HTMLString | null; // HTML content for leader head
  leaderFooter: HTMLString | null; // HTML content for leader footer
  damagedWounds: string | null;
  damagedDescription: HTMLString | null; // HTML content for damaged description
  link: string | null; // URL to the datasheet
  models: DatasheetModel[];
  wargear: DatasheetWargear[];
  wargerOptions: DatasheetWargearOption[];
  abilities: ApiAbility[]; // ! Will select from datasheets_abilities table, then if ability_id not null will complete row by selecting from abilities table
  composition: {
    units: DatasheetUnitComposition[];
    loadout: HTMLString; // HTML content for loadout
    costs: DatasheetModelCost[];
  },
  leaderAttachments: number[] | null; // Will be null if current datasheet is not a leader, else will contain an array of datasheet IDs that can be attached to this leader
  transport: HTMLString | null; // HTML content for transport
  keywords: DatasheetKeyword[]; // Will select from datasheets_keywords table
  stratagems: Stratagem[]; // Will select from datasheets_stratagems
  detachmentAbilities: DetachmentAbility[]; // Will select from datasheets_detachments_abilities -> detachments_abilities table
  enhancements: Enhancement[]; // Will select from datasheets_enhancements -> enhancements table
}


export interface ApiAbility {
  id: number;
  model: string | null;
  name: string | null;
  description: HTMLString | null; // HTML content for description
  legend: string | null;
  type: string;
  parameter: string | null;
}