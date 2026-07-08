const pool = require("../config/db");

const parseJson = (value, fallback = []) => {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapGuide = (row) => ({
  id: row.id,
  slug: row.slug,
  display_name: row.display_name,
  guide_type: row.guide_type,
  city: row.city,
  district: row.district,
  base_location: row.base_location,
  languages: parseJson(row.languages, []),
  experience_years: Number(row.experience_years || 0),
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
  registration_payment_status: row.registration_payment_status || "Unpaid",
  promotion_payment_status: row.promotion_payment_status || "Unpaid",
  promotion_expires_at: row.promotion_expires_at,
  is_promoted:
    row.active_promotion === undefined
      ? Boolean(row.is_promoted)
      : Boolean(row.active_promotion),
});

const getPublicGuides = async (req, res) => {
  try {
    const { search = "", city = "", type = "All" } = req.query;
    const params = [];
    const conditions = ["status = 'approved'", "registration_payment_status = 'Paid'"];

    if (city.trim()) {
      conditions.push("LOWER(city) LIKE ?");
      params.push(`%${city.trim().toLowerCase()}%`);
    }

    if (type && type !== "All") {
      conditions.push("LOWER(guide_type) = ?");
      params.push(type.toLowerCase());
    }

    if (search.trim()) {
      const like = `%${search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(display_name) LIKE ? OR
        LOWER(city) LIKE ? OR
        LOWER(district) LIKE ? OR
        LOWER(base_location) LIKE ? OR
        LOWER(guide_type) LIKE ? OR
        LOWER(short_description) LIKE ? OR
        LOWER(bio) LIKE ?
      )`);
      params.push(like, like, like, like, like, like, like);
    }

    const [rows] = await pool.query(
      `SELECT *,
        CASE
          WHEN is_promoted = TRUE
           AND promotion_payment_status = 'Paid'
           AND (promotion_expires_at IS NULL OR promotion_expires_at >= NOW())
          THEN TRUE ELSE FALSE
        END AS active_promotion
       FROM partner_guides
       WHERE ${conditions.join(" AND ")}
       ORDER BY
        CASE
          WHEN is_promoted = TRUE
           AND promotion_payment_status = 'Paid'
           AND (promotion_expires_at IS NULL OR promotion_expires_at >= NOW())
          THEN 0 ELSE 1
        END,
        promotion_sort_order DESC,
        promotion_paid_at DESC,
        rating DESC,
        experience_years DESC,
        updated_at DESC`,
      params
    );

    return res.json({
      success: true,
      count: rows.length,
      guides: rows.map(mapGuide),
    });
  } catch (error) {
    console.error("Get public guides error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading tourist guides",
    });
  }
};

const getPublicGuideBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const [rows] = await pool.query(
      `SELECT *,
        CASE
          WHEN is_promoted = TRUE
           AND promotion_payment_status = 'Paid'
           AND (promotion_expires_at IS NULL OR promotion_expires_at >= NOW())
          THEN TRUE ELSE FALSE
        END AS active_promotion
       FROM partner_guides
       WHERE slug = ?
         AND status = 'approved'
         AND registration_payment_status = 'Paid'
       LIMIT 1`,
      [slug]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Guide not found" });
    }

    return res.json({ success: true, guide: mapGuide(rows[0]) });
  } catch (error) {
    console.error("Get public guide error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading guide details",
    });
  }
};

module.exports = {
  getPublicGuides,
  getPublicGuideBySlug,
};
