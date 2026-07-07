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

export const tourismEvents = [
  {
    id: "kandy-cultural-dance-night",
    slug: "kandy-cultural-dance-night",
    explorePlaceId: "temple-of-the-sacred-tooth-relic",
    title: "Kandy Cultural Dance Night",
    category: "Cultural & Religious",
    city: "Kandy",
    district: "Kandy",
    venue: "Kandy Lake Club Cultural Theatre",
    monthName: "July",
    dateLabel: "Every evening",
    timeLabel: "6:30 PM - 8:15 PM",
    priceType: "Budget",
    price: 1500,
    priceLabel: "LKR 1,500",
    duration: "1 hr 45 min",
    shortDescription:
      "Traditional Kandyan dance, drumming, masks, and fire performance close to Kandy Lake and the Temple of the Tooth.",
    description:
      "A colourful evening experience for tourists who want to understand Sri Lankan culture in a short time. The performance includes Kandyan dance, traditional drums, mask dances, and a fire walking finale.",
    imageUrl:
      "https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1400&q=85",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Kandy+Lake+Club+Cultural+Dance",
    nearHotels: ["Kandy Lake Hotel", "Queen's Hotel", "Temple View Hotel", "Lake View Resort"],
    highlights: ["Kandyan dance and drumming", "Easy evening plan", "Family friendly", "Near Kandy hotels"],
    guideRecommended: true,
    featured: true,
  },
  {
    id: "colombo-street-food-walk",
    slug: "colombo-street-food-walk",
    explorePlaceId: "",
    title: "Colombo Street Food Walk",
    category: "Food & Culinary",
    city: "Colombo",
    district: "Colombo",
    venue: "Galle Face and Pettah Market",
    monthName: "August",
    dateLabel: "Weekends",
    timeLabel: "5:00 PM - 8:30 PM",
    priceType: "Paid",
    price: 3500,
    priceLabel: "LKR 3,500",
    duration: "3 hr 30 min",
    shortDescription:
      "Taste kottu, hoppers, isso wade, tropical juices, and Sri Lankan sweets while exploring Colombo's evening food streets.",
    description:
      "A city food route designed for tourists staying in Colombo before travelling around the island. It combines local snacks, market stops, city stories, and safe walking guidance.",
    imageUrl:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=85",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Galle+Face+Colombo+street+food",
    nearHotels: ["Cinnamon Grand", "Galle Face Hotel", "Marino Beach Colombo", "Colombo City Stay"],
    highlights: ["Sri Lankan street food", "Pettah market walk", "Vegetarian options", "City evening photos"],
    guideRecommended: true,
    featured: true,
  },
  {
    id: "mirissa-sunset-beach-music",
    slug: "mirissa-sunset-beach-music",
    explorePlaceId: "mirissa-beach-and-whale-watching",
    title: "Mirissa Sunset Beach Music",
    category: "Beach & Coastal",
    city: "Mirissa",
    district: "Matara",
    venue: "Mirissa Beach",
    monthName: "December",
    dateLabel: "Friday - Sunday",
    timeLabel: "5:30 PM - 10:00 PM",
    priceType: "Free",
    price: 0,
    priceLabel: "Free entry",
    duration: "4 hr 30 min",
    shortDescription:
      "A relaxed beach evening with sunset views, soft music, seafood stalls, mocktails, and coastal atmosphere.",
    description:
      "A casual event for backpackers, couples, and beach lovers. Tourists can enjoy the sunset after whale watching or surfing and then return easily to nearby stays.",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Mirissa+Beach+Sri+Lanka",
    nearHotels: ["Mirissa Beach Resort", "Coconut Tree Hill Stay", "South Coast Villa"],
    highlights: ["Sunset beach atmosphere", "Live acoustic music", "Food stalls", "Walking distance from beach hotels"],
    guideRecommended: false,
    featured: true,
  },
  {
    id: "ella-tea-estate-experience",
    slug: "ella-tea-estate-experience",
    explorePlaceId: "nine-arch-bridge",
    title: "Ella Tea Estate Experience",
    category: "Adventure & Nature",
    city: "Ella",
    district: "Badulla",
    venue: "Halpewatte Tea Factory",
    monthName: "March",
    dateLabel: "Daily",
    timeLabel: "9:00 AM - 12:00 PM",
    priceType: "Budget",
    price: 2200,
    priceLabel: "LKR 2,200",
    duration: "3 hr",
    shortDescription:
      "Walk through tea gardens, learn how Ceylon tea is produced, and enjoy a tasting session with hill-country views.",
    description:
      "This morning experience fits well with Ella sightseeing. It is ideal before Nine Arch Bridge or Little Adam's Peak and connects nature, photography, and local tea culture.",
    imageUrl:
      "https://images.unsplash.com/photo-1567515275959-4421b83c7056?auto=format&fit=crop&w=1400&q=85",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Halpewatte+Tea+Factory+Ella",
    nearHotels: ["Ella Mountain Resort", "Morning Dew Hotel", "Zion View Ella", "Tea Garden View"],
    highlights: ["Tea garden walk", "Factory tour", "Tea tasting", "Hill-country views"],
    guideRecommended: true,
    featured: true,
  },
  {
    id: "galle-fort-heritage-evening",
    slug: "galle-fort-heritage-evening",
    explorePlaceId: "galle-fort",
    title: "Galle Fort Heritage Evening",
    category: "Cultural & Religious",
    city: "Galle",
    district: "Galle",
    venue: "Galle Dutch Fort",
    monthName: "January",
    dateLabel: "This month",
    timeLabel: "4:00 PM - 7:00 PM",
    priceType: "Budget",
    price: 2800,
    priceLabel: "LKR 2,800",
    duration: "3 hr",
    shortDescription:
      "Explore colonial streets, lighthouse views, boutique cafes, and sunset stories inside the UNESCO-listed Galle Fort.",
    description:
      "A heritage evening walk designed for tourists who want a calm cultural experience near boutique hotels and restaurants in Galle Fort.",
    imageUrl:
      "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1400&q=85",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Galle+Fort+Sri+Lanka",
    nearHotels: ["Fort Bazaar", "Galle Fort Hotel", "Heritage Villa", "Rampart View Stay"],
    highlights: ["UNESCO fort walk", "Sunset ramparts", "Colonial architecture", "Cafe stops"],
    guideRecommended: true,
    featured: false,
  },
  {
    id: "sigiriya-village-food-experience",
    slug: "sigiriya-village-food-experience",
    explorePlaceId: "sigiriya-rock-fortress",
    title: "Sigiriya Village Food Experience",
    category: "Food & Culinary",
    city: "Sigiriya",
    district: "Matale",
    venue: "Sigiriya Village Area",
    monthName: "February",
    dateLabel: "Daily",
    timeLabel: "11:00 AM - 2:00 PM",
    priceType: "Paid",
    price: 4200,
    priceLabel: "LKR 4,200",
    duration: "3 hr",
    shortDescription:
      "Cook and taste rice and curry, coconut sambol, herbal drinks, and village-style sweets after a Sigiriya morning visit.",
    description:
      "A local food experience for tourists visiting Sigiriya or Dambulla. It is suitable as a lunch stop after the rock fortress climb.",
    imageUrl:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1400&q=85",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Sigiriya+village+tour+Sri+Lanka",
    nearHotels: ["Sigiriya Village Hotel", "Aliya Resort", "Water Garden Sigiriya"],
    highlights: ["Village cooking", "Traditional lunch", "Local host family", "Great after Sigiriya climb"],
    guideRecommended: true,
    featured: false,
  },
  {
    id: "bentota-water-sports-day",
    slug: "bentota-water-sports-day",
    explorePlaceId: "",
    title: "Bentota Water Sports Day",
    category: "Adventure & Nature",
    city: "Bentota",
    district: "Galle",
    venue: "Bentota River",
    monthName: "April",
    dateLabel: "Daily",
    timeLabel: "10:00 AM - 4:00 PM",
    priceType: "Premium",
    price: 9500,
    priceLabel: "From LKR 9,500",
    duration: "Half day",
    shortDescription:
      "Jet ski, banana boat, river safari, and beginner-friendly water activities near Bentota beach hotels.",
    description:
      "A high-energy coastal activity day for tourists who want more than beach relaxation. Activity choices can be selected based on comfort and weather.",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Bentota+water+sports",
    nearHotels: ["Taj Bentota", "Avani Bentota", "Bentota Beach Resort"],
    highlights: ["Water sports", "River safari", "Beach hotels nearby", "Instructor support"],
    guideRecommended: false,
    featured: false,
  },
  {
    id: "yala-wildlife-evening-talk",
    slug: "yala-wildlife-evening-talk",
    explorePlaceId: "yala-national-park",
    title: "Yala Wildlife Evening Talk",
    category: "Adventure & Nature",
    city: "Yala",
    district: "Hambantota",
    venue: "Tissamaharama Safari Camp Area",
    monthName: "June",
    dateLabel: "Selected evenings",
    timeLabel: "6:30 PM - 8:00 PM",
    priceType: "Free",
    price: 0,
    priceLabel: "Free for safari guests",
    duration: "1 hr 30 min",
    shortDescription:
      "Learn safari safety, leopard behaviour, birdlife, and responsible wildlife tourism before a Yala safari day.",
    description:
      "A useful evening session for tourists planning a safari. It improves safety awareness and helps visitors understand Yala without disturbing wildlife.",
    imageUrl:
      "https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=1400&q=85",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Yala+National+Park+Sri+Lanka",
    nearHotels: ["Yala Safari Camp", "Cinnamon Wild Yala", "Tissa Lake Resort"],
    highlights: ["Safari safety", "Wildlife awareness", "Leopard and birdlife facts", "Responsible travel"],
    guideRecommended: true,
    featured: false,
  },
];

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

const placeIdAliases = {
  "1": "sigiriya-rock-fortress",
  "2": "temple-of-the-sacred-tooth-relic",
  "3": "nine-arch-bridge",
  "4": "mirissa-beach-and-whale-watching",
  "5": "galle-fort",
  "6": "yala-national-park",
  "7": "nuwara-eliya-tea-plantations",
  "8": "dambulla-cave-temple",
  "9": "trincomalee-beaches",
  "10": "adams-peak",
};

export const getFallbackEventsByPlace = (placeIdOrSlug) => {
  const key = String(placeIdOrSlug || "");
  const alias = placeIdAliases[key] || key;
  return tourismEvents.filter(
    (event) => String(event.explorePlaceId) === key || String(event.explorePlaceId) === alias
  );
};
