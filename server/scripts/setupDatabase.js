const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

/* =========================================================
   TRIPLANKA DATABASE SETUP + SAFE FRESH-DB VALIDATION

   SAFE validation:
     node scripts/setupDatabase.js --validate

   Destructive fresh reset:
     node scripts/setupDatabase.js --reset --confirm

   IMPORTANT:
   - --validate creates a TEMPORARY database.
   - Your current tourismhub_lk database is NOT changed.
   - Temporary validation DB is deleted automatically.
   - --reset --confirm DOES delete and recreate tourismhub_lk.
========================================================= */

const PROJECT_DATABASE_NAME = "tourismhub_lk";

const REQUIRED_TABLES = [
  "users",
  "property_plans",
  "payment_methods",
  "properties",
  "rooms",
  "property_photos",
  "room_photos",
  "property_policies",
  "bookings",
  "notifications",
  "payment_transactions",

  "explore_categories",
  "explore_settings",
  "explore_places",
  "explore_place_images",
  "explore_itineraries",
  "explore_itinerary_places",

  "tourist_events",

  "partner_guides",
  "guide_payment_transactions",
  "guide_bookings",
  "guide_booking_payments",
  "guide_reviews",

  "home_sections",
  "home_quick_actions",

  "trip_plans",
  "trip_plan_days",
  "trip_plan_items",
  "trip_route_cache",
  "trip_route_access_points",
  "trip_route_analyses",

  "event_reports",
  "event_report_history",
  "event_moderation",
];

const REQUIRED_TRIP_PLANNER_SETTINGS = [
  "trip_planner_config",
  "trip_planner_transport_profiles",
  "trip_planner_optimization_modes",
  "trip_planner_map",
  "trip_planner_routing_provider",
];

/* =========================================================
   READ SQL FILE
========================================================= */

const readSqlFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `SQL file was not found: ${filePath}`
    );
  }

  const sql = fs.readFileSync(
    filePath,
    "utf8"
  );

  if (!sql.trim()) {
    throw new Error(
      `SQL file is empty: ${filePath}`
    );
  }

  return sql;
};

/* =========================================================
   ENVIRONMENT CHECK
========================================================= */

const validateEnvironment = () => {
  const missing = [];

  if (!process.env.DB_HOST) {
    missing.push("DB_HOST");
  }

  if (!process.env.DB_USER) {
    missing.push("DB_USER");
  }

  if (missing.length) {
    throw new Error(
      `Missing required .env values: ${missing.join(", ")}`
    );
  }
};

/* =========================================================
   SAFE DATABASE IDENTIFIER
========================================================= */

const sanitizeIdentifier = (value) => {
  const clean = String(value || "")
    .replace(
      /[^a-zA-Z0-9_]/g,
      ""
    );

  if (!clean) {
    throw new Error(
      "Database identifier is invalid."
    );
  }

  if (clean.length > 64) {
    throw new Error(
      "Database identifier is longer than 64 characters."
    );
  }

  return clean;
};

const quoteIdentifier = (value) => {
  const safe =
    sanitizeIdentifier(value);

  return `\`${safe}\``;
};

/* =========================================================
   TEMP DATABASE SQL CONVERSION

   schema.sql and seed.sql use:

   tourismhub_lk

   During validation only, this function changes those
   database commands in memory to a temporary DB.

   Original files are NOT changed.
========================================================= */

const replaceProjectDatabaseName = (
  sql,
  targetDatabaseName
) => {
  const target =
    quoteIdentifier(
      targetDatabaseName
    );

  return sql
    .replace(
      /\bDROP\s+DATABASE\s+IF\s+EXISTS\s+`?tourismhub_lk`?/gi,
      `DROP DATABASE IF EXISTS ${target}`
    )
    .replace(
      /\bCREATE\s+DATABASE\s+`?tourismhub_lk`?/gi,
      `CREATE DATABASE ${target}`
    )
    .replace(
      /\bUSE\s+`?tourismhub_lk`?/gi,
      `USE ${target}`
    );
};

/* =========================================================
   MYSQL CONNECTION

   Connect to MySQL server only.
   Do NOT select tourismhub_lk here.
========================================================= */

const createConnection =
  async () => {
    return mysql.createConnection({
      host:
        process.env.DB_HOST,

      port:
        Number(
          process.env.DB_PORT ||
          3306
        ),

      user:
        process.env.DB_USER,

      password:
        process.env.DB_PASSWORD ||
        "",

      multipleStatements: true,
    });
  };

/* =========================================================
   RUN SQL
========================================================= */

const runSql = async (
  connection,
  sql,
  displayName
) => {
  console.log("");
  console.log(
    `Running ${displayName}...`
  );

  await connection.query(sql);

  console.log(
    `✓ ${displayName} completed successfully.`
  );
};

/* =========================================================
   DATABASE FILES
========================================================= */

const getDatabaseFiles = () => {
  /*
    server/scripts/setupDatabase.js

    -> server/scripts
    -> server
    -> project root
    -> database
  */

  const databaseDirectory =
    path.resolve(
      __dirname,
      "../../database"
    );

  const schemaPath =
    path.join(
      databaseDirectory,
      "schema.sql"
    );

  const seedPath =
    path.join(
      databaseDirectory,
      "seed.sql"
    );

  return {
    schemaPath,
    seedPath,

    schemaSql:
      readSqlFile(
        schemaPath
      ),

    seedSql:
      readSqlFile(
        seedPath
      ),
  };
};

/* =========================================================
   VALIDATE CREATED DATABASE
========================================================= */

const validateDatabase = async (
  connection,
  databaseName
) => {
  const database =
    quoteIdentifier(
      databaseName
    );

  await connection.query(
    `USE ${database}`
  );

  /* -------------------------------------------------------
     TABLES
  ------------------------------------------------------- */

  const [tableRows] =
    await connection.query(
      "SHOW TABLES"
    );

  const tableNames =
    tableRows.map(
      (row) =>
        Object.values(row)[0]
    );

  const missingTables =
    REQUIRED_TABLES.filter(
      (tableName) =>
        !tableNames.includes(
          tableName
        )
    );

  if (missingTables.length) {
    throw new Error(
      `Missing required tables: ${missingTables.join(
        ", "
      )}`
    );
  }

  /* -------------------------------------------------------
     TRIP PLANNER SETTINGS
  ------------------------------------------------------- */

  const [
    plannerSettingRows,
  ] =
    await connection.query(
      `
      SELECT
        setting_key
      FROM explore_settings
      WHERE
        setting_key LIKE 'trip_planner%'
      ORDER BY
        setting_key
      `
    );

  const plannerSettingKeys =
    plannerSettingRows.map(
      (row) =>
        row.setting_key
    );

  const missingPlannerSettings =
    REQUIRED_TRIP_PLANNER_SETTINGS.filter(
      (settingKey) =>
        !plannerSettingKeys.includes(
          settingKey
        )
    );

  if (
    missingPlannerSettings.length
  ) {
    throw new Error(
      `Missing Trip Planner settings: ${missingPlannerSettings.join(
        ", "
      )}`
    );
  }

  /* -------------------------------------------------------
     HOME DATA
  ------------------------------------------------------- */

  const [[homeCounts]] =
    await connection.query(
      `
      SELECT

        (
          SELECT COUNT(*)
          FROM home_sections
          WHERE is_active = TRUE
        ) AS active_sections,

        (
          SELECT COUNT(*)
          FROM home_quick_actions
          WHERE is_active = TRUE
        ) AS active_quick_actions
      `
    );

  if (
    Number(
      homeCounts.active_sections
    ) < 7
  ) {
    throw new Error(
      `Expected at least 7 active Home sections, found ${homeCounts.active_sections}.`
    );
  }

  if (
    Number(
      homeCounts.active_quick_actions
    ) < 3
  ) {
    throw new Error(
      `Expected at least 3 active Home quick actions, found ${homeCounts.active_quick_actions}.`
    );
  }

  /* -------------------------------------------------------
     EXTERNAL IMAGE URL CHECK

     Google Maps URLs are NOT checked here because those are
     valid map links.

     Only runtime image fields are checked.
  ------------------------------------------------------- */

  const [[externalImages]] =
    await connection.query(
      `
      SELECT

        (
          SELECT COUNT(*)
          FROM properties
          WHERE
            logo_url LIKE 'http://%'
            OR logo_url LIKE 'https://%'
        )

        +

        (
          SELECT COUNT(*)
          FROM property_photos
          WHERE
            image_url LIKE 'http://%'
            OR image_url LIKE 'https://%'
        )

        +

        (
          SELECT COUNT(*)
          FROM room_photos
          WHERE
            image_url LIKE 'http://%'
            OR image_url LIKE 'https://%'
        )

        +

        (
          SELECT COUNT(*)
          FROM explore_places
          WHERE
            image_url LIKE 'http://%'
            OR image_url LIKE 'https://%'
        )

        +

        (
          SELECT COUNT(*)
          FROM explore_place_images
          WHERE
            image_url LIKE 'http://%'
            OR image_url LIKE 'https://%'
        )

        +

        (
          SELECT COUNT(*)
          FROM tourist_events
          WHERE
            image_url LIKE 'http://%'
            OR image_url LIKE 'https://%'
        )

        +

        (
          SELECT COUNT(*)
          FROM partner_guides
          WHERE
            image_url LIKE 'http://%'
            OR image_url LIKE 'https://%'
        )

        AS total_external_image_urls
      `
    );

  if (
    Number(
      externalImages
        .total_external_image_urls
    ) !== 0
  ) {
    throw new Error(
      `Found ${externalImages.total_external_image_urls} external runtime image URL(s).`
    );
  }

  /* -------------------------------------------------------
     FINAL PUBLIC DATA COUNTS
  ------------------------------------------------------- */

  const [[seedCounts]] =
    await connection.query(
      `
      SELECT

        (
          SELECT COUNT(*)
          FROM explore_places
          WHERE status = 'published'
        ) AS published_places,

        (
          SELECT COUNT(*)
          FROM tourist_events
          WHERE status = 'approved'
        ) AS approved_events,

        (
          SELECT COUNT(*)
          FROM properties
          WHERE status = 'approved'
        ) AS approved_properties,

        (
          SELECT COUNT(*)
          FROM partner_guides
          WHERE
            status = 'approved'
            AND registration_payment_status = 'Paid'
        ) AS public_guides
      `
    );

  /* -------------------------------------------------------
     FOREIGN KEYS
  ------------------------------------------------------- */

  const [[foreignKeyCount]] =
    await connection.query(
      `
      SELECT
        COUNT(*) AS foreign_key_count
      FROM
        information_schema.REFERENTIAL_CONSTRAINTS
      WHERE
        CONSTRAINT_SCHEMA = ?
      `,
      [
        databaseName,
      ]
    );

  /* -------------------------------------------------------
     SUMMARY
  ------------------------------------------------------- */

  console.log("");
  console.log(
    "Validation summary"
  );

  console.log(
    "------------------------------------------"
  );

  console.log(
    `✓ Tables found: ${tableNames.length}`
  );

  console.log(
    `✓ Required tables present: ${REQUIRED_TABLES.length}`
  );

  console.log(
    `✓ Trip Planner settings present: ${plannerSettingKeys.length}`
  );

  console.log(
    `✓ Active Home sections: ${homeCounts.active_sections}`
  );

  console.log(
    `✓ Active Home quick actions: ${homeCounts.active_quick_actions}`
  );

  console.log(
    "✓ External runtime image URLs: 0"
  );

  console.log(
    `✓ Foreign keys found: ${foreignKeyCount.foreign_key_count}`
  );

  console.log(
    `✓ Published places: ${seedCounts.published_places}`
  );

  console.log(
    `✓ Approved events: ${seedCounts.approved_events}`
  );

  console.log(
    `✓ Approved properties: ${seedCounts.approved_properties}`
  );

  console.log(
    `✓ Public guides: ${seedCounts.public_guides}`
  );

  console.log(
    "------------------------------------------"
  );
};

/* =========================================================
   CREATE UNIQUE TEMP VALIDATION DB NAME
========================================================= */

const makeValidationDatabaseName =
  () => {
    const stamp =
      new Date()
        .toISOString()
        .replace(
          /[-:TZ.]/g,
          ""
        )
        .slice(
          0,
          14
        );

    return sanitizeIdentifier(
      `${PROJECT_DATABASE_NAME}_validation_${stamp}`
    );
  };

/* =========================================================
   SAFE VALIDATION

   This is the command you should use now.

   Your real tourismhub_lk database is untouched.
========================================================= */

const runSafeValidation = async (
  connection,
  schemaSql,
  seedSql
) => {
  const validationDatabaseName =
    makeValidationDatabaseName();

  console.log("");
  console.log(
    "=========================================="
  );

  console.log(
    " TripLanka - SAFE DB Validation"
  );

  console.log(
    "=========================================="
  );

  console.log(
    `Current DB stays untouched: ${PROJECT_DATABASE_NAME}`
  );

  console.log(
    `Temporary DB: ${validationDatabaseName}`
  );

  try {
    const validationSchemaSql =
      replaceProjectDatabaseName(
        schemaSql,
        validationDatabaseName
      );

    const validationSeedSql =
      replaceProjectDatabaseName(
        seedSql,
        validationDatabaseName
      );

    await runSql(
      connection,
      validationSchemaSql,
      "schema.sql in temporary database"
    );

    await runSql(
      connection,
      validationSeedSql,
      "seed.sql in temporary database"
    );

    await validateDatabase(
      connection,
      validationDatabaseName
    );

    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      " SAFE fresh-database validation PASSED"
    );

    console.log(
      "=========================================="
    );

    console.log("");
  } finally {
    try {
      await connection.query(
        `
        DROP DATABASE IF EXISTS
        ${quoteIdentifier(
          validationDatabaseName
        )}
        `
      );

      console.log(
        `✓ Temporary validation database removed: ${validationDatabaseName}`
      );
    } catch (
      cleanupError
    ) {
      console.error(
        `Warning: could not remove temporary validation database: ${cleanupError.message}`
      );
    }
  }
};

/* =========================================================
   DESTRUCTIVE RESET

   NOT for the current DB right now.

   Requires BOTH:
     --reset
     --confirm
========================================================= */

const runDestructiveReset =
  async (
    connection,
    schemaSql,
    seedSql
  ) => {
    const configuredDatabaseName =
      sanitizeIdentifier(
        process.env.DB_NAME ||
          PROJECT_DATABASE_NAME
      );

    if (
      configuredDatabaseName !==
      PROJECT_DATABASE_NAME
    ) {
      throw new Error(
        `DB_NAME must be ${PROJECT_DATABASE_NAME} before using --reset.`
      );
    }

    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      " TripLanka - DESTRUCTIVE DB RESET"
    );

    console.log(
      "=========================================="
    );

    console.log(
      `Database that will be recreated: ${PROJECT_DATABASE_NAME}`
    );

    await runSql(
      connection,
      schemaSql,
      "schema.sql"
    );

    await runSql(
      connection,
      seedSql,
      "seed.sql"
    );

    await validateDatabase(
      connection,
      PROJECT_DATABASE_NAME
    );

    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      " Database reset completed successfully."
    );

    console.log(
      "=========================================="
    );

    console.log("");
  };

/* =========================================================
   USAGE
========================================================= */

const printUsage = () => {
  console.log(
    "TripLanka database command"
  );

  console.log("");

  console.log(
    "SAFE fresh-install validation:"
  );

  console.log(
    "  node scripts/setupDatabase.js --validate"
  );

  console.log("");

  console.log(
    "DESTRUCTIVE development reset:"
  );

  console.log(
    "  node scripts/setupDatabase.js --reset --confirm"
  );

  console.log("");

  console.log(
    "Running without one of these modes does nothing."
  );
};

/* =========================================================
   MAIN
========================================================= */

const main = async () => {
  let connection = null;

  try {
    const args =
      new Set(
        process.argv.slice(2)
      );

    const wantsValidation =
      args.has(
        "--validate"
      );

    const wantsReset =
      args.has(
        "--reset"
      );

    const confirmedReset =
      args.has(
        "--confirm"
      );

    if (
      wantsValidation &&
      wantsReset
    ) {
      throw new Error(
        "Choose either --validate or --reset, not both."
      );
    }

    if (
      !wantsValidation &&
      !wantsReset
    ) {
      printUsage();
      return;
    }

    if (
      wantsReset &&
      !confirmedReset
    ) {
      throw new Error(
        "Reset blocked. Use --reset --confirm only when you intentionally want to drop and recreate tourismhub_lk."
      );
    }

    validateEnvironment();

    const {
      schemaSql,
      seedSql,
    } =
      getDatabaseFiles();

    connection =
      await createConnection();

    console.log(
      "✓ Connected to MySQL server."
    );

    if (
      wantsValidation
    ) {
      await runSafeValidation(
        connection,
        schemaSql,
        seedSql
      );
    } else {
      await runDestructiveReset(
        connection,
        schemaSql,
        seedSql
      );
    }
  } catch (error) {
    console.error("");

    console.error(
      "=========================================="
    );

    console.error(
      " TripLanka database operation FAILED"
    );

    console.error(
      "=========================================="
    );

    console.error(
      error.message
    );

    if (error.code) {
      console.error(
        `MySQL error code: ${error.code}`
      );
    }

    if (
      error.sqlMessage
    ) {
      console.error(
        `MySQL message: ${error.sqlMessage}`
      );
    }

    console.error("");

    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();

      console.log(
        "MySQL connection closed."
      );
    }
  }
};

main();