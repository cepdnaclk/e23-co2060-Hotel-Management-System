const pool = require("../config/db");
const { ensureGuideProcessSchema } = require("../services/guideProcessSchema.service");

const makeReference = () =>
  `GD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

const notify = async (connection, userId, title, message) => {
  await connection.query(
    `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'booking')`,
    [userId, title, message]
  );
};

const bookingSelect = `
  SELECT gb.*, pg.display_name AS guide_name, pg.slug AS guide_slug,
         pg.image_url AS guide_image_url, pg.city AS guide_city,
         pg.guide_type, pg.status AS guide_status,
         pg.phone AS guide_phone, pg.email AS guide_email,
         pg.whatsapp_number AS guide_whatsapp,
         pg.partner_id,
         u.full_name AS tourist_name, u.email AS tourist_email, u.phone AS tourist_phone,
         gr.id AS review_id, gr.rating AS review_rating, gr.comment AS review_comment
  FROM guide_bookings gb
  JOIN partner_guides pg ON pg.id = gb.guide_id
  JOIN users u ON u.id = gb.tourist_id
  LEFT JOIN guide_reviews gr ON gr.booking_id = gb.id
`;

const getOwnedGuide = async (partnerId, guideId) => {
  const [rows] = await pool.query(
    `SELECT id, display_name, full_name, image_url, city, district, guide_type, status,
            registration_payment_status, price_per_day, price_per_hour
     FROM partner_guides
     WHERE id = ? AND partner_id = ?
     LIMIT 1`,
    [guideId, partnerId]
  );

  return rows[0] || null;
};

const createBooking = async (req, res) => {
  await ensureGuideProcessSchema();
  const connection = await pool.getConnection();

  try {
    const {
      guide_id,
      booking_date,
      start_time = null,
      duration_type = "full_day",
      hours = null,
      guests = 1,
      tour_type = "Personalized tour",
      pickup_location = "",
      message = "",
    } = req.body;

    if (!guide_id || !booking_date) {
      return res.status(400).json({ success: false, message: "Guide and booking date are required." });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(`${booking_date}T00:00:00`);

    if (Number.isNaN(requestedDate.getTime()) || requestedDate < today) {
      return res.status(400).json({ success: false, message: "Choose today or a future booking date." });
    }

    if (!["hourly", "full_day"].includes(duration_type)) {
      return res.status(400).json({ success: false, message: "Invalid booking duration type." });
    }

    if (Number(guests) < 1) {
      return res.status(400).json({ success: false, message: "At least one guest is required." });
    }

    if (
      duration_type === "hourly" &&
      (!Number.isInteger(Number(hours)) || Number(hours) < 1 || Number(hours) > 12)
    ) {
      return res.status(400).json({ success: false, message: "Hourly bookings require 1 to 12 hours." });
    }

    await connection.beginTransaction();

    const [guides] = await connection.query(
      `SELECT * FROM partner_guides
       WHERE id = ? AND status = 'approved' AND registration_payment_status = 'Paid'
       LIMIT 1`,
      [guide_id]
    );

    if (!guides.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "This guide is not available for booking." });
    }

    const guide = guides[0];

    const [conflicts] = await connection.query(
      `SELECT id FROM guide_bookings
       WHERE guide_id = ? AND booking_date = ?
         AND booking_status IN ('approved','confirmed','completed')
         AND (
           duration_type = 'full_day' OR ? = 'full_day'
           OR (
             start_time IS NOT NULL AND ? IS NOT NULL
             AND start_time < ADDTIME(?, SEC_TO_TIME(? * 3600))
             AND ADDTIME(start_time, SEC_TO_TIME(COALESCE(hours, 1) * 3600)) > ?
           )
         )
       LIMIT 1`,
      [guide_id, booking_date, duration_type, start_time, start_time, Number(hours || 1), start_time]
    );

    if (conflicts.length) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "This guide already has an accepted booking at that time." });
    }

    const totalAmount =
      duration_type === "hourly"
        ? Number(guide.price_per_hour || 0) * Number(hours || 1)
        : Number(guide.price_per_day || 0);

    const reference = makeReference();
    const [result] = await connection.query(
      `INSERT INTO guide_bookings
       (booking_reference, guide_id, tourist_id, booking_date, start_time, duration_type, hours, guests,
        tour_type, pickup_location, message, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reference,
        guide_id,
        req.user.id,
        booking_date,
        start_time || null,
        duration_type,
        duration_type === "hourly" ? Number(hours) : null,
        Number(guests),
        tour_type || null,
        pickup_location || null,
        message || null,
        totalAmount,
      ]
    );

    await notify(
      connection,
      guide.partner_id,
      "New guide booking request",
      `${req.user.full_name || "A tourist"} requested ${guide.display_name} for ${booking_date}.`
    );

    await connection.commit();

    const [rows] = await pool.query(`${bookingSelect} WHERE gb.id = ?`, [result.insertId]);
    return res.status(201).json({ success: true, message: "Guide booking request sent.", booking: rows[0] });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}
    console.error("Create guide booking error:", error);
    return res.status(500).json({ success: false, message: "Server error while creating guide booking." });
  } finally {
    connection.release();
  }
};

const getMyBookings = async (req, res) => {
  try {
    await ensureGuideProcessSchema();
    const [rows] = await pool.query(
      `${bookingSelect} WHERE gb.tourist_id = ? ORDER BY gb.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, bookings: rows });
  } catch (error) {
    console.error("Get tourist guide bookings error:", error);
    return res.status(500).json({ success: false, message: "Server error while loading guide bookings." });
  }
};

const payBooking = async (req, res) => {
  await ensureGuideProcessSchema();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `${bookingSelect} WHERE gb.id = ? AND gb.tourist_id = ? LIMIT 1`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Guide booking not found." });
    }

    const booking = rows[0];

    if (booking.booking_status !== "approved") {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "The guide must approve this request before payment." });
    }

    if (booking.payment_status === "paid") {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "This booking is already paid." });
    }

    const gateway = String(req.body.payment_gateway || req.body.gateway || "demo-card").slice(0, 60);
    const cardLast4 = String(req.body.card_last4 || "").replace(/\D/g, "").slice(-4) || null;

    await connection.query(
      `INSERT INTO guide_booking_payments
       (booking_id, tourist_id, amount, gateway, card_last4, status, paid_at)
       VALUES (?, ?, ?, ?, ?, 'Paid', NOW())`,
      [booking.id, req.user.id, booking.total_amount, gateway, cardLast4]
    );

    await connection.query(
      `UPDATE guide_bookings
       SET payment_status = 'paid', booking_status = 'confirmed'
       WHERE id = ?`,
      [booking.id]
    );

    await notify(
      connection,
      booking.partner_id,
      "Guide booking paid",
      `${booking.booking_reference} for ${booking.guide_name} is paid and confirmed.`
    );

    await connection.commit();
    return res.json({ success: true, message: "Payment completed. Your guide booking is confirmed." });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}
    console.error("Pay guide booking error:", error);
    return res.status(500).json({ success: false, message: "Server error while processing guide payment." });
  } finally {
    connection.release();
  }
};

const cancelBooking = async (req, res) => {
  await ensureGuideProcessSchema();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `${bookingSelect} WHERE gb.id = ? AND gb.tourist_id = ? LIMIT 1`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Guide booking not found." });
    }

    const booking = rows[0];

    if (["cancelled", "completed", "rejected"].includes(booking.booking_status)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "This booking can no longer be cancelled." });
    }

    await connection.query(
      `UPDATE guide_bookings
       SET booking_status = 'cancelled',
           cancelled_at = NOW(),
           payment_status = IF(payment_status = 'paid', 'refunded', payment_status)
       WHERE id = ?`,
      [booking.id]
    );

    if (booking.payment_status === "paid") {
      await connection.query(
        `UPDATE guide_booking_payments
         SET status = 'Refunded'
         WHERE booking_id = ? AND status = 'Paid'`,
        [booking.id]
      );
    }

    await notify(
      connection,
      booking.partner_id,
      "Guide booking cancelled",
      `${booking.booking_reference} was cancelled by the tourist.`
    );

    await connection.commit();
    return res.json({ success: true, message: "Guide booking cancelled." });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}
    console.error("Cancel guide booking error:", error);
    return res.status(500).json({ success: false, message: "Server error while cancelling booking." });
  } finally {
    connection.release();
  }
};

const getPartnerBookings = async (req, res) => {
  try {
    await ensureGuideProcessSchema();
    const [rows] = await pool.query(
      `${bookingSelect} WHERE pg.partner_id = ? ORDER BY gb.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, bookings: rows });
  } catch (error) {
    console.error("Get partner guide bookings error:", error);
    return res.status(500).json({ success: false, message: "Server error while loading guide requests." });
  }
};

const getPartnerGuideBookings = async (req, res) => {
  try {
    await ensureGuideProcessSchema();

    const guide = await getOwnedGuide(req.user.id, req.params.guideId);
    if (!guide) {
      return res.status(404).json({ success: false, message: "Guide profile not found for this partner." });
    }

    const [rows] = await pool.query(
      `${bookingSelect}
       WHERE pg.partner_id = ? AND gb.guide_id = ?
       ORDER BY gb.created_at DESC`,
      [req.user.id, req.params.guideId]
    );

    return res.json({ success: true, guide, bookings: rows });
  } catch (error) {
    console.error("Get partner guide-specific bookings error:", error);
    return res.status(500).json({ success: false, message: "Server error while loading this guide's requests." });
  }
};

const updatePartnerBookingStatus = async (req, res, requiredGuideId = null) => {
  await ensureGuideProcessSchema();
  const connection = await pool.getConnection();

  try {
    const status = String(req.body.status || "").toLowerCase();
    const bookingId = req.params.bookingId || req.params.id;

    if (!["approved", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be approved, rejected, or completed." });
    }

    await connection.beginTransaction();

    const params = [bookingId, req.user.id];
    let ownershipWhere = "gb.id = ? AND pg.partner_id = ?";

    if (requiredGuideId) {
      ownershipWhere += " AND gb.guide_id = ?";
      params.push(requiredGuideId);
    }

    const [rows] = await connection.query(`${bookingSelect} WHERE ${ownershipWhere} LIMIT 1`, params);

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Guide booking not found for this guide." });
    }

    const booking = rows[0];

    if (status === "approved" && booking.booking_status !== "pending") {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Only pending requests can be approved." });
    }

    if (status === "rejected" && booking.booking_status !== "pending") {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Only pending requests can be rejected." });
    }

    if (status === "completed" && booking.booking_status !== "confirmed") {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Only paid and confirmed bookings can be completed." });
    }

    if (status === "approved") {
      const [conflicts] = await connection.query(
        `SELECT id FROM guide_bookings
         WHERE guide_id = ? AND booking_date = ? AND id <> ?
           AND booking_status IN ('approved','confirmed','completed')
           AND (
             duration_type = 'full_day' OR ? = 'full_day'
             OR (
               start_time IS NOT NULL AND ? IS NOT NULL
               AND start_time < ADDTIME(?, SEC_TO_TIME(? * 3600))
               AND ADDTIME(start_time, SEC_TO_TIME(COALESCE(hours, 1) * 3600)) > ?
             )
           )
         LIMIT 1`,
        [
          booking.guide_id,
          booking.booking_date,
          booking.id,
          booking.duration_type,
          booking.start_time,
          booking.start_time,
          Number(booking.hours || 1),
          booking.start_time,
        ]
      );

      if (conflicts.length) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: "This guide already has another accepted booking on that date." });
      }
    }

    const partnerNote = String(req.body.partner_note || "").trim() || null;

    if (status === "approved") {
      await connection.query(
        `UPDATE guide_bookings
         SET booking_status = 'approved', partner_note = ?, approved_at = NOW()
         WHERE id = ?`,
        [partnerNote, booking.id]
      );
    } else if (status === "rejected") {
      await connection.query(
        `UPDATE guide_bookings
         SET booking_status = 'rejected', partner_note = ?, rejected_at = NOW()
         WHERE id = ?`,
        [partnerNote, booking.id]
      );
    } else {
      await connection.query(
        `UPDATE guide_bookings
         SET booking_status = 'completed', partner_note = COALESCE(?, partner_note), completed_at = NOW()
         WHERE id = ?`,
        [partnerNote, booking.id]
      );
    }

    const title =
      status === "approved"
        ? "Guide request approved"
        : status === "rejected"
          ? "Guide request rejected"
          : "Guide trip completed";

    const message =
      status === "approved"
        ? `${booking.guide_name} accepted ${booking.booking_reference}. You can now complete payment.`
        : status === "rejected"
          ? `${booking.guide_name} could not accept ${booking.booking_reference}.`
          : `${booking.booking_reference} is complete. You can now leave a review.`;

    await notify(connection, booking.tourist_id, title, message);
    await connection.commit();

    return res.json({ success: true, message: `Booking ${status}.` });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}
    console.error("Update guide booking status error:", error);
    return res.status(500).json({ success: false, message: "Server error while updating guide booking." });
  } finally {
    connection.release();
  }
};

const updatePartnerStatus = async (req, res) =>
  updatePartnerBookingStatus(req, res, null);

const updatePartnerGuideStatus = async (req, res) =>
  updatePartnerBookingStatus(req, res, req.params.guideId);

const createReview = async (req, res) => {
  await ensureGuideProcessSchema();
  const connection = await pool.getConnection();

  try {
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be from 1 to 5." });
    }

    await connection.beginTransaction();

    const [rows] = await connection.query(
      `${bookingSelect} WHERE gb.id = ? AND gb.tourist_id = ? LIMIT 1`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Guide booking not found." });
    }

    const booking = rows[0];

    if (booking.booking_status !== "completed") {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "You can review a guide after the trip is completed." });
    }

    if (booking.review_id) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "You already reviewed this booking." });
    }

    await connection.query(
      `INSERT INTO guide_reviews (guide_id, booking_id, tourist_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [booking.guide_id, booking.id, req.user.id, rating, comment || null]
    );

    await connection.query(
      `UPDATE partner_guides pg
       SET rating = (SELECT ROUND(AVG(gr.rating), 2) FROM guide_reviews gr WHERE gr.guide_id = pg.id),
           total_reviews = (SELECT COUNT(*) FROM guide_reviews gr WHERE gr.guide_id = pg.id)
       WHERE pg.id = ?`,
      [booking.guide_id]
    );

    await connection.commit();
    return res.status(201).json({ success: true, message: "Thank you. Your review is now public." });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}
    console.error("Create guide review error:", error);
    return res.status(500).json({ success: false, message: "Server error while saving review." });
  } finally {
    connection.release();
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  payBooking,
  cancelBooking,
  getPartnerBookings,
  getPartnerGuideBookings,
  updatePartnerStatus,
  updatePartnerGuideStatus,
  createReview,
};
