const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const resetDemoPasswords = async () => {
  try {
    const adminPassword = await bcrypt.hash("Admin@123", 10);
    const partnerPassword = await bcrypt.hash("Admin@123", 10);
    const touristPassword = await bcrypt.hash("Admin@123", 10);

    await pool.query(
      "UPDATE users SET password_hash = ?, is_active = TRUE WHERE email = ?",
      [adminPassword, "admin@tourismhub.lk"]
    );

    await pool.query(
      "UPDATE users SET password_hash = ?, is_active = TRUE WHERE email = ?",
      [partnerPassword, "partner@demo.lk"]
    );

    await pool.query(
      "UPDATE users SET password_hash = ?, is_active = TRUE WHERE email = ?",
      [touristPassword, "tourist@demo.lk"]
    );

    console.log("Demo passwords reset successfully");
    console.log("Admin: admin@tourismhub.lk / Admin@123");
    console.log("Partner: partner@demo.lk / Admin@123");
    console.log("Tourist: tourist@demo.lk / Admin@123");

    process.exit(0);
  } catch (error) {
    console.error("Password reset failed:", error);
    process.exit(1);
  }
};

resetDemoPasswords();