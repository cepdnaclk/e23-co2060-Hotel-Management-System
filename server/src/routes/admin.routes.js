const express = require("express");

const {
  getAdminDashboard,
  getPropertiesForAdmin,
  getPendingProperties,
  getApprovedPropertiesForAdmin,
  getPropertyForReview,
  approveProperty,
  rejectProperty,
  updatePropertyPaymentByAdmin,
  removeProperty,
  getRegistrationPayments,
  getMonthlyPayments,
  getPaymentPlans,
  createPaymentPlan,
  updatePaymentPlan,
  getRevenueReport,
  getPartners,
  getTourists,
  getBookings,
} = require("../controllers/admin.controller");

const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

const router = express.Router();

router.use(protect);
router.use(allowRoles("admin"));

router.get("/dashboard", getAdminDashboard);

router.get("/registration-payments", getRegistrationPayments);
router.get("/monthly-payments", getMonthlyPayments);

router.get("/plans", getPaymentPlans);
router.post("/plans", createPaymentPlan);
router.put("/plans/:id", updatePaymentPlan);

router.get("/revenue", getRevenueReport);

router.get("/properties", getPropertiesForAdmin);
router.get("/properties/pending", getPendingProperties);
router.get("/properties/approved", getApprovedPropertiesForAdmin);
router.get("/properties/:id", getPropertyForReview);

router.put("/properties/:id/approve", approveProperty);
router.put("/properties/:id/reject", rejectProperty);
router.put("/properties/:id/payment", updatePropertyPaymentByAdmin);
router.delete("/properties/:id", removeProperty);

router.get("/partners", getPartners);
router.get("/tourists", getTourists);
router.get("/bookings", getBookings);

module.exports = router;
