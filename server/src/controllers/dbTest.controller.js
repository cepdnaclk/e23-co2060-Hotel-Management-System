const pool = require("../config/db");

const testDatabase = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS database_name");

    res.status(200).json({
      success: true,
      message: "Database connected successfully",
      database: rows[0].database_name,
    });
  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
};

module.exports = {
  testDatabase,
};