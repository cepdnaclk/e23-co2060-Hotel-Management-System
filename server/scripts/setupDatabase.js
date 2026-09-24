const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

/* =========================================================
   TOURISMHUB LK DATABASE SETUP

   Execution order:

   1. database/schema.sql
   2. database/trip_planner_migration.sql
   3. database/seed.sql

   IMPORTANT:
   schema.sql drops and recreates tourismhub_lk.
   This script is for development/fresh setup.
========================================================= */


const readSqlFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `SQL file was not found: ${filePath}`
    );
  }

  return fs.readFileSync(
    filePath,
    "utf8"
  );
};


const runSqlFile = async (
  connection,
  filePath,
  displayName
) => {
  console.log("");
  console.log(
    `Running ${displayName}...`
  );

  const sql =
    readSqlFile(filePath);

  if (!sql.trim()) {
    throw new Error(
      `${displayName} is empty.`
    );
  }

  await connection.query(sql);

  console.log(
    `✓ ${displayName} completed successfully.`
  );
};


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
      `Missing required .env values: ${missing.join(
        ", "
      )}`
    );
  }
};


const setupDatabase = async () => {
  let connection = null;

  try {
    console.log(
      "=========================================="
    );

    console.log(
      " TourismHub LK - Database Setup"
    );

    console.log(
      "=========================================="
    );


    validateEnvironment();


    /*
      Do NOT connect directly to DB_NAME here.

      schema.sql itself contains:

      DROP DATABASE IF EXISTS tourismhub_lk;
      CREATE DATABASE tourismhub_lk;
      USE tourismhub_lk;

      Therefore we connect only to the MySQL server first.
    */

    connection =
      await mysql.createConnection({
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


    console.log(
      "✓ Connected to MySQL server."
    );


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


    const tripPlannerMigrationPath =
      path.join(
        databaseDirectory,
        "trip_planner_migration.sql"
      );


    const seedPath =
      path.join(
        databaseDirectory,
        "seed.sql"
      );


    await runSqlFile(
      connection,
      schemaPath,
      "schema.sql"
    );


    await runSqlFile(
      connection,
      tripPlannerMigrationPath,
      "trip_planner_migration.sql"
    );


    await runSqlFile(
      connection,
      seedPath,
      "seed.sql"
    );


    /*
      Final simple verification.
    */

    const databaseName =
      process.env.DB_NAME ||
      "tourismhub_lk";


    const safeDatabaseName =
      databaseName.replace(
        /[^a-zA-Z0-9_]/g,
        ""
      );


    if (!safeDatabaseName) {
      throw new Error(
        "DB_NAME is invalid."
      );
    }


    await connection.query(
      `USE \`${safeDatabaseName}\``
    );


    const [tables] =
      await connection.query(
        `
        SHOW TABLES
        `
      );


    console.log("");
    console.log(
      `✓ Database contains ${tables.length} tables.`
    );


    const [
      tripPlannerTables,
    ] =
      await connection.query(
        `
        SHOW TABLES LIKE 'trip%'
        `
      );


    console.log(
      `✓ Trip Planner tables found: ${tripPlannerTables.length}`
    );


    const [
      plannerSettings,
    ] =
      await connection.query(
        `
        SELECT
          setting_key
        FROM explore_settings
        WHERE setting_key LIKE 'trip_planner%'
        ORDER BY setting_key
        `
      );


    console.log(
      `✓ Trip Planner settings found: ${plannerSettings.length}`
    );


    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      " Database setup completed successfully."
    );

    console.log(
      "=========================================="
    );

    console.log("");
  } catch (error) {
    console.error("");
    console.error(
      "=========================================="
    );

    console.error(
      " Database setup FAILED"
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


    if (error.sqlMessage) {
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


setupDatabase();