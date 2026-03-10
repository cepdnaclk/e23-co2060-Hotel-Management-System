const db = require("../config/db");
const bcrypt = require("bcrypt");

exports.registerUser = async (req, res) => {
  const { name, email, password, phone, country } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (name, email, password, phone, country) VALUES (?, ?, ?, ?, ?)";

    db.query(sql, [name, email, hashedPassword, phone, country], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Registration failed" });
      }

      res.json({ message: "User registered successfully" });
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const jwt = require("jsonwebtoken");

exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.user_id },
      "secretkey",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token: token
    });
  });
};