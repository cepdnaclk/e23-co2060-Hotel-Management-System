export const exploreCategories = [
  { id: "all", label: "All Experiences", icon: "🌴" },
  { id: "beach", label: "Beaches", icon: "🏖️" },
  { id: "heritage", label: "Heritage", icon: "🏛️" },
  { id: "wildlife", label: "Wildlife", icon: "🐘" },
  { id: "mountain", label: "Mountains", icon: "⛰️" },
  { id: "waterfall", label: "Waterfalls", icon: "💧" },
  { id: "religious", label: "Religious", icon: "🛕" },
  { id: "food", label: "Food & Cuisine", icon: "🍛" },
  { id: "festival", label: "Festivals", icon: "🎉" },
  { id: "adventure", label: "Adventure", icon: "🚆" },
];

export const sriLankaRegions = [
  "All Regions",
  "Cultural Triangle",
  "Hill Country",
  "Down South",
  "East Coast",
  "West Coast",
  "North",
];

export const budgetDailyTargets = {
  Low: 8000,
  Medium: 18000,
  High: 35000,
};

export const explorePlaces = [
  {
    id: 1,
    name: "Sigiriya Rock Fortress",
    category: "heritage",
    city: "Dambulla",
    district: "Matale",
    province: "Central Province",
    region: "Cultural Triangle",
    vibe: "Culture",
    budget: "Medium",
    budgetScore: 2,
    estimatedCost: 7500,
    duration: "3-4 hours",
    bestTime: "January to April",
    bestMonths: [0, 1, 2, 3],
    shortDescription: "Ancient rock fortress with frescoes, gardens, and panoramic views.",
    description:
      "Sigiriya is one of Sri Lanka's most iconic heritage sites. It is perfect for tourists who love history, photography, and sunrise climbs.",
    image:
      "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80",
    lat: 7.957,
    lng: 80.7603,
    tags: ["UNESCO", "History", "Viewpoint"],
    featured: true,
  },
  {
    id: 2,
    name: "Ella Nine Arch Bridge",
    category: "mountain",
    city: "Ella",
    district: "Badulla",
    province: "Uva Province",
    region: "Hill Country",
    vibe: "Scenic",
    budget: "Low",
    budgetScore: 1,
    estimatedCost: 2500,
    duration: "2-3 hours",
    bestTime: "December to March",
    bestMonths: [11, 0, 1, 2],
    shortDescription: "A famous railway bridge surrounded by tea fields and misty hills.",
    description:
      "Ella is a favourite hill-country destination with hikes, waterfalls, viewpoints, cafes, and the famous scenic train route.",
    image:
      "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80",
    lat: 6.8768,
    lng: 81.0608,
    tags: ["Train", "Photography", "Hiking"],
    featured: true,
  },
  {
    id: 3,
    name: "Mirissa Beach",
    category: "beach",
    city: "Mirissa",
    district: "Matara",
    province: "Southern Province",
    region: "Down South",
    vibe: "Relaxation",
    budget: "Medium",
    budgetScore: 2,
    estimatedCost: 5500,
    duration: "Half day",
    bestTime: "November to April",
    bestMonths: [10, 11, 0, 1, 2, 3],
    shortDescription: "Golden beach destination popular for whale watching and sunsets.",
    description:
      "Mirissa is ideal for tourists looking for beach stays, seafood, surfing, whale watching, and relaxed nightlife.",
    image:
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80",
    lat: 5.9483,
    lng: 80.4716,
    tags: ["Beach", "Whale Watching", "Sunset"],
    featured: true,
  },
  {
    id: 4,
    name: "Galle Fort",
    category: "heritage",
    city: "Galle",
    district: "Galle",
    province: "Southern Province",
    region: "Down South",
    vibe: "Culture",
    budget: "Low",
    budgetScore: 1,
    estimatedCost: 3000,
    duration: "3-5 hours",
    bestTime: "December to April",
    bestMonths: [11, 0, 1, 2, 3],
    shortDescription: "Colonial fort city with cafes, museums, sea views, and old streets.",
    description:
      "Galle Fort is a walkable coastal heritage area where tourists can explore boutique shops, Dutch architecture, museums, and sunset views.",
    image:
      "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80",
    lat: 6.0269,
    lng: 80.217,
    tags: ["UNESCO", "Old Town", "Sunset"],
    featured: true,
  },
  {
    id: 5,
    name: "Temple of the Tooth",
    category: "religious",
    city: "Kandy",
    district: "Kandy",
    province: "Central Province",
    region: "Cultural Triangle",
    vibe: "Spiritual",
    budget: "Low",
    budgetScore: 1,
    estimatedCost: 2500,
    duration: "2-3 hours",
    bestTime: "All year",
    bestMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    shortDescription: "Sacred Buddhist temple located near Kandy Lake.",
    description:
      "This is one of Sri Lanka's most important religious and cultural landmarks. It connects well with hotels around Kandy.",
    image:
      "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&w=1200&q=80",
    lat: 7.2936,
    lng: 80.6413,
    tags: ["Temple", "Culture", "Kandy"],
    featured: false,
  },
  {
    id: 6,
    name: "Yala National Park",
    category: "wildlife",
    city: "Tissamaharama",
    district: "Hambantota",
    province: "Southern Province",
    region: "Down South",
    vibe: "Adventure",
    budget: "High",
    budgetScore: 3,
    estimatedCost: 18000,
    duration: "Half day safari",
    bestTime: "February to July",
    bestMonths: [1, 2, 3, 4, 5, 6],
    shortDescription: "Wildlife safari destination known for leopards, elephants, and birds.",
    description:
      "Yala is a strong tourist attraction for nature lovers. It can be connected with hotels and safari packages in the booking system.",
    image:
      "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1200&q=80",
    lat: 6.3725,
    lng: 81.5207,
    tags: ["Safari", "Leopard", "Nature"],
    featured: true,
  },
  {
    id: 7,
    name: "Nuwara Eliya Tea Country",
    category: "mountain",
    city: "Nuwara Eliya",
    district: "Nuwara Eliya",
    province: "Central Province",
    region: "Hill Country",
    vibe: "Relaxation",
    budget: "Medium",
    budgetScore: 2,
    estimatedCost: 6500,
    duration: "1 day",
    bestTime: "February to April",
    bestMonths: [1, 2, 3],
    shortDescription: "Cool climate, tea estates, colonial buildings, and lake views.",
    description:
      "Nuwara Eliya gives tourists a different side of Sri Lanka with cool weather, tea factories, gardens, and family-friendly experiences.",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    lat: 6.9497,
    lng: 80.7891,
    tags: ["Tea", "Cool Climate", "Family"],
    featured: false,
  },
  {
    id: 8,
    name: "Diyaluma Falls",
    category: "waterfall",
    city: "Koslanda",
    district: "Badulla",
    province: "Uva Province",
    region: "Hill Country",
    vibe: "Adventure",
    budget: "Low",
    budgetScore: 1,
    estimatedCost: 3500,
    duration: "3-4 hours",
    bestTime: "January to September",
    bestMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    shortDescription: "A tall waterfall with natural pools and scenic viewpoints.",
    description:
      "Diyaluma is a great place for adventure travellers, photographers, and nature lovers visiting Ella or Badulla.",
    image:
      "https://images.unsplash.com/photo-1575994532957-773da2f935fb?auto=format&fit=crop&w=1200&q=80",
    lat: 6.7331,
    lng: 81.0319,
    tags: ["Waterfall", "Hiking", "Nature"],
    featured: false,
  },
  {
    id: 9,
    name: "Arugam Bay",
    category: "beach",
    city: "Arugam Bay",
    district: "Ampara",
    province: "Eastern Province",
    region: "East Coast",
    vibe: "Adventure",
    budget: "Medium",
    budgetScore: 2,
    estimatedCost: 7000,
    duration: "1-2 days",
    bestTime: "May to September",
    bestMonths: [4, 5, 6, 7, 8],
    shortDescription: "Sri Lanka's famous surfing destination on the east coast.",
    description:
      "Arugam Bay is ideal for surfers, backpackers, beach lovers, and tourists searching for relaxed east-coast stays.",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    lat: 6.8404,
    lng: 81.8368,
    tags: ["Surf", "Beach", "Nightlife"],
    featured: false,
  },
  {
    id: 10,
    name: "Colombo Street Food",
    category: "food",
    city: "Colombo",
    district: "Colombo",
    province: "Western Province",
    region: "West Coast",
    vibe: "Food",
    budget: "Low",
    budgetScore: 1,
    estimatedCost: 3500,
    duration: "2-3 hours",
    bestTime: "All year",
    bestMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    shortDescription: "Taste kottu, hoppers, isso wade, seafood, and local sweets.",
    description:
      "Food experiences help tourists connect with Sri Lankan culture. This can later connect with dining and restaurant reservation modules.",
    image:
      "https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=1200&q=80",
    lat: 6.9271,
    lng: 79.8612,
    tags: ["Kottu", "Hoppers", "Street Food"],
    featured: false,
  },
  {
    id: 11,
    name: "Kandy Esala Perahera",
    category: "festival",
    city: "Kandy",
    district: "Kandy",
    province: "Central Province",
    region: "Cultural Triangle",
    vibe: "Festival",
    budget: "Medium",
    budgetScore: 2,
    estimatedCost: 6000,
    duration: "Evening event",
    bestTime: "July or August",
    bestMonths: [6, 7],
    shortDescription: "A grand cultural procession with dancers, drummers, and decorated elephants.",
    description:
      "Festival content makes TourismHub LK feel local and useful because tourists can plan hotels around major events.",
    image:
      "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80",
    lat: 7.2906,
    lng: 80.6337,
    tags: ["Culture", "Event", "Kandy"],
    featured: false,
  },
  {
    id: 12,
    name: "Colombo to Ella Train Ride",
    category: "adventure",
    city: "Ella",
    district: "Badulla",
    province: "Uva Province",
    region: "Hill Country",
    vibe: "Scenic",
    budget: "Low",
    budgetScore: 1,
    estimatedCost: 2500,
    duration: "7-9 hours",
    bestTime: "All year",
    bestMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    shortDescription: "One of the most scenic railway journeys through tea country.",
    description:
      "This experience is perfect for itinerary planning because users can add it as a travel day between Colombo, Kandy, Nuwara Eliya, and Ella.",
    image:
      "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80",
    lat: 6.8721,
    lng: 81.0465,
    tags: ["Train", "Scenic", "Hill Country"],
    featured: false,
  },
];

export const travelStyles = ["Family", "Couple", "Solo", "Adventure", "Culture", "Relaxation", "Food", "Scenic", "Festival"];

export const travelTimeMatrix = {
  "Colombo__Galle": { label: "~2h via Southern Expressway", minutes: 120, mode: "Car" },
  "Galle__Mirissa": { label: "~45m via coastal road", minutes: 45, mode: "Car" },
  "Colombo__Kandy": { label: "~3h 30m by road or train", minutes: 210, mode: "Train/Car" },
  "Kandy__Nuwara Eliya": { label: "~2h 30m through tea country", minutes: 150, mode: "Car" },
  "Kandy__Ella": { label: "~6h scenic train", minutes: 360, mode: "Train" },
  "Nuwara Eliya__Ella": { label: "~2h 30m hill route", minutes: 150, mode: "Car" },
  "Ella__Koslanda": { label: "~1h 15m hill route", minutes: 75, mode: "Car" },
  "Ella__Tissamaharama": { label: "~2h 30m to safari gateway", minutes: 150, mode: "Car" },
  "Dambulla__Kandy": { label: "~2h 15m cultural route", minutes: 135, mode: "Car" },
  "Dambulla__Sigiriya": { label: "~30m local route", minutes: 30, mode: "Car" },
  "Dambulla__Colombo": { label: "~4h by road", minutes: 240, mode: "Car" },
  "Kandy__Dambulla": { label: "~2h 15m cultural route", minutes: 135, mode: "Car" },
  "Colombo__Ella": { label: "~7-9h scenic train", minutes: 480, mode: "Train" },
  "Colombo__Arugam Bay": { label: "~7h 30m east-coast route", minutes: 450, mode: "Car" },
};

const makeTravelKey = (fromCity, toCity) => `${fromCity}__${toCity}`;

export const getPlaceById = (placeId) => {
  return explorePlaces.find((place) => String(place.id) === String(placeId));
};

export const getTravelTime = (fromCity, toCity) => {
  if (!fromCity || !toCity) {
    return null;
  }

  if (fromCity === toCity) {
    return { label: "Same city / short local transfer", minutes: 20, mode: "Local" };
  }

  const direct = travelTimeMatrix[makeTravelKey(fromCity, toCity)];
  const reverse = travelTimeMatrix[makeTravelKey(toCity, fromCity)];

  return direct || reverse || { label: "Estimate unavailable — check route manually", minutes: 0, mode: "Manual" };
};

export const formatLkr = (amount) => {
  return `Rs. ${Number(amount || 0).toLocaleString("en-LK")}`;
};
