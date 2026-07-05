import { useEffect, useMemo, useRef, useState } from "react";
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

const budgetOptions = ["All Budgets", "Low", "Medium", "High"];

const routeIdeas = [
  {
    title: "Cultural Triangle Route",
    days: "3-4 days",
    tone: "Heritage, temples, ancient kingdoms",
    placeNames: ["Sigiriya Rock Fortress", "Dambulla Cave Temple", "Polonnaruwa Ancient City"],
    linkCity: "Sigiriya",
  },
  {
    title: "Hill Country Slow Route",
    days: "4-5 days",
    tone: "Tea fields, train views, waterfalls",
    placeNames: ["Nine Arch Bridge", "Nuwara Eliya Tea Plantations", "Horton Plains & World's End"],
    linkCity: "Ella",
  },
  {
    title: "South Coast + Safari",
    days: "5-6 days",
    tone: "Beach, fort, whales, wildlife",
    placeNames: ["Mirissa Beach & Whale Watching", "Galle Fort", "Udawalawe National Park"],
    linkCity: "Mirissa",
  },
];

function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPlaceIdFromQuery = searchParams.get("place");
  const destinationsRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedBudget, setSelectedBudget] = useState("All Budgets");
  const [sortBy, setSortBy] = useState("recommended");
  const [savedPlaces, setSavedPlaces] = useState(getSavedPlaces);
  const [notice, setNotice] = useState("");
  const [showTray, setShowTray] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentMonthIdx = useMemo(() => new Date().getMonth(), []);
  const currentMonthName = monthNames[currentMonthIdx];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (!selectedPlaceIdFromQuery) return;

    const matchedPlace = explorePlaces.find(
      (place) => String(place.id) === String(selectedPlaceIdFromQuery)
    );

    if (matchedPlace) {
      setSelectedPlace(matchedPlace);
      setIsModalOpen(true);
    }
  }, [selectedPlaceIdFromQuery]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const featuredPlaces = useMemo(() => {
    return explorePlaces.filter((place) => place.featured).slice(0, 6);
  }, []);

  const seasonalPlaces = useMemo(() => {
    return explorePlaces
      .filter((place) => place.bestMonths?.includes(currentMonthIdx))
      .slice(0, 6);
  }, [currentMonthIdx]);

  const categoryCounts = useMemo(() => {
    return exploreCategories.reduce((acc, category) => {
      acc[category.id] =
        category.id === "all"
          ? explorePlaces.length
          : explorePlaces.filter((place) => place.category === category.id).length;
      return acc;
    }, {});
  }, []);

  const filteredPlaces = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    const result = explorePlaces.filter((place) => {
      const categoryMatches =
        selectedCategory === "all" || place.category === selectedCategory;
      const regionMatches =
        selectedRegion === "All Regions" || place.region === selectedRegion;
      const budgetMatches =
        selectedBudget === "All Budgets" || place.budget === selectedBudget;
      const searchMatches =
        !query ||
        place.name.toLowerCase().includes(query) ||
        place.city.toLowerCase().includes(query) ||
        place.district.toLowerCase().includes(query) ||
        place.region.toLowerCase().includes(query) ||
        place.vibe?.toLowerCase().includes(query) ||
        place.tags.some((tag) => tag.toLowerCase().includes(query));

      return categoryMatches && regionMatches && budgetMatches && searchMatches;
    });

    if (sortBy === "budgetLow") {
      return [...result].sort((a, b) => a.budgetScore - b.budgetScore);
    }

    if (sortBy === "budgetHigh") {
      return [...result].sort((a, b) => b.budgetScore - a.budgetScore);
    }

    if (sortBy === "name") {
      return [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortBy === "cost") {
      return [...result].sort((a, b) => a.estimatedCost - b.estimatedCost);
    }

    return result;
  }, [searchText, selectedCategory, selectedRegion, selectedBudget, sortBy]);

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
    setSelectedPlace(null);
    setIsModalOpen(false);
  };

  const isPlaceSaved = (placeId) => savedPlaces.some((item) => item.id === placeId);

  const addToTrip = (place) => {
    const currentSavedPlaces = getSavedPlaces();
    const alreadySaved = currentSavedPlaces.some((item) => item.id === place.id);

    if (alreadySaved) {
      setNotice(`${place.name} is already saved for your trip.`);
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
    setSelectedBudget("All Budgets");
    setSortBy("recommended");
  };

  const jumpToDestinations = () => {
    destinationsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setTimeout(jumpToDestinations, 60);
  };

  return (
    <main className="explore-page" id="explore-top">
      <style>{exploreCss}</style>

      <PlaceDetailModal
        place={selectedPlace}
        isOpen={isModalOpen}
        onClose={closePlaceDetail}
        onAddToTrip={addToTrip}
        isSaved={selectedPlace ? isPlaceSaved(selectedPlace.id) : false}
        onRemoveFromTrip={removeFromTrip}
      />

      <aside className={`saved-trip-drawer ${showTray ? "open" : ""}`}>
        <div className="saved-trip-head">
          <div>
            <span>Saved places</span>
            <strong>{savedPlaces.length} selected</strong>
          </div>
          <button type="button" onClick={() => setShowTray(false)} aria-label="Close saved places">
            ×
          </button>
        </div>

        <div className="saved-trip-list">
          {savedPlaces.length === 0 ? (
            <p className="empty-saved-text">
              Save destinations from Explore, then arrange them day by day in Trip Planner.
            </p>
          ) : (
            savedPlaces.map((place) => (
              <article key={place.id} className="saved-trip-item">
                <img src={place.image} alt={place.name} />
                <div>
                  <strong>{place.name}</strong>
                  <span>{place.city} • {formatLkr(place.estimatedCost)}</span>
                </div>
                <button type="button" onClick={(event) => removeFromTrip(place.id, event)}>
                  Remove
                </button>
              </article>
            ))
          )}
        </div>

        <div className="saved-trip-foot">
          <Link to="/trip-planner" className="drawer-primary-link">
            Open Trip Planner →
          </Link>
        </div>
      </aside>

      <button type="button" className="saved-floating-button" onClick={() => setShowTray(true)}>
        <span>{savedPlaces.length}</span>
        Saved
      </button>

      <section className="explore-hero-v2">
        <div className="explore-hero-copy">
          <span className="section-kicker">Explore Sri Lanka</span>
          <h1>Find the places that match your travel story.</h1>
          <p>
            Browse culture, beaches, wildlife, hill country, food, and spiritual places. Open a place story, save it, then build your route from Trip Planner.
          </p>

          <div className="explore-command-card">
            <div className="search-field-large">
              <label>Search destination or experience</label>
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Try Ella, beach, safari, food, temple..."
              />
            </div>

            <div className="command-row">
              <div>
                <label>Region</label>
                <select value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}>
                  {sriLankaRegions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Budget</label>
                <select value={selectedBudget} onChange={(event) => setSelectedBudget(event.target.value)}>
                  {budgetOptions.map((budget) => (
                    <option key={budget} value={budget}>{budget}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={jumpToDestinations} className="command-main-btn">
                Show places
              </button>
            </div>
          </div>

          <div className="hero-mini-stats">
            <div><strong>{explorePlaces.length}+</strong><span>places</span></div>
            <div><strong>{exploreCategories.length - 1}</strong><span>styles</span></div>
            <div><strong>{savedPlaces.length}</strong><span>saved</span></div>
          </div>
        </div>

        <div className="hero-story-board">
          {featuredPlaces.slice(0, 4).map((place, index) => (
            <button
              key={place.id}
              type="button"
              className={`story-tile story-tile-${index + 1}`}
              onClick={() => openPlaceDetail(place)}
            >
              <img src={place.image} alt={place.name} />
              <span>{place.region}</span>
              <strong>{place.name}</strong>
            </button>
          ))}
        </div>
      </section>

      {notice && (
        <div className="trip-notice-v2">
          <span>{notice}</span>
          <Link to="/trip-planner">Plan with saved places →</Link>
        </div>
      )}

      <section className="guide-strip-v2">
        <div className="guide-card active">
          <span>01</span>
          <strong>Choose a travel style</strong>
          <p>Beach, culture, wildlife, food, or hill country.</p>
        </div>
        <div className="guide-card">
          <span>02</span>
          <strong>Open the place story</strong>
          <p>See photos, experiences, tips, cost, and nearby places.</p>
        </div>
        <div className="guide-card">
          <span>03</span>
          <strong>Save and plan</strong>
          <p>Add places to Trip Planner and find hotels by city.</p>
        </div>
      </section>

      <section className="category-explorer-section">
        <div className="section-heading-row modern-heading">
          <div>
            <span className="section-kicker">Travel styles</span>
            <h2>Start with what you want to experience.</h2>
          </div>
          <button type="button" className="soft-reset-btn" onClick={clearFilters}>Reset filters</button>
        </div>

        <div className="category-mosaic">
          {exploreCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={selectedCategory === category.id ? "category-mosaic-card active" : "category-mosaic-card"}
              onClick={() => handleCategorySelect(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <strong>{category.label}</strong>
              <small>{categoryCounts[category.id] || 0} places</small>
            </button>
          ))}
        </div>
      </section>

      <section className="seasonal-section-v2">
        <div className="seasonal-copy">
          <span className="section-kicker gold">Good in {currentMonthName}</span>
          <h2>Season-aware picks for this month.</h2>
          <p>
            Sri Lanka has different travel seasons across regions. These cards help visitors start with places that usually fit the current month.
          </p>
        </div>
        <div className="seasonal-card-row">
          {seasonalPlaces.map((place) => (
            <button key={place.id} type="button" className="seasonal-pick-card" onClick={() => openPlaceDetail(place)}>
              <img src={place.image} alt={place.name} />
              <div>
                <span>{place.bestTime}</span>
                <strong>{place.name}</strong>
                <small>{place.region}</small>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="explore-section-v2" id="destinations" ref={destinationsRef}>
        <div className="destination-toolbar">
          <div>
            <span className="section-kicker">Destination library</span>
            <h2>{filteredPlaces.length} places to explore, save, and book around.</h2>
          </div>
          <div className="toolbar-controls">
            <label>
              Sort
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="name">Name A-Z</option>
                <option value="cost">Estimated cost</option>
                <option value="budgetLow">Budget low to high</option>
                <option value="budgetHigh">Budget high to low</option>
              </select>
            </label>
          </div>
        </div>

        <div className="destination-board-v2">
          {filteredPlaces.map((place) => (
            <article className="place-card-v2" key={place.id}>
              <button type="button" className="place-image-button" onClick={() => openPlaceDetail(place)}>
                <img src={place.image} alt={place.name} />
                <span className="place-region-pill">{place.region}</span>
                <span className="place-open-layer">View place story</span>
              </button>

              <div className="place-card-body-v2">
                <div className="place-title-row-v2">
                  <div>
                    <h3>{place.name}</h3>
                    <p>{place.city}, {place.district}</p>
                  </div>
                  <span className={`budget-pill budget-${place.budget.toLowerCase()}`}>{place.budget}</span>
                </div>

                <p className="place-description-v2">{place.shortDescription}</p>

                <div className="place-info-strip">
                  <span>⏱ {place.duration}</span>
                  <span>📅 {place.bestTime}</span>
                  <span>💰 {formatLkr(place.estimatedCost)}</span>
                </div>

                <div className="place-tags-v2">
                  {place.tags.slice(0, 4).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <div className="place-actions-v2">
                  <button type="button" className="details-action" onClick={() => openPlaceDetail(place)}>
                    Details
                  </button>
                  {isPlaceSaved(place.id) ? (
                    <button type="button" className="saved-action" onClick={(event) => removeFromTrip(place.id, event)}>
                      Saved ✓
                    </button>
                  ) : (
                    <button type="button" className="save-action" onClick={() => addToTrip(place)}>
                      Add to trip
                    </button>
                  )}
                  <Link to={`/hotels?city=${encodeURIComponent(place.city)}`} className="hotel-action">
                    Hotels
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="route-ideas-section">
        <div className="section-heading-row modern-heading">
          <div>
            <span className="section-kicker">Simple route ideas</span>
            <h2>Plan without AI using clear travel logic.</h2>
          </div>
          <Link to="/trip-planner" className="outline-link-btn">Open Trip Planner</Link>
        </div>

        <div className="route-card-grid">
          {routeIdeas.map((route) => {
            const routePlaces = route.placeNames
              .map((name) => explorePlaces.find((place) => place.name === name))
              .filter(Boolean);

            return (
              <article className="route-card" key={route.title}>
                <div className="route-image-stack">
                  {routePlaces.slice(0, 3).map((place, index) => (
                    <img key={place.id} src={place.image} alt={place.name} className={`route-img route-img-${index + 1}`} />
                  ))}
                </div>
                <div className="route-copy">
                  <span>{route.days}</span>
                  <h3>{route.title}</h3>
                  <p>{route.tone}</p>
                  <div className="route-mini-list">
                    {routePlaces.map((place) => (
                      <button key={place.id} type="button" onClick={() => openPlaceDetail(place)}>
                        {place.name}
                      </button>
                    ))}
                  </div>
                  <Link to={`/hotels?city=${encodeURIComponent(route.linkCity)}`} className="route-hotel-link">
                    Find stays near {route.linkCity} →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="explore-final-cta">
        <div>
          <span className="section-kicker light">Next step</span>
          <h2>Save the places you like, then build your Sri Lanka route.</h2>
          <p>
            TourismHub LK connects destination discovery with trip planning and hotel booking, so the visitor always knows what to do next.
          </p>
        </div>
        <Link to="/trip-planner" className="final-cta-btn">Plan my trip</Link>
      </section>
    </main>
  );
}

const exploreCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .explore-page {
    --hub-green: #087466;
    --hub-green-dark: #073f3a;
    --hub-mint: #d8fff4;
    --hub-gold: #ffc22b;
    --hub-paper: #fbf7ee;
    --hub-soft: #f2faf6;
    --hub-ink: #172033;
    --hub-muted: #64748b;
    --hub-line: #d6efe7;
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(24, 184, 147, 0.12), transparent 35%),
      linear-gradient(180deg, #ffffff 0%, var(--hub-paper) 100%);
    color: var(--hub-ink);
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding-bottom: 80px;
  }

  .section-kicker {
    display: inline-flex;
    width: fit-content;
    align-items: center;
    gap: 8px;
    padding: 8px 15px;
    border-radius: 999px;
    background: var(--hub-mint);
    color: var(--hub-green);
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .section-kicker.gold { background: #fff4cc; color: #9a6400; }
  .section-kicker.light { background: rgba(255,255,255,0.14); color: #d8fff4; border: 1px solid rgba(255,255,255,0.25); }

  .saved-trip-drawer {
    position: fixed;
    inset: 0 0 0 auto;
    width: min(390px, 100vw);
    transform: translateX(105%);
    transition: transform 0.28s ease;
    background: #ffffff;
    z-index: 2200;
    display: flex;
    flex-direction: column;
    box-shadow: -18px 0 50px rgba(7, 63, 58, 0.25);
  }
  .saved-trip-drawer.open { transform: translateX(0); }
  .saved-trip-head {
    padding: 20px;
    background: var(--hub-green-dark);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .saved-trip-head span { display: block; color: #b7fff0; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
  .saved-trip-head strong { font-size: 22px; }
  .saved-trip-head button { border: none; background: transparent; color: white; font-size: 30px; cursor: pointer; }
  .saved-trip-list { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
  .empty-saved-text { color: var(--hub-muted); font-weight: 700; line-height: 1.6; text-align: center; margin-top: 40px; }
  .saved-trip-item { display: grid; grid-template-columns: 64px 1fr auto; gap: 12px; align-items: center; padding: 10px; border: 1px solid var(--hub-line); border-radius: 20px; background: var(--hub-soft); }
  .saved-trip-item img { width: 64px; height: 64px; border-radius: 16px; object-fit: cover; }
  .saved-trip-item strong { display: block; font-size: 14px; color: var(--hub-green-dark); }
  .saved-trip-item span { color: var(--hub-muted); font-size: 12px; font-weight: 700; }
  .saved-trip-item button { border: none; background: #fee2e2; color: #b91c1c; border-radius: 999px; padding: 7px 10px; font-size: 11px; font-weight: 900; cursor: pointer; }
  .saved-trip-foot { padding: 18px; border-top: 1px solid var(--hub-line); }
  .drawer-primary-link { display: block; text-align: center; background: linear-gradient(135deg, var(--hub-green), #19b39f); color: white; padding: 14px 16px; border-radius: 999px; font-weight: 900; text-decoration: none; }
  .saved-floating-button { position: fixed; right: 24px; bottom: 24px; z-index: 1200; border: none; background: var(--hub-green-dark); color: white; border-radius: 999px; padding: 14px 20px; box-shadow: 0 18px 45px rgba(7, 63, 58, 0.24); font-weight: 900; cursor: pointer; }
  .saved-floating-button span { background: var(--hub-gold); color: var(--hub-green-dark); padding: 3px 9px; border-radius: 999px; margin-right: 8px; }

  .explore-hero-v2 {
    max-width: 1180px;
    margin: 0 auto;
    padding: 72px 18px 38px;
    display: grid;
    grid-template-columns: 0.95fr 1.05fr;
    gap: 34px;
    align-items: center;
  }
  .explore-hero-copy h1 {
    margin: 18px 0 16px;
    font-size: clamp(42px, 6vw, 74px);
    line-height: 0.94;
    letter-spacing: -0.06em;
    color: var(--hub-green-dark);
    max-width: 680px;
  }
  .explore-hero-copy p {
    color: #334155;
    font-size: 17px;
    line-height: 1.75;
    font-weight: 700;
    max-width: 650px;
  }

  .explore-command-card {
    margin-top: 26px;
    border: 1px solid var(--hub-line);
    background: rgba(255,255,255,0.92);
    border-radius: 30px;
    padding: 18px;
    box-shadow: 0 24px 55px rgba(7, 63, 58, 0.08);
  }
  .explore-command-card label {
    display: block;
    color: var(--hub-green-dark);
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
  }
  .explore-command-card input, .explore-command-card select {
    width: 100%;
    border: 1px solid #c7efe4;
    background: #f8fffc;
    border-radius: 18px;
    padding: 14px 15px;
    color: var(--hub-ink);
    font-weight: 800;
    outline: none;
  }
  .search-field-large { margin-bottom: 13px; }
  .command-row { display: grid; grid-template-columns: 1fr 0.85fr auto; gap: 12px; align-items: end; }
  .command-main-btn {
    border: none;
    border-radius: 18px;
    padding: 15px 18px;
    color: var(--hub-green-dark);
    background: var(--hub-gold);
    font-weight: 950;
    cursor: pointer;
    white-space: nowrap;
  }

  .hero-mini-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; max-width: 520px; }
  .hero-mini-stats div { border: 1px solid var(--hub-line); border-radius: 20px; padding: 13px; background: #ffffff; }
  .hero-mini-stats strong { display: block; color: var(--hub-green); font-size: 22px; font-weight: 950; }
  .hero-mini-stats span { color: var(--hub-muted); font-size: 12px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.08em; }

  .hero-story-board {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    padding: 14px;
    border-radius: 36px;
    background: linear-gradient(135deg, rgba(8,116,102,0.10), rgba(255,194,43,0.12));
    border: 1px solid var(--hub-line);
  }
  .story-tile {
    position: relative;
    height: 235px;
    overflow: hidden;
    border: none;
    border-radius: 28px;
    padding: 0;
    cursor: pointer;
    text-align: left;
    background: var(--hub-green-dark);
    box-shadow: 0 16px 34px rgba(7, 63, 58, 0.14);
  }
  .story-tile::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.78)); }
  .story-tile img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
  .story-tile:hover img { transform: scale(1.07); }
  .story-tile span, .story-tile strong { position: absolute; left: 18px; z-index: 2; }
  .story-tile span { bottom: 56px; color: #fff2a9; font-size: 12px; font-weight: 950; text-transform: uppercase; letter-spacing: 0.08em; }
  .story-tile strong { bottom: 22px; color: white; font-size: 22px; line-height: 1.05; max-width: 85%; }
  .story-tile-2, .story-tile-4 { transform: translateY(22px); }

  .trip-notice-v2 { max-width: 1180px; margin: 0 auto 18px; padding: 15px 20px; border-radius: 18px; display: flex; justify-content: space-between; gap: 12px; background: #eafff8; border: 1px solid #baf5e7; color: var(--hub-green-dark); font-weight: 900; }
  .trip-notice-v2 a { color: var(--hub-green); text-decoration: none; border-bottom: 2px solid var(--hub-green); }

  .guide-strip-v2 { max-width: 1180px; margin: 22px auto 0; padding: 0 18px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
  .guide-card { background: #ffffff; border: 1px solid var(--hub-line); border-radius: 24px; padding: 18px; display: grid; grid-template-columns: auto 1fr; column-gap: 12px; align-items: start; box-shadow: 0 14px 35px rgba(7, 63, 58, 0.05); }
  .guide-card span { grid-row: span 2; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; background: var(--hub-green); color: white; border-radius: 50%; font-weight: 950; }
  .guide-card strong { color: var(--hub-green-dark); }
  .guide-card p { grid-column: 2; margin: 5px 0 0; color: var(--hub-muted); line-height: 1.55; font-weight: 650; font-size: 13px; }
  .guide-card.active { border-color: #7ee8d6; background: linear-gradient(135deg, #ffffff, #effffb); }

  .category-explorer-section, .seasonal-section-v2, .explore-section-v2, .route-ideas-section, .explore-final-cta { max-width: 1180px; margin-left: auto; margin-right: auto; }
  .category-explorer-section { padding: 58px 18px 20px; }
  .section-heading-row { display: flex; align-items: end; justify-content: space-between; gap: 24px; }
  .modern-heading h2, .destination-toolbar h2, .seasonal-copy h2, .explore-final-cta h2 { margin: 13px 0 0; color: var(--hub-green-dark); font-size: clamp(28px, 4vw, 46px); line-height: 1.03; letter-spacing: -0.045em; }
  .soft-reset-btn, .outline-link-btn { border: 1px solid #2ab3a1; color: var(--hub-green); background: #ffffff; border-radius: 999px; padding: 13px 19px; font-weight: 950; text-decoration: none; cursor: pointer; }

  .category-mosaic { margin-top: 24px; display: grid; grid-template-columns: repeat(7, minmax(120px, 1fr)); gap: 12px; }
  .category-mosaic-card { min-height: 128px; border: 1px solid var(--hub-line); border-radius: 26px; background: #ffffff; padding: 16px; text-align: left; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
  .category-mosaic-card:hover { transform: translateY(-5px); box-shadow: 0 18px 40px rgba(7,63,58,0.10); border-color: #69d9c8; }
  .category-mosaic-card.active { background: var(--hub-green-dark); color: white; border-color: var(--hub-green-dark); }
  .category-icon { display: inline-flex; width: 42px; height: 42px; align-items: center; justify-content: center; border-radius: 18px; background: var(--hub-mint); font-size: 20px; margin-bottom: 14px; }
  .category-mosaic-card strong { display: block; font-size: 14px; line-height: 1.2; }
  .category-mosaic-card small { display: block; margin-top: 7px; color: var(--hub-muted); font-weight: 850; }
  .category-mosaic-card.active small { color: #b9fff0; }

  .seasonal-section-v2 { margin-top: 42px; padding: 28px; border-radius: 34px; display: grid; grid-template-columns: 0.42fr 0.58fr; gap: 24px; background: linear-gradient(135deg, #073f3a, #087466); color: white; overflow: hidden; }
  .seasonal-copy p { color: #d9fff6; line-height: 1.7; font-weight: 650; }
  .seasonal-card-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 13px; }
  .seasonal-pick-card { display: grid; grid-template-columns: 84px 1fr; gap: 13px; padding: 10px; border: 1px solid rgba(255,255,255,0.18); border-radius: 22px; background: rgba(255,255,255,0.10); color: white; text-align: left; cursor: pointer; backdrop-filter: blur(10px); }
  .seasonal-pick-card img { width: 84px; height: 84px; border-radius: 18px; object-fit: cover; }
  .seasonal-pick-card span { color: #fff3ae; font-size: 11px; font-weight: 950; text-transform: uppercase; }
  .seasonal-pick-card strong { display: block; margin: 5px 0; }
  .seasonal-pick-card small { color: #b9fff0; font-weight: 800; }

  .explore-section-v2 { padding: 58px 18px 14px; }
  .destination-toolbar { display: flex; justify-content: space-between; gap: 22px; align-items: end; margin-bottom: 24px; }
  .toolbar-controls label { color: var(--hub-green-dark); font-weight: 950; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
  .toolbar-controls select { display: block; margin-top: 8px; min-width: 210px; border: 1px solid #bfeee3; background: #ffffff; border-radius: 14px; padding: 12px 14px; color: var(--hub-green-dark); font-weight: 850; }

  .destination-board-v2 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
  .place-card-v2 { background: #ffffff; border-radius: 30px; overflow: hidden; border: 1px solid var(--hub-line); box-shadow: 0 18px 42px rgba(7,63,58,0.07); display: flex; flex-direction: column; transition: transform 0.22s ease, box-shadow 0.22s ease; }
  .place-card-v2:hover { transform: translateY(-6px); box-shadow: 0 28px 58px rgba(7,63,58,0.14); }
  .place-image-button { position: relative; width: 100%; height: 238px; border: none; padding: 0; cursor: pointer; overflow: hidden; background: var(--hub-green-dark); text-align: left; }
  .place-image-button::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.45)); }
  .place-image-button img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.35s ease; }
  .place-card-v2:hover .place-image-button img { transform: scale(1.06); }
  .place-region-pill { position: absolute; z-index: 2; top: 15px; left: 15px; background: rgba(255,255,255,0.92); color: var(--hub-green); border-radius: 999px; padding: 8px 12px; font-weight: 950; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
  .place-open-layer { position: absolute; z-index: 3; inset: auto 18px 18px 18px; transform: translateY(18px); opacity: 0; background: var(--hub-gold); color: var(--hub-green-dark); border-radius: 999px; padding: 12px 16px; font-weight: 950; text-align: center; transition: all 0.22s ease; }
  .place-image-button:hover .place-open-layer { opacity: 1; transform: translateY(0); }

  .place-card-body-v2 { padding: 19px; display: flex; flex-direction: column; flex: 1; }
  .place-title-row-v2 { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
  .place-title-row-v2 h3 { margin: 0; color: var(--hub-green-dark); font-size: 22px; line-height: 1.12; letter-spacing: -0.035em; }
  .place-title-row-v2 p { margin: 7px 0 0; color: var(--hub-green); font-weight: 850; font-size: 13px; }
  .budget-pill { white-space: nowrap; border-radius: 999px; padding: 6px 10px; font-size: 11px; font-weight: 950; text-transform: uppercase; }
  .budget-low { background: #e7f8ee; color: #127044; }
  .budget-medium { background: #fff3c6; color: #9a6400; }
  .budget-high { background: #fee2e2; color: #b91c1c; }
  .place-description-v2 { color: #475569; line-height: 1.62; font-weight: 650; font-size: 14px; flex: 1; }
  .place-info-strip { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 12px; }
  .place-info-strip span { background: var(--hub-soft); color: var(--hub-green-dark); border: 1px solid var(--hub-line); border-radius: 999px; padding: 7px 10px; font-size: 11.5px; font-weight: 850; }
  .place-tags-v2 { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 15px; }
  .place-tags-v2 span { color: #334155; background: #f7f7f3; border-radius: 999px; padding: 6px 9px; font-size: 11px; font-weight: 850; }
  .place-actions-v2 { display: grid; grid-template-columns: 1fr 1fr 0.85fr; gap: 8px; margin-top: auto; }
  .place-actions-v2 a, .place-actions-v2 button { border: none; border-radius: 15px; padding: 11px 10px; text-align: center; font-weight: 950; font-size: 12px; text-decoration: none; cursor: pointer; }
  .details-action { background: var(--hub-green-dark); color: white; }
  .save-action { background: var(--hub-gold); color: var(--hub-green-dark); }
  .saved-action { background: #e9fff8; color: var(--hub-green); border: 1px solid var(--hub-line) !important; }
  .hotel-action { background: #ffffff; color: var(--hub-green); border: 1px solid var(--hub-green) !important; }

  .route-ideas-section { padding: 62px 18px 10px; }
  .route-card-grid { margin-top: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .route-card { background: #ffffff; border: 1px solid var(--hub-line); border-radius: 32px; padding: 16px; box-shadow: 0 18px 40px rgba(7,63,58,0.06); }
  .route-image-stack { height: 160px; position: relative; margin-bottom: 18px; }
  .route-img { position: absolute; width: 54%; height: 118px; object-fit: cover; border-radius: 22px; box-shadow: 0 12px 24px rgba(7,63,58,0.15); border: 4px solid white; }
  .route-img-1 { left: 0; top: 0; }
  .route-img-2 { right: 0; top: 20px; }
  .route-img-3 { left: 23%; bottom: 0; }
  .route-copy span { color: var(--hub-green); font-weight: 950; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
  .route-copy h3 { color: var(--hub-green-dark); margin: 7px 0; font-size: 24px; }
  .route-copy p { color: #475569; line-height: 1.55; font-weight: 650; }
  .route-mini-list { display: flex; flex-direction: column; gap: 8px; margin: 14px 0; }
  .route-mini-list button { border: 1px solid var(--hub-line); background: var(--hub-soft); color: var(--hub-green-dark); border-radius: 15px; padding: 9px 11px; font-weight: 850; text-align: left; cursor: pointer; }
  .route-hotel-link { display: inline-flex; color: var(--hub-green); font-weight: 950; text-decoration: none; border-bottom: 2px solid var(--hub-green); }

  .explore-final-cta { margin-top: 58px; padding: 40px; border-radius: 36px; background: linear-gradient(135deg, var(--hub-green-dark), var(--hub-green)); color: white; display: flex; justify-content: space-between; align-items: center; gap: 30px; }
  .explore-final-cta p { max-width: 700px; color: #d8fff4; line-height: 1.75; font-weight: 650; }
  .final-cta-btn { background: var(--hub-gold); color: var(--hub-green-dark); padding: 15px 22px; border-radius: 999px; text-decoration: none; font-weight: 950; white-space: nowrap; }

  @media (max-width: 1100px) {
    .destination-board-v2, .route-card-grid { grid-template-columns: repeat(2, 1fr); }
    .category-mosaic { grid-template-columns: repeat(4, 1fr); }
    .explore-hero-v2 { grid-template-columns: 1fr; }
    .story-tile-2, .story-tile-4 { transform: none; }
  }
  @media (max-width: 760px) {
    .command-row, .guide-strip-v2, .seasonal-section-v2, .destination-toolbar, .explore-final-cta { grid-template-columns: 1fr; display: grid; }
    .destination-board-v2, .route-card-grid, .category-mosaic { grid-template-columns: 1fr; }
    .hero-story-board, .seasonal-card-row { grid-template-columns: 1fr; }
    .place-actions-v2 { grid-template-columns: 1fr; }
    .section-heading-row, .destination-toolbar, .explore-final-cta { align-items: stretch; }
    .explore-hero-v2 { padding-top: 42px; }
    .explore-hero-copy h1 { font-size: 42px; }
  }
`;

export default ExplorePage;
