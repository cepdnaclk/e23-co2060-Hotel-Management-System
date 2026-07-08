const pool = require("../config/db");

const GUIDE_REGISTRATION_FEE = 3000;
const GUIDE_PROMOTION_FEE = 1500;
const GUIDE_PROMOTION_DAYS = 30;

const buildUploadUrl = (req) =>
  `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);

const parseJson = (value, fallback = []) => {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
};

const isPromotionActive = (row) => {
  if (!row.is_promoted || row.promotion_payment_status !== "Paid") return false;
  if (!row.promotion_expires_at) return true;
  return new Date(row.promotion_expires_at).getTime() >= Date.now();
};

const mapGuide = (row) => ({
  id: row.id,
  partner_id: row.partner_id,
  slug: row.slug,
  full_name: row.full_name,
  display_name: row.display_name,
  guide_type: row.guide_type,
  city: row.city,
  district: row.district,
  base_location: row.base_location,
  languages: parseJson(row.languages, []),
  experience_years: Number(row.experience_years || 0),
  license_number: row.license_number,
  nic_or_passport: row.nic_or_passport,
  phone: row.phone,
  email: row.email,
  whatsapp_number: row.whatsapp_number,
  price_per_day: Number(row.price_per_day || 0),
  price_per_hour: Number(row.price_per_hour || 0),
  availability: row.availability,
  services: parseJson(row.services, []),
  specialities: parseJson(row.specialities, []),
  short_description: row.short_description,
  bio: row.bio,
  image_url: row.image_url,
  rating: Number(row.rating || 4.8),
  total_reviews: Number(row.total_reviews || 0),
  status: row.status || "pending",
  rejection_reason: row.rejection_reason,
  registration_fee: Number(row.registration_fee || GUIDE_REGISTRATION_FEE),
  registration_payment_status: row.registration_payment_status || "Unpaid",
  registration_paid_at: row.registration_paid_at,
  promotion_fee: Number(row.promotion_fee || GUIDE_PROMOTION_FEE),
  promotion_payment_status: row.promotion_payment_status || "Unpaid",
  promotion_paid_at: row.promotion_paid_at,
  promotion_expires_at: row.promotion_expires_at,
  is_promoted: isPromotionActive(row),
  promotion_sort_order: Number(row.promotion_sort_order || 0),
  submitted_at: row.submitted_at,
  approved_at: row.approved_at,
  approved_by: row.approved_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const createUniqueSlug = async (displayName, city, currentGuideId = null) => {
  const baseSlug = slugify(`${displayName}-${city}`) || `guide-${Date.now()}`;
  let nextSlug = baseSlug;
  let counter = 1;

  while (true) {
    const params = [nextSlug];
    let sql = "SELECT id FROM partner_guides WHERE slug = ?";

    if (currentGuideId) {
      sql += " AND id <> ?";
      params.push(currentGuideId);
    }

    sql += " LIMIT 1";
    const [rows] = await pool.query(sql, params);

    if (!rows.length) return nextSlug;

    counter += 1;
    nextSlug = `${baseSlug}-${counter}`;
  }
};

const validateGuidePayload = (body) => {
  const required = [
    ["full_name", "Full name"],
    ["display_name", "Display name"],
    ["guide_type", "Guide type"],
    ["city", "City"],
    ["phone", "Contact phone"],
    ["email", "Contact email"],
    ["short_description", "Short description"],
    ["bio", "Guide bio"],
  ];

  for (const [key, label] of required) {
    if (!String(body[key] || "").trim()) {
      return `${label} is required.`;
    }
  }

  if (Number(body.experience_years || 0) < 0) {
    return "Experience years cannot be negative.";
  }

  if (Number(body.price_per_day || 0) < 0 || Number(body.price_per_hour || 0) < 0) {
    return "Guide prices cannot be negative.";
  }

  return "";
};

const buildGuideValues = (body) => ({
  full_name: String(body.full_name || "").trim(),
  display_name: String(body.display_name || "").trim(),
  guide_type: String(body.guide_type || "Heritage").trim(),
  city: String(body.city || "").trim(),
  district: body.district || null,
  base_location: body.base_location || null,
  languages: JSON.stringify(parseList(body.languages)),
  experience_years: Number(body.experience_years || 0),
  license_number: body.license_number || null,
  nic_or_passport: body.nic_or_passport || null,
  phone: String(body.phone || "").trim(),
  email: String(body.email || "").trim(),
  whatsapp_number: body.whatsapp_number || null,
  price_per_day: Number(body.price_per_day || 0),
  price_per_hour: Number(body.price_per_hour || 0),
  availability: body.availability || null,
  services: JSON.stringify(parseList(body.services)),
  specialities: JSON.stringify(parseList(body.specialities)),
  short_description: String(body.short_description || "").trim(),
  bio: String(body.bio || "").trim(),
  image_url: body.image_url || null,
});

const getMyGuides = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM partner_guides
       WHERE partner_id = ?
       ORDER BY updated_at DESC, id DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: rows.length,
      guides: rows.map(mapGuide),
    });
  } catch (error) {
    console.error("Get partner guides error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading guide profiles",
    });
  }
};

const getMyGuideById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM partner_guides WHERE id = ? AND partner_id = ? LIMIT 1`,
      [id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Guide profile not found" });
    }

    return res.json({ success: true, guide: mapGuide(rows[0]) });
  } catch (error) {
    console.error("Get partner guide error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading guide profile",
    });
  }
};

const uploadGuideImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image file is required" });
    }

    return res.json({ success: true, image_url: buildUploadUrl(req) });
  } catch (error) {
    console.error("Upload guide image error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while uploading guide image",
    });
  }
};

const createMyGuide = async (req, res) => {
  try {
    const validationError = validateGuidePayload(req.body);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const values = buildGuideValues(req.body);
    const slug = await createUniqueSlug(values.display_name, values.city);

    const [result] = await pool.query(
      `INSERT INTO partner_guides
       (
        partner_id, slug, full_name, display_name, guide_type, city, district, base_location,
        languages, experience_years, license_number, nic_or_passport, phone, email,
        whatsapp_number, price_per_day, price_per_hour, availability, services, specialities,
        short_description, bio, image_url, registration_fee, registration_payment_status,
        promotion_fee, promotion_payment_status, is_promoted, promotion_sort_order,
        status, rejection_reason, submitted_at, approved_at, approved_by
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid', ?, 'Unpaid', FALSE, 0, 'pending', NULL, NOW(), NULL, NULL)`,
      [
        req.user.id,
        slug,
        values.full_name,
        values.display_name,
        values.guide_type,
        values.city,
        values.district,
        values.base_location,
        values.languages,
        values.experience_years,
        values.license_number,
        values.nic_or_passport,
        values.phone,
        values.email,
        values.whatsapp_number,
        values.price_per_day,
        values.price_per_hour,
        values.availability,
        values.services,
        values.specialities,
        values.short_description,
        values.bio,
        values.image_url,
        GUIDE_REGISTRATION_FEE,
        GUIDE_PROMOTION_FEE,
      ]
    );

    const [rows] = await pool.query(`SELECT * FROM partner_guides WHERE id = ?`, [result.insertId]);

    return res.status(201).json({
      success: true,
      message: "Guide profile submitted successfully. It is pending admin approval.",
      guide: mapGuide(rows[0]),
    });
  } catch (error) {
    console.error("Create partner guide error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating guide profile",
    });
  }
};

const updateMyGuide = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      `SELECT id, slug, display_name, city FROM partner_guides WHERE id = ? AND partner_id = ? LIMIT 1`,
      [id, req.user.id]
    );

    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Guide profile not found" });
    }

    const validationError = validateGuidePayload(req.body);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const values = buildGuideValues(req.body);
    const slug =
      values.display_name !== existing[0].display_name || values.city !== existing[0].city
        ? await createUniqueSlug(values.display_name, values.city, id)
        : existing[0].slug;

    await pool.query(
      `UPDATE partner_guides
       SET
        slug = ?, full_name = ?, display_name = ?, guide_type = ?, city = ?, district = ?, base_location = ?,
        languages = ?, experience_years = ?, license_number = ?, nic_or_passport = ?, phone = ?, email = ?,
        whatsapp_number = ?, price_per_day = ?, price_per_hour = ?, availability = ?, services = ?, specialities = ?,
        short_description = ?, bio = ?, image_url = ?, status = 'pending', rejection_reason = NULL,
        submitted_at = NOW(), approved_at = NULL, approved_by = NULL
       WHERE id = ? AND partner_id = ?`,
      [
        slug,
        values.full_name,
        values.display_name,
        values.guide_type,
        values.city,
        values.district,
        values.base_location,
        values.languages,
        values.experience_years,
        values.license_number,
        values.nic_or_passport,
        values.phone,
        values.email,
        values.whatsapp_number,
        values.price_per_day,
        values.price_per_hour,
        values.availability,
        values.services,
        values.specialities,
        values.short_description,
        values.bio,
        values.image_url,
        id,
        req.user.id,
      ]
    );

    const [rows] = await pool.query(`SELECT * FROM partner_guides WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: "Guide profile updated and resubmitted for admin approval.",
      guide: mapGuide(rows[0]),
    });
  } catch (error) {
    console.error("Update partner guide error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating guide profile",
    });
  }
};

const updateMyGuideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["hidden", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Partners can only hide an approved guide or resubmit as pending.",
      });
    }

    const [rows] = await pool.query(
      `SELECT id, status FROM partner_guides WHERE id = ? AND partner_id = ? LIMIT 1`,
      [id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Guide profile not found" });
    }

    if (status === "hidden" && rows[0].status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved guides can be hidden by partner.",
      });
    }

    const updateSql =
      status === "pending"
        ? `status = 'pending', rejection_reason = NULL, submitted_at = NOW(), approved_at = NULL, approved_by = NULL`
        : `status = 'hidden'`;

    await pool.query(`UPDATE partner_guides SET ${updateSql} WHERE id = ? AND partner_id = ?`, [
      id,
      req.user.id,
    ]);

    return res.json({ success: true, message: "Guide status updated" });
  } catch (error) {
    console.error("Update partner guide status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating guide status",
    });
  }
};

const payGuideRegistrationFee = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [guides] = await connection.query(
      `SELECT id, partner_id, registration_fee, registration_payment_status
       FROM partner_guides
       WHERE id = ? AND partner_id = ?
       LIMIT 1`,
      [id, req.user.id]
    );

    if (!guides.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Guide profile not found or you do not own this guide",
      });
    }

    const guide = guides[0];

    if (guide.registration_payment_status === "Paid") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Registration fee is already paid for this guide profile.",
      });
    }

    await connection.query(
      `UPDATE partner_guides
       SET registration_payment_status = 'Paid',
           registration_paid_at = NOW()
       WHERE id = ? AND partner_id = ?`,
      [id, req.user.id]
    );

    try {
      await connection.query(
        `INSERT INTO guide_payment_transactions
         (guide_id, partner_id, payment_type, amount, status, paid_at, notes)
         VALUES (?, ?, 'registration', ?, 'Paid', NOW(), ?)`,
        [
          id,
          guide.partner_id,
          Number(guide.registration_fee || GUIDE_REGISTRATION_FEE),
          "Partner paid guide registration fee",
        ]
      );
    } catch {
      // Keeps older databases usable until the guide payment migration is applied.
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Guide registration fee paid successfully.",
      registration_payment_status: "Paid",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Pay guide registration fee error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while paying guide registration fee",
    });
  } finally {
    connection.release();
  }
};

const payGuidePromotionFee = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [guides] = await connection.query(
      `SELECT id, partner_id, promotion_fee, registration_payment_status
       FROM partner_guides
       WHERE id = ? AND partner_id = ?
       LIMIT 1`,
      [id, req.user.id]
    );

    if (!guides.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Guide profile not found or you do not own this guide",
      });
    }

    const guide = guides[0];

    if (guide.registration_payment_status !== "Paid") {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Please pay the guide registration fee before promoting this guide.",
      });
    }

    await connection.query(
      `UPDATE partner_guides
       SET promotion_payment_status = 'Paid',
           promotion_paid_at = NOW(),
           promotion_expires_at = DATE_ADD(NOW(), INTERVAL ? DAY),
           is_promoted = TRUE,
           promotion_sort_order = UNIX_TIMESTAMP()
       WHERE id = ? AND partner_id = ?`,
      [GUIDE_PROMOTION_DAYS, id, req.user.id]
    );

    try {
      await connection.query(
        `INSERT INTO guide_payment_transactions
         (guide_id, partner_id, payment_type, amount, status, paid_at, notes)
         VALUES (?, ?, 'promotion', ?, 'Paid', NOW(), ?)`,
        [
          id,
          guide.partner_id,
          Number(guide.promotion_fee || GUIDE_PROMOTION_FEE),
          `Partner paid guide top-listing promotion for ${GUIDE_PROMOTION_DAYS} days`,
        ]
      );
    } catch {
      // Keeps older databases usable until the guide payment migration is applied.
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Guide promotion paid successfully. This guide can appear at the top for ${GUIDE_PROMOTION_DAYS} days after approval.`,
      promotion_payment_status: "Paid",
      is_promoted: true,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Pay guide promotion fee error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while paying guide promotion fee",
    });
  } finally {
    connection.release();
  }
};

const deleteMyGuide = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM partner_guides WHERE id = ? AND partner_id = ?`,
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Guide profile not found" });
    }

    return res.json({ success: true, message: "Guide profile deleted successfully" });
  } catch (error) {
    console.error("Delete partner guide error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting guide profile",
    });
  }
};

module.exports = {
  getMyGuides,
  getMyGuideById,
  uploadGuideImage,
  createMyGuide,
  updateMyGuide,
  updateMyGuideStatus,
  payGuideRegistrationFee,
  payGuidePromotionFee,
  deleteMyGuide,
};
