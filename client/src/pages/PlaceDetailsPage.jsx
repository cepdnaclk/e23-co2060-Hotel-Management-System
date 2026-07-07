import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { assetUrl, formatLkr, getExplorePlace } from "../services/exploreService";

const SAVED_PLACES_KEY = "tourismhub_trip_places";

const readSavedPlaces = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_PLACES_KEY) || "[]") || [];
  } catch {
    return [];
  }
};

export default function PlaceDetailsPage() {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mainImage, setMainImage] = useState("");

  useEffect(() => {
    const loadPlace = async () => {
      try {
        setLoading(true);
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

  const savePlace = () => {
    const current = readSavedPlaces();
    if (current.some((item) => item.id === place.id)) {
      setNotice("This place is already saved.");
      return;
    }
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify([...current, place]));
    setNotice("✓ Added to your trip.");
  };

  if (loading) {
    return <main className="place-detail-page"><style>{css}</style><div className="state">Loading place details...</div></main>;
  }

  if (error || !place) {
    return <main className="place-detail-page"><style>{css}</style><div className="state error">{error || "Place not found"}</div></main>;
  }

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
          <button type="button" onClick={savePlace}>+ Save to trip</button>
          <Link to={`/hotels?city=${encodeURIComponent(place.city)}`}>Find Hotels</Link>
        </aside>

        <div className="detail-main">
          <section className="white-card">
            <h2>Overview</h2>
            <p>{place.fullDescription || place.shortDescription}</p>
            <div className="tags">{(place.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
          </section>

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

          {place.experiences?.length ? (
            <section className="white-card">
              <h2>Experiences</h2>
              <div className="experience-list">
                {place.experiences.map((item, index) => (
                  <article key={`${item.title}-${index}`}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <span>{item.duration || item.time || ""} {item.cost !== undefined ? ` · ${formatLkr(item.cost)}` : ""}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

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
.place-detail-page{background:#f7faf5;min-height:100vh;color:#102936;font-family:Inter,system-ui,Arial,sans-serif}.detail-toast{position:fixed;right:22px;bottom:22px;background:#064e45;color:#fff;padding:14px 18px;border-radius:14px;z-index:50;font-weight:900}.state{max-width:850px;margin:70px auto;background:#fff;border:1px solid #e2ebe5;border-radius:20px;padding:30px;text-align:center;font-weight:900}.state.error{color:#991b1b}.detail-hero{height:460px;position:relative;overflow:hidden}.detail-hero>img{width:100%;height:100%;object-fit:cover}.detail-hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(1,48,45,.86),rgba(1,48,45,.32))}.detail-hero-content{position:absolute;left:clamp(22px,8vw,110px);bottom:60px;color:#fff;max-width:850px}.back-link{display:inline-block;color:#fff;text-decoration:none;background:rgba(255,255,255,.18);padding:10px 16px;border-radius:999px;font-weight:900;margin-bottom:24px}.detail-hero-content span{display:inline-block;color:#ffe68b;font-weight:900;text-transform:uppercase;letter-spacing:.15em}.detail-hero-content h1{font-size:clamp(42px,7vw,74px);margin:12px 0;letter-spacing:-.04em}.detail-hero-content p{font-size:19px;font-weight:800}.detail-wrap{max-width:1250px;margin:-56px auto 70px;padding:0 22px;display:grid;grid-template-columns:330px 1fr;gap:26px;position:relative;z-index:3}.quick-card,.white-card{background:#fff;border:1px solid #e2ebe5;border-radius:26px;box-shadow:0 20px 50px rgba(0,0,0,.08)}.quick-card{padding:22px;position:sticky;top:20px;height:max-content}.quick-card h3,.white-card h2{margin:0 0 18px;color:#064e45}.quick-card div{display:flex;justify-content:space-between;gap:14px;padding:13px 0;border-bottom:1px solid #eef3ef}.quick-card strong{color:#52616f}.quick-card span{text-align:right;font-weight:900}.quick-card button,.quick-card a{display:block;width:100%;box-sizing:border-box;text-align:center;border:none;text-decoration:none;margin-top:14px;border-radius:16px;padding:14px;font-weight:900;cursor:pointer}.quick-card button{background:#ffc22b;color:#063c38}.quick-card a{background:#064e45;color:#fff}.detail-main{display:flex;flex-direction:column;gap:22px}.white-card{padding:26px}.white-card p{line-height:1.85;color:#475569;font-weight:600;white-space:pre-line}.tags{display:flex;gap:9px;flex-wrap:wrap}.tags span{background:#f0faf6;color:#064e45;border-radius:999px;padding:8px 12px;font-weight:800}.gallery-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.gallery-row button{border:none;border-radius:16px;overflow:hidden;padding:0;cursor:pointer;height:160px}.gallery-row img{width:100%;height:100%;object-fit:cover}.highlight-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.highlight-grid article,.experience-list article{border:1px solid #e2ebe5;background:#fbfdf9;border-radius:18px;padding:18px}.highlight-grid span{font-size:34px}.highlight-grid h3,.experience-list h3{color:#064e45;margin:8px 0}.highlight-grid p,.experience-list p{margin:0;white-space:normal}.experience-list{display:grid;gap:14px}.experience-list span{display:inline-block;margin-top:10px;color:#b45309;font-weight:900}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:22px}.white-card ul{padding-left:20px;margin:0}.white-card li{margin:10px 0;line-height:1.6;color:#475569;font-weight:650}@media(max-width:900px){.detail-wrap{grid-template-columns:1fr}.quick-card{position:static}.two-col,.highlight-grid,.gallery-row{grid-template-columns:1fr}.detail-hero{height:420px}}
`;
