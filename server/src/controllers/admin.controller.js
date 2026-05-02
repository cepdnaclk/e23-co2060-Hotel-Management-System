const pool = require("../config/db");

const visibilitySql = `
  p.status = 'approved'
  AND p.registration_payment_status = 'Paid'
  AND (
    CURDATE() < DATE(p.next_monthly_due_date)
    OR (p.monthly_payment_status = 'Paid' AND CURDATE() <= DATE(p.monthly_cycle_end))
  )
`;

const insertPaymentTransaction = async (db, property, type, amount, notes = null) => {
  try {
    await db.query(
      `INSERT INTO payment_transactions
       (property_id, partner_id, payment_type, plan_type, amount, status, paid_at, notes)
       VALUES (?, ?, ?, ?, ?, 'Paid', NOW(), ?)`,
      [property.id, property.partner_id, type, property.plan_type, amount, notes]
    );
  } catch {
    // Keeps old DB safe if migration was not run yet.
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const [[pendingProperties]] = await pool.query(
      "SELECT COUNT(*) AS count FROM properties WHERE status = 'pending'"
    );

    const [[approvedProperties]] = await pool.query(
      "SELECT COUNT(*) AS count FROM properties WHERE status = 'approved'"
    );

    const [[rejectedProperties]] = await pool.query(
      "SELECT COUNT(*) AS count FROM properties WHERE status = 'rejected'"
    );

    const [[partners]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'partner'"
    );

    const [[tourists]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'tourist'"
    );

    const [[bookings]] = await pool.query("SELECT COUNT(*) AS count FROM bookings");

    const [[registrationPending]] = await pool.query(
      "SELECT COUNT(*) AS count FROM properties WHERE registration_payment_status = 'Unpaid'"
    );

    const [[monthlyPending]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM properties
       WHERE status = 'approved'
       AND registration_payment_status = 'Paid'
       AND CURDATE() >= DATE(next_monthly_due_date)
       AND NOT (monthly_payment_status = 'Paid' AND CURDATE() <= DATE(monthly_cycle_end))`
    );

    const [[visibleProperties]] = await pool.query(
      `SELECT COUNT(*) AS count FROM properties p WHERE ${visibilitySql}`
    );

    const [[revenue]] = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN registration_payment_status = 'Paid' THEN registration_fee ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN monthly_payment_status = 'Paid' THEN monthly_charge ELSE 0 END), 0)
        AS total
       FROM properties`
    );

    return res.status(200).json({
      success: true,
      data: {
        pending_properties: pendingProperties.count,
        approved_properties: approvedProperties.count,
        rejected_properties: rejectedProperties.count,
        partners: partners.count,
        tourists: tourists.count,
        bookings: bookings.count,
        registration_pending: registrationPending.count,
        monthly_pending: monthlyPending.count,
        visible_properties: visibleProperties.count,
        total_revenue: revenue.total,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading admin dashboard",
      error: error.message,
    });
  }
};

const getPropertiesForAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    let whereClause = "";
    const params = [];

    if (status && status !== "all") {
      whereClause = "WHERE p.status = ?";
      params.push(status);
    }

    const [properties] = await pool.query(
      `SELECT 
        p.id,
        p.partner_id,
        p.name,
        p.city,
        p.district,
        p.address,
        p.description,
        p.property_type,
        p.status,
        p.is_verified,
        p.rejection_reason,
        p.created_at,
        p.updated_at,
        p.logo_url,
        p.theme_color,
        p.plan_type,
        p.room_limit,
        p.registration_fee,
        p.registration_payment_status,
        p.registration_paid_at,
        p.monthly_charge,
        p.monthly_payment_status,
        p.monthly_paid_at,
        p.monthly_cycle_start,
        p.monthly_cycle_end,
        p.next_monthly_due_date,
        u.full_name AS partner_name,
        u.email AS partner_email,
        u.phone AS partner_phone,
        pp.image_url AS main_image,
        COUNT(DISTINCT r.id) AS room_type_count,
        COALESCE(SUM(r.total_rooms), 0) AS total_rooms_count,
        CASE WHEN ${visibilitySql} THEN TRUE ELSE FALSE END AS public_visible
       FROM properties p
       INNER JOIN users u ON p.partner_id = u.id
       LEFT JOIN property_photos pp ON p.id = pp.property_id AND pp.is_main = TRUE
       LEFT JOIN rooms r ON p.id = r.property_id
       ${whereClause}
       GROUP BY p.id, u.full_name, u.email, u.phone, pp.image_url
       ORDER BY p.created_at DESC`,
      params
    );

    return res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error("Get admin properties error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting properties",
      error: error.message,
    });
  }
};

const getPendingProperties = (req, res) => {
  req.query.status = "pending";
  return getPropertiesForAdmin(req, res);
};

const getApprovedPropertiesForAdmin = (req, res) => {
  req.query.status = "approved";
  return getPropertiesForAdmin(req, res);
};

const getPropertyForReview = async (req, res) => {
  try {
    const { id } = req.params;

    const [properties] = await pool.query(
      `SELECT 
        p.*,
        u.full_name AS partner_name,
        u.email AS partner_email,
        u.phone AS partner_phone,
        COALESCE((SELECT SUM(total_rooms) FROM rooms WHERE property_id = p.id), 0) AS total_rooms_count,
        CASE WHEN ${visibilitySql} THEN TRUE ELSE FALSE END AS public_visible
       FROM properties p
       INNER JOIN users u ON p.partner_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const [rooms] = await pool.query(
      `SELECT r.*, rp.image_url AS main_image
       FROM rooms r
       LEFT JOIN room_photos rp ON r.id = rp.room_id AND rp.is_main = TRUE
       WHERE r.property_id = ?
       ORDER BY r.id ASC`,
      [id]
    );

    const [photos] = await pool.query(
      `SELECT *
       FROM property_photos
       WHERE property_id = ?
       ORDER BY is_main DESC, id ASC`,
      [id]
    );

    const [policies] = await pool.query(
      `SELECT *
       FROM property_policies
       WHERE property_id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...properties[0],
        rooms,
        photos,
        policies: policies[0] || null,
      },
    });
  } catch (error) {
    console.error("Get property review error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting property review details",
      error: error.message,
    });
  }
};

const approveProperty = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [properties] = await connection.query(
      `SELECT id, partner_id, name
       FROM properties
       WHERE id = ?`,
      [id]
    );

    if (properties.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    await connection.query(
      `UPDATE properties
       SET status = 'approved',
           is_verified = TRUE,
           rejection_reason = NULL
       WHERE id = ?`,
      [id]
    );

    await connection.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [
        properties[0].partner_id,
        "Property approved",
        `${properties[0].name} was approved. It displays only when payment rules are valid.`,
        "approval",
      ]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Property approved successfully",
      data: {
        id: Number(id),
        status: "approved",
        is_verified: true,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Approve property error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while approving property",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

const rejectProperty = async (req, res) => {
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

    const [properties] = await connection.query(
      `SELECT id, partner_id, name
       FROM properties
       WHERE id = ?`,
      [id]
    );

    if (properties.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    await connection.query(
      `UPDATE properties
       SET status = 'rejected',
           is_verified = FALSE,
           rejection_reason = ?
       WHERE id = ?`,
      [rejection_reason.trim(), id]
    );

    await connection.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [
        properties[0].partner_id,
        "Property rejected",
        `${properties[0].name} was rejected. Reason: ${rejection_reason.trim()}`,
        "rejection",
      ]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Property rejected successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Reject property error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while rejecting property",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

const updatePropertyPaymentByAdmin = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { registration_payment_status, monthly_payment_status } = req.body;

    const [properties] = await connection.query(
      `SELECT id, partner_id, plan_type, registration_fee, monthly_charge
       FROM properties
       WHERE id = ?`,
      [id]
    );

    if (properties.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const property = properties[0];
    const updates = [];
    const params = [];

    if (["Paid", "Unpaid"].includes(registration_payment_status)) {
      updates.push("registration_payment_status = ?");
      params.push(registration_payment_status);

      updates.push("fee_payment_status = ?");
      params.push(registration_payment_status);

      updates.push("registration_paid_at = ?");
      params.push(registration_payment_status === "Paid" ? new Date() : null);
    }

    if (["Free Trial", "Paid", "Unpaid"].includes(monthly_payment_status)) {
      updates.push("monthly_payment_status = ?");
      params.push(monthly_payment_status);

      if (monthly_payment_status === "Paid") {
        updates.push("monthly_paid_at = NOW()");
        updates.push("monthly_cycle_start = NOW()");
        updates.push("monthly_cycle_end = DATE_ADD(NOW(), INTERVAL 1 MONTH)");
        updates.push("next_monthly_due_date = DATE_ADD(NOW(), INTERVAL 1 MONTH)");
      }

      if (monthly_payment_status === "Unpaid") {
        updates.push("monthly_paid_at = NULL");
      }
    }

    if (updates.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "No payment update provided",
      });
    }

    params.push(id);

    await connection.query(
      `UPDATE properties SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    if (registration_payment_status === "Paid") {
      await insertPaymentTransaction(
        connection,
        property,
        "registration",
        Number(property.registration_fee || 0),
        "Admin marked registration fee as paid"
      );
    }

    if (monthly_payment_status === "Paid") {
      await insertPaymentTransaction(
        connection,
        property,
        "monthly",
        Number(property.monthly_charge || 0),
        "Admin marked monthly fee as paid"
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Property payment details updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Admin update payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating payment",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

const getRegistrationPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.city,
        p.status,
        p.plan_type,
        p.room_limit,
        p.registration_fee,
        p.registration_payment_status,
        p.registration_paid_at,
        u.full_name AS partner_name,
        u.email AS partner_email,
        CASE WHEN ${visibilitySql} THEN TRUE ELSE FALSE END AS public_visible
       FROM properties p
       INNER JOIN users u ON p.partner_id = u.id
       ORDER BY FIELD(p.registration_payment_status, 'Unpaid', 'Paid'), p.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Get registration payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading registration payments",
    });
  }
};

const getMonthlyPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.city,
        p.status,
        p.plan_type,
        p.room_limit,
        p.monthly_charge,
        p.monthly_payment_status,
        p.monthly_paid_at,
        p.monthly_cycle_start,
        p.monthly_cycle_end,
        p.next_monthly_due_date,
        u.full_name AS partner_name,
        u.email AS partner_email,
        CASE WHEN ${visibilitySql} THEN TRUE ELSE FALSE END AS public_visible,
        CASE
          WHEN CURDATE() < DATE(p.next_monthly_due_date) THEN 'Free period active'
          WHEN p.monthly_payment_status = 'Paid' AND CURDATE() <= DATE(p.monthly_cycle_end) THEN 'Paid'
          ELSE 'Pending'
        END AS monthly_admin_status
       FROM properties p
       INNER JOIN users u ON p.partner_id = u.id
       ORDER BY FIELD(monthly_admin_status, 'Pending', 'Free period active', 'Paid'), p.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Get monthly payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading monthly payments",
    });
  }
};

const getPaymentPlans = async (req, res) => {
  try {
    const [plans] = await pool.query(
      `SELECT *
       FROM property_plans
       ORDER BY room_limit ASC, monthly_fee ASC`
    );

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error("Get payment plans error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while loading versions",
    });
  }
};

const createPaymentPlan = async (req, res) => {
  try {
    const {
      plan_key,
      plan_name,
      room_limit,
      registration_fee,
      monthly_fee,
      description,
      is_active,
    } = req.body;

    if (!plan_key || !plan_name || Number(room_limit) < 1) {
      return res.status(400).json({
        success: false,
        message: "Version key, version name, and valid room limit are required",
      });
    }

    const cleanKey = String(plan_key).trim().toLowerCase().replace(/\s+/g, "_");

    const [result] = await pool.query(
      `INSERT INTO property_plans
       (plan_key, plan_name, room_limit, registration_fee, monthly_fee, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanKey,
        plan_name,
        Number(room_limit),
        Number(registration_fee || 0),
        Number(monthly_fee || 0),
        description || null,
        is_active === false ? false : true,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Payment version created successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Create payment plan error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating payment version",
      error: error.message,
    });
  }
};

const updatePaymentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plan_name,
      room_limit,
      registration_fee,
      monthly_fee,
      description,
      is_active,
    } = req.body;

    if (!plan_name || Number(room_limit) < 1) {
      return res.status(400).json({
        success: false,
        message: "Version name and valid room limit are required",
      });
    }

    await pool.query(
      `UPDATE property_plans
       SET plan_name = ?,
           room_limit = ?,
           registration_fee = ?,
           monthly_fee = ?,
           description = ?,
           is_active = ?
       WHERE id = ?`,
      [
        plan_name,
        Number(room_limit),
        Number(registration_fee || 0),
        Number(monthly_fee || 0),
        description || null,
        is_active === false ? false : true,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Payment version updated successfully",
    });
  } catch (error) {
    console.error("Update payment plan error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating payment version",
      error: error.message,
    });
  }
};

const getRevenueReport = async (req, res) => {
  try {
    const [monthlyRevenue] = await pool.query(
      `SELECT
        DATE_FORMAT(paid_at, '%Y-%m') AS month_label,
        SUM(amount) AS total_revenue,
        SUM(CASE WHEN payment_type = 'registration' THEN amount ELSE 0 END) AS registration_revenue,
        SUM(CASE WHEN payment_type = 'monthly' THEN amount ELSE 0 END) AS monthly_revenue
       FROM payment_transactions
       WHERE status = 'Paid'
       GROUP BY DATE_FORMAT(paid_at, '%Y-%m')
       ORDER BY month_label ASC`
    );

    const [[totals]] = await pool.query(
      `SELECT
        COALESCE(SUM(amount), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN payment_type = 'registration' THEN amount ELSE 0 END), 0) AS registration_revenue,
        COALESCE(SUM(CASE WHEN payment_type = 'monthly' THEN amount ELSE 0 END), 0) AS monthly_revenue,
        COUNT(*) AS transaction_count
       FROM payment_transactions
       WHERE status = 'Paid'`
    );

    return res.status(200).json({
      success: true,
      data: {
        totals,
        monthly: monthlyRevenue,
      },
    });
  } catch (error) {
    console.error("Get revenue report error:", error);

    const [fallback] = await pool.query(
      `SELECT
        'Current data' AS month_label,
        COALESCE(SUM(CASE WHEN registration_payment_status = 'Paid' THEN registration_fee ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN monthly_payment_status = 'Paid' THEN monthly_charge ELSE 0 END), 0)
        AS total_revenue,
        COALESCE(SUM(CASE WHEN registration_payment_status = 'Paid' THEN registration_fee ELSE 0 END), 0)
        AS registration_revenue,
        COALESCE(SUM(CASE WHEN monthly_payment_status = 'Paid' THEN monthly_charge ELSE 0 END), 0)
        AS monthly_revenue
       FROM properties`
    );

    return res.status(200).json({
      success: true,
      data: {
        totals: fallback[0],
        monthly: fallback,
      },
    });
  }
};

const getPartners = async (req, res) => {
  try {
    const [partners] = await pool.query(
      `SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.is_active,
        u.created_at,
        COUNT(p.id) AS property_count
       FROM users u
       LEFT JOIN properties p ON u.id = p.partner_id
       WHERE u.role = 'partner'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: partners.length,
      data: partners,
    });
  } catch (error) {
    console.error("Get partners error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting partners",
    });
  }
};

const getTourists = async (req, res) => {
  try {
    const [tourists] = await pool.query(
      `SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.nationality,
        u.national_id,
        u.is_active,
        u.created_at,
        COUNT(b.id) AS booking_count
       FROM users u
       LEFT JOIN bookings b ON u.id = b.tourist_id OR u.id = b.user_id
       WHERE u.role = 'tourist'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: tourists.length,
      data: tourists,
    });
  } catch (error) {
    console.error("Get tourists error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting tourists",
    });
  }
};

const getBookings = async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT
        b.*,
        u.full_name AS tourist_name,
        p.name AS property_name,
        p.city AS property_city,
        r.room_type
       FROM bookings b
       LEFT JOIN users u ON b.tourist_id = u.id OR b.user_id = u.id
       INNER JOIN properties p ON b.property_id = p.id
       INNER JOIN rooms r ON b.room_id = r.id
       ORDER BY b.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting bookings",
    });
  }
};

const removeProperty = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [properties] = await connection.query(
      `SELECT id, name, partner_id
       FROM properties
       WHERE id = ?`,
      [id]
    );

    if (properties.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    await connection.query(
      `DELETE FROM room_photos WHERE room_id IN (SELECT id FROM rooms WHERE property_id = ?)`,
      [id]
    );

    await connection.query(`DELETE FROM property_photos WHERE property_id = ?`, [id]);
    await connection.query(`DELETE FROM property_policies WHERE property_id = ?`, [id]);
    await connection.query(`DELETE FROM bookings WHERE property_id = ?`, [id]);
    await connection.query(`DELETE FROM rooms WHERE property_id = ?`, [id]);
    await connection.query(`DELETE FROM properties WHERE id = ?`, [id]);

    await connection.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [
        properties[0].partner_id,
        "Property removed",
        `${properties[0].name} was removed by admin.`,
        "system",
      ]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Property removed successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Remove property error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while removing property",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAdminDashboard,
  getPropertiesForAdmin,
  getPendingProperties,
  getApprovedPropertiesForAdmin,
  getPropertyForReview,
  approveProperty,
  rejectProperty,
  updatePropertyPaymentByAdmin,
  removeProperty,
  getRegistrationPayments,
  getMonthlyPayments,
  getPaymentPlans,
  createPaymentPlan,
  updatePaymentPlan,
  getRevenueReport,
  getPartners,
  getTourists,
  getBookings,
};
