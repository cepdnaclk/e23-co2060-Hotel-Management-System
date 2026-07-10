import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { buildEventDirectionsUrl, buildEventMapEmbedUrl, normaliseEvent, tourismEvents } from "../data/eventData";
import { assetUrl, getTouristEvents } from "../services/exploreService";
import { readTripItems, SAVED_TRIP_EVENT, toggleTripItem } from "../utils/tripBasket";

const getImage = (event) => event.imageUrl || event.image_url || event.image;
const getDirectionsUrl = (event) => event.mapUrl || event.map_url || buildEventDirectionsUrl(event);
const getMapEmbedUrl = (event) => event.mapEmbedUrl || event.map_embed_url || buildEventMapEmbedUrl(event);

const buildEventTripItem = (event) => ({
  id: `event-${event.slug || event.id}`,
  sourceId: event.id || event.event_id || event.slug,
  tripItemType: "event",
  name: event.title,
  city: event.city || "",
  district: event.district || "",
  venue: event.venue || "",
  region: event.category || "Event",
  image: assetUrl(getImage(event)),
  duration: event.duration || event.timeLabel || "Event",
  bestTime: event.dateLabel || event.monthName || "Check event date",
  budget: event.priceType || "Event",
  estimatedCost: Number(event.price || 0),
  shortDescription: event.shortDescription || "Selected event for this Sri Lanka trip.",
  link: `/events/${event.slug}`,
  eventDate: event.dateLabel || "",
  eventMonth: event.monthName || "",
});

function EventDetailsPage() {
  const { id } = useParams();
  const [events, setEvents] = useState(tourismEvents);
  const [savedTripItems, setSavedTripItems] = useState(readTripItems);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getTouristEvents()
      .then((rows) => {
        if (rows.length) setEvents(rows.map(normaliseEvent));
      })
      .catch(() => setEvents(tourismEvents));
  }, []);

  const event = useMemo(
    () => events.map(normaliseEvent).find((item) => item.slug === id || item.id === id),
    [events, id]
  );

  const similar = useMemo(() => {
    if (!event) return [];
    return events
      .map(normaliseEvent)
      .filter((item) => item.slug !== event.slug && (item.city === event.city || item.category === event.category))
      .slice(0, 3);
  }, [event, events]);

  useEffect(() => {
    const refreshSavedItems = () => setSavedTripItems(readTripItems());
    window.addEventListener("storage", refreshSavedItems);
    window.addEventListener(SAVED_TRIP_EVENT, refreshSavedItems);

    return () => {
      window.removeEventListener("storage", refreshSavedItems);
      window.removeEventListener(SAVED_TRIP_EVENT, refreshSavedItems);
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const isEventSaved = useMemo(
    () => (event ? savedTripItems.some((item) => String(item.id) === `event-${event.slug || event.id}`) : false),
    [savedTripItems, event]
  );

  const handleToggleEventTrip = () => {
    const item = buildEventTripItem(event);
    const result = toggleTripItem(item);
    setSavedTripItems(result.items);
    setNotice(
      result.saved
        ? `${event.title} added to your trip basket.`
        : `${event.title} removed from your trip basket.`
    );
  };

  if (!event) {
    return (
      <main className="event-detail-page">
        <style>{css}</style>
        <section className="not-found-card">
          <span>🌴</span>
          <h1>Event not found</h1>
          <p>This event may be unavailable. Please return to the Events page.</p>
          <Link to="/events">Back to Events</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="event-detail-page">
      <style>{css}</style>
      {notice ? <div className="event-detail-trip-toast">{notice}</div> : null}
      <section className="event-hero">
        <img src={getImage(event)} alt={event.title} />
        <div className="event-hero-shade" />
        <div className="event-hero-copy">
          <Link to="/events" className="back-link">← Back to Events</Link>
          <span>{event.category}</span>
          <h1>{event.title}</h1>
          <p>📍 {event.venue}, {event.city} · {event.dateLabel} · {event.priceLabel}</p>
          <div className="hero-actions">
            <a href={getDirectionsUrl(event)} target="_blank" rel="noreferrer">Get Directions</a>
            <Link to={`/hotels?city=${encodeURIComponent(event.city)}`}>Find Hotels Nearby</Link>
            <button
              type="button"
              className={isEventSaved ? "event-trip-btn saved" : "event-trip-btn"}
              onClick={handleToggleEventTrip}
            >
              {isEventSaved ? "Saved to trip" : "+ Add to trip"}
            </button>
          </div>
        </div>
      </section>

      <section className="event-detail-wrap">
        <aside className="quick-card">
          <h2>Event Summary</h2>
          <div><strong>City</strong><span>{event.city}</span></div>
          <div><strong>Month</strong><span>{event.monthName}</span></div>
          <div><strong>Time</strong><span>{event.timeLabel}</span></div>
          <div><strong>Duration</strong><span>{event.duration}</span></div>
          <div><strong>Budget</strong><span>{event.priceType}</span></div>
          <Link to={`/hotels?city=${encodeURIComponent(event.city)}`}>Find hotels nearby</Link>
        </aside>

        <div className="main-content">
          <section className="white-card">
            <h2>About this event</h2>
            <p>{event.description || event.shortDescription}</p>
          </section>

          <section className="white-card event-location-card">
            <div className="location-title-row">
              <div>
                <h2>Location & directions</h2>
                <p>{event.venue}, {event.city}{event.district ? `, ${event.district}` : ""}</p>
              </div>
              <a href={getDirectionsUrl(event)} target="_blank" rel="noreferrer">Open in Google Maps</a>
            </div>
            <iframe
              title={`${event.title} map`}
              src={getMapEmbedUrl(event)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </section>

          <section className="white-card">
            <h2>Highlights</h2>
            <div className="highlight-grid">
              {(event.highlights || []).map((item) => <span key={item}>✓ {item}</span>)}
            </div>
          </section>

          <section className="white-card">
            <h2>Nearby hotels tourists may search</h2>
            <div className="hotel-grid">
              {(event.nearHotels || []).map((hotel) => (
                <Link key={hotel} to={`/hotels?city=${encodeURIComponent(event.city)}&search=${encodeURIComponent(hotel)}`}>
                  🏨 {hotel}
                </Link>
              ))}
            </div>
          </section>

          {similar.length ? (
            <section className="white-card">
              <h2>Similar events</h2>
              <div className="similar-grid">
                {similar.map((item) => (
                  <Link to={`/events/${item.slug}`} key={item.slug}>
                    <img src={getImage(item)} alt={item.title} />
                    <strong>{item.title}</strong>
                    <span>{item.city} · {item.priceLabel}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}

const css = `
.event-detail-page{min-height:100vh;background:#f7faf8;color:#101828;font-family:Inter,system-ui,Arial,sans-serif}.event-hero{height:590px;position:relative;overflow:hidden}.event-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.event-hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(2,44,48,.92),rgba(2,44,48,.55),rgba(2,44,48,.1))}.event-hero-copy{position:absolute;left:min(8vw,110px);bottom:70px;max-width:860px;color:white}.back-link{display:inline-block;margin-bottom:18px;background:rgba(255,255,255,.16);color:white;text-decoration:none;border-radius:999px;padding:10px 14px;font-weight:900}.event-hero-copy span{display:inline-block;background:#facc15;color:#0f172a;border-radius:999px;padding:8px 13px;font-size:12px;font-weight:950;text-transform:uppercase}.event-hero-copy h1{font-size:clamp(44px,7vw,78px);line-height:.95;margin:18px 0;letter-spacing:-.055em}.event-hero-copy p{font-size:19px;font-weight:800;color:#e9fffb}.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}.hero-actions a{background:white;color:#006777;text-decoration:none;border-radius:16px;padding:13px 17px;font-weight:950}.hero-actions a:first-child{background:#007ea4;color:white}.hero-actions button.event-trip-btn{border:none;border-radius:16px;padding:13px 17px;font-weight:950;cursor:pointer;background:#ffc425;color:#063c38}.hero-actions button.event-trip-btn.saved{background:#e8fff5;color:#05614f;border:1px solid #64c8a8}.event-detail-trip-toast{position:fixed;right:22px;bottom:98px;z-index:78;background:#064e45;color:#fff;border-radius:16px;padding:14px 18px;box-shadow:0 18px 40px rgba(0,0,0,.18);font-weight:900}.event-location-card iframe{width:100%;height:360px;border:0;border-radius:20px;background:#e5e7eb}.location-title-row{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:16px}.location-title-row h2{margin-bottom:6px}.location-title-row p{margin:0!important;white-space:normal!important;color:#667085!important}.location-title-row a{white-space:nowrap;text-decoration:none;background:#007ea4;color:#fff;border-radius:14px;padding:12px 14px;font-weight:950}.event-detail-wrap{width:min(1200px,calc(100% - 36px));margin:-54px auto 80px;position:relative;z-index:3;display:grid;grid-template-columns:320px 1fr;gap:24px}.quick-card,.white-card{background:white;border:1px solid #e3e8ef;border-radius:28px;box-shadow:0 24px 70px rgba(15,23,42,.10)}.quick-card{padding:24px;height:max-content;position:sticky;top:24px}.quick-card h2,.white-card h2{margin:0 0 18px;color:#0b555a;letter-spacing:-.03em}.quick-card div{display:flex;justify-content:space-between;border-bottom:1px solid #eef2f6;padding:13px 0;gap:16px}.quick-card strong{color:#667085}.quick-card span{text-align:right;font-weight:900}.quick-card a{display:block;margin-top:16px;text-align:center;text-decoration:none;background:#007ea4;color:white;padding:14px;border-radius:16px;font-weight:950}.main-content{display:grid;gap:20px}.white-card{padding:26px}.white-card p{line-height:1.9;color:#4b5565;font-weight:650}.highlight-grid,.hotel-grid{display:flex;flex-wrap:wrap;gap:10px}.highlight-grid span,.hotel-grid a{background:#f0faf9;border:1px solid #d6eeee;color:#006777;border-radius:999px;padding:10px 13px;text-decoration:none;font-weight:900}.similar-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.similar-grid a{border:1px solid #e3e8ef;border-radius:20px;overflow:hidden;text-decoration:none;color:#101828;background:#fbfdfd}.similar-grid img{width:100%;height:140px;object-fit:cover}.similar-grid strong,.similar-grid span{display:block;padding:0 14px}.similar-grid strong{margin-top:12px}.similar-grid span{padding-bottom:14px;color:#667085;font-weight:800}@media(max-width:900px){.location-title-row{flex-direction:column}.event-detail-wrap{grid-template-columns:1fr}.quick-card{position:static}.similar-grid{grid-template-columns:1fr}.event-hero-copy{left:22px;right:22px}.event-hero{height:520px}}
`;

export default EventDetailsPage;
