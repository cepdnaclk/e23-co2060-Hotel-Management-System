const pool = require("../config/db");

// Public tourist pages must show every property after admin approval.
// Payment pages can still manage fees separately, but payment should not hide
// an admin-approved property from the Hotels page.
const publicVisibilityWhere = "p.status = 'approved'";

const buildPropertyFilters = (query = {}) => {
  const conditions = [publicVisibilityWhere];
  const params = [];

  const search = String(query.search || query.q || "").trim().toLowerCase();
  const city = String(query.city || "").trim().toLowerCase();
  const propertyType = String(query.property_type || query.type || "").trim();
  const minPrice = query.min_price !== undefined ? Number(query.min_price) : null;
  const maxPrice = query.max_price !== undefined ? Number(query.max_price) : null;

  if (search) {
    const like = `%${search}%`;
    conditions.push(`(
      LOWER(p.name) LIKE ? OR
      LOWER(p.city) LIKE ? OR
      LOWER(COALESCE(p.district, '')) LIKE ? OR
      LOWER(COALESCE(p.address, '')) LIKE ? OR
      LOWER(COALESCE(p.description, '')) LIKE ? OR
      LOWER(COALESCE(p.property_type, '')) LIKE ?
    )`);
    params.push(like, like, like, like, like, like);
  }

  if (city) {
    conditions.push("LOWER(p.city) = ?");
    params.push(city);
  }

  if (propertyType) {
    conditions.push("p.property_type = ?");
    params.push(propertyType);
  }

  if (Number.isFinite(minPrice)) {
    conditions.push(`(
      SELECT COALESCE(MIN(rp.price_per_night), 0)
      FROM rooms rp
      WHERE rp.property_id = p.id
    ) >= ?`);
    params.push(minPrice);
  }

  if (Number.isFinite(maxPrice)) {
    conditions.push(`(
      SELECT COALESCE(MIN(rp.price_per_night), 0)
      FROM rooms rp
      WHERE rp.property_id = p.id
    ) <= ?`);
    params.push(maxPrice);
  }

  return { whereSql: conditions.join(" AND "), params };
};

const getApprovedProperties = async (req, res) => {
  try {
    const { whereSql, params } = buildPropertyFilters(req.query);

    const [properties] = await pool.query(
      `SELECT
        p.id, p.name, p.city, p.district, p.address, p.description, p.quote,
        p.logo_url, p.hero_title, p.theme_color, p.property_type, p.status,
        p.is_verified, p.plan_type, p.room_limit, p.created_at,
        pp.image_url AS main_image,
        MIN(r.price_per_night) AS starting_price,
        COALESCE(SUM(r.total_rooms), 0) AS total_rooms_count
       FROM properties p
       LEFT JOIN property_photos pp ON p.id = pp.property_id AND pp.is_main = TRUE
       LEFT JOIN rooms r ON p.id = r.property_id
       WHERE ${whereSql}
       GROUP BY p.id, pp.image_url
       ORDER BY p.created_at DESC`,
      params
    );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error("Get approved properties error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting approved hotels",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

const getApprovedPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const [properties] = await pool.query(
      `SELECT p.*, u.full_name AS partner_name
       FROM properties p
       JOIN users u ON p.partner_id = u.id
       WHERE p.id = ? AND ${publicVisibilityWhere}`,
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Property not found or not approved yet",
      });
    }

    const [photos] = await pool.query(
      `SELECT id, image_url, is_main
       FROM property_photos
       WHERE property_id = ?
       ORDER BY is_main DESC, id ASC`,
      [id]
    );

    const [policies] = await pool.query(
      `SELECT check_in_time, check_out_time, cancellation_policy,
              day_package_available, night_package_available
       FROM property_policies
       WHERE property_id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: { ...properties[0], photos, policies: policies[0] || null },
    });
  } catch (error) {
    console.error("Get approved property by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting property details",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

const getApprovedPropertyRooms = async (req, res) => {
  try {
    const { id } = req.params;

    const [properties] = await pool.query(
      `SELECT p.id FROM properties p WHERE p.id = ? AND ${publicVisibilityWhere}`,
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Property not found or not approved yet",
      });
    }

    const [rooms] = await pool.query(
      `SELECT r.id, r.property_id, r.room_type, r.capacity, r.base_occupancy,
        r.price_per_night, r.extra_person_price, r.price_per_day,
        r.total_rooms, r.available_rooms, r.created_at,
        rp.image_url AS main_image
       FROM rooms r
       LEFT JOIN room_photos rp ON r.id = rp.room_id AND rp.is_main = TRUE
       WHERE r.property_id = ?
       ORDER BY r.price_per_night ASC`,
      [id]
    );

    return res.status(200).json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    console.error("Get approved property rooms error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting rooms",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

module.exports = {
  getApprovedProperties,
  getApprovedPropertyById,
  getApprovedPropertyRooms,
};
