import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  buildEventSearchText,
  eventCategories,
  eventMonths,
  eventPriceFilters,
  normaliseEvent,
  tourismEvents,
} from "../data/eventData";
import { assetUrl, getTouristEvents } from "../services/exploreService";

const getEventImage = (event) => event.imageUrl || event.image_url || event.image || "";
const getEventKey = (event) => event.slug || event.id || event.event_id || event.title;
const monthOrder = eventMonths.slice(1);

const getEventLink = (event) => {
  if (event.explorePlaceId) {
    return `/explore/${event.explorePlaceId}?focusEvent=${event.slug}#things-to-do`;
  }

  return `/events/${event.slug}`;
};

const uniqueClean = (items) =>
  [...new Set(items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];

function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState(tourismEvents.map(normaliseEvent));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") || searchParams.get("city") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [city, setCity] = useState(searchParams.get("city") || "All Destinations");
  const [month, setMonth] = useState(searchParams.get("month") || "All Months");
  const [price, setPrice] = useState(searchParams.get("price") || "Any Price");
  const [sort, setSort] = useState(searchParams.get("sort") || "Recommended");
  const [featuredOnly, setFeaturedOnly] = useState(searchParams.get("featured") === "true");
  const [guideOnly, setGuideOnly] = useState(searchParams.get("guide") === "true");
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const rows = await getTouristEvents();
        const approvedRows = rows.map(normaliseEvent);
        setEvents(approvedRows.length ? approvedRows : tourismEvents.map(normaliseEvent));
      } catch (err) {
        console.warn("Using fallback event data:", err.message);
        setEvents(tourismEvents.map(normaliseEvent));
        setError("Database events are not reachable right now. Showing saved demo events until the API starts.");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setCategory(searchParams.get("category") || "All");
    setCity(searchParams.get("city") || "All Destinations");
    setMonth(searchParams.get("month") || "All Months");
    setPrice(searchParams.get("price") || "Any Price");
    setSort(searchParams.get("sort") || "Recommended");
    setFeaturedOnly(searchParams.get("featured") === "true");
    setGuideOnly(searchParams.get("guide") === "true");
  }, [searchParams]);

  const safeEvents = useMemo(() => events.map(normaliseEvent), [events]);

  const cityOptions = useMemo(() => ["All Destinations", ...uniqueClean(safeEvents.map((event) => event.city))], [safeEvents]);

  const categoryCounts = useMemo(() => {
    const counts = { All: safeEvents.length };
    safeEvents.forEach((event) => {
      counts[event.category] = (counts[event.category] || 0) + 1;
    });
    return counts;
  }, [safeEvents]);

  const heroSlides = useMemo(() => {
    const featured = safeEvents.filter((event) => event.featured && getEventImage(event));
    const normal = safeEvents.filter((event) => !event.featured && getEventImage(event));
    return [...featured, ...normal].slice(0, 8);
  }, [safeEvents]);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    setHeroIndex(0);
  }, [category]);

  const syncParams = (next = {}) => {
    const nextSearch = next.search ?? search;
    const nextCategory = next.category ?? category;
    const nextCity = next.city ?? city;
    const nextMonth = next.month ?? month;
    const nextPrice = next.price ?? price;
    const nextSort = next.sort ?? sort;
    const nextFeatured = next.featuredOnly ?? featuredOnly;
    const nextGuide = next.guideOnly ?? guideOnly;
    const params = new URLSearchParams();

    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextCategory !== "All") params.set("category", nextCategory);
    if (nextCity !== "All Destinations") params.set("city", nextCity);
    if (nextMonth !== "All Months") params.set("month", nextMonth);
    if (nextPrice !== "Any Price") params.set("price", nextPrice);
    if (nextSort !== "Recommended") params.set("sort", nextSort);
    if (nextFeatured) params.set("featured", "true");
    if (nextGuide) params.set("guide", "true");

    setSearchParams(params);
  };

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeEvents
      .filter((event) => {
        const matchesSearch = !query || buildEventSearchText(event).includes(query);
        const matchesCategory = category === "All" || event.category === category;
        const matchesCity = city === "All Destinations" || event.city === city;
        const matchesMonth = month === "All Months" || event.monthName === month;
        const matchesPrice = price === "Any Price" || event.priceType === price;
        const matchesFeatured = !featuredOnly || event.featured;
        const matchesGuide = !guideOnly || event.guideRecommended;
        return matchesSearch && matchesCategory && matchesCity && matchesMonth && matchesPrice && matchesFeatured && matchesGuide;
      })
      .sort((a, b) => {
        if (sort === "Lowest price") return Number(a.price || 0) - Number(b.price || 0);
        if (sort === "Highest price") return Number(b.price || 0) - Number(a.price || 0);
        if (sort === "Month order") return monthOrder.indexOf(a.monthName) - monthOrder.indexOf(b.monthName);
        if (sort === "Name A-Z") return String(a.title || "").localeCompare(String(b.title || ""));
        return Number(b.featured) - Number(a.featured) || Number(b.guideRecommended) - Number(a.guideRecommended);
      });
  }, [category, city, featuredOnly, guideOnly, month, price, safeEvents, search, sort]);

  const featuredEvents = useMemo(() => safeEvents.filter((event) => event.featured).slice(0, 3), [safeEvents]);
  const currentHeroEvent = heroSlides[heroIndex] || featuredEvents[0] || safeEvents[0];
  const heroImage = assetUrl(getEventImage(currentHeroEvent));
  const currentMonthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "Asia/Colombo",
  }).format(new Date());
  const thisMonthCount = safeEvents.filter((event) => event.monthName === currentMonthName).length;
  const freeCount = safeEvents.filter((event) => Number(event.price || 0) === 0 || event.priceType === "Free").length;
  const guideCount = safeEvents.filter((event) => event.guideRecommended).length;

  const activeFilters = [
    search.trim() ? `Search: ${search.trim()}` : "",
    category !== "All" ? category : "",
    city !== "All Destinations" ? city : "",
    month !== "All Months" ? month : "",
    price !== "Any Price" ? price : "",
    featuredOnly ? "Featured only" : "",
    guideOnly ? "Guide recommended" : "",
  ].filter(Boolean);

  const resultTitle = activeFilters.length ? "Matching event experiences" : "Curated event experiences";

  const handleSubmit = (event) => {
    event.preventDefault();
    syncParams();
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setCity("All Destinations");
    setMonth("All Months");
    setPrice("Any Price");
    setSort("Recommended");
    setFeaturedOnly(false);
    setGuideOnly(false);
    setSearchParams({});
  };

  const updateFilter = (key, value) => {
    const next = { [key]: value };
    if (key === "featuredOnly") setFeaturedOnly(value);
    if (key === "guideOnly") setGuideOnly(value);
    if (key === "category") setCategory(value);
    if (key === "city") setCity(value);
    if (key === "month") setMonth(value);
    if (key === "price") setPrice(value);
    if (key === "sort") setSort(value);
    syncParams(next);
  };

  return (
    <main className="events-page">
      <style>{eventsCss}</style>

      <section
        className="events-hero-block"
        style={heroImage ? { backgroundImage: `linear-gradient(90deg, rgba(0,78,68,.66), rgba(0,111,94,.46), rgba(255,196,37,.10)), url(${heroImage})` } : undefined}
      >
        <div className="hero-shell">
          <div className="hero-copy">
            <span className="event-kicker">Sri Lanka event calendar</span>
            <h1>Find cultural moments and island experiences</h1>
            <p>
              Browse approved events, food walks, coastal nights, wellness sessions, and hotel experiences that fit your Sri Lankan journey.
            </p>

            <form className="hero-search" onSubmit={handleSubmit}>
              <span className="search-icon">🔎</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by event, city, venue, hotel, or place..."
              />
              <button type="submit">Search</button>
            </form>
          </div>

          <aside className="hero-feature-card">
            {heroImage ? (
              <img
                className="hero-feature-photo"
                src={heroImage}
                alt={currentHeroEvent?.title || "Event highlight"}
              />
            ) : null}
            <div className="hero-feature-shade" />
            <div className="hero-feature-content">
              <span className="live-pill">Changing every 4 seconds</span>
              <h2>{currentHeroEvent?.title || "Approved Events"}</h2>
              <p>{currentHeroEvent?.city || "Sri Lanka"} · {currentHeroEvent?.dateLabel || "Tourist friendly"}</p>
              <div className="hero-feature-footer">
                <span>{currentHeroEvent?.category || "Events"}</span>
                <span>{currentHeroEvent?.priceLabel || "Plan ahead"}</span>
              </div>
            </div>
          </aside>
        </div>

        <div className="hero-stats">
          <div><strong>{safeEvents.length}</strong><span>Approved events</span></div>
          <div><strong>{cityOptions.length - 1}</strong><span>Destinations</span></div>
          <div><strong>{thisMonthCount}</strong><span>Good in {currentMonthName}</span></div>
          <div><strong>{freeCount}</strong><span>Free choices</span></div>
        </div>
      </section>

      <section className="events-tabs" aria-label="Event page sections">
        <button type="button" className="active">Events</button>
        <Link to="/explore">Explore places</Link>
        <Link to="/tourist-guides">Tourist guides</Link>
        <Link to="/hotels">Hotels nearby</Link>
      </section>

      <section className="events-page-intro">
        <div>
          <span className="section-kicker">Plan with confidence</span>
          <h2>Discover events by destination, month, budget, and travel style</h2>
        </div>
        <p>
          This page is designed like a travel event desk. Filters stay simple for tourists, while the layout gives enough details before opening the event or nearby hotels.
        </p>
      </section>

      <section className="events-layout">
        <aside className="filter-panel">
          <div className="filter-card title-card">
            <div>
              <span className="mini-icon">🎟️</span>
              <h2>Event Finder</h2>
            </div>
            <p>Choose what matters most and the results will update clearly.</p>
          </div>

          <div className="filter-card">
            <div className="filter-title-row">
              <h3>Event Type</h3>
              <span>{filteredEvents.length} shown</span>
            </div>
            <div className="category-list">
              {eventCategories.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={category === item ? "category-option selected" : "category-option"}
                  onClick={() => updateFilter("category", item)}
                >
                  <span>{item}</span>
                  <small>{categoryCounts[item] || 0}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="filter-card compact-card">
            <label className="select-label">
              <span>Destination</span>
              <select value={city} onChange={(event) => updateFilter("city", event.target.value)}>
                {cityOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="select-label">
              <span>Month</span>
              <select value={month} onChange={(event) => updateFilter("month", event.target.value)}>
                {eventMonths.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="select-label">
              <span>Budget type</span>
              <select value={price} onChange={(event) => updateFilter("price", event.target.value)}>
                {eventPriceFilters.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="select-label">
              <span>Sort results</span>
              <select value={sort} onChange={(event) => updateFilter("sort", event.target.value)}>
                <option>Recommended</option>
                <option>Month order</option>
                <option>Lowest price</option>
                <option>Highest price</option>
                <option>Name A-Z</option>
              </select>
            </label>
          </div>

          <div className="filter-card">
            <h3>Quick filters</h3>
            <button
              type="button"
              className={featuredOnly ? "quick-filter on" : "quick-filter"}
              onClick={() => updateFilter("featuredOnly", !featuredOnly)}
            >
              <span>⭐ Featured events</span>
              <strong>{featuredOnly ? "On" : "Off"}</strong>
            </button>
            <button
              type="button"
              className={guideOnly ? "quick-filter on" : "quick-filter"}
              onClick={() => updateFilter("guideOnly", !guideOnly)}
            >
              <span>🧭 Guide recommended</span>
              <strong>{guideOnly ? "On" : "Off"}</strong>
            </button>
          </div>

          <button type="button" className="clear-btn" onClick={clearFilters}>Clear all filters</button>
        </aside>

        <section className="events-content">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">Featured picks</span>
              <h2>Signature experiences tourists notice first</h2>
            </div>
            <Link className="partner-link" to="/partner/event-registration">List an event</Link>
          </div>

          {featuredEvents.length ? (
            <div className="featured-events-grid">
              {featuredEvents.map((event) => (
                <article className="feature-card" key={getEventKey(event)}>
                  <img src={assetUrl(getEventImage(event))} alt={event.title} />
                  <div className="feature-gradient" />
                  <div className="feature-body">
                    <span>{event.category}</span>
                    <h3>{event.title}</h3>
                    <p>{event.city} · {event.dateLabel}</p>
                    <Link to={getEventLink(event)}>View details</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <div className="results-panel">
            <div className="results-heading">
              <div>
                <span className="section-kicker">Event results</span>
                <h2>{resultTitle}</h2>
              </div>
              <p>{filteredEvents.length} result{filteredEvents.length === 1 ? "" : "s"}</p>
            </div>

            {activeFilters.length ? (
              <div className="active-chips">
                {activeFilters.map((item) => <span key={item}>{item}</span>)}
                <button type="button" onClick={clearFilters}>Clear</button>
              </div>
            ) : null}

            {error ? <div className="soft-alert">{error}</div> : loading ? <div className="soft-alert">Loading approved events...</div> : null}

            {filteredEvents.length ? (
              <div className="event-results-grid">
                {filteredEvents.map((event) => (
                  <article className="event-card" key={getEventKey(event)}>
                    <div className="event-date-tile">
                      <strong>{event.monthName?.slice(0, 3) || "EVT"}</strong>
                      <span>{event.dateLabel || "Available"}</span>
                    </div>

                    <div className="event-image-box">
                      <img src={assetUrl(getEventImage(event))} alt={event.title} />
                      <span>{event.category}</span>
                    </div>

                    <div className="event-info">
                      <div className="event-meta-row">
                        <span>📍 {event.city}</span>
                        <span>⏱ {event.timeLabel}</span>
                        <span>💰 {event.priceLabel}</span>
                      </div>
                      <h3>{event.title}</h3>
                      <p>{event.shortDescription}</p>

                      <div className="event-detail-list">
                        <span>🏛 {event.venue}</span>
                        {event.duration ? <span>🕒 Duration: {event.duration}</span> : null}
                        {event.nearHotels?.length ? <span>🏨 Near {event.nearHotels.slice(0, 2).join(", ")}</span> : null}
                      </div>

                      {event.highlights?.length ? (
                        <div className="event-tags">
                          {event.highlights.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
                        </div>
                      ) : null}

                      <div className="event-actions">
                        <Link className="primary-action" to={getEventLink(event)}>View details</Link>
                        <Link to={`/hotels?city=${encodeURIComponent(event.city || "")}`}>Find hotels</Link>
                        {event.mapUrl ? <a href={event.mapUrl} target="_blank" rel="noreferrer">Directions</a> : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-results">
                <span>🔎</span>
                <h3>No events found for these filters.</h3>
                <p>Try another city, category, month, or budget level.</p>
                <button type="button" onClick={clearFilters}>Show all events</button>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

const eventsCss = `
.events-page{min-height:100vh;background:linear-gradient(180deg,#f3faf7 0%,#ffffff 42%,#f8fbf7 100%);color:#102033;font-family:Inter,system-ui,Arial,sans-serif}.events-hero-block{position:relative;overflow:hidden;min-height:600px;margin:0;padding:68px min(7vw,108px) 42px;background:#07584e;background-size:cover;background-position:center;border-bottom-left-radius:44px;border-bottom-right-radius:44px;box-shadow:0 28px 90px rgba(2,64,55,.18);isolation:isolate}.events-hero-block:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.02));z-index:-1}.events-hero-block:after{content:"";position:absolute;right:-170px;top:-170px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(255,204,55,.35),transparent 67%);z-index:-1}.hero-shell{width:min(1360px,100%);margin:auto;display:grid;grid-template-columns:minmax(0,1.15fr) 430px;gap:38px;align-items:center}.hero-copy{color:white}.event-kicker,.section-kicker{display:inline-flex;align-items:center;gap:8px;border-radius:999px;background:rgba(255,231,150,.96);color:#053f38;padding:10px 18px;font-size:12px;font-weight:1000;text-transform:uppercase;letter-spacing:.16em;box-shadow:0 14px 35px rgba(0,0,0,.08)}.section-kicker{background:#fff3bf;color:#07584e;border:1px solid rgba(255,196,37,.45)}.hero-copy h1{font-size:clamp(54px,7vw,100px);line-height:.94;margin:26px 0 18px;max-width:920px;letter-spacing:-.07em;color:#fff;text-shadow:0 12px 38px rgba(0,0,0,.22)}.hero-copy p{max-width:780px;font-size:clamp(17px,1.6vw,22px);line-height:1.72;color:#ecfffb;font-weight:750;text-shadow:0 8px 24px rgba(0,0,0,.18)}.hero-search{margin-top:32px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;width:min(860px,100%);background:rgba(255,255,255,.94);border:1px solid rgba(255,255,255,.8);border-radius:28px;padding:14px;box-shadow:0 26px 72px rgba(0,0,0,.20), inset 0 1px 0 rgba(255,255,255,.8);backdrop-filter:blur(12px)}.search-icon{font-size:25px;padding-left:10px}.hero-search input{border:none;background:transparent;outline:none;font-size:16px;font-weight:800;color:#102033;min-width:0}.hero-search input::placeholder{color:#6a778a}.hero-search button{border:none;border-radius:20px;background:#ffc425;color:#053f38;padding:16px 28px;font-weight:1000;cursor:pointer;box-shadow:0 12px 24px rgba(255,196,37,.25)}.hero-feature-card{position:relative;align-self:stretch;min-height:370px;border:1px solid rgba(255,255,255,.32);border-radius:34px;background:#063f39;box-shadow:0 26px 80px rgba(0,0,0,.20);overflow:hidden;color:white}.hero-feature-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:none;transform:scale(1.01);transition:opacity .45s ease,transform 4s ease}.hero-feature-card:hover .hero-feature-photo{transform:scale(1.05)}.hero-feature-shade{position:absolute;inset:0;background:linear-gradient(0deg,rgba(3,39,35,.82) 0%,rgba(4,65,58,.45) 45%,rgba(255,196,37,.06) 100%)}.hero-feature-content{position:absolute;left:30px;right:30px;bottom:30px;z-index:2;display:flex;flex-direction:column;align-items:flex-start}.live-pill{align-self:flex-start;background:rgba(5,85,75,.78);border:1px solid rgba(255,255,255,.28);padding:9px 13px;border-radius:999px;font-size:12px;font-weight:950;color:#fff6c7;box-shadow:0 10px 24px rgba(0,0,0,.14)}.hero-feature-card h2{font-size:36px;line-height:1.03;margin:24px 0 12px;letter-spacing:-.045em;text-shadow:0 3px 18px rgba(0,0,0,.36)}.hero-feature-card p{font-weight:850;color:#eafffb;text-shadow:0 2px 12px rgba(0,0,0,.32)}.hero-feature-footer{display:flex;gap:10px;flex-wrap:wrap;margin-top:15px}.hero-feature-footer span{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:8px 12px;font-size:12px;font-weight:900;backdrop-filter:blur(4px)}.hero-stats{width:min(1360px,100%);margin:36px auto 0;display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.hero-stats div{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.25);border-radius:26px;padding:20px 22px;color:white;box-shadow:inset 0 1px 0 rgba(255,255,255,.18);backdrop-filter:blur(10px)}.hero-stats strong{display:block;font-size:34px;color:#ffe78f;line-height:1}.hero-stats span{display:block;margin-top:8px;font-size:12px;text-transform:uppercase;letter-spacing:.12em;font-weight:1000;color:#eefdf9}.events-tabs{width:min(1360px,calc(100% - 44px));margin:-32px auto 0;position:relative;z-index:5;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.events-tabs a,.events-tabs button{border:1px solid rgba(6,78,69,.18);background:rgba(255,255,255,.96);color:#07584e;border-radius:999px;text-decoration:none;padding:15px 28px;font-weight:950;box-shadow:0 16px 42px rgba(15,23,42,.10);cursor:pointer}.events-tabs .active{background:#07584e;color:#fff;border-color:#07584e}.events-page-intro{width:min(1360px,calc(100% - 44px));margin:46px auto 28px;display:grid;grid-template-columns:minmax(0,1fr) 430px;gap:28px;align-items:end}.events-page-intro h2{font-size:clamp(34px,4.3vw,58px);letter-spacing:-.06em;line-height:1.02;margin:16px 0 0;color:#102033}.events-page-intro p{color:#526173;font-size:17px;line-height:1.7;font-weight:750}.events-layout{width:min(1360px,calc(100% - 44px));margin:0 auto 86px;display:grid;grid-template-columns:340px 1fr;gap:30px;align-items:start}.filter-panel{position:sticky;top:92px;display:flex;flex-direction:column;gap:16px}.filter-card{background:rgba(255,255,255,.94);border:1px solid #dbe8e3;border-radius:28px;padding:22px;box-shadow:0 20px 55px rgba(15,58,50,.08)}.title-card{background:linear-gradient(145deg,#fff,#effaf5)}.title-card>div{display:flex;gap:13px;align-items:center}.mini-icon{width:44px;height:44px;border-radius:16px;background:#07584e;color:#ffc425;display:grid;place-items:center;font-size:22px}.title-card h2{font-size:30px;margin:0;letter-spacing:-.04em;color:#073f39}.title-card p{margin:13px 0 0;color:#667085;line-height:1.6;font-weight:760}.filter-title-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.filter-title-row h3,.filter-card h3{margin:0;color:#102033;font-size:18px}.filter-title-row span{font-size:12px;font-weight:950;color:#07584e;background:#eef8f4;border-radius:999px;padding:6px 9px}.category-list{display:grid;gap:9px}.category-option{border:1px solid #dbe8e3;background:#fff;border-radius:16px;padding:11px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;color:#102033;font-weight:850;cursor:pointer;text-align:left}.category-option small{background:#eef8f4;color:#07584e;border-radius:999px;padding:4px 8px;font-weight:950}.category-option.selected{background:#07584e;color:#fff;border-color:#07584e}.category-option.selected small{background:#ffc425;color:#053f38}.compact-card{display:grid;gap:14px}.select-label{display:grid;gap:8px}.select-label span{font-size:12px;font-weight:1000;color:#667085;text-transform:uppercase;letter-spacing:.08em}.select-label select{width:100%;border:1px solid #dbe8e3;border-radius:16px;padding:14px;background:#fff;color:#102033;font-size:15px;font-weight:850;outline:none}.select-label select:focus{border-color:#0d7c6c;box-shadow:0 0 0 4px rgba(13,124,108,.10)}.quick-filter{width:100%;border:1px solid #dbe8e3;background:#fff;border-radius:17px;padding:14px;display:flex;justify-content:space-between;align-items:center;font-weight:900;color:#102033;cursor:pointer;margin-top:10px}.quick-filter strong{color:#667085}.quick-filter.on{background:#ecfff7;border-color:#9de4ca;color:#07584e}.quick-filter.on strong{color:#07584e}.clear-btn{border:none;border-radius:18px;background:#ffd8d8;color:#9a1111;padding:15px;font-weight:1000;cursor:pointer}.events-content{min-width:0}.section-heading-row,.results-heading{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:20px}.section-heading-row h2,.results-heading h2{font-size:clamp(30px,3.4vw,48px);letter-spacing:-.055em;line-height:1.04;margin:13px 0 0;color:#102033}.partner-link{background:#07584e;color:#fff;text-decoration:none;border-radius:999px;padding:14px 18px;font-weight:950;white-space:nowrap;box-shadow:0 16px 36px rgba(7,88,78,.16)}.featured-events-grid{display:grid;grid-template-columns:1.25fr .9fr .9fr;gap:18px;margin-bottom:28px}.feature-card{position:relative;min-height:330px;border-radius:30px;overflow:hidden;background:#093d38;box-shadow:0 24px 70px rgba(8,58,50,.15)}.feature-card:first-child{min-height:390px}.feature-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 5s ease}.feature-card:hover img{transform:scale(1.05)}.feature-gradient{position:absolute;inset:0;background:linear-gradient(0deg,rgba(2,46,42,.88),rgba(2,46,42,.18),rgba(255,255,255,.02))}.feature-body{position:absolute;inset:auto 20px 20px;color:#fff}.feature-body span{display:inline-block;border-radius:999px;background:rgba(255,255,255,.88);color:#07584e;padding:8px 12px;font-size:12px;font-weight:1000}.feature-body h3{font-size:28px;margin:13px 0 8px;line-height:1.03;letter-spacing:-.04em}.feature-body p{color:#e8fffb;font-weight:850}.feature-body a{display:inline-block;margin-top:8px;color:#053f38;background:#ffc425;text-decoration:none;padding:11px 15px;border-radius:15px;font-weight:1000}.results-panel{background:rgba(255,255,255,.86);border:1px solid #dbe8e3;border-radius:32px;padding:24px;box-shadow:0 22px 60px rgba(15,58,50,.08)}.results-heading{margin-bottom:14px}.results-heading p{color:#07584e;background:#effaf5;border:1px solid #dbe8e3;border-radius:999px;padding:10px 14px;font-weight:950}.active-chips{display:flex;gap:9px;flex-wrap:wrap;margin:6px 0 18px}.active-chips span{border:1px solid #dbe8e3;background:#fff;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:900;color:#07584e}.active-chips button{border:none;background:#ffd8d8;color:#9a1111;border-radius:999px;padding:8px 12px;font-weight:950;cursor:pointer}.soft-alert{background:#fff8df;border:1px solid #ffe29c;color:#76540a;border-radius:18px;padding:13px 15px;font-weight:850;margin-bottom:16px}.event-results-grid{display:grid;gap:18px}.event-card{position:relative;display:grid;grid-template-columns:120px 255px 1fr;background:#fff;border:1px solid #dbe8e3;border-radius:28px;overflow:hidden;box-shadow:0 16px 42px rgba(15,58,50,.08)}.event-date-tile{background:#07584e;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:18px}.event-date-tile strong{font-size:31px;line-height:1;color:#ffc425}.event-date-tile span{margin-top:10px;font-size:12px;font-weight:900;line-height:1.4}.event-image-box{position:relative;min-height:250px}.event-image-box img{width:100%;height:100%;object-fit:cover}.event-image-box span{position:absolute;left:14px;top:14px;background:#fff;color:#07584e;border-radius:999px;padding:8px 11px;font-size:12px;font-weight:1000;box-shadow:0 10px 26px rgba(0,0,0,.13)}.event-info{padding:24px}.event-meta-row{display:flex;gap:8px;flex-wrap:wrap}.event-meta-row span{background:#effaf5;border:1px solid #dbe8e3;color:#07584e;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900}.event-info h3{font-size:30px;margin:14px 0 8px;letter-spacing:-.045em;color:#102033}.event-info p{color:#526173;line-height:1.65;font-weight:720}.event-detail-list{display:grid;gap:7px;margin-top:13px;color:#455568;font-weight:800}.event-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.event-tags span{background:#fff7df;color:#674a05;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:950}.event-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.event-actions a{border:1px solid #cfe1dc;border-radius:15px;text-decoration:none;color:#07584e;background:#fff;padding:12px 14px;font-weight:1000}.event-actions .primary-action{background:#07584e;color:#fff;border-color:#07584e}.empty-results{background:#fff;border:1px dashed #b9d5cc;border-radius:28px;padding:48px;text-align:center}.empty-results span{font-size:48px}.empty-results h3{font-size:26px;margin:12px 0;color:#102033}.empty-results p{color:#667085;font-weight:750}.empty-results button{border:none;border-radius:16px;background:#07584e;color:white;padding:13px 18px;font-weight:1000;cursor:pointer}@media(max-width:1180px){.hero-shell{grid-template-columns:1fr}.hero-feature-card{min-height:260px}.events-page-intro,.events-layout{grid-template-columns:1fr}.filter-panel{position:static}.featured-events-grid{grid-template-columns:1fr}.event-card{grid-template-columns:110px 220px 1fr}}@media(max-width:820px){.events-hero-block{padding:54px 18px 40px;border-bottom-left-radius:28px;border-bottom-right-radius:28px}.hero-copy h1{font-size:50px}.hero-search{grid-template-columns:auto 1fr}.hero-search button{grid-column:1/-1;padding:15px}.hero-stats{grid-template-columns:repeat(2,1fr)}.events-tabs,.events-page-intro,.events-layout{width:calc(100% - 24px)}.events-tabs a,.events-tabs button{flex:1 1 160px;text-align:center}.event-card{grid-template-columns:1fr}.event-date-tile{align-items:flex-start;text-align:left}.event-image-box{height:250px}.results-panel{padding:16px}.section-heading-row,.results-heading{align-items:flex-start;flex-direction:column}.featured-events-grid{gap:14px}.feature-card,.feature-card:first-child{min-height:320px}}@media(max-width:520px){.hero-stats{grid-template-columns:1fr}.hero-feature-card{padding:22px}.hero-feature-card h2{font-size:28px}.events-page-intro h2{font-size:34px}.filter-card,.event-info{padding:18px}.event-info h3{font-size:25px}.partner-link{width:100%;text-align:center}.hero-copy h1{font-size:42px}}

/* compact first-screen landing fix - keeps event filters/search/tabs visible at 100% zoom */
@media (min-width:1024px){
  .events-hero-block{
    min-height:min(560px,calc(100vh - 118px));
    padding:38px min(6vw,96px) 54px;
    border-bottom-left-radius:34px;
    border-bottom-right-radius:34px;
  }
  .hero-shell{
    grid-template-columns:minmax(0,1.1fr) 380px;
    gap:34px;
  }
  .event-kicker{
    padding:8px 14px;
    font-size:11px;
    letter-spacing:.13em;
  }
  .hero-copy h1{
    font-size:clamp(44px,5.5vw,74px);
    line-height:.95;
    margin:18px 0 14px;
    max-width:760px;
  }
  .hero-copy p{
    max-width:720px;
    font-size:clamp(15px,1.2vw,18px);
    line-height:1.55;
  }
  .hero-search{
    margin-top:20px;
    width:min(760px,100%);
    padding:10px 12px;
    border-radius:22px;
  }
  .search-icon{font-size:22px;}
  .hero-search input{font-size:15px;}
  .hero-search button{
    padding:12px 22px;
    border-radius:17px;
  }
  .hero-feature-card{
    min-height:320px;
    border-radius:28px;
  }
  .hero-feature-content{
    left:24px;
    right:24px;
    bottom:24px;
  }
  .live-pill{padding:8px 12px;font-size:11px;}
  .hero-feature-card h2{
    font-size:clamp(25px,2.3vw,32px);
    margin:16px 0 8px;
  }
  .hero-feature-card p{font-size:14px;}
  .hero-feature-footer{margin-top:12px;gap:8px;}
  .hero-feature-footer span{padding:7px 10px;font-size:11px;}
  .hero-stats{
    margin-top:22px;
    gap:12px;
  }
  .hero-stats div{
    padding:14px 18px;
    border-radius:18px;
  }
  .hero-stats strong{font-size:30px;}
  .hero-stats span{font-size:11px;margin-top:5px;}
  .events-tabs{
    margin:-36px auto 28px;
  }
  .events-tabs a,
  .events-tabs button{
    padding:12px 22px;
  }
}
@media (min-width:1024px) and (max-height:760px){
  .events-hero-block{
    min-height:520px;
    padding-top:30px;
    padding-bottom:48px;
  }
  .hero-copy h1{font-size:clamp(40px,5vw,66px);}
  .hero-feature-card{min-height:290px;}
  .hero-stats div{padding:12px 16px;}
}


/* extra compact hero v2 - reduces event top section height more for 100% browser zoom */
@media (min-width:1024px){
  .events-hero-block{
    min-height:450px !important;
    padding:24px min(5.2vw,84px) 34px !important;
    border-bottom-left-radius:28px !important;
    border-bottom-right-radius:28px !important;
  }
  .hero-shell{
    grid-template-columns:minmax(0,1.08fr) 340px !important;
    gap:28px !important;
  }
  .event-kicker{
    padding:7px 12px !important;
    font-size:10px !important;
    letter-spacing:.11em !important;
  }
  .hero-copy h1{
    font-size:clamp(36px,4.7vw,62px) !important;
    line-height:.94 !important;
    margin:12px 0 10px !important;
    max-width:680px !important;
  }
  .hero-copy p{
    max-width:650px !important;
    font-size:14px !important;
    line-height:1.45 !important;
    margin:0 !important;
  }
  .hero-search{
    margin-top:14px !important;
    width:min(650px,100%) !important;
    padding:8px 10px !important;
    border-radius:19px !important;
    gap:8px !important;
  }
  .search-icon{font-size:19px !important;padding-left:6px !important;}
  .hero-search input{font-size:13.5px !important;}
  .hero-search button{
    padding:10px 18px !important;
    border-radius:15px !important;
    font-size:13px !important;
  }
  .hero-feature-card{
    min-height:255px !important;
    border-radius:24px !important;
  }
  .hero-feature-content{
    left:18px !important;
    right:18px !important;
    bottom:18px !important;
  }
  .live-pill{padding:6px 10px !important;font-size:10px !important;}
  .hero-feature-card h2{
    font-size:clamp(21px,2vw,28px) !important;
    margin:10px 0 6px !important;
  }
  .hero-feature-card p{font-size:12.5px !important;}
  .hero-feature-footer{margin-top:8px !important;gap:6px !important;}
  .hero-feature-footer span{padding:6px 9px !important;font-size:10px !important;}
  .hero-stats{
    margin-top:14px !important;
    gap:10px !important;
  }
  .hero-stats div{
    padding:9px 14px !important;
    border-radius:16px !important;
  }
  .hero-stats strong{font-size:26px !important;}
  .hero-stats span{font-size:9.5px !important;margin-top:3px !important;}
  .events-tabs{
    margin:-25px auto 24px !important;
  }
  .events-tabs a,
  .events-tabs button{
    padding:10px 18px !important;
    font-size:13px !important;
  }
}
@media (min-width:1024px) and (max-height:760px){
  .events-hero-block{
    min-height:420px !important;
    padding-top:20px !important;
    padding-bottom:30px !important;
  }
  .hero-copy h1{font-size:clamp(34px,4.1vw,54px) !important;}
  .hero-feature-card{min-height:230px !important;}
  .hero-stats div{padding:8px 12px !important;}
}

`;

export default EventsPage;
