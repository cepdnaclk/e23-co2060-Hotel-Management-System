// Sri Lanka Tourism Hub - Explore Data
// Complete data for places with detailed information

export const formatLkr = (amount) => {
  return `LKR ${amount.toLocaleString()}`;
};

export const sriLankaRegions = [
  "All Regions",
  "Cultural Triangle",
  "Hill Country",
  "South Coast",
  "West Coast",
  "East Coast",
  "Northern Region",
];

export const exploreCategories = [
  { id: "all", label: "All Places", icon: "🌏" },
  { id: "heritage", label: "Heritage Sites", icon: "🏛️" },
  { id: "nature", label: "Nature & Wildlife", icon: "🌿" },
  { id: "beach", label: "Beaches", icon: "🏖️" },
  { id: "adventure", label: "Adventure", icon: "🎯" },
  { id: "spiritual", label: "Spiritual", icon: "🙏" },
  { id: "food", label: "Food & Culture", icon: "🍛" },
];

export const travelStyles = [
  "Culture",
  "Adventure",
  "Relaxation",
  "Wildlife",
  "Photography",
  "Food",
  "Spiritual",
];

export const budgetDailyTargets = {
  Low: 8000,
  Medium: 18000,
  High: 45000,
};









export const explorePlaces = [
  {
    id: 1,
    name: "Sigiriya Rock Fortress",
    city: "Sigiriya",
    district: "Matale",
    region: "Cultural Triangle",
    category: "heritage",
    image: "https://images.pexels.com/photos/34128244/pexels-photo-34128244.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    images: [
      "https://images.pexels.com/photos/34128244/pexels-photo-34128244.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/34128249/pexels-photo-34128249.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/12205267/pexels-photo-12205267.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
    ],
    shortDescription: "An ancient rock fortress rising 200m above the jungle, featuring stunning frescoes and the remains of a 5th-century palace.",
    fullDescription: "Sigiriya, also known as Lion Rock, is a stunning ancient rock fortress and UNESCO World Heritage Site located in the heart of Sri Lanka's Cultural Triangle. Rising nearly 200 meters above the surrounding jungle, this architectural marvel was built by King Kashyapa in the 5th century AD.\n\nThe fortress features the famous Sigiriya Frescoes – ancient paintings of celestial maidens that have survived for over 1,500 years. The Mirror Wall, once polished to reflect the king's image, now bears ancient graffiti dating back to the 8th century.\n\nAt the midpoint of the climb, you'll encounter the massive Lion's Paws, all that remains of a giant lion structure that once guarded the entrance to the palace. The summit reveals the ruins of the royal palace, gardens, and water features that showcase the sophisticated hydraulic engineering of ancient Sri Lanka.\n\nThe surrounding gardens include some of the oldest landscaped gardens in the world, featuring water gardens, boulder gardens, and terraced gardens that demonstrate the advanced understanding of landscape architecture.",
    tags: ["UNESCO", "Ancient", "Hiking", "Photography", "History"],
    duration: "3-4 hours",
    bestTime: "Dec - Apr",
    bestMonths: [11, 0, 1, 2, 3],
    budget: "Medium",
    budgetScore: 2,
    estimatedCost: 8500,
    lat: 7.957,
    lng: 80.7603,
    featured: true,
    vibe: "Culture",
    experiences: [
      {
        title: "Sunrise Climb",
        description: "Experience the magical sunrise from the summit, watching the mist lift over the jungle canopy. Start climbing at 6:30 AM to reach the top before 8 AM.",
        duration: "2-3 hours",
        cost: 8500
      },
      {
        title: "Frescoes Gallery Visit",
        description: "Marvel at the ancient paintings of Apsaras (celestial maidens) preserved in a sheltered pocket of the rock face. These 5th-century artworks are masterpieces of Sri Lankan art.",
        duration: "30 minutes",
        cost: 0
      },
      {
        title: "Mirror Wall Walk",
        description: "Walk along the ancient polished wall that once reflected like a mirror. Read graffiti written by ancient visitors over 1,000 years ago.",
        duration: "20 minutes",
        cost: 0
      },
      {
        title: "Water Gardens Exploration",
        description: "Explore the sophisticated water gardens at the base, featuring fountains that still work during the rainy season, pools, and channels.",
        duration: "1 hour",
        cost: 0
      },
      {
        title: "Pidurangala Rock Alternative",
        description: "Climb the adjacent Pidurangala Rock for panoramic views of Sigiriya. Less crowded and offers stunning photography opportunities.",
        duration: "1.5 hours",
        cost: 1000
      }
    ],
    highlights: [
      {
        icon: "🏛️",
        title: "UNESCO World Heritage",
        description: "Recognized since 1982 as a site of outstanding universal value"
      },
      {
        icon: "🎨",
        title: "Ancient Frescoes",
        description: "1,500-year-old paintings of celestial maidens"
      },
      {
        icon: "🦁",
        title: "Lion's Paws Entrance",
        description: "Massive lion paw sculptures guard the ascent to the summit"
      },
      {
        icon: "💧",
        title: "Ancient Hydraulics",
        description: "Sophisticated water gardens with 5th-century engineering"
      }
    ],
    nearbyPlaces: [
      { name: "Pidurangala Rock", distance: "1.5 km", type: "Viewpoint" },
      { name: "Dambulla Cave Temple", distance: "17 km", type: "Heritage" },
      { name: "Minneriya National Park", distance: "25 km", type: "Wildlife" },
      { name: "Polonnaruwa", distance: "60 km", type: "Ancient City" }
    ],
    tips: [
      "Start early (6:30 AM) to avoid crowds and heat",
      "Bring at least 2 liters of water per person",
      "Wear comfortable shoes with good grip for the climb",
      "The climb has 1,200 steps – take breaks as needed",
      "Beware of wasps during September-October",
      "Photography of frescoes may be restricted"
    ],
    openingHours: "7:00 AM - 5:30 PM daily",
    entryFee: "LKR 30 (locals) / USD 30 (foreigners)",
    facilities: ["Parking", "Washrooms", "Guided Tours", "Souvenir Shops", "First Aid"]
  },
  {
    id: 2,
    name: "Temple of the Sacred Tooth Relic",
    city: "Kandy",
    district: "Kandy",
    region: "Hill Country",
    category: "spiritual",
    image: "https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    images: [
      "https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/739409/pexels-photo-739409.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/27907342/pexels-photo-27907342.png?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
    ],
    shortDescription: "Sri Lanka's most sacred Buddhist temple, housing the tooth relic of Buddha within the historic Royal Palace complex.",
    fullDescription: "Sri Dalada Maligawa, the Temple of the Sacred Tooth Relic, is the most venerated Buddhist temple in Sri Lanka and a UNESCO World Heritage Site. Located in the heart of Kandy city, within the former Royal Palace complex, this temple houses what is believed to be the left canine tooth of Lord Buddha.\n\nThe tooth relic has immense spiritual and political significance in Sri Lankan history. According to legend, whoever holds the relic holds the governance of the country. The relic was brought to Sri Lanka in the 4th century AD, hidden in the hair of Princess Hemamali.\n\nThe temple complex showcases stunning Kandyan architecture with its golden roof, intricate wood carvings, and beautiful paintings depicting Buddhist stories. The relic is kept in a golden casket within seven concentric caskets within the inner shrine.\n\nThree daily pujas (religious ceremonies) are held at 5:30 AM, 9:30 AM, and 6:30 PM, when the inner chamber is opened and devotees can catch a glimpse of the casket. The annual Esala Perahera festival in July/August is a spectacular 10-day celebration honoring the Sacred Tooth.",
    tags: ["Buddhist", "UNESCO", "Sacred", "Architecture", "Festival"],
    duration: "2-3 hours",
    bestTime: "Year-round, Jul-Aug for Perahera",
    bestMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    budget: "Low",
    budgetScore: 1,
    estimatedCost: 3500,
    lat: 7.2936,
    lng: 80.6413,
    featured: true,
    vibe: "Spiritual",
    experiences: [
      {
        title: "Witness the Evening Puja",
        description: "Attend the 6:30 PM ceremony when monks perform rituals and the golden casket housing the tooth relic is briefly displayed to devotees.",
        duration: "1 hour",
        cost: 2000
      },
      {
        title: "Explore the Museum",
        description: "Visit the temple museum housing gifts from world leaders, ancient manuscripts, and relics associated with the temple's history.",
        duration: "45 minutes",
        cost: 500
      },
      {
        title: "Kandyan Dance Performance",
        description: "Watch traditional Kandyan dancers perform in the adjacent cultural center, featuring fire walking and acrobatic drumming.",
        duration: "1 hour",
        cost: 1500
      },
      {
        title: "Kandy Lake Walk",
        description: "Stroll around the scenic Kandy Lake adjacent to the temple, offering beautiful views and photo opportunities.",
        duration: "45 minutes",
        cost: 0
      },
      {
        title: "Esala Perahera Festival",
        description: "If visiting in July/August, witness the magnificent procession featuring decorated elephants, drummers, dancers, and the sacred tooth casket.",
        duration: "4-5 hours",
        cost: 5000
      }
    ],
    highlights: [
      {
        icon: "🦷",
        title: "Sacred Tooth Relic",
        description: "Buddha's tooth, brought to Sri Lanka in the 4th century"
      },
      {
        icon: "👑",
        title: "Royal Palace Complex",
        description: "Set within the last Kandyan king's palace grounds"
      },
      {
        icon: "🎭",
        title: "Esala Perahera",
        description: "Asia's grandest Buddhist festival held annually"
      },
      {
        icon: "🏛️",
        title: "Kandyan Architecture",
        description: "Finest examples of traditional Sri Lankan craftsmanship"
      }
    ],
    nearbyPlaces: [
      { name: "Kandy Lake", distance: "0.2 km", type: "Scenic" },
      { name: "Royal Botanical Gardens", distance: "6 km", type: "Nature" },
      { name: "Bahirawakanda Temple", distance: "3 km", type: "Spiritual" },
      { name: "Udawattakele Forest", distance: "1 km", type: "Nature" }
    ],
    tips: [
      "Dress modestly – cover shoulders and knees",
      "Remove shoes before entering the temple",
      "Avoid turning your back to Buddha statues",
      "Photography may be restricted in inner areas",
      "Book tickets early for Esala Perahera",
      "Visit during puja times for the full experience"
    ],
    openingHours: "5:30 AM - 8:00 PM daily",
    entryFee: "LKR 500 (locals) / LKR 2000 (foreigners)",
    facilities: ["Shoe Storage", "Washrooms", "Museum", "Gift Shop", "Guide Services"]
  },
  {
    id: 3,
    name: "Nine Arch Bridge",
    city: "Ella",
    district: "Badulla",
    region: "Hill Country",
    category: "heritage",
    image: "https://images.pexels.com/photos/4769075/pexels-photo-4769075.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    images: [
      "https://images.pexels.com/photos/4769075/pexels-photo-4769075.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/2403209/pexels-photo-2403209.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/18498686/pexels-photo-18498686.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
    ],
    shortDescription: "An iconic colonial-era railway viaduct surrounded by lush tea plantations, perfect for photography enthusiasts.",
    fullDescription: "The Nine Arch Bridge, also known as the Bridge in the Sky, is one of the most iconic landmarks in Sri Lanka's hill country. Built during British colonial rule in 1921, this stunning viaduct stands 24 meters high and spans 91 meters across a steep valley in Demodara.\n\nWhat makes this bridge remarkable is that it was constructed entirely from stone, brick, and cement without using any steel – a necessity during World War I when steel was scarce. The bridge is a testament to the engineering prowess of P.K. Appuhamy, a local foreman who led the construction.\n\nSurrounded by verdant tea plantations and misty mountains, the bridge creates a picture-perfect scene, especially when the blue trains of Sri Lanka Railways pass across it. The sight of a train crossing the bridge against the backdrop of lush greenery has made this one of the most photographed locations in Sri Lanka.\n\nThe area around the bridge offers easy hiking trails through tea estates, where you can interact with tea pluckers and learn about the tea-making process that has defined this region for over a century.",
    tags: ["Colonial", "Railway", "Photography", "Tea Estates", "Hiking"],
    duration: "2-3 hours",
    bestTime: "Year-round, best 6-9 AM",
    bestMonths: [0, 1, 2, 3, 11],
    budget: "Low",
    budgetScore: 1,
    estimatedCost: 2500,
    lat: 6.8788,
    lng: 81.0571,
    featured: true,
    vibe: "Photography",
    experiences: [
      {
        title: "Train Photography Session",
        description: "Capture the iconic shot of the blue train crossing the bridge. Trains typically pass at 9:05 AM, 11:00 AM, 2:00 PM, and 5:00 PM.",
        duration: "2 hours",
        cost: 0
      },
      {
        title: "Tea Estate Walk",
        description: "Walk through the surrounding tea plantations, meet local tea pluckers, and learn about Ceylon tea production.",
        duration: "1-2 hours",
        cost: 500
      },
      {
        title: "Sunrise Visit",
        description: "Arrive at dawn to experience the bridge emerging from morning mist, creating ethereal photography conditions.",
        duration: "1.5 hours",
        cost: 0
      },
      {
        title: "Walk on the Bridge",
        description: "Carefully walk across the bridge itself when no train is coming. Listen for the train whistle warning.",
        duration: "15 minutes",
        cost: 0
      },
      {
        title: "Viewpoint Hike",
        description: "Climb to the hilltop viewpoint above the bridge for panoramic views of the entire structure and valley.",
        duration: "45 minutes",
        cost: 0
      }
    ],
    highlights: [
      {
        icon: "🌉",
        title: "Engineering Marvel",
        description: "Built without steel during World War I"
      },
      {
        icon: "📸",
        title: "Instagram Famous",
        description: "One of Sri Lanka's most photographed locations"
      },
      {
        icon: "🚂",
        title: "Active Railway",
        description: "Watch trains cross this century-old bridge daily"
      },
      {
        icon: "🍃",
        title: "Tea Country Setting",
        description: "Surrounded by pristine tea plantations"
      }
    ],
    nearbyPlaces: [
      { name: "Ella Rock", distance: "4 km", type: "Hiking" },
      { name: "Little Adam's Peak", distance: "2 km", type: "Hiking" },
      { name: "Ravana Falls", distance: "5 km", type: "Waterfall" },
      { name: "Demodara Loop", distance: "1 km", type: "Railway" }
    ],
    tips: [
      "Check train times beforehand for the best photo opportunities",
      "Arrive early to secure a good viewing spot",
      "Be extremely careful if walking on the tracks",
      "Always listen for train whistles",
      "Mornings offer the best light and fewer crowds",
      "Wear comfortable shoes for the short hike to the bridge"
    ],
    openingHours: "Open 24 hours (trains run 6 AM - 6 PM)",
    entryFee: "Free",
    facilities: ["Small Cafes", "Parking", "Local Guides"]
  },
  {
    id: 4,
    name: "Mirissa Beach & Whale Watching",
    city: "Mirissa",
    district: "Matara",
    region: "South Coast",
    category: "beach",
    image: "https://images.pexels.com/photos/32574422/pexels-photo-32574422.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    images: [
      "https://images.pexels.com/photos/32574422/pexels-photo-32574422.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/5675024/pexels-photo-5675024.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/4351425/pexels-photo-4351425.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
    ],
    shortDescription: "A crescent-shaped beach paradise and the best whale watching destination in Sri Lanka, home to blue whales and dolphins.",
    fullDescription: "Mirissa is a picturesque beach town on Sri Lanka's southern coast, renowned for its stunning crescent-shaped beach and world-class whale watching opportunities. This laid-back destination has transformed from a quiet fishing village into one of the country's most beloved coastal retreats.\n\nThe beach itself is a perfect blend of golden sand, swaying palm trees, and crystal-clear waters. The main beach is great for swimming, while nearby Secret Beach offers a more secluded experience. Parrot Rock, accessible at low tide, provides stunning sunset views.\n\nFrom November to April, Mirissa becomes one of the best places on Earth to spot blue whales – the largest animals to have ever lived. The continental shelf drops sharply just offshore, creating ideal conditions for these magnificent creatures. Sperm whales, fin whales, and pods of dolphins are also regularly seen.\n\nBeyond whale watching, Mirissa offers surfing (best October-March), snorkeling, and a vibrant nightlife scene with beach bars and restaurants serving fresh seafood. The famous stilt fishermen can still be spotted in the early morning and late afternoon.",
    tags: ["Beach", "Whale Watching", "Surfing", "Sunset", "Wildlife"],
    duration: "1-2 days",
    bestTime: "Nov - Apr",
    bestMonths: [10, 11, 0, 1, 2, 3],
    budget: "Medium",
    budgetScore: 2,
    estimatedCost: 12000,
    lat: 5.9485,
    lng: 80.4589,
    featured: true,
    vibe: "Relaxation",
    experiences: [
      {
        title: "Blue Whale Watching",
        description: "Join a morning boat tour to spot blue whales, sperm whales, and dolphins. Season runs November to April, with peak sightings in February-March.",
        duration: "4-5 hours",
        cost: 8000
      },
      {
        title: "Sunset at Parrot Rock",
        description: "Climb the iconic Parrot Rock at low tide and watch the sun sink into the Indian Ocean. A magical end to any day.",
        duration: "1.5 hours",
        cost: 0
      },
      {
        title: "Surfing Lessons",
        description: "Learn to surf on the gentle waves of Mirissa beach with local instructors. Best conditions October to March.",
        duration: "2 hours",
        cost: 3500
      },
      {
        title: "Secret Beach Visit",
        description: "Discover the hidden Secret Beach, a short walk from the main beach, for a more peaceful swimming experience.",
        duration: "2-3 hours",
        cost: 0
      },
      {
        title: "Stilt Fishermen Photography",
        description: "Photograph the iconic stilt fishermen in the early morning or late afternoon. A small tip is expected.",
        duration: "1 hour",
        cost: 500
      },
      {
        title: "Fresh Seafood Dinner",
        description: "Enjoy a candlelit dinner on the beach with the freshest catch, grilled to perfection at one of the beachfront restaurants.",
        duration: "2 hours",
        cost: 3000
      }
    ],
    highlights: [
      {
        icon: "🐋",
        title: "Blue Whale Capital",
        description: "One of the world's best spots for blue whale sightings"
      },
      {
        icon: "🏄",
        title: "Surf Paradise",
        description: "Great waves for beginners and intermediate surfers"
      },
      {
        icon: "🌅",
        title: "Parrot Rock Sunsets",
        description: "Iconic viewpoint for spectacular sunset views"
      },
      {
        icon: "🎣",
        title: "Stilt Fishermen",
        description: "Witness the traditional fishing technique unique to Sri Lanka"
      }
    ],
    nearbyPlaces: [
      { name: "Weligama", distance: "7 km", type: "Beach/Surfing" },
      { name: "Galle Fort", distance: "35 km", type: "Heritage" },
      { name: "Coconut Tree Hill", distance: "1 km", type: "Viewpoint" },
      { name: "Unawatuna Beach", distance: "25 km", type: "Beach" }
    ],
    tips: [
      "Book whale watching tours the evening before",
      "Take motion sickness medication if prone to seasickness",
      "Visit Coconut Tree Hill for Instagram-worthy photos",
      "Swim at Secret Beach for fewer crowds",
      "Book beachfront accommodation early in peak season",
      "Evening jellyfish are common – check with locals before swimming"
    ],
    openingHours: "Beach: 24 hours | Whale tours: 6:00 AM departure",
    entryFee: "Free (whale watching tours: LKR 6,000-10,000)",
    facilities: ["Restaurants", "Beach Bars", "Surf Schools", "Hotels", "Tour Operators"]
  },
  {
    id: 5,
    name: "Galle Fort",
    city: "Galle",
    district: "Galle",
    region: "South Coast",
    category: "heritage",
    image: "https://images.pexels.com/photos/27669342/pexels-photo-27669342.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    images: [
      "https://images.pexels.com/photos/27669342/pexels-photo-27669342.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/27669335/pexels-photo-27669335.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/27669334/pexels-photo-27669334.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
    ],
    shortDescription: "A UNESCO World Heritage fortress blending Portuguese, Dutch, and British colonial architecture with vibrant local life.",
    fullDescription: "Galle Fort is a historical and archaeological masterpiece, representing the best-preserved sea fortress in South Asia. Originally built by the Portuguese in 1588, it was extensively fortified by the Dutch in the 17th century and later modified by the British.\n\nThis UNESCO World Heritage Site is a living museum where colonial architecture meets contemporary Sri Lankan life. Within the fort's massive walls, you'll find charming cobblestone streets lined with boutique hotels, art galleries, jewelry shops, and cafes housed in centuries-old buildings.\n\nThe Dutch Reformed Church (1640), the Groote Kerk, stands as one of the oldest Protestant churches in Sri Lanka. The iconic Galle Lighthouse, built in 1939, is one of the oldest lighthouses in the country. The Clock Tower, built by the Dutch, still keeps time today.\n\nWalk along the ramparts at sunset for breathtaking views of the Indian Ocean, or explore the narrow lanes to discover hidden gems – from antique shops selling colonial-era artifacts to contemporary art galleries showcasing local talent. The fort is also known for its afternoon cricket matches on the main green.",
    tags: ["UNESCO", "Colonial", "Dutch", "Architecture", "Shopping"],
    duration: "Half day - Full day",
    bestTime: "Dec - Apr",
    bestMonths: [11, 0, 1, 2, 3],
    budget: "Low",
    budgetScore: 1,
    estimatedCost: 4000,
    lat: 6.0269,
    lng: 80.217,
    featured: false,
    vibe: "Culture",
    experiences: [
      {
        title: "Sunset Rampart Walk",
        description: "Stroll along the ancient fort walls as the sun sets over the Indian Ocean. Start from Flag Rock for the best views.",
        duration: "1.5 hours",
        cost: 0
      },
      {
        title: "Maritime Museum Visit",
        description: "Explore the Dutch colonial warehouse housing artifacts from the 2004 tsunami and maritime history exhibits.",
        duration: "1 hour",
        cost: 500
      },
      {
        title: "Art Gallery Hopping",
        description: "Visit contemporary galleries showcasing Sri Lankan artists, housed in beautifully restored colonial buildings.",
        duration: "2 hours",
        cost: 0
      },
      {
        title: "Colonial Architecture Tour",
        description: "Take a guided walking tour covering the Dutch Reformed Church, Lighthouse, Clock Tower, and historic mansions.",
        duration: "2 hours",
        cost: 2000
      },
      {
        title: "Boutique Shopping",
        description: "Browse local designer boutiques for handcrafted jewelry, clothing, and souvenirs unique to Galle.",
        duration: "2-3 hours",
        cost: 0
      },
      {
        title: "Cricket on the Green",
        description: "Watch or join locals playing cricket on the fort green – a quintessentially Sri Lankan experience.",
        duration: "1 hour",
        cost: 0
      }
    ],
    highlights: [
      {
        icon: "🏰",
        title: "UNESCO World Heritage",
        description: "South Asia's best-preserved colonial sea fortress"
      },
      {
        icon: "🗼",
        title: "Historic Lighthouse",
        description: "One of Sri Lanka's oldest lighthouses, built in 1939"
      },
      {
        icon: "⛪",
        title: "Dutch Reformed Church",
        description: "One of the oldest Protestant churches in Sri Lanka"
      },
      {
        icon: "🛍️",
        title: "Boutique Shopping",
        description: "Unique shops in centuries-old colonial buildings"
      }
    ],
    nearbyPlaces: [
      { name: "Unawatuna Beach", distance: "5 km", type: "Beach" },
      { name: "Japanese Peace Pagoda", distance: "4 km", type: "Spiritual" },
      { name: "Jungle Beach", distance: "6 km", type: "Beach" },
      { name: "Koggala Lake", distance: "12 km", type: "Nature" }
    ],
    tips: [
      "Visit early morning or late afternoon to avoid heat",
      "Sunset from the ramparts is unmissable",
      "Wear comfortable walking shoes on cobblestones",
      "Bargain politely at antique shops",
      "Try local ice cream at the famous ice cream shops",
      "Book boutique hotel accommodation for an authentic experience"
    ],
    openingHours: "Fort accessible 24 hours | Shops: 9 AM - 8 PM",
    entryFee: "Free",
    facilities: ["Restaurants", "Hotels", "ATMs", "Parking", "Tour Guides", "Museums"]
  },
  {
    id: 6,
    name: "Yala National Park",
    city: "Tissamaharama",
    district: "Hambantota",
    region: "South Coast",
    category: "nature",
    image: "https://images.pexels.com/photos/10607669/pexels-photo-10607669.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    images: [
      "https://images.pexels.com/photos/10607669/pexels-photo-10607669.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/17281950/pexels-photo-17281950.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/15232521/pexels-photo-15232521.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
    ],
    shortDescription: "Sri Lanka's most famous national park, home to the highest density of leopards in the world and diverse wildlife.",
    fullDescription: "Yala National Park is Sri Lanka's premier wildlife destination and the country's most visited national park. Established in 1938, it covers nearly 1,000 square kilometers of scrubland, forests, lagoons, and pristine beaches along the southeastern coast.\n\nYala holds the distinction of having the highest density of leopards in the world, making it one of the best places globally to spot these elusive big cats. The park is home to approximately 70-80 leopards in the most frequently visited Block 1 alone.\n\nBeyond leopards, Yala boasts an incredible diversity of wildlife: Asian elephants (over 400 individuals), sloth bears, spotted deer, sambar deer, wild boar, crocodiles, and water buffaloes. The park is also a birdwatcher's paradise with over 215 species, including flamingos that gather at the coastal lagoons.\n\nThe landscape varies from dense monsoon forests to open grasslands and rocky outcrops that provide perfect vantage points for predators. The beaches within the park are also nesting grounds for sea turtles. Ancient Buddhist sites within the park add a cultural dimension to the wildlife experience.",
    tags: ["Wildlife", "Safari", "Leopards", "Elephants", "Photography"],
    duration: "Half day - Full day",
    bestTime: "Feb - Jul",
    bestMonths: [1, 2, 3, 4, 5, 6],
    budget: "High",
    budgetScore: 3,
    estimatedCost: 25000,
    lat: 6.3711,
    lng: 81.5159,
    featured: false,
    vibe: "Wildlife",
    experiences: [
      {
        title: "Morning Leopard Safari",
        description: "Join a dawn safari starting at 5:30 AM when leopards are most active. The early hours offer the best chances of sighting these elusive cats.",
        duration: "4-5 hours",
        cost: 18000
      },
      {
        title: "Full Day Safari",
        description: "Maximize your wildlife encounters with a full-day safari, including picnic breakfast and lunch in the park.",
        duration: "8-10 hours",
        cost: 25000
      },
      {
        title: "Elephant Watching",
        description: "Visit the waterholes where elephant herds gather, especially during the dry season. Witness family groups bathing and socializing.",
        duration: "2-3 hours",
        cost: 0
      },
      {
        title: "Bird Photography",
        description: "Focus on the 215+ bird species including painted storks, eagles, and colorful kingfishers along the lagoons.",
        duration: "3-4 hours",
        cost: 0
      },
      {
        title: "Sunset Safari",
        description: "An afternoon safari that ends at sunset, when predators become active and the golden light creates magical photography conditions.",
        duration: "4 hours",
        cost: 15000
      }
    ],
    highlights: [
      {
        icon: "🐆",
        title: "Leopard Capital",
        description: "Highest density of leopards in the world"
      },
      {
        icon: "🐘",
        title: "Elephant Herds",
        description: "Over 400 wild elephants in natural habitat"
      },
      {
        icon: "🐻",
        title: "Sloth Bears",
        description: "Rare sightings of Sri Lanka's native bears"
      },
      {
        icon: "🦅",
        title: "Birding Paradise",
        description: "Over 215 bird species including endemics"
      }
    ],
    nearbyPlaces: [
      { name: "Kataragama Temple", distance: "15 km", type: "Spiritual" },
      { name: "Tissamaharama", distance: "10 km", type: "Town" },
      { name: "Bundala National Park", distance: "40 km", type: "Wildlife" },
      { name: "Kirinda Beach", distance: "12 km", type: "Beach" }
    ],
    tips: [
      "Book safaris through reputable operators with experienced trackers",
      "Start at dawn (5:30 AM) for best leopard sightings",
      "Bring binoculars and a telephoto lens",
      "Wear neutral colors to blend in",
      "Park closes September 1 - October 15 annually",
      "Avoid overcrowded vehicles – smaller groups are better"
    ],
    openingHours: "6:00 AM - 6:00 PM (closed Sep 1 - Oct 15)",
    entryFee: "USD 25 (foreigners) + vehicle charges",
    facilities: ["Safari Jeeps", "Guides", "Camping Sites", "Rest Areas", "First Aid"]
  },
  {
    id: 7,
    name: "Nuwara Eliya Tea Plantations",
    city: "Nuwara Eliya",
    district: "Nuwara Eliya",
    region: "Hill Country",
    category: "nature",
    image: "https://images.pexels.com/photos/321570/pexels-photo-321570.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    images: [
      "https://images.pexels.com/photos/321570/pexels-photo-321570.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/19287633/pexels-photo-19287633.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/36847090/pexels-photo-36847090.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
    ],
    shortDescription: "Experience Ceylon tea at its source in the misty hills of Sri Lanka's 'Little England', surrounded by emerald tea estates.",
    fullDescription: "Nuwara Eliya, often called 'Little England' due to its colonial heritage and cool climate, is the heart of Sri Lanka's world-renowned tea industry. Situated at 1,868 meters above sea level, this picturesque town is surrounded by rolling hills carpeted with emerald-green tea bushes.\n\nThe town retains its British colonial charm with Tudor-style bungalows, a historic golf course (one of the oldest in Asia), and the English-style Victoria Park. The cool climate (average 16°C) makes it a refreshing escape from the tropical lowlands.\n\nThe tea estates surrounding Nuwara Eliya produce some of the finest Ceylon tea in the world. The high altitude, cool temperatures, and misty conditions create perfect growing conditions for tea with distinctive light, bright, and fragrant characteristics.\n\nVisitors can tour working tea factories like Pedro, Bluefield, or Mackwoods to see the entire tea production process – from freshly plucked leaves to the finished product. Walking through the verdant tea estates, you'll encounter colorful Tamil tea pluckers who have maintained this tradition for generations.",
    tags: ["Tea", "Colonial", "Scenic", "Cool Climate", "Factory Tour"],
    duration: "1-2 days",
    bestTime: "Year-round, Dec - Apr best",
    bestMonths: [11, 0, 1, 2, 3],
    budget: "Low",
    budgetScore: 1,
    estimatedCost: 5500,
    lat: 6.9497,
    lng: 80.7891,
    featured: false,
    vibe: "Relaxation",
    experiences: [
      {
        title: "Tea Factory Tour",
        description: "Visit Pedro, Bluefield, or Mackwoods estate to see tea production from withering to packaging, ending with a fresh cup of Ceylon tea.",
        duration: "2 hours",
        cost: 1000
      },
      {
        title: "Tea Estate Walk",
        description: "Stroll through the rolling tea plantations, photograph the stunning landscapes, and meet the Tamil tea pluckers at work.",
        duration: "2-3 hours",
        cost: 0
      },
      {
        title: "Victoria Park Visit",
        description: "Explore this beautiful English-style park with its flower gardens, walking trails, and bird watching opportunities.",
        duration: "1.5 hours",
        cost: 350
      },
      {
        title: "Scenic Train Journey",
        description: "Take the famous scenic train from Kandy to Nuwara Eliya, considered one of the most beautiful train rides in the world.",
        duration: "4-5 hours",
        cost: 2000
      },
      {
        title: "Horton Plains Excursion",
        description: "Day trip to nearby Horton Plains National Park to see World's End cliff and Baker's Falls.",
        duration: "Half day",
        cost: 3500
      },
      {
        title: "Colonial Heritage Walk",
        description: "Explore the town's colonial buildings including the Grand Hotel, Post Office, and Hill Club.",
        duration: "2 hours",
        cost: 0
      }
    ],
    highlights: [
      {
        icon: "🍵",
        title: "Ceylon Tea Origin",
        description: "Visit working factories producing world-class tea"
      },
      {
        icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
        title: "Little England",
        description: "Colonial architecture and cool English climate"
      },
      {
        icon: "🚂",
        title: "Scenic Railways",
        description: "One of the world's most beautiful train journeys"
      },
      {
        icon: "⛰️",
        title: "Highland Scenery",
        description: "Misty mountains and emerald tea estates"
      }
    ],
    nearbyPlaces: [
      { name: "Horton Plains", distance: "32 km", type: "National Park" },
      { name: "Gregory Lake", distance: "1 km", type: "Lake" },
      { name: "Lover's Leap Falls", distance: "5 km", type: "Waterfall" },
      { name: "Hakgala Gardens", distance: "10 km", type: "Botanical" }
    ],
    tips: [
      "Pack warm clothing – temperatures drop to 10°C at night",
      "Book the train from Kandy in advance (Second class)",
      "Visit tea factories early morning for the best experience",
      "April brings the Sinhala New Year celebrations",
      "Strawberry season runs from April to August",
      "Golf at Nuwara Eliya Golf Club – one of Asia's oldest"
    ],
    openingHours: "Tea factories: 8 AM - 5 PM | Town: 24 hours",
    entryFee: "Factory tours: LKR 500-1000 per person",
    facilities: ["Hotels", "Restaurants", "Tea Shops", "Golf Course", "Markets"]
  },
  {
    id: 8,
    name: "Dambulla Cave Temple",
    city: "Dambulla",
    district: "Matale",
    region: "Cultural Triangle",
    category: "spiritual",
    image: "https://images.pexels.com/photos/35598970/pexels-photo-35598970.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    images: [
      "https://images.pexels.com/photos/35598970/pexels-photo-35598970.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/32547985/pexels-photo-32547985.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/32547976/pexels-photo-32547976.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
    ],
    shortDescription: "A stunning UNESCO-listed cave temple complex with over 150 Buddha statues and intricate ancient murals.",
    fullDescription: "The Dambulla Cave Temple, also known as the Golden Temple of Dambulla, is Sri Lanka's largest and best-preserved cave temple complex. Dating back to the 1st century BC, this UNESCO World Heritage Site features five caves adorned with over 150 Buddha statues and 2,100 square meters of stunning murals.\n\nKing Valagamba sought refuge in these caves during his 14-year exile and, upon returning to power, converted them into a magnificent temple in gratitude. Over the centuries, various kings have added to the temple, creating the remarkable complex we see today.\n\nThe five caves vary in size and grandeur. The largest, the Cave of the Great Kings (Maharaja Viharaya), stretches 52 meters and contains 56 Buddha statues. The ceiling paintings depicting scenes from Buddha's life are among the finest examples of Sri Lankan Buddhist art.\n\nThe temple sits atop a 160-meter rock, offering panoramic views of the surrounding countryside, including Sigiriya Rock in the distance. The climb involves 300 steps but the cool caves and stunning art make it worthwhile.",
    tags: ["UNESCO", "Buddhist", "Cave Art", "Ancient", "Murals"],
    duration: "2-3 hours",
    bestTime: "Year-round",
    bestMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    budget: "Low",
    budgetScore: 1,
    estimatedCost: 4000,
    lat: 7.8567,
    lng: 80.6517,
    featured: false,
    vibe: "Spiritual",
    experiences: [
      {
        title: "Cave Temple Exploration",
        description: "Explore all five caves, each with unique Buddha statues, murals, and architectural features spanning 22 centuries.",
        duration: "1.5-2 hours",
        cost: 2000
      },
      {
        title: "Sunrise Photography",
        description: "Climb to the temple at dawn for stunning sunrise views over the Cultural Triangle and perfect photography light.",
        duration: "2 hours",
        cost: 0
      },
      {
        title: "Mural Study",
        description: "Take time to study the 2,100 square meters of ancient paintings depicting Buddha's life, Jataka tales, and Sri Lankan history.",
        duration: "1 hour",
        cost: 0
      },
      {
        title: "Golden Buddha Visit",
        description: "See the massive modern Golden Buddha statue and temple at the base of the rock before ascending to the caves.",
        duration: "30 minutes",
        cost: 0
      },
      {
        title: "Sunset Viewpoint",
        description: "Stay until evening for spectacular sunset views with Sigiriya Rock visible in the distance.",
        duration: "1 hour",
        cost: 0
      }
    ],
    highlights: [
      {
        icon: "🏛️",
        title: "UNESCO Heritage",
        description: "Sri Lanka's largest and best-preserved cave temple"
      },
      {
        icon: "🎨",
        title: "Ancient Murals",
        description: "2,100 sq meters of paintings spanning 22 centuries"
      },
      {
        icon: "🧘",
        title: "150+ Buddha Statues",
        description: "Including a 14-meter reclining Buddha"
      },
      {
        icon: "⛰️",
        title: "Rock Formation",
        description: "160-meter rock with panoramic views"
      }
    ],
    nearbyPlaces: [
      { name: "Sigiriya Rock", distance: "17 km", type: "Heritage" },
      { name: "Pidurangala Temple", distance: "22 km", type: "Spiritual" },
      { name: "Kandalama Lake", distance: "10 km", type: "Nature" },
      { name: "Minneriya Park", distance: "30 km", type: "Wildlife" }
    ],
    tips: [
      "Remove shoes and cover shoulders before entering caves",
      "Photography is allowed but no flash",
      "Beware of monkeys near the entrance – don't carry food",
      "Visit early morning or late afternoon to avoid heat",
      "The climb has 300 steps – take it slowly",
      "Don't turn your back to Buddha statues for photos"
    ],
    openingHours: "7:00 AM - 7:00 PM daily",
    entryFee: "LKR 300 (locals) / LKR 2000 (foreigners)",
    facilities: ["Shoe Storage", "Washrooms", "Guides", "Parking", "Refreshments"]
  },
  {
    id: 9,
    name: "Trincomalee Beaches",
    city: "Trincomalee",
    district: "Trincomalee",
    region: "East Coast",
    category: "beach",
    image: "https://images.pexels.com/photos/10850861/pexels-photo-10850861.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    images: [
      "https://images.pexels.com/photos/10850861/pexels-photo-10850861.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/10850860/pexels-photo-10850860.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/10850855/pexels-photo-10850855.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
    ],
    shortDescription: "Sri Lanka's eastern coast gem featuring pristine beaches, whale watching, and one of the world's finest natural harbors.",
    fullDescription: "Trincomalee, affectionately called 'Trinco', is a port city on Sri Lanka's northeastern coast, blessed with some of the country's most beautiful beaches and one of the world's finest natural harbors. While the south coast draws visitors during the northeast monsoon, Trincomalee shines from May to September.\n\nNilaveli Beach, stretching 4 kilometers of powdery white sand and turquoise waters, is consistently ranked among the world's most beautiful beaches. Uppuveli Beach, closer to town, offers a more accessible experience with beachfront restaurants and hotels.\n\nPigeon Island, a short boat ride from Nilaveli, is a marine national park famous for coral reefs teeming with tropical fish, reef sharks, and hawksbill turtles. It's one of the best snorkeling and diving spots in Sri Lanka.\n\nThe area is also known for whale watching (blue whales from March to August) and hot springs at Kanniya. The historic Koneswaram Temple, perched dramatically on Swami Rock overlooking the ocean, offers stunning views and spiritual significance.",
    tags: ["Beach", "Snorkeling", "Diving", "Whales", "Temple"],
    duration: "2-3 days",
    bestTime: "May - Sep",
    bestMonths: [4, 5, 6, 7, 8],
    budget: "Medium",
    budgetScore: 2,
    estimatedCost: 10000,
    lat: 8.5874,
    lng: 81.2152,
    featured: false,
    vibe: "Adventure",
    experiences: [
      {
        title: "Pigeon Island Snorkeling",
        description: "Take a boat to Pigeon Island National Park and snorkel among colorful coral gardens with tropical fish, reef sharks, and sea turtles.",
        duration: "Half day",
        cost: 4500
      },
      {
        title: "Whale Watching",
        description: "Join a morning expedition to spot blue whales and sperm whales off the coast. Season runs March to August.",
        duration: "4-5 hours",
        cost: 8000
      },
      {
        title: "Koneswaram Temple Visit",
        description: "Explore this ancient Hindu temple dramatically perched on Swami Rock, offering panoramic ocean views.",
        duration: "1.5 hours",
        cost: 0
      },
      {
        title: "Nilaveli Beach Day",
        description: "Spend a relaxing day on one of Sri Lanka's most beautiful beaches with pristine sand and calm waters.",
        duration: "Full day",
        cost: 0
      },
      {
        title: "Kanniya Hot Springs",
        description: "Visit the seven hot water wells fed by natural hot springs, a unique geological phenomenon.",
        duration: "1 hour",
        cost: 500
      },
      {
        title: "Scuba Diving",
        description: "Explore coral reefs and World War II shipwrecks with certified diving operators.",
        duration: "3-4 hours",
        cost: 12000
      }
    ],
    highlights: [
      {
        icon: "🏝️",
        title: "Pigeon Island",
        description: "Marine park with pristine coral reefs and sea turtles"
      },
      {
        icon: "🐋",
        title: "Whale Watching",
        description: "Blue whales and sperm whales from March to August"
      },
      {
        icon: "🛕",
        title: "Koneswaram Temple",
        description: "Ancient Hindu temple on dramatic clifftop"
      },
      {
        icon: "🌊",
        title: "Natural Harbor",
        description: "One of the world's finest natural deep-water harbors"
      }
    ],
    nearbyPlaces: [
      { name: "Pigeon Island", distance: "1 km offshore", type: "Marine Park" },
      { name: "Kanniya Hot Springs", distance: "8 km", type: "Nature" },
      { name: "Fort Frederick", distance: "2 km", type: "Heritage" },
      { name: "Marble Beach", distance: "7 km", type: "Beach" }
    ],
    tips: [
      "Visit May to September – opposite season from south coast",
      "Book Pigeon Island trips early – visitor limits apply",
      "Koneswaram Temple requires modest dress",
      "Nilaveli is quieter than Uppuveli",
      "Bring reef-safe sunscreen for snorkeling",
      "The drive from Colombo takes 6-7 hours"
    ],
    openingHours: "Beaches: 24 hours | Pigeon Island: 8 AM - 5 PM",
    entryFee: "Pigeon Island: LKR 3,500 (foreigners)",
    facilities: ["Hotels", "Restaurants", "Dive Centers", "Boat Operators", "Tour Guides"]
  },
  {
    id: 10,
    name: "Adam's Peak",
    city: "Dalhousie",
    district: "Ratnapura",
    region: "Hill Country",
    category: "adventure",
    image: "https://images.pexels.com/photos/19287633/pexels-photo-19287633.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    images: [
      "https://images.pexels.com/photos/19287633/pexels-photo-19287633.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/321570/pexels-photo-321570.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/36847090/pexels-photo-36847090.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
    ],
    shortDescription: "A sacred mountain pilgrimage featuring a legendary footprint at the summit and spectacular sunrise views.",
    fullDescription: "Adam's Peak (Sri Pada) is a 2,243-meter conical mountain that has been a pilgrimage site for over 1,000 years. At its summit lies the 'Sri Pada' – a footprint-shaped depression in rock that holds significance for Buddhists, Hindus, Christians, and Muslims alike.\n\nBuddhists believe it's Buddha's footprint, Hindus attribute it to Shiva, Christians and Muslims consider it Adam's first footprint upon leaving the Garden of Eden. This multi-faith significance makes it a uniquely unifying pilgrimage.\n\nThe climb consists of 5,500 steps from Dalhousie village to the summit. Pilgrims typically begin at 2:00 AM to reach the top for sunrise – a truly magical experience as the sun rises over the mountains and casts the peak's perfect triangular shadow across the clouds.\n\nThe pilgrimage season runs from December to May (full moon of Vesak), when the trail is lit and tea shops along the route offer refreshments. The climb is challenging but achievable for anyone with reasonable fitness.",
    tags: ["Pilgrimage", "Hiking", "Sunrise", "Sacred", "Adventure"],
    duration: "5-7 hours (climb)",
    bestTime: "Dec - May",
    bestMonths: [11, 0, 1, 2, 3, 4],
    budget: "Low",
    budgetScore: 1,
    estimatedCost: 3500,
    lat: 6.8096,
    lng: 80.4994,
    featured: false,
    vibe: "Adventure",
    experiences: [
      {
        title: "Sunrise Summit Climb",
        description: "Begin climbing at 2:00 AM from Dalhousie to reach the 2,243m summit for a spectacular sunrise over the mountains.",
        duration: "5-7 hours round trip",
        cost: 0
      },
      {
        title: "Footprint Worship",
        description: "Pay respects at the Sri Pada – the sacred footprint that draws pilgrims of multiple faiths to this peak.",
        duration: "30 minutes",
        cost: 0
      },
      {
        title: "Shadow of the Peak",
        description: "Witness the incredible phenomenon of the peak's perfect triangular shadow projected onto the clouds at sunrise.",
        duration: "15 minutes",
        cost: 0
      },
      {
        title: "Bell Ringing",
        description: "Ring the sacred bell at the summit – tradition holds you ring it once for each time you've completed the climb.",
        duration: "5 minutes",
        cost: 0
      },
      {
        title: "Tea Stop Experience",
        description: "Enjoy hot tea and snacks at the wayside stalls that line the illuminated trail during pilgrimage season.",
        duration: "Variable",
        cost: 500
      }
    ],
    highlights: [
      {
        icon: "👣",
        title: "Sacred Footprint",
        description: "Venerated by four religions for over 1,000 years"
      },
      {
        icon: "🌅",
        title: "Epic Sunrise",
        description: "Possibly the most spectacular sunrise in Sri Lanka"
      },
      {
        icon: "🔼",
        title: "Perfect Shadow",
        description: "Triangular shadow phenomenon at dawn"
      },
      {
        icon: "⛩️",
        title: "5,500 Steps",
        description: "A challenging but rewarding pilgrimage climb"
      }
    ],
    nearbyPlaces: [
      { name: "Ratnapura Gem Mines", distance: "45 km", type: "Industry" },
      { name: "Sinharaja Rainforest", distance: "50 km", type: "Nature" },
      { name: "Horton Plains", distance: "70 km", type: "National Park" },
      { name: "Nuwara Eliya", distance: "60 km", type: "Hill Town" }
    ],
    tips: [
      "Start climbing at 2:00 AM from Dalhousie",
      "Bring warm layers – it's cold at the summit",
      "Carry a flashlight and water",
      "Wear comfortable shoes with good grip",
      "Full moon (Poya) nights are especially crowded",
      "Season ends after Vesak Poya in May",
      "The descent can be harder on the knees"
    ],
    openingHours: "24 hours during pilgrimage season (Dec-May)",
    entryFee: "Free (donations welcome)",
    facilities: ["Tea Shops", "Rest Areas", "Toilets", "First Aid Posts"]
  }
];

export const getPlaceById = (id) => {
  return explorePlaces.find(place => String(place.id) === String(id));
};

// Travel time estimates between major cities (in minutes)
const travelTimeMatrix = {
  Sigiriya: {
    Kandy: { minutes: 120, mode: "Car", label: "2h drive" },
    Dambulla: { minutes: 30, mode: "Car", label: "30min drive" },
    Ella: { minutes: 240, mode: "Car", label: "4h drive" },
    Colombo: { minutes: 240, mode: "Car", label: "4h drive" },
  },
  Kandy: {
    Sigiriya: { minutes: 120, mode: "Car", label: "2h drive" },
    Dambulla: { minutes: 90, mode: "Car", label: "1.5h drive" },
    Ella: { minutes: 180, mode: "Train", label: "3h train" },
    "Nuwara Eliya": { minutes: 120, mode: "Car", label: "2h drive" },
    Colombo: { minutes: 150, mode: "Train", label: "2.5h train" },
  },
  Ella: {
    Kandy: { minutes: 180, mode: "Train", label: "3h scenic train" },
    "Nuwara Eliya": { minutes: 90, mode: "Car", label: "1.5h drive" },
    Tissamaharama: { minutes: 120, mode: "Car", label: "2h drive" },
    Mirissa: { minutes: 180, mode: "Car", label: "3h drive" },
  },
  Mirissa: {
    Galle: { minutes: 45, mode: "Car", label: "45min drive" },
    Ella: { minutes: 180, mode: "Car", label: "3h drive" },
    Tissamaharama: { minutes: 90, mode: "Car", label: "1.5h drive" },
    Colombo: { minutes: 180, mode: "Car", label: "3h drive" },
  },
  Galle: {
    Mirissa: { minutes: 45, mode: "Car", label: "45min drive" },
    Colombo: { minutes: 120, mode: "Car", label: "2h drive" },
    Tissamaharama: { minutes: 150, mode: "Car", label: "2.5h drive" },
  },
  Tissamaharama: {
    Mirissa: { minutes: 90, mode: "Car", label: "1.5h drive" },
    Ella: { minutes: 120, mode: "Car", label: "2h drive" },
    Galle: { minutes: 150, mode: "Car", label: "2.5h drive" },
  },
  "Nuwara Eliya": {
    Kandy: { minutes: 120, mode: "Car", label: "2h drive" },
    Ella: { minutes: 90, mode: "Car", label: "1.5h drive" },
    Colombo: { minutes: 240, mode: "Car", label: "4h drive" },
  },
  Dambulla: {
    Sigiriya: { minutes: 30, mode: "Car", label: "30min drive" },
    Kandy: { minutes: 90, mode: "Car", label: "1.5h drive" },
    Colombo: { minutes: 180, mode: "Car", label: "3h drive" },
  },
  Trincomalee: {
    Kandy: { minutes: 210, mode: "Car", label: "3.5h drive" },
    Sigiriya: { minutes: 150, mode: "Car", label: "2.5h drive" },
    Colombo: { minutes: 300, mode: "Car", label: "5h drive" },
  },
  Dalhousie: {
    "Nuwara Eliya": { minutes: 120, mode: "Car", label: "2h drive" },
    Kandy: { minutes: 180, mode: "Car", label: "3h drive" },
    Colombo: { minutes: 180, mode: "Car", label: "3h drive" },
  },
};

export const getTravelTime = (from, to) => {
  const fromData = travelTimeMatrix[from];
  if (fromData && fromData[to]) {
    return fromData[to];
  }
  const toData = travelTimeMatrix[to];
  if (toData && toData[from]) {
    return toData[from];
  }
  return { minutes: 60, mode: "Car", label: "~1h (estimate)" };
};
