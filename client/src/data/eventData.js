export const eventCategories = [
  "All",
  "Cultural & Religious",
  "Food & Culinary",
  "Beach & Coastal",
  "Adventure & Nature",
  "Arts & Recreational",
  "Destination Promotion",
  "Wellness",
  "Hotel Experience",
];

export const eventMonths = [
  "All Months",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const eventPriceFilters = ["Any Price", "Free", "Budget", "Paid", "Premium"];

export const normaliseEvent = (event) => ({
  ...event,
  id: event.slug || event.id,
  slug: event.slug || event.id,
  explorePlaceId: event.explore_place_slug || event.explorePlaceSlug || event.explorePlaceId || event.explore_place_id,
  imageUrl: event.image_url || event.imageUrl || event.image,
  mapUrl: event.map_url || event.mapUrl,
  monthName: event.month_name || event.monthName,
  dateLabel: event.date_label || event.dateLabel,
  timeLabel: event.time_label || event.timeLabel,
  priceType: event.price_type || event.priceType,
  priceLabel:
    event.price_label ||
    event.priceLabel ||
    (Number(event.price || 0) === 0 ? "Free entry" : `LKR ${Number(event.price || 0).toLocaleString()}`),
  shortDescription: event.short_description || event.shortDescription || "",
  nearHotels: Array.isArray(event.near_hotels) ? event.near_hotels : event.nearHotels || [],
  guideRecommended: Boolean(event.guide_recommended ?? event.guideRecommended),
  highlights: Array.isArray(event.highlights) ? event.highlights : event.highlights || [],
});

export const buildEventSearchText = (event) => {
  const item = normaliseEvent(event);
  return [
    item.title,
    item.category,
    item.city,
    item.district,
    item.venue,
    item.monthName,
    item.dateLabel,
    item.priceType,
    item.shortDescription,
    ...(item.nearHotels || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

export const buildEventLocationQuery = (event = {}) => {
  const item = normaliseEvent(event);

  return [item.venue, item.city, item.district, "Sri Lanka"]
    .filter(Boolean)
    .join(", ");
};

export const buildEventDirectionsUrl = (event = {}) => {
  const item = normaliseEvent(event);

  if (item.mapUrl && String(item.mapUrl).trim()) {
    return String(item.mapUrl).trim();
  }

  const query = buildEventLocationQuery(item) || "Sri Lanka";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
};

export const buildEventMapEmbedUrl = (event = {}) => {
  const item = normaliseEvent(event);

  if (item.mapEmbedUrl && String(item.mapEmbedUrl).trim()) {
    return String(item.mapEmbedUrl).trim();
  }

  const query = buildEventLocationQuery(item) || "Sri Lanka";

  return `https://www.google.com/maps?q=${encodeURIComponent(
    query
  )}&output=embed`;
};
