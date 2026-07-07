import api from "../api/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const assetUrl = (url) => {
  if (!url) return "";
  if (String(url).startsWith("http")) return url;
  return `${SERVER_BASE_URL}${url}`;
};

export const getExploreCategories = async () => {
  const res = await api.get("/explore/categories");
  return res.data.categories || [];
};

export const getExplorePlaces = async (params = {}) => {
  const res = await api.get("/explore/places", { params });
  return res.data.places || [];
};

export const getExplorePlace = async (id) => {
  const res = await api.get(`/explore/places/${id}`);
  return res.data.place;
};

export const getSeasonalPlaces = async (month) => {
  const res = await api.get("/explore/seasonal", { params: { month } });
  return res.data;
};

export const getExploreItineraries = async () => {
  const res = await api.get("/explore/itineraries");
  return res.data.itineraries || [];
};

export const formatLkr = (amount) => {
  const value = Number(amount || 0);
  return `LKR ${value.toLocaleString()}`;
};


export const getTouristEvents = async (params = {}) => {
  const res = await api.get("/tourist/events", { params });
  return res.data.events || [];
};

export const getTouristEventsByPlace = async (placeId) => {
  const res = await api.get(`/tourist/events/by-place/${placeId}`);
  return res.data.events || [];
};
