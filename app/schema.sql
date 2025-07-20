-- This schema is designed for SQLite.
-- The script will drop tables if they exist to ensure a clean slate on each run.

-- ##################################################
-- #         CORE & LOOKUP TABLES                   #
-- ##################################################

DROP TABLE IF EXISTS factions;
CREATE TABLE factions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    link TEXT
);

DROP TABLE IF EXISTS sources;
CREATE TABLE sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT,
    edition TEXT,
    version TEXT,
    errata_date TEXT,
    errata_link TEXT
);

-- This table is programmatically deduced from 3 separate CSV files.
DROP TABLE IF EXISTS detachments;
CREATE TABLE detachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faction_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (faction_id) REFERENCES factions(id),
    UNIQUE (name, faction_id)
);

DROP TABLE IF EXISTS abilities;
CREATE TABLE abilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faction_id TEXT,
    name TEXT NOT NULL,
    legend TEXT,
    description TEXT,
    FOREIGN KEY (faction_id) REFERENCES factions(id)
);

-- This table now links to the deduced detachments table.
DROP TABLE IF EXISTS detachments_abilities;
CREATE TABLE detachments_abilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detachment_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    legend TEXT,
    description TEXT,
    FOREIGN KEY (detachment_id) REFERENCES detachments(id) ON DELETE CASCADE
);

-- This table now links to the deduced detachments table.
DROP TABLE IF EXISTS stratagems;
CREATE TABLE stratagems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detachment_id INTEGER, -- Can be NULL if not detachment-specific
    faction_id TEXT, -- Can be NULL if not faction-specific
    -- If both detachment_id and faction_id are NULL, it is a generic stratagem
    name TEXT NOT NULL,
    type TEXT,
    cp_cost TEXT,
    legend TEXT,
    turn TEXT,
    phase TEXT,
    description TEXT,
    FOREIGN KEY (faction_id) REFERENCES factions(id),
    FOREIGN KEY (detachment_id) REFERENCES detachments(id)
);

-- This table now links to the deduced detachments table.
DROP TABLE IF EXISTS enhancements;
CREATE TABLE enhancements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detachment_id INTEGER NOT NULL,
    faction_id TEXT NOT NULL,
    name TEXT NOT NULL,
    cost TEXT,
    legend TEXT,
    description TEXT,
    FOREIGN KEY (faction_id) REFERENCES factions(id),
    FOREIGN KEY (detachment_id) REFERENCES detachments(id)
);


-- ##################################################
-- #           CENTRAL DATASHEET TABLE              #
-- ##################################################

DROP TABLE IF EXISTS datasheets;
CREATE TABLE datasheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    faction_id TEXT NOT NULL,
    source_id INTEGER,
    role TEXT,
    legend TEXT,
    loadout TEXT,
    transport TEXT,
    virtual INTEGER NOT NULL, -- NOTE: Import script must convert "true"/'false' strings to 1/0
    leader_head TEXT,
    leader_footer TEXT,
    damaged_w TEXT,
    damaged_description TEXT,
    link TEXT,
    FOREIGN KEY (faction_id) REFERENCES factions(id),
    FOREIGN KEY (source_id) REFERENCES sources(id)
);

-- ##################################################
-- #    DATASHEET-LINKED ATTRIBUTE TABLES           #
-- ##################################################

DROP TABLE IF EXISTS datasheets_models;
CREATE TABLE datasheets_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datasheet_id INTEGER NOT NULL,
    line INTEGER NOT NULL,
    name TEXT NOT NULL,
    M TEXT, T TEXT, Sv TEXT, inv_sv TEXT, inv_sv_descr TEXT,
    W TEXT, Ld TEXT, OC TEXT,
    base_size TEXT, base_size_descr TEXT,
    FOREIGN KEY (datasheet_id) REFERENCES datasheets(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS datasheets_model_costs;
CREATE TABLE datasheets_model_costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datasheet_id INTEGER NOT NULL,
    line INTEGER NOT NULL,
    description TEXT,
    cost TEXT,
    FOREIGN KEY (datasheet_id) REFERENCES datasheets(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS datasheets_unit_compositions;
CREATE TABLE datasheets_unit_compositions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datasheet_id INTEGER NOT NULL,
    line INTEGER NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (datasheet_id) REFERENCES datasheets(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS datasheets_wargears;
CREATE TABLE datasheets_wargears (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datasheet_id INTEGER NOT NULL,
    line INTEGER NOT NULL,
    line_in_wargear INTEGER,
    dice TEXT,
    name TEXT NOT NULL,
    description TEXT,
    range TEXT, type TEXT, A TEXT, BS_WS TEXT, S TEXT, AP TEXT, D TEXT,
    FOREIGN KEY (datasheet_id) REFERENCES datasheets(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS datasheets_wargear_options;
CREATE TABLE datasheets_wargear_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datasheet_id INTEGER NOT NULL,
    line INTEGER NOT NULL,
    button TEXT,
    description TEXT NOT NULL,
    FOREIGN KEY (datasheet_id) REFERENCES datasheets(id) ON DELETE CASCADE
);

-- ##################################################
-- #       DATASHEET LINKING TABLES                 #
-- ##################################################

DROP TABLE IF EXISTS datasheets_abilities;
CREATE TABLE datasheets_abilities (
    datasheet_id INTEGER NOT NULL,
    ability_id INTEGER, -- Can be NULL if the ability is defined inline
    line INTEGER NOT NULL,
    model TEXT,
    name TEXT,
    description TEXT,
    type TEXT,
    parameter TEXT,
    FOREIGN KEY (datasheet_id) REFERENCES datasheets(id) ON DELETE CASCADE,
    FOREIGN KEY (ability_id) REFERENCES abilities(id),
    PRIMARY KEY (datasheet_id, line)
);

DROP TABLE IF EXISTS datasheets_keywords;
CREATE TABLE datasheets_keywords (
    datasheet_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    model TEXT,
    is_faction_keyword INTEGER NOT NULL, -- NOTE: Import script must convert "true"/'false' strings to 1/0
    FOREIGN KEY (datasheet_id) REFERENCES datasheets(id) ON DELETE CASCADE,
    PRIMARY KEY (datasheet_id, keyword)
);

DROP TABLE IF EXISTS datasheets_leaders;
CREATE TABLE datasheets_leaders (
    leader_datasheet_id INTEGER NOT NULL, -- The datasheet ID of the leader model
    unit_datasheet_id INTEGER NOT NULL, -- The datasheet ID of the unit that can be led
    FOREIGN KEY (leader_datasheet_id) REFERENCES datasheets(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_datasheet_id) REFERENCES datasheets(id) ON DELETE CASCADE,
    PRIMARY KEY (leader_datasheet_id, unit_datasheet_id)
);

DROP TABLE IF EXISTS datasheets_stratagems;
CREATE TABLE datasheets_stratagems (
    datasheet_id INTEGER NOT NULL,
    stratagem_id INTEGER NOT NULL,
    FOREIGN KEY (datasheet_id) REFERENCES datasheets(id) ON DELETE CASCADE,
    FOREIGN KEY (stratagem_id) REFERENCES stratagems(id),
    PRIMARY KEY (datasheet_id, stratagem_id)
);

DROP TABLE IF EXISTS datasheets_enhancements;
CREATE TABLE datasheets_enhancements (
    datasheet_id INTEGER NOT NULL,
    enhancement_id INTEGER NOT NULL,
    FOREIGN KEY (datasheet_id) REFERENCES datasheets(id) ON DELETE CASCADE,
    FOREIGN KEY (enhancement_id) REFERENCES enhancements(id),
    PRIMARY KEY (datasheet_id, enhancement_id)
);

DROP TABLE IF EXISTS datasheets_detachments_abilities;
CREATE TABLE datasheets_detachments_abilities (
    datasheet_id INTEGER NOT NULL,
    detachment_ability_id INTEGER NOT NULL,
    FOREIGN KEY (datasheet_id) REFERENCES datasheets(id) ON DELETE CASCADE,
    FOREIGN KEY (detachment_ability_id) REFERENCES detachments_abilities(id),
    PRIMARY KEY (datasheet_id, detachment_ability_id)
);

-- ##################################################
-- #               METADATA TABLE                   #
-- ##################################################

DROP TABLE IF EXISTS last_update;
CREATE TABLE last_update (
    -- Per spec, contains a single line with date-time of last update
    last_update TEXT NOT NULL
);

