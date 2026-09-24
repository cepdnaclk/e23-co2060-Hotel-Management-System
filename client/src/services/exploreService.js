import api from "../api/api";

export { assetUrl } from "../utils/assetUrl";

/* =========================================================
   HOME
   ========================================================= */

export const getHomePageData = async () => {
  const res = await api.get("/home");

  return (
    res.data?.data || {
      sections: {},
      quickActions: [],
      featuredPlaces: [],
      featuredHotels: [],
      upcomingEvents: [],
      featuredGuides: [],
      stats: {
        places: 0,
        hotels: 0,
        events: 0,
        guides: 0,
      },
    }
  );
};

/* =========================================================
   EXPLORE
   ========================================================= */

export const getExploreCategories = async () => {
  const res = await api.get("/explore/categories");

  return res.data.categories || [];
};

export const getExplorePlaces = async (params = {}) => {
  const res = await api.get("/explore/places", {
    params,
  });

  return res.data.places || [];
};

export const getExplorePlace = async (id) => {
  const res = await api.get(`/explore/places/${id}`);

  return res.data.place;
};

export const getSeasonalPlaces = async (month) => {
  const res = await api.get("/explore/seasonal", {
    params: { month },
  });

  return res.data;
};

export const getExploreItineraries = async () => {
  const res = await api.get("/explore/itineraries");

  return res.data.itineraries || [];
};

/* =========================================================
   EVENTS
   ========================================================= */

export const getTouristEvents = async (params = {}) => {
  const res = await api.get("/tourist/events", {
    params,
  });

  return res.data.events || [];
};

export const getTouristEvent = async (slug) => {
  const res = await api.get(
    `/tourist/events/${encodeURIComponent(slug)}`
  );

  return res.data.event;
};

export const getTouristEventsByPlace = async (placeId) => {
  const res = await api.get(
    `/tourist/events/by-place/${placeId}`
  );

  return res.data.events || [];
};

export const getTouristEventBySlug = async (slug) => {
  const res = await api.get(
    `/tourist/events/${encodeURIComponent(slug)}`
  );

  return res.data.event || null;
};

/* =========================================================
   FORMATTERS
   ========================================================= */

export const formatLkr = (amount) => {
  const value = Number(amount || 0);

  return `LKR ${value.toLocaleString()}`;
};