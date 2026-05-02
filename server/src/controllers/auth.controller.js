const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const sendUserResponse = (res, user, message) => {
  const token = generateToken(user);

  return res.status(200).json({
    success: true,
    message,
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      nationality: user.nationality,
      national_id: user.national_id,
      role: user.role,
    },
  });
};

const isValidPhone = (phone) => {
  const value = String(phone || "").trim();

  if (!value) return false;

  return /^\+\d{1,4}(\s?\d{1,5}){1,6}$/.test(value);
};

const validateStrongPassword = (password) => {
  const value = String(password || "");

  const hasMinLength = value.length >= 8;
  const hasCapital = /[A-Z]/.test(value);
  const hasSimple = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  if (hasMinLength && hasCapital && hasSimple && hasNumber && hasSymbol) {
    return "";
  }

  return "Password must be at least 8 characters and contain a capital letter, simple letter, number, and symbol.";
};

const normalizeEmail = (email) => {
  return String(email || "").trim().toLowerCase();
};

const registerTourist = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      nationality,
      national_id,
      password,
      confirm_password,
    } = req.body;

    if (
      !full_name ||
      !email ||
      !phone ||
      !nationality ||
      !password ||
      !confirm_password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, email, nationality, phone, password, and confirm password are required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter phone number with country code. Example: +94 71 56 48 460",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const passwordError = validateStrongPassword(password);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const cleanEmail = normalizeEmail(email);

    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users
       (full_name, email, phone, nationality, national_id, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 'tourist', TRUE)`,
      [
        String(full_name).trim(),
        cleanEmail,
        String(phone).trim(),
        nationality,
        national_id || null,
        passwordHash,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Tourist registered successfully",
    });
  } catch (error) {
    console.error("Tourist register error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while registering tourist",
      error: error.message,
    });
  }
};

const registerPartner = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      nationality,
      password,
      confirm_password,
    } = req.body;

    if (
      !full_name ||
      !email ||
      !phone ||
      !nationality ||
      !password ||
      !confirm_password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name / corporation name, email, nationality, phone, password, and confirm password are required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter phone number with country code. Example: +94 71 56 48 460",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const passwordError = validateStrongPassword(password);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const cleanEmail = normalizeEmail(email);

    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users
       (full_name, email, phone, nationality, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'partner', TRUE)`,
      [
        String(full_name).trim(),
        cleanEmail,
        String(phone).trim(),
        nationality,
        passwordHash,
      ]
    );

    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, ?)`,
        [
          result.insertId,
          "Partner account created",
          "Your partner account was created successfully. You can now register your properties.",
          "success",
        ]
      );
    } catch (notificationError) {
      console.warn(
        "Partner registration notification skipped:",
        notificationError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Partner registered successfully",
    });
  } catch (error) {
    console.error("Partner register error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while registering partner",
      error: error.message,
    });
  }
};

const registerAdmin = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      confirm_password,
      phone,
      nationality,
      admin_secret,
    } = req.body;

    if (
      !full_name ||
      !email ||
      !password ||
      !confirm_password ||
      !phone ||
      !nationality ||
      !admin_secret
    ) {
      return res.status(400).json({
        success: false,
        message: "All admin registration details are required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter phone number with country code. Example: +94 71 56 48 460",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

    const passwordError = validateStrongPassword(password);

    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    if (admin_secret !== process.env.ADMIN_REGISTRATION_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Invalid admin secret key",
      });
    }

    const cleanEmail = normalizeEmail(email);

    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users
       (full_name, email, password_hash, phone, nationality, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'admin', TRUE)`,
      [
        String(full_name).trim(),
        cleanEmail,
        passwordHash,
        String(phone).trim(),
        nationality,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        id: result.insertId,
        full_name: String(full_name).trim(),
        email: cleanEmail,
        phone: String(phone).trim(),
        nationality,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin register error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while registering admin",
      error: error.message,
    });
  }
};

const loginByRole = async (req, res, requiredRole) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const cleanEmail = normalizeEmail(email);

    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND role = ? AND is_active = TRUE",
      [cleanEmail, requiredRole]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return sendUserResponse(res, user, "Login successful");
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while logging in",
      error: error.message,
    });
  }
};

const loginTourist = async (req, res) => {
  return loginByRole(req, res, "tourist");
};

const loginPartner = async (req, res) => {
  return loginByRole(req, res, "partner");
};

const loginAdmin = async (req, res) => {
  return loginByRole(req, res, "admin");
};

const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT 
        id, 
        full_name, 
        email, 
        phone, 
        nationality, 
        national_id, 
        role, 
        is_active,
        created_at
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error("Get me error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting profile",
      error: error.message,
    });
  }
};

module.exports = {
  registerTourist,
  registerPartner,
  registerAdmin,
  loginTourist,
  loginPartner,
  loginAdmin,
  getMe,
};