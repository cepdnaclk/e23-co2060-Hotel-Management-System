const express = require("express");
const {
  getEventsForAdmin,
  getEventForAdmin,
  approveEvent,
  rejectEvent,
  removeEvent,
} = require("../controllers/adminEvent.controller");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

const router = express.Router();

router.use(protect);
router.use(allowRoles("admin"));

router.get("/", getEventsForAdmin);
router.get("/:id", getEventForAdmin);
router.put("/:id/approve", approveEvent);
router.put("/:id/reject", rejectEvent);
router.delete("/:id", removeEvent);

module.exports = router;
