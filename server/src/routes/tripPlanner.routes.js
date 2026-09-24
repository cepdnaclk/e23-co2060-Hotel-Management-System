const express =
  require("express");


const {
  getTripPlannerBootstrap,

  createTripPlan,

  getMyTripPlans,

  getTripPlanById,

  updateTripPlan,

  deleteTripPlan,

  testTripPlannerRouting,
} = require(
  "../controllers/tripPlanner.controller"
);


const {
  analyzeTripPlannerRoute,
} = require(
  "../controllers/tripPlannerRouting.controller"
);


const {
  applyRecommendedRoute,
} = require(
  "../controllers/tripPlannerApply.controller"
);


const {
  optionalProtect,
} = require(
  "../middleware/auth.middleware"
);


const router =
  express.Router();


/* =========================================================
   BOOTSTRAP
========================================================= */

router.get(
  "/bootstrap",
  getTripPlannerBootstrap
);


/* =========================================================
   SMART ROAD ROUTING
========================================================= */

router.post(
  "/routing/analyze",
  optionalProtect,
  analyzeTripPlannerRoute
);


router.post(
  "/routing/apply",
  optionalProtect,
  applyRecommendedRoute
);


/* =========================================================
   TEMPORARY DEVELOPMENT ROUTING TEST
========================================================= */

if (
  process.env.NODE_ENV !==
  "production"
) {
  router.post(
    "/routing/test",
    testTripPlannerRouting
  );
}


/* =========================================================
   SAVED TRIP PLANS
========================================================= */

router.post(
  "/plans",
  optionalProtect,
  createTripPlan
);


router.get(
  "/plans",
  optionalProtect,
  getMyTripPlans
);


router.get(
  "/plans/:id",
  optionalProtect,
  getTripPlanById
);


router.put(
  "/plans/:id",
  optionalProtect,
  updateTripPlan
);


router.delete(
  "/plans/:id",
  optionalProtect,
  deleteTripPlan
);


module.exports =
  router;