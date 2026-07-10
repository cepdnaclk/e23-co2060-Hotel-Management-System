import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/api";
import { readTripItems, SAVED_TRIP_EVENT, toggleTripItem } from "../utils/tripBasket";

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

const buildHeroSlides = (places) => {
  const destinationSlides = places
    .flatMap((place) => {
      const images = cleanArray(place.images).length
        ? cleanArray(place.images)
        : [place.image_url || place.image].filter(Boolean);

      return images.slice(0, 2).map((image) => ({
        type: "Destination",
        title: place.name,
        subtitle: [place.city, place.region].filter(Boolean).join(" • ") || "Sri Lanka",
        image: assetUrl(image),
        badge: place.categoryLabel || place.category || "Explore Place",
        rating: "4.8",
      }));
    })
    .filter((slide) => slide.image);

  return destinationSlides.slice(0, 12);
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
  const [savedTripItems, setSavedTripItems] = useState(readTripItems);
  const [notice, setNotice] = useState("");

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

  const heroSlides = useMemo(() => buildHeroSlides(places), [places]);
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
      const promotedA = a.is_promoted ? 1 : 0;
      const promotedB = b.is_promoted ? 1 : 0;

      if (promotedA !== promotedB) return promotedB - promotedA;

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

  const savedTripIds = useMemo(
    () => new Set(savedTripItems.map((item) => String(item.id))),
    [savedTripItems]
  );

  const buildGuideTripItem = (guide) => {
    const price = Number(guide.price_per_day || guide.price_per_hour || 0);
    return {
      id: `guide-${guide.id}`,
      sourceId: guide.id,
      tripItemType: "guide",
      name: guide.display_name || guide.full_name || "Tourist guide",
      city: guide.city || "",
      district: guide.district || "",
      region: guide.guide_type || "Guide",
      image: assetUrl(guide.image_url),
      duration: "Guide support",
      bestTime: guide.availability || "By booking",
      budget: price >= 30000 ? "High" : price >= 15000 ? "Medium" : "Low",
      estimatedCost: price,
      shortDescription: guide.short_description || guide.bio || "Selected tourist guide for this trip.",
      link: guide.slug ? `/tourist-guides/${guide.slug}` : "/tourist-guides",
      guideLanguages: cleanArray(guide.languages),
    };
  };

  const handleToggleGuideTrip = (guide) => {
    const item = buildGuideTripItem(guide);
    const result = toggleTripItem(item);
    setSavedTripItems(result.items);
    setNotice(result.saved ? `${item.name} added to your trip basket.` : `${item.name} removed from your trip basket.`);
  };

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
      {notice ? <div className="guide-trip-toast">{notice}</div> : null}

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
              <p>{activeHero?.subtitle || "Destination photos appear here from the Explore page slideshow."}</p>
              <div className="spotlight-tags">
                <span>{activeHero?.badge || activeHero?.type || "Destinations"}</span>
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
                      {guide.is_promoted && <strong className="guide-sponsored-badge">Top ad</strong>}
                    </div>

                    <div className="guide-card-body">
                      <div className="guide-card-title-row">
                        <div>
                          <h3>{guide.display_name}</h3>
                          <p>📍 {getGuideLocation(guide)}</p>
                        </div>
                        <strong>⭐ {Number(guide.rating || 4.8).toFixed(1)}</strong>
                      </div>

                      <div className="guide-price-row">
                        <span>💰 Day {formatLkr(guide.price_per_day)}</span>
                        <span>⏱ Hour {formatLkr(guide.price_per_hour)}</span>
                      </div>

                      <div className="guide-actions">
                        {guide.slug && <Link to={`/tourist-guides/${guide.slug}`}>View profile</Link>}
                        <button
                          type="button"
                          className={savedTripIds.has(`guide-${guide.id}`) ? "guide-trip-btn saved" : "guide-trip-btn"}
                          onClick={() => handleToggleGuideTrip(guide)}
                        >
                          {savedTripIds.has(`guide-${guide.id}`) ? "Saved to trip" : "+ Add to trip"}
                        </button>
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
.guide-trip-toast{
  position:fixed;
  right:22px;
  bottom:98px;
  z-index:78;
  background:#064e45;
  color:#fff;
  border-radius:16px;
  padding:14px 18px;
  box-shadow:0 18px 40px rgba(0,0,0,.18);
  font-weight:900;
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
  border-radius:22px;
  overflow:hidden;
  box-shadow:0 16px 40px rgba(6,78,69,.08);
  display:grid;
  grid-template-columns:150px minmax(0,1fr);
  min-height:190px;
}
.guide-card-media{
  position:relative;
  min-height:190px;
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
  top:10px;
  left:10px;
  z-index:2;
  background:rgba(255,255,255,.92);
  color:#064e45;
  border-radius:999px;
  padding:6px 10px;
  font-size:11px;
  font-weight:1000;
}
.guide-sponsored-badge{
  position:absolute;
  right:10px;
  bottom:10px;
  z-index:2;
  background:#ffc527;
  color:#063f38;
  border-radius:999px;
  padding:6px 10px;
  font-size:11px;
  font-weight:1000;
  box-shadow:0 12px 26px rgba(0,0,0,.22);
}
.guide-card-placeholder{
  height:100%;
  display:grid;
  place-items:center;
  font-size:44px;
  color:#fff;
}
.guide-card-body{padding:14px 16px;min-width:0;display:flex;flex-direction:column;}
.guide-card-title-row{
  display:flex;
  justify-content:space-between;
  gap:10px;
  align-items:flex-start;
}
.guide-card-title-row h3{
  color:#064e45;
  font-size:18px;
  line-height:1.15;
  letter-spacing:-.03em;
  margin:0 0 4px;
}
.guide-card-title-row p{margin:0;color:#64748b;font-weight:900;font-size:13px;}
.guide-card-title-row strong{
  flex:0 0 auto;
  background:#fff5c6;
  color:#9a5b00;
  border-radius:999px;
  padding:6px 9px;
  font-size:12px;
}
.guide-price-row{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
  margin-top:10px;
}
.guide-price-row span{
  background:#f6fbf8;
  border:1px solid #dbece7;
  border-radius:999px;
  padding:6px 10px;
  color:#334155;
  font-size:12px;
  font-weight:900;
}
.guide-actions{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  margin-top:auto;
  padding-top:10px;
  align-items:flex-start;
}
.guide-actions a,.guide-actions button.guide-trip-btn{
  text-decoration:none;
  border:1px solid #d5e7e2;
  color:#064e45;
  background:#fff;
  border-radius:12px;
  padding:8px 11px;
  font-size:12px;
  font-weight:1000;
  cursor:pointer;
  font-family:inherit;
}
.guide-actions button.guide-trip-btn{
  background:#ffc527;
  color:#063f38;
  border-color:#ffc527;
}
.guide-actions button.guide-trip-btn.saved{
  background:#e8fff5;
  color:#05614f;
  border-color:#64c8a8;
}
.guide-actions>a:first-child{
  background:#064e45;
  color:#fff;
  border-color:#064e45;
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
  .guide-card-media{min-height:200px;height:200px;}
}
@media(max-width:560px){
  .guide-hero-copy h1{font-size:42px;}
  .guide-kicker{font-size:10px;padding:11px 14px;}
  .guide-stat-strip{grid-template-columns:1fr;}
  .spotlight-image-wrap{height:210px;}
  .guide-section-head h2{font-size:34px;}
}

/* compact first-screen landing fix - keeps guide search, guide buttons and stats visible at 100% zoom */
@media (min-width:1024px){
  .guide-showcase{
    min-height:min(560px,calc(100vh - 118px));
  }
  .guide-showcase-inner{
    padding:38px 0 54px;
    grid-template-columns:minmax(0,1.08fr) 380px;
    gap:34px;
  }
  .guide-kicker{
    padding:9px 15px;
    font-size:11px;
    letter-spacing:.13em;
  }
  .guide-hero-copy h1{
    max-width:820px;
    font-size:clamp(42px,5.2vw,76px);
    line-height:.94;
    margin:18px 0 14px;
  }
  .guide-hero-copy p{
    max-width:760px;
    font-size:16px;
    line-height:1.55;
    margin-bottom:18px;
  }
  .guide-hero-search{
    width:min(760px,100%);
    padding:8px 10px 8px 16px;
    gap:10px;
  }
  .guide-hero-search span{font-size:22px;}
  .guide-hero-search input{font-size:15px;}
  .guide-hero-search button{
    padding:12px 22px;
  }
  .guide-type-ribbon{
    margin-top:16px;
    gap:9px;
  }
  .guide-type-ribbon button{
    padding:9px 14px;
    font-size:14px;
  }
  .guide-spotlight-card{
    min-height:330px;
    border-radius:28px;
  }
  .spotlight-content{
    left:24px;
    right:24px;
    bottom:24px;
  }
  .spotlight-badge{padding:8px 12px;font-size:11px;}
  .spotlight-content h2{
    font-size:clamp(26px,2.5vw,36px);
    margin:16px 0 8px;
  }
  .spotlight-content p{font-size:14px;}
  .spotlight-tags{margin-top:12px;gap:8px;}
  .spotlight-tags span{padding:7px 10px;font-size:11px;}
  .guide-stat-strip{
    gap:12px;
  }
  .guide-stat-strip div{
    padding:14px 18px;
    border-radius:18px;
  }
  .guide-stat-strip strong{
    font-size:30px;
    margin-bottom:6px;
  }
  .guide-stat-strip span{font-size:11px;}
}
@media (min-width:1024px) and (max-height:760px){
  .guide-showcase{min-height:520px;}
  .guide-showcase-inner{
    padding-top:30px;
    padding-bottom:48px;
  }
  .guide-hero-copy h1{font-size:clamp(38px,4.9vw,66px);}
  .guide-spotlight-card{min-height:300px;}
  .guide-stat-strip div{padding:12px 16px;}
}


/* extra compact hero v2 - reduces guide top section height more for 100% browser zoom */
@media (min-width:1024px){
  .guide-showcase{
    min-height:460px !important;
  }
  .guide-showcase-inner{
    padding:24px 0 34px !important;
    grid-template-columns:minmax(0,1.05fr) 340px !important;
    gap:28px !important;
  }
  .guide-kicker{
    padding:7px 12px !important;
    font-size:10px !important;
    letter-spacing:.11em !important;
  }
  .guide-hero-copy h1{
    max-width:720px !important;
    font-size:clamp(36px,4.5vw,60px) !important;
    line-height:.93 !important;
    margin:12px 0 10px !important;
  }
  .guide-hero-copy p{
    max-width:650px !important;
    font-size:14px !important;
    line-height:1.45 !important;
    margin-bottom:12px !important;
  }
  .guide-hero-search{
    width:min(650px,100%) !important;
    padding:6px 8px 6px 12px !important;
    gap:8px !important;
    border-radius:22px !important;
  }
  .guide-hero-search span{font-size:19px !important;}
  .guide-hero-search input{font-size:13.5px !important;}
  .guide-hero-search button{
    padding:10px 18px !important;
    font-size:13px !important;
    border-radius:16px !important;
  }
  .guide-type-ribbon{
    margin-top:10px !important;
    gap:7px !important;
  }
  .guide-type-ribbon button{
    padding:7px 12px !important;
    font-size:12.5px !important;
  }
  .guide-spotlight-card{
    min-height:260px !important;
    border-radius:24px !important;
  }
  .spotlight-content{
    left:18px !important;
    right:18px !important;
    bottom:18px !important;
  }
  .spotlight-badge{padding:6px 10px !important;font-size:10px !important;}
  .spotlight-content h2{
    font-size:clamp(21px,2vw,28px) !important;
    margin:10px 0 6px !important;
  }
  .spotlight-content p{font-size:12.5px !important;}
  .spotlight-tags{margin-top:8px !important;gap:6px !important;}
  .spotlight-tags span{padding:6px 9px !important;font-size:10px !important;}
  .guide-stat-strip{
    gap:10px !important;
    margin-top:14px !important;
  }
  .guide-stat-strip div{
    padding:9px 14px !important;
    border-radius:16px !important;
  }
  .guide-stat-strip strong{
    font-size:26px !important;
    margin-bottom:4px !important;
  }
  .guide-stat-strip span{font-size:9.5px !important;}
}
@media (min-width:1024px) and (max-height:760px){
  .guide-showcase{min-height:430px !important;}
  .guide-showcase-inner{
    padding-top:20px !important;
    padding-bottom:30px !important;
  }
  .guide-hero-copy h1{font-size:clamp(34px,4.1vw,54px) !important;}
  .guide-spotlight-card{min-height:235px !important;}
  .guide-stat-strip div{padding:8px 12px !important;}
}

`;

export default TouristGuidePage;
