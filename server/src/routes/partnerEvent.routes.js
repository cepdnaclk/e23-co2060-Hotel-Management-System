const express = require("express");
const {
  getMyPartnerEvents,
  getMyPartnerEventById,
  uploadPartnerEventImage,
  createMyPartnerEvent,
  updateMyPartnerEvent,
  updateMyPartnerEventStatus,
  deleteMyPartnerEvent,
} = require("../controllers/partnerEvent.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.use(protect);
router.use(allowRoles("partner"));

router.get("/", getMyPartnerEvents);
router.post("/", createMyPartnerEvent);
router.post("/upload-image", upload.single("image"), uploadPartnerEventImage);
router.get("/:id", getMyPartnerEventById);
router.put("/:id", updateMyPartnerEvent);
router.patch("/:id/status", updateMyPartnerEventStatus);
router.delete("/:id", deleteMyPartnerEvent);

module.exports = router;
