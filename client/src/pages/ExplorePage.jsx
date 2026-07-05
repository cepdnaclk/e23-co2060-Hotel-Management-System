import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  exploreCategories,
  explorePlaces,
  formatLkr,
  sriLankaRegions,
} from "../data/exploreData";
import PlaceDetailModal from "../components/PlaceDetailModal";

const SAVED_PLACES_KEY = "tourismhub_trip_places";

const getSavedPlaces = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_PLACES_KEY) || "[]") || [];
  } catch {
    return [];
  }
};

const monthNames = [
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

const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Monsoon Compass geometry helpers
const polarToCartesian = (cx, cy, r, angleDeg) => {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
};

const describeArc = (cx, cy, r, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

// West & South coast: Dec(11) - Mar(2) -> 4 months starting at Dec
const WEST_SOUTH_ARC = describeArc(110, 110, 88, 330, 450);
// East coast: May(4) - Sep(8) -> 5 months starting at May
const EAST_ARC = describeArc(110, 110, 88, 120, 270);

function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPlaceIdFromQuery = searchParams.get("place");
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [sortBy, setSortBy] = useState("default");
  const [savedPlaces, setSavedPlaces] = useState(getSavedPlaces);
  const [notice, setNotice] = useState("");
  const [showTray, setShowTray] = useState(false);
  const [activeMapPlace, setActiveMapPlace] = useState(null);
  
  // Detail Modal State
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (!selectedPlaceIdFromQuery) {
      return;
    }

    const matchedPlace = explorePlaces.find(
      (place) => String(place.id) === String(selectedPlaceIdFromQuery)
    );

    if (matchedPlace) {
      setSearchText("");
      setSelectedCategory("all");
      setSelectedRegion("All Regions");
      setSelectedPlace(matchedPlace);
      setIsModalOpen(true);
    }
  }, [selectedPlaceIdFromQuery]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3800);
    return () => clearTimeout(timer);
  }, [notice]);

  const currentMonthIdx = useMemo(() => new Date().getMonth(), []);
  const currentMonthName = monthNames[currentMonthIdx];
  const markerAngle = currentMonthIdx * 30 + 15;
  const markerPoint = polarToCartesian(110, 110, 88, markerAngle);
  const labelPoint = polarToCartesian(110, 110, 68, markerAngle);

  const seasonalPlaces = useMemo(() => {
    return explorePlaces
      .filter((place) => place.bestMonths?.includes(currentMonthIdx))
      .slice(0, 3);
  }, [currentMonthIdx]);

  const featuredPlaces = useMemo(() => {
    return explorePlaces.filter((place) => place.featured).slice(0, 4);
  }, []);

  const filteredPlaces = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    const result = explorePlaces.filter((place) => {
      const categoryMatches =
        selectedCategory === "all" || place.category === selectedCategory;
      const regionMatches =
        selectedRegion === "All Regions" || place.region === selectedRegion;
      const searchMatches =
        !query ||
        place.name.toLowerCase().includes(query) ||
        place.city.toLowerCase().includes(query) ||
        place.district.toLowerCase().includes(query) ||
        place.region.toLowerCase().includes(query) ||
        place.tags.some((tag) => tag.toLowerCase().includes(query));

      return categoryMatches && regionMatches && searchMatches;
    });

    if (sortBy === "priceLow") {
      return [...result].sort((a, b) => a.budgetScore - b.budgetScore);
    }

    if (sortBy === "priceHigh") {
      return [...result].sort((a, b) => b.budgetScore - a.budgetScore);
    }

    if (sortBy === "name") {
      return [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [searchText, selectedCategory, selectedRegion, sortBy]);

  const isPlaceSaved = (placeId) => savedPlaces.some((item) => item.id === placeId);

  const addToTrip = (place) => {
    const currentSavedPlaces = getSavedPlaces();
    const alreadySaved = currentSavedPlaces.some((item) => item.id === place.id);

    if (alreadySaved) {
      setNotice(`${place.name} is already in your trip planner.`);
      setShowTray(true);
      return;
    }

    const updatedSavedPlaces = [...currentSavedPlaces, place];
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updatedSavedPlaces));
    setSavedPlaces(updatedSavedPlaces);
    setNotice(`${place.name} added to your trip plan.`);
    setShowTray(true);
  };

  const removeFromTrip = (placeId, event) => {
    if (event) event.stopPropagation();
    const updated = getSavedPlaces().filter((item) => item.id !== placeId);
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updated));
    setSavedPlaces(updated);
  };

  const clearFilters = () => {
    setSearchText("");
    setSelectedCategory("all");
    setSelectedRegion("All Regions");
    setSortBy("default");
  };

  const openPlaceDetail = (place) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("place", String(place.id));
    setSearchParams(nextParams);
    setSelectedPlace(place);
    setIsModalOpen(true);
  };

  const closePlaceDetail = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("place");
    setSearchParams(nextParams, { replace: true });
    setIsModalOpen(false);
    setSelectedPlace(null);
  };

  return (
    <main className="explore-page" id="explore-top">
      <style>{exploreCss}</style>

      {/* Place Detail Modal */}
      <PlaceDetailModal
        place={selectedPlace}
        isOpen={isModalOpen}
        onClose={closePlaceDetail}
        onAddToTrip={addToTrip}
        isSaved={selectedPlace ? isPlaceSaved(selectedPlace.id) : false}
        onRemoveFromTrip={removeFromTrip}
      />

      <div className={`floating-tray ${showTray ? "open" : ""}`}>
        <div className="tray-header">
          <h3>Trip Plan Preview ({savedPlaces.length})</h3>
          <button type="button" onClick={() => setShowTray(false)} className="close-tray-btn">
            ×
          </button>
        </div>

        <div className="tray-content">
          {savedPlaces.length === 0 ? (
            <p className="empty-tray-text">No places added yet. Tap "Add to trip" on a destination stamp below.</p>
          ) : (
            <div className="tray-list">
              {savedPlaces.map((place) => (
                <div key={place.id} className="tray-item">
                  <img src={place.image} alt={place.name} />
                  <div className="tray-item-info">
                    <h4>{place.name}</h4>
                    <span>{place.city} • {formatLkr(place.estimatedCost)}</span>
                  </div>
                  <button type="button" onClick={(event) => removeFromTrip(place.id, event)} className="tray-remove-btn">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {savedPlaces.length > 0 && (
          <div className="tray-footer">
            <Link to="/trip-planner" className="btn-main display-block">
              Build day-by-day itinerary →
            </Link>
          </div>
        )}
      </div>

      <button type="button" className="tray-trigger-badge" onClick={() => setShowTray(!showTray)}>
        <span className="tray-count">{savedPlaces.length}</span> Saved
      </button>

      <section className="explore-hero">
        <div className="hero-ornament" aria-hidden="true">
          <svg viewBox="0 0 200 40" preserveAspectRatio="none">
            <path d="M0 20 Q 25 0 50 20 T 100 20 T 150 20 T 200 20" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="explore-hero-content">
          <span className="explore-pill">Ayubowan — Explore Sri Lanka</span>
          <h1>One island. Eight worlds worth wandering into.</h1>
          <p>
            Search real places across the Cultural Triangle, Hill Country, and both coasts.
            Save what calls to you, then turn it into a day-by-day route.
          </p>

          <div className="explore-search-card">
            <div>
              <label>Search places</label>
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Sigiriya, Ella, Mirissa, safari, food..."
              />
            </div>

            <div>
              <label>Region</label>
              <select value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}>
                {sriLankaRegions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <button type="button" onClick={clearFilters} className="reset-filter-btn">Reset</button>
          </div>

          <div className="hero-chip-row">
            <a href="#compass" className="ghost-link">See the Monsoon Compass ↓</a>
            <a href="#destinations" className="ghost-link">Jump to destinations ↓</a>
          </div>
        </div>

        <div className="explore-hero-grid">
          {featuredPlaces.map((place, index) => (
            <article 
              className={`hero-stamp hero-stamp-${index + 1}`} 
              key={place.id}
              onClick={() => openPlaceDetail(place)}
              style={{ cursor: 'pointer' }}
            >
              <img src={place.image} alt={place.name} />
              <div className="hero-stamp-caption">
                <strong>{place.name}</strong>
                <span>{place.region}</span>
              </div>
              <div className="stamp-view-more">Click to view details</div>
            </article>
          ))}
        </div>
      </section>

      {notice && (
        <div className="trip-notice">
          <span>{notice}</span>
          <Link to="/trip-planner">Open itinerary builder →</Link>
        </div>
      )}

      <section className="explore-section compass-section" id="compass">
        <div className="section-heading">
          <span className="explore-pill dynamic-pill">Currently {currentMonthName}</span>
          <h2>The Monsoon Compass</h2>
          <p className="subtext-muted">
            Sri Lanka has two coasts and two monsoons. This is the general rule tourists use to pick a coast —
            always double-check the local forecast before you travel.
          </p>
        </div>

        <div className="compass-layout">
          <div className="compass-wrap">
            <svg viewBox="0 0 220 220" className="compass-svg" role="img" aria-label={`Monsoon compass, current month ${currentMonthName}`}>
              <circle cx="110" cy="110" r="88" className="compass-ring" />
              <path d={WEST_SOUTH_ARC} className="compass-arc compass-arc-west" />
              <path d={EAST_ARC} className="compass-arc compass-arc-east" />

              {monthShort.map((label, index) => {
                const tickAngle = index * 30;
                const tickPoint = polarToCartesian(110, 110, 100, tickAngle);
                const dotPoint = polarToCartesian(110, 110, 88, tickAngle);
                return (
                  <g key={label}>
                    <circle cx={dotPoint.x} cy={dotPoint.y} r={index === currentMonthIdx ? 3.4 : 2} className="compass-tick" />
                    <text x={tickPoint.x} y={tickPoint.y} className="compass-month-label" textAnchor="middle" dominantBaseline="middle">
                      {label}
                    </text>
                  </g>
                );
              })}

              <line x1="110" y1="110" x2={markerPoint.x} y2={markerPoint.y} className="compass-needle" />
              <circle cx="110" cy="110" r="5" className="compass-hub" />
              <circle cx={labelPoint.x} cy={labelPoint.y} r="14" className="compass-you-badge" />
              <text x={labelPoint.x} y={labelPoint.y + 1} className="compass-you-text" textAnchor="middle" dominantBaseline="middle">now</text>
            </svg>

            <div className="compass-legend">
              <div><i className="legend-dot legend-west" /> West &amp; South coast — best Dec to Mar</div>
              <div><i className="legend-dot legend-east" /> East coast — best May to Sept</div>
            </div>
          </div>

          <div className="compass-side">
            <h3>Good picks for {currentMonthName}</h3>
            {seasonalPlaces.length === 0 ? (
              <p className="subtext-muted">No seasonal picks stored for this month yet.</p>
            ) : (
              <div className="seasonal-list">
                {seasonalPlaces.map((place) => (
                  <button 
                    key={place.id} 
                    className="seasonal-row" 
                    type="button" 
                    onClick={() => openPlaceDetail(place)}
                  >
                    <img src={place.image} alt={place.name} />
                    <div>
                      <strong>{place.name}</strong>
                      <span>{place.region}</span>
                    </div>
                    <em>view details →</em>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="explore-stats">
        <div>
          <strong>{explorePlaces.length}+</strong>
          <span>Curated places</span>
        </div>
        <div>
          <strong>{exploreCategories.length - 1}</strong>
          <span>Travel categories</span>
        </div>
        <div>
          <strong>{savedPlaces.length}</strong>
          <span>Saved to trip</span>
        </div>
        <Link to="/hotels" className="stat-card-link-wrapper">
          <div>
            <strong className="clickable-stat-title">Hotels</strong>
            <span>Connected by city</span>
          </div>
        </Link>
      </section>

      <section className="explore-section">
        <div className="section-heading">
          <span className="explore-pill">Travel categories</span>
          <h2>Choose your Sri Lankan travel style</h2>
        </div>

        <div className="category-row">
          {exploreCategories.map((category) => (
            <button
              type="button"
              className={selectedCategory === category.id ? "category active" : "category"}
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span>{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </section>

      <section className="explore-section" id="destinations">
        <div className="section-heading section-heading-row">
          <div>
            <span className="explore-pill">Featured destinations</span>
            <h2>Places to save, plan, and book around</h2>
          </div>

          <div className="sorting-control-wrapper">
            <label htmlFor="sorting-select" className="sort-label">Sort by</label>
            <select id="sorting-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="sorting-dropdown-select">
              <option value="default">Recommended</option>
              <option value="name">Alphabetical A-Z</option>
              <option value="priceLow">Budget: Low to High</option>
              <option value="priceHigh">Budget: High to Low</option>
            </select>
            <p className="match-counter">{filteredPlaces.length} matching locations</p>
          </div>
        </div>

        <div className="destination-grid">
          {filteredPlaces.map((place) => (
            <article className="destination-card" key={place.id}>
              <div 
                className="destination-image-wrap"
                onClick={() => openPlaceDetail(place)}
                style={{ cursor: 'pointer' }}
              >
                <img src={place.image} alt={place.name} />
                <span className="destination-postmark">{place.region}</span>
                <button
                  type="button"
                  className="coordinates-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMapPlace(activeMapPlace?.id === place.id ? null : place);
                  }}
                  title="View GPS preview"
                >
                  {place.lat}, {place.lng}
                </button>
                <div className="view-details-overlay">
                  <span>👁️ View Full Details</span>
                </div>
              </div>

              {activeMapPlace?.id === place.id && (
                <div className="inline-map-preview">
                  <div className="mock-map-canvas">
                    <p><strong>Map preview</strong></p>
                    <p>Marker: {place.name}</p>
                    <span>Latitude {place.lat} • Longitude {place.lng}</span>
                    <a 
                      href={`https://www.google.com/maps?q=${place.lat},${place.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="maps-external-link"
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </div>
              )}

              <div className="destination-body">
                <div className="destination-title-row">
                  <h3 
                    onClick={() => openPlaceDetail(place)}
                    style={{ cursor: 'pointer' }}
                    className="clickable-title"
                  >
                    {place.name}
                  </h3>
                  <span className={`budget-tag budget-${place.budget.toLowerCase()}`}>{place.budget}</span>
                </div>

                <p className="destination-location">{place.city}, {place.district} · {place.duration}</p>
                <p className="destination-text">{place.shortDescription}</p>

                <div className="tag-row">
                  {place.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                {/* Experience preview */}
                <div className="experience-preview">
                  <span className="exp-count">{place.experiences.length} things to do</span>
                  <button 
                    type="button" 
                    className="view-exp-btn"
                    onClick={() => openPlaceDetail(place)}
                  >
                    View experiences →
                  </button>
                </div>

                <div className="destination-meta">
                  <span>Best: {place.bestTime}</span>
                  <span>{formatLkr(place.estimatedCost)} est.</span>
                </div>

                <div className="destination-actions">
                  {isPlaceSaved(place.id) ? (
                    <button type="button" className="saved-btn" onClick={(event) => removeFromTrip(place.id, event)}>
                      ✓ Saved — remove
                    </button>
                  ) : (
                    <button type="button" className="add-btn" onClick={() => addToTrip(place)}>
                      ➕ Add to trip
                    </button>
                  )}

                  <button 
                    type="button" 
                    className="details-btn"
                    onClick={() => openPlaceDetail(place)}
                  >
                    View Details
                  </button>

                  <Link to={`/hotels?city=${encodeURIComponent(place.city)}`} className="hotel-btn">
                    🏨 Hotels
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="experience-strip">
        <div>
          <span className="explore-pill light-pill">Smart connection</span>
          <h2>Explore should lead to planning and booking.</h2>
          <p>
            Every destination stamp connects to two actions: add it to your day-by-day trip plan, or find hotels near it.
          </p>
        </div>
        <Link to="/trip-planner" className="btn-main">Build my trip</Link>
      </section>
    </main>
  );
}

const exploreCss = `
  @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=Work+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');

  .explore-page {
    --ceylon-teal: #0E3B3A;
    --ceylon-teal-deep: #082623;
    --parchment: #F6F0E4;
    --parchment-deep: #EFE6D3;
    --turmeric: #D79922;
    --vermillion: #A6392E;
    --jade: #3B6E52;
    --ink: #201C16;
    --ink-soft: #4B463D;

    min-height: 100vh;
    background: var(--parchment);
    color: var(--ink);
    padding-bottom: 70px;
    position: relative;
    font-family: "Work Sans", sans-serif;
  }

  .explore-page h1, .explore-page h2, .explore-page h3 { font-family: "Rozha One", serif; font-weight: 400; }
  .explore-page code, .explore-page .mono { font-family: "IBM Plex Mono", monospace; }

  .floating-tray { position: fixed; top: 0; right: -390px; width: 360px; height: 100vh; background: var(--parchment); box-shadow: -14px 0 40px rgba(14,59,58,0.25); z-index: 1000; transition: right 0.32s ease; display: flex; flex-direction: column; border-left: 3px solid var(--turmeric); }
  .floating-tray.open { right: 0; }
  .tray-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; background: var(--ceylon-teal); color: var(--parchment); }
  .tray-header h3 { margin: 0; font-size: 18px; font-family: "Rozha One", serif; }
  .close-tray-btn { background: transparent; border: none; color: var(--parchment); font-size: 26px; cursor: pointer; line-height: 1; }
  .tray-content { flex: 1; overflow-y: auto; padding: 20px; }
  .empty-tray-text { color: var(--ink-soft); font-weight: 600; text-align: center; margin-top: 40px; font-size: 14px; }
  .tray-list { display: flex; flex-direction: column; gap: 12px; }
  .tray-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: #ffffff; border: 1px solid #e4d9bf; }
  .tray-item img { width: 54px; height: 54px; object-fit: cover; }
  .tray-item-info { flex: 1; }
  .tray-item-info h4 { margin: 0; font-size: 14px; color: var(--ink); font-family: "Work Sans", sans-serif; font-weight: 700; }
  .tray-item-info span { font-size: 12px; color: var(--jade); font-weight: 700; font-family: "IBM Plex Mono", monospace; }
  .tray-remove-btn { background: transparent; border: 1px solid var(--vermillion); color: var(--vermillion); cursor: pointer; font-size: 11px; font-weight: 800; padding: 5px 8px; text-transform: uppercase; letter-spacing: 0.04em; }
  .tray-footer { padding: 20px; border-top: 1px solid #e4d9bf; }
  .display-block { display: block; text-align: center; }

  .tray-trigger-badge { position: fixed; bottom: 24px; right: 24px; background: var(--ceylon-teal); color: var(--parchment); padding: 14px 22px; font-weight: 800; cursor: pointer; z-index: 999; box-shadow: 0 12px 30px rgba(14,59,58,0.35); border: none; border-radius: 4px; letter-spacing: 0.02em; }
  .tray-count { background: var(--turmeric); color: var(--ceylon-teal-deep); padding: 2px 8px; margin-right: 6px; font-weight: 900; font-family: "IBM Plex Mono", monospace; }

  .explore-hero { max-width: 1180px; margin: 0 auto; padding: 60px 18px 30px; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 34px; align-items: center; position: relative; }
  .hero-ornament { position: absolute; top: 0; left: 18px; right: 18px; height: 30px; color: var(--turmeric); opacity: 0.55; pointer-events: none; }
  .hero-ornament svg { width: 100%; height: 100%; }

  .explore-pill { display: inline-flex; width: fit-content; background: var(--ceylon-teal); color: var(--parchment); padding: 7px 14px; font-weight: 700; font-size: 12.5px; letter-spacing: 0.04em; text-transform: uppercase; }
  .dynamic-pill { background: var(--vermillion); }
  .light-pill { background: rgba(246,240,228,0.16); color: var(--parchment); }

  .explore-hero h1 { font-size: clamp(36px, 5vw, 60px); line-height: 1.02; margin: 18px 0; max-width: 640px; color: var(--ceylon-teal); }
  .explore-hero p { color: var(--ink-soft); font-size: 17px; line-height: 1.7; font-weight: 500; max-width: 620px; }

  .explore-search-card { margin-top: 22px; background: #ffffff; border: 1px solid #e4d9bf; border-top: 3px solid var(--turmeric); padding: 16px; display: grid; grid-template-columns: 1.4fr 0.8fr auto; gap: 12px; align-items: end; }
  .explore-search-card label { display: block; font-weight: 800; color: var(--ceylon-teal); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 7px; }
  .explore-search-card input, .explore-search-card select { width: 100%; border: 1px solid #d8cba7; background: var(--parchment); padding: 12px 13px; outline: none; font-weight: 600; font-family: "Work Sans", sans-serif; color: var(--ink); }
  .reset-filter-btn { background: var(--ink); color: var(--parchment); border: none; padding: 12px 16px; font-weight: 800; cursor: pointer; }

  .hero-chip-row { display: flex; gap: 18px; margin-top: 18px; flex-wrap: wrap; }
  .ghost-link { color: var(--jade); font-weight: 700; text-decoration: none; border-bottom: 2px solid var(--jade); font-size: 14px; }

  .explore-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .hero-stamp { position: relative; overflow: hidden; min-height: 200px; border: 6px solid #ffffff; outline: 1px dashed #c9bb92; outline-offset: -12px; box-shadow: 0 18px 40px rgba(14,59,58,0.22); transition: transform 0.3s ease, box-shadow 0.3s ease; }
  .hero-stamp:hover { transform: scale(1.02); box-shadow: 0 24px 50px rgba(14,59,58,0.3); }
  .hero-stamp-1 { transform: rotate(-2deg); }
  .hero-stamp-2 { transform: rotate(1.5deg) translateY(14px); }
  .hero-stamp-3 { transform: rotate(1deg) translateY(-6px); }
  .hero-stamp-4 { transform: rotate(-1.5deg) translateY(10px); }
  .hero-stamp:hover { transform: scale(1.02) !important; }
  .hero-stamp img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hero-stamp-caption { position: absolute; inset: auto 0 0 0; background: linear-gradient(0deg, rgba(8,38,35,0.85), transparent); color: var(--parchment); padding: 10px 12px 8px; }
  .hero-stamp-caption strong { display: block; font-family: "Rozha One", serif; font-size: 16px; }
  .hero-stamp-caption span { font-size: 11px; color: #d9cba0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  .stamp-view-more { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--turmeric); color: var(--ceylon-teal-deep); padding: 10px 18px; font-weight: 800; font-size: 12px; opacity: 0; transition: opacity 0.3s ease; }
  .hero-stamp:hover .stamp-view-more { opacity: 1; }

  .trip-notice, .explore-stats, .explore-section, .experience-strip { max-width: 1180px; margin-left: auto; margin-right: auto; }
  .trip-notice { margin-top: 12px; padding: 14px 22px; border-left: 5px solid var(--jade); background: #eef3ea; color: var(--ceylon-teal-deep); display: flex; justify-content: space-between; gap: 12px; font-weight: 700; }
  .trip-notice a { color: var(--jade); text-decoration: none; border-bottom: 2px solid var(--jade); }

  .compass-section { padding: 44px 18px 20px; }
  .section-heading h2 { font-size: clamp(28px, 4vw, 40px); margin: 12px 0 0; color: var(--ceylon-teal); }
  .subtext-muted { color: var(--ink-soft); font-weight: 500; margin: 6px 0 0; font-size: 14px; max-width: 640px; }

  .compass-layout { display: grid; grid-template-columns: 320px 1fr; gap: 34px; margin-top: 26px; align-items: center; }
  .compass-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .compass-svg { width: 100%; max-width: 300px; }
  .compass-ring { fill: #ffffff; stroke: #d8cba7; stroke-width: 1.5; }
  .compass-arc { fill: none; stroke-width: 10; stroke-linecap: round; }
  .compass-arc-west { stroke: var(--turmeric); }
  .compass-arc-east { stroke: var(--vermillion); }
  .compass-tick { fill: var(--ceylon-teal); }
  .compass-month-label { font-family: "IBM Plex Mono", monospace; font-size: 8px; fill: var(--ink-soft); font-weight: 600; }
  .compass-needle { stroke: var(--ceylon-teal); stroke-width: 2; }
  .compass-hub { fill: var(--ceylon-teal); }
  .compass-you-badge { fill: var(--ceylon-teal); opacity: 0.94; }
  .compass-you-text { fill: var(--parchment); font-size: 8px; font-family: "IBM Plex Mono", monospace; font-weight: 700; }
  .compass-legend { font-size: 13px; font-weight: 600; color: var(--ink-soft); display: flex; flex-direction: column; gap: 6px; }
  .legend-dot { display: inline-block; width: 10px; height: 10px; margin-right: 8px; border-radius: 50%; }
  .legend-west { background: var(--turmeric); }
  .legend-east { background: var(--vermillion); }

  .compass-side h3 { font-size: 22px; color: var(--ceylon-teal); margin: 0 0 14px; }
  .seasonal-list { display: flex; flex-direction: column; gap: 10px; }
  .seasonal-row { display: grid; grid-template-columns: 56px 1fr auto; gap: 12px; align-items: center; background: #ffffff; border: 1px solid #e4d9bf; padding: 10px; cursor: pointer; text-align: left; transition: all 0.2s ease; }
  .seasonal-row:hover { border-color: var(--turmeric); background: #fdfcf8; }
  .seasonal-row img { width: 56px; height: 56px; object-fit: cover; }
  .seasonal-row strong { display: block; font-family: "Work Sans", sans-serif; font-weight: 700; color: var(--ink); font-size: 14px; }
  .seasonal-row span { font-size: 12px; color: var(--jade); font-weight: 700; }
  .seasonal-row em { font-style: normal; color: var(--vermillion); font-weight: 700; font-size: 12px; }

  .explore-stats { padding: 30px 18px 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border-top: 1px dashed #c9bb92; border-bottom: 1px dashed #c9bb92; }
  .explore-stats div { padding: 22px 14px; text-align: center; border-right: 1px dashed #c9bb92; }
  .explore-stats div:last-child, .stat-card-link-wrapper div { border-right: none; }
  .stat-card-link-wrapper { text-decoration: none; }
  .clickable-stat-title { color: var(--vermillion) !important; }
  .explore-stats strong { display: block; color: var(--ceylon-teal); font-size: 30px; font-family: "IBM Plex Mono", monospace; font-weight: 600; }
  .explore-stats span { font-weight: 700; color: var(--ink-soft); font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; }

  .explore-section { padding: 46px 18px 10px; }
  .section-heading { margin-bottom: 22px; }
  .section-heading-row { display: flex; justify-content: space-between; align-items: end; gap: 20px; }

  .category-row { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; }
  .category { flex: 0 0 auto; border: 1px solid var(--ceylon-teal); background: #ffffff; color: var(--ceylon-teal); padding: 11px 16px 11px 12px; font-weight: 700; cursor: pointer; clip-path: polygon(0 0, 100% 0, 100% 100%, 10px 100%, 0 70%); font-size: 14px; }
  .category span { margin-right: 8px; }
  .category.active { background: var(--ceylon-teal); color: var(--parchment); }

  .sorting-control-wrapper { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .sort-label { font-weight: 800; font-size: 12px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.04em; }
  .sorting-dropdown-select { padding: 8px 14px; border: 1px solid var(--ceylon-teal); background: #ffffff; font-weight: 700; color: var(--ceylon-teal); outline: none; cursor: pointer; }
  .match-counter { font-weight: 700; color: var(--vermillion); margin: 2px 0 0; font-size: 13px; font-family: "IBM Plex Mono", monospace; }

  .destination-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
  .destination-card { background: #ffffff; border: 2px dashed #c9bb92; position: relative; display: flex; flex-direction: column; transition: all 0.3s ease; }
  .destination-card:hover { border-color: var(--turmeric); box-shadow: 0 12px 35px rgba(14,59,58,0.15); }
  .destination-image-wrap { height: 210px; position: relative; overflow: hidden; background: #e4d9bf; margin: 10px 10px 0; }
  .destination-image-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s ease; }
  .destination-card:hover .destination-image-wrap img { transform: scale(1.05); }
  .destination-postmark { position: absolute; top: 10px; left: 10px; background: var(--parchment); border: 2px solid var(--ceylon-teal); color: var(--ceylon-teal); padding: 6px 10px; font-weight: 800; font-size: 11px; transform: rotate(-4deg); text-transform: uppercase; letter-spacing: 0.03em; }
  .coordinates-badge { position: absolute; bottom: 10px; right: 10px; background: var(--ceylon-teal-deep); color: var(--parchment); border: none; padding: 5px 10px; font-size: 10.5px; font-weight: 700; cursor: pointer; font-family: "IBM Plex Mono", monospace; }
  
  .view-details-overlay { position: absolute; inset: 0; background: rgba(14,59,58,0.7); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; }
  .view-details-overlay span { background: var(--turmeric); color: var(--ceylon-teal-deep); padding: 12px 20px; font-weight: 800; font-size: 13px; }
  .destination-image-wrap:hover .view-details-overlay { opacity: 1; }
  
  .inline-map-preview { margin: 0 10px; background: var(--parchment); border-bottom: 2px solid #e4d9bf; padding: 12px; }
  .mock-map-canvas { background: #ffffff; border: 1px dashed #c9bb92; padding: 15px; text-align: center; color: var(--ink-soft); font-size: 12px; }
  .maps-external-link { display: inline-block; margin-top: 10px; color: var(--jade); font-weight: 700; text-decoration: none; border-bottom: 2px solid var(--jade); }

  .destination-body { padding: 16px; flex-grow: 1; display: flex; flex-direction: column; }
  .destination-title-row { display: flex; justify-content: space-between; align-items: start; gap: 12px; }
  .destination-title-row h3 { margin: 0; font-size: 21px; color: var(--ceylon-teal); }
  .clickable-title { transition: color 0.2s ease; }
  .clickable-title:hover { color: var(--turmeric); }
  .budget-tag { padding: 5px 9px; font-size: 10.5px; font-weight: 800; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.03em; }
  .budget-low { background: #e3ede4; color: var(--jade); }
  .budget-medium { background: #f6e6c4; color: #8a5d10; }
  .budget-high { background: #f1dcd8; color: var(--vermillion); }
  .destination-location { margin: 8px 0; color: var(--jade); font-weight: 700; font-size: 13.5px; }
  .destination-text { color: var(--ink-soft); line-height: 1.6; font-weight: 500; font-size: 14.5px; flex-grow: 1; }
  .tag-row { display: flex; gap: 6px; flex-wrap: wrap; margin: 12px 0; }
  .tag-row span { background: var(--parchment); color: var(--ink-soft); padding: 5px 9px; font-size: 11.5px; font-weight: 700; border: 1px solid #e4d9bf; }
  
  .experience-preview { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: linear-gradient(135deg, #f0f9f4, #fef9e7); border: 1px solid #d4e8d9; margin-bottom: 12px; }
  .exp-count { font-weight: 800; color: var(--jade); font-size: 12px; }
  .view-exp-btn { background: none; border: none; color: var(--vermillion); font-weight: 700; font-size: 12px; cursor: pointer; padding: 0; }
  .view-exp-btn:hover { text-decoration: underline; }
  
  .destination-meta { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; color: var(--ink-soft); font-weight: 700; margin-bottom: 14px; font-size: 12.5px; font-family: "IBM Plex Mono", monospace; }

  .destination-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .btn-main, .hotel-btn, .add-btn, .saved-btn, .details-btn { border: none; padding: 11px 14px; font-weight: 800; cursor: pointer; text-decoration: none; font-size: 12px; }
  .btn-main, .add-btn { background: var(--turmeric); color: var(--ceylon-teal-deep); }
  .details-btn { background: var(--ceylon-teal); color: var(--parchment); }
  .hotel-btn { background: transparent; color: var(--ceylon-teal); border: 1px solid var(--ceylon-teal); }
  .saved-btn { background: #f1dcd8; color: var(--vermillion); border: 1px dashed var(--vermillion); }

  .experience-strip { margin-top: 44px; padding: 36px; background: var(--ceylon-teal); color: var(--parchment); display: flex; justify-content: space-between; align-items: center; gap: 22px; }
  .experience-strip h2 { margin: 14px 0 10px; font-size: 32px; }
  .experience-strip p { margin: 0; max-width: 640px; color: #d7e6df; line-height: 1.7; font-weight: 500; }

  @media (max-width: 1100px) {
    .destination-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 950px) {
    .explore-hero, .destination-grid, .explore-stats, .explore-search-card, .compass-layout { grid-template-columns: 1fr; }
    .hero-stamp { transform: none !important; }
    .experience-strip, .section-heading-row, .trip-notice { flex-direction: column; align-items: stretch; }
    .sorting-control-wrapper { align-items: flex-start; }
    .floating-tray { width: 100%; right: -100%; }
    .explore-stats div { border-right: none; border-bottom: 1px dashed #c9bb92; }
  }
  
  @media (max-width: 640px) {
    .explore-hero { padding-top: 44px; }
    .explore-hero-grid { grid-template-columns: 1fr 1fr; }
    .destination-grid { grid-template-columns: 1fr; }
  }
`;

export default ExplorePage;
