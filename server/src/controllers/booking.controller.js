const crypto = require("crypto");
const pool = require("../config/db");

const GUEST_COOKIE_NAME = "tourismhub_guest_id";

const createBookingReference = () => {
  const now = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `THLK-${now}-${random}`;
};

const parseCookies = (req) => {
  const cookieHeader = req.headers.cookie || "";

  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (!key) return cookies;

    cookies[key] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});
};

const createGuestSessionId = () => {
  return crypto.randomBytes(32).toString("hex");
};

const setGuestCookie = (res, guestSessionId) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.setHeader(
    "Set-Cookie",
    `${GUEST_COOKIE_NAME}=${encodeURIComponent(
      guestSessionId
    )}; Max-Age=${60 * 60 * 24 * 30}; Path=/; HttpOnly; SameSite=Lax${
      isProduction ? "; Secure" : ""
    }`
  );
};

const getGuestSessionIdFromRequest = (req) => {
  const cookies = parseCookies(req);
  return cookies[GUEST_COOKIE_NAME] || null;
};

const getDateOnly = (dateValue) => {
  return new Date(`${dateValue}T00:00:00`);
};

const getDateDifference = (checkIn, checkOut) => {
  const start = getDateOnly(checkIn);
  const end = getDateOnly(checkOut);
  const diff = end.getTime() - start.getTime();

  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const packageToUnits = (packageType) => {
  if (packageType === "day") {
    return {
      dayUnits: 1,
      nightUnits: 0,
    };
  }

  if (packageType === "night") {
    return {
      dayUnits: 0,
      nightUnits: 1,
    };
  }

  return {
    dayUnits: 1,
    nightUnits: 1,
  };
};

const calculateBookingUnits = (checkIn, checkOut, checkInPackage, checkOutPackage) => {
  const dateDifference = getDateDifference(checkIn, checkOut);

  if (dateDifference === 0) {
    const sameDayUnits = packageToUnits(checkInPackage || "day");

    return {
      dayUnits: sameDayUnits.dayUnits,
      nightUnits: sameDayUnits.nightUnits,
      middleDays: 0,
    };
  }

  const firstDateUnits = packageToUnits(checkInPackage || "night");
  const lastDateUnits = packageToUnits(checkOutPackage || "day");
  const middleDays = Math.max(0, dateDifference - 1);

  return {
    dayUnits: firstDateUnits.dayUnits + lastDateUnits.dayUnits + middleDays,
    nightUnits:
      firstDateUnits.nightUnits + lastDateUnits.nightUnits + middleDays,
    middleDays,
  };
};

const calculateRoomAmount = ({
  room,
  guests,
  dayUnits,
  nightUnits,
}) => {
  const baseNightPrice = Number(room.price_per_night || 0);
  const baseDayPrice = Number(room.price_per_day || room.price_per_night || 0);
  const baseGuests = Number(room.base_occupancy || 1);
  const extraPersonPrice = Number(room.extra_person_price || 0);
  const guestCount = Number(guests || 1);

  const extraGuests = Math.max(0, guestCount - baseGuests);

  const nightAmount =
    (baseNightPrice + extraGuests * extraPersonPrice) * Number(nightUnits || 0);

  const dayAmount =
    (baseDayPrice + extraGuests * extraPersonPrice) * Number(dayUnits || 0);

  return dayAmount + nightAmount;
};

const getAvailableSuggestions = async (propertyId, selectedRoomId, guests) => {
  const [suggestions] = await pool.query(
    `SELECT 
      id,
      room_type,
      capacity,
      base_occupancy,
      price_per_night,
      extra_person_price,
      price_per_day,
      total_rooms,
      available_rooms
     FROM rooms
     WHERE property_id = ?
       AND id <> ?
       AND available_rooms > 0
       AND capacity >= ?
     ORDER BY price_per_night ASC`,
    [propertyId, selectedRoomId, Number(guests || 1)]
  );

  return suggestions;
};

const createBooking = async (req, res) => {
  try {
    const {
      property_id,
      room_id,
      full_name,
      email,
      nationality,
      country_code,
      phone,
      check_in,
      check_out,
      check_in_package,
      check_out_package,
      guests,
      notes,
    } = req.body;

    if (
      !property_id ||
      !room_id ||
      !full_name ||
      !email ||
      !nationality ||
      !country_code ||
      !phone ||
      !check_in ||
      !check_out ||
      !guests
    ) {
      return res.status(400).json({
        success: false,
        message: "All booking details are required",
      });
    }

    if (req.user && req.user.role !== "tourist") {
      return res.status(403).json({
        success: false,
        message: "Only tourists or guest users can create bookings.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInDate = getDateOnly(check_in);
    const checkOutDate = getDateOnly(check_out);

    if (checkInDate < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be a past date.",
      });
    }

    if (checkOutDate < checkInDate) {
      return res.status(400).json({
        success: false,
        message: "Check-out date cannot be before check-in date.",
      });
    }

    const dateDifference = getDateDifference(check_in, check_out);

    const validPackages = ["day", "night", "both"];

    const finalCheckInPackage = validPackages.includes(check_in_package)
      ? check_in_package
      : dateDifference === 0
      ? "day"
      : "night";

    const finalCheckOutPackage = validPackages.includes(check_out_package)
      ? check_out_package
      : dateDifference === 0
      ? finalCheckInPackage
      : "day";

    const [properties] = await pool.query(
      `SELECT id, name, city, partner_id
       FROM properties
       WHERE id = ? AND status = 'approved'`,
      [property_id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Approved property not found",
      });
    }

    const [rooms] = await pool.query(
      `SELECT 
        id,
        property_id,
        room_type,
        capacity,
        base_occupancy,
        price_per_night,
        extra_person_price,
        price_per_day,
        total_rooms,
        available_rooms
       FROM rooms
       WHERE id = ? AND property_id = ?`,
      [room_id, property_id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Room not found for this property",
      });
    }

    const selectedRoom = rooms[0];
    const guestCount = Number(guests);

    if (guestCount < 1) {
      return res.status(400).json({
        success: false,
        message: "Guest count must be at least 1.",
      });
    }

    if (guestCount > Number(selectedRoom.capacity)) {
      return res.status(400).json({
        success: false,
        message: `This room allows maximum ${selectedRoom.capacity} guest(s).`,
      });
    }

    if (Number(selectedRoom.available_rooms) <= 0) {
      const suggestions = await getAvailableSuggestions(
        property_id,
        room_id,
        guestCount
      );

      return res.status(400).json({
        success: false,
        message:
          "This room category is fully booked. Please choose another available room in this hotel.",
        suggestions,
      });
    }

    const bookingUnits = calculateBookingUnits(
      check_in,
      check_out,
      finalCheckInPackage,
      finalCheckOutPackage
    );

    if (bookingUnits.dayUnits === 0 && bookingUnits.nightUnits === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least day, night, or both for the booking.",
      });
    }

    const calculatedTotalAmount = calculateRoomAmount({
      room: selectedRoom,
      guests: guestCount,
      dayUnits: bookingUnits.dayUnits,
      nightUnits: bookingUnits.nightUnits,
    });

    const bookingReference = createBookingReference();
    const userId = req.user?.id || null;

    let guestSessionId = null;

    if (!userId) {
      guestSessionId =
        getGuestSessionIdFromRequest(req) || createGuestSessionId();

      setGuestCookie(res, guestSessionId);
    }

    const [result] = await pool.query(
      `INSERT INTO bookings
       (
        booking_reference,
        tourist_id,
        user_id,
        guest_session_id,
        property_id,
        room_id,
        full_name,
        email,
        nationality,
        country_code,
        phone,
        check_in,
        check_out,
        check_in_package,
        check_out_package,
        guests,
        nights,
        day_units,
        night_units,
        adults,
        children,
        total_amount,
        notes,
        payment_status,
        booking_status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingReference,
        userId,
        userId,
        guestSessionId,
        property_id,
        room_id,
        full_name,
        email,
        nationality,
        country_code,
        phone,
        check_in,
        check_out,
        finalCheckInPackage,
        finalCheckOutPackage,
        guestCount,
        bookingUnits.nightUnits,
        bookingUnits.dayUnits,
        bookingUnits.nightUnits,
        guestCount,
        0,
        calculatedTotalAmount,
        notes || null,
        "Pending Payment",
        "Pending Partner Approval",
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Booking submitted successfully. Waiting for approval.",
      booking_id: result.insertId,
      booking_reference: bookingReference,
      booking_status: "Pending Partner Approval",
      payment_status: "Pending Payment",
      total_amount: calculatedTotalAmount,
      day_units: bookingUnits.dayUnits,
      night_units: bookingUnits.nightUnits,
      check_in_package: finalCheckInPackage,
      check_out_package: finalCheckOutPackage,
      is_guest_booking: !userId,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating booking",
      error: error.message,
    });
  }
};

const getMyBookings = async (req, res) => {
  try {
    let whereClause = "";
    let params = [];

    if (req.user?.id && req.user.role === "tourist") {
      whereClause = "(b.user_id = ? OR b.tourist_id = ?)";
      params = [req.user.id, req.user.id];
    } else {
      const guestSessionId = getGuestSessionIdFromRequest(req);

      if (!guestSessionId) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }

      whereClause = "b.guest_session_id = ?";
      params = [guestSessionId];
    }

    const [bookings] = await pool.query(
      `SELECT
        b.id,
        b.booking_reference,
        b.tourist_id,
        b.user_id,
        b.guest_session_id,
        b.property_id,
        b.room_id,
        b.full_name,
        b.email,
        b.nationality,
        b.country_code,
        b.phone,
        b.check_in,
        b.check_out,
        b.check_in_package,
        b.check_out_package,
        b.guests,
        b.nights,
        b.day_units,
        b.night_units,
        b.adults,
        b.children,
        b.total_amount,
        b.notes,
        b.payment_status,
        b.booking_status,
        b.partner_note,
        b.created_at,

        p.name AS property_name,
        p.city AS property_city,
        p.district AS property_district,
        p.logo_url AS property_logo,
        p.theme_color AS property_theme_color,

        r.room_type
       FROM bookings b
       INNER JOIN properties p ON b.property_id = p.id
       INNER JOIN rooms r ON b.room_id = r.id
       WHERE ${whereClause}
       ORDER BY b.created_at DESC`,
      params
    );

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting bookings",
      error: error.message,
    });
  }
};

const getPartnerBookings = async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT
        b.id,
        b.booking_reference,
        b.tourist_id,
        b.user_id,
        b.guest_session_id,
        b.property_id,
        b.room_id,
        b.full_name,
        b.email,
        b.nationality,
        b.country_code,
        b.phone,
        b.check_in,
        b.check_out,
        b.check_in_package,
        b.check_out_package,
        b.guests,
        b.nights,
        b.day_units,
        b.night_units,
        b.adults,
        b.children,
        b.total_amount,
        b.notes,
        b.payment_status,
        b.booking_status,
        b.partner_note,
        b.created_at,

        u.full_name AS tourist_name,

        p.name AS property_name,
        p.city AS property_city,
        p.district AS property_district,
        p.logo_url AS property_logo,
        p.theme_color AS property_theme_color,

        r.room_type
       FROM bookings b
       INNER JOIN properties p ON b.property_id = p.id
       INNER JOIN rooms r ON b.room_id = r.id
       LEFT JOIN users u ON b.user_id = u.id OR b.tourist_id = u.id
       WHERE p.partner_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get partner bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting partner bookings",
      error: error.message,
    });
  }
};

const approveBooking = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [bookings] = await connection.query(
      `SELECT 
        b.id,
        b.room_id,
        b.booking_status,
        r.available_rooms
       FROM bookings b
       INNER JOIN properties p ON b.property_id = p.id
       INNER JOIN rooms r ON b.room_id = r.id
       WHERE b.id = ? AND p.partner_id = ?
       FOR UPDATE`,
      [id, req.user.id]
    );

    if (bookings.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking not found for your property",
      });
    }

    if (bookings[0].booking_status === "Approved") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Booking is already approved",
      });
    }

    if (bookings[0].booking_status === "Rejected") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Rejected booking cannot be approved again.",
      });
    }

    if (Number(bookings[0].available_rooms) <= 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "No rooms available in this category. You cannot approve this booking.",
      });
    }

    await connection.query(
      `UPDATE bookings
       SET booking_status = ?,
           partner_note = NULL
       WHERE id = ?`,
      ["Approved", id]
    );

    await connection.query(
      `UPDATE rooms
       SET available_rooms = available_rooms - 1
       WHERE id = ? AND available_rooms > 0`,
      [bookings[0].room_id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Booking approved successfully",
      booking_status: "Approved",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Approve booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while approving booking",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { partner_note } = req.body;

    const [bookings] = await pool.query(
      `SELECT b.id, b.booking_status
       FROM bookings b
       INNER JOIN properties p ON b.property_id = p.id
       WHERE b.id = ? AND p.partner_id = ?`,
      [id, req.user.id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found for your property",
      });
    }

    if (bookings[0].booking_status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Approved booking cannot be rejected again.",
      });
    }

    await pool.query(
      `UPDATE bookings
       SET booking_status = ?,
           partner_note = ?
       WHERE id = ?`,
      ["Rejected", partner_note || "Rejected by partner", id]
    );

    return res.status(200).json({
      success: true,
      message: "Booking rejected successfully",
      booking_status: "Rejected",
    });
  } catch (error) {
    console.error("Reject booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while rejecting booking",
      error: error.message,
    });
  }
};

const payOnlineBooking = async (req, res) => {
  try {
    const { id } = req.params;

    let whereClause = "b.id = ?";
    let params = [id];

    if (req.user?.id && req.user.role === "tourist") {
      whereClause += " AND (b.user_id = ? OR b.tourist_id = ?)";
      params.push(req.user.id, req.user.id);
    } else {
      const guestSessionId = getGuestSessionIdFromRequest(req);

      if (!guestSessionId) {
        return res.status(401).json({
          success: false,
          message: "Guest booking session not found.",
        });
      }

      whereClause += " AND b.guest_session_id = ?";
      params.push(guestSessionId);
    }

    const [bookings] = await pool.query(
      `SELECT 
        b.id,
        b.payment_status,
        b.booking_status
       FROM bookings b
       WHERE ${whereClause}`,
      params
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    await pool.query(
      `UPDATE bookings
       SET payment_status = ?
       WHERE id = ?`,
      ["Paid", id]
    );

    return res.status(200).json({
      success: true,
      message: "Payment status updated to Paid.",
      payment_status: "Paid",
    });
  } catch (error) {
    console.error("Pay online booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating payment status",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getPartnerBookings,
  approveBooking,
  rejectBooking,
  payOnlineBooking,
};