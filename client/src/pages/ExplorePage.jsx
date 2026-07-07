import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  exploreCategories,
  explorePlaces,
  formatLkr,
  sriLankaRegions,
} from "../data/exploreData";
import PlaceDetailModal from "../components/PlaceDetailModal";

const SAVED_PLACES_KEY = "tourismhub_trip_places";
const getSavedPlaces = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_PLACES_KEY) || "[]") || []; }
  catch { return []; }
};

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const budgetOptions = ["All Budgets", "Low", "Medium", "High"];

const routeIdeas = [
  { title: "Cultural Triangle Route", days: "3-4 days", tone: "Heritage, temples, ancient kingdoms", placeNames: ["Sigiriya Rock Fortress","Dambulla Cave Temple"], linkCity: "Sigiriya" },
  { title: "Hill Country Slow Route", days: "4-5 days", tone: "Tea fields, train views, waterfalls", placeNames: ["Nine Arch Bridge","Nuwara Eliya Tea Plantations"], linkCity: "Ella" },
  { title: "South Coast + Safari", days: "5-6 days", tone: "Beach, fort, whales, wildlife", placeNames: ["Mirissa Beach & Whale Watching","Galle Fort","Yala National Park"], linkCity: "Mirissa" },
];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPlaceIdFromQuery = searchParams.get("place");
  const destinationsRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedBudget, setSelectedBudget] = useState("All Budgets");
  const [sortBy, setSortBy] = useState("recommended");
  const [savedPlaces, setSavedPlaces] = useState(getSavedPlaces);
  const [notice, setNotice] = useState("");
  const [showTray, setShowTray] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [viewMode, setViewMode] = useState("grid");

  const currentMonthIdx = useMemo(() => new Date().getMonth(), []);
  const currentMonthName = monthNames[currentMonthIdx];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    if (!selectedPlaceIdFromQuery) return;
    const match = explorePlaces.find(p => String(p.id) === selectedPlaceIdFromQuery);
    if (match) { setSelectedPlace(match); setIsModalOpen(true); }
  }, [selectedPlaceIdFromQuery]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  // Hero slide auto-play
  const featuredPlaces = useMemo(() => explorePlaces.filter(p => p.featured).slice(0, 5), []);
  useEffect(() => {
    const t = setInterval(() => setHeroSlide(p => (p + 1) % featuredPlaces.length), 4500);
    return () => clearInterval(t);
  }, [featuredPlaces.length]);

  const seasonalPlaces = useMemo(() => explorePlaces.filter(p => p.bestMonths?.includes(currentMonthIdx)).slice(0, 6), [currentMonthIdx]);

  const categoryCounts = useMemo(() => {
    const acc = {};
    exploreCategories.forEach(c => {
      acc[c.id] = c.id === "all" ? explorePlaces.length : explorePlaces.filter(p => p.category === c.id).length;
    });
    return acc;
  }, []);

  const filteredPlaces = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const result = explorePlaces.filter(place => {
      if (selectedCategory !== "all" && place.category !== selectedCategory) return false;
      if (selectedRegion !== "All Regions" && place.region !== selectedRegion) return false;
      if (selectedBudget !== "All Budgets" && place.budget !== selectedBudget) return false;
      if (q && !(
        place.name.toLowerCase().includes(q) ||
        place.city.toLowerCase().includes(q) ||
        place.district.toLowerCase().includes(q) ||
        place.region.toLowerCase().includes(q) ||
        (place.vibe || "").toLowerCase().includes(q) ||
        place.tags.some(t => t.toLowerCase().includes(q))
      )) return false;
      return true;
    });
    if (sortBy === "budgetLow") return [...result].sort((a, b) => a.budgetScore - b.budgetScore);
    if (sortBy === "budgetHigh") return [...result].sort((a, b) => b.budgetScore - a.budgetScore);
    if (sortBy === "name") return [...result].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "cost") return [...result].sort((a, b) => a.estimatedCost - b.estimatedCost);
    return result;
  }, [searchText, selectedCategory, selectedRegion, selectedBudget, sortBy]);

  const activeFilters = selectedCategory !== "all" || selectedRegion !== "All Regions" || selectedBudget !== "All Budgets" || searchText.trim();

  const openPlaceDetail = (place) => {
    const next = new URLSearchParams(searchParams);
    next.set("place", String(place.id));
    setSearchParams(next);
    setSelectedPlace(place);
    setIsModalOpen(true);
  };
  const closePlaceDetail = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("place");
    setSearchParams(next, { replace: true });
    setSelectedPlace(null);
    setIsModalOpen(false);
  };

  const isPlaceSaved = (id) => savedPlaces.some(s => s.id === id);
  const addToTrip = (place) => {
    const cur = getSavedPlaces();
    if (cur.some(s => s.id === place.id)) { setNotice(`${place.name} is already saved.`); setShowTray(true); return; }
    const updated = [...cur, place];
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updated));
    setSavedPlaces(updated);
    setNotice(`✓ ${place.name} added to your trip.`);
    setShowTray(true);
  };
  const removeFromTrip = (id, e) => {
    if (e) e.stopPropagation();
    const updated = getSavedPlaces().filter(s => s.id !== id);
    localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(updated));
    setSavedPlaces(updated);
  };
  const clearFilters = () => { setSearchText(""); setSelectedCategory("all"); setSelectedRegion("All Regions"); setSelectedBudget("All Budgets"); setSortBy("recommended"); };
  const jumpToDest = () => destinationsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const handleCatSelect = (id) => { setSelectedCategory(id); setTimeout(jumpToDest, 80); };

  return (
    <main className="ex" id="explore-top">
      <style>{css}</style>

      <PlaceDetailModal place={selectedPlace} isOpen={isModalOpen} onClose={closePlaceDetail} onAddToTrip={addToTrip} isSaved={selectedPlace ? isPlaceSaved(selectedPlace.id) : false} onRemoveFromTrip={removeFromTrip} />

      {/* ═══ SAVED TRAY ═══ */}
      {showTray && <div className="tray-backdrop" onClick={() => setShowTray(false)} />}
      <aside className={`tray ${showTray ? "open" : ""}`}>
        <div className="tray-head">
          <div><small>SAVED PLACES</small><strong>{savedPlaces.length} selected</strong></div>
          <button onClick={() => setShowTray(false)}>✕</button>
        </div>
        <div className="tray-body">
          {savedPlaces.length === 0 ? <p className="tray-empty">Save destinations below, then arrange them in Trip Planner.</p> : savedPlaces.map(p => (
            <div key={p.id} className="tray-item">
              <img src={p.image} alt={p.name} />
              <div><strong>{p.name}</strong><span>{p.city} · {formatLkr(p.estimatedCost)}</span></div>
              <button onClick={e => removeFromTrip(p.id, e)}>✕</button>
            </div>
          ))}
        </div>
        {savedPlaces.length > 0 && <div className="tray-foot"><Link to="/trip-planner">Open Trip Planner →</Link></div>}
      </aside>
      <button className="fab" onClick={() => setShowTray(true)}><span className="fab-count">{savedPlaces.length}</span>Saved</button>

      {/* ═══ HERO ═══ */}
      <section className="ex-hero">
        <div className="ex-hero-left">
          <span className="kicker">🧭 Explore Sri Lanka</span>
          <h1>Find places that match<br />your travel story.</h1>
          <p>Browse culture, beaches, wildlife, hill country and spiritual places. Open a place story, save it, then build your route.</p>

          <div className="search-box">
            <div className="search-main">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Try Ella, beach, safari, temple..." />
              {searchText && <button className="search-clear" onClick={() => setSearchText("")}>✕</button>}
            </div>
            <div className="search-filters">
              <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}>{sriLankaRegions.map(r => <option key={r}>{r}</option>)}</select>
              <select value={selectedBudget} onChange={e => setSelectedBudget(e.target.value)}>{budgetOptions.map(b => <option key={b}>{b}</option>)}</select>
              <button className="search-go" onClick={jumpToDest}>Show places</button>
            </div>
          </div>

          <div className="hero-chips">
            <div className="chip"><strong>{explorePlaces.length}+</strong><span>places</span></div>
            <div className="chip"><strong>{exploreCategories.length - 1}</strong><span>styles</span></div>
            <div className="chip"><strong>{savedPlaces.length}</strong><span>saved</span></div>
          </div>
        </div>

        <div className="ex-hero-right">
          <div className="hero-gallery">
            {featuredPlaces.map((p, i) => (
              <button key={p.id} className={`gal-slide ${i === heroSlide ? "active" : ""}`} onClick={() => openPlaceDetail(p)}>
                <img src={p.image} alt={p.name} />
                <div className="gal-info"><span>{p.region}</span><strong>{p.name}</strong><em>{p.experiences.length} experiences · {p.duration}</em></div>
              </button>
            ))}
            <div className="gal-dots">{featuredPlaces.map((p, i) => <button key={p.id} className={`gal-dot ${i === heroSlide ? "on" : ""}`} onClick={() => setHeroSlide(i)} />)}</div>
            <div className="gal-counter">{heroSlide + 1}/{featuredPlaces.length}</div>
          </div>
        </div>
      </section>

      {/* ═══ NOTICE ═══ */}
      {notice && <div className="notice"><span>{notice}</span><Link to="/trip-planner">Open planner →</Link></div>}

      {/* ═══ STEPS ═══ */}
      <section className="steps-strip">
        {[{n:"01",t:"Pick a style",d:"Beach, culture, wildlife, or food."},{n:"02",t:"Open the story",d:"Photos, tips, cost, nearby places."},{n:"03",t:"Save & plan",d:"Add to Trip Planner, find hotels."}].map((s, i) => (
          <div key={s.n} className={`step-card ${i === 0 ? "active" : ""}`}><span>{s.n}</span><strong>{s.t}</strong><p>{s.d}</p></div>
        ))}
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section className="cat-section">
        <div className="sec-head"><div><span className="kicker">Travel styles</span><h2>Start with what excites you</h2></div>{activeFilters && <button className="reset-btn" onClick={clearFilters}>✕ Reset filters</button>}</div>
        <div className="cat-grid">
          {exploreCategories.map(c => (
            <button key={c.id} className={`cat-card ${selectedCategory === c.id ? "on" : ""}`} onClick={() => handleCatSelect(c.id)}>
              <span className="cat-icon">{c.icon}</span>
              <strong>{c.label}</strong>
              <small>{categoryCounts[c.id] || 0}</small>
            </button>
          ))}
        </div>
      </section>

      {/* ═══ SEASONAL ═══ */}
      <section className="season-section">
        <div className="season-left">
          <span className="kicker kicker-gold">📅 Good in {currentMonthName}</span>
          <h2>Season-aware picks</h2>
          <p>Sri Lanka has different travel seasons across regions. These fit the current month.</p>
        </div>
        <div className="season-grid">
          {seasonalPlaces.map(p => (
            <button key={p.id} className="season-card" onClick={() => openPlaceDetail(p)}>
              <img src={p.image} alt={p.name} />
              <div><small>{p.bestTime}</small><strong>{p.name}</strong><span>{p.region}</span></div>
            </button>
          ))}
        </div>
      </section>

      {/* ═══ DESTINATION LIBRARY ═══ */}
      <section className="dest-section" id="destinations" ref={destinationsRef}>
        <div className="dest-toolbar">
          <div><span className="kicker">Destination library</span><h2>{filteredPlaces.length} places to explore</h2></div>
          <div className="toolbar-right">
            <div className="view-toggle">
              <button className={viewMode === "grid" ? "on" : ""} onClick={() => setViewMode("grid")} title="Grid">▦</button>
              <button className={viewMode === "list" ? "on" : ""} onClick={() => setViewMode("list")} title="List">☰</button>
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-sel">
              <option value="recommended">Recommended</option>
              <option value="name">Name A-Z</option>
              <option value="cost">Cost ↑</option>
              <option value="budgetLow">Budget ↑</option>
              <option value="budgetHigh">Budget ↓</option>
            </select>
          </div>
        </div>

        {activeFilters && (
          <div className="active-filters">
            <span>Filters:</span>
            {selectedCategory !== "all" && <span className="af-chip">{exploreCategories.find(c => c.id === selectedCategory)?.label} <button onClick={() => setSelectedCategory("all")}>✕</button></span>}
            {selectedRegion !== "All Regions" && <span className="af-chip">{selectedRegion} <button onClick={() => setSelectedRegion("All Regions")}>✕</button></span>}
            {selectedBudget !== "All Budgets" && <span className="af-chip">{selectedBudget} <button onClick={() => setSelectedBudget("All Budgets")}>✕</button></span>}
            {searchText && <span className="af-chip">"{searchText}" <button onClick={() => setSearchText("")}>✕</button></span>}
            <button className="af-clear" onClick={clearFilters}>Clear all</button>
          </div>
        )}

        {filteredPlaces.length === 0 ? (
          <div className="no-results"><span>🔍</span><h3>No places match your filters</h3><p>Try adjusting your search or clearing filters.</p><button onClick={clearFilters}>Clear all filters</button></div>
        ) : (
          <div className={viewMode === "grid" ? "dest-grid" : "dest-list"}>
            {filteredPlaces.map(place => (
              <article key={place.id} className={viewMode === "grid" ? "pcard" : "pcard pcard-list"}>
                <button className="pcard-img" onClick={() => openPlaceDetail(place)}>
                  <img src={place.image} alt={place.name} loading="lazy" />
                  <span className="pcard-region">{place.region}</span>
                  <span className="pcard-hover">View place story →</span>
                  {place.featured && <span className="pcard-featured">★ Featured</span>}
                </button>
                <div className="pcard-body">
                  <div className="pcard-top">
                    <div>
                      <h3 className="pcard-name" onClick={() => openPlaceDetail(place)}>{place.name}</h3>
                      <p className="pcard-loc">📍 {place.city}, {place.district}</p>
                    </div>
                    <span className={`bpill b-${place.budget.toLowerCase()}`}>{place.budget}</span>
                  </div>
                  <p className="pcard-desc">{place.shortDescription}</p>
                  <div className="pcard-meta">
                    <span>⏱ {place.duration}</span>
                    <span>📅 {place.bestTime}</span>
                    <span>💰 {formatLkr(place.estimatedCost)}</span>
                  </div>
                  <div className="pcard-tags">{place.tags.slice(0, 4).map(t => <span key={t}>{t}</span>)}</div>
                  <div className="pcard-exp-preview" onClick={() => openPlaceDetail(place)}>
                    <span>🎯 {place.experiences.length} experiences</span>
                    <span>📸 {place.images.length} photos</span>
                    <span>💡 {place.tips.length} tips</span>
                  </div>
                  <div className="pcard-actions">
                    <button className="act-detail" onClick={() => openPlaceDetail(place)}>View Details</button>
                    {isPlaceSaved(place.id) ? (
                      <button className="act-saved" onClick={e => removeFromTrip(place.id, e)}>✓ Saved</button>
                    ) : (
                      <button className="act-save" onClick={() => addToTrip(place)}>+ Save to trip</button>
                    )}
                    <Link to={`/hotels?city=${encodeURIComponent(place.city)}`} className="act-hotel">🏨 Hotels</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ═══ ROUTES ═══ */}
      <section className="routes-section">
        <div className="sec-head"><div><span className="kicker">Route ideas</span><h2>Simple multi-day itineraries</h2></div><Link to="/trip-planner" className="outline-btn">Open Planner</Link></div>
        <div className="routes-grid">
          {routeIdeas.map(r => {
            const rp = r.placeNames.map(n => explorePlaces.find(p => p.name === n)).filter(Boolean);
            return (
              <article key={r.title} className="route-card">
                <div className="route-imgs">{rp.slice(0, 3).map((p, i) => <img key={p.id} src={p.image} alt={p.name} className={`ri ri-${i + 1}`} />)}</div>
                <div className="route-body">
                  <small>{r.days}</small><h3>{r.title}</h3><p>{r.tone}</p>
                  <div className="route-places">{rp.map(p => <button key={p.id} onClick={() => openPlaceDetail(p)}>{p.name}</button>)}</div>
                  <Link to={`/hotels?city=${encodeURIComponent(r.linkCity)}`} className="route-link">Hotels near {r.linkCity} →</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="final-cta">
        <div><span className="kicker kicker-light">Next step</span><h2>Save the places you like, then build your route.</h2><p>TourismHub connects destination discovery with trip planning and hotel booking.</p></div>
        <Link to="/trip-planner" className="cta-btn">Plan my trip →</Link>
      </section>
    </main>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.ex{--g:#087466;--gd:#073f3a;--mint:#d8fff4;--gold:#ffc22b;--paper:#fbf7ee;--soft:#f2faf6;--ink:#172033;--mut:#64748b;--ln:#d6efe7;min-height:100vh;background:radial-gradient(circle at top left,rgba(24,184,147,.1),transparent 35%),linear-gradient(180deg,#fff 0%,var(--paper) 100%);color:var(--ink);font-family:Inter,system-ui,-apple-system,sans-serif;padding-bottom:80px}

/* ── Kicker ── */
.kicker{display:inline-flex;padding:7px 14px;border-radius:999px;background:var(--mint);color:var(--g);font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.1em}
.kicker-gold{background:#fff4cc;color:#9a6400}
.kicker-light{background:rgba(255,255,255,.14);color:var(--mint);border:1px solid rgba(255,255,255,.25)}

/* ── Tray ── */
.tray-backdrop{position:fixed;inset:0;background:rgba(7,63,58,.45);z-index:2100;backdrop-filter:blur(4px)}
.tray{position:fixed;inset:0 0 0 auto;width:min(400px,100vw);transform:translateX(105%);transition:transform .3s ease;background:#fff;z-index:2200;display:flex;flex-direction:column;box-shadow:-16px 0 50px rgba(7,63,58,.25)}
.tray.open{transform:translateX(0)}
.tray-head{padding:22px;background:var(--gd);color:#fff;display:flex;justify-content:space-between;align-items:center}
.tray-head small{display:block;color:#b7fff0;font-weight:800;font-size:11px;letter-spacing:.12em}
.tray-head strong{font-size:24px}
.tray-head button{border:none;background:none;color:#fff;font-size:26px;cursor:pointer}
.tray-body{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:12px}
.tray-empty{color:var(--mut);font-weight:700;text-align:center;margin-top:40px;line-height:1.7}
.tray-item{display:grid;grid-template-columns:60px 1fr auto;gap:12px;align-items:center;padding:10px;border:1px solid var(--ln);border-radius:18px;background:var(--soft)}
.tray-item img{width:60px;height:60px;border-radius:14px;object-fit:cover}
.tray-item strong{display:block;font-size:14px;color:var(--gd)}
.tray-item>div>span{color:var(--mut);font-size:12px;font-weight:700}
.tray-item>button{border:none;width:30px;height:30px;border-radius:50%;background:#fee2e2;color:#b91c1c;font-weight:900;cursor:pointer;font-size:14px}
.tray-foot{padding:18px;border-top:1px solid var(--ln)}
.tray-foot a{display:block;text-align:center;background:linear-gradient(135deg,var(--g),#19b39f);color:#fff;padding:15px;border-radius:999px;font-weight:900;text-decoration:none}
.fab{position:fixed;right:24px;bottom:24px;z-index:1200;border:none;background:var(--gd);color:#fff;border-radius:999px;padding:14px 22px;box-shadow:0 16px 40px rgba(7,63,58,.25);font-weight:900;cursor:pointer;font-size:14px;transition:all .2s}
.fab:hover{transform:translateY(-3px);box-shadow:0 22px 50px rgba(7,63,58,.3)}
.fab-count{background:var(--gold);color:var(--gd);padding:3px 9px;border-radius:999px;margin-right:8px;font-weight:900}

/* ── Hero ── */
.ex-hero{max-width:1200px;margin:0 auto;padding:60px 22px 30px;display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:center}
.ex-hero h1{margin:16px 0 14px;font-size:clamp(38px,5.5vw,68px);line-height:.95;letter-spacing:-.05em;color:var(--gd)}
.ex-hero>div>p{color:#334155;font-size:17px;line-height:1.75;font-weight:600;max-width:560px}

.search-box{margin-top:24px;border:1px solid var(--ln);background:rgba(255,255,255,.95);border-radius:24px;padding:16px;box-shadow:0 20px 50px rgba(7,63,58,.07)}
.search-main{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f8fffc;border:1px solid #c7efe4;border-radius:16px;margin-bottom:12px}
.search-main svg{color:var(--g);flex-shrink:0}
.search-main input{flex:1;border:none;background:none;outline:none;font-size:15px;font-weight:700;color:var(--ink)}
.search-main input::placeholder{color:#94a3b8}
.search-clear{border:none;background:none;color:var(--mut);font-size:18px;cursor:pointer;padding:0 4px}
.search-filters{display:grid;grid-template-columns:1fr 1fr auto;gap:10px}
.search-filters select{border:1px solid #c7efe4;background:#f8fffc;border-radius:14px;padding:12px;font-weight:700;color:var(--ink);outline:none}
.search-go{border:none;border-radius:14px;padding:12px 18px;background:var(--gold);color:var(--gd);font-weight:900;cursor:pointer;white-space:nowrap}

.hero-chips{display:flex;gap:10px;margin-top:18px}
.chip{border:1px solid var(--ln);border-radius:16px;padding:12px 18px;background:#fff}
.chip strong{display:block;color:var(--g);font-size:20px;font-weight:900}
.chip span{color:var(--mut);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}

/* Hero Gallery */
.hero-gallery{position:relative;height:520px;border-radius:28px;overflow:hidden;background:var(--gd);box-shadow:0 24px 60px rgba(7,63,58,.18)}
.gal-slide{position:absolute;inset:0;border:none;padding:0;cursor:pointer;opacity:0;transform:scale(1.04);transition:opacity 1s ease,transform 5s ease;background:var(--gd);width:100%;text-align:left}
.gal-slide.active{opacity:1;transform:scale(1)}
.gal-slide img{width:100%;height:100%;object-fit:cover;filter:brightness(.88)}
.gal-slide::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,rgba(0,0,0,.8))}
.gal-info{position:absolute;z-index:2;left:24px;right:24px;bottom:24px;color:#fff}
.gal-info span{color:#fde68a;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
.gal-info strong{display:block;font-size:30px;line-height:1.05;margin:8px 0 6px}
.gal-info em{font-style:normal;color:#d1fae5;font-size:14px;font-weight:700}
.gal-dots{position:absolute;z-index:3;bottom:24px;right:24px;display:flex;gap:6px}
.gal-dot{width:10px;height:10px;border-radius:50%;border:2px solid rgba(255,255,255,.5);background:none;cursor:pointer;padding:0;transition:all .2s}
.gal-dot.on{background:#fbbf24;border-color:#fbbf24;transform:scale(1.2)}
.gal-counter{position:absolute;z-index:3;top:16px;right:16px;background:rgba(0,0,0,.5);color:#fff;padding:6px 12px;border-radius:99px;font-size:12px;font-weight:800}

/* ── Notice ── */
.notice{max-width:1200px;margin:12px auto;padding:14px 20px;border-radius:16px;display:flex;justify-content:space-between;gap:12px;background:#eafff8;border:1px solid #baf5e7;color:var(--gd);font-weight:800;font-size:14px}
.notice a{color:var(--g);text-decoration:none;border-bottom:2px solid var(--g)}

/* ── Steps ── */
.steps-strip{max-width:1200px;margin:22px auto 0;padding:0 22px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.step-card{background:#fff;border:1px solid var(--ln);border-radius:20px;padding:18px;display:flex;gap:14px;align-items:flex-start}
.step-card span{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--g);color:#fff;font-weight:900;font-size:14px;flex-shrink:0}
.step-card strong{display:block;color:var(--gd);font-size:15px}
.step-card p{margin:4px 0 0;color:var(--mut);font-size:13px;line-height:1.5;font-weight:600}
.step-card.active{border-color:#7ee8d6;background:linear-gradient(135deg,#fff,#effffb)}

/* ── Categories ── */
.cat-section{max-width:1200px;margin:0 auto;padding:52px 22px 20px}
.sec-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:24px;flex-wrap:wrap}
.sec-head h2,.dest-toolbar h2,.season-left h2,.final-cta h2{margin:12px 0 0;font-size:clamp(26px,3.8vw,42px);line-height:1.04;letter-spacing:-.04em;color:var(--gd)}
.reset-btn,.outline-btn{border:1px solid #2ab3a1;color:var(--g);background:#fff;border-radius:999px;padding:12px 20px;font-weight:900;font-size:13px;cursor:pointer;text-decoration:none;white-space:nowrap}
.cat-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}
.cat-card{min-height:110px;border:1px solid var(--ln);border-radius:22px;background:#fff;padding:14px;text-align:left;cursor:pointer;transition:all .2s}
.cat-card:hover{transform:translateY(-4px);box-shadow:0 14px 36px rgba(7,63,58,.08);border-color:#69d9c8}
.cat-card.on{background:var(--gd);color:#fff;border-color:var(--gd)}
.cat-icon{display:flex;width:38px;height:38px;align-items:center;justify-content:center;border-radius:14px;background:var(--mint);font-size:18px;margin-bottom:10px}
.cat-card.on .cat-icon{background:rgba(255,255,255,.15)}
.cat-card strong{display:block;font-size:13px;line-height:1.2}
.cat-card small{display:block;margin-top:6px;color:var(--mut);font-weight:800;font-size:12px}
.cat-card.on small{color:#b9fff0}

/* ── Seasonal ── */
.season-section{max-width:1200px;margin:36px auto 0;padding:28px;border-radius:28px;display:grid;grid-template-columns:.38fr .62fr;gap:24px;background:linear-gradient(135deg,var(--gd),var(--g));color:#fff;overflow:hidden}
.season-left p{color:#d9fff6;line-height:1.7;font-weight:600;margin-top:10px}
.season-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.season-card{display:grid;grid-template-columns:72px 1fr;gap:12px;padding:10px;border:1px solid rgba(255,255,255,.16);border-radius:18px;background:rgba(255,255,255,.08);color:#fff;text-align:left;cursor:pointer;backdrop-filter:blur(8px);transition:all .2s}
.season-card:hover{background:rgba(255,255,255,.16);transform:translateY(-2px)}
.season-card img{width:72px;height:72px;border-radius:14px;object-fit:cover}
.season-card small{color:#fff3ae;font-size:11px;font-weight:900;text-transform:uppercase}
.season-card strong{display:block;margin:4px 0}
.season-card>div>span{color:#b9fff0;font-weight:700;font-size:13px}

/* ── Destinations ── */
.dest-section{max-width:1200px;margin:0 auto;padding:52px 22px 14px}
.dest-toolbar{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:20px;flex-wrap:wrap}
.toolbar-right{display:flex;align-items:center;gap:12px}
.view-toggle{display:flex;border:1px solid var(--ln);border-radius:12px;overflow:hidden}
.view-toggle button{border:none;padding:10px 14px;background:#fff;cursor:pointer;font-size:16px;color:var(--mut);transition:all .15s}
.view-toggle button.on{background:var(--gd);color:#fff}
.sort-sel{border:1px solid var(--ln);border-radius:12px;padding:10px 14px;font-weight:700;color:var(--gd);background:#fff;outline:none}

.active-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:18px;font-size:13px;font-weight:700;color:var(--mut)}
.af-chip{display:inline-flex;align-items:center;gap:6px;background:var(--mint);color:var(--gd);padding:6px 12px;border-radius:999px;font-weight:800}
.af-chip button{border:none;background:none;color:var(--g);cursor:pointer;font-size:14px;padding:0}
.af-clear{border:none;background:none;color:#b91c1c;cursor:pointer;font-weight:800;text-decoration:underline}

.no-results{text-align:center;padding:60px 20px;background:#fff;border-radius:24px;border:1px dashed var(--ln)}
.no-results span{font-size:48px;display:block;margin-bottom:16px}
.no-results h3{margin:0 0 8px;color:var(--gd)}
.no-results p{color:var(--mut);margin:0 0 20px}
.no-results button{border:1px solid var(--g);background:#fff;color:var(--g);padding:12px 22px;border-radius:999px;font-weight:800;cursor:pointer}

.dest-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.dest-list{display:flex;flex-direction:column;gap:16px}

/* Place Card */
.pcard{background:#fff;border-radius:24px;overflow:hidden;border:1px solid var(--ln);box-shadow:0 14px 38px rgba(7,63,58,.06);display:flex;flex-direction:column;transition:all .22s}
.pcard:hover{transform:translateY(-5px);box-shadow:0 24px 55px rgba(7,63,58,.12)}
.pcard-list{flex-direction:row}
.pcard-list .pcard-img{width:300px;height:auto;min-height:260px;flex-shrink:0}
.pcard-list .pcard-body{flex:1}
.pcard-img{position:relative;width:100%;height:220px;border:none;padding:0;cursor:pointer;overflow:hidden;background:var(--gd);text-align:left}
.pcard-img::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.03),rgba(0,0,0,.35));pointer-events:none}
.pcard-img img{width:100%;height:100%;object-fit:cover;transition:transform .4s ease}
.pcard:hover .pcard-img img{transform:scale(1.06)}
.pcard-region{position:absolute;z-index:2;top:14px;left:14px;background:rgba(255,255,255,.93);color:var(--g);border-radius:999px;padding:7px 12px;font-weight:900;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
.pcard-featured{position:absolute;z-index:2;top:14px;right:14px;background:var(--gold);color:var(--gd);border-radius:999px;padding:6px 12px;font-weight:900;font-size:11px}
.pcard-hover{position:absolute;z-index:3;inset:auto 16px 16px 16px;transform:translateY(16px);opacity:0;background:var(--gold);color:var(--gd);border-radius:999px;padding:12px;font-weight:900;text-align:center;font-size:13px;transition:all .22s}
.pcard-img:hover .pcard-hover{opacity:1;transform:translateY(0)}

.pcard-body{padding:18px;display:flex;flex-direction:column;flex:1}
.pcard-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.pcard-name{margin:0;color:var(--gd);font-size:20px;line-height:1.15;letter-spacing:-.03em;cursor:pointer;transition:color .15s}
.pcard-name:hover{color:var(--g)}
.pcard-loc{margin:6px 0 0;color:var(--g);font-weight:800;font-size:13px}
.bpill{white-space:nowrap;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:900;text-transform:uppercase;flex-shrink:0}
.b-low{background:#e7f8ee;color:#127044}
.b-medium{background:#fff3c6;color:#9a6400}
.b-high{background:#fee2e2;color:#b91c1c}
.pcard-desc{color:#475569;line-height:1.62;font-weight:600;font-size:14px;flex:1;margin:10px 0}
.pcard-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.pcard-meta span{background:var(--soft);color:var(--gd);border:1px solid var(--ln);border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800}
.pcard-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.pcard-tags span{color:#334155;background:#f7f7f3;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800}
.pcard-exp-preview{display:flex;gap:10px;flex-wrap:wrap;padding:10px 12px;background:linear-gradient(135deg,#f0faf6,#fefce8);border:1px solid #d4e8d9;border-radius:14px;margin-bottom:12px;cursor:pointer;transition:background .15s}
.pcard-exp-preview:hover{background:#e8f5ee}
.pcard-exp-preview span{font-size:12px;font-weight:800;color:var(--gd)}
.pcard-actions{display:grid;grid-template-columns:1fr 1fr .8fr;gap:8px;margin-top:auto}
.pcard-actions a,.pcard-actions button{border:none;border-radius:14px;padding:11px 8px;text-align:center;font-weight:900;font-size:12px;text-decoration:none;cursor:pointer;transition:all .15s}
.act-detail{background:var(--gd);color:#fff}
.act-detail:hover{background:#0a524b}
.act-save{background:var(--gold);color:var(--gd)}
.act-save:hover{background:#f5b800}
.act-saved{background:#e9fff8;color:var(--g);border:1px solid var(--ln)!important}
.act-hotel{background:#fff;color:var(--g);border:1px solid var(--g)!important}
.act-hotel:hover{background:var(--soft)}

/* ── Routes ── */
.routes-section{max-width:1200px;margin:0 auto;padding:52px 22px 10px}
.routes-grid{margin-top:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.route-card{background:#fff;border:1px solid var(--ln);border-radius:26px;padding:16px;box-shadow:0 14px 36px rgba(7,63,58,.05);transition:all .2s}
.route-card:hover{transform:translateY(-4px);box-shadow:0 22px 50px rgba(7,63,58,.1)}
.route-imgs{height:140px;position:relative;margin-bottom:16px}
.ri{position:absolute;width:52%;height:100px;object-fit:cover;border-radius:18px;box-shadow:0 10px 22px rgba(7,63,58,.12);border:3px solid #fff}
.ri-1{left:0;top:0}
.ri-2{right:0;top:16px}
.ri-3{left:22%;bottom:0}
.route-body small{color:var(--g);font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:.07em}
.route-body h3{color:var(--gd);margin:6px 0;font-size:22px}
.route-body>p{color:#475569;line-height:1.55;font-weight:600;margin:0 0 12px}
.route-places{display:flex;flex-direction:column;gap:7px;margin-bottom:12px}
.route-places button{border:1px solid var(--ln);background:var(--soft);color:var(--gd);border-radius:14px;padding:9px 12px;font-weight:800;text-align:left;cursor:pointer;font-size:13px;transition:all .15s}
.route-places button:hover{border-color:var(--g);background:#e8f5ee}
.route-link{color:var(--g);font-weight:900;text-decoration:none;border-bottom:2px solid var(--g);font-size:14px}

/* ── Final CTA ── */
.final-cta{max-width:1200px;margin:52px auto 0;padding:36px;border-radius:28px;background:linear-gradient(135deg,var(--gd),var(--g));color:#fff;display:flex;justify-content:space-between;align-items:center;gap:28px}
.final-cta p{max-width:600px;color:var(--mint);line-height:1.7;font-weight:600;margin:10px 0 0}
.cta-btn{background:var(--gold);color:var(--gd);padding:16px 28px;border-radius:999px;text-decoration:none;font-weight:900;white-space:nowrap;font-size:15px;transition:all .2s}
.cta-btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(255,194,43,.3)}

/* ── Responsive ── */
@media(max-width:1100px){.dest-grid,.routes-grid{grid-template-columns:repeat(2,1fr)}.cat-grid{grid-template-columns:repeat(4,1fr)}.ex-hero{grid-template-columns:1fr}.hero-gallery{height:400px}}
@media(max-width:760px){.search-filters,.steps-strip,.season-section,.dest-toolbar,.final-cta{display:grid;grid-template-columns:1fr}.dest-grid,.routes-grid,.cat-grid,.season-grid{grid-template-columns:1fr}.pcard-actions{grid-template-columns:1fr}.pcard-list{flex-direction:column}.pcard-list .pcard-img{width:100%;height:220px}.sec-head{flex-direction:column;align-items:flex-start}.hero-gallery{height:340px}.ex-hero{padding-top:36px}.ex-hero h1{font-size:36px}}
`;
