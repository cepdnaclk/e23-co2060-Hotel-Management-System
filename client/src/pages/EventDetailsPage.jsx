import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getSavedEventIds,
  getTripEventIds,
  setSavedEventIds,
  setTripEventIds,
  tourismEvents,
} from "../data/eventData";

function EventDetailsPage() {
  const { id } = useParams();
  const event = tourismEvents.find((item) => item.id === id);
  const [savedIds, setSavedIds] = useState(() => getSavedEventIds());
  const [tripIds, setTripIds] = useState(() => getTripEventIds());

  const similarEvents = useMemo(() => {
    if (!event) return [];

    return tourismEvents
      .filter(
        (item) =>
          item.id !== event.id &&
          (item.city === event.city || item.category === event.category || item.district === event.district)
      )
      .slice(0, 3);
  }, [event]);

  if (!event) {
    return (
      <main className="event-details-page">
        <style>{detailsCss}</style>
        <section className="event-not-found">
          <span>🌴</span>
          <h1>Event not found</h1>
          <p>The event you are looking for may be unavailable or removed.</p>
          <Link to="/events">Back to events</Link>
        </section>
      </main>
    );
  }

  const isSaved = savedIds.includes(event.id);
  const isInTrip = tripIds.includes(event.id);

  const toggleSaved = () => {
    const nextIds = isSaved
      ? savedIds.filter((item) => item !== event.id)
      : [...savedIds, event.id];

    setSavedIds(nextIds);
    setSavedEventIds(nextIds);
  };

  const toggleTripPlan = () => {
    const nextIds = isInTrip
      ? tripIds.filter((item) => item !== event.id)
      : [...tripIds, event.id];

    setTripIds(nextIds);
    setTripEventIds(nextIds);
  };

  return (
    <main className="event-details-page">
      <style>{detailsCss}</style>

      <section className="event-details-hero">
        <img src={event.image} alt={event.title} />
        <div className="event-details-overlay" />
        <div className="event-details-hero-content">
          <Link to="/events" className="back-link">← Back to events</Link>
          <span className="details-category">{event.category}</span>
          <h1>{event.title}</h1>
          <p>{event.description}</p>

          <div className="hero-fact-row">
            <span>📍 {event.city}, {event.district}</span>
            <span>🗓 {event.dateLabel}</span>
            <span>⏰ {event.time}</span>
            <span>💳 {event.priceLabel}</span>
          </div>
        </div>
      </section>

      <section className="event-details-inner">
        <aside className="booking-summary-card">
          <div className="summary-price">
            <span>Starting from</span>
            <strong>{event.priceLabel}</strong>
          </div>

          <div className="summary-lines">
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Duration:</strong> {event.duration}</p>
            <p><strong>Distance:</strong> {event.distanceText}</p>
            <p><strong>Rating:</strong> ⭐ {event.rating} from {event.reviews} reviews</p>
            <p><strong>Seats left:</strong> {event.spotsLeft}</p>
          </div>

          <a href={event.mapUrl} target="_blank" rel="noreferrer" className="primary-summary-action">
            Get directions
          </a>
          <Link
            to={`/hotels?city=${encodeURIComponent(event.city)}`}
            className="secondary-summary-action"
          >
            Find hotels in {event.city}
          </Link>
          <button type="button" onClick={toggleSaved} className="ghost-summary-action">
            {isSaved ? "♥ Saved event" : "♡ Save event"}
          </button>
          <button type="button" onClick={toggleTripPlan} className="ghost-summary-action">
            {isInTrip ? "✓ Added to trip plan" : "+ Add to trip plan"}
          </button>
        </aside>

        <div className="event-main-content">
          <section className="content-card overview-card">
            <span className="section-kicker">Experience overview</span>
            <h2>Why tourists like this event</h2>
            <p>{event.description}</p>

            <div className="overview-grid">
              <div>
                <span>Best for</span>
                <strong>{event.bestFor}</strong>
              </div>
              <div>
                <span>Mood</span>
                <strong>{event.mood}</strong>
              </div>
              <div>
                <span>Nearby hotels</span>
                <strong>{event.nearHotels.slice(0, 2).join(", ")}</strong>
              </div>
            </div>
          </section>

          <section className="two-column-info">
            <div className="content-card">
              <span className="section-kicker">Highlights</span>
              <h2>What you will experience</h2>
              <ul>
                {event.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="content-card">
              <span className="section-kicker">Before you go</span>
              <h2>What to bring</h2>
              <ul>
                {event.whatToBring.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="content-card nearby-hotels-card">
            <div className="card-heading-row">
              <div>
                <span className="section-kicker">Nearby stays</span>
                <h2>Hotels tourists may book near this event</h2>
              </div>
              <Link to={`/hotels?city=${encodeURIComponent(event.city)}`}>View hotels →</Link>
            </div>

            <div className="hotel-pill-grid">
              {event.nearHotels.map((hotel) => (
                <Link
                  key={hotel}
                  to={`/hotels?city=${encodeURIComponent(event.city)}&search=${encodeURIComponent(hotel)}`}
                >
                  <span>🏨</span>
                  {hotel}
                </Link>
              ))}
            </div>
          </section>

          {similarEvents.length > 0 && (
            <section className="content-card similar-events-card">
              <span className="section-kicker">Similar events</span>
              <h2>More experiences you may like</h2>

              <div className="similar-event-grid">
                {similarEvents.map((item) => (
                  <Link to={`/events/${item.id}`} className="similar-event-card" key={item.id}>
                    <img src={item.image} alt={item.title} />
                    <div>
                      <span>{item.category} · {item.city}</span>
                      <h3>{item.title}</h3>
                      <p>{item.dateLabel} · {item.priceLabel}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

const detailsCss = `
  .event-details-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 3% 12%, rgba(20, 184, 166, 0.14), transparent 26rem),
      radial-gradient(circle at 94% 12%, rgba(251, 191, 36, 0.14), transparent 24rem),
      linear-gradient(135deg, #f8f4ea 0%, #ffffff 48%, #effdf9 100%);
    color: #10231f;
  }

  .event-details-hero {
    position: relative;
    min-height: 620px;
    display: flex;
    align-items: end;
    overflow: hidden;
  }

  .event-details-hero > img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .event-details-overlay {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 18% 12%, rgba(251, 191, 36, 0.22), transparent 28rem),
      linear-gradient(0deg, rgba(3, 31, 28, 0.94), rgba(3, 31, 28, 0.52), rgba(3, 31, 28, 0.08));
  }

  .event-details-hero-content {
    position: relative;
    z-index: 1;
    width: min(1180px, calc(100% - 36px));
    margin: 0 auto;
    padding: 90px 0 54px;
    color: #ffffff;
  }

  .back-link {
    display: inline-flex;
    margin-bottom: 18px;
    color: #fde68a;
    text-decoration: none;
    font-weight: 950;
  }

  .details-category,
  .section-kicker {
    display: inline-flex;
    width: fit-content;
    padding: 8px 13px;
    border-radius: 999px;
    background: rgba(251, 191, 36, 0.95);
    color: #082f2b;
    font-size: 0.75rem;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .section-kicker {
    background: #ecfdf5;
    color: #0f766e;
    border: 1px solid #ccfbf1;
  }

  .event-details-hero h1 {
    max-width: 900px;
    margin: 18px 0 14px;
    font-size: clamp(2.6rem, 6vw, 5.6rem);
    line-height: 0.94;
    letter-spacing: -0.075em;
  }

  .event-details-hero p {
    max-width: 760px;
    margin: 0;
    color: rgba(255, 255, 255, 0.88);
    line-height: 1.75;
    font-size: 1.06rem;
    font-weight: 750;
  }

  .hero-fact-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 24px;
  }

  .hero-fact-row span {
    padding: 10px 13px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #ffffff;
    font-weight: 900;
    backdrop-filter: blur(10px);
  }

  .event-details-inner {
    width: min(1180px, calc(100% - 36px));
    margin: -74px auto 0;
    position: relative;
    z-index: 5;
    display: grid;
    grid-template-columns: 340px minmax(0, 1fr);
    gap: 24px;
    padding-bottom: 84px;
  }

  .booking-summary-card,
  .content-card {
    border: 1px solid #d1fae5;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
  }

  .booking-summary-card {
    position: sticky;
    top: 94px;
    align-self: start;
    padding: 22px;
  }

  .summary-price {
    display: grid;
    gap: 4px;
    padding: 18px;
    border-radius: 24px;
    background: linear-gradient(135deg, #083f3b, #0f766e);
    color: white;
  }

  .summary-price span {
    color: #ccfbf1;
    font-size: 0.8rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  .summary-price strong {
    font-size: 1.8rem;
    line-height: 1;
  }

  .summary-lines {
    display: grid;
    gap: 10px;
    margin: 18px 0;
  }

  .summary-lines p {
    margin: 0;
    color: #475569;
    line-height: 1.55;
    font-weight: 750;
  }

  .primary-summary-action,
  .secondary-summary-action,
  .ghost-summary-action {
    min-height: 48px;
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
    border-radius: 17px;
    border: 0;
    text-decoration: none;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 950;
    cursor: pointer;
  }

  .primary-summary-action {
    background: linear-gradient(135deg, #facc15, #f59e0b);
    color: #082f2b;
  }

  .secondary-summary-action {
    background: #0f766e;
    color: #ffffff;
  }

  .ghost-summary-action {
    background: #ecfdf5;
    color: #0f766e;
  }

  .event-main-content {
    display: grid;
    gap: 22px;
  }

  .content-card {
    padding: 26px;
  }

  .content-card h2 {
    margin: 12px 0 12px;
    color: #083f3b;
    font-size: clamp(1.5rem, 3vw, 2.35rem);
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .content-card p {
    margin: 0;
    color: #64748b;
    line-height: 1.75;
    font-weight: 750;
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 22px;
  }

  .overview-grid div {
    padding: 16px;
    border-radius: 20px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .overview-grid span {
    display: block;
    margin-bottom: 8px;
    color: #0f766e;
    font-size: 0.74rem;
    font-weight: 950;
    text-transform: uppercase;
  }

  .overview-grid strong {
    color: #0f172a;
    line-height: 1.35;
  }

  .two-column-info,
  .similar-event-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }

  .content-card ul {
    display: grid;
    gap: 12px;
    padding: 0;
    margin: 18px 0 0;
    list-style: none;
  }

  .content-card li {
    position: relative;
    padding-left: 30px;
    color: #475569;
    line-height: 1.6;
    font-weight: 800;
  }

  .content-card li::before {
    content: "✓";
    position: absolute;
    left: 0;
    top: 0;
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #ccfbf1;
    color: #0f766e;
    font-size: 0.78rem;
    font-weight: 950;
  }

  .card-heading-row {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 18px;
  }

  .card-heading-row a {
    color: #0f766e;
    text-decoration: none;
    font-weight: 950;
    white-space: nowrap;
  }

  .hotel-pill-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }

  .hotel-pill-grid a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 14px;
    border-radius: 999px;
    background: #fffbeb;
    color: #92400e;
    text-decoration: none;
    font-weight: 900;
  }

  .similar-event-card {
    overflow: hidden;
    border: 1px solid #d1fae5;
    border-radius: 24px;
    background: #ffffff;
    text-decoration: none;
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
  }

  .similar-event-card img {
    width: 100%;
    height: 155px;
    object-fit: cover;
    display: block;
  }

  .similar-event-card div {
    padding: 16px;
  }

  .similar-event-card span {
    color: #0f766e;
    font-size: 0.78rem;
    font-weight: 950;
    text-transform: uppercase;
  }

  .similar-event-card h3 {
    margin: 8px 0 6px;
    color: #083f3b;
    line-height: 1.12;
  }

  .similar-event-card p {
    color: #64748b;
    font-size: 0.92rem;
  }

  .event-not-found {
    min-height: 70vh;
    width: min(720px, calc(100% - 36px));
    margin: 0 auto;
    display: grid;
    place-items: center;
    text-align: center;
  }

  .event-not-found span {
    font-size: 4rem;
  }

  .event-not-found h1 {
    margin: 14px 0 8px;
    color: #083f3b;
    font-size: 3rem;
  }

  .event-not-found p {
    color: #64748b;
    font-weight: 750;
  }

  .event-not-found a {
    display: inline-flex;
    min-height: 48px;
    align-items: center;
    justify-content: center;
    padding: 0 18px;
    border-radius: 16px;
    background: #0f766e;
    color: #ffffff;
    text-decoration: none;
    font-weight: 950;
  }

  @media (max-width: 1020px) {
    .event-details-inner,
    .two-column-info,
    .overview-grid,
    .similar-event-grid {
      grid-template-columns: 1fr;
    }

    .booking-summary-card {
      position: static;
    }
  }

  @media (max-width: 720px) {
    .event-details-hero {
      min-height: 560px;
    }

    .card-heading-row {
      display: grid;
    }
  }
`;

export default EventDetailsPage;
