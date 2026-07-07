const pool = require("../config/db");

const buildUploadUrl = (req) =>
  `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);

const monthNumbers = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

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

const normalizeStatus = (status) => {
  if (status === "published") return "approved";
  return status || "pending";
};

const mapPartnerEvent = (row) => ({
  id: row.id,
  slug: row.slug,
  partner_id: row.partner_id,
  property_id: row.property_id,
  property_name: row.property_name,
  explore_place_id: row.explore_place_id,
  explore_place_name: row.explore_place_name,
  title: row.title,
  category: row.category,
  city: row.city,
  district: row.district,
  venue: row.venue,
  month_name: row.month_name,
  month_number: row.month_number,
  event_date: row.event_date,
  date_label: row.date_label,
  time_label: row.time_label,
  price_type: row.price_type,
  price: Number(row.price || 0),
  duration: row.duration,
  short_description: row.short_description,
  description: row.description,
  image_url: row.image_url,
  map_url: row.map_url,
  contact_name: row.contact_name,
  contact_phone: row.contact_phone,
  contact_email: row.contact_email,
  near_hotels: parseJson(row.near_hotels, []),
  highlights: parseJson(row.highlights, []),
  guide_recommended: Boolean(row.guide_recommended),
  featured: Boolean(row.featured),
  status: normalizeStatus(row.status),
  rejection_reason: row.rejection_reason,
  submitted_at: row.submitted_at,
  approved_at: row.approved_at,
  approved_by: row.approved_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const ensurePartnerOwnsProperty = async (propertyId, partnerId) => {
  if (!propertyId) return null;

  const [rows] = await pool.query(
    `SELECT id, name, city, district, address
     FROM properties
     WHERE id = ? AND partner_id = ?
     LIMIT 1`,
    [propertyId, partnerId]
  );

  return rows[0] || null;
};

const createUniqueSlug = async (title, currentEventId = null) => {
  const baseSlug = slugify(title) || `event-${Date.now()}`;
  let nextSlug = baseSlug;
  let counter = 1;

  while (true) {
    const params = [nextSlug];
    let sql = "SELECT id FROM tourist_events WHERE slug = ?";

    if (currentEventId) {
      sql += " AND id <> ?";
      params.push(currentEventId);
    }

    sql += " LIMIT 1";

    const [rows] = await pool.query(sql, params);

    if (rows.length === 0) return nextSlug;

    counter += 1;
    nextSlug = `${baseSlug}-${counter}`;
  }
};

const getMyPartnerEvents = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        e.*,
        p.name AS property_name,
        NULL AS explore_place_name
       FROM tourist_events e
       LEFT JOIN properties p ON p.id = e.property_id
       WHERE e.partner_id = ?
       ORDER BY e.updated_at DESC, e.id DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: rows.length,
      events: rows.map(mapPartnerEvent),
    });
  } catch (error) {
    console.error("Get partner events error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading partner events",
    });
  }
};

const getMyPartnerEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT
        e.*,
        p.name AS property_name,
        NULL AS explore_place_name
       FROM tourist_events e
       LEFT JOIN properties p ON p.id = e.property_id
       WHERE e.id = ? AND e.partner_id = ?
       LIMIT 1`,
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.json({ success: true, event: mapPartnerEvent(rows[0]) });
  } catch (error) {
    console.error("Get partner event error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading event details",
    });
  }
};

const uploadPartnerEventImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image file is required" });
    }

    return res.json({ success: true, image_url: buildUploadUrl(req) });
  } catch (error) {
    console.error("Upload partner event image error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while uploading event image",
    });
  }
};

const validateEventPayload = async (body, partnerId) => {
  const {
    property_id,
    title,
    category,
    city,
    venue,
    month_name,
    time_label,
    price_type,
    price,
    short_description,
    description,
  } = body;

  if (!title || !category || !city || !venue || !month_name || !time_label) {
    return "Title, category, city, venue, month, and time are required.";
  }

  if (!short_description || !description) {
    return "Short description and full description are required.";
  }

  if (!["Free", "Budget", "Paid", "Premium"].includes(price_type || "Budget")) {
    return "Invalid price type.";
  }

  if (Number(price || 0) < 0) {
    return "Price cannot be negative.";
  }

  if (property_id) {
    const property = await ensurePartnerOwnsProperty(property_id, partnerId);

    if (!property) {
      return "Selected property does not belong to your partner account.";
    }
  }

  return "";
};

const buildEventValues = (body) => {
  const monthName = body.month_name || "January";
  const monthNumber = Number(body.month_number || monthNumbers[monthName] || 1);
  const highlights = parseList(body.highlights);
  const nearHotels = parseList(body.near_hotels);

  return {
    property_id: body.property_id || null,
    explore_place_id: body.explore_place_id || null,
    title: String(body.title || "").trim(),
    category: body.category || "Hotel Experience",
    city: String(body.city || "").trim(),
    district: body.district || null,
    venue: String(body.venue || "").trim(),
    month_name: monthName,
    month_number: monthNumber,
    event_date: body.event_date || null,
    date_label: body.date_label || "Upcoming",
    time_label: body.time_label || "Time will be confirmed",
    price_type: body.price_type || "Budget",
    price: Number(body.price || 0),
    duration: body.duration || null,
    short_description: body.short_description || null,
    description: body.description || null,
    image_url: body.image_url || null,
    map_url: body.map_url || null,
    contact_name: body.contact_name || null,
    contact_phone: body.contact_phone || null,
    contact_email: body.contact_email || null,
    near_hotels: JSON.stringify(nearHotels),
    highlights: JSON.stringify(highlights),
    guide_recommended: Boolean(body.guide_recommended),
    featured: Boolean(body.featured),
  };
};

const createMyPartnerEvent = async (req, res) => {
  try {
    const validationError = await validateEventPayload(req.body, req.user.id);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const values = buildEventValues(req.body);
    const slug = await createUniqueSlug(values.title);

    const [result] = await pool.query(
      `INSERT INTO tourist_events
       (
        slug,
        partner_id,
        property_id,
        explore_place_id,
        title,
        category,
        city,
        district,
        venue,
        month_name,
        month_number,
        event_date,
        date_label,
        time_label,
        price_type,
        price,
        duration,
        short_description,
        description,
        image_url,
        map_url,
        contact_name,
        contact_phone,
        contact_email,
        near_hotels,
        highlights,
        guide_recommended,
        featured,
        status,
        rejection_reason,
        submitted_at,
        approved_at,
        approved_by
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NOW(), NULL, NULL)`,
      [
        slug,
        req.user.id,
        values.property_id,
        values.explore_place_id,
        values.title,
        values.category,
        values.city,
        values.district,
        values.venue,
        values.month_name,
        values.month_number,
        values.event_date,
        values.date_label,
        values.time_label,
        values.price_type,
        values.price,
        values.duration,
        values.short_description,
        values.description,
        values.image_url,
        values.map_url,
        values.contact_name,
        values.contact_phone,
        values.contact_email,
        values.near_hotels,
        values.highlights,
        values.guide_recommended,
        values.featured,
      ]
    );

    const [rows] = await pool.query(
      `SELECT e.*, p.name AS property_name, NULL AS explore_place_name
       FROM tourist_events e
       LEFT JOIN properties p ON p.id = e.property_id
       WHERE e.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Event submitted successfully. It is pending admin approval.",
      event: mapPartnerEvent(rows[0]),
    });
  } catch (error) {
    console.error("Create partner event error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating event",
    });
  }
};

const updateMyPartnerEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      `SELECT id, slug, title FROM tourist_events WHERE id = ? AND partner_id = ? LIMIT 1`,
      [id, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const validationError = await validateEventPayload(req.body, req.user.id);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const values = buildEventValues(req.body);
    const slug =
      values.title !== existing[0].title
        ? await createUniqueSlug(values.title, id)
        : existing[0].slug;

    await pool.query(
      `UPDATE tourist_events
       SET
        slug = ?,
        property_id = ?,
        explore_place_id = ?,
        title = ?,
        category = ?,
        city = ?,
        district = ?,
        venue = ?,
        month_name = ?,
        month_number = ?,
        event_date = ?,
        date_label = ?,
        time_label = ?,
        price_type = ?,
        price = ?,
        duration = ?,
        short_description = ?,
        description = ?,
        image_url = ?,
        map_url = ?,
        contact_name = ?,
        contact_phone = ?,
        contact_email = ?,
        near_hotels = ?,
        highlights = ?,
        guide_recommended = ?,
        featured = ?,
        status = 'pending',
        rejection_reason = NULL,
        submitted_at = NOW(),
        approved_at = NULL,
        approved_by = NULL
       WHERE id = ? AND partner_id = ?`,
      [
        slug,
        values.property_id,
        values.explore_place_id,
        values.title,
        values.category,
        values.city,
        values.district,
        values.venue,
        values.month_name,
        values.month_number,
        values.event_date,
        values.date_label,
        values.time_label,
        values.price_type,
        values.price,
        values.duration,
        values.short_description,
        values.description,
        values.image_url,
        values.map_url,
        values.contact_name,
        values.contact_phone,
        values.contact_email,
        values.near_hotels,
        values.highlights,
        values.guide_recommended,
        values.featured,
        id,
        req.user.id,
      ]
    );

    const [rows] = await pool.query(
      `SELECT e.*, p.name AS property_name, NULL AS explore_place_name
       FROM tourist_events e
       LEFT JOIN properties p ON p.id = e.property_id
       WHERE e.id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: "Event updated and resubmitted for admin approval.",
      event: mapPartnerEvent(rows[0]),
    });
  } catch (error) {
    console.error("Update partner event error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating event",
    });
  }
};

const updateMyPartnerEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['hidden', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Partners can only hide an approved event or resubmit an event as pending.",
      });
    }

    const [eventRows] = await pool.query(
      `SELECT id, status FROM tourist_events WHERE id = ? AND partner_id = ? LIMIT 1`,
      [id, req.user.id]
    );

    if (eventRows.length === 0) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (status === 'hidden' && normalizeStatus(eventRows[0].status) !== 'approved') {
      return res.status(400).json({
        success: false,
        message: "Only approved events can be hidden by partner.",
      });
    }

    const updates = status === 'pending'
      ? `status = 'pending', rejection_reason = NULL, submitted_at = NOW(), approved_at = NULL, approved_by = NULL`
      : `status = 'hidden'`;

    await pool.query(
      `UPDATE tourist_events SET ${updates} WHERE id = ? AND partner_id = ?`,
      [id, req.user.id]
    );

    return res.json({ success: true, message: "Event status updated" });
  } catch (error) {
    console.error("Update partner event status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating event status",
    });
  }
};

const deleteMyPartnerEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM tourist_events WHERE id = ? AND partner_id = ?`,
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete partner event error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting event",
    });
  }
};

module.exports = {
  getMyPartnerEvents,
  getMyPartnerEventById,
  uploadPartnerEventImage,
  createMyPartnerEvent,
  updateMyPartnerEvent,
  updateMyPartnerEventStatus,
  deleteMyPartnerEvent,
};
