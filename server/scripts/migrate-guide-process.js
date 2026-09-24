// Run from server/: npm run migrate:guide-process
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../src/config/db");

async function main() {
  try {
    if (!process.env.DB_NAME) throw new Error("Set DB_NAME in server/.env before running the migration.");
    const sql = fs.readFileSync(path.join(__dirname, "../../database/migrations/20260923_complete_guide_process.sql"), "utf8");
    const statements = sql
      .replace(/^--.*$/gm, "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !/^USE\s+/i.test(s));
    for (const statement of statements) {
      try { await pool.query(statement); }
      catch (error) {
        // CREATE INDEX is not universally IF-NOT-EXISTS in MySQL. Ignore duplicate index names on reruns.
        if (error.code !== "ER_DUP_KEYNAME") throw error;
      }
    }
    console.log("Complete guide booking/payment/review tables are ready. Existing data was preserved.");
  } catch (error) {
    console.error("Guide process migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
main();
