import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  assetUrl,
  formatLkr,
  getExploreCategories,
  getExploreItineraries,
  getExplorePlaces,
  getSeasonalPlaces,
} from "../services/exploreService";

const SAVED_PLACES_KEY = "tourismhub_trip_places";
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const regions = ["All Regions", "Cultural Triangle", "Hill Country", "South Coast", "West Coast", "East Coast", "Northern Region"];
const budgets = ["All Budgets", "Low", "Medium", "High"];

const readSavedPlaces = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_PLACES_KEY) || "[]") || [];
  } catch {
    return [];
  }
};

function PlaceCard({ place, onSave, saved }) {
  return (
    <article className="exp-card">
      <Link to={`/explore/${place.id}`} className="exp-photo">
        <img src={assetUrl(place.image)} alt={place.name} />
        <span className="exp-region">{place.region}</span>
        {place.featured ? <span className="exp-featured">★ Featured</span> : null}
      </Link>
      <div className="exp-body">
        <div className="exp-title-row">
          <div>
            <h3>{place.name}</h3>
            <p className="exp-location">📍 {place.city}, {place.district}</p>
          </div>
          <span className={`budget-pill ${String(place.budget).toLowerCase()}`}>{place.budget}</span>
        </div>
        <p className="exp-desc">{place.shortDescription}</p>
        <div className="exp-meta">
          <span>⏱ {place.duration}</span>
          <span>🗓 {place.bestTime}</span>
          <span>💰 {formatLkr(place.estimatedCost)}</span>
        </div>
        <div className="exp-tags">
          {(place.tags || []).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="exp-actions">
          <Link to={`/explore/${place.id}`}>View Details</Link>
          <button type="button" onClick={() => onSave(place)}>{saved ? "✓ Saved" : "+ Save"}</button>
          <Link to={`/hotels?city=${encodeURIComponent(place.city)}`}>Hotels</Link>
        </div>
      </div>
    </article>
  );
}

export default function ExplorePage() {
  const [categories, setCategories] = useState([{ id: "all", slug: "all", label: "All Places", icon: "🌏" }]);
  const [places, setPlaces] = useState([]);
  const [seasonal, setSeasonal] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("All Regions");
  const [budget, setBudget] = useState("All Budgets");
  const [sort, setSort] = useState("recommended");
  const [savedPlaces, setSavedPlaces] = useState(readSavedPlaces);
  const [activeTab, setActiveTab] = useState("activities");

  const month = useMemo(() => new Date().getMonth(), []);

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        setLoading(true);
        const [catData, seasonalData, itineraryData] = await Promise.all([
          getExploreCategories(),
          getSeasonalPlaces(month),
          getExploreItineraries(),
        ]);
        setCategories(catData);
        setSeasonal(seasonalData.places || []);
        setItineraries(itineraryData);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load Explore data");
      } finally {
        setLoading(false);
      }
    };

    loadBaseData();
  }, [month]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const data = await getExplorePlaces({ q: search, category, region, budget, sort });
        setPlaces(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load places");
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, category, region, budget, sort]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const topPlaces = useMemo(() => places.filter((p) => p.featured).slice(0, 3), [places]);
  const savedIds = useMemo(() => new Set(savedPlaces.map((p) => p.id)), [savedPlaces]);

  const savePlace = (place) => {
    const current = readSavedPlaces();
    if (current.some((item) => item.id === place.id)) {
      setNotice(`${place.name} is already saved.`);
      return;
    }

    const updated = [...current, place];
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updated));
    setSavedPlaces(updated);
    setNotice(`✓ ${place.name} saved to your trip.`);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setRegion("All Regions");
    setBudget("All Budgets");
    setSort("recommended");
  };

  return (
    <main className="explore-page">
      <style>{css}</style>

      {notice ? <div className="toast">{notice}</div> : null}

      <section className="hero-explore">
        <div className="hero-overlay" />
        <div className="hero-content">
          <p>WHAT TO DO</p>
          <h1>Discover your adventure</h1>
          <span>From misty highlands to golden shores, ancient cities to surf-soaked coasts — find what calls to you across the island.</span>

          <div className="hero-categories">
            {categories.map((item) => (
              <button key={item.slug || item.id} type="button" className={category === (item.slug || item.id) ? "on" : ""} onClick={() => setCategory(item.slug || item.id)}>
                {item.label} {category === (item.slug || item.id) ? "✓" : ""}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="tab-switch">
        <button type="button" className={activeTab === "activities" ? "on" : ""} onClick={() => setActiveTab("activities")}>Activities</button>
        <button type="button" className={activeTab === "itineraries" ? "on" : ""} onClick={() => setActiveTab("itineraries")}>Itineraries</button>
      </div>

      {loading ? <div className="state-card">Loading Explore page...</div> : null}
      {error ? <div className="state-card error">{error}</div> : null}

      {activeTab === "activities" ? (
        <>
          <section className="section top-section">
            <div className="section-head">
              <div>
                <p>TOP EXPERIENCES</p>
                <h2>What everyone comes to Sri Lanka for</h2>
              </div>
              <span>{topPlaces.length} signature experiences</span>
            </div>
            <div className="top-grid">
              {topPlaces.map((place) => <PlaceCard key={place.id} place={place} onSave={savePlace} saved={savedIds.has(place.id)} />)}
            </div>
          </section>

          <section className="filters-panel">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Ella, beach, safari, temple..." />
            <select value={region} onChange={(e) => setRegion(e.target.value)}>{regions.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={budget} onChange={(e) => setBudget(e.target.value)}>{budgets.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recommended">Recommended</option>
              <option value="cost">Lowest cost</option>
              <option value="budgetLow">Budget low first</option>
              <option value="budgetHigh">Budget high first</option>
              <option value="name">Name A-Z</option>
            </select>
            <button type="button" onClick={clearFilters}>Clear</button>
          </section>

          <section className="section">
            <div className="section-head">
              <div>
                <p>MORE TO DISCOVER</p>
                <h2>Every kind of journey</h2>
              </div>
              <span>{places.length} places found</span>
            </div>
            <div className="place-grid">
              {places.map((place) => <PlaceCard key={place.id} place={place} onSave={savePlace} saved={savedIds.has(place.id)} />)}
            </div>
            {!places.length && !loading ? <div className="state-card">No places found. Try another filter.</div> : null}
          </section>

          <section className="season-section">
            <div>
              <span className="month-pill">▣ GOOD IN {monthNames[month].toUpperCase()}</span>
              <h2>Season-aware picks</h2>
              <p>Sri Lanka has different travel seasons across regions. These fit the current month.</p>
            </div>
            <div className="season-grid">
              {seasonal.map((place) => (
                <Link to={`/explore/${place.id}`} key={place.id} className="season-card">
                  <img src={assetUrl(place.image)} alt={place.name} />
                  <div>
                    <small>{place.bestTime}</small>
                    <strong>{place.name}</strong>
                    <span>{place.region}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="section itinerary-section">
          <div className="section-head">
            <div>
              <p>SUGGESTED ITINERARIES</p>
              <h2>Discover Sri Lanka - One Island, Many Worlds</h2>
            </div>
          </div>
          <div className="itinerary-grid">
            {itineraries.map((item) => (
              <article key={item.id} className="itinerary-card">
                <h3>{item.title}</h3>
                <span>{item.days}</span>
                <p>{item.tone}</p>
                <div>
                  {(item.places || []).map((place) => (
                    <Link key={place.id} to={`/explore/${place.id}`}>{place.name}</Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

const css = `
.explore-page{background:#fbfcf7;color:#0b2530;min-height:100vh;font-family:Inter,system-ui,Arial,sans-serif}.toast{position:fixed;right:22px;bottom:22px;background:#064e45;color:#fff;padding:14px 18px;border-radius:16px;z-index:20;box-shadow:0 18px 40px rgba(0,0,0,.18);font-weight:800}.hero-explore{position:relative;min-height:480px;background:url('https://images.pexels.com/photos/16508265/pexels-photo-16508265.jpeg?auto=compress&cs=tinysrgb&w=1600') center/cover;display:grid;place-items:center;text-align:center;color:#fff;overflow:hidden}.hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(1,55,63,.83),rgba(1,55,63,.56),rgba(1,38,49,.86))}.hero-content{position:relative;max-width:1060px;padding:40px 22px}.hero-content p,.section-head p{letter-spacing:.42em;color:#ffbc38;font-weight:900;margin:0 0 20px;font-size:13px}.hero-content h1{font-size:clamp(44px,7vw,72px);letter-spacing:.08em;margin:0 0 18px;font-weight:900}.hero-content span{display:block;max-width:760px;margin:auto;color:#e3f5f3;line-height:1.8;font-size:18px;font-weight:600}.hero-categories{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:44px}.hero-categories button,.tab-switch button,.filters-panel button{border:none;border-radius:999px;padding:14px 30px;background:#fff;color:#242424;font-weight:900;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.08)}.hero-categories button.on,.tab-switch button.on{background:#0aa6c7;color:#fff}.tab-switch{width:max-content;max-width:90%;margin:-34px auto 42px;background:#fff;border-radius:999px;padding:8px;box-shadow:0 18px 46px rgba(0,0,0,.14);position:relative;z-index:3}.tab-switch button{box-shadow:none;min-width:170px}.section{max-width:1250px;margin:0 auto 50px;padding:0 22px}.section-head{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:24px}.section-head h2{font-size:clamp(32px,4vw,52px);letter-spacing:.08em;margin:0;color:#102936}.section-head span{color:#00647a;font-weight:800}.top-grid,.place-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.filters-panel{max-width:1250px;margin:0 auto 46px;padding:20px;display:grid;grid-template-columns:2fr repeat(4,1fr);gap:12px;background:#fff;border:1px solid #e4efe9;border-radius:24px;box-shadow:0 14px 40px rgba(8,52,55,.06)}.filters-panel input,.filters-panel select{border:1px solid #dbe9e2;border-radius:16px;padding:14px 16px;font-weight:700;outline:none}.filters-panel button{background:#064e45;color:#fff;border-radius:16px}.exp-card{background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 18px 42px rgba(7,43,44,.08);border:1px solid #e7eee7;display:flex;flex-direction:column;min-height:100%}.exp-photo{height:235px;display:block;position:relative;overflow:hidden;background:#ddd}.exp-photo img{width:100%;height:100%;object-fit:cover;transition:transform .35s}.exp-card:hover .exp-photo img{transform:scale(1.06)}.exp-region,.exp-featured{position:absolute;top:16px;border-radius:999px;padding:8px 14px;font-size:12px;font-weight:900}.exp-region{left:16px;background:#fff;color:#035f64}.exp-featured{right:16px;background:#ffc22b;color:#0d3d39}.exp-body{padding:18px;display:flex;flex-direction:column;flex:1}.exp-title-row{display:flex;justify-content:space-between;gap:12px}.exp-title-row h3{margin:0;color:#064e45;font-size:22px}.exp-location{margin:7px 0 0;color:#08715f;font-weight:800}.budget-pill{height:max-content;padding:7px 12px;border-radius:999px;text-transform:uppercase;font-size:12px;font-weight:900}.budget-pill.low{background:#dcfce7;color:#166534}.budget-pill.medium{background:#fff3c4;color:#8a5b00}.budget-pill.high{background:#fee2e2;color:#991b1b}.exp-desc{line-height:1.65;color:#415466;font-weight:600}.exp-meta,.exp-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto}.exp-meta span{background:#f0faf6;border:1px solid #d9eee4;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:800}.exp-tags span{background:#f6f4ed;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:800}.exp-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px}.exp-actions a,.exp-actions button{text-decoration:none;border:none;border-radius:14px;text-align:center;padding:12px 8px;font-weight:900;cursor:pointer}.exp-actions a:first-child{background:#064e45;color:#fff}.exp-actions button{background:#ffc22b;color:#063c38}.exp-actions a:last-child{background:#fff;color:#006b5c;border:1px solid #006b5c}.season-section{max-width:1250px;margin:20px auto 70px;padding:32px 22px;border-radius:0;background:#004c41;color:#fff;display:grid;grid-template-columns:.34fr .66fr;gap:28px}.month-pill{background:#fff6c9;color:#3b3b00;border-radius:999px;padding:10px 16px;font-weight:900;font-size:12px}.season-section h2{font-size:42px;margin:28px 0 16px}.season-section p{line-height:1.8;color:#d9fff8;font-weight:700}.season-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.season-card{display:grid;grid-template-columns:88px 1fr;gap:16px;padding:14px;border:1px solid rgba(255,255,255,.17);border-radius:20px;background:rgba(255,255,255,.08);text-decoration:none;color:#fff}.season-card img{width:88px;height:78px;object-fit:cover;border-radius:14px}.season-card small{color:#ffe68b;font-weight:900}.season-card strong{display:block;margin:6px 0}.season-card span{color:#cdfef4;font-weight:700}.itinerary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.itinerary-card{background:#fff;border:1px solid #e1ebe6;border-radius:26px;padding:24px;box-shadow:0 16px 40px rgba(0,0,0,.06)}.itinerary-card h3{font-size:26px;color:#064e45;margin:0 0 8px}.itinerary-card>span{color:#b45309;font-weight:900}.itinerary-card p{line-height:1.7;color:#475569}.itinerary-card div{display:flex;flex-direction:column;gap:8px}.itinerary-card a{padding:10px 12px;background:#f0faf6;color:#064e45;border-radius:12px;text-decoration:none;font-weight:800}.state-card{max-width:900px;margin:30px auto;padding:22px;border-radius:18px;background:#fff;border:1px dashed #cadbd4;text-align:center;font-weight:800}.state-card.error{color:#9b1c1c;background:#fff1f1}@media(max-width:1050px){.top-grid,.place-grid,.itinerary-grid{grid-template-columns:repeat(2,1fr)}.filters-panel,.season-section{grid-template-columns:1fr}}@media(max-width:680px){.top-grid,.place-grid,.itinerary-grid,.season-grid{grid-template-columns:1fr}.filters-panel{grid-template-columns:1fr}.tab-switch{display:grid;width:auto}.hero-categories button{width:100%}.section-head{display:block}.exp-actions{grid-template-columns:1fr}}
`;
