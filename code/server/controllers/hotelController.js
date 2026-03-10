const db = require("../config/db");

exports.getHotels = (req, res) => {
  const sql = "SELECT * FROM hotels";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error retrieving hotels" });
    }

    res.json(results);
  });
};
exports.searchHotels = (req, res) => {
  const city = req.query.city;

  const sql = "SELECT * FROM hotels WHERE city = ?";

  db.query(sql, [city], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Search failed" });
    }

    res.json(results);
  });
};
exports.getHotelRooms = (req, res) => {
  const hotelId = req.params.hotelId;

  const sql = "SELECT * FROM room_types WHERE hotel_id = ?";

  db.query(sql, [hotelId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error retrieving rooms" });
    }

    res.json(results);
  });
};
exports.addHotel = (req, res) => {
  const { partner_id, hotel_name, description, city, district, address } = req.body;

  const sql = `
    INSERT INTO hotels (partner_id, hotel_name, description, city, district, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [partner_id, hotel_name, description, city, district, address], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Hotel creation failed" });
    }

    res.json({ message: "Hotel added successfully" });
  });
};
exports.addRoom = (req, res) => {
  const { hotel_id, room_name, capacity, price, total_rooms } = req.body;

  const sql = `
    INSERT INTO room_types (hotel_id, room_name, capacity, price, total_rooms)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [hotel_id, room_name, capacity, price, total_rooms], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Room creation failed" });
    }

    res.json({ message: "Room added successfully" });
  });
};