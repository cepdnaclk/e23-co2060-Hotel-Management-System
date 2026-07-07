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

const normalizeStatus = (status) => {
  if (status === "published") return "approved";
  return status || "pending";
};

const mapEvent = (row) => ({
  id: row.slug,
  event_id: row.id,
  slug: row.slug,
  explore_place_id: row.explore_place_id,
  explorePlaceId: row.explore_place_id,
  explore_place_slug: null,
  explore_place_name: null,
  title: row.title,
  category: row.category,
  city: row.city,
  district: row.district,
  venue: row.venue,
  month_name: row.month_name,
  monthName: row.month_name,
  date_label: row.date_label,
  dateLabel: row.date_label,
  time_label: row.time_label,
  timeLabel: row.time_label,
  price_type: row.price_type,
  priceType: row.price_type,
  price: Number(row.price || 0),
  priceLabel:
    Number(row.price || 0) === 0
      ? "Free entry"
      : `LKR ${Number(row.price || 0).toLocaleString()}`,
  duration: row.duration,
  short_description: row.short_description,
  shortDescription: row.short_description,
  description: row.description,
  image_url: row.image_url,
  imageUrl: row.image_url,
  map_url: row.map_url,
  mapUrl: row.map_url,
  near_hotels: parseJson(row.near_hotels, []),
  nearHotels: parseJson(row.near_hotels, []),
  highlights: parseJson(row.highlights, []),
  guide_recommended: Boolean(row.guide_recommended),
  guideRecommended: Boolean(row.guide_recommended),
  featured: Boolean(row.featured),
  status: normalizeStatus(row.status),
});

const publicEventWhere = "e.status IN ('approved', 'published')";

const buildEventFilters = (query = {}) => {
  const conditions = [publicEventWhere];
  const params = [];

  const search = String(query.search || query.q || "").trim().toLowerCase();
  const city = String(query.city || "").trim().toLowerCase();
  const category = String(query.category || "").trim();
  const month = String(query.month || "").trim();
  const price = String(query.price || "").trim();

  if (search) {
    const like = `%${search}%`;
    conditions.push(`(
      LOWER(e.title) LIKE ? OR
      LOWER(e.category) LIKE ? OR
      LOWER(e.city) LIKE ? OR
      LOWER(COALESCE(e.district, '')) LIKE ? OR
      LOWER(COALESCE(e.venue, '')) LIKE ? OR
      LOWER(COALESCE(e.short_description, '')) LIKE ? OR
      LOWER(COALESCE(e.description, '')) LIKE ? OR
      LOWER(COALESCE(CAST(e.near_hotels AS CHAR), '')) LIKE ? OR
      LOWER(COALESCE(CAST(e.highlights AS CHAR), '')) LIKE ?
    )`);
    params.push(like, like, like, like, like, like, like, like, like);
  }

  if (city) {
    conditions.push("LOWER(e.city) = ?");
    params.push(city);
  }

  if (category && category !== "All") {
    conditions.push("e.category = ?");
    params.push(category);
  }

  if (month && month !== "All Months") {
    conditions.push("e.month_name = ?");
    params.push(month);
  }

  if (price && price !== "Any Price") {
    conditions.push("e.price_type = ?");
    params.push(price);
  }

  return { whereSql: conditions.join(" AND "), params };
};

const baseSelect = `SELECT e.* FROM tourist_events e`;

const getTouristEvents = async (req, res) => {
  try {
    const { whereSql, params } = buildEventFilters(req.query);

    const [rows] = await pool.query(
      `${baseSelect}
       WHERE ${whereSql}
       ORDER BY e.featured DESC, COALESCE(e.month_number, 13) ASC, e.approved_at DESC, e.id DESC`,
      params
    );

    return res.json({ success: true, count: rows.length, events: rows.map(mapEvent) });
  } catch (error) {
    console.error("Get tourist events error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load approved tourist events",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

const getTouristEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const [rows] = await pool.query(
      `${baseSelect} WHERE e.slug = ? AND ${publicEventWhere} LIMIT 1`,
      [slug]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Event not found or not approved yet" });
    }

    return res.json({ success: true, event: mapEvent(rows[0]) });
  } catch (error) {
    console.error("Get tourist event error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load event details",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

const getTouristEventsByPlace = async (req, res) => {
  try {
    const { placeId } = req.params;
    const [rows] = await pool.query(
      `${baseSelect}
       WHERE ${publicEventWhere}
       AND e.explore_place_id = ?
       ORDER BY e.featured DESC, COALESCE(e.month_number, 13) ASC, e.id DESC`,
      [placeId]
    );

    return res.json({ success: true, count: rows.length, events: rows.map(mapEvent) });
  } catch (error) {
    console.error("Get tourist events by place error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load approved place events",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

module.exports = {
  getTouristEvents,
  getTouristEventBySlug,
  getTouristEventsByPlace,
};
