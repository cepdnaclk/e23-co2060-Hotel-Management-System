const pool = require("../config/db");

const REASONS = ["incorrect_information", "cancelled_event", "misleading_price", "inappropriate_content", "other"];
const STATUSES = ["submitted", "under_review", "resolved", "dismissed"];
const transitions = {
  submitted: ["submitted", "under_review", "dismissed"],
  under_review: ["under_review", "resolved", "dismissed"],
  resolved: ["resolved", "under_review"],
  dismissed: ["dismissed", "under_review"],
};
const positiveId = value => /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value));
const text = value => typeof value === "string" ? value.trim() : "";
const fail = (status, message) => Object.assign(new Error(message), { status });
const publicFields = `r.id, r.event_id, r.event_title, r.reason, r.details, r.status,
  r.admin_response, r.version, r.created_at, r.updated_at, r.resolved_at, e.slug AS event_slug,
  e.status AS event_status, COALESCE(m.is_hidden, 0) AS event_hidden`;
const joins = `FROM event_reports r LEFT JOIN tourist_events e ON e.id = r.event_id
  LEFT JOIN event_moderation m ON m.event_id = r.event_id`;
const sendError = (res, error) => {
  if (!error.status) console.error("Event report error:", error);
  return res.status(error.status || 500).json({ success: false,
    message: error.status ? error.message : "Could not save or load reports. Please try again." });
};

// Lock the event first for all mutations, then the report. This serializes duplicate
// submissions and avoids inconsistent moderation when multiple admins act at once.
const createReport = async (req, res) => {
  const { event_id, reason } = req.body || {};
  const details = text(req.body?.details);
  if (!positiveId(event_id) || !REASONS.includes(reason) || details.length < 10 || details.length > 3000) {
    return res.status(400).json({ success: false, message: "Choose an event and reason, and enter 10–3000 characters of details." });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [events] = await connection.query("SELECT id, title, status FROM tourist_events WHERE id = ? FOR UPDATE", [event_id]);
    const [moderation] = await connection.query("SELECT is_hidden FROM event_moderation WHERE event_id = ?", [event_id]);
    if (!events.length || !["approved", "published"].includes(events[0].status) || moderation[0]?.is_hidden) {
      throw fail(404, "This event is no longer available for reporting.");
    }
    const [existing] = await connection.query(
      "SELECT id FROM event_reports WHERE event_id = ? AND reporter_id = ? AND status IN ('submitted','under_review') LIMIT 1",
      [event_id, req.user.id]);
    if (existing.length) throw fail(409, `You already have an open report for this event (R-${existing[0].id}). Check My Reports.`);
    const [result] = await connection.query(
      "INSERT INTO event_reports (event_id, event_title, reporter_id, reason, details) VALUES (?, ?, ?, ?, ?)",
      [event_id, events[0].title, req.user.id, reason, details]);
    await connection.query("INSERT INTO event_report_history (report_id, actor_id, status) VALUES (?, ?, 'submitted')", [result.insertId, req.user.id]);
    await connection.commit();
    return res.status(201).json({ success: true, report: { id: result.insertId, status: "submitted" }, message: "Report submitted. Follow its progress in My Reports." });
  } catch (error) {
    if (connection) await connection.rollback();
    return sendError(res, error);
  } finally { if (connection) connection.release(); }
};

const listReports = async (req, res) => {
  try {
    const admin = req.user.role === "admin";
    const status = req.query.status || "all";
    if (typeof status !== "string" || (status !== "all" && !STATUSES.includes(status))) throw fail(400, "Invalid report status.");
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw fail(400, "Invalid page.");
    const where = [], params = [];
    if (!admin) { where.push("r.reporter_id = ?"); params.push(req.user.id); }
    if (status !== "all") { where.push("r.status = ?"); params.push(status); }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [count] = await pool.query(`SELECT COUNT(*) AS total FROM event_reports r ${clause}`, params);
    const [reports] = await pool.query(`SELECT ${publicFields}${admin ? ", u.full_name AS reporter_name" : ""}
      ${joins} ${admin ? "LEFT JOIN users u ON u.id = r.reporter_id" : ""} ${clause}
      ORDER BY r.created_at DESC, r.id DESC LIMIT 20 OFFSET ?`, [...params, (page - 1) * 20]);
    return res.json({ success: true, reports, total: Number(count[0].total), page, page_size: 20 });
  } catch (error) { return sendError(res, error); }
};

const getReport = async (req, res) => {
  try {
    if (!positiveId(req.params.id)) throw fail(400, "Invalid report ID.");
    const admin = req.user.role === "admin";
    const [rows] = await pool.query(`SELECT ${publicFields}${admin ? ", u.full_name AS reporter_name" : ""}
      ${joins} ${admin ? "LEFT JOIN users u ON u.id = r.reporter_id" : ""}
      WHERE r.id = ? ${admin ? "" : "AND r.reporter_id = ?"}`,
      admin ? [req.params.id] : [req.params.id, req.user.id]);
    if (!rows.length) throw fail(404, "Report not found.");
    // Moderation reasons and admin identity are internal; tourists see only public responses.
    const [history] = await pool.query(`SELECT id, status, response, created_at
      ${admin ? ", visibility_action, moderation_reason" : ""}
      FROM event_report_history WHERE report_id = ? ORDER BY id`, [req.params.id]);
    return res.json({ success: true, report: { ...rows[0], history } });
  } catch (error) { return sendError(res, error); }
};

const updateReport = async (req, res) => {
  const { status, version, visibility_action = "unchanged" } = req.body || {};
  const response = text(req.body?.admin_response);
  const reason = text(req.body?.moderation_reason);
  if (!positiveId(req.params.id) || !STATUSES.includes(status) || !positiveId(version) ||
      !["unchanged", "hide", "restore"].includes(visibility_action) || response.length > 3000 ||
      (response.length < 10 && ["resolved", "dismissed"].includes(status)) ||
      (visibility_action !== "unchanged" && (reason.length < 10 || reason.length > 1000))) {
    return res.status(400).json({ success: false, message: "Choose a valid status. Closing a report needs a 10–3000 character response; visibility changes need a 10–1000 character reason." });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [refs] = await connection.query("SELECT event_id FROM event_reports WHERE id = ?", [req.params.id]);
    if (!refs.length) throw fail(404, "Report not found.");
    let event;
    if (refs[0].event_id) {
      const [events] = await connection.query("SELECT id, title, partner_id, status FROM tourist_events WHERE id = ? FOR UPDATE", [refs[0].event_id]);
      event = events[0];
    }
    const [rows] = await connection.query("SELECT * FROM event_reports WHERE id = ? FOR UPDATE", [req.params.id]);
    if (!rows.length) throw fail(404, "Report not found.");
    const report = rows[0];
    if (Number(version) !== report.version) throw fail(409, "Another admin updated this report. Refresh before saving again.");
    if (!transitions[report.status].includes(status)) throw fail(400, "Move the report to Under review before resolving it or reopening its outcome.");
    if (visibility_action !== "unchanged") {
      if (!event) throw fail(409, "This event was deleted. Its report can still be reviewed.");
      await connection.query(`INSERT INTO event_moderation (event_id, is_hidden, reason, moderated_by) VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE is_hidden = ?, reason = ?, moderated_by = ?, updated_at = CURRENT_TIMESTAMP`,
        [event.id, visibility_action === "hide" ? 1 : 0, reason, req.user.id, visibility_action === "hide" ? 1 : 0, reason, req.user.id]);
      if (event.partner_id) await connection.query("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'event')",
        [event.partner_id, visibility_action === "hide" ? "Event hidden by admin" : "Event moderation hold removed",
          `${event.title}: ${reason}${visibility_action === "restore" ? " Only approved events appear publicly." : ""}`]);
    }
    await connection.query(`UPDATE event_reports SET status = ?, admin_response = ?, reviewed_by = ?, version = version + 1,
      resolved_at = ${["resolved", "dismissed"].includes(status) ? "COALESCE(resolved_at, NOW())" : "NULL"} WHERE id = ?`,
      [status, response || null, req.user.id, report.id]);
    await connection.query(`INSERT INTO event_report_history (report_id, actor_id, status, response, visibility_action, moderation_reason)
      VALUES (?, ?, ?, ?, ?, ?)`, [report.id, req.user.id, status, response || null, visibility_action, visibility_action === "unchanged" ? null : reason]);
    await connection.query("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'system')",
      [report.reporter_id, `Report R-${report.id} updated`, `Your report about ${report.event_title} is ${status.replaceAll("_", " ")}. View My Reports for the response.`]);
    await connection.commit();
    return res.json({ success: true, message: "Report updated successfully." });
  } catch (error) {
    if (connection) await connection.rollback();
    return sendError(res, error);
  } finally { if (connection) connection.release(); }
};

module.exports = { createReport, listReports, getReport, updateReport };
