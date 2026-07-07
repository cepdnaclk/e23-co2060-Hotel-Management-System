import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
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
    id: "classic",
    title: "Culture + Hill Country",
    description: "A balanced first Sri Lanka route for new visitors.",
    placeIds: [1, 2, 7, 3],
  },
  {
    id: "south",
    title: "South Coast Escape",
    description: "Heritage, beaches, food, and wildlife along the southern belt.",
    placeIds: [5, 4, 6],
  },
  {
    id: "adventure",
    title: "Adventure + Nature",
    description: "Scenic train, waterfalls, hikes, and wildlife experiences.",
    placeIds: [3, 8, 10, 6],
  },
];

const guideSteps = [
  {
    title: "Start from saved destinations",
    text: "Use Explore first, read destination details, then click Add to Trip. Those saved places appear here as planning cards.",
  },
  {
    title: "Build the route day by day",
    text: "Drag places into days or use quick buttons. The planner calculates activity cost and travel time for each day.",
  },
  {
    title: "Connect each day with hotels",
    text: "When a day has places but no accommodation, the planner shows a hotel alert and a direct hotel search link for that city.",
  },
  {
    title: "Export a complete itinerary",
    text: "After arranging your route, download a professional trip PDF with photos, experiences, tips, cost, and hotel status.",
  },
];

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

  useEffect(() => {
    const refreshSavedPlaces = () => {
      setSavedPlaces(loadJson(SAVED_PLACES_KEY, []));
    };

    refreshSavedPlaces();
    window.addEventListener("storage", refreshSavedPlaces);
    return () => window.removeEventListener("storage", refreshSavedPlaces);
  }, []);

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
    <main className="planner-shell">
      <style>{plannerCss}</style>

      {showGuide && (
        <div className="planner-guide-backdrop" role="dialog" aria-modal="true">
          <section className="planner-guide-card">
            <button className="planner-guide-close" onClick={() => setShowGuide(false)}>
              ×
            </button>
            <span className="planner-eyebrow">Planning guide</span>
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

      <section className="planner-hero">
        <div>
          <span className="planner-eyebrow">Smart trip planner</span>
          <h1>Organize saved places into a clear Sri Lanka route.</h1>
          <p>
            This workspace keeps the Explore art identity, but uses a cleaner structure:
            setup on the left, route summary on top, saved places on the side, and itinerary days in the center.
          </p>
          <div className="planner-hero-actions">
            <Link to="/explore" className="planner-primary-btn">Add places from Explore</Link>
            <button className="planner-ghost-btn" onClick={() => setShowGuide(true)}>Show guide</button>
            <button className="planner-dark-btn" onClick={() => buildStarterPlan()}>Auto build starter plan</button>
          </div>
        </div>

        <aside className="planner-readiness-card">
          <span>Plan readiness</span>
          <strong>{readiness}%</strong>
          <div className="planner-progress"><i style={{ width: `${readiness}%` }} /></div>
          <p>{totalPlaces} places • {formatLkr(totalCost)} activity cost • {formatDuration(totalTransit)} transit</p>
          <button onClick={saveTripPlan}>Save current plan</button>
        </aside>
      </section>

      {notice && (
        <div className="planner-notice">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}

      <section className="planner-flow-row">
        {[
          ["Explore", "Save destinations"],
          ["Plan", "Arrange days"],
          ["Stay", "Check hotels"],
          ["Export", "Download PDF"],
        ].map(([title, text], index) => (
          <article key={title}>
            <strong>{index + 1}</strong>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="planner-workspace">
        <aside className="planner-setup-card">
          <div className="planner-card-title">
            <span className="planner-mini-step">Step 1</span>
            <h2>Trip setup</h2>
          </div>

          <label>
            Trip name
            <input value={tripName} onChange={(event) => setTripName(event.target.value)} />
          </label>
          <label>
            Start date
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>
            Number of days
            <input
              type="number"
              min="1"
              max="14"
              value={daysCount}
              onChange={(event) => setDaysCount(event.target.value)}
            />
          </label>
          <label>
            Travel style
            <select value={travelStyle} onChange={(event) => setTravelStyle(event.target.value)}>
              {travelStyles.map((style) => (
                <option key={style}>{style}</option>
              ))}
            </select>
          </label>
          <label>
            Budget level
            <select value={budgetLevel} onChange={(event) => setBudgetLevel(event.target.value)}>
              {Object.keys(budgetDailyTargets).map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>
          <label>
            Travel pace
            <select value={travelPace} onChange={(event) => setTravelPace(event.target.value)}>
              <option>Relaxed</option>
              <option>Balanced</option>
              <option>Packed</option>
            </select>
          </label>

          <button className="planner-primary-btn full" onClick={applyTripSettings}>Apply setup</button>

          <div className="planner-template-box">
            <span className="planner-mini-step">Starter routes</span>
            {starterRoutes.map((route) => (
              <button key={route.id} onClick={() => buildStarterPlan(route.placeIds)}>
                <strong>{route.title}</strong>
                <small>{route.description}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="planner-board">
          <div className="planner-summary-card">
            <div>
              <span className="planner-eyebrow">Route preview</span>
              <h2>{routeCities.length ? routeCities.join(" → ") : "No route yet"}</h2>
              <p>
                Budget target per day: {formatLkr(dailyBudgetTarget)} • Hotels covered: {hotelCoveredDays}/{days.length} days
              </p>
            </div>
            <div className="planner-board-actions">
              <button onClick={downloadPdf}>Download detailed PDF</button>
              <button onClick={saveTripPlan}>Save</button>
              <button className="danger" onClick={clearPlan}>Clear</button>
            </div>
          </div>

          <div className="planner-days-grid">
            {days.map((day, dayIndex) => {
              const dayCost = calculateDayCost(day);
              const transitMinutes = calculateTransitMinutes(day);
              const isOverBudget = dayCost > dailyBudgetTarget;
              const city = day.places[0]?.city || "";

              return (
                <article
                  className="planner-day-card"
                  key={day.dayNumber}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDropOnDay(dayIndex)}
                >
                  <header>
                    <div>
                      <span>Day {day.dayNumber}</span>
                      <h3>{formatDate(day.date)}</h3>
                    </div>
                    <button
                      className={day.hotelBooked ? "hotel-ok" : "hotel-missing"}
                      onClick={() => toggleHotel(dayIndex)}
                    >
                      {day.hotelBooked ? "Hotel selected" : "Need hotel"}
                    </button>
                  </header>

                  <div className="planner-day-metrics">
                    <span className={isOverBudget ? "over" : ""}>Cost: {formatLkr(dayCost)}</span>
                    <span>Transit: {formatDuration(transitMinutes)}</span>
                    <span>{day.places.length} places</span>
                  </div>

                  {!day.places.length ? (
                    <div className="planner-empty-day">
                      Drag saved places here or use quick buttons from the saved place rail.
                    </div>
                  ) : (
                    <div className="planner-place-list">
                      {day.places.map((place, placeIndex) => {
                        const travel = placeIndex
                          ? getTravelTime(day.places[placeIndex - 1].city, place.city)
                          : null;

                        return (
                          <div key={place.id}>
                            {travel && (
                              <div className="planner-transit-pill">
                                {travel.mode}: {travel.label}
                              </div>
                            )}
                            <article
                              className="planner-planned-place"
                              draggable
                              onDragStart={() => handleDragStart({ source: "day", dayIndex, place })}
                            >
                              <img src={place.image} alt={place.name} />
                              <div>
                                <h4>{place.name}</h4>
                                <p>{place.city} • {place.duration}</p>
                                <small>{formatLkr(Number(place.estimatedCost || 0))}</small>
                              </div>
                              <div className="planner-place-actions">
                                <button onClick={() => movePlaceWithinDay(dayIndex, placeIndex, -1)}>↑</button>
                                <button onClick={() => movePlaceWithinDay(dayIndex, placeIndex, 1)}>↓</button>
                                <button onClick={() => removePlaceFromDay(dayIndex, place.id)}>×</button>
                              </div>
                            </article>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {day.places.length > 0 && !day.hotelBooked && (
                    <div className="planner-hotel-alert">
                      <strong>Accommodation check</strong>
                      <p>You are visiting {city}. Choose a hotel for this night.</p>
                      <Link to={getHotelSearchLink(day)}>Find hotels in {city}</Link>
                    </div>
                  )}

                  {day.places.length > 0 && day.hotelBooked && (
                    <div className="planner-hotel-selected">
                      Accommodation is marked as selected for this day.
                    </div>
                  )}

                  <label className="planner-notes-field">
                    Day note
                    <textarea
                      value={day.notes}
                      onChange={(event) => updateDayNotes(dayIndex, event.target.value)}
                      placeholder="Example: Start early, keep evening free, check train schedule..."
                    />
                  </label>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="planner-saved-rail">
          <div className="planner-card-title">
            <span className="planner-mini-step">Step 2</span>
            <h2>Saved places</h2>
          </div>
          <p>
            Drag places into a day card. If this list is empty, quick-add popular places or return to Explore.
          </p>

          {unusedSavedPlaces.length ? (
            <div className="planner-saved-list">
              {unusedSavedPlaces.map((place) => (
                <article
                  className="planner-saved-card"
                  key={place.id}
                  draggable
                  onDragStart={() => handleDragStart({ source: "saved", place })}
                >
                  <img src={place.image} alt={place.name} />
                  <div>
                    <h3>{place.name}</h3>
                    <p>{place.city} • {place.budget}</p>
                    <div className="planner-quick-days">
                      {days.slice(0, 4).map((day, index) => (
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
            <div className="planner-popular-box">
              <strong>No unused saved places</strong>
              <p>Quick-add a few places or open Explore for more details first.</p>
              {popularPlaces.map((place) => (
                <button key={place.id} onClick={() => addPopularToSaved(place)}>
                  + {place.name}
                </button>
              ))}
              <Link to="/explore">Open Explore →</Link>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

const plannerCss = `
  .planner-shell {
    min-height: 100vh;
    background:
      radial-gradient(circle at 12% 10%, rgba(226, 162, 26, 0.18), transparent 26%),
      radial-gradient(circle at 92% 6%, rgba(13, 148, 136, 0.12), transparent 22%),
      linear-gradient(180deg, #fbf7ee 0%, #fffaf0 54%, #f8fbf7 100%);
    color: #12302d;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding-bottom: 70px;
  }

  .planner-hero,
  .planner-flow-row,
  .planner-workspace,
  .planner-notice {
    max-width: 1220px;
    margin-left: auto;
    margin-right: auto;
    padding-left: 22px;
    padding-right: 22px;
  }

  .planner-hero {
    padding-top: 58px;
    padding-bottom: 22px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 28px;
    align-items: end;
  }

  .planner-eyebrow,
  .planner-mini-step {
    display: inline-flex;
    width: fit-content;
    background: #06413d;
    color: #fffdf5;
    padding: 8px 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 12px;
    font-weight: 950;
    box-shadow: 4px 4px 0 #e2a21a;
  }

  .planner-mini-step {
    background: #fff4d4;
    color: #06413d;
    box-shadow: none;
    border: 1.6px solid #d3b97c;
  }

  .planner-hero h1 {
    margin: 20px 0 16px;
    max-width: 800px;
    color: #06413d;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(42px, 6vw, 68px);
    line-height: 0.98;
    letter-spacing: -0.055em;
  }

  .planner-hero p,
  .planner-saved-rail p,
  .planner-template-box small,
  .planner-summary-card p,
  .planner-empty-day,
  .planner-hotel-alert p,
  .planner-guide-card p {
    color: #52625e;
    font-weight: 740;
    line-height: 1.62;
  }

  .planner-hero-actions,
  .planner-guide-actions,
  .planner-board-actions,
  .planner-quick-days {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .planner-primary-btn,
  .planner-ghost-btn,
  .planner-dark-btn,
  .planner-readiness-card button,
  .planner-board-actions button,
  .planner-template-box button,
  .planner-popular-box button,
  .planner-popular-box a,
  .planner-hotel-alert a {
    border-radius: 0;
    border: 1.8px solid #06413d;
    min-height: 42px;
    padding: 10px 15px;
    font-weight: 950;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.18s ease;
  }

  .planner-primary-btn,
  .planner-readiness-card button,
  .planner-board-actions button:first-child {
    background: #e2a21a;
    color: #111827;
    box-shadow: 5px 5px 0 rgba(6, 65, 61, 0.18);
  }

  .planner-ghost-btn,
  .planner-board-actions button {
    background: #fffdf5;
    color: #06413d;
  }

  .planner-dark-btn,
  .planner-hotel-alert a {
    background: #06413d;
    color: #fffdf5;
  }

  .planner-primary-btn.full { width: 100%; }

  .planner-board-actions .danger,
  .planner-guide-close {
    background: #fde8e6;
    color: #a23128;
    border-color: #a23128;
  }

  .planner-primary-btn:hover,
  .planner-ghost-btn:hover,
  .planner-dark-btn:hover,
  .planner-readiness-card button:hover,
  .planner-board-actions button:hover,
  .planner-template-box button:hover,
  .planner-popular-box button:hover,
  .planner-hotel-alert a:hover {
    transform: translateY(-2px);
  }

  .planner-readiness-card,
  .planner-setup-card,
  .planner-saved-rail,
  .planner-summary-card,
  .planner-day-card,
  .planner-flow-row article,
  .planner-guide-card {
    background: #fffdf5;
    border: 1.8px solid #d3b97c;
    box-shadow: 8px 8px 0 rgba(6, 65, 61, 0.08);
  }

  .planner-readiness-card { padding: 24px; }
  .planner-readiness-card span { color: #52625e; font-weight: 950; text-transform: uppercase; font-size: 12px; }
  .planner-readiness-card strong { display: block; margin: 8px 0; color: #06413d; font-size: 44px; font-family: Georgia, "Times New Roman", serif; }
  .planner-progress { height: 10px; background: #e8ddc2; overflow: hidden; border: 1px solid #d3b97c; }
  .planner-progress i { display: block; height: 100%; background: linear-gradient(90deg, #e2a21a, #0f766e); }

  .planner-notice {
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    color: #06413d;
    font-weight: 950;
  }
  .planner-notice span { background: #fff4d4; border: 1.6px solid #d3b97c; padding: 12px 14px; flex: 1; }
  .planner-notice button { border: none; background: transparent; font-size: 24px; color: #06413d; cursor: pointer; }

  .planner-flow-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    padding-top: 22px;
    padding-bottom: 28px;
  }
  .planner-flow-row article { display: flex; gap: 12px; align-items: center; padding: 16px; }
  .planner-flow-row strong { width: 34px; height: 34px; display: grid; place-items: center; background: #06413d; color: #fff; }
  .planner-flow-row h3 { margin: 0 0 4px; color: #06413d; }
  .planner-flow-row p { margin: 0; color: #52625e; font-weight: 760; }

  .planner-workspace {
    display: grid;
    grid-template-columns: 290px minmax(0, 1fr) 300px;
    gap: 20px;
    align-items: start;
  }

  .planner-setup-card,
  .planner-saved-rail {
    position: sticky;
    top: 96px;
    padding: 18px;
  }

  .planner-card-title h2 {
    margin: 12px 0 18px;
    color: #06413d;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 30px;
    line-height: 1;
  }

  .planner-setup-card label,
  .planner-notes-field {
    display: grid;
    gap: 7px;
    margin-bottom: 12px;
    color: #06413d;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 12px;
    font-weight: 950;
  }

  .planner-setup-card input,
  .planner-setup-card select,
  .planner-notes-field textarea {
    border: 1.8px solid #ccb987;
    background: #fffaf0;
    color: #12302d;
    padding: 11px;
    font-weight: 800;
    outline: none;
    width: 100%;
  }
  .planner-notes-field textarea { min-height: 74px; resize: vertical; }

  .planner-template-box {
    margin-top: 20px;
    display: grid;
    gap: 10px;
  }
  .planner-template-box button {
    display: grid;
    gap: 4px;
    text-align: left;
    background: #fffaf0;
    color: #06413d;
    box-shadow: none;
  }

  .planner-summary-card {
    padding: 22px;
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
    margin-bottom: 18px;
  }
  .planner-summary-card h2 { color: #06413d; margin: 14px 0 6px; font-size: 28px; }

  .planner-days-grid { display: grid; gap: 18px; }
  .planner-day-card { padding: 18px; }
  .planner-day-card header { display: flex; justify-content: space-between; gap: 12px; align-items: start; border-bottom: 1px dashed #d3b97c; padding-bottom: 14px; }
  .planner-day-card header span { color: #a23128; font-weight: 950; text-transform: uppercase; font-size: 12px; }
  .planner-day-card header h3 { margin: 5px 0 0; color: #06413d; font-size: 24px; font-family: Georgia, "Times New Roman", serif; }
  .hotel-ok,
  .hotel-missing { border: 1.6px solid #06413d; padding: 8px 10px; font-weight: 950; cursor: pointer; }
  .hotel-ok { background: #e2f7e8; color: #166534; border-color: #166534; }
  .hotel-missing { background: #fde8e6; color: #a23128; border-color: #a23128; }

  .planner-day-metrics { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
  .planner-day-metrics span { background: #fff4d4; border: 1px solid #d3b97c; padding: 7px 9px; color: #06413d; font-weight: 950; font-size: 12px; }
  .planner-day-metrics .over { background: #fde8e6; color: #a23128; border-color: #a23128; }

  .planner-empty-day {
    border: 1.6px dashed #d3b97c;
    background: rgba(255, 250, 240, 0.7);
    padding: 22px;
    text-align: center;
  }
  .planner-place-list { display: grid; gap: 12px; }
  .planner-transit-pill { margin: 4px 0 8px 58px; color: #0f766e; font-weight: 950; font-size: 12px; }
  .planner-planned-place,
  .planner-saved-card {
    display: grid;
    grid-template-columns: 76px 1fr auto;
    gap: 12px;
    align-items: center;
    background: #fffaf0;
    border: 1.6px solid #d3b97c;
    padding: 10px;
  }
  .planner-planned-place img,
  .planner-saved-card img { width: 76px; height: 64px; object-fit: cover; }
  .planner-planned-place h4,
  .planner-saved-card h3 { margin: 0 0 4px; color: #06413d; }
  .planner-planned-place p,
  .planner-saved-card p { margin: 0 0 4px; color: #52625e; font-weight: 760; }
  .planner-planned-place small { color: #a23128; font-weight: 950; }
  .planner-place-actions { display: flex; flex-direction: column; gap: 4px; }
  .planner-place-actions button,
  .planner-quick-days button { border: 1px solid #06413d; background: #fffdf5; color: #06413d; font-weight: 950; cursor: pointer; }

  .planner-hotel-alert,
  .planner-hotel-selected {
    margin: 14px 0;
    padding: 13px;
    border: 1.6px solid #a23128;
    background: #fde8e6;
  }
  .planner-hotel-alert strong { color: #a23128; }
  .planner-hotel-alert a { display: inline-block; margin-top: 6px; }
  .planner-hotel-selected { background: #e7f7ec; border-color: #166534; color: #166534; font-weight: 950; }

  .planner-saved-list { display: grid; gap: 12px; }
  .planner-saved-card { grid-template-columns: 68px 1fr; cursor: grab; }
  .planner-saved-card img { width: 68px; height: 58px; }
  .planner-quick-days { margin-top: 7px; }
  .planner-popular-box { display: grid; gap: 9px; }
  .planner-popular-box strong { color: #06413d; }
  .planner-popular-box button,
  .planner-popular-box a { text-align: left; background: #fffaf0; color: #06413d; box-shadow: none; }

  .planner-guide-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: grid;
    place-items: center;
    background: rgba(4, 28, 26, 0.68);
    padding: 20px;
  }
  .planner-guide-card { width: min(620px, 100%); padding: 28px; position: relative; }
  .planner-guide-card h2 { margin: 22px 0 12px; color: #06413d; font-family: Georgia, "Times New Roman", serif; font-size: 34px; }
  .planner-guide-close { position: absolute; top: 12px; right: 14px; width: 38px; height: 38px; font-size: 24px; cursor: pointer; }
  .planner-guide-dots { display: flex; gap: 8px; margin: 22px 0; }
  .planner-guide-dots button { width: 34px; height: 34px; border: 1.8px solid #06413d; background: #fffaf0; color: #06413d; font-weight: 950; cursor: pointer; }
  .planner-guide-dots button.active { background: #06413d; color: white; }
  .planner-guide-actions button:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 1120px) {
    .planner-workspace { grid-template-columns: 1fr; }
    .planner-setup-card,
    .planner-saved-rail { position: static; }
  }

  @media (max-width: 880px) {
    .planner-hero,
    .planner-flow-row { grid-template-columns: 1fr; }
    .planner-summary-card { flex-direction: column; align-items: flex-start; }
  }

  @media (max-width: 620px) {
    .planner-hero { padding-top: 36px; }
    .planner-hero-actions,
    .planner-board-actions { align-items: stretch; }
    .planner-hero-actions a,
    .planner-hero-actions button,
    .planner-board-actions button { width: 100%; text-align: center; }
    .planner-planned-place { grid-template-columns: 58px 1fr; }
    .planner-planned-place img { width: 58px; height: 52px; }
    .planner-place-actions { grid-column: 1 / -1; flex-direction: row; }
  }
`;

export default TripPlannerPage;
