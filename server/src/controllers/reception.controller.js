const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const generateReceptionToken = (payload) =>
  jwt.sign(
    {
      role: "reception",
      partner_id: payload.partner_id,
      property_id: payload.property_id,
      email: payload.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

const mapRoom = (room) => ({
  ...room,
  total_rooms: Number(room.total_rooms || 0),
  available_rooms: Number(room.available_rooms || 0),
  capacity: Number(room.capacity || 0),
  base_occupancy: Number(room.base_occupancy || 0),
  price_per_night: Number(room.price_per_night || 0),
  price_per_day: room.price_per_day === null ? null : Number(room.price_per_day || 0),
  extra_person_price: Number(room.extra_person_price || 0),
});

const createBookingReference = () => {
  const now = Date.now();
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `THLK-R-${now}-${random}`;
};

const getDateOnly = (dateValue) => new Date(`${dateValue}T00:00:00`);

const getDateDifference = (checkIn, checkOut) => {
  const start = getDateOnly(checkIn);
  const end = getDateOnly(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const packageToUnits = (packageType) => {
  if (packageType === "day") return { dayUnits: 1, nightUnits: 0 };
  if (packageType === "night") return { dayUnits: 0, nightUnits: 1 };
  return { dayUnits: 1, nightUnits: 1 };
};

const calculateBookingUnits = (checkIn, checkOut, checkInPackage, checkOutPackage) => {
  const dateDifference = getDateDifference(checkIn, checkOut);

  if (dateDifference === 0) {
    return {
      ...packageToUnits(checkInPackage || "day"),
      middleDays: 0,
    };
  }

  const firstDateUnits = packageToUnits(checkInPackage || "night");
  const lastDateUnits = packageToUnits(checkOutPackage || "day");
  const middleDays = Math.max(0, dateDifference - 1);

  return {
    dayUnits: firstDateUnits.dayUnits + lastDateUnits.dayUnits + middleDays,
    nightUnits: firstDateUnits.nightUnits + lastDateUnits.nightUnits + middleDays,
    middleDays,
  };
};

const calculateRoomAmount = ({ room, guests, dayUnits, nightUnits }) => {
  const baseNightPrice = Number(room.price_per_night || 0);
  const baseDayPrice = Number(room.price_per_day || room.price_per_night || 0);
  const baseGuests = Number(room.base_occupancy || 1);
  const extraPersonPrice = Number(room.extra_person_price || 0);
  const guestCount = Number(guests || 1);
  const extraGuests = Math.max(0, guestCount - baseGuests);

  return (
    (baseNightPrice + extraGuests * extraPersonPrice) * Number(nightUnits || 0) +
    (baseDayPrice + extraGuests * extraPersonPrice) * Number(dayUnits || 0)
  );
};

const mapBooking = (booking) => ({
  ...booking,
  guests: Number(booking.guests || 0),
  nights: Number(booking.nights || 0),
  day_units: Number(booking.day_units || 0),
  night_units: Number(booking.night_units || 0),
  total_amount: Number(booking.total_amount || 0),
});

const loadReceptionProperty = async (propertyId) => {
  const [properties] = await pool.query(
    `SELECT 
      p.id,
      p.partner_id,
      p.name,
      p.city,
      p.district,
      p.address,
      p.description,
      p.logo_url,
      p.theme_color,
      p.property_type,
      p.status,
      p.is_verified,
      u.full_name AS partner_name,
      u.email AS partner_email,
      pp.image_url AS main_image
     FROM properties p
     INNER JOIN users u ON p.partner_id = u.id
     LEFT JOIN property_photos pp ON p.id = pp.property_id AND pp.is_main = TRUE
     WHERE p.id = ?
     LIMIT 1`,
    [propertyId]
  );

  if (properties.length === 0) {
    return null;
  }

  const [rooms] = await pool.query(
    `SELECT
      r.id,
      r.property_id,
      r.room_type,
      r.capacity,
      r.base_occupancy,
      r.price_per_night,
      r.price_per_day,
      r.extra_person_price,
      r.total_rooms,
      r.available_rooms,
      rp.image_url AS main_image
     FROM rooms r
     LEFT JOIN room_photos rp ON r.id = rp.room_id AND rp.is_main = TRUE
     WHERE r.property_id = ?
     ORDER BY r.id ASC`,
    [propertyId]
  );

  return {
    ...properties[0],
    rooms: rooms.map(mapRoom),
  };
};

const loginReception = async (req, res) => {
  try {
    const { email, property_password, property_id } = req.body;
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !property_password) {
      return res.status(400).json({
        success: false,
        message: "Partner email and property management password are required",
      });
    }

    const params = property_id ? [cleanEmail, property_id] : [cleanEmail];
    const propertyFilter = property_id ? "AND p.id = ?" : "";

    const [properties] = await pool.query(
      `SELECT
        p.id,
        p.partner_id,
        p.name,
        p.property_password_hash,
        p.status,
        u.email AS partner_email,
        u.full_name AS partner_name
       FROM properties p
       INNER JOIN users u ON p.partner_id = u.id
       WHERE u.email = ?
         AND u.role = 'partner'
         AND u.is_active = TRUE
         ${propertyFilter}
       ORDER BY p.created_at DESC`,
      params
    );

    for (const property of properties) {
      const isMatch = await bcrypt.compare(property_password, property.property_password_hash || "");

      if (isMatch) {
        const token = generateReceptionToken({
          partner_id: property.partner_id,
          property_id: property.id,
          email: property.partner_email,
        });

        const data = await loadReceptionProperty(property.id);

        return res.status(200).json({
          success: true,
          message: "Reception login successful",
          token,
          user: {
            role: "reception",
            partner_id: property.partner_id,
            property_id: property.id,
            email: property.partner_email,
            partner_name: property.partner_name,
            property_name: property.name,
          },
          data,
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: "Invalid partner email or property management password",
    });
  } catch (error) {
    console.error("Reception login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while logging in to reception",
    });
  }
};

const getReceptionProperty = async (req, res) => {
  try {
    const property = await loadReceptionProperty(req.user.property_id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Reception property not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error("Get reception property error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading reception property",
    });
  }
};

const updateReceptionRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { available_rooms } = req.body;
    const nextAvailable = Number(available_rooms);

    if (!Number.isInteger(nextAvailable) || nextAvailable < 0) {
      return res.status(400).json({
        success: false,
        message: "Available rooms must be a whole number greater than or equal to zero",
      });
    }

    const [rooms] = await pool.query(
      `SELECT id, total_rooms
       FROM rooms
       WHERE id = ? AND property_id = ?
       LIMIT 1`,
      [roomId, req.user.property_id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Room type not found for this reception property",
      });
    }

    if (nextAvailable > Number(rooms[0].total_rooms || 0)) {
      return res.status(400).json({
        success: false,
        message: "Available rooms cannot be greater than total rooms",
      });
    }

    await pool.query(
      `UPDATE rooms
       SET available_rooms = ?
       WHERE id = ? AND property_id = ?`,
      [nextAvailable, roomId, req.user.property_id]
    );

    const property = await loadReceptionProperty(req.user.property_id);

    return res.status(200).json({
      success: true,
      message: "Room availability updated",
      data: property,
    });
  } catch (error) {
    console.error("Update reception room availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating room availability",
    });
  }
};

const getReceptionBookings = async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT
        b.id,
        b.booking_reference,
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
        b.total_amount,
        b.notes,
        b.partner_note,
        b.payment_status,
        b.booking_status,
        b.created_at,
        r.room_type,
        r.capacity,
        r.available_rooms,
        rp.image_url AS room_image
       FROM bookings b
       INNER JOIN rooms r ON b.room_id = r.id
       LEFT JOIN room_photos rp ON r.id = rp.room_id AND rp.is_main = TRUE
       WHERE b.property_id = ?
       ORDER BY b.created_at DESC
       LIMIT 80`,
      [req.user.property_id]
    );

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings.map(mapBooking),
    });
  } catch (error) {
    console.error("Get reception bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading reception bookings",
    });
  }
};

const createReceptionBooking = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
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
      payment_method,
    } = req.body;

    const cleanPaymentMethod = String(payment_method || "").toLowerCase();

    if (!["cash", "card"].includes(cleanPaymentMethod)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Select cash or card payment for reception booking",
      });
    }

    if (!room_id || !full_name || !email || !nationality || !phone || !check_in || !check_out || !guests) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Guest, stay, and payment details are required",
      });
    }

    const checkInDate = getDateOnly(check_in);
    const checkOutDate = getDateOnly(check_out);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Valid check-in and check-out dates are required",
      });
    }

    if (checkOutDate < checkInDate) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Check-out date cannot be before check-in date",
      });
    }

    const [rooms] = await connection.query(
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
       WHERE id = ? AND property_id = ?
       FOR UPDATE`,
      [room_id, req.user.property_id]
    );

    if (rooms.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Room type not found for this reception property",
      });
    }

    const room = rooms[0];
    const guestCount = Number(guests);

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Guest count must be at least 1",
      });
    }

    if (guestCount > Number(room.capacity || 0)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `This room allows maximum ${room.capacity} guest(s).`,
      });
    }

    if (Number(room.available_rooms || 0) <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "This room type is fully occupied.",
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

    const bookingUnits = calculateBookingUnits(
      check_in,
      check_out,
      finalCheckInPackage,
      finalCheckOutPackage
    );

    if (bookingUnits.dayUnits === 0 && bookingUnits.nightUnits === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Please select at least day, night, or both for the booking.",
      });
    }

    const totalAmount = calculateRoomAmount({
      room,
      guests: guestCount,
      dayUnits: bookingUnits.dayUnits,
      nightUnits: bookingUnits.nightUnits,
    });

    const bookingReference = createBookingReference();
    const paymentLabel = cleanPaymentMethod === "cash" ? "Cash" : "Card";

    const [result] = await connection.query(
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
        partner_note,
        payment_status,
        booking_status
       )
       VALUES (?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'Paid', 'Approved')`,
      [
        bookingReference,
        req.user.property_id,
        room_id,
        String(full_name).trim(),
        String(email).trim(),
        String(nationality).trim(),
        country_code || "+94",
        String(phone).trim(),
        check_in,
        check_out,
        finalCheckInPackage,
        finalCheckOutPackage,
        guestCount,
        bookingUnits.nightUnits,
        bookingUnits.dayUnits,
        bookingUnits.nightUnits,
        guestCount,
        totalAmount,
        notes || null,
        `Reception walk-in payment: ${paymentLabel}`,
      ]
    );

    await connection.query(
      `UPDATE rooms
       SET available_rooms = available_rooms - 1
       WHERE id = ? AND property_id = ? AND available_rooms > 0`,
      [room_id, req.user.property_id]
    );

    await connection.commit();

    const property = await loadReceptionProperty(req.user.property_id);

    return res.status(201).json({
      success: true,
      message: `${paymentLabel} payment successful. Room marked occupied.`,
      booking_id: result.insertId,
      booking_reference: bookingReference,
      payment_status: "Paid",
      booking_status: "Approved",
      total_amount: totalAmount,
      payment_method: cleanPaymentMethod,
      data: property,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create reception booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating reception booking",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  loginReception,
  getReceptionProperty,
  updateReceptionRoomAvailability,
  getReceptionBookings,
  createReceptionBooking,
};
