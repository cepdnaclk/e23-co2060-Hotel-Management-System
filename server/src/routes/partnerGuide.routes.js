const express = require("express");
const {
  getMyGuides,
  getMyGuideById,
  uploadGuideImage,
  createMyGuide,
  updateMyGuide,
  updateMyGuideStatus,
  deleteMyGuide,
} = require("../controllers/partnerGuide.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.use(protect);
router.use(allowRoles("partner"));

router.get("/", getMyGuides);
router.post("/", createMyGuide);
router.post("/upload-image", upload.single("image"), uploadGuideImage);
router.get("/:id", getMyGuideById);
router.put("/:id", updateMyGuide);
router.patch("/:id/status", updateMyGuideStatus);
router.delete("/:id", deleteMyGuide);

module.exports = router;
