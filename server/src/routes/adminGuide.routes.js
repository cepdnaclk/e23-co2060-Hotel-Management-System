const express = require("express");
const {
  getGuidesForAdmin,
  getGuideForAdmin,
  approveGuide,
  rejectGuide,
  removeGuide,
} = require("../controllers/adminGuide.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

const router = express.Router();

router.use(protect);
router.use(allowRoles("admin"));

router.get("/", getGuidesForAdmin);
router.get("/:id", getGuideForAdmin);
router.put("/:id/approve", approveGuide);
router.put("/:id/reject", rejectGuide);
router.delete("/:id", removeGuide);

module.exports = router;
