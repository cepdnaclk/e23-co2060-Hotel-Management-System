const verifyToken = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

const { createBooking, getUserBookings, cancelBooking } = require("../controllers/bookingController");

router.post("/", verifyToken, createBooking);
router.get("/user/:userId", getUserBookings);
router.delete("/:bookingId", cancelBooking);

module.exports = router;