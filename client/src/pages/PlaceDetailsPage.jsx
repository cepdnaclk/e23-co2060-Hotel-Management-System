import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatLkr } from "../data/exploreData";
import { getDetailedPlaceById, getRelatedPlaces } from "../data/placeDetailsData";

const SAVED_PLACES_KEY = "tourismhub_trip_places";

const loadSavedPlaces = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_PLACES_KEY)) || [];
  } catch {
    return [];
  }
};

function PlaceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const place = useMemo(() => getDetailedPlaceById(id), [id]);
  const relatedPlaces = useMemo(() => getRelatedPlaces(id, 3), [id]);

  const [savedPlaces, setSavedPlaces] = useState(loadSavedPlaces);
  const [activeImage, setActiveImage] = useState(place?.photoGallery?.[0] || place?.image || "");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setActiveImage(place?.photoGallery?.[0] || place?.image || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [place]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!place) {
    return (
      <main className="place-details-page">
        <style>{detailsCss}</style>
        <section className="not-found-card">
          <h1>Place not found</h1>
          <p>The destination you selected is not available in Explore Sri Lanka.</p>
          <Link to="/explore" className="btn-main">Back to Explore</Link>
        </section>
      </main>
    );
  }

  const isSaved = savedPlaces.some((item) => item.id === place.id);

  const addToTrip = () => {
    const current = loadSavedPlaces();
    const alreadySaved = current.some((item) => item.id === place.id);

    if (alreadySaved) {
      setNotice(`${place.name} is already saved in your trip planner.`);
      return;
    }

    const updated = [...current, place];
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updated));
    setSavedPlaces(updated);
    setNotice(`${place.name} added to your trip planner.`);
  };

  const removeFromTrip = () => {
    const updated = loadSavedPlaces().filter((item) => item.id !== place.id);
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updated));
    setSavedPlaces(updated);
    setNotice(`${place.name} removed from your saved places.`);
  };

  const hotelSearchLink = `/hotels?city=${encodeURIComponent(place.city)}`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

  return (
    <main className="place-details-page">
      <style>{detailsCss}</style>

      <section className="details-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(8,38,35,0.88), rgba(8,38,35,0.35)), url(${place.image})` }}>
        <div className="details-hero-content">
          <button type="button" className="back-btn" onClick={() => navigate(-1)}>← Back</button>
          <span className="place-kicker">{place.region} · {place.category}</span>
          <h1>{place.name}</h1>
          <p>{place.shortDescription}</p>

          <div className="hero-info-row">
            <span>📍 {place.city}, {place.district}</span>
            <span>⏱️ {place.duration}</span>
            <span>📅 {place.bestTime}</span>
            <span>💰 {formatLkr(place.estimatedCost)} est.</span>
          </div>

          <div className="hero-actions">
            {isSaved ? (
              <button type="button" className="btn-muted" onClick={removeFromTrip}>✓ Saved — remove</button>
            ) : (
              <button type="button" className="btn-main" onClick={addToTrip}>+ Add to Trip</button>
            )}
            <Link to="/trip-planner" className="btn-light">Open Trip Planner</Link>
            <Link to={hotelSearchLink} className="btn-light">Find Hotels near {place.city}</Link>
          </div>
        </div>
      </section>

      {notice && <div className="details-notice">✨ {notice}</div>}

      <section className="flow-strip">
        <div><strong>1</strong><span>Explore destination</span></div>
        <div><strong>2</strong><span>Save to trip</span></div>
        <div><strong>3</strong><span>Plan day-by-day route</span></div>
        <div><strong>4</strong><span>Book nearby hotel</span></div>
      </section>

      <section className="details-layout">
        <div className="main-column">
          <div className="content-card">
            <span className="section-pill">What is this place?</span>
            <h2>About {place.name}</h2>
            <p className="large-text">{place.overview}</p>
          </div>

          <div className="content-card">
            <span className="section-pill">More photos</span>
            <h2>Visual preview</h2>
            <div className="gallery-preview">
              <div className="active-photo-wrap">
                <img src={activeImage} alt={place.name} />
              </div>
              <div className="thumb-row">
                {place.photoGallery.map((photo) => (
                  <button
                    type="button"
                    key={photo}
                    className={activeImage === photo ? "thumb active" : "thumb"}
                    onClick={() => setActiveImage(photo)}
                  >
                    <img src={photo} alt={`${place.name} preview`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="content-card">
            <span className="section-pill">Things tourists can experience</span>
            <h2>Experiences around {place.city}</h2>
            <div className="experience-list">
              {place.experiences.map((experience, index) => (
                <article className="experience-item" key={experience.title}>
                  <div className="experience-number">{index + 1}</div>
                  <div>
                    <h3>{experience.title}</h3>
                    <p>{experience.description}</p>
                    <div className="mini-meta">
                      <span>⏱️ {experience.time}</span>
                      <span>💰 {experience.cost}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="content-card">
            <span className="section-pill">Why visit?</span>
            <h2>Best reasons to add this to your route</h2>
            <div className="reason-grid">
              {place.whyVisit.map((reason) => (
                <div className="reason-card" key={reason}>✓ {reason}</div>
              ))}
            </div>
          </div>

          <div className="content-card">
            <span className="section-pill">Rule-based suggestions</span>
            <h2>Good places to combine with this</h2>
            <p className="muted-text">
              These are not AI recommendations. The system simply checks same region, same category, same vibe, and same budget level.
            </p>
            <div className="related-grid">
              {relatedPlaces.map((related) => (
                <Link to={`/explore/${related.id}`} className="related-card" key={related.id}>
                  <img src={related.image} alt={related.name} />
                  <div>
                    <strong>{related.name}</strong>
                    <span>{related.city} · {related.region}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <aside className="side-column">
          <div className="side-card sticky-card">
            <span className="section-pill">Travel guide</span>
            <h2>Quick information</h2>
            <dl className="info-list">
              <div><dt>Best for</dt><dd>{place.practicalInfo.bestFor}</dd></div>
              <div><dt>Suggested stay</dt><dd>{place.practicalInfo.suggestedStay}</dd></div>
              <div><dt>Best time of day</dt><dd>{place.practicalInfo.bestTimeOfDay}</dd></div>
              <div><dt>Difficulty</dt><dd>{place.practicalInfo.difficulty}</dd></div>
              <div><dt>Dress / preparation</dt><dd>{place.practicalInfo.dressCode}</dd></div>
            </dl>

            <div className="tag-row">
              {place.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>

            <div className="side-actions">
              <a href={mapLink} target="_blank" rel="noreferrer" className="btn-outline">Open Map</a>
              <Link to={hotelSearchLink} className="btn-main block">Find Hotels</Link>
              <Link to="/trip-planner" className="btn-outline">Plan this route</Link>
            </div>
          </div>

          <div className="side-card">
            <span className="section-pill">Tourist tips</span>
            <ul className="tip-list">
              {place.tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

const detailsCss = `
  @import url('https://fonts.googleapis.com/css2?family=Rozha+One&family=Work+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap');

  .place-details-page {
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
    font-family: "Work Sans", sans-serif;
    padding-bottom: 70px;
  }

  .place-details-page h1,
  .place-details-page h2,
  .place-details-page h3 { font-family: "Rozha One", serif; font-weight: 400; }

  .details-hero {
    min-height: 560px;
    background-position: center;
    background-size: cover;
    color: var(--parchment);
    display: flex;
    align-items: center;
    padding: 70px 18px;
  }

  .details-hero-content { max-width: 1180px; width: 100%; margin: 0 auto; }
  .back-btn { background: rgba(246,240,228,0.14); color: var(--parchment); border: 1px solid rgba(246,240,228,0.35); padding: 10px 14px; cursor: pointer; font-weight: 800; margin-bottom: 22px; }
  .place-kicker, .section-pill { display: inline-flex; width: fit-content; background: var(--turmeric); color: var(--ceylon-teal-deep); padding: 7px 13px; font-size: 12px; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; }
  .details-hero h1 { font-size: clamp(42px, 7vw, 86px); line-height: 0.92; margin: 18px 0; max-width: 860px; }
  .details-hero p { max-width: 760px; font-size: 19px; line-height: 1.7; color: #f5ead4; font-weight: 600; }
  .hero-info-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 24px 0; }
  .hero-info-row span { background: rgba(246,240,228,0.14); border: 1px solid rgba(246,240,228,0.25); padding: 9px 12px; font-weight: 800; }
  .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }

  .btn-main, .btn-light, .btn-muted, .btn-outline { border: none; padding: 12px 17px; font-weight: 900; cursor: pointer; text-decoration: none; display: inline-flex; justify-content: center; align-items: center; }
  .btn-main { background: var(--turmeric); color: var(--ceylon-teal-deep); }
  .btn-light { background: var(--parchment); color: var(--ceylon-teal); }
  .btn-muted { background: #f1dcd8; color: var(--vermillion); border: 1px dashed var(--vermillion); }
  .btn-outline { background: transparent; color: var(--ceylon-teal); border: 1px solid var(--ceylon-teal); }
  .block { display: flex; width: 100%; }

  .details-notice { max-width: 1180px; margin: 18px auto 0; background: #eef3ea; color: var(--ceylon-teal); border-left: 5px solid var(--jade); padding: 14px 18px; font-weight: 900; }

  .flow-strip { max-width: 1180px; margin: -36px auto 34px; position: relative; z-index: 2; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 0 18px; }
  .flow-strip div { background: #ffffff; border: 1px solid #e4d9bf; padding: 18px; box-shadow: 0 14px 30px rgba(14,59,58,0.12); }
  .flow-strip strong { display: inline-flex; width: 30px; height: 30px; align-items: center; justify-content: center; background: var(--ceylon-teal); color: var(--parchment); margin-right: 8px; }
  .flow-strip span { font-weight: 900; color: var(--ceylon-teal); }

  .details-layout { max-width: 1180px; margin: 0 auto; padding: 0 18px; display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 22px; align-items: start; }
  .main-column { display: flex; flex-direction: column; gap: 22px; }
  .content-card, .side-card, .not-found-card { background: #ffffff; border: 1px solid #e4d9bf; padding: 24px; box-shadow: 0 16px 36px rgba(14,59,58,0.08); }
  .not-found-card { max-width: 760px; margin: 80px auto; }
  .content-card h2, .side-card h2 { color: var(--ceylon-teal); font-size: 34px; margin: 12px 0 14px; }
  .large-text { font-size: 17px; line-height: 1.85; color: var(--ink-soft); font-weight: 600; }
  .muted-text { color: var(--ink-soft); font-weight: 600; line-height: 1.65; }

  .gallery-preview { display: grid; gap: 12px; }
  .active-photo-wrap { height: 420px; overflow: hidden; background: var(--parchment-deep); }
  .active-photo-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .thumb-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .thumb { border: 3px solid transparent; padding: 0; cursor: pointer; height: 100px; overflow: hidden; background: transparent; }
  .thumb.active { border-color: var(--turmeric); }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .experience-list { display: grid; gap: 14px; }
  .experience-item { display: grid; grid-template-columns: 46px 1fr; gap: 14px; padding: 16px; border: 1px dashed #c9bb92; background: var(--parchment); }
  .experience-number { width: 42px; height: 42px; background: var(--ceylon-teal); color: var(--parchment); display: flex; align-items: center; justify-content: center; font-weight: 900; font-family: "IBM Plex Mono", monospace; }
  .experience-item h3 { margin: 0 0 8px; color: var(--ceylon-teal); font-size: 24px; }
  .experience-item p { margin: 0; color: var(--ink-soft); line-height: 1.65; font-weight: 600; }
  .mini-meta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
  .mini-meta span { background: #ffffff; border: 1px solid #e4d9bf; padding: 6px 9px; font-weight: 800; font-size: 12px; }

  .reason-grid, .related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .reason-card { background: var(--parchment); border: 1px solid #e4d9bf; padding: 14px; color: var(--ceylon-teal); font-weight: 800; line-height: 1.55; }
  .related-card { text-decoration: none; color: var(--ink); background: var(--parchment); border: 1px solid #e4d9bf; overflow: hidden; }
  .related-card img { width: 100%; height: 120px; object-fit: cover; display: block; }
  .related-card div { padding: 12px; }
  .related-card strong { display: block; color: var(--ceylon-teal); font-weight: 900; }
  .related-card span { display: block; margin-top: 4px; color: var(--ink-soft); font-size: 13px; font-weight: 700; }

  .sticky-card { position: sticky; top: 94px; }
  .info-list { display: grid; gap: 12px; margin: 16px 0; }
  .info-list div { border-bottom: 1px solid #e4d9bf; padding-bottom: 10px; }
  .info-list dt { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--jade); font-weight: 900; }
  .info-list dd { margin: 5px 0 0; color: var(--ink-soft); line-height: 1.5; font-weight: 700; }
  .tag-row { display: flex; gap: 8px; flex-wrap: wrap; margin: 18px 0; }
  .tag-row span { background: var(--parchment); border: 1px solid #e4d9bf; padding: 6px 9px; font-size: 12px; font-weight: 900; color: var(--ceylon-teal); }
  .side-actions { display: grid; gap: 10px; }
  .tip-list { margin: 14px 0 0; padding-left: 18px; color: var(--ink-soft); font-weight: 700; line-height: 1.75; }

  @media (max-width: 960px) {
    .details-layout { grid-template-columns: 1fr; }
    .flow-strip { grid-template-columns: repeat(2, 1fr); margin-top: 18px; }
    .sticky-card { position: static; }
    .reason-grid, .related-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 640px) {
    .details-hero { min-height: auto; padding: 46px 16px; }
    .hero-actions, .hero-info-row { flex-direction: column; align-items: stretch; }
    .flow-strip { grid-template-columns: 1fr; }
    .active-photo-wrap { height: 260px; }
    .thumb-row { grid-template-columns: 1fr 1fr 1fr; }
  }
`;

export default PlaceDetailsPage;
