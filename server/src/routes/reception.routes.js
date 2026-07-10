const express = require("express");
const {
  loginReception,
  getReceptionProperty,
  updateReceptionRoomAvailability,
  getReceptionBookings,
  createReceptionBooking,
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
router.patch("/rooms/:roomId/availability", updateReceptionRoomAvailability);

module.exports = router;
