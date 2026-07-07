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
  priceLabel: Number(row.price || 0) === 0 ? "Free entry" : `LKR ${Number(row.price || 0).toLocaleString()}`,
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
  status: row.status === "published" ? "approved" : row.status,
});

const baseSelect = `
  SELECT e.*
  FROM tourist_events e
`;

const getTouristEvents = async (req, res) => {
  try {
    const { search, category, city, month, price } = req.query;
    const conditions = ["e.status IN ('approved', 'published')"];
    const params = [];

    if (search && search.trim()) {
      const like = `%${search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(e.title) LIKE ? OR
        LOWER(e.category) LIKE ? OR
        LOWER(e.city) LIKE ? OR
        LOWER(e.district) LIKE ? OR
        LOWER(e.venue) LIKE ? OR
        LOWER(JSON_EXTRACT(e.near_hotels, '$')) LIKE ?
      )`);
      params.push(like, like, like, like, like, like);
    }

    if (city && city.trim()) {
      conditions.push("LOWER(e.city) = ?");
      params.push(city.trim().toLowerCase());
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

    const [rows] = await pool.query(
      `${baseSelect}
       WHERE ${conditions.join(" AND ")}
       ORDER BY e.featured DESC, e.month_number ASC, e.id ASC`,
      params
    );

    return res.json({ success: true, count: rows.length, events: rows.map(mapEvent) });
  } catch (error) {
    console.error("Get tourist events error:", error);
    return res.status(500).json({ success: false, message: "Failed to load tourist events" });
  }
};

const getTouristEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const [rows] = await pool.query(
      `${baseSelect} WHERE e.slug = ? AND e.status IN ('approved', 'published') LIMIT 1`,
      [slug]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.json({ success: true, event: mapEvent(rows[0]) });
  } catch (error) {
    console.error("Get tourist event error:", error);
    return res.status(500).json({ success: false, message: "Failed to load tourist event" });
  }
};

const getTouristEventsByPlace = async (req, res) => {
  try {
    const { placeId } = req.params;
    const [rows] = await pool.query(
      `${baseSelect}
       WHERE e.status IN ('approved', 'published')
       AND e.explore_place_id = ?
       ORDER BY e.featured DESC, e.month_number ASC, e.id ASC`,
      [placeId]
    );

    return res.json({ success: true, count: rows.length, events: rows.map(mapEvent) });
  } catch (error) {
    console.error("Get tourist events by place error:", error);
    return res.status(500).json({ success: false, message: "Failed to load place events" });
  }
};

module.exports = {
  getTouristEvents,
  getTouristEventBySlug,
  getTouristEventsByPlace,
};
