const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.registerPartner = async (req, res) => {
  const { name, email, password, phone, hotel_name, city } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO partners (name, email, password, phone, hotel_name, city)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, email, hashedPassword, phone, hotel_name, city], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Partner registration failed" });
      }

      res.json({ message: "Partner registered successfully" });
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
exports.loginPartner = (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM partners WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Partner not found" });
    }

    const partner = results[0];

    const match = await bcrypt.compare(password, partner.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: partner.partner_id },
      "secretkey",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Partner login successful",
      token: token
    });
  });
};