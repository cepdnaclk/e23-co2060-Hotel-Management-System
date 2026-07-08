import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import api from "../api/api";
import {
  budgetDailyTargets,
  explorePlaces,
  formatLkr,
  getPlaceById,
  getTravelTime,
  travelStyles,
} from "../data/exploreData";

const SAVED_PLACES_KEY = "tourismhub_trip_places";
const TRIP_PLAN_KEY = "tourismhub_trip_plan";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const toDbImageUrl = (imageUrl) => {
  const value = String(imageUrl || "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${ASSET_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

const firstDbImage = (...candidates) => {
  for (const candidate of candidates.flat()) {
    const image = toDbImageUrl(candidate?.image_url || candidate?.url || candidate?.image || candidate);
    if (image) return image;
  }
  return "";
};


const todayInputValue = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const addDays = (dateString, daysToAdd) => {
  const date = dateString ? new Date(dateString) : new Date();
  date.setDate(date.getDate() + daysToAdd);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const formatDate = (dateString) => {
  if (!dateString) return "Date not set";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const loadJson = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const createDays = (startDate, daysCount) =>
  Array.from({ length: Number(daysCount) || 1 }, (_, index) => ({
    dayNumber: index + 1,
    date: addDays(startDate, index),
    places: [],
    hotelBooked: false,
    notes: "",
  }));

const normalizeDays = (days, startDate, daysCount) => {
  const requiredDays = Number(daysCount) || 1;
  const current = Array.isArray(days) ? days : [];

  return Array.from({ length: requiredDays }, (_, index) => {
    const existing = current[index];
    return {
      dayNumber: index + 1,
      date: addDays(startDate, index),
      places: Array.isArray(existing?.places) ? existing.places : [],
      hotelBooked: Boolean(existing?.hotelBooked),
      notes: existing?.notes || "",
    };
  });
};

const calculateDayCost = (day) =>
  day.places.reduce((total, place) => total + Number(place.estimatedCost || 0), 0);

const calculateTransitMinutes = (day) =>
  day.places.reduce((total, place, index) => {
    if (index === 0) return total;
    const previous = day.places[index - 1];
    const estimate = getTravelTime(previous.city, place.city);
    return total + Number(estimate?.minutes || 0);
  }, 0);

const formatDuration = (minutes) => {
  if (!minutes) return "0m";
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours && remaining) return `${hours}h ${remaining}m`;
  if (hours) return `${hours}h`;
  return `${remaining}m`;
};

const starterRoutes = [
  {
    id: "island-highlights",
    title: "Island Highlights",
    label: "5-day classic",
    description: "A first-time route through culture, hill country, coast, and heritage stays.",
    placeIds: [1, 2, 3, 5, 4],
  },
  {
    id: "heritage-sri-lanka",
    title: "Heritage Sri Lanka",
    label: "Culture route",
    description: "Ancient kingdoms, sacred temples, and walkable old towns for culture lovers.",
    placeIds: [1, 8, 2, 5],
  },
  {
    id: "hill-country-slow",
    title: "Hill Country Slow Route",
    label: "Scenic route",
    description: "Tea country, train views, mountain air, and relaxed evenings around Kandy and Ella.",
    placeIds: [2, 3, 7, 10],
  },
  {
    id: "south-coast-wildlife",
    title: "South Coast + Wildlife",
    label: "Beach + safari",
    description: "Galle streets, Mirissa coast, and Yala safari days with hotel checks built in.",
    placeIds: [5, 4, 6],
  },
];

const guideSteps = [
  {
    title: "Choose your starting point",
    text: "Start with saved destinations from Explore or pick a ready-made route template. You can change everything later.",
  },
  {
    title: "Arrange days naturally",
    text: "Place each destination into a travel day. Keep nearby cities together to reduce travel time.",
  },
  {
    title: "Check stays for every night",
    text: "When a day has destinations, use the hotel prompt to find stays near the city for that date.",
  },
  {
    title: "Save and download",
    text: "Save the plan in the browser and export a detailed PDF itinerary with places, costs, notes, and hotel status.",
  },
];

const visitServices = [
  { title: "Explore places", text: "Open destination stories, photos, tips, and experiences.", to: "/explore", icon: "🧭" },
  { title: "Find hotels", text: "Search approved stays near each planned city.", to: "/hotels", icon: "🏨" },
  { title: "Events", text: "Add cultural events and seasonal experiences to the route.", to: "/events", icon: "🎉" },
  { title: "Tourist guides", text: "Connect with local guide support for key destinations.", to: "/tourist-guides", icon: "🧑‍✈️" },
];

const beforeYouGo = [
  "Check local weather and seasonal travel conditions.",
  "Keep passport, booking reference, and emergency contacts ready.",
  "Confirm hotel check-in time before long-distance travel.",
  "Keep enough buffer time between cities and attractions.",
];

const daySlotLabels = ["Morning", "Midday", "Afternoon", "Evening", "Night"];

const pdfTheme = {
  paper: [250, 244, 231],
  soft: [255, 252, 244],
  green: [6, 65, 61],
  teal: [5, 124, 111],
  gold: [226, 162, 26],
  red: [162, 49, 40],
  ink: [18, 48, 45],
  muted: [82, 98, 94],
  border: [211, 185, 124],
};

const loadImageAsDataUrl = (url) =>
  new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("Missing image URL"));
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("Image failed to load"));
    image.src = url;
  });

const addPdfPageBackground = (doc) => {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  doc.setFillColor(...pdfTheme.paper);
  doc.rect(0, 0, width, height, "F");
  doc.setDrawColor(...pdfTheme.border);
  doc.setLineWidth(0.4);
  doc.rect(8, 8, width - 16, height - 16);
};

const ensurePdfSpace = (doc, y, requiredHeight) => {
  const height = doc.internal.pageSize.getHeight();
  if (y + requiredHeight > height - 22) {
    doc.addPage();
    addPdfPageBackground(doc);
    return 20;
  }
  return y;
};

const drawWrappedPdfText = (doc, text, x, y, maxWidth, lineHeight = 4.5) => {
  const lines = doc.splitTextToSize(text || "", maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
};

function TripPlannerPage() {
  const savedPlan = useMemo(() => loadJson(TRIP_PLAN_KEY, null), []);
  const today = useMemo(() => todayInputValue(), []);

  const [tripName, setTripName] = useState(savedPlan?.tripName || "Sri Lanka Holiday Plan");
  const [startDate, setStartDate] = useState(savedPlan?.startDate || today);
  const [daysCount, setDaysCount] = useState(String(savedPlan?.daysCount || 5));
  const [travelStyle, setTravelStyle] = useState(savedPlan?.travelStyle || "Culture");
  const [budgetLevel, setBudgetLevel] = useState(savedPlan?.budgetLevel || "Medium");
  const [travelPace, setTravelPace] = useState(savedPlan?.travelPace || "Balanced");
  const [days, setDays] = useState(() =>
    normalizeDays(savedPlan?.days, savedPlan?.startDate || today, savedPlan?.daysCount || 5)
  );
  const [savedPlaces, setSavedPlaces] = useState(() => loadJson(SAVED_PLACES_KEY, []));
  const [activeGuideStep, setActiveGuideStep] = useState(0);
  const [showGuide, setShowGuide] = useState(!savedPlan);
  const [draggedPlace, setDraggedPlace] = useState(null);
  const [notice, setNotice] = useState("");
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  useEffect(() => {
    const refreshSavedPlaces = () => {
      setSavedPlaces(loadJson(SAVED_PLACES_KEY, []));
    };

    refreshSavedPlaces();
    window.addEventListener("storage", refreshSavedPlaces);
    return () => window.removeEventListener("storage", refreshSavedPlaces);
  }, []);

  useEffect(() => {
    let stillMounted = true;

    const loadHeroSlides = async () => {
      try {
        const [placesResult, hotelsResult] = await Promise.allSettled([
          api.get("/explore/places"),
          api.get("/properties"),
        ]);

        const dbPlaces = placesResult.status === "fulfilled"
          ? placesResult.value.data.places || []
          : [];

        const approvedHotels = hotelsResult.status === "fulfilled"
          ? (hotelsResult.value.data.data || []).filter(
              (property) => !property.status || String(property.status).toLowerCase() === "approved"
            )
          : [];

        const destinationSlides = dbPlaces
          .map((place) => ({
            id: `place-${place.id}`,
            type: "Destination",
            title: place.name,
            subtitle: [place.city, place.region].filter(Boolean).join(" • ") || "Explore Sri Lanka",
            image: firstDbImage(
              place.image,
              place.image_url,
              place.images,
              Array.isArray(place.photos) ? place.photos : []
            ),
          }))
          .filter((slide) => slide.image)
          .slice(0, 4);

        const hotelSlides = approvedHotels
          .map((hotel) => ({
            id: `hotel-${hotel.id}`,
            type: "Hotel",
            title: hotel.name,
            subtitle: [hotel.city, hotel.district].filter(Boolean).join(" • ") || "Approved stay",
            image: firstDbImage(
              hotel.main_image,
              hotel.hero_image,
              hotel.logo_url,
              hotel.image_url,
              Array.isArray(hotel.images) ? hotel.images : []
            ),
          }))
          .filter((slide) => slide.image)
          .slice(0, 4);

        const mixedSlides = [];
        const maxLength = Math.max(destinationSlides.length, hotelSlides.length);

        for (let index = 0; index < maxLength; index += 1) {
          if (destinationSlides[index]) mixedSlides.push(destinationSlides[index]);
          if (hotelSlides[index]) mixedSlides.push(hotelSlides[index]);
        }

        if (stillMounted) {
          setHeroSlides(mixedSlides);
          setHeroSlideIndex(0);
        }
      } catch (error) {
        console.error("Failed to load trip planner hero slideshow", error);
      }
    };

    loadHeroSlides();
    return () => {
      stillMounted = false;
    };
  }, []);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setHeroSlideIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const totalPlaces = days.reduce((total, day) => total + day.places.length, 0);
  const totalCost = days.reduce((total, day) => total + calculateDayCost(day), 0);
  const totalTransit = days.reduce((total, day) => total + calculateTransitMinutes(day), 0);
  const hotelCoveredDays = days.filter((day) => !day.places.length || day.hotelBooked).length;
  const readiness = Math.min(
    100,
    Math.round(
      (tripName ? 15 : 0) +
        (startDate ? 15 : 0) +
        (totalPlaces > 0 ? 30 : 0) +
        (hotelCoveredDays / Math.max(days.length, 1)) * 25 +
        (totalPlaces >= Math.min(Number(daysCount) || 1, 3) ? 15 : 0)
    )
  );

  const dailyBudgetTarget = budgetDailyTargets[budgetLevel] || budgetDailyTargets.Medium;
  const unusedSavedPlaces = savedPlaces.filter(
    (savedPlace) => !days.some((day) => day.places.some((place) => place.id === savedPlace.id))
  );
  const popularPlaces = explorePlaces.slice(0, 6);

  const routeCities = days
    .flatMap((day) => day.places.map((place) => place.city))
    .filter((city, index, array) => city && array.indexOf(city) === index);

  const currentHeroSlide = heroSlides[heroSlideIndex % Math.max(heroSlides.length, 1)] || null;
  const tripHeroStats = [
    { value: days.length, label: "travel days" },
    { value: savedPlaces.length, label: "saved places" },
    { value: totalPlaces, label: "planned stops" },
    { value: heroSlides.length || "DB", label: "live photos" },
  ];

  const applyTripSettings = () => {
    const safeDaysCount = Math.min(Math.max(Number(daysCount) || 1, 1), 14);
    setDaysCount(String(safeDaysCount));
    setDays((currentDays) => normalizeDays(currentDays, startDate || today, safeDaysCount));
    setNotice("Trip dates and day cards updated.");
  };

  const saveTripPlan = () => {
    const plan = {
      tripName,
      startDate,
      daysCount: Number(daysCount) || 1,
      travelStyle,
      budgetLevel,
      travelPace,
      days,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(TRIP_PLAN_KEY, JSON.stringify(plan));
    setNotice("Trip plan saved on this browser.");
  };

  const clearPlan = () => {
    if (!window.confirm("Clear current trip plan? Saved Explore places will stay.")) return;
    const freshDays = createDays(startDate || today, Number(daysCount) || 1);
    setDays(freshDays);
    localStorage.removeItem(TRIP_PLAN_KEY);
    setNotice("Trip plan cleared.");
  };

  const addPlaceToDay = (place, dayIndex) => {
    if (!place) return;

    setDays((currentDays) =>
      currentDays.map((day, index) => {
        if (index !== dayIndex) return day;
        if (day.places.some((existing) => existing.id === place.id)) return day;
        return { ...day, places: [...day.places, place] };
      })
    );
    setNotice(`${place.name} added to Day ${dayIndex + 1}.`);
  };

  const removePlaceFromDay = (dayIndex, placeId) => {
    setDays((currentDays) =>
      currentDays.map((day, index) =>
        index === dayIndex
          ? { ...day, places: day.places.filter((place) => place.id !== placeId) }
          : day
      )
    );
  };

  const movePlaceWithinDay = (dayIndex, placeIndex, direction) => {
    setDays((currentDays) =>
      currentDays.map((day, index) => {
        if (index !== dayIndex) return day;
        const nextIndex = placeIndex + direction;
        if (nextIndex < 0 || nextIndex >= day.places.length) return day;
        const updatedPlaces = [...day.places];
        [updatedPlaces[placeIndex], updatedPlaces[nextIndex]] = [
          updatedPlaces[nextIndex],
          updatedPlaces[placeIndex],
        ];
        return { ...day, places: updatedPlaces };
      })
    );
  };

  const movePlaceToDay = (fromDayIndex, placeId, toDayIndex) => {
    if (fromDayIndex === toDayIndex) return;

    setDays((currentDays) => {
      const placeToMove = currentDays[fromDayIndex]?.places.find((place) => place.id === placeId);
      if (!placeToMove) return currentDays;

      return currentDays.map((day, index) => {
        if (index === fromDayIndex) {
          return { ...day, places: day.places.filter((place) => place.id !== placeId) };
        }
        if (index === toDayIndex) {
          if (day.places.some((place) => place.id === placeId)) return day;
          return { ...day, places: [...day.places, placeToMove] };
        }
        return day;
      });
    });
  };

  const updateDayNotes = (dayIndex, notes) => {
    setDays((currentDays) =>
      currentDays.map((day, index) => (index === dayIndex ? { ...day, notes } : day))
    );
  };

  const toggleHotel = (dayIndex) => {
    setDays((currentDays) =>
      currentDays.map((day, index) =>
        index === dayIndex ? { ...day, hotelBooked: !day.hotelBooked } : day
      )
    );
  };

  const buildStarterPlan = (placeIds = starterRoutes[0].placeIds) => {
    const selectedPlaces = placeIds.map(getPlaceById).filter(Boolean);
    const safeDays = Math.max(Number(daysCount) || 1, 1);
    const nextDays = createDays(startDate || today, safeDays);

    selectedPlaces.forEach((place, index) => {
      const targetIndex = index % safeDays;
      nextDays[targetIndex].places.push(place);
    });

    setDays(nextDays);
    setNotice("Starter route created. You can edit every day.");
  };

  const addPopularToSaved = (place) => {
    const currentSaved = loadJson(SAVED_PLACES_KEY, []);
    if (currentSaved.some((item) => item.id === place.id)) {
      setNotice(`${place.name} is already saved.`);
      return;
    }

    const updated = [...currentSaved, place];
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updated));
    setSavedPlaces(updated);
    setNotice(`${place.name} added to saved places.`);
  };

  const handleDragStart = (payload) => {
    setDraggedPlace(payload);
  };

  const handleDropOnDay = (dayIndex) => {
    if (!draggedPlace) return;

    if (draggedPlace.source === "saved") {
      addPlaceToDay(draggedPlace.place, dayIndex);
    }

    if (draggedPlace.source === "day") {
      movePlaceToDay(draggedPlace.dayIndex, draggedPlace.place.id, dayIndex);
    }

    setDraggedPlace(null);
  };

  const getHotelSearchLink = (day) => {
    const city = day.places[0]?.city || "";
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (day.date) params.set("check_in", day.date);
    if (day.date) params.set("check_out", addDays(day.date, 1));
    params.set("guests", "2");
    return `/hotels?${params.toString()}`;
  };

  const drawPdfCover = (doc) => {
    addPdfPageBackground(doc);

    doc.setFillColor(...pdfTheme.green);
    doc.rect(12, 12, 186, 38, "F");
    doc.setTextColor(255, 252, 244);
    doc.setFont("times", "bold");
    doc.setFontSize(25);
    doc.text("TourismHub LK", 18, 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Smart Sri Lanka Trip Itinerary", 18, 40);

    doc.setTextColor(...pdfTheme.green);
    doc.setFont("times", "bold");
    doc.setFontSize(30);
    doc.text(tripName || "Sri Lanka Holiday Plan", 16, 70, { maxWidth: 178 });

    doc.setDrawColor(...pdfTheme.gold);
    doc.setLineWidth(1.1);
    doc.line(16, 82, 194, 82);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...pdfTheme.ink);
    doc.text(`Start date: ${startDate || "Not set"}`, 16, 96);
    doc.text(`Travel style: ${travelStyle}`, 16, 104);
    doc.text(`Budget level: ${budgetLevel}`, 16, 112);
    doc.text(`Travel pace: ${travelPace}`, 16, 120);

    const summaryCards = [
      ["Days", String(days.length)],
      ["Places", String(totalPlaces)],
      ["Activity cost", formatLkr(totalCost)],
      ["Transit", formatDuration(totalTransit)],
    ];

    summaryCards.forEach(([label, value], index) => {
      const x = 16 + index * 45;
      doc.setFillColor(...pdfTheme.soft);
      doc.setDrawColor(...pdfTheme.border);
      doc.roundedRect(x, 136, 39, 23, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...pdfTheme.muted);
      doc.text(label.toUpperCase(), x + 3, 145);
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...pdfTheme.green);
      doc.text(value, x + 3, 153, { maxWidth: 33 });
    });

    if (routeCities.length) {
      doc.setFillColor(...pdfTheme.soft);
      doc.setDrawColor(...pdfTheme.border);
      doc.roundedRect(16, 174, 178, 34, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...pdfTheme.green);
      doc.setFontSize(12);
      doc.text("Route overview", 20, 184);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...pdfTheme.ink);
      doc.text(routeCities.join("  →  "), 20, 194, { maxWidth: 170 });
    }

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...pdfTheme.muted);
    doc.setFontSize(10);
    doc.text(
      "This itinerary was generated from your TourismHub LK trip planner. Check local weather, entry fees, and transport availability before travelling.",
      16,
      230,
      { maxWidth: 178 }
    );
  };

  const downloadPdf = async () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      drawPdfCover(doc);
      doc.addPage();
      addPdfPageBackground(doc);

      let y = 20;
      doc.setFont("times", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...pdfTheme.green);
      doc.text("Day-by-day itinerary", 16, y);
      y += 12;

      for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
        const day = days[dayIndex];
        y = ensurePdfSpace(doc, y, 52);

        doc.setFillColor(...pdfTheme.green);
        doc.rect(14, y, 182, 13, "F");
        doc.setTextColor(255, 252, 244);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Day ${day.dayNumber} • ${formatDate(day.date)}`, 18, y + 8.5);
        doc.text(day.hotelBooked ? "Hotel selected" : "Hotel not selected", 145, y + 8.5);
        y += 18;

        const dayCost = calculateDayCost(day);
        const dayTransit = calculateTransitMinutes(day);
        doc.setFillColor(...pdfTheme.soft);
        doc.setDrawColor(...pdfTheme.border);
        doc.roundedRect(14, y, 182, 15, 2, 2, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...pdfTheme.ink);
        doc.text(`Activity cost: ${formatLkr(dayCost)}`, 18, y + 6);
        doc.text(`Transit time: ${formatDuration(dayTransit)}`, 76, y + 6);
        doc.text(`Places: ${day.places.length}`, 132, y + 6);
        y += 22;

        if (!day.places.length) {
          doc.setFont("helvetica", "italic");
          doc.setTextColor(...pdfTheme.muted);
          doc.text("No destinations added for this day.", 18, y);
          y += 10;
          continue;
        }

        for (let placeIndex = 0; placeIndex < day.places.length; placeIndex += 1) {
          const place = day.places[placeIndex];
          y = ensurePdfSpace(doc, y, 72);

          doc.setFillColor(255, 252, 244);
          doc.setDrawColor(...pdfTheme.border);
          doc.roundedRect(14, y, 182, 66, 2, 2, "FD");

          let imageAdded = false;
          try {
            const imageData = await loadImageAsDataUrl(place.image);
            doc.addImage(imageData, "JPEG", 18, y + 5, 42, 30);
            imageAdded = true;
          } catch {
            imageAdded = false;
          }

          if (!imageAdded) {
            doc.setFillColor(238, 231, 214);
            doc.rect(18, y + 5, 42, 30, "F");
            doc.setTextColor(...pdfTheme.muted);
            doc.setFontSize(8);
            doc.text("Image", 33, y + 22);
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(...pdfTheme.green);
          doc.text(`${placeIndex + 1}. ${place.name}`, 66, y + 9, { maxWidth: 126 });

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...pdfTheme.ink);
          doc.text(`${place.city}, ${place.district} • ${place.duration}`, 66, y + 17, {
            maxWidth: 126,
          });
          doc.text(`Best: ${place.bestTime || "Check local season"}`, 66, y + 23, {
            maxWidth: 126,
          });
          doc.text(`Estimated cost: ${formatLkr(Number(place.estimatedCost || 0))}`, 66, y + 29);

          doc.setFontSize(8.5);
          doc.setTextColor(...pdfTheme.muted);
          drawWrappedPdfText(
            doc,
            place.shortDescription || place.fullDescription || "",
            18,
            y + 43,
            172,
            4
          );

          const things = Array.isArray(place.experiences)
            ? place.experiences.slice(0, 2).map((item) => item.title).join(" • ")
            : "";
          if (things) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...pdfTheme.red);
            doc.text(`Things to do: ${things}`, 18, y + 60, { maxWidth: 172 });
          }

          y += 73;

          if (placeIndex > 0) {
            const previous = day.places[placeIndex - 1];
            const travel = getTravelTime(previous.city, place.city);
            y = ensurePdfSpace(doc, y, 12);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(...pdfTheme.teal);
            doc.text(
              `Transit from ${previous.city} to ${place.city}: ${travel.label} by ${travel.mode}`,
              18,
              y
            );
            y += 8;
          }
        }

        if (day.notes) {
          y = ensurePdfSpace(doc, y, 20);
          doc.setFillColor(255, 247, 222);
          doc.setDrawColor(...pdfTheme.gold);
          doc.roundedRect(14, y, 182, 18, 2, 2, "FD");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...pdfTheme.green);
          doc.text("Day note", 18, y + 6);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...pdfTheme.ink);
          doc.text(day.notes, 18, y + 12, { maxWidth: 170 });
          y += 24;
        }
      }

      y = ensurePdfSpace(doc, y, 42);
      doc.setFillColor(...pdfTheme.green);
      doc.rect(14, y, 182, 11, "F");
      doc.setTextColor(255, 252, 244);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Before you travel", 18, y + 7.5);
      y += 17;

      const checklist = [
        "Confirm hotel booking and check-in time.",
        "Check local weather and seasonal travel advisories.",
        "Carry passport/ID, payment method, and emergency contact details.",
        "Confirm transport time between cities before departure.",
      ];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...pdfTheme.ink);
      checklist.forEach((item) => {
        doc.text(`• ${item}`, 18, y);
        y += 6;
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...pdfTheme.muted);
        doc.text(`TourismHub LK • Page ${page} of ${pageCount}`, 14, 291);
      }

      const fileName = `${(tripName || "Sri Lanka Holiday Plan").replace(/\s+/g, "_")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

                          return (
    <main className="trip-planner-page">
      <style>{plannerCss}</style>

      {showGuide && (
        <div className="planner-guide-backdrop" role="dialog" aria-modal="true">
          <section className="planner-guide-card">
            <button className="planner-guide-close" onClick={() => setShowGuide(false)} aria-label="Close guide">
              ×
            </button>
            <span className="planner-eyebrow">Trip guide</span>
            <h2>{guideSteps[activeGuideStep].title}</h2>
            <p>{guideSteps[activeGuideStep].text}</p>
            <div className="planner-guide-dots">
              {guideSteps.map((step, index) => (
                <button
                  key={step.title}
                  className={activeGuideStep === index ? "active" : ""}
                  onClick={() => setActiveGuideStep(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="planner-guide-actions">
              <button
                className="planner-ghost-btn"
                onClick={() => setActiveGuideStep(Math.max(0, activeGuideStep - 1))}
                disabled={activeGuideStep === 0}
              >
                Previous
              </button>
              {activeGuideStep < guideSteps.length - 1 ? (
                <button
                  className="planner-primary-btn"
                  onClick={() => setActiveGuideStep(activeGuideStep + 1)}
                >
                  Next
                </button>
              ) : (
                <button className="planner-primary-btn" onClick={() => setShowGuide(false)}>
                  Start planning
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      <section
        className="trip-planner-banner trip-planner-showcase-hero"
        aria-label="Plan your trip hero"
      >
        {currentHeroSlide?.image ? (
          <img
            key={`${currentHeroSlide.id}-${heroSlideIndex}`}
            className="trip-hero-bg-image"
            src={currentHeroSlide.image}
            alt=""
            aria-hidden="true"
          />
        ) : null}
        <div className="trip-showcase-overlay" aria-hidden="true" />
        <div className="trip-showcase-inner">
          <div className="trip-showcase-copy">
            <p>PLAN YOUR TRIP</p>
            <h1>Design your Sri Lanka route</h1>
            <span>Start with saved destinations, mix nearby hotels, organise each day, and turn your ideas into a clean traveller-ready plan.</span>

            <div className="trip-showcase-actions" aria-label="Trip planning actions">
              <Link to="/explore">Explore Places</Link>
              <a href="#saved-destinations">Saved Places</a>
              <a href="#suggested-itineraries">Suggested Plans</a>
              <a href="#custom-plan">Custom Plan</a>
            </div>
          </div>

          <aside className="trip-showcase-card clear-preview-card" aria-label="Trip slideshow preview">
            <div
              className="trip-showcase-photo clear-preview-photo"
              style={{ backgroundImage: currentHeroSlide?.image ? `url(${currentHeroSlide.image})` : undefined }}
            />
            <div className="clear-preview-shade" aria-hidden="true" />
            <div className="trip-showcase-card-content clear-preview-content">
              <span>Changing every 4 seconds</span>
              <h2>{currentHeroSlide?.title || "Sri Lanka Trip Planner"}</h2>
              <p>{currentHeroSlide?.subtitle || "Database photos from destinations and approved hotels"}</p>
              <div className="trip-showcase-card-tags clear-preview-tags">
                <b>{currentHeroSlide?.type || "Database"}</b>
                <b>{heroSlides.length ? `${heroSlideIndex + 1}/${heroSlides.length}` : "Live"}</b>
              </div>
            </div>
          </aside>
        </div>

        <div className="trip-showcase-stats" aria-label="Trip planner summary">
          {tripHeroStats.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <nav className="trip-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>›</span>
        <strong>Plan Your Trip</strong>
      </nav>

      <section className="trip-planner-intro" aria-label="Trip planning introduction">
        <article className="intro-main-card">
          <span className="planner-eyebrow light">Book your trip</span>
          <h2>Create a Sri Lanka route before choosing your stay.</h2>
          <p>
            Start with a suggested itinerary or bring saved destinations from Explore. Then arrange
            each day, check nearby hotels, and export a traveller-friendly PDF plan.
          </p>
          <div className="intro-step-row">
            {[
              ["01", "Explore", "Save places"],
              ["02", "Plan", "Arrange days"],
              ["03", "Stay", "Find hotels"],
              ["04", "Export", "Download PDF"],
            ].map(([number, title, text]) => (
              <div className="intro-step" key={title}>
                <span>{number}</span>
                <b>{title}</b>
                <small>{text}</small>
              </div>
            ))}
          </div>
          <div className="planner-hero-actions">
            <Link to="/explore" className="planner-primary-btn">Add places from Explore</Link>
            <button className="planner-dark-btn" onClick={() => buildStarterPlan()}>Use island highlights</button>
            <button className="planner-ghost-btn" onClick={() => setShowGuide(true)}>How it works</button>
          </div>
        </article>

        <aside className="plan-visit-menu" aria-label="Plan your visit menu">
          <h3>Plan Your Visit</h3>
          <a href="#suggested-itineraries">Suggested itineraries</a>
          <Link to="/explore">Attractions</Link>
          <Link to="/hotels">Accommodation</Link>
          <Link to="/events">Events</Link>
          <Link to="/tourist-guides">Tour guides</Link>
          <button type="button" onClick={() => setShowGuide(true)}>Planner guide</button>
        </aside>
      </section>

      {notice && (
        <div className="planner-notice">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button>
        </div>
      )}

      <section id="custom-plan" className="planner-settings-band" aria-label="Trip setup">
        <div className="settings-header">
          <span className="planner-eyebrow light">Trip basics</span>
          <h2>Set the shape of your holiday</h2>
        </div>
        <div className="settings-grid">
          <label>
            Trip name
            <input value={tripName} onChange={(event) => setTripName(event.target.value)} />
          </label>
          <label>
            Start date
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>
            Days
            <input
              type="number"
              min="1"
              max="14"
              value={daysCount}
              onChange={(event) => setDaysCount(event.target.value)}
            />
          </label>
          <label>
            Style
            <select value={travelStyle} onChange={(event) => setTravelStyle(event.target.value)}>
              {travelStyles.map((style) => (
                <option key={style}>{style}</option>
              ))}
            </select>
          </label>
          <label>
            Budget
            <select value={budgetLevel} onChange={(event) => setBudgetLevel(event.target.value)}>
              {Object.keys(budgetDailyTargets).map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>
          <label>
            Pace
            <select value={travelPace} onChange={(event) => setTravelPace(event.target.value)}>
              <option>Relaxed</option>
              <option>Balanced</option>
              <option>Packed</option>
            </select>
          </label>
          <button className="planner-primary-btn apply-btn" onClick={applyTripSettings}>Apply</button>
        </div>
      </section>

      <section className="route-template-section" id="suggested-itineraries">
        <div className="section-heading-line">
          <div>
            <span className="planner-eyebrow light">Suggested itineraries</span>
            <h2>Start with a route, then make it yours</h2>
          </div>
          <p>Templates are editable. Add, remove, reorder, and connect hotels after selecting one.</p>
        </div>
        <div className="template-grid">
          {starterRoutes.map((route) => {
            const routePlaces = route.placeIds.map(getPlaceById).filter(Boolean);
            const cover = routePlaces[0]?.image;
            const cities = routePlaces.map((place) => place.city).filter(Boolean);

            return (
              <article className="template-card" key={route.id}>
                <div className="template-image">
                  {cover ? <img src={cover} alt={route.title} /> : <span>{route.title}</span>}
                  <b>{route.label}</b>
                </div>
                <div className="template-body">
                  <h3>{route.title}</h3>
                  <p>{route.description}</p>
                  <small>{cities.join(" → ")}</small>
                  <button onClick={() => buildStarterPlan(route.placeIds)}>Use this route</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="planner-services-strip" aria-label="Plan your visit links">
        {visitServices.map((service) => (
          <Link to={service.to} className="visit-service-card" key={service.title}>
            <span>{service.icon}</span>
            <div>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="planner-dashboard-grid" id="saved-destinations">
        <aside className="saved-destinations-panel">
          <div className="panel-title-row">
            <div>
              <span className="planner-eyebrow light">From Explore</span>
              <h2>Saved destinations</h2>
            </div>
            <Link to="/explore">Open Explore</Link>
          </div>

          {unusedSavedPlaces.length ? (
            <div className="saved-place-list">
              {unusedSavedPlaces.map((place) => (
                <article
                  className="saved-place-card"
                  key={place.id}
                  draggable
                  onDragStart={() => handleDragStart({ source: "saved", place })}
                >
                  <img src={place.image} alt={place.name} />
                  <div>
                    <h3>{place.name}</h3>
                    <p>{place.city} • {place.region}</p>
                    <div className="quick-day-row">
                      {days.slice(0, 5).map((day, index) => (
                        <button key={day.dayNumber} onClick={() => addPlaceToDay(place, index)}>
                          D{index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="quick-add-box">
              <strong>No unused saved places</strong>
              <p>Save destinations from Explore, or add a few popular places now.</p>
              <div className="quick-add-list">
                {popularPlaces.map((place) => (
                  <button key={place.id} onClick={() => addPopularToSaved(place)}>
                    + {place.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="itinerary-board" id="itinerary-board">
          <div className="route-overview-card">
            <div>
              <span className="planner-eyebrow light">Route overview</span>
              <h2>{routeCities.length ? routeCities.join(" → ") : "Choose destinations to create your route"}</h2>
              <p>
                {totalPlaces} places • {formatLkr(totalCost)} activity estimate • {formatDuration(totalTransit)} travel time
              </p>
            </div>
            <div className="route-actions">
              <button onClick={downloadPdf}>Download PDF</button>
              <button onClick={saveTripPlan}>Save</button>
              <button className="danger" onClick={clearPlan}>Clear</button>
            </div>
          </div>

          <div className="day-route-list">
            {days.map((day, dayIndex) => {
              const dayCost = calculateDayCost(day);
              const transitMinutes = calculateTransitMinutes(day);
              const isOverBudget = dayCost > dailyBudgetTarget;
              const city = day.places[0]?.city || "this city";

              return (
                <article
                  className="day-itinerary-card"
                  key={day.dayNumber}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDropOnDay(dayIndex)}
                >
                  <div className="day-number-rail">
                    <span>{String(day.dayNumber).padStart(2, "0")}</span>
                  </div>

                  <div className="day-card-content">
                    <header className="day-card-header">
                      <div>
                        <strong>Day {day.dayNumber}</strong>
                        <h3>{formatDate(day.date)}</h3>
                      </div>
                      <button
                        className={day.hotelBooked ? "hotel-status selected" : "hotel-status missing"}
                        onClick={() => toggleHotel(dayIndex)}
                      >
                        {day.hotelBooked ? "Hotel selected" : "Need hotel"}
                      </button>
                    </header>

                    <div className="day-metrics-row">
                      <span className={isOverBudget ? "warning" : ""}>Cost {formatLkr(dayCost)}</span>
                      <span>Transit {formatDuration(transitMinutes)}</span>
                      <span>{day.places.length} places</span>
                    </div>

                    {!day.places.length ? (
                      <div className="empty-drop-zone">
                        <strong>Drop destinations here</strong>
                        <p>Use saved places from the left panel or apply a suggested itinerary.</p>
                      </div>
                    ) : (
                      <div className="scheduled-place-list">
                        {day.places.map((place, placeIndex) => {
                          const travel = placeIndex
                            ? getTravelTime(day.places[placeIndex - 1].city, place.city)
                            : null;

                          return (
                            <div className="place-schedule-block" key={place.id}>
                              {travel && (
                                <div className="travel-connector">
                                  <span>{travel.mode}</span>
                                  <p>{travel.label} from {day.places[placeIndex - 1].city} to {place.city}</p>
                                </div>
                              )}

                              <article
                                className="scheduled-place-card"
                                draggable
                                onDragStart={() => handleDragStart({ source: "day", dayIndex, place })}
                              >
                                <div className="place-time-badge">{daySlotLabels[placeIndex] || "Later"}</div>
                                <img src={place.image} alt={place.name} />
                                <div className="scheduled-place-info">
                                  <h4>{place.name}</h4>
                                  <p>{place.city} • {place.duration}</p>
                                  <div className="place-tags-row">
                                    <span>{place.budget}</span>
                                    <span>{formatLkr(Number(place.estimatedCost || 0))}</span>
                                  </div>
                                </div>
                                <div className="place-action-stack">
                                  <Link to={`/explore?place=${place.id}`}>Details</Link>
                                  <button onClick={() => movePlaceWithinDay(dayIndex, placeIndex, -1)}>↑</button>
                                  <button onClick={() => movePlaceWithinDay(dayIndex, placeIndex, 1)}>↓</button>
                                  <button onClick={() => removePlaceFromDay(dayIndex, place.id)}>Remove</button>
                                </div>
                              </article>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {day.places.length > 0 && !day.hotelBooked && (
                      <div className="stay-check-card">
                        <div>
                          <strong>Stay check</strong>
                          <p>You are visiting {city}. Choose a hotel for this night.</p>
                        </div>
                        <Link to={getHotelSearchLink(day)}>Find hotels in {city}</Link>
                      </div>
                    )}

                    {day.places.length > 0 && day.hotelBooked && (
                      <div className="stay-selected-card">Stay selected for this day.</div>
                    )}

                    <label className="day-note-field">
                      Day note
                      <textarea
                        value={day.notes}
                        onChange={(event) => updateDayNotes(dayIndex, event.target.value)}
                        placeholder="Example: Start early, keep evening free, check train times..."
                      />
                    </label>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="plan-assistant-panel">
          <div className="assistant-card plan-health-card">
            <span className="planner-eyebrow light">Plan health</span>
            <strong>{readiness}%</strong>
            <div className="planner-progress"><i style={{ width: `${readiness}%` }} /></div>
            <p>{hotelCoveredDays}/{days.length} days have stay status checked.</p>
          </div>

          <div className="assistant-card before-card">
            <span className="planner-eyebrow light">Before you go</span>
            <ul>
              {beforeYouGo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="assistant-card export-card">
            <span className="planner-eyebrow light">Final step</span>
            <h3>Ready to share?</h3>
            <p>Download a detailed itinerary with images, day notes, hotel status, travel time, and cost estimates.</p>
            <button onClick={downloadPdf}>Download itinerary PDF</button>
          </div>
        </aside>
      </section>
    </main>
  );
}

const plannerCss = `
  .trip-planner-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 8% 8%, rgba(255, 199, 44, 0.16), transparent 28%),
      radial-gradient(circle at 90% 12%, rgba(15, 118, 110, 0.12), transparent 26%),
      linear-gradient(180deg, #fffaf0 0%, #f3fffb 46%, #fffdf7 100%);
    color: #12302d;
    padding-bottom: 82px;
  }


  .trip-planner-banner {
    min-height: 300px;
    background:
      linear-gradient(90deg, rgba(5, 24, 39, 0.72), rgba(5, 124, 111, 0.35)),
      url("https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1800&q=85") center/cover no-repeat;
    display: flex;
    align-items: center;
    padding: 54px max(18px, 8vw);
    border-bottom: 1px solid rgba(15, 118, 110, 0.12);
  }

  .trip-banner-card {
    width: min(420px, 92vw);
    border-radius: 18px;
    padding: 28px 30px;
    background: rgba(12, 24, 34, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow: 0 24px 65px rgba(0, 0, 0, 0.28);
    color: #ffffff;
    backdrop-filter: blur(8px);
  }

  .trip-banner-card .planner-eyebrow {
    background: transparent;
    color: #ffffff;
    border: none;
    padding: 0;
  }

  .trip-banner-card h1 {
    margin: 14px 0 8px;
    font-size: clamp(36px, 5vw, 58px);
    line-height: 0.98;
    letter-spacing: -1px;
  }

  .trip-banner-card i {
    display: block;
    width: 54px;
    height: 4px;
    border-radius: 999px;
    background: #18d0bf;
    margin: 14px 0 18px;
  }

  .trip-banner-card p {
    margin: 0;
    color: rgba(255, 255, 255, 0.88);
    font-weight: 700;
    line-height: 1.7;
  }

  .trip-breadcrumb {
    max-width: 1180px;
    margin: 0 auto;
    padding: 18px 18px 0;
    display: flex;
    gap: 8px;
    align-items: center;
    color: #64748b;
    font-size: 13px;
    font-weight: 800;
  }

  .trip-breadcrumb a {
    color: #0f766e;
    text-decoration: none;
  }

  .trip-breadcrumb strong { color: #0f172a; }

  .trip-planner-intro {
    max-width: 1180px;
    margin: 46px auto 26px;
    padding: 0 18px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 28px;
    align-items: start;
  }

  .intro-main-card,
  .plan-visit-menu {
    background: #ffffff;
    border: 1px solid #d8eee8;
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
  }

  .intro-main-card {
    border-radius: 28px;
    padding: 34px;
    border-left: 6px solid #0f766e;
  }

  .intro-main-card h2 {
    margin: 12px 0 12px;
    font-size: clamp(30px, 4vw, 48px);
    line-height: 1.02;
    letter-spacing: -1.4px;
    color: #063d38;
  }

  .intro-main-card > p {
    margin: 0;
    max-width: 760px;
    color: #52625e;
    font-weight: 750;
    line-height: 1.8;
  }

  .intro-step-row {
    margin: 26px 0 4px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .intro-step {
    border-radius: 18px;
    background: #f7fffc;
    border: 1px solid #ccfbf1;
    padding: 14px;
  }

  .intro-step span {
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #0f766e;
    color: #ffffff;
    font-weight: 950;
    margin-bottom: 10px;
  }

  .intro-step b,
  .intro-step small { display: block; }

  .intro-step b { color: #0f172a; font-weight: 950; }
  .intro-step small { color: #64748b; font-weight: 800; margin-top: 3px; }

  .plan-visit-menu {
    border-radius: 22px;
    overflow: hidden;
    position: sticky;
    top: 104px;
  }

  .plan-visit-menu h3 {
    margin: 0;
    padding: 20px 22px;
    color: #ffffff;
    background: linear-gradient(135deg, #0f172a, #0f766e);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .plan-visit-menu a,
  .plan-visit-menu button {
    display: block;
    width: 100%;
    padding: 15px 22px;
    border: 0;
    border-bottom: 1px solid #edf3f1;
    background: #ffffff;
    color: #334155;
    text-align: left;
    text-decoration: none;
    font-weight: 850;
    cursor: pointer;
  }

  .plan-visit-menu a:hover,
  .plan-visit-menu button:hover {
    background: #ecfdf5;
    color: #0f766e;
  }

  .planner-hero-pro,
  .planner-notice,
  .planner-settings-band,
  .route-template-section,
  .planner-services-strip,
  .planner-dashboard-grid {
    max-width: 1240px;
    margin-left: auto;
    margin-right: auto;
    padding-left: 22px;
    padding-right: 22px;
  }

  .planner-hero-pro {
    padding-top: 58px;
    padding-bottom: 24px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 380px;
    gap: 28px;
    align-items: stretch;
  }

  .planner-hero-copy {
    min-height: 350px;
    border-radius: 34px;
    padding: 42px;
    color: #ffffff;
    overflow: hidden;
    position: relative;
    background:
      linear-gradient(90deg, rgba(4, 47, 46, 0.94), rgba(15, 118, 110, 0.74)),
      url("https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1400") center/cover;
    box-shadow: 0 30px 80px rgba(6, 65, 61, 0.18);
  }
  .planner-hero-copy::after {
    content: "";
    position: absolute;
    right: -80px;
    bottom: -100px;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: rgba(255, 199, 44, 0.18);
  }

  .planner-eyebrow {
    display: inline-flex;
    width: fit-content;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
    color: #fffdf5;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 8px 13px;
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .planner-eyebrow.light {
    background: #d7fff4;
    color: #0f766e;
    border-color: #a7f3d0;
  }

  .planner-hero-copy h1 {
    position: relative;
    z-index: 1;
    max-width: 750px;
    margin: 22px 0 16px;
    font-size: clamp(42px, 6vw, 74px);
    line-height: 0.96;
    letter-spacing: -0.06em;
  }
  .planner-hero-copy p {
    position: relative;
    z-index: 1;
    max-width: 720px;
    margin: 0;
    color: #dcfffa;
    font-size: 18px;
    line-height: 1.65;
    font-weight: 800;
  }

  .planner-hero-actions,
  .planner-guide-actions,
  .settings-grid,
  .route-actions,
  .quick-day-row,
  .place-tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .planner-hero-actions { position: relative; z-index: 1; margin-top: 28px; }

  .planner-primary-btn,
  .planner-ghost-btn,
  .planner-dark-btn,
  .apply-btn,
  .template-card button,
  .route-actions button,
  .quick-add-list button,
  .export-card button,
  .stay-check-card a,
  .panel-title-row a,
  .place-action-stack a,
  .place-action-stack button {
    border: none;
    border-radius: 999px;
    min-height: 42px;
    padding: 11px 17px;
    font-weight: 950;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .planner-primary-btn,
  .template-card button,
  .route-actions button:first-child,
  .export-card button {
    background: #ffc72c;
    color: #10201e;
    box-shadow: 0 16px 35px rgba(255, 199, 44, 0.25);
  }
  .planner-dark-btn,
  .stay-check-card a,
  .panel-title-row a {
    background: #0f766e;
    color: #ffffff;
  }
  .planner-ghost-btn,
  .route-actions button,
  .place-action-stack a,
  .place-action-stack button {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.35);
  }
  .route-actions button,
  .place-action-stack a,
  .place-action-stack button {
    background: #ffffff;
    color: #0f766e;
    border: 1px solid #b7eee6;
  }
  .route-actions .danger,
  .planner-guide-close {
    background: #fee2e2;
    color: #b91c1c;
  }
  .planner-primary-btn:hover,
  .planner-ghost-btn:hover,
  .planner-dark-btn:hover,
  .apply-btn:hover,
  .template-card button:hover,
  .route-actions button:hover,
  .quick-add-list button:hover,
  .export-card button:hover,
  .stay-check-card a:hover,
  .panel-title-row a:hover,
  .place-action-stack a:hover,
  .place-action-stack button:hover {
    transform: translateY(-2px);
  }

  .planner-flow-panel,
  .planner-settings-band,
  .template-card,
  .visit-service-card,
  .saved-destinations-panel,
  .route-overview-card,
  .day-itinerary-card,
  .assistant-card,
  .planner-guide-card {
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid #c8f1e7;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  }

  .planner-flow-panel {
    border-radius: 32px;
    padding: 24px;
    display: grid;
    gap: 18px;
  }
  .flow-panel-header {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: center;
  }
  .flow-panel-header span,
  .settings-header h2,
  .section-heading-line h2,
  .panel-title-row h2,
  .route-overview-card h2,
  .assistant-card h3 {
    color: #063f3a;
  }
  .flow-panel-header span { font-weight: 950; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; }
  .flow-panel-header strong { color: #0f766e; font-size: 26px; }
  .planner-progress { height: 10px; background: #e1f5f1; border-radius: 999px; overflow: hidden; }
  .planner-progress i { display: block; height: 100%; background: linear-gradient(90deg, #ffc72c, #0f766e); border-radius: 999px; }
  .flow-steps-list { display: grid; gap: 12px; }
  .flow-steps-list article { display: grid; grid-template-columns: 48px 1fr; gap: 12px; align-items: center; }
  .flow-steps-list article span { width: 44px; height: 44px; border-radius: 16px; background: #063f3a; color: #fff; display: grid; place-items: center; font-weight: 950; }
  .flow-steps-list h3 { margin: 0 0 3px; color: #063f3a; }
  .flow-steps-list p { margin: 0; color: #64748b; font-weight: 760; }

  .planner-notice {
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .planner-notice span { flex: 1; padding: 14px 16px; border-radius: 18px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-weight: 950; }
  .planner-notice button { border: none; background: transparent; font-size: 24px; color: #0f766e; cursor: pointer; }

  .planner-settings-band {
    margin-top: 28px;
    border-radius: 30px;
    padding-top: 24px;
    padding-bottom: 24px;
  }
  .settings-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
  .settings-header h2 { margin: 0; font-size: clamp(28px, 4vw, 42px); letter-spacing: -0.04em; }
  .settings-grid { align-items: end; }
  .settings-grid label {
    flex: 1 1 140px;
    display: grid;
    gap: 7px;
    color: #334155;
    font-weight: 950;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .settings-grid input,
  .settings-grid select,
  .day-note-field textarea {
    width: 100%;
    border: 1px solid #b7eee6;
    border-radius: 16px;
    background: #f8fffc;
    color: #12302d;
    padding: 13px 14px;
    font-weight: 850;
    outline: none;
  }
  .apply-btn { background: #063f3a; color: white; }

  .route-template-section { padding-top: 42px; }
  .section-heading-line {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 22px;
    margin-bottom: 20px;
  }
  .section-heading-line h2 { margin: 12px 0 0; font-size: clamp(30px, 4vw, 48px); letter-spacing: -0.05em; }
  .section-heading-line p { max-width: 410px; color: #64748b; font-weight: 780; line-height: 1.5; }
  .template-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .template-card { border-radius: 26px; overflow: hidden; }
  .template-image { height: 150px; position: relative; overflow: hidden; background: #0f766e; color: white; }
  .template-image img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(0.72); transition: transform 0.35s ease; }
  .template-card:hover .template-image img { transform: scale(1.06); }
  .template-image b { position: absolute; left: 12px; bottom: 12px; background: #ffc72c; color: #10201e; border-radius: 999px; padding: 7px 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
  .template-body { padding: 16px; }
  .template-body h3 { margin: 0 0 8px; color: #063f3a; font-size: 20px; }
  .template-body p { margin: 0 0 10px; color: #64748b; line-height: 1.5; font-weight: 720; }
  .template-body small { display: block; min-height: 34px; color: #0f766e; font-weight: 900; }
  .template-body button { margin-top: 12px; width: 100%; }

  .planner-services-strip {
    padding-top: 34px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }
  .visit-service-card {
    border-radius: 24px;
    padding: 18px;
    display: flex;
    gap: 13px;
    text-decoration: none;
    color: inherit;
    transition: transform 0.18s ease;
  }
  .visit-service-card:hover { transform: translateY(-3px); }
  .visit-service-card span { width: 46px; height: 46px; border-radius: 16px; background: #d7fff4; display: grid; place-items: center; font-size: 22px; }
  .visit-service-card h3 { margin: 0 0 5px; color: #063f3a; }
  .visit-service-card p { margin: 0; color: #64748b; font-weight: 730; line-height: 1.45; }

  .planner-dashboard-grid {
    padding-top: 34px;
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr) 280px;
    gap: 20px;
    align-items: start;
  }
  .saved-destinations-panel,
  .plan-assistant-panel { position: sticky; top: 96px; }
  .saved-destinations-panel,
  .assistant-card { border-radius: 28px; padding: 18px; }
  .panel-title-row { display: flex; justify-content: space-between; align-items: start; gap: 14px; margin-bottom: 14px; }
  .panel-title-row h2 { margin: 10px 0 0; font-size: 28px; letter-spacing: -0.04em; }
  .panel-title-row a { font-size: 13px; min-height: auto; padding: 9px 12px; }
  .saved-place-list { display: grid; gap: 12px; max-height: 670px; overflow: auto; padding-right: 4px; }
  .saved-place-card {
    display: grid;
    grid-template-columns: 78px 1fr;
    gap: 12px;
    padding: 10px;
    border-radius: 20px;
    background: #f8fffc;
    border: 1px solid #d7f8ef;
    cursor: grab;
  }
  .saved-place-card img { width: 78px; height: 72px; object-fit: cover; border-radius: 15px; }
  .saved-place-card h3 { margin: 0 0 4px; color: #063f3a; font-size: 16px; }
  .saved-place-card p { margin: 0; color: #64748b; font-weight: 750; font-size: 13px; }
  .quick-day-row { margin-top: 8px; }
  .quick-day-row button { border: none; border-radius: 999px; background: #e5fdf7; color: #0f766e; font-weight: 950; padding: 6px 8px; cursor: pointer; }
  .quick-add-box { display: grid; gap: 10px; color: #64748b; font-weight: 750; }
  .quick-add-list { display: grid; gap: 7px; }
  .quick-add-list button { text-align: left; background: #f8fffc; color: #063f3a; border: 1px solid #d7f8ef; border-radius: 14px; }

  .itinerary-board { min-width: 0; }
  .route-overview-card {
    border-radius: 28px;
    padding: 22px;
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
    margin-bottom: 18px;
  }
  .route-overview-card h2 { margin: 12px 0 6px; font-size: 30px; line-height: 1.08; letter-spacing: -0.04em; }
  .route-overview-card p { margin: 0; color: #64748b; font-weight: 800; }
  .route-actions { justify-content: flex-end; }

  .day-route-list { display: grid; gap: 18px; }
  .day-itinerary-card {
    border-radius: 30px;
    display: grid;
    grid-template-columns: 70px 1fr;
    overflow: hidden;
  }
  .day-number-rail { background: linear-gradient(180deg, #063f3a, #0f766e); display: flex; justify-content: center; padding-top: 24px; }
  .day-number-rail span { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: #ffc72c; color: #10201e; font-weight: 950; }
  .day-card-content { padding: 20px; }
  .day-card-header { display: flex; justify-content: space-between; gap: 14px; align-items: start; }
  .day-card-header strong { color: #0f766e; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; }
  .day-card-header h3 { margin: 6px 0 0; color: #063f3a; font-size: 26px; }
  .hotel-status { border: none; border-radius: 999px; padding: 10px 13px; font-weight: 950; cursor: pointer; }
  .hotel-status.selected { background: #dcfce7; color: #166534; }
  .hotel-status.missing { background: #fee2e2; color: #b91c1c; }
  .day-metrics-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
  .day-metrics-row span { background: #f8fffc; border: 1px solid #d7f8ef; border-radius: 999px; color: #0f766e; padding: 7px 10px; font-weight: 950; font-size: 12px; }
  .day-metrics-row .warning { background: #fff7ed; color: #b45309; border-color: #fed7aa; }
  .empty-drop-zone { border: 1.5px dashed #98d9cd; border-radius: 22px; padding: 28px; text-align: center; background: #f8fffc; color: #64748b; font-weight: 760; }
  .empty-drop-zone strong { display: block; color: #063f3a; font-size: 20px; margin-bottom: 6px; }
  .scheduled-place-list { display: grid; gap: 12px; }
  .travel-connector { display: flex; align-items: center; gap: 10px; margin: 5px 0 10px 88px; color: #0f766e; font-weight: 850; }
  .travel-connector span { background: #d7fff4; border-radius: 999px; padding: 6px 10px; font-size: 12px; text-transform: uppercase; }
  .travel-connector p { margin: 0; color: #64748b; font-size: 13px; }
  .scheduled-place-card {
    display: grid;
    grid-template-columns: 86px 132px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    background: #f8fffc;
    border: 1px solid #d7f8ef;
    border-radius: 24px;
    padding: 12px;
  }
  .place-time-badge { background: #063f3a; color: white; border-radius: 999px; padding: 8px 10px; text-align: center; font-weight: 950; font-size: 12px; }
  .scheduled-place-card img { width: 132px; height: 90px; object-fit: cover; border-radius: 18px; }
  .scheduled-place-info h4 { margin: 0 0 6px; color: #063f3a; font-size: 20px; }
  .scheduled-place-info p { margin: 0 0 9px; color: #64748b; font-weight: 760; }
  .place-tags-row span { background: #ecfdf5; color: #0f766e; border-radius: 999px; padding: 6px 9px; font-weight: 950; font-size: 12px; }
  .place-action-stack { display: grid; gap: 6px; justify-items: stretch; }
  .place-action-stack a,
  .place-action-stack button { min-height: auto; padding: 7px 9px; font-size: 12px; text-align: center; }
  .stay-check-card,
  .stay-selected-card {
    margin-top: 14px;
    border-radius: 22px;
    padding: 16px;
  }
  .stay-check-card { display: flex; justify-content: space-between; gap: 14px; align-items: center; background: #fff7ed; border: 1px solid #fed7aa; }
  .stay-check-card strong { color: #b45309; }
  .stay-check-card p { margin: 5px 0 0; color: #7c2d12; font-weight: 760; }
  .stay-selected-card { background: #ecfdf5; color: #166534; border: 1px solid #bbf7d0; font-weight: 950; }
  .day-note-field { display: grid; gap: 8px; margin-top: 14px; color: #334155; font-weight: 950; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
  .day-note-field textarea { min-height: 74px; resize: vertical; }

  .plan-assistant-panel { display: grid; gap: 14px; }
  .assistant-card { color: #64748b; font-weight: 760; }
  .plan-health-card strong { display: block; color: #0f766e; font-size: 46px; line-height: 1; margin: 12px 0; }
  .before-card ul { margin: 14px 0 0; padding-left: 18px; display: grid; gap: 10px; }
  .before-card li { line-height: 1.45; }
  .export-card h3 { margin: 12px 0 8px; font-size: 24px; }
  .export-card p { line-height: 1.55; }
  .export-card button { width: 100%; }


  @media (max-width: 980px) {
    .trip-planner-intro { grid-template-columns: 1fr; }
    .plan-visit-menu { position: static; }
    .intro-step-row { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 640px) {
    .trip-planner-banner { min-height: 260px; padding: 36px 18px; }
    .trip-banner-card { padding: 22px; }
    .intro-main-card { padding: 24px; }
    .intro-step-row { grid-template-columns: 1fr; }
  }

  .planner-guide-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: grid;
    place-items: center;
    background: rgba(4, 28, 26, 0.66);
    padding: 20px;
  }
  .planner-guide-card { width: min(620px, 100%); border-radius: 28px; padding: 28px; position: relative; }
  .planner-guide-card h2 { margin: 22px 0 12px; color: #063f3a; font-size: 34px; letter-spacing: -0.04em; }
  .planner-guide-card p { color: #64748b; font-weight: 760; line-height: 1.6; }
  .planner-guide-close { position: absolute; top: 12px; right: 14px; width: 38px; height: 38px; font-size: 24px; border: none; border-radius: 50%; cursor: pointer; }
  .planner-guide-dots { display: flex; gap: 8px; margin: 22px 0; }
  .planner-guide-dots button { width: 34px; height: 34px; border-radius: 999px; border: none; background: #d7fff4; color: #0f766e; font-weight: 950; cursor: pointer; }
  .planner-guide-dots button.active { background: #0f766e; color: white; }
  .planner-guide-actions button:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 1180px) {
    .planner-dashboard-grid { grid-template-columns: 1fr; }
    .saved-destinations-panel,
    .plan-assistant-panel { position: static; }
  }
  @media (max-width: 980px) {
    .planner-hero-pro { grid-template-columns: 1fr; }
    .template-grid,
    .planner-services-strip { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 760px) {
    .planner-hero-copy { border-radius: 0; margin-left: -22px; margin-right: -22px; padding: 34px 22px; }
    .settings-header,
    .section-heading-line,
    .route-overview-card,
    .stay-check-card { flex-direction: column; align-items: flex-start; }
    .settings-grid label { flex-basis: 100%; }
    .apply-btn { width: 100%; }
    .day-itinerary-card { grid-template-columns: 1fr; }
    .day-number-rail { padding: 12px; justify-content: flex-start; }
    .scheduled-place-card { grid-template-columns: 1fr; }
    .scheduled-place-card img { width: 100%; height: 180px; }
    .place-action-stack { grid-template-columns: repeat(4, 1fr); }
    .travel-connector { margin-left: 0; }
  }
  @media (max-width: 560px) {
    .template-grid,
    .planner-services-strip { grid-template-columns: 1fr; }
    .planner-hero-actions a,
    .planner-hero-actions button,
    .route-actions button { width: 100%; text-align: center; }
    .planner-dashboard-grid,
  
  .trip-planner-banner {
    min-height: 300px;
    background:
      linear-gradient(90deg, rgba(5, 24, 39, 0.72), rgba(5, 124, 111, 0.35)),
      url("https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1800&q=85") center/cover no-repeat;
    display: flex;
    align-items: center;
    padding: 54px max(18px, 8vw);
    border-bottom: 1px solid rgba(15, 118, 110, 0.12);
  }

  .trip-banner-card {
    width: min(420px, 92vw);
    border-radius: 18px;
    padding: 28px 30px;
    background: rgba(12, 24, 34, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow: 0 24px 65px rgba(0, 0, 0, 0.28);
    color: #ffffff;
    backdrop-filter: blur(8px);
  }

  .trip-banner-card .planner-eyebrow {
    background: transparent;
    color: #ffffff;
    border: none;
    padding: 0;
  }

  .trip-banner-card h1 {
    margin: 14px 0 8px;
    font-size: clamp(36px, 5vw, 58px);
    line-height: 0.98;
    letter-spacing: -1px;
  }

  .trip-banner-card i {
    display: block;
    width: 54px;
    height: 4px;
    border-radius: 999px;
    background: #18d0bf;
    margin: 14px 0 18px;
  }

  .trip-banner-card p {
    margin: 0;
    color: rgba(255, 255, 255, 0.88);
    font-weight: 700;
    line-height: 1.7;
  }

  .trip-breadcrumb {
    max-width: 1180px;
    margin: 0 auto;
    padding: 18px 18px 0;
    display: flex;
    gap: 8px;
    align-items: center;
    color: #64748b;
    font-size: 13px;
    font-weight: 800;
  }

  .trip-breadcrumb a {
    color: #0f766e;
    text-decoration: none;
  }

  .trip-breadcrumb strong { color: #0f172a; }

  .trip-planner-intro {
    max-width: 1180px;
    margin: 46px auto 26px;
    padding: 0 18px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 28px;
    align-items: start;
  }

  .intro-main-card,
  .plan-visit-menu {
    background: #ffffff;
    border: 1px solid #d8eee8;
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
  }

  .intro-main-card {
    border-radius: 28px;
    padding: 34px;
    border-left: 6px solid #0f766e;
  }

  .intro-main-card h2 {
    margin: 12px 0 12px;
    font-size: clamp(30px, 4vw, 48px);
    line-height: 1.02;
    letter-spacing: -1.4px;
    color: #063d38;
  }

  .intro-main-card > p {
    margin: 0;
    max-width: 760px;
    color: #52625e;
    font-weight: 750;
    line-height: 1.8;
  }

  .intro-step-row {
    margin: 26px 0 4px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .intro-step {
    border-radius: 18px;
    background: #f7fffc;
    border: 1px solid #ccfbf1;
    padding: 14px;
  }

  .intro-step span {
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #0f766e;
    color: #ffffff;
    font-weight: 950;
    margin-bottom: 10px;
  }

  .intro-step b,
  .intro-step small { display: block; }

  .intro-step b { color: #0f172a; font-weight: 950; }
  .intro-step small { color: #64748b; font-weight: 800; margin-top: 3px; }

  .plan-visit-menu {
    border-radius: 22px;
    overflow: hidden;
    position: sticky;
    top: 104px;
  }

  .plan-visit-menu h3 {
    margin: 0;
    padding: 20px 22px;
    color: #ffffff;
    background: linear-gradient(135deg, #0f172a, #0f766e);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .plan-visit-menu a,
  .plan-visit-menu button {
    display: block;
    width: 100%;
    padding: 15px 22px;
    border: 0;
    border-bottom: 1px solid #edf3f1;
    background: #ffffff;
    color: #334155;
    text-align: left;
    text-decoration: none;
    font-weight: 850;
    cursor: pointer;
  }

  .plan-visit-menu a:hover,
  .plan-visit-menu button:hover {
    background: #ecfdf5;
    color: #0f766e;
  }

  .planner-hero-pro,
    .planner-settings-band,
    .route-template-section,
    .planner-services-strip,
    .planner-notice { padding-left: 14px; padding-right: 14px; }
  }

  /* Explore-style Trip Planner landing hero */
  .trip-planner-banner.trip-planner-hero-match {
    position: relative;
    min-height: 480px;
    background:
      linear-gradient(90deg, rgba(1, 55, 63, 0.86), rgba(1, 77, 78, 0.58), rgba(1, 38, 49, 0.88)),
      url("https://images.pexels.com/photos/1971292/pexels-photo-1971292.jpeg?auto=compress&cs=tinysrgb&w=1800") center/cover no-repeat;
    display: grid;
    place-items: center;
    text-align: center;
    color: #ffffff;
    overflow: visible;
    padding: 70px 22px 82px;
    border-bottom: none;
  }

  .trip-hero-overlay {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 50% 26%, rgba(255, 255, 255, 0.16), transparent 22%),
      linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.32));
    pointer-events: none;
  }

  .trip-hero-content {
    position: relative;
    z-index: 2;
    max-width: 1120px;
    margin: 0 auto;
  }

  .trip-hero-content > p {
    margin: 0 0 20px;
    color: #ffbc38;
    font-size: 13px;
    font-weight: 950;
    letter-spacing: 0.46em;
  }

  .trip-hero-content h1 {
    margin: 0 0 18px;
    font-size: clamp(44px, 7vw, 76px);
    line-height: 1.03;
    letter-spacing: 0.04em;
    font-weight: 950;
    color: #ffffff;
  }

  .trip-hero-content > span {
    display: block;
    max-width: 820px;
    margin: 0 auto;
    color: #e5fffb;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.8;
  }

  .trip-hero-categories {
    margin-top: 40px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 14px;
  }

  .trip-hero-categories a,
  .trip-hero-categories button {
    border: 0;
    border-radius: 999px;
    padding: 14px 30px;
    background: #ffffff;
    color: #182c2b;
    text-decoration: none;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.12);
  }

  .trip-hero-categories a:first-child {
    background: #0aa6c7;
    color: #ffffff;
  }

  .trip-hero-four-actions {
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
  }

  .trip-breadcrumb {
    margin-top: 34px;
  }

  @media (max-width: 780px) {
    .trip-planner-banner.trip-planner-hero-match {
      min-height: 520px;
      padding: 58px 18px 74px;
    }
    .trip-hero-content h1 {
      font-size: clamp(36px, 11vw, 54px);
      letter-spacing: 0.02em;
    }
    .trip-hero-content > span {
      font-size: 15px;
    }
    .trip-hero-categories a,
    .trip-hero-categories button {
      width: 100%;
      padding: 13px 18px;
    }
    .trip-breadcrumb {
      margin-top: 28px;
    }
  }


  /* professional full-width trip planner top */
  .trip-planner-banner.trip-planner-showcase-hero {
    position: relative;
    min-height: clamp(520px, 68vh, 680px);
    width: 100%;
    padding: 52px max(18px, 5vw) 38px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    color: #ffffff;
    background: linear-gradient(135deg, #064e45, #0b6f61);
    border-bottom: 1px solid rgba(15, 118, 110, 0.14);
  }

  .trip-hero-bg-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    filter: saturate(1.08) contrast(1.02) brightness(1.08);
    animation: tripHeroFadeZoom 4.2s ease-in-out both;
  }

  .trip-showcase-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      linear-gradient(90deg, rgba(3, 47, 43, .68) 0%, rgba(5, 106, 92, .42) 52%, rgba(2, 35, 39, .56) 100%),
      radial-gradient(circle at 70% 15%, rgba(255, 205, 62, .18), transparent 36%);
  }

  .trip-showcase-inner {
    position: relative;
    z-index: 2;
    width: min(1240px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(300px, .46fr);
    align-items: center;
    gap: 34px;
  }

  .trip-showcase-copy p {
    display: inline-flex;
    margin: 0 0 18px;
    padding: 9px 17px;
    border-radius: 999px;
    background: rgba(255, 238, 159, .94);
    color: #04483f;
    letter-spacing: .26em;
    font-size: 12px;
    font-weight: 760;
  }

  .trip-showcase-copy h1 {
    margin: 0 0 18px;
    max-width: 760px;
    font-size: clamp(44px, 5.4vw, 76px);
    line-height: 1.04;
    letter-spacing: 0;
    font-weight: 800;
    color: #ffffff;
    text-shadow: 0 18px 50px rgba(0,0,0,.28);
  }

  .trip-showcase-copy > span {
    display: block;
    max-width: 700px;
    color: #f5fffc;
    font-size: clamp(16px, 1.25vw, 20px);
    font-weight: 620;
    line-height: 1.65;
    text-shadow: 0 8px 24px rgba(0,0,0,.22);
  }

  .trip-showcase-actions {
    margin-top: 26px;
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }

  .trip-showcase-actions a {
    border-radius: 999px;
    padding: 13px 22px;
    background: #ffffff;
    color: #064e45;
    text-decoration: none;
    font-size: 15px;
    font-weight: 760;
    box-shadow: 0 14px 35px rgba(0,0,0,.14);
  }

  .trip-showcase-actions a:first-child {
    background: #ffc22b;
    color: #083c38;
  }

  .trip-showcase-card {
    min-height: 340px;
    border-radius: 28px;
    padding: 26px;
    color: #ffffff;
    background: linear-gradient(145deg, rgba(255,255,255,.25), rgba(255,255,255,.1));
    border: 1px solid rgba(255,255,255,.34);
    box-shadow: 0 32px 80px rgba(0,0,0,.22);
    backdrop-filter: blur(13px);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow: hidden;
  }

  .trip-showcase-photo {
    height: 180px;
    border-radius: 26px;
    background: rgba(255,255,255,.18) center/cover no-repeat;
    margin-bottom: auto;
    box-shadow: inset 0 -60px 90px rgba(0,0,0,.18);
  }

  .trip-showcase-card > span {
    width: max-content;
    margin-top: 20px;
    padding: 9px 13px;
    border-radius: 999px;
    background: rgba(7, 102, 88, .82);
    color: #fff3a7;
    font-size: 12px;
    font-weight: 950;
  }

  .trip-showcase-card h2 {
    margin: 22px 0 8px;
    font-size: clamp(28px, 2.8vw, 44px);
    line-height: 1.05;
    letter-spacing: -.04em;
  }

  .trip-showcase-card p {
    margin: 0;
    font-weight: 850;
    color: #effffb;
  }

  .trip-showcase-card div {
    display:flex;
    flex-wrap:wrap;
    gap:10px;
    margin-top:18px;
  }

  .trip-showcase-card b {
    border-radius:999px;
    padding:9px 13px;
    background:rgba(255,255,255,.18);
    border:1px solid rgba(255,255,255,.25);
    color:#fff8cc;
    font-size:12px;
  }


  /* clear photo preview card effect */
  .trip-showcase-card.clear-preview-card {
    position:relative;
    min-height:340px;
    padding:0;
    color:#ffffff;
    background:#063f39;
    border:1px solid rgba(255,255,255,.34);
    box-shadow:0 32px 80px rgba(0,0,0,.24);
    backdrop-filter:none;
    display:block;
    overflow:hidden;
    isolation:isolate;
  }

  .trip-showcase-photo.clear-preview-photo {
    position:absolute;
    inset:0;
    width:100%;
    height:100%;
    margin:0;
    border-radius:0;
    background:rgba(255,255,255,.12) center/cover no-repeat;
    filter:saturate(1.08) contrast(1.02) brightness(1.08);
    box-shadow:none;
    transform:scale(1.01);
    transition:transform 4s ease, opacity .45s ease;
    z-index:0;
  }

  .trip-showcase-card.clear-preview-card:hover .clear-preview-photo { transform:scale(1.055); }

  .trip-showcase-card .clear-preview-shade {
    position:absolute;
    inset:0;
    z-index:1;
    background:linear-gradient(0deg,rgba(3,39,35,.84) 0%,rgba(4,65,58,.48) 46%,rgba(255,196,37,.07) 100%);
  }

  .trip-showcase-card-content.clear-preview-content {
    position:absolute;
    left:24px;
    right:24px;
    bottom:24px;
    z-index:2;
    display:flex;
    flex-direction:column;
    align-items:flex-start;
    justify-content:flex-end;
  }

  .trip-showcase-card-content.clear-preview-content > span {
    width:max-content;
    margin:0;
    padding:9px 13px;
    border-radius:999px;
    background:rgba(5,85,75,.80);
    color:#fff3a7;
    font-size:12px;
    font-weight:760;
    border:1px solid rgba(255,255,255,.24);
    box-shadow:0 10px 24px rgba(0,0,0,.16);
  }

  .trip-showcase-card-content.clear-preview-content h2 {
    margin:18px 0 8px;
    font-size:clamp(24px,2.2vw,34px);
    line-height:1.12;
    letter-spacing:-.045em;
    text-shadow:0 4px 18px rgba(0,0,0,.36);
  }

  .trip-showcase-card-content.clear-preview-content p {
    margin:0;
    font-weight:650;
    color:#eafffb;
    text-shadow:0 2px 12px rgba(0,0,0,.32);
  }

  .trip-showcase-card-tags.clear-preview-tags {
    display:flex;
    flex-wrap:wrap;
    gap:10px;
    margin-top:16px;
  }

  .trip-showcase-card-tags.clear-preview-tags b {
    border-radius:999px;
    padding:9px 13px;
    background:rgba(255,255,255,.18);
    border:1px solid rgba(255,255,255,.28);
    color:#fff8cc;
    font-size:12px;
    backdrop-filter:blur(4px);
  }

  .trip-showcase-stats {
    position: relative;
    z-index: 2;
    width: min(1240px, 100%);
    margin: 24px auto 0;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .trip-showcase-stats article {
    min-height: 78px;
    border-radius: 18px;
    padding: 16px 18px;
    background: rgba(255,255,255,.16);
    border: 1px solid rgba(255,255,255,.28);
    color: #fff;
    backdrop-filter: blur(10px);
  }

  .trip-showcase-stats strong {
    display:block;
    color:#ffe176;
    font-size: clamp(24px, 2.5vw, 34px);
    line-height: 1;
  }

  .trip-showcase-stats span {
    display:block;
    margin-top:8px;
    letter-spacing:.12em;
    text-transform:uppercase;
    font-size:12px;
    font-weight:760;
  }

  @keyframes tripHeroFadeZoom {
    0% { opacity: .12; transform: scale(1.02); }
    12% { opacity: 1; }
    100% { opacity: 1; transform: scale(1.075); }
  }

  @media (max-width: 1050px) {
    .trip-showcase-inner { grid-template-columns: 1fr; }
    .trip-showcase-stats { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 680px) {
    .trip-planner-banner.trip-planner-showcase-hero {
      min-height: auto;
      padding: 38px 16px 42px;
    }
    .trip-showcase-copy h1 { font-size: clamp(38px, 12vw, 54px); }
    .trip-showcase-actions a { width: 100%; text-align: center; }
    .trip-showcase-stats { grid-template-columns: 1fr; }
  }

`;

export default TripPlannerPage;
