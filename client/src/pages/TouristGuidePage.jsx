import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/api";

const guideTypes = ["All", "Heritage", "Food", "Nature", "Adventure", "City", "Wellness", "Wildlife", "Religious", "Photography"];

const iconByType = {
  Heritage: "🏛️",
  Food: "🍛",
  Nature: "⛰️",
  Adventure: "🌊",
  City: "🏙️",
  Wellness: "🌿",
  Wildlife: "🐆",
  Religious: "🛕",
  Photography: "📸",
};

const sriLankaFallbackImage =
  "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=85";

function TouristGuidePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("city") || searchParams.get("search") || "");
  const [type, setType] = useState(searchParams.get("type") || "All");
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (type !== "All") params.set("type", type);
    return params.toString();
  }, [search, type]);

  const loadGuides = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/guides?${queryString}`);
      setGuides(response.data.guides || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tourist guides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (type !== "All") params.set("type", type);
    setSearchParams(params, { replace: true });
    loadGuides();
  }, [queryString]);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadGuides();
  };

  return (
    <main className="guides-page">
      <style>{guideCss}</style>

      <section className="guide-hero">
        <div>
          <span className="eyebrow">Verified Tourist Guiders</span>
          <h1>Find trusted local guide support in Sri Lanka.</h1>
          <p>
            Search approved guide profiles by city, language, experience type, or travel interest.
            Partners can register as guiders and become visible here after admin approval.
          </p>
          <div className="guide-hero-links">
            <Link to="/partner/guides">Become a guider</Link>
            <Link to="/trip-planner">Plan with a guide</Link>
          </div>
        </div>

        <form className="guide-search" onSubmit={handleSubmit}>
          <label>
            <span>Search city, guide, or speciality</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Example: Kandy, food, wildlife, English..."
            />
          </label>
          <label>
            <span>Guide type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              {guideTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <button type="submit">Search guides</button>
        </form>
      </section>

      <section className="guide-chip-row">
        {guideTypes.map((item) => (
          <button
            type="button"
            key={item}
            className={type === item ? "active" : ""}
            onClick={() => setType(item)}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="guide-grid-wrap">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow small">Approved guide profiles</span>
            <h2>{loading ? "Loading guides..." : `${guides.length} guide option${guides.length === 1 ? "" : "s"} found`}</h2>
          </div>
          <Link to="/events">Browse events →</Link>
        </div>

        {error && <div className="guide-error">{error}</div>}

        {loading ? (
          <div className="guide-empty">Loading approved tourist guides...</div>
        ) : guides.length === 0 ? (
          <div className="guide-empty">
            <h3>No approved guides found</h3>
            <p>Try another city or guide type. New partner guide profiles will appear here after admin approval.</p>
          </div>
        ) : (
          <div className="guide-grid">
            {guides.map((guide) => {
              const icon = iconByType[guide.guide_type] || "🧭";
              return (
                <article className="guide-card" key={guide.id}>
                  <img src={guide.image_url || sriLankaFallbackImage} alt={guide.display_name} />
                  <div className="guide-card-body">
                    <div className="guide-topline">
                      <span>{icon} {guide.guide_type}</span>
                      <strong>⭐ {Number(guide.rating || 4.8).toFixed(1)}</strong>
                    </div>
                    <h2>{guide.display_name}</h2>
                    <p>{guide.short_description || guide.bio}</p>

                    <div className="guide-meta">
                      <span>📍 {guide.city}{guide.district ? `, ${guide.district}` : ""}</span>
                      <span>🗣 {guide.languages?.length ? guide.languages.join(" / ") : "Languages not specified"}</span>
                      <span>🧳 {guide.experience_years} year{guide.experience_years === 1 ? "" : "s"} experience</span>
                      <span>💰 Day: Rs. {Number(guide.price_per_day || 0).toLocaleString()} | Hour: Rs. {Number(guide.price_per_hour || 0).toLocaleString()}</span>
                    </div>

                    <div className="guide-tags">
                      {(guide.specialities || []).slice(0, 4).map((item) => <span key={item}>{item}</span>)}
                    </div>

                    <div className="guide-actions">
                      <a href={`tel:${guide.phone}`}>Call Guide</a>
                      <a href={`mailto:${guide.email}`}>Email</a>
                      <Link to={`/hotels?city=${encodeURIComponent(guide.city)}`}>Hotels nearby</Link>
                      <Link to="/trip-planner">Add to trip</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

const guideCss = `
.guides-page{min-height:100vh;background:linear-gradient(135deg,#f7faf8 0%,#fff 52%,#edf8f6 100%);color:#101828;font-family:Inter,system-ui,Arial,sans-serif}.guide-hero{width:min(1180px,calc(100% - 36px));margin:0 auto;padding:70px 0 28px;display:grid;grid-template-columns:1fr 430px;gap:36px;align-items:end}.eyebrow{display:inline-flex;background:#007e91;color:#fff;border-radius:999px;padding:9px 15px;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.eyebrow.small{background:#e5f6f4;color:#007e91}.guide-hero h1{font-size:clamp(42px,6vw,72px);line-height:.96;margin:18px 0 16px;letter-spacing:-.055em;color:#0b1720}.guide-hero p{font-size:18px;color:#52616f;line-height:1.8;font-weight:650}.guide-hero-links{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}.guide-hero-links a{background:#007e91;color:#fff;text-decoration:none;border-radius:15px;padding:13px 16px;font-weight:950}.guide-hero-links a+a{background:#fff;color:#007e91;border:1px solid #bfe3df}.guide-search{background:#fff;border:1px solid #dce9ea;border-radius:28px;padding:20px;box-shadow:0 24px 70px rgba(15,23,42,.1);display:grid;gap:14px}.guide-search label{display:grid;gap:7px}.guide-search span{font-size:12px;color:#667085;font-weight:950;text-transform:uppercase;letter-spacing:.06em}.guide-search input,.guide-search select{border:1px solid #d0d5dd;border-radius:16px;padding:14px 15px;font-size:15px;outline:none}.guide-search input:focus,.guide-search select:focus{border-color:#007e91;box-shadow:0 0 0 4px rgba(0,126,145,.1)}.guide-search button{border:none;border-radius:16px;background:#007e91;color:#fff;padding:14px;font-weight:950;cursor:pointer}.guide-chip-row{width:min(1180px,calc(100% - 36px));margin:8px auto 30px;display:flex;gap:10px;flex-wrap:wrap}.guide-chip-row button{border:1px solid #bfe3df;background:#fff;color:#007e91;border-radius:999px;padding:10px 15px;font-weight:900;cursor:pointer}.guide-chip-row .active{background:#007e91;color:#fff}.guide-grid-wrap{width:min(1180px,calc(100% - 36px));margin:0 auto 80px}.section-heading-row{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:18px}.section-heading-row h2{font-size:34px;margin:12px 0 0;letter-spacing:-.045em}.section-heading-row a{color:#007e91;text-decoration:none;font-weight:950}.guide-error{background:#fee2e2;color:#991b1b;padding:14px 16px;border-radius:16px;font-weight:900;margin-bottom:16px}.guide-empty{background:#fff;border:1px solid #dce9ea;border-radius:26px;padding:32px;text-align:center;color:#52616f;box-shadow:0 18px 45px rgba(15,23,42,.06)}.guide-empty h3{margin:0 0 8px;color:#0b1720}.guide-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}.guide-card{background:#fff;border:1px solid #e3e8ef;border-radius:30px;overflow:hidden;box-shadow:0 22px 60px rgba(15,23,42,.09);display:grid;grid-template-columns:230px 1fr}.guide-card img{width:100%;height:100%;object-fit:cover}.guide-card-body{padding:22px}.guide-topline{display:flex;justify-content:space-between;gap:12px;align-items:center}.guide-topline span,.guide-topline strong{border-radius:999px;padding:7px 10px;font-size:12px;font-weight:950}.guide-topline span{background:#e5f6f4;color:#007e91}.guide-topline strong{background:#fff7dc;color:#9a5b00}.guide-card h2{color:#0b4b45;font-size:26px;margin:14px 0 8px}.guide-card p{color:#52616f;line-height:1.7;font-weight:650}.guide-meta{display:grid;gap:6px;color:#475569;font-weight:800}.guide-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.guide-tags span{background:#f1f5f9;border:1px solid #e2e8f0;color:#334155;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900}.guide-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.guide-actions a{border:1px solid #d0d5dd;color:#007e91;text-decoration:none;border-radius:13px;padding:10px 12px;font-weight:950}.guide-actions a:first-child{background:#007e91;color:#fff;border-color:#007e91}@media(max-width:980px){.guide-hero{grid-template-columns:1fr}.guide-grid{grid-template-columns:1fr}.guide-card{grid-template-columns:1fr}.guide-card img{height:240px}.section-heading-row{align-items:flex-start;flex-direction:column}}@media(max-width:600px){.guide-hero,.guide-chip-row,.guide-grid-wrap{width:calc(100% - 24px)}.guide-hero{padding-top:48px}.guide-hero h1{font-size:44px}}
`;

export default TouristGuidePage;
