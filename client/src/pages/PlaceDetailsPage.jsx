import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  assetUrl,
  formatLkr,
  getExplorePlace,
  getTouristEventsByPlace,
} from "../services/exploreService";
import { getFallbackEventsByPlace, normaliseEvent } from "../data/eventData";
import { readTripItems, SAVED_TRIP_EVENT, toggleTripItem } from "../utils/tripBasket";

const getEventImage = (event) => event.imageUrl || event.image_url || event.image;

const toCoordinateNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const hasMapCoordinates = (place) => {
  return toCoordinateNumber(place?.lat) !== null && toCoordinateNumber(place?.lng) !== null;
};

const getOpenStreetMapEmbedUrl = (lat, lng) => {
  const latitude = toCoordinateNumber(lat);
  const longitude = toCoordinateNumber(lng);

  if (latitude === null || longitude === null) return "";

  const zoomSize = 0.018;
  const left = longitude - zoomSize;
  const right = longitude + zoomSize;
  const bottom = latitude - zoomSize;
  const top = latitude + zoomSize;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
};

const getDirectionsUrl = (lat, lng) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
};

export default function PlaceDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const thingsToDoRef = useRef(null);
  const focusedEventSlug = new URLSearchParams(location.search).get("focusEvent");

  const [place, setPlace] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [savedTripItems, setSavedTripItems] = useState(readTripItems);

  useEffect(() => {
    const loadPlace = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getExplorePlace(id);
        setPlace(data);
        setMainImage(data.image || data.images?.[0] || "");
      } catch (err) {
        setError(err.response?.data?.message || "Place not found");
      } finally {
        setLoading(false);
      }
    };

    loadPlace();
  }, [id]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setEventsLoading(true);
        const rows = await getTouristEventsByPlace(id);
        setEvents(rows.map(normaliseEvent));
      } catch (err) {
        setEvents(getFallbackEventsByPlace(id).map(normaliseEvent));
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, [id]);

  const sortedEvents = useMemo(() => {
    const mapped = events.map(normaliseEvent);
    if (!focusedEventSlug) return mapped;
    return [...mapped].sort((a, b) => {
      if (a.slug === focusedEventSlug) return -1;
      if (b.slug === focusedEventSlug) return 1;
      return 0;
    });
  }, [events, focusedEventSlug]);

  useEffect(() => {
    if (focusedEventSlug && !eventsLoading && thingsToDoRef.current) {
      window.setTimeout(() => {
        thingsToDoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [eventsLoading, focusedEventSlug]);

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

  const isPlaceSaved = useMemo(
    () => savedTripItems.some((item) => String(item.id) === String(place?.id)),
    [savedTripItems, place]
  );

  const handleToggleSaveTrip = () => {
    const result = toggleTripItem(place);
    setSavedTripItems(result.items);
    setNotice(result.saved ? `✓ ${place.name} added to your trip.` : `${place.name} removed from your trip.`);
  };

  if (loading) {
    return <main className="place-detail-page"><style>{css}</style><div className="state">Loading place details...</div></main>;
  }

  if (error || !place) {
    return <main className="place-detail-page"><style>{css}</style><div className="state error">{error || "Place not found"}</div></main>;
  }

  const placeHasMap = hasMapCoordinates(place);

  return (
    <main className="place-detail-page">
      <style>{css}</style>
      {notice ? <div className="detail-toast">{notice}</div> : null}

      <section className="detail-hero">
        <img src={assetUrl(mainImage)} alt={place.name} />
        <div className="detail-hero-overlay" />
        <div className="detail-hero-content">
          <Link to="/explore" className="back-link">← Back to Explore</Link>
          <span>{place.categoryIcon} {place.categoryLabel || place.category}</span>
          <h1>{place.name}</h1>
          <p>📍 {place.city}, {place.district} · {place.region}</p>
        </div>
      </section>

      <section className="detail-wrap">
        <aside className="quick-card">
          <h3>Travel Info</h3>
          <div><strong>⏱ Duration</strong><span>{place.duration}</span></div>
          <div><strong>🗓 Best time</strong><span>{place.bestTime}</span></div>
          <div><strong>💰 Cost</strong><span>{formatLkr(place.estimatedCost)}</span></div>
          <div><strong>🎯 Budget</strong><span>{place.budget}</span></div>
          <div><strong>🕒 Opening</strong><span>{place.openingHours}</span></div>
          <div><strong>🎫 Entry</strong><span>{place.entryFee}</span></div>
          <button
            type="button"
            className={isPlaceSaved ? "saved-trip-btn" : ""}
            onClick={handleToggleSaveTrip}
          >
            {isPlaceSaved ? "Saved to trip" : "+ Save to trip"}
          </button>
          <Link to={`/hotels?city=${encodeURIComponent(place.city)}`}>Find Hotels</Link>
          <Link to="/events" className="secondary-link">Browse Events</Link>
          {placeHasMap ? (
            <a href={getDirectionsUrl(place.lat, place.lng)} target="_blank" rel="noreferrer" className="map-link">Open Map</a>
          ) : null}
        </aside>

        <div className="detail-main">
          <section className="white-card">
            <h2>Overview</h2>
            <p>{place.fullDescription || place.shortDescription}</p>
            <div className="tags">{(place.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
          </section>

          {placeHasMap ? (
            <section className="white-card location-map-card">
              <div className="card-title-row map-title-row">
                <div>
                  <span className="section-kicker">Location</span>
                  <h2>Find it on the Map</h2>
                </div>
                <a href={getDirectionsUrl(place.lat, place.lng)} target="_blank" rel="noreferrer">Open directions →</a>
              </div>
              <iframe
                title={`${place.name} location map`}
                src={getOpenStreetMapEmbedUrl(place.lat, place.lng)}
                loading="lazy"
              />
              <p className="map-note">📍 {place.name} is marked using the coordinates added by the admin.</p>
            </section>
          ) : null}

          {place.images?.length ? (
            <section className="white-card">
              <h2>Photos</h2>
              <div className="gallery-row">
                {place.images.map((image) => (
                  <button key={image} type="button" onClick={() => setMainImage(image)}>
                    <img src={assetUrl(image)} alt={place.name} />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {place.highlights?.length ? (
            <section className="white-card">
              <h2>Highlights</h2>
              <div className="highlight-grid">
                {place.highlights.map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    <span>{item.icon || "✨"}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="white-card things-to-do-card" id="things-to-do" ref={thingsToDoRef}>
            <div className="card-title-row">
              <div>
                <span className="section-kicker">Explore → View Details</span>
                <h2>Things to Do</h2>
              </div>
              <Link to={`/events?city=${encodeURIComponent(place.city)}`}>See all events →</Link>
            </div>

            {eventsLoading ? <p>Loading nearby events and experiences...</p> : null}

            {sortedEvents.length ? (
              <div className="place-event-grid">
                {sortedEvents.map((event) => {
                  const isFocused = event.slug === focusedEventSlug;
                  return (
                    <article className={isFocused ? "place-event-card focused-event" : "place-event-card"} key={event.slug}>
                      <img src={getEventImage(event)} alt={event.title} />
                      <div className="place-event-body">
                        <div className="event-badge-row">
                          <span>{event.category}</span>
                          {isFocused ? <strong>Selected event</strong> : null}
                        </div>
                        <h3>{event.title}</h3>
                        <p>{event.shortDescription}</p>
                        <div className="small-meta">
                          <span>📍 {event.venue}</span>
                          <span>🗓 {event.dateLabel} · {event.timeLabel}</span>
                          <span>💰 {event.priceLabel}</span>
                        </div>
                        <div className="mini-actions">
                          <a href={event.mapUrl} target="_blank" rel="noreferrer">Directions</a>
                          <Link to={`/hotels?city=${encodeURIComponent(event.city)}`}>Hotels nearby</Link>
                          <Link to={`/tourist-guides?city=${encodeURIComponent(event.city)}&type=${encodeURIComponent(event.category)}`}>Find guide</Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="no-events-box">
                <span>🎒</span>
                <h3>No connected tourist events yet</h3>
                <p>Use the normal experiences below, or browse all Events & Experiences.</p>
                <Link to="/events">Browse events</Link>
              </div>
            )}

            {place.experiences?.length ? (
              <div className="experience-list legacy-experiences">
                {place.experiences.map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <span>{item.duration || item.time || ""} {item.cost !== undefined ? ` · ${formatLkr(item.cost)}` : ""}</span>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className="two-col">
            {place.nearbyPlaces?.length ? (
              <div className="white-card">
                <h2>Nearby Places</h2>
                <ul>
                  {place.nearbyPlaces.map((item, index) => <li key={`${item.name}-${index}`}><strong>{item.name}</strong> — {item.distance} · {item.type}</li>)}
                </ul>
              </div>
            ) : null}

            {place.tips?.length ? (
              <div className="white-card">
                <h2>Tips</h2>
                <ul>{place.tips.map((tip, index) => <li key={`${tip}-${index}`}>{tip}</li>)}</ul>
              </div>
            ) : null}
          </section>

          {place.facilities?.length ? (
            <section className="white-card">
              <h2>Facilities</h2>
              <div className="tags">{place.facilities.map((item) => <span key={item}>✓ {item}</span>)}</div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}

const css = `
.place-detail-page{background:#f7faf5;min-height:100vh;color:#102936;font-family:Inter,system-ui,Arial,sans-serif}.detail-toast{position:fixed;right:22px;bottom:22px;background:#064e45;color:#fff;padding:14px 18px;border-radius:14px;z-index:50;font-weight:900}.state{max-width:850px;margin:70px auto;background:#fff;border:1px solid #e2ebe5;border-radius:20px;padding:30px;text-align:center;font-weight:900}.state.error{color:#991b1b}.detail-hero{height:460px;position:relative;overflow:hidden}.detail-hero>img{width:100%;height:100%;object-fit:cover}.detail-hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(1,25,28,.90),rgba(1,48,45,.56),rgba(1,25,28,.28))}.detail-hero-content{position:absolute;left:clamp(22px,8vw,110px);bottom:60px;color:#fff;max-width:850px}.back-link{display:inline-block;color:#fff;text-decoration:none;background:rgba(255,255,255,.18);padding:10px 16px;border-radius:999px;font-weight:900;margin-bottom:24px}.detail-hero-content span{display:inline-block;color:#ffe68b;font-weight:900;text-transform:uppercase;letter-spacing:.15em}.detail-hero-content h1{font-size:clamp(42px,7vw,74px);margin:12px 0;letter-spacing:-.04em;color:#fff;text-shadow:0 14px 42px rgba(0,0,0,.52)}.detail-hero-content p{font-size:19px;font-weight:800;color:#fff;text-shadow:0 8px 28px rgba(0,0,0,.46)}.detail-wrap{max-width:1250px;margin:-56px auto 70px;padding:0 22px;display:grid;grid-template-columns:330px 1fr;gap:26px;position:relative;z-index:3}.quick-card,.white-card{background:#fff;border:1px solid #e2ebe5;border-radius:26px;box-shadow:0 20px 50px rgba(0,0,0,.08)}.quick-card{padding:22px;position:sticky;top:20px;height:max-content}.quick-card h3,.white-card h2{margin:0 0 18px;color:#064e45}.quick-card div{display:flex;justify-content:space-between;gap:14px;padding:13px 0;border-bottom:1px solid #eef3ef}.quick-card strong{color:#52616f}.quick-card span{text-align:right;font-weight:900}.quick-card button,.quick-card a{display:block;width:100%;box-sizing:border-box;text-align:center;border:none;text-decoration:none;margin-top:14px;border-radius:16px;padding:14px;font-weight:900;cursor:pointer}.quick-card button{background:#ffc22b;color:#063c38}.quick-card button.saved-trip-btn{background:#e8fff5;color:#05614f;border:1px solid #64c8a8}.quick-card a{background:#064e45;color:#fff}.quick-card .secondary-link{background:#edf8f6;color:#064e45}.detail-main{display:flex;flex-direction:column;gap:22px}.white-card{padding:26px}.white-card p{line-height:1.85;color:#475569;font-weight:600;white-space:pre-line}.tags{display:flex;gap:9px;flex-wrap:wrap}.tags span{background:#f0faf6;color:#064e45;border-radius:999px;padding:8px 12px;font-weight:800}.gallery-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.gallery-row button{border:none;border-radius:16px;overflow:hidden;padding:0;cursor:pointer;height:160px}.gallery-row img{width:100%;height:100%;object-fit:cover}.quick-card .map-link{background:#e8f5ef;color:#064e45}.location-map-card iframe{width:100%;height:360px;border:0;border-radius:18px;display:block;background:#e5e7eb}.location-map-card .map-note{margin:12px 0 0;color:#64748b!important;font-weight:850;white-space:normal!important}.map-title-row{margin-bottom:14px!important}.highlight-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.highlight-grid article,.experience-list article{border:1px solid #e2ebe5;background:#fbfdf9;border-radius:18px;padding:18px}.highlight-grid span{font-size:34px}.highlight-grid h3,.experience-list h3{color:#064e45;margin:8px 0}.highlight-grid p,.experience-list p{margin:0;white-space:normal}.experience-list{display:grid;gap:14px}.experience-list span{display:inline-block;margin-top:10px;color:#b45309;font-weight:900}.card-title-row{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:18px}.section-kicker{display:inline-block;color:#007e91;font-weight:950;text-transform:uppercase;letter-spacing:.12em;font-size:12px;margin-bottom:8px}.card-title-row a{color:#007e91;text-decoration:none;font-weight:950}.place-event-grid{display:grid;gap:16px;margin-bottom:20px}.place-event-card{display:grid;grid-template-columns:220px 1fr;border:1px solid #dbeceb;background:#fbffff;border-radius:22px;overflow:hidden}.place-event-card.focused-event{border:2px solid #007e91;box-shadow:0 18px 42px rgba(0,126,145,.14)}.place-event-card img{width:100%;height:100%;min-height:210px;object-fit:cover}.place-event-body{padding:18px}.event-badge-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.event-badge-row span,.event-badge-row strong{border-radius:999px;padding:7px 10px;font-size:12px;font-weight:950}.event-badge-row span{background:#e5f6f4;color:#007e91}.event-badge-row strong{background:#facc15;color:#102936}.place-event-body h3{font-size:24px;margin:13px 0 8px;color:#0b4b45}.place-event-body p{white-space:normal;margin:0}.small-meta{display:grid;gap:6px;margin-top:12px;color:#52616f;font-weight:750}.mini-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}.mini-actions a{background:#064e45;color:white;text-decoration:none;border-radius:12px;padding:10px 12px;font-weight:900}.mini-actions a:first-child{background:#007e91}.no-events-box{text-align:center;border:1px dashed #b6d9d5;border-radius:20px;background:#f8ffff;padding:26px;margin-bottom:18px}.no-events-box span{font-size:38px}.no-events-box h3{color:#064e45;margin:8px 0}.no-events-box a{display:inline-block;margin-top:10px;background:#007e91;color:white;border-radius:14px;text-decoration:none;padding:11px 14px;font-weight:950}.legacy-experiences{margin-top:20px}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:22px}.white-card ul{padding-left:20px;margin:0}.white-card li{margin:10px 0;line-height:1.6;color:#475569;font-weight:650}@media(max-width:900px){.detail-wrap{grid-template-columns:1fr}.quick-card{position:static}.two-col,.highlight-grid,.gallery-row,.place-event-card{grid-template-columns:1fr}.place-event-card img{height:230px}.detail-hero{height:420px}.card-title-row{align-items:flex-start;flex-direction:column}}
`;

