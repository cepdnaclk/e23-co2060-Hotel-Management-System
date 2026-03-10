const db = require("../config/db");

exports.createBooking = (req, res) => {
  const { user_id, hotel_id, room_type_id, check_in, check_out, total_price } = req.body;

  const sql = `
    INSERT INTO bookings (user_id, hotel_id, room_type_id, check_in, check_out, total_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [user_id, hotel_id, room_type_id, check_in, check_out, total_price], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Booking failed" });
    }

    res.json({ message: "Booking created successfully" });
  });
};
exports.getUserBookings = (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT bookings.*, hotels.hotel_name, room_types.room_name
    FROM bookings
    JOIN hotels ON bookings.hotel_id = hotels.hotel_id
    JOIN room_types ON bookings.room_type_id = room_types.room_type_id
    WHERE bookings.user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error retrieving bookings" });
    }

    res.json(results);
  });
};
exports.cancelBooking = (req, res) => {
  const bookingId = req.params.bookingId;

  const sql = "UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?";

  db.query(sql, [bookingId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Cancel booking failed" });
    }

    res.json({ message: "Booking cancelled successfully" });
  });
};