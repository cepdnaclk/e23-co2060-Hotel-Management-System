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
  partner_id: row.partner_id,
  partner_name: row.partner_name,
  partner_email: row.partner_email,
  partner_phone: row.partner_phone,
  approved_by_name: row.approved_by_name,
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
  submitted_at: row.submitted_at,
  approved_at: row.approved_at,
  approved_by: row.approved_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const getGuideApprovalStats = async () => {
  const [rows] = await pool.query(
    `SELECT
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_guides,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_guides,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_guides,
      SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) AS hidden_guides,
      COUNT(*) AS total_guides
     FROM partner_guides`
  );

  return rows[0] || {
    pending_guides: 0,
    approved_guides: 0,
    rejected_guides: 0,
    hidden_guides: 0,
    total_guides: 0,
  };
};

const getGuidesForAdmin = async (req, res) => {
  try {
    const { status = "all", search = "" } = req.query;
    const params = [];
    const conditions = [];

    if (status !== "all") {
      conditions.push("g.status = ?");
      params.push(status);
    }

    if (search.trim()) {
      const like = `%${search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(g.display_name) LIKE ? OR
        LOWER(g.full_name) LIKE ? OR
        LOWER(g.city) LIKE ? OR
        LOWER(g.guide_type) LIKE ? OR
        LOWER(g.email) LIKE ? OR
        LOWER(u.full_name) LIKE ? OR
        LOWER(u.email) LIKE ?
      )`);
      params.push(like, like, like, like, like, like, like);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [guides] = await pool.query(
      `SELECT
        g.*,
        u.full_name AS partner_name,
        u.email AS partner_email,
        u.phone AS partner_phone,
        a.full_name AS approved_by_name
       FROM partner_guides g
       LEFT JOIN users u ON u.id = g.partner_id
       LEFT JOIN users a ON a.id = g.approved_by
       ${whereSql}
       ORDER BY
        FIELD(g.status, 'pending', 'rejected', 'approved', 'hidden'),
        g.submitted_at DESC,
        g.updated_at DESC,
        g.id DESC`,
      params
    );

    const stats = await getGuideApprovalStats();

    return res.status(200).json({
      success: true,
      count: guides.length,
      stats,
      guides: guides.map(mapGuide),
    });
  } catch (error) {
    console.error("Get admin guides error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading guide approval requests",
      error: error.message,
    });
  }
};

const getGuideForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const [guides] = await pool.query(
      `SELECT
        g.*,
        u.full_name AS partner_name,
        u.email AS partner_email,
        u.phone AS partner_phone,
        a.full_name AS approved_by_name
       FROM partner_guides g
       LEFT JOIN users u ON u.id = g.partner_id
       LEFT JOIN users a ON a.id = g.approved_by
       WHERE g.id = ?
       LIMIT 1`,
      [id]
    );

    if (!guides.length) {
      return res.status(404).json({ success: false, message: "Guide profile not found" });
    }

    return res.status(200).json({ success: true, guide: mapGuide(guides[0]) });
  } catch (error) {
    console.error("Get admin guide detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading guide details",
    });
  }
};

const approveGuide = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [guides] = await connection.query(
      `SELECT id, partner_id, display_name FROM partner_guides WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!guides.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Guide profile not found" });
    }

    await connection.query(
      `UPDATE partner_guides
       SET status = 'approved',
           rejection_reason = NULL,
           approved_by = ?,
           approved_at = NOW()
       WHERE id = ?`,
      [req.user.id, id]
    );

    if (guides[0].partner_id) {
      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, ?)`,
        [
          guides[0].partner_id,
          "Guide profile approved",
          `${guides[0].display_name} was approved and is now visible on the Tourist Guides page.`,
          "approval",
        ]
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Guide profile approved successfully",
      data: { id: Number(id), status: "approved" },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Approve guide error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while approving guide profile",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

const rejectGuide = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason || !rejection_reason.trim()) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const [guides] = await connection.query(
      `SELECT id, partner_id, display_name FROM partner_guides WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!guides.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Guide profile not found" });
    }

    await connection.query(
      `UPDATE partner_guides
       SET status = 'rejected',
           rejection_reason = ?,
           approved_by = NULL,
           approved_at = NULL
       WHERE id = ?`,
      [rejection_reason.trim(), id]
    );

    if (guides[0].partner_id) {
      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, ?)`,
        [
          guides[0].partner_id,
          "Guide profile rejected",
          `${guides[0].display_name} needs changes before approval. Reason: ${rejection_reason.trim()}`,
          "rejection",
        ]
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Guide profile rejected successfully",
      data: { id: Number(id), status: "rejected" },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Reject guide error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while rejecting guide profile",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

const removeGuide = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(`DELETE FROM partner_guides WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Guide profile not found" });
    }

    return res.status(200).json({ success: true, message: "Guide profile removed successfully" });
  } catch (error) {
    console.error("Remove guide error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while removing guide profile",
    });
  }
};

module.exports = {
  getGuidesForAdmin,
  getGuideForAdmin,
  approveGuide,
  rejectGuide,
  removeGuide,
};
