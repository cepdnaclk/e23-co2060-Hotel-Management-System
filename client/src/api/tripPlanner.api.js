import api from "./api";


export const getTripPlannerBootstrap =
  async () => {
    const response =
      await api.get(
        "/trip-planner/bootstrap"
      );

    return response.data;
  };


export const getMyTripPlans =
  async () => {
    const response =
      await api.get(
        "/trip-planner/plans"
      );

    return response.data;
  };


export const getTripPlanById =
  async (tripPlanId) => {
    const response =
      await api.get(
        `/trip-planner/plans/${tripPlanId}`
      );

    return response.data;
  };


export const createTripPlan =
  async (payload) => {
    const response =
      await api.post(
        "/trip-planner/plans",
        payload
      );

    return response.data;
  };


export const updateTripPlan =
  async (
    tripPlanId,
    payload
  ) => {
    const response =
      await api.put(
        `/trip-planner/plans/${tripPlanId}`,
        payload
      );

    return response.data;
  };


export const deleteTripPlan =
  async (tripPlanId) => {
    const response =
      await api.delete(
        `/trip-planner/plans/${tripPlanId}`
      );

    return response.data;
  };


export const analyzeTripRoute =
  async (tripPlanId) => {
    const response =
      await api.post(
        "/trip-planner/routing/analyze",
        {
          tripPlanId,
        }
      );

    return response.data;
  };


export const applyTripRoute =
  async ({
    tripPlanId,
    analysisId,
  }) => {
    const response =
      await api.post(
        "/trip-planner/routing/apply",
        {
          tripPlanId,
          analysisId,
        }
      );

    return response.data;
  };