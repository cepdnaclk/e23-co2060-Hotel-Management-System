const verifyToken = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

const { getHotels , searchHotels , getHotelRooms, addHotel, addRoom } = require("../controllers/hotelController");

router.get("/", getHotels);
router.get("/search", searchHotels);
router.get("/:hotelId/rooms", getHotelRooms);
router.post("/", verifyToken, addHotel);
router.post("/rooms", verifyToken, addRoom);

module.exports = router;