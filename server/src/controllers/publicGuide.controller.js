const pool = require("../config/db");
const { ensureGuideProcessSchema } = require("../services/guideProcessSchema.service");

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
    const {
      search = "", city = "", type = "All", language = "",
      maxDayPrice = "", minExperience = "", sort = "recommended"
    } = req.query;
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

    if (language.trim()) {
      conditions.push("LOWER(CAST(languages AS CHAR)) LIKE ?");
      params.push(`%${language.trim().toLowerCase()}%`);
    }

    if (maxDayPrice !== "" && Number(maxDayPrice) >= 0) {
      conditions.push("price_per_day <= ?");
      params.push(Number(maxDayPrice));
    }

    if (minExperience !== "" && Number(minExperience) >= 0) {
      conditions.push("experience_years >= ?");
      params.push(Number(minExperience));
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

    const sortMap = {
      rating: "rating DESC, total_reviews DESC, experience_years DESC",
      experience: "experience_years DESC, rating DESC",
      "price-low": "price_per_day ASC, rating DESC",
      "price-high": "price_per_day DESC, rating DESC",
      lowDayPrice: "price_per_day ASC, rating DESC",
      highDayPrice: "price_per_day DESC, rating DESC",
      name: "display_name ASC",
    };
    const secondarySort = sortMap[sort] || "promotion_sort_order DESC, promotion_paid_at DESC, rating DESC, experience_years DESC";

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
        ${secondarySort},
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

const getPublicGuideReviews = async (req, res) => {
  try {
    await ensureGuideProcessSchema();
    const { slug } = req.params;
    const { sort = "recent" } = req.query;
    const orderBy = sort === "rating" ? "gr.rating DESC, gr.created_at DESC" : "gr.created_at DESC";
    const [rows] = await pool.query(
      `SELECT gr.id, gr.rating, gr.comment, gr.created_at, u.full_name AS tourist_name,
              gb.tour_type, gb.booking_date
       FROM guide_reviews gr
       JOIN partner_guides pg ON pg.id = gr.guide_id
       JOIN users u ON u.id = gr.tourist_id
       JOIN guide_bookings gb ON gb.id = gr.booking_id
       WHERE pg.slug = ? AND pg.status = 'approved'
       ORDER BY ${orderBy}`,
      [slug]
    );
    return res.json({ success: true, reviews: rows });
  } catch (error) {
    console.error("Get public guide reviews error:", error);
    return res.status(500).json({ success: false, message: "Server error while loading guide reviews" });
  }
};

module.exports = {
  getPublicGuides,
  getPublicGuideBySlug,
  getPublicGuideReviews,
};
