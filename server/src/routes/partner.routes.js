const express = require("express");

const {
  getPlans,
  uploadImage,
  getPartnerProfile,
  getMyProperties,
  getMyPropertyById,
  createProperty,
  verifyPropertyPassword,
  updateMyProperty,
  updateMainPropertyPhoto,
  uploadMainPropertyPhoto,
  uploadLogoPropertyPhoto,
  uploadIntroPropertyPhoto,
  addRoomToMyProperty,
  updateMyRoom,
  uploadRoomPhoto,
  payRegistrationFee,
  payMonthlyFee,
  changePropertyPlan,
  deleteMyRoom,
  deleteMyProperty,
} = require("../controllers/partner.controller");

const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.use(protect);
router.use(allowRoles("partner"));

router.get("/plans", getPlans);
router.post("/upload-image", upload.single("image"), uploadImage);

router.get("/profile", getPartnerProfile);

router.get("/properties", getMyProperties);
router.post("/properties", createProperty);

router.get("/properties/:id", getMyPropertyById);
router.post("/properties/:id/verify-password", verifyPropertyPassword);
router.put("/properties/:id", updateMyProperty);
router.delete("/properties/:id", deleteMyProperty);

router.post("/properties/:id/pay-registration", payRegistrationFee);
router.post("/properties/:id/pay-monthly", payMonthlyFee);
router.put("/properties/:id/change-plan", changePropertyPlan);

router.post("/properties/:id/main-photo", updateMainPropertyPhoto);
router.post("/properties/:id/upload-main-photo", upload.single("image"), uploadMainPropertyPhoto);
router.post("/properties/:id/upload-logo", upload.single("image"), uploadLogoPropertyPhoto);
router.post("/properties/:id/upload-intro-photo", upload.single("image"), uploadIntroPropertyPhoto);

router.post("/properties/:id/rooms", addRoomToMyProperty);
router.put("/rooms/:roomId", updateMyRoom);
router.post("/rooms/:roomId/upload-photo", upload.single("image"), uploadRoomPhoto);
router.delete("/rooms/:roomId", deleteMyRoom);

module.exports = router;
