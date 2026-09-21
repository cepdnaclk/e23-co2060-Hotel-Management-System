const express = require("express");
const {
  loginReception,
  getReceptionProperty,
  updateReceptionRoomAvailability,
  getReceptionBookings,
  createReceptionBooking,
  updateReceptionBookingStatus,
  updateReceptionBookingPayment,
} = require("../controllers/reception.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

const router = express.Router();

router.post("/login", loginReception);

router.use(protect);
router.use(allowRoles("reception"));

router.get("/property", getReceptionProperty);
router.get("/bookings", getReceptionBookings);
router.post("/bookings", createReceptionBooking);
router.patch("/bookings/:bookingId/status", updateReceptionBookingStatus);
router.patch("/bookings/:bookingId/payment", updateReceptionBookingPayment);
router.patch("/rooms/:roomId/availability", updateReceptionRoomAvailability);

module.exports = router;
