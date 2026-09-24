// Run from server/: npm run migrate:event-reports
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../src/config/db");
async function main() {
  try {
    if (!process.env.DB_NAME) throw new Error("Set DB_NAME in server/.env before running the migration.");
    const sql = fs.readFileSync(path.join(__dirname, "../../database/migrations/20260922_event_reports.sql"), "utf8");
    const statements = sql.replace(/^--.*$/gm, "").split(";").map(s => s.trim()).filter(Boolean);
    for (const statement of statements) await pool.query(statement);
    console.log("Event report tables are ready. Existing data was preserved.");
  } catch (error) {
    console.error("Event report migration failed:", error.message);
    process.exitCode = 1;
  } finally { await pool.end(); }
}
main();
