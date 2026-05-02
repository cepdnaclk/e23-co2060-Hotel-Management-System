const express = require("express");

const {
  registerTourist,
  registerPartner,
  loginTourist,
  loginPartner,
  loginAdmin,
  getMe,
  registerAdmin,
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/tourist/register", registerTourist);
router.post("/tourist/login", loginTourist);

router.post("/partner/register", registerPartner);
router.post("/partner/login", loginPartner);

router.post("/admin/login", loginAdmin);
router.post("/admin/register", registerAdmin);

router.get("/me", protect, getMe);

module.exports = router;