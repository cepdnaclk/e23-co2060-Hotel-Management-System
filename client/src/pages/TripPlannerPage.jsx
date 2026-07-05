import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import { useAuth } from "../context/AuthContext";
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

const loadJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

const createDays = (startDate, daysCount) => {
  return Array.from({ length: Number(daysCount) || 1 }, (_, index) => ({
    dayNumber: index + 1,
    date: addDays(startDate, index),
    places: [],
    hotelBooked: false,
  }));
};

const normalizeDays = (days, startDate, daysCount) => {
  const baseDays = Array.isArray(days) && days.length > 0 ? days : createDays(startDate, daysCount);
  return baseDays.map((day, index) => ({
    dayNumber: day.dayNumber || index + 1,
    date: day.date || addDays(startDate, index),
    places: Array.isArray(day.places) ? day.places : [],
    hotelBooked: Boolean(day.hotelBooked),
  }));
};

const calculateDayCost = (day) => {
  return day.places.reduce((total, place) => total + Number(place.estimatedCost || 0), 0);
};

const calculateTransitMinutes = (day) => {
  return day.places.reduce((total, place, index) => {
    if (index === 0) return total;
    const previous = day.places[index - 1];
    const estimate = getTravelTime(previous.city, place.city);
    return total + Number(estimate?.minutes || 0);
  }, 0);
};

const formatDuration = (minutes) => {
  if (!minutes) return "0m";
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours && remaining) return `${hours}h ${remaining}m`;
  if (hours) return `${hours}h`;
  return `${remaining}m`;
};

function TripPlannerPage() {
  const { isLoggedIn, user } = useAuth() || {};
  const existingPlan = loadJson(TRIP_PLAN_KEY, null);

  const [tripName, setTripName] = useState(existingPlan?.tripName || "Sri Lanka Holiday Plan");
  const [startDate, setStartDate] = useState(existingPlan?.startDate || todayInputValue());
  const [daysCount, setDaysCount] = useState(existingPlan?.daysCount || 3);
  const [travelStyle, setTravelStyle] = useState(existingPlan?.travelStyle || "Culture");
  const [budgetLevel, setBudgetLevel] = useState(existingPlan?.budgetLevel || "Medium");
  const [days, setDays] = useState(() => normalizeDays(existingPlan?.days, existingPlan?.startDate || todayInputValue(), existingPlan?.daysCount || 3));
  const [savedPlaces, setSavedPlaces] = useState(loadJson(SAVED_PLACES_KEY, []));
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);
  const [message, setMessage] = useState("");
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    localStorage.setItem(
      TRIP_PLAN_KEY,
      JSON.stringify({ tripName, startDate, daysCount, travelStyle, budgetLevel, days })
    );
  }, [tripName, startDate, daysCount, travelStyle, budgetLevel, days]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);

  const allTripPlaces = useMemo(() => days.flatMap((day) => day.places), [days]);
  const totalBudget = useMemo(() => allTripPlaces.reduce((total, place) => total + Number(place.estimatedCost || 0), 0), [allTripPlaces]);
  const totalTransitMinutes = useMemo(() => days.reduce((total, day) => total + calculateTransitMinutes(day), 0), [days]);

  const suggestedPlaces = useMemo(() => {
    const savedIds = savedPlaces.map((place) => place.id);
    const tripIds = allTripPlaces.map((place) => place.id);
    return explorePlaces
      .filter((place) => !savedIds.includes(place.id) && !tripIds.includes(place.id))
      .filter((place) => place.vibe === travelStyle || place.budget === budgetLevel)
      .slice(0, 6);
  }, [savedPlaces, travelStyle, budgetLevel, allTripPlaces]);

  const routeCities = useMemo(() => {
    return allTripPlaces.map((place) => place.city).filter(Boolean);
  }, [allTripPlaces]);

  const regenerateDays = () => {
    const oldPlaces = days.flatMap((day) => day.places);
    const newDays = createDays(startDate, daysCount);

    oldPlaces.forEach((place, index) => {
      const targetIndex = Math.min(index, newDays.length - 1);
      newDays[targetIndex].places.push(place);
    });

    setDays(newDays);
    setSelectedDay(1);
    setMessage("Trip days updated successfully.");
  };

  const saveExplorePlace = (place) => {
    const currentSavedPlaces = loadJson(SAVED_PLACES_KEY, []);
    const alreadySaved = currentSavedPlaces.some((savedPlace) => savedPlace.id === place.id);

    if (alreadySaved) {
      setMessage(`${place.name} is already saved.`);
      return;
    }

    const updatedSavedPlaces = [...currentSavedPlaces, place];
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updatedSavedPlaces));
    setSavedPlaces(updatedSavedPlaces);
    setMessage(`${place.name} saved to your trip list.`);
  };

  const removeSavedPlace = (placeId) => {
    const updatedSavedPlaces = savedPlaces.filter((place) => place.id !== placeId);
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updatedSavedPlaces));
    setSavedPlaces(updatedSavedPlaces);
  };

  const addPlaceToDay = (placeId = selectedPlaceId, dayNumber = selectedDay) => {
    const place = getPlaceById(placeId) || savedPlaces.find((item) => String(item.id) === String(placeId));

    if (!place) {
      setMessage("Please select a place first.");
      return;
    }

    setDays((currentDays) =>
      currentDays.map((day) => {
        if (Number(day.dayNumber) !== Number(dayNumber)) return day;

        const alreadyInDay = day.places.some((item) => item.id === place.id);
        if (alreadyInDay) {
          setMessage(`${place.name} is already added to Day ${dayNumber}.`);
          return day;
        }

        setMessage(`${place.name} added to Day ${dayNumber}.`);
        return { ...day, places: [...day.places, place] };
      })
    );
  };

  const removePlaceFromDay = (dayNumber, placeId) => {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.dayNumber === dayNumber
          ? { ...day, places: day.places.filter((place) => place.id !== placeId) }
          : day
      )
    );
  };

  const movePlaceWithinDay = (dayNumber, placeIndex, direction) => {
    setDays((currentDays) =>
      currentDays.map((day) => {
        if (day.dayNumber !== dayNumber) return day;
        const newIndex = placeIndex + direction;
        if (newIndex < 0 || newIndex >= day.places.length) return day;
        const updatedPlaces = [...day.places];
        const [selectedPlace] = updatedPlaces.splice(placeIndex, 1);
        updatedPlaces.splice(newIndex, 0, selectedPlace);
        return { ...day, places: updatedPlaces };
      })
    );
  };

  const movePlaceToAnotherDay = (fromDayNumber, placeId, toDayNumber) => {
    if (Number(fromDayNumber) === Number(toDayNumber)) return;

    let movingPlace = null;
    const withoutPlace = days.map((day) => {
      if (Number(day.dayNumber) !== Number(fromDayNumber)) return day;
      movingPlace = day.places.find((place) => place.id === placeId);
      return { ...day, places: day.places.filter((place) => place.id !== placeId) };
    });

    if (!movingPlace) return;

    setDays(
      withoutPlace.map((day) => {
        if (Number(day.dayNumber) !== Number(toDayNumber)) return day;
        const alreadyExists = day.places.some((place) => place.id === movingPlace.id);
        return alreadyExists ? day : { ...day, places: [...day.places, movingPlace] };
      })
    );
  };

  const handleDragStart = (event, fromDayNumber, placeId) => {
    const payload = { fromDayNumber, placeId };
    setDraggedItem(payload);
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
  };

  const handleDropOnDay = (event, targetDayNumber) => {
    event.preventDefault();
    let payload = draggedItem;

    try {
      const raw = event.dataTransfer.getData("application/json");
      if (raw) payload = JSON.parse(raw);
    } catch {
      payload = draggedItem;
    }

    if (!payload) return;
    movePlaceToAnotherDay(Number(payload.fromDayNumber), Number(payload.placeId), Number(targetDayNumber));
    setDraggedItem(null);
    setMessage(`Moved destination to Day ${targetDayNumber}.`);
  };

  const toggleHotelBooked = (dayNumber) => {
    setDays((currentDays) =>
      currentDays.map((day) =>
        Number(day.dayNumber) === Number(dayNumber)
          ? { ...day, hotelBooked: !day.hotelBooked }
          : day
      )
    );
  };

  const clearTrip = () => {
    const confirmClear = window.confirm("Clear the current trip plan?");
    if (!confirmClear) return;

    const resetDays = createDays(todayInputValue(), 3);
    setTripName("Sri Lanka Holiday Plan");
    setStartDate(todayInputValue());
    setDaysCount(3);
    setTravelStyle("Culture");
    setBudgetLevel("Medium");
    setDays(resetDays);
    localStorage.removeItem(TRIP_PLAN_KEY);
    setMessage("Trip plan cleared.");
  };

  const saveTripPlan = () => {
    const payload = { tripName, startDate, daysCount, travelStyle, budgetLevel, days };
    localStorage.setItem(TRIP_PLAN_KEY, JSON.stringify(payload));

    if (!isLoggedIn) {
      setMessage("Trip saved in this browser. Login later to save it permanently in MySQL.");
      return;
    }

    setMessage(`Trip saved locally for ${user?.name || "your account"}. Backend POST /api/trips can be connected in Phase 2.`);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    let y = 18;

    doc.setFontSize(18);
    doc.text(tripName || "TourismHub LK Trip Plan", 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Start Date: ${startDate}`, 14, y);
    y += 7;
    doc.text(`Travel Style: ${travelStyle} | Budget: ${budgetLevel} | Est. Cost: ${formatLkr(totalBudget)}`, 14, y);
    y += 10;

    days.forEach((day) => {
      if (y > 265) {
        doc.addPage();
        y = 18;
      }

      doc.setFontSize(14);
      doc.text(`Day ${day.dayNumber} - ${day.date}`, 14, y);
      y += 8;
      doc.setFontSize(10);

      if (day.places.length === 0) {
        doc.text("No places added yet.", 18, y);
        y += 7;
      } else {
        day.places.forEach((place, index) => {
          const text = `${index + 1}. ${place.name} - ${place.city} (${place.duration})`;
          doc.text(text.slice(0, 95), 18, y);
          y += 6;

          if (index < day.places.length - 1) {
            const next = day.places[index + 1];
            const transit = getTravelTime(place.city, next.city);
            doc.text(`   Transit: ${transit.label}`, 22, y);
            y += 6;
          }
        });
      }

      doc.text(`Day cost estimate: ${formatLkr(calculateDayCost(day))}`, 18, y);
      y += 9;
    });

    doc.save(`${tripName || "tourismhub-trip-plan"}.pdf`);
  };

  return (
    <main className="trip-page">
      <style>{tripCss}</style>

      <section className="trip-hero">
        <div>
          <span className="trip-pill">Smart Trip Planner</span>
          <h1>Turn saved Sri Lankan destinations into a practical day-by-day itinerary.</h1>
          <p>
            Organize places from Explore Sri Lanka, estimate travel time and budget, then connect each travel day with nearby hotels.
          </p>
        </div>

        <div className="trip-summary-card">
          <strong>{allTripPlaces.length}</strong>
          <span>places in current plan</span>
          <small>{formatLkr(totalBudget)} estimated activity cost</small>
          <Link to="/explore">Add more from Explore</Link>
        </div>
      </section>

      {message && <div className="trip-message">{message}</div>}

      <section className="trip-layout">
        <aside className="planner-panel">
          <div className="panel-card">
            <h2>Trip Setup</h2>

            <label>Trip name</label>
            <input value={tripName} onChange={(event) => setTripName(event.target.value)} />

            <label>Start date</label>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />

            <label>Number of days</label>
            <input type="number" min="1" max="14" value={daysCount} onChange={(event) => setDaysCount(event.target.value)} />

            <label>Travel style</label>
            <select value={travelStyle} onChange={(event) => setTravelStyle(event.target.value)}>
              {travelStyles.map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>

            <label>Budget level</label>
            <select value={budgetLevel} onChange={(event) => setBudgetLevel(event.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <button type="button" className="primary-full" onClick={regenerateDays}>Generate / Update Days</button>
            <button type="button" className="secondary-full" onClick={saveTripPlan}>Save Trip Plan</button>
          </div>

          <div className="panel-card budget-panel">
            <h2>Budget & Route Summary</h2>
            <div className="summary-metric"><span>Total activity cost</span><strong>{formatLkr(totalBudget)}</strong></div>
            <div className="summary-metric"><span>Total transit time</span><strong>{formatDuration(totalTransitMinutes)}</strong></div>
            <div className="route-pills soft-route">
              {routeCities.length === 0 ? <span>No route yet</span> : routeCities.map((city, index) => <span key={`${city}-${index}`}>{index + 1}. {city}</span>)}
            </div>
          </div>

          <div className="panel-card">
            <h2>Saved Places</h2>
            <p className="muted-text">These come from the Explore page “Add to Trip” button.</p>

            {savedPlaces.length === 0 ? (
              <div className="empty-small">
                <p>No saved places yet.</p>
                <Link to="/explore">Go to Explore Sri Lanka</Link>
              </div>
            ) : (
              <>
                <label>Select place</label>
                <select value={selectedPlaceId} onChange={(event) => setSelectedPlaceId(event.target.value)}>
                  <option value="">Choose a saved place</option>
                  {savedPlaces.map((place) => (
                    <option key={place.id} value={place.id}>{place.name}</option>
                  ))}
                </select>

                <label>Add to day</label>
                <select value={selectedDay} onChange={(event) => setSelectedDay(Number(event.target.value))}>
                  {days.map((day) => (
                    <option key={day.dayNumber} value={day.dayNumber}>Day {day.dayNumber}</option>
                  ))}
                </select>

                <button type="button" className="primary-full" onClick={() => addPlaceToDay()}>Add Place to Day</button>

                <div className="saved-list">
                  {savedPlaces.map((place) => (
                    <div className="saved-item" key={place.id}>
                      <img src={place.image} alt={place.name} />
                      <div>
                        <strong>{place.name}</strong>
                        <span>{place.city} • {formatLkr(place.estimatedCost)}</span>
                      </div>
                      <button type="button" onClick={() => removeSavedPlace(place.id)}>×</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="panel-card">
            <h2>Suggested for You</h2>
            <div className="suggest-list">
              {suggestedPlaces.map((place) => (
                <button type="button" key={place.id} onClick={() => saveExplorePlace(place)}>
                  <span>{place.name}</span>
                  <small>{place.vibe} • {place.city} • {place.budget}</small>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="itinerary-area">
          <div className="itinerary-toolbar">
            <div>
              <span className="trip-pill">Day-by-day itinerary</span>
              <h2>{tripName}</h2>
            </div>

            <div className="toolbar-actions">
              <button type="button" onClick={downloadPdf}>Download PDF</button>
              <button type="button" className="danger-btn" onClick={clearTrip}>Clear Plan</button>
            </div>
          </div>

          <div className="map-preview">
            <div>
              <h3>Route preview</h3>
              <p>
                This zero-cost preview uses your saved place cities and a static travel-time matrix. It can later be replaced with Leaflet or backend routing.
              </p>
            </div>
            <div className="route-pills">
              {routeCities.length === 0 ? <span>No route yet</span> : routeCities.map((city, index) => <span key={`${city}-${index}`}>{index + 1}. {city}</span>)}
            </div>
          </div>

          <div className="day-grid">
            {days.map((day) => {
              const dayCost = calculateDayCost(day);
              const target = budgetDailyTargets[budgetLevel] || budgetDailyTargets.Medium;
              const percent = Math.min(100, Math.round((dayCost / target) * 100));
              const firstCity = day.places[0]?.city || "";

              return (
                <article
                  className="day-card"
                  key={day.dayNumber}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDropOnDay(event, day.dayNumber)}
                >
                  <div className="day-head">
                    <div>
                      <h3>Day {day.dayNumber}</h3>
                      <span>{day.date}</span>
                    </div>
                    <Link to={`/hotels?city=${encodeURIComponent(firstCity)}&check_in=${day.date}&check_out=${addDays(day.date, 1)}`}>
                      Find Hotels
                    </Link>
                  </div>

                  <div className="day-insights">
                    <div>
                      <span>Daily budget</span>
                      <strong>{formatLkr(dayCost)}</strong>
                      <div className="budget-bar"><i style={{ width: `${percent}%` }} /></div>
                    </div>
                    <div>
                      <span>Transit time</span>
                      <strong>{formatDuration(calculateTransitMinutes(day))}</strong>
                    </div>
                    <button type="button" className={day.hotelBooked ? "hotel-ok" : "hotel-missing"} onClick={() => toggleHotelBooked(day.dayNumber)}>
                      {day.hotelBooked ? "✓ Hotel selected" : "Mark hotel booked"}
                    </button>
                  </div>

                  {day.places.length > 0 && !day.hotelBooked && (
                    <div className="hotel-alert">
                      ⚠️ Accommodation Check: You are touring {firstCity} on Day {day.dayNumber}, but no hotel is linked yet.
                      <Link to={`/hotels?city=${encodeURIComponent(firstCity)}&check_in=${day.date}&check_out=${addDays(day.date, 1)}`}> View hotels near {firstCity}</Link>
                    </div>
                  )}

                  {day.places.length === 0 ? (
                    <div className="empty-day">Drop a destination here or add one from the saved places panel.</div>
                  ) : (
                    <div className="planned-list">
                      {day.places.map((place, index) => {
                        const nextPlace = day.places[index + 1];
                        const transit = nextPlace ? getTravelTime(place.city, nextPlace.city) : null;

                        return (
                          <div className="planned-block" key={place.id}>
                            <div
                              className="planned-item"
                              draggable
                              onDragStart={(event) => handleDragStart(event, day.dayNumber, place.id)}
                            >
                              <img src={place.image} alt={place.name} />
                              <div className="planned-info">
                                <strong>{index + 1}. {place.name}</strong>
                                <span>{place.city} • {place.duration} • {formatLkr(place.estimatedCost)}</span>
                                <p>{place.shortDescription}</p>

                                <div className="planned-actions">
                                  <button type="button" onClick={() => movePlaceWithinDay(day.dayNumber, index, -1)}>↑</button>
                                  <button type="button" onClick={() => movePlaceWithinDay(day.dayNumber, index, 1)}>↓</button>
                                  <select value={day.dayNumber} onChange={(event) => movePlaceToAnotherDay(day.dayNumber, place.id, Number(event.target.value))}>
                                    {days.map((optionDay) => (
                                      <option key={optionDay.dayNumber} value={optionDay.dayNumber}>Move to Day {optionDay.dayNumber}</option>
                                    ))}
                                  </select>
                                  <Link to={`/hotels?city=${encodeURIComponent(place.city)}&check_in=${day.date}&check_out=${addDays(day.date, 1)}`}>
                                    Hotels
                                  </Link>
                                  <button type="button" className="remove-btn" onClick={() => removePlaceFromDay(day.dayNumber, place.id)}>Remove</button>
                                </div>
                              </div>
                            </div>

                            {transit && (
                              <div className="transit-connector">
                                <span>↓</span>
                                <strong>{transit.label}</strong>
                                <em>{transit.mode}</em>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

const tripCss = `
  .trip-page { min-height: 100vh; background: linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #eff6ff 100%); color: #0f172a; padding-bottom: 70px; }
  .trip-hero, .trip-layout { max-width: 1180px; margin: 0 auto; padding-left: 18px; padding-right: 18px; }
  .trip-hero { padding-top: 58px; display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: stretch; }
  .trip-pill { display: inline-flex; width: fit-content; background: #ccfbf1; color: #0f766e; padding: 8px 14px; border-radius: 999px; font-weight: 900; font-size: 13px; }
  .trip-hero h1 { max-width: 820px; font-size: clamp(36px, 5vw, 58px); line-height: 1; letter-spacing: -1.6px; margin: 16px 0; }
  .trip-hero p { color: #475569; font-size: 17px; line-height: 1.7; font-weight: 700; max-width: 760px; }
  .trip-summary-card, .panel-card, .day-card, .map-preview { background: white; border: 1px solid #d1fae5; border-radius: 28px; box-shadow: 0 18px 45px rgba(15,23,42,0.08); }
  .trip-summary-card { padding: 24px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
  .trip-summary-card strong { font-size: 48px; color: #0f766e; }
  .trip-summary-card span, .trip-summary-card small { color: #64748b; font-weight: 900; }
  .trip-summary-card a { color: #0f766e; font-weight: 900; text-decoration: underline; }
  .trip-message { max-width: 1180px; margin: 18px auto 0; padding: 13px 18px; border-radius: 18px; background: #ecfdf5; color: #065f46; border: 1px solid #99f6e4; font-weight: 900; }
  .trip-layout { display: grid; grid-template-columns: 350px 1fr; gap: 22px; padding-top: 26px; }
  .planner-panel { display: flex; flex-direction: column; gap: 18px; }
  .panel-card { padding: 20px; }
  .panel-card h2 { margin: 0 0 14px; }
  .panel-card label { display: block; font-size: 13px; font-weight: 900; color: #334155; margin: 13px 0 7px; }
  .panel-card input, .panel-card select { width: 100%; border: 1px solid #bae6fd; background: #f8fafc; border-radius: 15px; padding: 12px 13px; font-weight: 800; outline: none; }
  .primary-full, .secondary-full { width: 100%; border: none; border-radius: 999px; padding: 13px 16px; margin-top: 15px; font-weight: 900; cursor: pointer; }
  .primary-full { background: linear-gradient(135deg, #0f766e, #14b8a6); color: white; box-shadow: 0 14px 30px rgba(15,118,110,0.2); }
  .secondary-full { background: #f8fafc; color: #0f766e; border: 1px solid #99f6e4; }
  .budget-panel { background: linear-gradient(135deg, #ffffff, #f0fdfa); }
  .summary-metric { display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
  .summary-metric span { color: #64748b; font-weight: 800; }
  .summary-metric strong { color: #0f766e; }
  .muted-text { color: #64748b; line-height: 1.5; font-weight: 700; }
  .empty-small { background: #f8fafc; border-radius: 18px; padding: 14px; color: #64748b; font-weight: 800; }
  .empty-small a { color: #0f766e; font-weight: 900; }
  .saved-list, .suggest-list, .planned-list { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
  .saved-item { display: grid; grid-template-columns: 56px 1fr auto; gap: 10px; align-items: center; padding: 8px; border-radius: 18px; background: #f8fafc; }
  .saved-item img { width: 56px; height: 48px; object-fit: cover; border-radius: 14px; }
  .saved-item strong, .saved-item span { display: block; }
  .saved-item span { color: #64748b; font-size: 12px; font-weight: 800; }
  .saved-item button { border: none; width: 28px; height: 28px; border-radius: 50%; background: #fee2e2; color: #991b1b; font-weight: 900; cursor: pointer; }
  .suggest-list button { border: 1px solid #e2e8f0; border-radius: 16px; background: #f8fafc; padding: 12px; text-align: left; cursor: pointer; }
  .suggest-list span, .suggest-list small { display: block; }
  .suggest-list span { font-weight: 900; color: #0f172a; }
  .suggest-list small { margin-top: 4px; color: #64748b; font-weight: 800; }
  .itinerary-toolbar { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
  .itinerary-toolbar h2 { margin: 12px 0 0; font-size: 34px; }
  .toolbar-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .toolbar-actions button, .day-head a, .planned-actions button, .planned-actions select, .planned-actions a { border: 1px solid #99f6e4; background: #ffffff; color: #0f766e; border-radius: 999px; padding: 10px 13px; font-weight: 900; cursor: pointer; text-decoration: none; }
  .toolbar-actions .danger-btn, .planned-actions .remove-btn { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
  .map-preview { margin-bottom: 18px; padding: 22px; background: linear-gradient(135deg, #042f2e, #0f766e); color: white; display: grid; grid-template-columns: 1fr 1.2fr; gap: 18px; }
  .map-preview h3 { margin: 0 0 8px; font-size: 26px; }
  .map-preview p { color: #ccfbf1; margin: 0; line-height: 1.6; font-weight: 700; }
  .route-pills { display: flex; gap: 8px; flex-wrap: wrap; align-content: center; }
  .route-pills span { background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 10px; border-radius: 999px; font-weight: 900; }
  .soft-route { margin-top: 12px; }
  .soft-route span { background: #ecfeff; color: #0f766e; border: 1px solid #99f6e4; }
  .day-grid { display: flex; flex-direction: column; gap: 18px; }
  .day-card { padding: 18px; border: 2px solid #d1fae5; }
  .day-card:hover { border-color: #14b8a6; }
  .day-head { display: flex; justify-content: space-between; align-items: start; gap: 14px; margin-bottom: 14px; }
  .day-head h3 { margin: 0 0 4px; font-size: 24px; }
  .day-head span { color: #64748b; font-weight: 900; }
  .day-insights { display: grid; grid-template-columns: 1fr 0.7fr auto; gap: 12px; align-items: center; background: #f8fafc; border-radius: 18px; padding: 12px; margin-bottom: 12px; }
  .day-insights span { display: block; color: #64748b; font-size: 12px; font-weight: 900; }
  .day-insights strong { color: #0f766e; }
  .budget-bar { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-top: 7px; }
  .budget-bar i { display: block; height: 100%; background: linear-gradient(135deg, #14b8a6, #0f766e); border-radius: 999px; }
  .hotel-ok, .hotel-missing { border: none; border-radius: 999px; padding: 10px 12px; font-weight: 900; cursor: pointer; }
  .hotel-ok { background: #dcfce7; color: #166534; }
  .hotel-missing { background: #fef3c7; color: #92400e; }
  .hotel-alert { padding: 12px 14px; border-radius: 16px; background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; font-weight: 800; margin-bottom: 12px; }
  .hotel-alert a { color: #0f766e; font-weight: 900; margin-left: 6px; }
  .empty-day { background: #f8fafc; color: #64748b; padding: 18px; border-radius: 18px; font-weight: 900; border: 1px dashed #cbd5e1; }
  .planned-block { display: flex; flex-direction: column; gap: 8px; }
  .planned-item { display: grid; grid-template-columns: 170px 1fr; gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 22px; padding: 12px; cursor: grab; }
  .planned-item:active { cursor: grabbing; }
  .planned-item img { width: 100%; height: 150px; object-fit: cover; border-radius: 18px; }
  .planned-info strong, .planned-info span { display: block; }
  .planned-info strong { font-size: 19px; }
  .planned-info span { color: #0f766e; font-weight: 900; margin-top: 4px; }
  .planned-info p { color: #475569; line-height: 1.5; font-weight: 700; }
  .planned-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .transit-connector { margin-left: 80px; display: flex; align-items: center; gap: 10px; color: #475569; font-weight: 900; }
  .transit-connector span { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #ccfbf1; color: #0f766e; }
  .transit-connector strong { background: #f1f5f9; padding: 8px 12px; border-radius: 999px; }
  .transit-connector em { font-style: normal; color: #0f766e; }
  @media (max-width: 980px) { .trip-hero, .trip-layout, .map-preview, .day-insights { grid-template-columns: 1fr; } .itinerary-toolbar { align-items: stretch; flex-direction: column; } }
  @media (max-width: 640px) { .planned-item { grid-template-columns: 1fr; } .transit-connector { margin-left: 0; flex-wrap: wrap; } }
`;

export default TripPlannerPage;
