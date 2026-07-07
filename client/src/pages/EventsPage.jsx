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
import { getTouristEvents } from "../services/exploreService";

const getEventImage = (event) => event.imageUrl || event.image_url || event.image;

function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState(tourismEvents);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") || searchParams.get("city") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [month, setMonth] = useState(searchParams.get("month") || "All Months");
  const [price, setPrice] = useState(searchParams.get("price") || "Any Price");

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const rows = await getTouristEvents();
        setEvents(rows.length ? rows.map(normaliseEvent) : tourismEvents);
      } catch (err) {
        console.warn("Using fallback event data:", err.message);
        setEvents(tourismEvents);
        setError("Showing demo event data because the event API is not reachable.");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("search") || searchParams.get("city") || "");
    setCategory(searchParams.get("category") || "All");
    setMonth(searchParams.get("month") || "All Months");
    setPrice(searchParams.get("price") || "Any Price");
  }, [searchParams]);

  const syncParams = (next = {}) => {
    const nextSearch = next.search ?? search;
    const nextCategory = next.category ?? category;
    const nextMonth = next.month ?? month;
    const nextPrice = next.price ?? price;
    const params = new URLSearchParams();

    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextCategory !== "All") params.set("category", nextCategory);
    if (nextMonth !== "All Months") params.set("month", nextMonth);
    if (nextPrice !== "Any Price") params.set("price", nextPrice);

    setSearchParams(params);
  };

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events
      .map(normaliseEvent)
      .filter((event) => {
        const matchesSearch = !query || buildEventSearchText(event).includes(query);
        const matchesCategory = category === "All" || event.category === category;
        const matchesMonth = month === "All Months" || event.monthName === month;
        const matchesPrice = price === "Any Price" || event.priceType === price;
        return matchesSearch && matchesCategory && matchesMonth && matchesPrice;
      });
  }, [category, events, month, price, search]);

  const featuredEvents = useMemo(
    () => events.map(normaliseEvent).filter((event) => event.featured).slice(0, 3),
    [events]
  );

  const resultTitle = search || category !== "All" || month !== "All Months" || price !== "Any Price"
    ? "Search Results"
    : "Recommended Events in Sri Lanka";

  const handleSubmit = (event) => {
    event.preventDefault();
    syncParams();
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setMonth("All Months");
    setPrice("Any Price");
    setSearchParams({});
  };

  return (
    <main className="events-page">
      <style>{eventsCss}</style>

      <section className="events-hero-block">
        <div className="hero-copy">
          <span className="eyebrow">TourismHub LK Experiences</span>
          <h1>Events & Experiences</h1>
          <p>
            Discover cultural nights, food walks, coastal evenings, nature experiences, and destination
            activities that tourists can connect with hotels and Explore places.
          </p>
        </div>

        <form className="hero-search" onSubmit={handleSubmit}>
          <label>
            <span>Search event, city, hotel, or place</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Example: Kandy, Cinnamon Grand, beach music..."
            />
          </label>
          <button type="submit">Search Events</button>
        </form>
      </section>

      <section className="events-tabs" aria-label="Event page sections">
        <button type="button" className="active">Events & Experiences</button>
        <Link to="/explore">Explore Places</Link>
        <Link to="/tourist-guides">Tourist Guides</Link>
        <Link to="/hotels">Hotels Nearby</Link>
      </section>

      <section className="events-layout">
        <aside className="filter-panel">
          <div className="filter-card title-card">
            <h2>Filter By</h2>
            <p>Use tourist-friendly filters to find the right experience.</p>
          </div>

          <div className="filter-card">
            <h3>Event Type</h3>
            <div className="checkbox-stack">
              {eventCategories.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={category === item ? "filter-option selected" : "filter-option"}
                  onClick={() => {
                    setCategory(item);
                    syncParams({ category: item });
                  }}
                >
                  <span>{category === item ? "✓" : ""}</span>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-card">
            <label className="select-label">
              <span>Month</span>
              <select
                value={month}
                onChange={(event) => {
                  setMonth(event.target.value);
                  syncParams({ month: event.target.value });
                }}
              >
                {eventMonths.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="filter-card">
            <label className="select-label">
              <span>Budget</span>
              <select
                value={price}
                onChange={(event) => {
                  setPrice(event.target.value);
                  syncParams({ price: event.target.value });
                }}
              >
                {eventPriceFilters.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <button type="button" className="clear-btn" onClick={clearFilters}>Clear all filters</button>
        </aside>

        <section className="events-content">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow dark">Featured tourist picks</span>
              <h2>Professional event discovery for your journey</h2>
            </div>
            <p>{filteredEvents.length} event result{filteredEvents.length === 1 ? "" : "s"}</p>
          </div>

          {featuredEvents.length ? (
            <div className="featured-events-grid">
              {featuredEvents.map((event) => (
                <article className="feature-card" key={event.slug}>
                  <img src={getEventImage(event)} alt={event.title} />
                  <div className="feature-gradient" />
                  <div className="feature-body">
                    <span>{event.category}</span>
                    <h3>{event.title}</h3>
                    <p>{event.city} · {event.dateLabel} · {event.priceLabel}</p>
                    <Link to={event.explorePlaceId ? `/explore/${event.explorePlaceId}?focusEvent=${event.slug}#things-to-do` : `/events/${event.slug}`}>
                      View in Things to Do
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <div className="results-heading">
            <h2>{resultTitle}</h2>
            {error ? <span>{error}</span> : loading ? <span>Loading events...</span> : null}
          </div>

          {filteredEvents.length ? (
            <div className="event-results-grid">
              {filteredEvents.map((event) => (
                <article className="event-card" key={event.slug}>
                  <div className="event-image-box">
                    <img src={getEventImage(event)} alt={event.title} />
                    <span>{event.category}</span>
                  </div>

                  <div className="event-info">
                    <div className="event-meta-row">
                      <span>📍 {event.city}</span>
                      <span>🗓 {event.monthName}</span>
                      <span>💰 {event.priceLabel}</span>
                    </div>
                    <h3>{event.title}</h3>
                    <p>{event.shortDescription}</p>

                    <div className="event-detail-list">
                      <span>🏛 {event.venue}</span>
                      <span>⏱ {event.dateLabel} · {event.timeLabel}</span>
                      <span>🏨 Near {event.nearHotels?.slice(0, 2).join(", ")}</span>
                    </div>

                    <div className="event-actions">
                      <Link
                        className="primary-action"
                        to={event.explorePlaceId ? `/explore/${event.explorePlaceId}?focusEvent=${event.slug}#things-to-do` : `/events/${event.slug}`}
                      >
                        View Details
                      </Link>
                      <Link to={`/hotels?city=${encodeURIComponent(event.city)}`}>Find Hotels</Link>
                      <a href={event.mapUrl} target="_blank" rel="noreferrer">Directions</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <span>🔎</span>
              <h3>No events found for the selected filters.</h3>
              <p>Try another city, hotel name, category, month, or budget level.</p>
              <button type="button" onClick={clearFilters}>Show all events</button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const eventsCss = `
.events-page{min-height:100vh;background:#f5f7f6;color:#101828;font-family:Inter,system-ui,Arial,sans-serif}.events-hero-block{position:relative;overflow:hidden;background:linear-gradient(135deg,#f8fafc 0%,#ffffff 48%,#e8f7f4 100%);padding:72px min(10vw,120px) 52px}.events-hero-block:after{content:"";position:absolute;right:-120px;bottom:-180px;width:640px;height:640px;border-radius:50%;background:radial-gradient(circle,rgba(5,132,152,.14),transparent 65%)}.hero-copy{position:relative;z-index:1;max-width:850px}.eyebrow{display:inline-flex;align-items:center;gap:8px;background:#007ea4;color:white;border-radius:999px;padding:9px 16px;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.eyebrow.dark{background:#e5f6f4;color:#006777}.hero-copy h1{font-size:clamp(46px,7vw,84px);line-height:.95;margin:20px 0 18px;letter-spacing:-.055em;color:#0b1720}.hero-copy p{font-size:clamp(17px,2vw,21px);line-height:1.75;max-width:760px;color:#344054;font-weight:650}.hero-search{position:relative;z-index:2;margin-top:28px;display:grid;grid-template-columns:1fr auto;gap:14px;width:min(900px,100%);background:white;border:1px solid #d9e9ea;border-radius:26px;padding:14px;box-shadow:0 24px 70px rgba(15,23,42,.10)}.hero-search label{display:grid;gap:6px}.hero-search span,.select-label span{font-size:12px;font-weight:950;color:#667085;text-transform:uppercase;letter-spacing:.06em}.hero-search input,.select-label select{border:1px solid #d0d5dd;border-radius:16px;padding:15px 16px;font-size:16px;outline:none;background:#fff}.hero-search input:focus,.select-label select:focus{border-color:#007ea4;box-shadow:0 0 0 4px rgba(0,126,164,.11)}.hero-search button{border:none;border-radius:18px;background:#007ea4;color:white;padding:0 28px;font-weight:950;font-size:15px;cursor:pointer}.events-tabs{width:min(1220px,calc(100% - 36px));margin:34px auto 0;display:flex;gap:18px;justify-content:flex-end;flex-wrap:wrap}.events-tabs a,.events-tabs button{border:2px solid #007ea4;color:#007ea4;background:white;border-radius:999px;text-decoration:none;padding:15px 28px;font-weight:850;box-shadow:0 12px 30px rgba(15,23,42,.05)}.events-tabs .active{background:#007ea4;color:white}.events-layout{width:min(1220px,calc(100% - 36px));margin:34px auto 80px;display:grid;grid-template-columns:310px 1fr;gap:30px}.filter-panel{display:flex;flex-direction:column;gap:18px}.filter-card{background:white;border:1px solid #e3e8ef;border-radius:28px;padding:24px;box-shadow:0 22px 55px rgba(15,23,42,.08)}.title-card h2{font-size:32px;margin:0 0 8px;letter-spacing:-.04em}.title-card p{margin:0;color:#667085;line-height:1.6;font-weight:650}.filter-card h3{margin:0 0 16px;color:#111827;font-size:17px}.checkbox-stack{display:grid;gap:11px}.filter-option{border:none;background:transparent;text-align:left;display:flex;align-items:center;gap:11px;color:#2e3440;font-weight:760;cursor:pointer;padding:4px 0}.filter-option span{width:21px;height:21px;border:1.8px solid #b9c3cf;border-radius:6px;display:grid;place-items:center;color:white;font-size:13px}.filter-option.selected span{background:#007ea4;border-color:#007ea4}.filter-option.selected{color:#006777}.select-label{display:grid;gap:10px}.clear-btn{border:1px solid #e3e8ef;background:#0b1720;color:white;border-radius:18px;padding:14px;font-weight:950;cursor:pointer}.events-content{min-width:0}.section-heading-row{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:22px}.section-heading-row h2,.results-heading h2{font-size:clamp(30px,4vw,44px);letter-spacing:-.05em;margin:12px 0 0;color:#0b1720}.section-heading-row p,.results-heading span{color:#667085;font-weight:850}.featured-events-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:34px}.feature-card{position:relative;min-height:315px;border-radius:30px;overflow:hidden;box-shadow:0 24px 70px rgba(15,23,42,.16);background:#111827}.feature-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.feature-gradient{position:absolute;inset:0;background:linear-gradient(0deg,rgba(2,32,37,.94),rgba(2,32,37,.25),rgba(2,32,37,.08))}.feature-body{position:absolute;inset:auto 20px 20px;color:white}.feature-body span{display:inline-block;border-radius:999px;background:rgba(255,255,255,.18);padding:7px 10px;font-size:12px;font-weight:900}.feature-body h3{font-size:25px;margin:12px 0 8px;line-height:1.05}.feature-body p{color:#d7f1ee;font-weight:800}.feature-body a{display:inline-block;margin-top:8px;color:#082f34;background:#facc15;text-decoration:none;padding:10px 14px;border-radius:14px;font-weight:950}.results-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}.event-results-grid{display:grid;gap:18px}.event-card{display:grid;grid-template-columns:260px 1fr;background:white;border:1px solid #e3e8ef;border-radius:28px;overflow:hidden;box-shadow:0 22px 60px rgba(15,23,42,.08)}.event-image-box{position:relative;min-height:245px}.event-image-box img{width:100%;height:100%;object-fit:cover}.event-image-box span{position:absolute;left:15px;top:15px;background:#007ea4;color:white;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:950}.event-info{padding:24px}.event-meta-row{display:flex;gap:9px;flex-wrap:wrap}.event-meta-row span{background:#f2f7f7;border:1px solid #deebeb;color:#006777;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900}.event-info h3{font-size:28px;margin:15px 0 8px;color:#101828;letter-spacing:-.035em}.event-info p{color:#596579;line-height:1.7;font-weight:650}.event-detail-list{display:grid;gap:7px;margin-top:16px;color:#425466;font-weight:780}.event-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.event-actions a{border:1px solid #d0d5dd;border-radius:14px;text-decoration:none;color:#006777;padding:11px 14px;font-weight:950}.event-actions .primary-action{background:#007ea4;color:white;border-color:#007ea4}.empty-results{background:white;border:1px solid #e3e8ef;border-radius:28px;padding:48px;text-align:center;box-shadow:0 22px 55px rgba(15,23,42,.08)}.empty-results span{font-size:46px}.empty-results h3{font-size:26px;margin:12px 0}.empty-results p{color:#667085;font-weight:700}.empty-results button{border:none;border-radius:16px;background:#007ea4;color:white;padding:13px 18px;font-weight:950;cursor:pointer}@media(max-width:1020px){.events-layout{grid-template-columns:1fr}.filter-panel{position:static}.featured-events-grid{grid-template-columns:1fr}.event-card{grid-template-columns:1fr}.event-image-box{height:260px}.section-heading-row,.results-heading{align-items:flex-start;flex-direction:column}.hero-search{grid-template-columns:1fr}.hero-search button{padding:15px}.events-tabs{justify-content:flex-start}}@media(max-width:640px){.events-hero-block{padding:54px 18px}.events-tabs,.events-layout{width:calc(100% - 24px)}.events-tabs a,.events-tabs button{width:100%;text-align:center}.filter-card,.event-info{padding:20px}.hero-copy h1{font-size:48px}}
`;

export default EventsPage;
