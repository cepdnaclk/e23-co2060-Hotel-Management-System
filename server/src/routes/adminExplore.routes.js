const express = require("express");
const upload = require("../middleware/upload.middleware");
const { protect } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");
const {
  getExplorePlaces,
  getExplorePlaceById,
  getAdminExploreCategories,
  createAdminExploreCategory,
  updateAdminExploreCategory,
  deleteAdminExploreCategory,
  adminCreateExplorePlace,
  adminUpdateExplorePlace,
  adminUploadExploreImages,
  adminDeleteExplorePlace,
  adminDeleteExploreImage,
} = require("../controllers/explore.controller");

const router = express.Router();

router.use(protect);
router.use(allowRoles("admin"));

router.get("/categories", getAdminExploreCategories);
router.post("/categories", createAdminExploreCategory);
router.put("/categories/:id", updateAdminExploreCategory);
router.delete("/categories/:id", deleteAdminExploreCategory);

router.get("/places", getExplorePlaces);
router.get("/places/:id", getExplorePlaceById);
router.post("/places", upload.array("photos", 10), adminCreateExplorePlace);
router.put("/places/:id", upload.array("photos", 10), adminUpdateExplorePlace);
router.post("/places/:id/images", upload.array("photos", 10), adminUploadExploreImages);
router.delete("/places/:id", adminDeleteExplorePlace);
router.delete("/images/:imageId", adminDeleteExploreImage);

module.exports = router;
