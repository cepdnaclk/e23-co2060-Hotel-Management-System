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

const mapAdminEvent = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  category: row.category,
  city: row.city,
  district: row.district,
  venue: row.venue,
  month_name: row.month_name,
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
  partner_id: row.partner_id,
  partner_name: row.partner_name,
  partner_email: row.partner_email,
  partner_phone: row.partner_phone,
  property_id: row.property_id,
  property_name: row.property_name,
  property_city: row.property_city,
  approved_by_name: row.approved_by_name,
});

const getEventApprovalStats = async () => {
  const [rows] = await pool.query(
    `SELECT
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_events,
      SUM(CASE WHEN status IN ('approved','published') THEN 1 ELSE 0 END) AS approved_events,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_events,
      SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) AS hidden_events,
      COUNT(*) AS total_events
     FROM tourist_events`
  );

  return rows[0] || {
    pending_events: 0,
    approved_events: 0,
    rejected_events: 0,
    hidden_events: 0,
    total_events: 0,
  };
};

const getEventsForAdmin = async (req, res) => {
  try {
    const { status = "all", search = "" } = req.query;
    const params = [];
    const conditions = [];

    if (status !== "all") {
      if (status === "approved") {
        conditions.push("e.status IN ('approved','published')");
      } else {
        conditions.push("e.status = ?");
        params.push(status);
      }
    }

    if (search.trim()) {
      const like = `%${search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(e.title) LIKE ? OR
        LOWER(e.city) LIKE ? OR
        LOWER(e.venue) LIKE ? OR
        LOWER(e.category) LIKE ? OR
        LOWER(u.full_name) LIKE ? OR
        LOWER(u.email) LIKE ? OR
        LOWER(p.name) LIKE ?
      )`);
      params.push(like, like, like, like, like, like, like);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [events] = await pool.query(
      `SELECT
        e.*,
        u.full_name AS partner_name,
        u.email AS partner_email,
        u.phone AS partner_phone,
        p.name AS property_name,
        p.city AS property_city,
        a.full_name AS approved_by_name
       FROM tourist_events e
       LEFT JOIN users u ON u.id = e.partner_id
       LEFT JOIN properties p ON p.id = e.property_id
       LEFT JOIN users a ON a.id = e.approved_by
       ${whereSql}
       ORDER BY
        FIELD(e.status, 'pending', 'rejected', 'approved', 'published', 'hidden'),
        e.submitted_at DESC,
        e.updated_at DESC,
        e.id DESC`,
      params
    );

    const stats = await getEventApprovalStats();

    return res.status(200).json({
      success: true,
      count: events.length,
      stats,
      events: events.map(mapAdminEvent),
    });
  } catch (error) {
    console.error("Get admin events error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading event approval requests",
      error: error.message,
    });
  }
};

const getEventForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const [events] = await pool.query(
      `SELECT
        e.*,
        u.full_name AS partner_name,
        u.email AS partner_email,
        u.phone AS partner_phone,
        p.name AS property_name,
        p.city AS property_city,
        a.full_name AS approved_by_name
       FROM tourist_events e
       LEFT JOIN users u ON u.id = e.partner_id
       LEFT JOIN properties p ON p.id = e.property_id
       LEFT JOIN users a ON a.id = e.approved_by
       WHERE e.id = ?
       LIMIT 1`,
      [id]
    );

    if (!events.length) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.status(200).json({ success: true, event: mapAdminEvent(events[0]) });
  } catch (error) {
    console.error("Get admin event detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading event details",
    });
  }
};

const approveEvent = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [events] = await connection.query(
      `SELECT id, partner_id, title FROM tourist_events WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!events.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    await connection.query(
      `UPDATE tourist_events
       SET status = 'approved',
           rejection_reason = NULL,
           approved_by = ?,
           approved_at = NOW()
       WHERE id = ?`,
      [req.user.id, id]
    );

    if (events[0].partner_id) {
      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, ?)`,
        [
          events[0].partner_id,
          "Event approved",
          `${events[0].title} was approved and is now visible on the tourist Events page.`,
          "approval",
        ]
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Event approved successfully",
      data: { id: Number(id), status: "approved" },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Approve event error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while approving event",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

const rejectEvent = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason || !rejection_reason.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const [events] = await connection.query(
      `SELECT id, partner_id, title FROM tourist_events WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!events.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    await connection.query(
      `UPDATE tourist_events
       SET status = 'rejected',
           rejection_reason = ?,
           approved_by = NULL,
           approved_at = NULL
       WHERE id = ?`,
      [rejection_reason.trim(), id]
    );

    if (events[0].partner_id) {
      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, ?)`,
        [
          events[0].partner_id,
          "Event rejected",
          `${events[0].title} was rejected. Reason: ${rejection_reason.trim()}`,
          "rejection",
        ]
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Event rejected successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Reject event error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while rejecting event",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

const removeEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(`DELETE FROM tourist_events WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.status(200).json({ success: true, message: "Event removed successfully" });
  } catch (error) {
    console.error("Remove event error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while removing event",
    });
  }
};

module.exports = {
  getEventsForAdmin,
  getEventForAdmin,
  approveEvent,
  rejectEvent,
  removeEvent,
};
