const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");
const {
  getPartnerBookings,
  getPartnerGuideBookings,
  updatePartnerStatus,
  updatePartnerGuideStatus,
} = require("../controllers/guideBooking.controller");

const router = express.Router();

router.use(protect, allowRoles("partner"));

// Backward-compatible partner-wide endpoint. The current UI manages requests per guide.
router.get("/", getPartnerBookings);
router.patch("/:id/status", updatePartnerStatus);

// Preferred guide-specific endpoints.
router.get("/:guideId", getPartnerGuideBookings);
router.patch("/:guideId/:bookingId/status", updatePartnerGuideStatus);

module.exports = router;
