const express = require("express");

const {
  createBooking,
  getMyBookings,
  getPartnerBookings,
  approveBooking,
  rejectBooking,
  payOnlineBooking,
} = require("../controllers/booking.controller");

const {
  protect,
  optionalProtect,
} = require("../middleware/auth.middleware");

const { allowRoles } = require("../middleware/role.middleware");

const router = express.Router();

router.post("/", optionalProtect, createBooking);
router.get("/my", optionalProtect, getMyBookings);

router.put("/:id/pay-online", optionalProtect, payOnlineBooking);

router.get("/partner", protect, allowRoles("partner"), getPartnerBookings);
router.put("/partner/:id/approve", protect, allowRoles("partner"), approveBooking);
router.put("/partner/:id/reject", protect, allowRoles("partner"), rejectBooking);

module.exports = router;