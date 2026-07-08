import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const guideTypes = [
  "All",
  "Heritage",
  "Food",
  "Nature",
  "Adventure",
  "City",
  "Wellness",
  "Wildlife",
  "Religious",
  "Photography",
];

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

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest rating" },
  { value: "experience", label: "Most experienced" },
  { value: "lowDayPrice", label: "Lowest day price" },
  { value: "highDayPrice", label: "Highest day price" },
  { value: "name", label: "Name A-Z" },
];

const assetUrl = (url) => {
  if (!url) return "";
  const value = String(url);
  if (value.startsWith("http")) return value;
  return `${SERVER_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

const cleanArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const formatLkr = (amount) => {
  const value = Number(amount || 0);
  if (!value) return "Ask price";
  return `Rs. ${value.toLocaleString()}`;
};

const getGuideLocation = (guide) => {
  return [guide.city, guide.district].filter(Boolean).join(", ") || guide.base_location || "Sri Lanka";
};

const buildHeroSlides = (guides, places) => {
  const guideSlides = guides
    .filter((guide) => guide.image_url)
    .map((guide) => ({
      type: "Guide",
      title: guide.display_name,
      subtitle: `${guide.guide_type || "Local"} guide • ${getGuideLocation(guide)}`,
      image: assetUrl(guide.image_url),
      badge: guide.guide_type || "Tourist Guide",
      rating: Number(guide.rating || 4.8).toFixed(1),
    }));

  const placeSlides = places
    .flatMap((place) => {
      const images = cleanArray(place.images).length
        ? cleanArray(place.images)
        : [place.image_url || place.image].filter(Boolean);

      return images.slice(0, 2).map((image) => ({
        type: "Destination",
        title: place.name,
        subtitle: [place.city, place.region].filter(Boolean).join(" • ") || "Sri Lanka",
        image: assetUrl(image),
        badge: place.categoryLabel || "Explore Place",
        rating: "4.8",
      }));
    })
    .filter((slide) => slide.image);

  return [...guideSlides, ...placeSlides].filter((slide) => slide.image).slice(0, 12);
};

function TouristGuidePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("city") || searchParams.get("search") || "");
  const [type, setType] = useState(searchParams.get("type") || "All");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [language, setLanguage] = useState(searchParams.get("language") || "");
  const [maxDayPrice, setMaxDayPrice] = useState(Number(searchParams.get("maxDayPrice") || 60000));
  const [minExperience, setMinExperience] = useState(Number(searchParams.get("minExperience") || 0));
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "recommended");

  const [guides, setGuides] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [error, setError] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

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
      const response = await api.get(`/guides${queryString ? `?${queryString}` : ""}`);
      setGuides(response.data.guides || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tourist guides");
    } finally {
      setLoading(false);
    }
  };

  const loadPlaces = async () => {
    try {
      setPlacesLoading(true);
      const response = await api.get("/explore/places");
      setPlaces(response.data.places || []);
    } catch (err) {
      console.error("Failed to load explore places for guide hero:", err);
    } finally {
      setPlacesLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (type !== "All") params.set("type", type);
    if (city) params.set("city", city);
    if (language) params.set("language", language);
    if (maxDayPrice < 60000) params.set("maxDayPrice", String(maxDayPrice));
    if (minExperience > 0) params.set("minExperience", String(minExperience));
    if (sortBy !== "recommended") params.set("sort", sortBy);
    setSearchParams(params, { replace: true });
    loadGuides();
  }, [queryString]);

  useEffect(() => {
    loadPlaces();
  }, []);

  const availableCities = useMemo(() => {
    const values = guides
      .map((guide) => guide.city)
      .filter(Boolean)
      .map((item) => item.trim());
    return [...new Set(values)].sort();
  }, [guides]);

  const availableLanguages = useMemo(() => {
    const values = guides.flatMap((guide) => cleanArray(guide.languages));
    return [...new Set(values)].sort();
  }, [guides]);

  const heroSlides = useMemo(() => buildHeroSlides(guides, places), [guides, places]);
  const activeHero = heroSlides[heroIndex % Math.max(heroSlides.length, 1)] || null;

  useEffect(() => {
    setHeroIndex(0);
  }, [type, heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const filteredGuides = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = guides.filter((guide) => {
      const searchableText = [
        guide.display_name,
        guide.guide_type,
        guide.city,
        guide.district,
        guide.base_location,
        guide.short_description,
        guide.bio,
        ...cleanArray(guide.languages),
        ...cleanArray(guide.services),
        ...cleanArray(guide.specialities),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchMatches = !query || searchableText.includes(query);
      const typeMatches = type === "All" || String(guide.guide_type || "").toLowerCase() === type.toLowerCase();
      const cityMatches = !city || String(guide.city || "").toLowerCase() === city.toLowerCase();
      const languageMatches = !language || cleanArray(guide.languages).some((item) => item.toLowerCase() === language.toLowerCase());
      const dayPrice = Number(guide.price_per_day || 0);
      const priceMatches = !dayPrice || dayPrice <= maxDayPrice;
      const experienceMatches = Number(guide.experience_years || 0) >= minExperience;

      return searchMatches && typeMatches && cityMatches && languageMatches && priceMatches && experienceMatches;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
      if (sortBy === "experience") return Number(b.experience_years || 0) - Number(a.experience_years || 0);
      if (sortBy === "lowDayPrice") return Number(a.price_per_day || 0) - Number(b.price_per_day || 0);
      if (sortBy === "highDayPrice") return Number(b.price_per_day || 0) - Number(a.price_per_day || 0);
      if (sortBy === "name") return String(a.display_name || "").localeCompare(String(b.display_name || ""));
      return Number(b.rating || 0) - Number(a.rating || 0) || Number(b.experience_years || 0) - Number(a.experience_years || 0);
    });
  }, [guides, search, type, city, language, maxDayPrice, minExperience, sortBy]);

  const stats = useMemo(() => {
    const languageCount = new Set(guides.flatMap((guide) => cleanArray(guide.languages))).size;
    const destinationCount = new Set(guides.map((guide) => guide.city).filter(Boolean)).size;
    const bestRating = guides.reduce((highest, guide) => Math.max(highest, Number(guide.rating || 0)), 0);

    return {
      approved: guides.length,
      destinations: destinationCount,
      languages: languageCount,
      rating: bestRating || 4.8,
    };
  }, [guides]);

  const clearFilters = () => {
    setSearch("");
    setType("All");
    setCity("");
    setLanguage("");
    setMaxDayPrice(60000);
    setMinExperience(0);
    setSortBy("recommended");
    setSearchParams({}, { replace: true });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    loadGuides();
  };

  return (
    <main className="guides-page">
      <style>{guideCss}</style>

      <section className={`guide-showcase ${activeHero ? "has-photo" : ""}`}>
        {activeHero && (
          <div
            className="guide-showcase-bg"
            style={{ backgroundImage: `url(${activeHero.image})` }}
          />
        )}
        <div className="guide-showcase-overlay" />

        <div className="guide-showcase-inner">
          <div className="guide-hero-copy">
            <span className="guide-kicker">Local experts across Sri Lanka</span>
            <h1>Find the right tourist guide for your journey</h1>
            <p>
              Browse approved local guiders, compare languages, prices and specialities,
              then connect with the person who can make your Sri Lankan trip feel personal.
            </p>

            <form className="guide-hero-search" onSubmit={handleSubmit}>
              <span>🔎</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by guide, city, language, speciality or experience..."
              />
              <button type="submit">Search</button>
            </form>

            <div className="guide-type-ribbon">
              {guideTypes.slice(0, 7).map((item) => (
                <button
                  type="button"
                  key={item}
                  className={type === item ? "active" : ""}
                  onClick={() => setType(item)}
                >
                  {item === "All" ? "All Guides" : `${iconByType[item] || "🧭"} ${item}`}
                </button>
              ))}
            </div>
          </div>

          <aside className="guide-spotlight-card">
            {activeHero ? (
              <img className="spotlight-photo" src={activeHero.image} alt={activeHero.title} />
            ) : (
              <div className="spotlight-placeholder">🧭</div>
            )}
            <div className="spotlight-shade" />
            <div className="spotlight-content">
              <span className="spotlight-badge">Changing every 4 seconds</span>
              <h2>{activeHero?.title || "Approved guide profiles"}</h2>
              <p>{activeHero?.subtitle || "Guide photos and destination photos appear here from the database."}</p>
              <div className="spotlight-tags">
                <span>{activeHero?.type || "Guides"}</span>
                <span>⭐ {activeHero?.rating || stats.rating.toFixed(1)}</span>
              </div>
            </div>
          </aside>

          <div className="guide-stat-strip">
            <div>
              <strong>{stats.approved}</strong>
              <span>Approved guides</span>
            </div>
            <div>
              <strong>{stats.destinations}</strong>
              <span>Destinations</span>
            </div>
            <div>
              <strong>{stats.languages}</strong>
              <span>Languages</span>
            </div>
            <div>
              <strong>{stats.rating.toFixed(1)}</strong>
              <span>Top rating</span>
            </div>
          </div>
        </div>
      </section>

      <section className="guide-page-body">
        <aside className="guide-filter-panel">
          <div className="filter-panel-top">
            <div>
              <span>Smart filters</span>
              <h2>Refine guides</h2>
            </div>
            <button type="button" onClick={clearFilters}>Clear</button>
          </div>

          <label className="filter-field">
            <span>Guide type</span>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              {guideTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <label className="filter-field">
            <span>Destination</span>
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">All destinations</option>
              {availableCities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <label className="filter-field">
            <span>Language</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="">Any language</option>
              {availableLanguages.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <div className="range-filter">
            <div>
              <span>Maximum day price</span>
              <strong>{formatLkr(maxDayPrice)}</strong>
            </div>
            <input
              type="range"
              min="5000"
              max="60000"
              step="1000"
              value={maxDayPrice}
              onChange={(event) => setMaxDayPrice(Number(event.target.value))}
            />
            <small>Rs. 5,000 - Rs. 60,000</small>
          </div>

          <div className="experience-filter">
            <span>Minimum experience</span>
            <div className="experience-buttons">
              {[0, 2, 5, 8].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={minExperience === item ? "active" : ""}
                  onClick={() => setMinExperience(item)}
                >
                  {item === 0 ? "Any" : `${item}+ yrs`}
                </button>
              ))}
            </div>
          </div>

          <label className="filter-field">
            <span>Sort results</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <div className="trust-note">
            <strong>✅ Approved only</strong>
            <p>Tourists only see guide profiles that are approved by the system admin.</p>
          </div>
        </aside>

        <section className="guide-results-panel">
          <div className="guide-section-head">
            <div>
              <span className="section-mini">Tourist guide network</span>
              <h2>{loading ? "Loading guides..." : `${filteredGuides.length} matching guide${filteredGuides.length === 1 ? "" : "s"}`}</h2>
              <p>Choose a local guider by destination, language, experience and travel style.</p>
            </div>
            <div className="result-actions">
              <Link to="/events">Events nearby</Link>
              <Link to="/trip-planner">Plan trip</Link>
            </div>
          </div>

          <div className="active-filter-row">
            {search.trim() && <span>Search: {search}</span>}
            {type !== "All" && <span>Type: {type}</span>}
            {city && <span>City: {city}</span>}
            {language && <span>Language: {language}</span>}
            {maxDayPrice < 60000 && <span>Under {formatLkr(maxDayPrice)}</span>}
            {minExperience > 0 && <span>{minExperience}+ years</span>}
          </div>

          {error && <div className="guide-error">{error}</div>}

          {loading || placesLoading ? (
            <div className="guide-empty">Loading approved tourist guide profiles...</div>
          ) : filteredGuides.length === 0 ? (
            <div className="guide-empty">
              <h3>No approved guides found</h3>
              <p>Try another city, guide type, language or price range.</p>
              <button type="button" onClick={clearFilters}>Clear filters</button>
            </div>
          ) : (
            <div className="guide-grid">
              {filteredGuides.map((guide) => {
                const icon = iconByType[guide.guide_type] || "🧭";
                const languages = cleanArray(guide.languages);
                const specialities = cleanArray(guide.specialities);
                const services = cleanArray(guide.services);
                const image = assetUrl(guide.image_url);

                return (
                  <article className="guide-card" key={guide.id}>
                    <div className="guide-card-media">
                      {image ? (
                        <img src={image} alt={guide.display_name} />
                      ) : (
                        <div className="guide-card-placeholder">{icon}</div>
                      )}
                      <span>{icon} {guide.guide_type || "Local"}</span>
                    </div>

                    <div className="guide-card-body">
                      <div className="guide-card-title-row">
                        <div>
                          <h3>{guide.display_name}</h3>
                          <p>📍 {getGuideLocation(guide)}</p>
                        </div>
                        <strong>⭐ {Number(guide.rating || 4.8).toFixed(1)}</strong>
                      </div>

                      <p className="guide-card-description">
                        {guide.short_description || guide.bio || "Approved local guide profile for Sri Lankan travel support."}
                      </p>

                      <div className="guide-info-grid">
                        <span>🗣 {languages.length ? languages.slice(0, 3).join(" / ") : "Languages not specified"}</span>
                        <span>🧳 {Number(guide.experience_years || 0)} year{Number(guide.experience_years || 0) === 1 ? "" : "s"} experience</span>
                        <span>💰 Day {formatLkr(guide.price_per_day)}</span>
                        <span>⏱ Hour {formatLkr(guide.price_per_hour)}</span>
                      </div>

                      <div className="guide-tag-row">
                        {[...specialities, ...services].slice(0, 5).map((item) => <span key={item}>{item}</span>)}
                      </div>

                      <div className="guide-actions">
                        {guide.phone && <a href={`tel:${guide.phone}`}>Call</a>}
                        {guide.whatsapp_number && <a href={`https://wa.me/${String(guide.whatsapp_number).replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>}
                        {guide.email && <a href={`mailto:${guide.email}`}>Email</a>}
                        <Link to={`/hotels?city=${encodeURIComponent(guide.city || "")}`}>Hotels nearby</Link>
                        <Link to="/trip-planner">Add to trip</Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const guideCss = `
.guides-page{
  min-height:100vh;
  background:linear-gradient(135deg,#f4faf6 0%,#fffdf4 50%,#ecf8f5 100%);
  color:#102033;
  font-family:Inter,system-ui,Arial,sans-serif;
}
.guide-showcase{
  position:relative;
  width:100%;
  min-height:690px;
  overflow:hidden;
  background:linear-gradient(135deg,#07544a 0%,#0b7c6d 52%,#0d3f3a 100%);
  isolation:isolate;
}
.guide-showcase-bg{
  position:absolute;
  inset:0;
  background-size:cover;
  background-position:center;
  transform:scale(1.035);
  filter:saturate(1.05) contrast(1.02);
  opacity:.72;
  transition:background-image .6s ease-in-out;
  z-index:-3;
}
.guide-showcase-overlay{
  position:absolute;
  inset:0;
  background:
    radial-gradient(circle at 76% 22%,rgba(255,199,54,.24),transparent 34%),
    linear-gradient(90deg,rgba(3,54,49,.78),rgba(5,110,98,.52),rgba(7,56,52,.63));
  z-index:-2;
}
.guide-showcase::after{
  content:"";
  position:absolute;
  left:0;
  right:0;
  bottom:-1px;
  height:70px;
  background:linear-gradient(180deg,transparent,rgba(244,250,246,.95));
  z-index:-1;
}
.guide-showcase-inner{
  width:min(1480px,calc(100% - 48px));
  margin:0 auto;
  padding:74px 0 48px;
  display:grid;
  grid-template-columns:minmax(0,1.05fr) 420px;
  gap:48px;
  align-items:center;
}
.guide-kicker{
  display:inline-flex;
  align-items:center;
  width:max-content;
  background:#ffe88a;
  color:#063f38;
  border-radius:999px;
  padding:13px 22px;
  font-size:12px;
  font-weight:1000;
  letter-spacing:.18em;
  text-transform:uppercase;
  box-shadow:0 12px 34px rgba(255,199,54,.18);
}
.guide-hero-copy h1{
  max-width:980px;
  color:#fff;
  font-size:clamp(54px,7vw,112px);
  line-height:.9;
  letter-spacing:-.075em;
  margin:28px 0 20px;
  text-shadow:0 20px 50px rgba(0,0,0,.23);
}
.guide-hero-copy p{
  max-width:850px;
  color:rgba(255,255,255,.9);
  font-size:20px;
  line-height:1.75;
  font-weight:750;
  margin:0 0 26px;
}
.guide-hero-search{
  width:min(820px,100%);
  display:grid;
  grid-template-columns:auto 1fr auto;
  gap:12px;
  align-items:center;
  background:rgba(255,255,255,.96);
  border:1px solid rgba(255,255,255,.48);
  border-radius:999px;
  padding:10px 12px 10px 20px;
  box-shadow:0 24px 70px rgba(0,0,0,.22);
}
.guide-hero-search span{font-size:25px;}
.guide-hero-search input{
  border:none;
  outline:none;
  background:transparent;
  color:#102033;
  font-size:16px;
  font-weight:850;
  min-width:0;
}
.guide-hero-search input::placeholder{color:#68758a;}
.guide-hero-search button{
  border:none;
  background:#ffc527;
  color:#063f38;
  border-radius:999px;
  padding:15px 28px;
  font-weight:1000;
  cursor:pointer;
  box-shadow:0 15px 28px rgba(255,197,39,.23);
}
.guide-type-ribbon{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:24px;
}
.guide-type-ribbon button{
  border:1px solid rgba(255,255,255,.36);
  background:rgba(255,255,255,.94);
  color:#063f38;
  border-radius:999px;
  padding:11px 17px;
  font-weight:1000;
  cursor:pointer;
}
.guide-type-ribbon button.active{
  background:#0ab5d3;
  color:#fff;
  border-color:#0ab5d3;
}
.guide-spotlight-card{
  position:relative;
  align-self:stretch;
  min-height:430px;
  border:1px solid rgba(255,255,255,.34);
  border-radius:34px;
  color:#fff;
  background:#063f39;
  overflow:hidden;
  box-shadow:0 34px 90px rgba(0,0,0,.25);
  isolation:isolate;
}
.spotlight-photo{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
  filter:none;
  transform:scale(1.01);
  transition:opacity .45s ease,transform 4s ease;
  z-index:-3;
}
.guide-spotlight-card:hover .spotlight-photo{
  transform:scale(1.055);
}
.spotlight-shade{
  position:absolute;
  inset:0;
  background:
    linear-gradient(0deg,rgba(3,39,35,.86) 0%,rgba(3,64,57,.54) 46%,rgba(255,232,138,.08) 100%),
    radial-gradient(circle at 72% 18%,rgba(255,232,138,.18),transparent 35%);
  z-index:-2;
}
.spotlight-content{
  position:absolute;
  left:30px;
  right:30px;
  bottom:30px;
  z-index:2;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
}
.spotlight-placeholder{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  font-size:76px;
  background:linear-gradient(135deg,#0b665b,#0aa18f);
  z-index:-3;
}
.spotlight-badge{
  display:inline-flex;
  background:rgba(5,85,75,.78);
  border:1px solid rgba(255,255,255,.28);
  color:#fff6c7;
  border-radius:999px;
  padding:9px 13px;
  font-size:12px;
  font-weight:1000;
  box-shadow:0 10px 24px rgba(0,0,0,.14);
}
.guide-spotlight-card h2{
  font-size:36px;
  line-height:1.03;
  margin:24px 0 12px;
  letter-spacing:-.045em;
  color:#fff;
  text-shadow:0 3px 18px rgba(0,0,0,.36);
}
.guide-spotlight-card p{
  color:#eafffb;
  font-weight:850;
  line-height:1.55;
  margin:0;
  text-shadow:0 2px 12px rgba(0,0,0,.32);
}
.spotlight-tags{
  display:flex;
  gap:9px;
  flex-wrap:wrap;
  margin-top:18px;
}
.spotlight-tags span{
  background:rgba(255,255,255,.18);
  border:1px solid rgba(255,255,255,.32);
  border-radius:999px;
  padding:8px 12px;
  font-weight:1000;
  font-size:12px;
  backdrop-filter:blur(4px);
}
.guide-stat-strip{
  grid-column:1/-1;
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:14px;
}
.guide-stat-strip div{
  background:rgba(255,255,255,.17);
  border:1px solid rgba(255,255,255,.28);
  border-radius:24px;
  padding:22px 24px;
  color:#fff;
  backdrop-filter:blur(14px);
}
.guide-stat-strip strong{
  display:block;
  color:#ffe88a;
  font-size:34px;
  line-height:1;
  margin-bottom:10px;
}
.guide-stat-strip span{
  font-size:12px;
  text-transform:uppercase;
  letter-spacing:.12em;
  font-weight:1000;
}
.guide-page-body{
  width:min(1480px,calc(100% - 48px));
  margin:42px auto 90px;
  display:grid;
  grid-template-columns:340px minmax(0,1fr);
  gap:26px;
}
.guide-filter-panel{
  position:sticky;
  top:96px;
  align-self:start;
  background:rgba(255,255,255,.92);
  border:1px solid #dbece7;
  border-radius:30px;
  padding:24px;
  box-shadow:0 26px 70px rgba(6,78,69,.08);
}
.filter-panel-top{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  border-bottom:1px solid #dbece7;
  padding-bottom:18px;
  margin-bottom:18px;
}
.filter-panel-top span,.filter-field span,.range-filter span,.experience-filter>span{
  display:block;
  color:#64748b;
  font-size:12px;
  font-weight:1000;
  text-transform:uppercase;
  letter-spacing:.08em;
}
.filter-panel-top h2{
  margin:5px 0 0;
  color:#063f38;
  font-size:26px;
  letter-spacing:-.04em;
}
.filter-panel-top button{
  border:none;
  background:#ffdfdf;
  color:#a10f16;
  border-radius:999px;
  padding:10px 14px;
  font-weight:1000;
  cursor:pointer;
}
.filter-field{
  display:grid;
  gap:8px;
  margin-bottom:16px;
}
.filter-field select{
  width:100%;
  border:1px solid #d5e7e2;
  background:#fff;
  color:#102033;
  border-radius:16px;
  padding:13px 14px;
  font-weight:850;
  outline:none;
}
.filter-field select:focus{
  border-color:#0a7c6e;
  box-shadow:0 0 0 4px rgba(10,124,110,.1);
}
.range-filter{
  background:#f6fbf8;
  border:1px solid #dbece7;
  border-radius:20px;
  padding:16px;
  margin-bottom:16px;
}
.range-filter div{
  display:flex;
  justify-content:space-between;
  gap:12px;
  align-items:center;
}
.range-filter strong{color:#063f38;}
.range-filter input{
  width:100%;
  accent-color:#0a7c6e;
  margin:14px 0 7px;
}
.range-filter small{color:#64748b;font-weight:850;}
.experience-filter{margin-bottom:16px;}
.experience-buttons{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:8px;
  margin-top:9px;
}
.experience-buttons button{
  border:1px solid #d5e7e2;
  background:#fff;
  color:#063f38;
  border-radius:14px;
  padding:11px 10px;
  font-weight:1000;
  cursor:pointer;
}
.experience-buttons button.active{
  background:#064e45;
  color:#fff;
  border-color:#064e45;
}
.trust-note{
  background:#fff9dc;
  border:1px solid #f5d76e;
  border-radius:20px;
  padding:15px;
  color:#4b3b00;
}
.trust-note strong{display:block;margin-bottom:6px;}
.trust-note p{margin:0;line-height:1.5;font-weight:750;}
.guide-results-panel{min-width:0;}
.guide-section-head{
  display:flex;
  justify-content:space-between;
  gap:22px;
  align-items:flex-end;
  margin-bottom:14px;
}
.section-mini{
  display:inline-flex;
  color:#c47a00;
  font-size:12px;
  font-weight:1000;
  letter-spacing:.14em;
  text-transform:uppercase;
}
.guide-section-head h2{
  color:#102033;
  font-size:42px;
  line-height:1;
  letter-spacing:-.055em;
  margin:10px 0 8px;
}
.guide-section-head p{color:#64748b;font-weight:750;margin:0;}
.result-actions{display:flex;gap:10px;flex-wrap:wrap;}
.result-actions a{
  text-decoration:none;
  color:#064e45;
  background:#fff;
  border:1px solid #d5e7e2;
  border-radius:999px;
  padding:12px 16px;
  font-weight:1000;
}
.result-actions a:first-child{background:#064e45;color:#fff;border-color:#064e45;}
.active-filter-row{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  min-height:34px;
  margin:0 0 16px;
}
.active-filter-row span{
  background:#eaf8f3;
  color:#064e45;
  border:1px solid #cae9df;
  border-radius:999px;
  padding:8px 12px;
  font-weight:900;
  font-size:12px;
}
.guide-error{
  background:#fee2e2;
  color:#991b1b;
  padding:15px 17px;
  border-radius:18px;
  font-weight:900;
  margin-bottom:18px;
}
.guide-empty{
  background:#fff;
  border:1px solid #dbece7;
  border-radius:28px;
  padding:48px 28px;
  text-align:center;
  color:#64748b;
  font-weight:800;
  box-shadow:0 20px 50px rgba(6,78,69,.07);
}
.guide-empty h3{color:#063f38;margin:0 0 8px;font-size:28px;}
.guide-empty p{margin:0 auto 18px;max-width:520px;line-height:1.65;}
.guide-empty button{
  border:none;
  background:#064e45;
  color:#fff;
  border-radius:999px;
  padding:12px 18px;
  font-weight:1000;
  cursor:pointer;
}
.guide-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:20px;
}
.guide-card{
  background:#fff;
  border:1px solid #dbece7;
  border-radius:30px;
  overflow:hidden;
  box-shadow:0 22px 60px rgba(6,78,69,.08);
  display:grid;
  grid-template-columns:230px minmax(0,1fr);
  min-height:330px;
}
.guide-card-media{
  position:relative;
  min-height:330px;
  background:linear-gradient(135deg,#0a7c6e,#ffc527);
  overflow:hidden;
}
.guide-card-media img{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}
.guide-card-media::after{
  content:"";
  position:absolute;
  inset:0;
  background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.45));
}
.guide-card-media span{
  position:absolute;
  top:16px;
  left:16px;
  z-index:2;
  background:rgba(255,255,255,.92);
  color:#064e45;
  border-radius:999px;
  padding:8px 12px;
  font-size:12px;
  font-weight:1000;
}
.guide-card-placeholder{
  height:100%;
  display:grid;
  place-items:center;
  font-size:72px;
  color:#fff;
}
.guide-card-body{padding:22px;min-width:0;}
.guide-card-title-row{
  display:flex;
  justify-content:space-between;
  gap:14px;
  align-items:flex-start;
}
.guide-card-title-row h3{
  color:#064e45;
  font-size:26px;
  line-height:1.05;
  letter-spacing:-.04em;
  margin:0 0 7px;
}
.guide-card-title-row p{margin:0;color:#64748b;font-weight:900;}
.guide-card-title-row strong{
  flex:0 0 auto;
  background:#fff5c6;
  color:#9a5b00;
  border-radius:999px;
  padding:8px 10px;
  font-size:12px;
}
.guide-card-description{
  color:#435368;
  line-height:1.65;
  font-weight:700;
  margin:15px 0;
}
.guide-info-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:9px;
}
.guide-info-grid span{
  background:#f6fbf8;
  border:1px solid #dbece7;
  border-radius:14px;
  padding:9px 10px;
  color:#334155;
  font-size:12px;
  font-weight:900;
}
.guide-tag-row{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:14px;
}
.guide-tag-row span{
  background:#f8f5ec;
  color:#25364a;
  border-radius:999px;
  padding:7px 10px;
  font-size:12px;
  font-weight:900;
}
.guide-actions{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:18px;
}
.guide-actions a{
  text-decoration:none;
  border:1px solid #d5e7e2;
  color:#064e45;
  background:#fff;
  border-radius:14px;
  padding:10px 12px;
  font-size:13px;
  font-weight:1000;
}
.guide-actions a:first-child{
  background:#064e45;
  color:#fff;
  border-color:#064e45;
}
.guide-actions a:last-child{
  background:#ffc527;
  color:#063f38;
  border-color:#ffc527;
}
@media(max-width:1180px){
  .guide-showcase-inner{grid-template-columns:1fr;}
  .guide-spotlight-card{max-width:620px;}
  .guide-page-body{grid-template-columns:1fr;}
  .guide-filter-panel{position:relative;top:auto;}
}
@media(max-width:860px){
  .guide-showcase{min-height:auto;}
  .guide-showcase-inner{width:calc(100% - 28px);padding:52px 0 40px;gap:26px;}
  .guide-hero-copy h1{font-size:52px;}
  .guide-hero-copy p{font-size:17px;}
  .guide-hero-search{grid-template-columns:auto 1fr; border-radius:28px;}
  .guide-hero-search button{grid-column:1/-1;width:100%;}
  .guide-stat-strip{grid-template-columns:repeat(2,1fr);}
  .guide-page-body{width:calc(100% - 28px);margin-top:30px;}
  .guide-section-head{align-items:flex-start;flex-direction:column;}
  .guide-grid{grid-template-columns:1fr;}
  .guide-card{grid-template-columns:1fr;}
  .guide-card-media{min-height:260px;height:260px;}
}
@media(max-width:560px){
  .guide-hero-copy h1{font-size:42px;}
  .guide-kicker{font-size:10px;padding:11px 14px;}
  .guide-stat-strip{grid-template-columns:1fr;}
  .spotlight-image-wrap{height:210px;}
  .guide-section-head h2{font-size:34px;}
  .guide-info-grid{grid-template-columns:1fr;}
}
`;

export default TouristGuidePage;
