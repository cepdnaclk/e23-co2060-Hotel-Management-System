export const SAVED_TRIP_ITEMS_KEY = "tourismhub_trip_places";
export const SAVED_TRIP_EVENT = "tourismhub:saved-places";

export const readTripItems = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_TRIP_ITEMS_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const writeTripItems = (items) => {
  const cleanItems = Array.isArray(items) ? items.filter(Boolean) : [];
  localStorage.setItem(SAVED_TRIP_ITEMS_KEY, JSON.stringify(cleanItems));
  window.dispatchEvent(new Event(SAVED_TRIP_EVENT));
};

export const isTripItemSaved = (itemId, items = readTripItems()) =>
  items.some((item) => String(item.id) === String(itemId));

export const toggleTripItem = (item) => {
  if (!item?.id) {
    return { saved: false, items: readTripItems() };
  }

  const current = readTripItems();
  const exists = current.some((savedItem) => String(savedItem.id) === String(item.id));
  const nextItems = exists
    ? current.filter((savedItem) => String(savedItem.id) !== String(item.id))
    : [...current, item];

  writeTripItems(nextItems);
  return { saved: !exists, items: nextItems };
};

export const removeTripItem = (itemId) => {
  const current = readTripItems();
  const nextItems = current.filter((item) => String(item.id) !== String(itemId));
  writeTripItems(nextItems);
  return nextItems;
};

export const clearTripItems = () => {
  writeTripItems([]);
};

export const getTripItemImage = (item) =>
  item?.image || item?.imageUrl || item?.image_url || item?.main_image || "";

export const getTripItemTypeLabel = (item) => {
  const type = String(item?.tripItemType || item?.type || "Place").toLowerCase();
  if (type === "hotel") return "Hotel";
  if (type === "event") return "Event";
  if (type === "guide") return "Guide";
  return "Place";
};

export const TRIP_CATEGORY_ORDER = [
  { key: "destinations", label: "Destinations", icon: "📍" },
  { key: "events", label: "Events", icon: "🎟️" },
  { key: "hotels", label: "Hotels", icon: "🏨" },
  { key: "guides", label: "Guides", icon: "🧭" },
];

export const getTripItemCategoryKey = (item) => {
  const type = String(item?.tripItemType || item?.type || "place").toLowerCase();
  if (type === "hotel") return "hotels";
  if (type === "event") return "events";
  if (type === "guide") return "guides";
  return "destinations";
};

export const groupTripItemsByType = (items = [], { includeEmpty = false } = {}) => {
  const buckets = { destinations: [], hotels: [], guides: [], events: [] };

  items.filter(Boolean).forEach((item) => {
    buckets[getTripItemCategoryKey(item)].push(item);
  });

  return TRIP_CATEGORY_ORDER
    .map(({ key, label, icon }) => ({ key, label, icon, items: buckets[key] }))
    .filter((group) => includeEmpty || group.items.length > 0);
};
