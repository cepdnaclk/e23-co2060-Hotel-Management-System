import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  buildEventSearchText,
  eventCategories,
  eventDateFilters,
  eventPriceFilters,
  getSavedEventIds,
  setSavedEventIds,
  tourismEvents,
} from "../data/eventData";

function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [dateFilter, setDateFilter] = useState(searchParams.get("date") || "Any time");
  const [priceFilter, setPriceFilter] = useState(searchParams.get("price") || "Any price");
  const [savedIds, setSavedIds] = useState(() => getSavedEventIds());

  useEffect(() => {
    const city = searchParams.get("city");
    const search = searchParams.get("search");
    const selectedCategory = searchParams.get("category");
    const selectedDate = searchParams.get("date");
    const selectedPrice = searchParams.get("price");

    setSearchQuery(search || city || "");
    setCategory(selectedCategory || "All");
    setDateFilter(selectedDate || "Any time");
    setPriceFilter(selectedPrice || "Any price");
  }, [searchParams]);

  const featuredEvents = useMemo(
    () => tourismEvents.filter((event) => event.featured).slice(0, 4),
    []
  );

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tourismEvents.filter((event) => {
      const matchesSearch = !query || buildEventSearchText(event).includes(query);
      const matchesCategory = category === "All" || event.category === category;
      const matchesDate = dateFilter === "Any time" || event.dateLabel === dateFilter;
      const matchesPrice = priceFilter === "Any price" || event.priceType === priceFilter;

      return matchesSearch && matchesCategory && matchesDate && matchesPrice;
    });
  }, [category, dateFilter, priceFilter, searchQuery]);

  const popularCities = useMemo(
    () => ["Kandy", "Colombo", "Mirissa", "Ella", "Galle", "Sigiriya", "Bentota"],
    []
  );

  const updateUrlFilters = (nextValues = {}) => {
    const nextSearch = nextValues.searchQuery ?? searchQuery;
    const nextCategory = nextValues.category ?? category;
    const nextDate = nextValues.dateFilter ?? dateFilter;
    const nextPrice = nextValues.priceFilter ?? priceFilter;
    const params = new URLSearchParams();

    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextCategory !== "All") params.set("category", nextCategory);
    if (nextDate !== "Any time") params.set("date", nextDate);
    if (nextPrice !== "Any price") params.set("price", nextPrice);

    setSearchParams(params);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateUrlFilters();
  };

  const handleCategoryClick = (nextCategory) => {
    setCategory(nextCategory);
    updateUrlFilters({ category: nextCategory });
  };

  const handleCityClick = (city) => {
    setSearchQuery(city);
    updateUrlFilters({ searchQuery: city });
  };

  const handleClear = () => {
    setSearchQuery("");
    setCategory("All");
    setDateFilter("Any time");
    setPriceFilter("Any price");
    setSearchParams({});
  };

  const toggleSaved = (eventId) => {
    const nextIds = savedIds.includes(eventId)
      ? savedIds.filter((id) => id !== eventId)
      : [...savedIds, eventId];

    setSavedIds(nextIds);
    setSavedEventIds(nextIds);
  };

  return (
    <main className="events-page">
      <style>{eventsCss}</style>

      <section className="events-hero">
        <div className="events-hero-overlay" />
        <div className="events-hero-content">
          <span className="eyebrow">Events & Experiences</span>
          <h1>Find the best things to do near your hotel or destination.</h1>
          <p>
            Search cultural nights, food walks, beach events, nature experiences, hotel events,
            and local festivals across Sri Lanka.
          </p>

          <form className="event-search-card" onSubmit={handleSubmit}>
            <label>
              <span>Search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search city, hotel, or event name..."
              />
            </label>

            <label>
              <span>Category</span>
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  updateUrlFilters({ category: event.target.value });
                }}
              >
                {eventCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Date</span>
              <select
                value={dateFilter}
                onChange={(event) => {
                  setDateFilter(event.target.value);
                  updateUrlFilters({ dateFilter: event.target.value });
                }}
              >
                {eventDateFilters.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit">Search events</button>
          </form>

          <div className="quick-city-row" aria-label="Popular city shortcuts">
            {popularCities.map((city) => (
              <button type="button" key={city} onClick={() => handleCityClick(city)}>
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="events-page-inner">
        <div className="section-header split-header">
          <div>
            <span className="section-kicker">Featured picks</span>
            <h2>Top experiences tourists can add to their trip</h2>
          </div>
          <Link to="/hotels" className="soft-link">
            Find hotels first →
          </Link>
        </div>

        <div className="featured-event-grid">
          {featuredEvents.map((event) => (
            <article className="featured-event-card" key={event.id}>
              <img src={event.image} alt={event.title} />
              <div className="featured-event-shade" />
              <div className="featured-event-content">
                <span>{event.category}</span>
                <h3>{event.title}</h3>
                <p>{event.city} · {event.dateLabel} · {event.priceLabel}</p>
                <Link to={`/events/${event.id}`}>View experience</Link>
              </div>
            </article>
          ))}
        </div>

        <section className="event-discovery-panel">
          <div className="filter-sidebar">
            <div className="filter-card">
              <h3>Explore by category</h3>
              <div className="chip-list">
                {eventCategories.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={item === category ? "active-chip" : ""}
                    onClick={() => handleCategoryClick(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-card compact-filter-card">
              <h3>Price</h3>
              <select
                value={priceFilter}
                onChange={(event) => {
                  setPriceFilter(event.target.value);
                  updateUrlFilters({ priceFilter: event.target.value });
                }}
              >
                {eventPriceFilters.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-card tip-card">
              <span>Travel tip</span>
              <p>
                Search using a hotel name such as “Kandy Lake Hotel” or “Cinnamon Grand” to find
                experiences near that stay.
              </p>
            </div>
          </div>

          <div className="event-results-area">
            <div className="results-topbar">
              <div>
                <span className="section-kicker">{filteredEvents.length} results found</span>
                <h2>Available events and experiences</h2>
              </div>
              {(searchQuery || category !== "All" || dateFilter !== "Any time" || priceFilter !== "Any price") && (
                <button type="button" onClick={handleClear} className="clear-button">
                  Clear filters
                </button>
              )}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="empty-events-card">
                <span>🔎</span>
                <h3>No events matched your search</h3>
                <p>Try another city, hotel name, category, or date filter.</p>
                <button type="button" onClick={handleClear}>Show all events</button>
              </div>
            ) : (
              <div className="event-card-grid">
                {filteredEvents.map((event) => (
                  <article className="event-card" key={event.id}>
                    <div className="event-image-wrap">
                      <img src={event.image} alt={event.title} />
                      <span className="event-category-badge">{event.category}</span>
                      <button
                        type="button"
                        className={savedIds.includes(event.id) ? "save-event saved" : "save-event"}
                        onClick={() => toggleSaved(event.id)}
                        aria-label={savedIds.includes(event.id) ? "Remove saved event" : "Save event"}
                      >
                        {savedIds.includes(event.id) ? "♥" : "♡"}
                      </button>
                    </div>

                    <div className="event-card-body">
                      <div className="event-meta-line">
                        <span>{event.city}</span>
                        <span>{event.dateLabel}</span>
                        <span>{event.priceLabel}</span>
                      </div>

                      <h3>{event.title}</h3>
                      <p>{event.description}</p>

                      <div className="event-facts">
                        <span>⭐ {event.rating} ({event.reviews})</span>
                        <span>📍 {event.distanceText}</span>
                        <span>⏱ {event.duration}</span>
                      </div>

                      <div className="near-hotels-line">
                        Near hotels: {event.nearHotels.slice(0, 2).join(", ")}
                      </div>

                      <div className="event-actions">
                        <Link to={`/events/${event.id}`} className="primary-event-action">
                          View details
                        </Link>
                        <Link
                          to={`/hotels?city=${encodeURIComponent(event.city)}`}
                          className="secondary-event-action"
                        >
                          Find hotels
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

const eventsCss = `
  .events-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 4% 8%, rgba(20, 184, 166, 0.15), transparent 28rem),
      radial-gradient(circle at 92% 18%, rgba(251, 191, 36, 0.16), transparent 24rem),
      linear-gradient(135deg, #f8f4ea 0%, #ffffff 48%, #eefdf9 100%);
    color: #10231f;
  }

  .events-hero {
    position: relative;
    min-height: 560px;
    display: flex;
    align-items: center;
    overflow: hidden;
    background:
      linear-gradient(90deg, rgba(4, 47, 43, 0.94), rgba(8, 117, 104, 0.68), rgba(15, 23, 42, 0.28)),
      url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=90") center/cover;
  }

  .events-hero-overlay {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 15% 20%, rgba(251, 191, 36, 0.22), transparent 24rem),
      linear-gradient(0deg, rgba(4, 47, 43, 0.34), rgba(4, 47, 43, 0.04));
  }

  .events-hero-content {
    position: relative;
    z-index: 1;
    width: min(1180px, calc(100% - 36px));
    margin: 0 auto;
    padding: 82px 0;
    color: #ffffff;
  }

  .eyebrow,
  .section-kicker {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 8px 13px;
    border-radius: 999px;
    background: rgba(251, 191, 36, 0.18);
    color: #facc15;
    border: 1px solid rgba(251, 191, 36, 0.32);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.74rem;
    font-weight: 950;
  }

  .section-kicker {
    background: #ecfdf5;
    color: #0f766e;
    border-color: #ccfbf1;
  }

  .events-hero h1 {
    max-width: 850px;
    margin: 18px 0 14px;
    font-size: clamp(2.6rem, 6vw, 5.8rem);
    line-height: 0.94;
    letter-spacing: -0.075em;
  }

  .events-hero p {
    max-width: 720px;
    margin: 0;
    color: rgba(255, 255, 255, 0.86);
    line-height: 1.75;
    font-size: 1.05rem;
    font-weight: 750;
  }

  .event-search-card {
    margin-top: 34px;
    display: grid;
    grid-template-columns: 1.4fr 0.8fr 0.75fr auto;
    gap: 12px;
    width: min(1060px, 100%);
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.16);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.24);
    backdrop-filter: blur(16px);
  }

  .event-search-card label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.96);
    color: #0f172a;
  }

  .event-search-card label span {
    color: #64748b;
    font-size: 0.73rem;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .event-search-card input,
  .event-search-card select,
  .compact-filter-card select {
    width: 100%;
    border: 0;
    outline: none;
    background: transparent;
    color: #0f172a;
    font-size: 1rem;
    font-weight: 850;
    font-family: inherit;
  }

  .event-search-card button,
  .clear-button,
  .empty-events-card button {
    border: 0;
    border-radius: 20px;
    padding: 0 22px;
    color: #082f2b;
    background: linear-gradient(135deg, #facc15, #f59e0b);
    font-weight: 950;
    cursor: pointer;
    box-shadow: 0 16px 34px rgba(251, 191, 36, 0.28);
  }

  .quick-city-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }

  .quick-city-row button {
    border: 1px solid rgba(255, 255, 255, 0.24);
    background: rgba(255, 255, 255, 0.13);
    color: #ffffff;
    padding: 10px 14px;
    border-radius: 999px;
    font-weight: 900;
    cursor: pointer;
    backdrop-filter: blur(10px);
  }

  .events-page-inner {
    width: min(1180px, calc(100% - 36px));
    margin: 0 auto;
    padding: 58px 0 84px;
  }

  .section-header,
  .results-topbar {
    margin-bottom: 22px;
  }

  .split-header,
  .results-topbar {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 18px;
  }

  .section-header h2,
  .results-topbar h2 {
    margin: 10px 0 0;
    color: #083f3b;
    font-size: clamp(1.7rem, 3vw, 2.7rem);
    line-height: 1;
    letter-spacing: -0.045em;
  }

  .soft-link {
    color: #0f766e;
    text-decoration: none;
    font-weight: 950;
    white-space: nowrap;
  }

  .featured-event-grid {
    display: grid;
    grid-template-columns: 1.1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 44px;
  }

  .featured-event-card {
    position: relative;
    min-height: 320px;
    overflow: hidden;
    border-radius: 30px;
    box-shadow: 0 22px 54px rgba(15, 23, 42, 0.13);
  }

  .featured-event-card:first-child {
    grid-row: span 2;
    min-height: 656px;
  }

  .featured-event-card img,
  .event-image-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }

  .featured-event-card:hover img,
  .event-card:hover .event-image-wrap img {
    transform: scale(1.05);
  }

  .featured-event-shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(0deg, rgba(3, 31, 28, 0.88), rgba(3, 31, 28, 0.12));
  }

  .featured-event-content {
    position: absolute;
    inset: auto 0 0;
    padding: 24px;
    color: white;
  }

  .featured-event-content span {
    display: inline-flex;
    padding: 7px 11px;
    border-radius: 999px;
    background: rgba(250, 204, 21, 0.94);
    color: #082f2b;
    font-size: 0.75rem;
    font-weight: 950;
  }

  .featured-event-content h3 {
    margin: 12px 0 8px;
    font-size: 1.55rem;
    line-height: 1.06;
  }

  .featured-event-content p {
    margin: 0 0 16px;
    color: rgba(255, 255, 255, 0.86);
    font-weight: 800;
  }

  .featured-event-content a {
    color: #fde68a;
    font-weight: 950;
    text-decoration: none;
  }

  .event-discovery-panel {
    display: grid;
    grid-template-columns: 290px minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }

  .filter-sidebar {
    position: sticky;
    top: 94px;
    display: grid;
    gap: 16px;
  }

  .filter-card {
    padding: 20px;
    border: 1px solid #d1fae5;
    border-radius: 26px;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 18px 44px rgba(15, 23, 42, 0.07);
  }

  .filter-card h3 {
    margin: 0 0 14px;
    color: #083f3b;
  }

  .chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip-list button {
    border: 1px solid #ccfbf1;
    border-radius: 999px;
    background: #ffffff;
    color: #0f766e;
    padding: 8px 11px;
    font-weight: 900;
    cursor: pointer;
  }

  .chip-list .active-chip {
    background: #0f766e;
    color: #ffffff;
    border-color: #0f766e;
  }

  .compact-filter-card select {
    padding: 12px 14px;
    border: 1px solid #ccfbf1;
    border-radius: 16px;
    background: #ffffff;
  }

  .tip-card {
    background: linear-gradient(135deg, #083f3b, #0f766e);
    color: #ffffff;
  }

  .tip-card span {
    color: #facc15;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.74rem;
  }

  .tip-card p {
    margin: 10px 0 0;
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.65;
    font-weight: 750;
  }

  .clear-button {
    padding: 12px 16px;
    box-shadow: none;
  }

  .event-card-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .event-card {
    overflow: hidden;
    border: 1px solid #d1fae5;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
  }

  .event-image-wrap {
    position: relative;
    height: 235px;
    overflow: hidden;
  }

  .event-category-badge,
  .save-event {
    position: absolute;
    top: 14px;
    border: 0;
    border-radius: 999px;
    font-weight: 950;
  }

  .event-category-badge {
    left: 14px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.94);
    color: #0f766e;
  }

  .save-event {
    right: 14px;
    width: 42px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.92);
    color: #0f766e;
    font-size: 1.3rem;
    cursor: pointer;
  }

  .save-event.saved {
    background: #f43f5e;
    color: white;
  }

  .event-card-body {
    padding: 20px;
  }

  .event-meta-line {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .event-meta-line span {
    padding: 7px 10px;
    border-radius: 999px;
    background: #ecfdf5;
    color: #0f766e;
    font-size: 0.75rem;
    font-weight: 950;
  }

  .event-card h3 {
    margin: 14px 0 10px;
    color: #083f3b;
    font-size: 1.35rem;
    letter-spacing: -0.02em;
  }

  .event-card p {
    margin: 0;
    color: #64748b;
    line-height: 1.65;
    font-weight: 700;
  }

  .event-facts {
    display: grid;
    gap: 8px;
    margin: 16px 0;
    color: #475569;
    font-size: 0.9rem;
    font-weight: 850;
  }

  .near-hotels-line {
    padding: 12px 14px;
    border-radius: 18px;
    background: #fffbeb;
    color: #92400e;
    font-weight: 850;
    line-height: 1.5;
  }

  .event-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 16px;
  }

  .primary-event-action,
  .secondary-event-action {
    min-height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    text-decoration: none;
    font-weight: 950;
  }

  .primary-event-action {
    background: #0f766e;
    color: #ffffff;
  }

  .secondary-event-action {
    background: #ecfdf5;
    color: #0f766e;
  }

  .empty-events-card {
    min-height: 360px;
    display: grid;
    place-items: center;
    text-align: center;
    padding: 42px;
    border: 1px dashed #99f6e4;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.76);
  }

  .empty-events-card span {
    font-size: 3rem;
  }

  .empty-events-card h3 {
    margin: 12px 0 8px;
    color: #083f3b;
    font-size: 1.6rem;
  }

  .empty-events-card p {
    margin: 0 0 20px;
    color: #64748b;
    font-weight: 750;
  }

  .empty-events-card button {
    min-height: 44px;
  }

  @media (max-width: 1020px) {
    .event-search-card,
    .event-discovery-panel,
    .event-card-grid {
      grid-template-columns: 1fr;
    }

    .filter-sidebar {
      position: static;
    }

    .featured-event-grid {
      grid-template-columns: 1fr 1fr;
    }

    .featured-event-card:first-child {
      grid-row: auto;
      min-height: 320px;
    }
  }

  @media (max-width: 720px) {
    .events-hero {
      min-height: auto;
    }

    .events-hero-content {
      padding: 58px 0;
    }

    .event-search-card {
      border-radius: 22px;
    }

    .featured-event-grid,
    .split-header,
    .results-topbar,
    .event-actions {
      grid-template-columns: 1fr;
      display: grid;
    }

    .soft-link {
      white-space: normal;
    }
  }
`;

export default EventsPage;
