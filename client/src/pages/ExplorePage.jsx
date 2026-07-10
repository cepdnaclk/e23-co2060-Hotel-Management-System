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

const getSriLankaMonthInfo = () => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    month: "numeric",
    year: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const parts = formatter.formatToParts(new Date());
  const monthNumber = Number(parts.find((part) => part.type === "month")?.value || new Date().getMonth() + 1);
  const safeMonthNumber = monthNumber >= 1 && monthNumber <= 12 ? monthNumber : new Date().getMonth() + 1;
  const index = safeMonthNumber - 1;

  return {
    index,
    number: safeMonthNumber,
    name: monthNames[index] || monthNames[new Date().getMonth()],
  };
};

const readSavedPlaces = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_PLACES_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const writeSavedPlaces = (places) => {
  const cleanPlaces = Array.isArray(places) ? places.filter(Boolean) : [];
  localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(cleanPlaces));
  window.dispatchEvent(new Event("tourismhub:saved-places"));
};

const getPlaceImage = (place) => place?.image || place?.imageUrl || place?.image_url || place?.images?.[0] || "";

const defaultHeroImages = [
  "https://images.pexels.com/photos/16508265/pexels-photo-16508265.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/2403209/pexels-photo-2403209.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/3225528/pexels-photo-3225528.jpeg?auto=compress&cs=tinysrgb&w=1600",
];

const cleanUniqueImages = (images = []) => {
  const seen = new Set();

  return images
    .map((image) => String(image || "").trim())
    .filter(Boolean)
    .filter((image) => {
      if (seen.has(image)) return false;
      seen.add(image);
      return true;
    });
};

const shuffleImages = (images = []) => {
  const shuffled = [...images];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const getPlaceHeroImages = (place) => {
  const galleryImages = Array.isArray(place?.images) ? place.images : [];
  const photoImages = Array.isArray(place?.photos)
    ? place.photos.map((photo) => photo?.image_url || photo?.image || photo?.url)
    : [];

  return [getPlaceImage(place), ...galleryImages, ...photoImages];
};

function PlaceCard({ place, onToggleSave, saved }) {
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
          <button
            type="button"
            className={saved ? "saved-action" : ""}
            onClick={() => onToggleSave(place)}
            title={saved ? "Remove from saved trip places" : "Save to trip places"}
          >
            {saved ? "✓ Saved" : "+ Save"}
          </button>
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
  const [heroPlaces, setHeroPlaces] = useState([]);
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
  const [heroSlideImages, setHeroSlideImages] = useState(defaultHeroImages);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [seasonBgIndex, setSeasonBgIndex] = useState(0);

  const [currentMonthInfo, setCurrentMonthInfo] = useState(getSriLankaMonthInfo);
  const currentMonth = currentMonthInfo.index;
  const [seasonalMonthName, setSeasonalMonthName] = useState(currentMonthInfo.name);

  useEffect(() => {
    const refreshCurrentMonth = () => {
      setCurrentMonthInfo((previous) => {
        const next = getSriLankaMonthInfo();
        return previous.number === next.number ? previous : next;
      });
    };

    refreshCurrentMonth();
    const timer = setInterval(refreshCurrentMonth, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        setLoading(true);
        const [catData, seasonalData, itineraryData, heroPlaceData] = await Promise.all([
          getExploreCategories(),
          getSeasonalPlaces(currentMonthInfo.number),
          getExploreItineraries(),
          getExplorePlaces({ sort: "recommended" }),
        ]);
        setCategories(catData);
        setSeasonal(seasonalData.places || []);
        setSeasonalMonthName(seasonalData.monthName || currentMonthInfo.name);
        setItineraries(itineraryData);
        setHeroPlaces(heroPlaceData || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load Explore data");
      } finally {
        setLoading(false);
      }
    };

    loadBaseData();
  }, [currentMonthInfo.number, currentMonthInfo.name]);

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
    const refreshSavedPlaces = () => setSavedPlaces(readSavedPlaces());
    window.addEventListener("storage", refreshSavedPlaces);
    window.addEventListener("tourismhub:saved-places", refreshSavedPlaces);

    return () => {
      window.removeEventListener("storage", refreshSavedPlaces);
      window.removeEventListener("tourismhub:saved-places", refreshSavedPlaces);
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);


  const selectedCategoryLabel = useMemo(() => {
    const selected = categories.find((item) => String(item.slug || item.id) === String(category));
    return selected?.label || "All Places";
  }, [categories, category]);

  const heroCandidateImages = useMemo(() => {
    const sourcePlaces = heroPlaces.length ? heroPlaces : places;
    const matchingPlaces = category === "all"
      ? sourcePlaces
      : sourcePlaces.filter((place) => String(place.category || place.categoryLabel || "").toLowerCase() === String(category).toLowerCase());

    return cleanUniqueImages(matchingPlaces.flatMap(getPlaceHeroImages)).slice(0, 18);
  }, [category, heroPlaces, places]);

  const currentHeroImage = assetUrl(heroSlideImages[heroImageIndex % heroSlideImages.length] || defaultHeroImages[0]);

  const seasonalBackgroundImages = useMemo(() => {
    const images = cleanUniqueImages(seasonal.flatMap(getPlaceHeroImages));
    return images.length ? images : defaultHeroImages;
  }, [seasonal]);

  const currentSeasonBackgroundImage = assetUrl(
    seasonalBackgroundImages[seasonBgIndex % seasonalBackgroundImages.length] || defaultHeroImages[0]
  );

  useEffect(() => {
    const nextImages = heroCandidateImages.length
      ? shuffleImages(heroCandidateImages)
      : shuffleImages(defaultHeroImages);

    setHeroSlideImages(nextImages);
    setHeroImageIndex(0);
  }, [category, heroCandidateImages]);

  useEffect(() => {
    if (heroSlideImages.length <= 1) return undefined;

    const timer = setInterval(() => {
      setHeroImageIndex((currentIndex) => (currentIndex + 1) % heroSlideImages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [heroSlideImages.length]);

  useEffect(() => {
    setSeasonBgIndex(0);
  }, [seasonalBackgroundImages]);

  useEffect(() => {
    if (seasonalBackgroundImages.length <= 1) return undefined;

    const timer = setInterval(() => {
      setSeasonBgIndex((currentIndex) => (currentIndex + 1) % seasonalBackgroundImages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [seasonalBackgroundImages.length]);

  const topPlaces = useMemo(() => places.filter((p) => p.featured).slice(0, 3), [places]);
  const savedIds = useMemo(() => new Set(savedPlaces.map((p) => p.id)), [savedPlaces]);

  const heroSpotlight = useMemo(() => {
    const sourcePlaces = category === "all"
      ? (heroPlaces.length ? heroPlaces : places)
      : (heroPlaces.length ? heroPlaces : places).filter((place) =>
          String(place.category || place.categoryLabel || "").toLowerCase() === String(category).toLowerCase()
        );

    return sourcePlaces[heroImageIndex % Math.max(sourcePlaces.length, 1)] || sourcePlaces[0] || topPlaces[0] || places[0] || null;
  }, [category, heroImageIndex, heroPlaces, places, topPlaces]);

  const exploreStats = useMemo(() => {
    const destinationCount = new Set((places || []).map((place) => place.city || place.region).filter(Boolean)).size;
    const featuredCount = (places || []).filter((place) => place.featured).length;

    return [
      { value: places.length || heroPlaces.length || 0, label: "places ready" },
      { value: destinationCount || "Sri Lanka", label: "destinations" },
      { value: featuredCount || topPlaces.length || 0, label: "featured picks" },
      { value: seasonal.length || 0, label: `good in ${String(seasonalMonthName || currentMonthInfo.name).toLowerCase()}` },
    ];
  }, [currentMonthInfo.name, heroPlaces.length, places, seasonal.length, seasonalMonthName, topPlaces.length]);

  const persistSavedPlaces = (updatedPlaces) => {
    writeSavedPlaces(updatedPlaces);
    setSavedPlaces(updatedPlaces);
  };

  const toggleSavePlace = (place) => {
    const current = readSavedPlaces();
    const isAlreadySaved = current.some((item) => String(item.id) === String(place.id));

    if (isAlreadySaved) {
      const updated = current.filter((item) => String(item.id) !== String(place.id));
      persistSavedPlaces(updated);
      setNotice(`Removed ${place.name} from saved places.`);
      return;
    }

    const updated = [...current, place];
    persistSavedPlaces(updated);
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

      <section className="hero-explore explore-showcase-hero" style={{ backgroundImage: `url(${currentHeroImage})` }}>
        <img
          key={`${currentHeroImage}-${heroImageIndex}`}
          className="hero-bg-image"
          src={currentHeroImage}
          alt=""
          aria-hidden="true"
        />
        <div className="hero-overlay" />
        <div className="explore-hero-inner">
          <div className="explore-hero-copy">
            <p>WHAT TO DO</p>
            <h1>Discover your adventure</h1>
            <span>From misty highlands to golden shores, ancient cities to surf-soaked coasts — find what calls to you across the island.</span>

            <label className="explore-hero-search">
              <span>🔎</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search beaches, temples, hikes, wildlife, cities..."
              />
            </label>

            <small className="hero-photo-note">Showing {selectedCategoryLabel} photos · changes every 4 seconds</small>

            <div className="hero-categories">
              {categories.map((item) => (
                <button
                  key={item.slug || item.id}
                  type="button"
                  className={category === (item.slug || item.id) ? "on" : ""}
                  onClick={() => {
                    setCategory(item.slug || item.id);
                    setHeroImageIndex(0);
                  }}
                >
                  {item.label} {category === (item.slug || item.id) ? "✓" : ""}
                </button>
              ))}
            </div>
          </div>

          <aside className="explore-hero-card clear-preview-card" aria-label="Current Explore slideshow place">
            <div
              className="explore-hero-card-photo clear-preview-photo"
              style={{ backgroundImage: `url(${currentHeroImage})` }}
            />
            <div className="clear-preview-shade" aria-hidden="true" />
            <div className="explore-hero-card-content clear-preview-content">
              <span>Changing every 4 seconds</span>
              <h2>{heroSpotlight?.name || selectedCategoryLabel}</h2>
              <p>{heroSpotlight ? `${heroSpotlight.city || "Sri Lanka"} • ${heroSpotlight.region || selectedCategoryLabel}` : "Live destination photos from Explore places"}</p>
              <div className="explore-hero-card-tags clear-preview-tags">
                <b>{heroSpotlight?.categoryLabel || heroSpotlight?.category || selectedCategoryLabel}</b>
                <b>{heroSpotlight?.budget || "Explore"}</b>
              </div>
            </div>
          </aside>
        </div>

        <div className="explore-hero-stats" aria-label="Explore summary">
          {exploreStats.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
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
              {topPlaces.map((place) => <PlaceCard key={place.id} place={place} onToggleSave={toggleSavePlace} saved={savedIds.has(place.id)} />)}
            </div>
          </section>

          <section
            className="season-section season-top"
            style={{
              backgroundImage: `linear-gradient(115deg, rgba(0, 62, 53, 0.70) 0%, rgba(0, 82, 70, 0.54) 48%, rgba(3, 35, 40, 0.62) 100%), url(${currentSeasonBackgroundImage})`,
            }}
          >
            <div className="season-copy">
              <span className="month-pill">▣ GOOD IN {String(seasonalMonthName || currentMonthInfo.name).toUpperCase()}</span>
              <h2>Season-aware picks</h2>
              <p>These places match the current travel month. The background also changes using photos from this month&apos;s best picks.</p>
            </div>
            <div className="season-grid">
              {seasonal.length ? seasonal.map((place) => (
                <Link to={`/explore/${place.id}`} key={place.id} className="season-card">
                  <img src={assetUrl(getPlaceImage(place))} alt={place.name} />
                  <div>
                    <small>{place.bestTime}</small>
                    <strong>{place.name}</strong>
                    <span>{place.region}</span>
                  </div>
                </Link>
              )) : (
                <div className="season-empty">No seasonal picks found for {seasonalMonthName || currentMonthInfo.name} yet.</div>
              )}
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
              {places.map((place) => <PlaceCard key={place.id} place={place} onToggleSave={toggleSavePlace} saved={savedIds.has(place.id)} />)}
            </div>
            {!places.length && !loading ? <div className="state-card">No places found. Try another filter.</div> : null}
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
.explore-page{background:#fbfcf7;color:#0b2530;min-height:100vh;font-family:Inter,system-ui,Arial,sans-serif}.toast{position:fixed;right:22px;bottom:22px;background:#064e45;color:#fff;padding:14px 18px;border-radius:16px;z-index:80;box-shadow:0 18px 40px rgba(0,0,0,.18);font-weight:800}.saved-trip-fab{position:fixed;right:22px;bottom:24px;z-index:70;border:none;border-radius:999px;background:linear-gradient(135deg,#064e45,#087768);color:#fff;box-shadow:0 18px 44px rgba(3,58,54,.28),0 0 0 6px rgba(255,194,43,.16);padding:12px 14px 12px 12px;display:flex;align-items:center;gap:10px;font-weight:900;cursor:pointer;border:2px solid rgba(255,194,43,.8)}.saved-trip-fab span{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#ffc22b;color:#063c38}.saved-trip-fab strong{font-size:13px;letter-spacing:.06em;text-transform:uppercase}.saved-trip-fab b{min-width:28px;height:28px;border-radius:999px;display:grid;place-items:center;background:#fff;color:#064e45;font-size:13px}.saved-trip-fab.has-items{animation:savedPulse 2.8s ease-in-out infinite}.saved-trip-panel{position:fixed;right:22px;bottom:94px;width:min(420px,calc(100vw - 32px));max-height:min(650px,calc(100vh - 130px));z-index:75;background:#fff;border:1px solid #dbece4;border-radius:26px;box-shadow:0 24px 70px rgba(2,50,49,.24);overflow:hidden;display:flex;flex-direction:column}.saved-trip-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:20px;background:linear-gradient(135deg,#064e45,#08806f);color:#fff}.saved-trip-head span{display:block;color:#ffe183;font-weight:900;letter-spacing:.22em;font-size:11px}.saved-trip-head h3{margin:6px 0 0;font-size:26px}.saved-trip-head button{border:none;background:rgba(255,255,255,.14);color:#fff;border-radius:50%;width:38px;height:38px;font-size:28px;line-height:1;cursor:pointer}.saved-trip-list{padding:14px;overflow:auto;display:grid;gap:12px}.saved-trip-item{display:grid;grid-template-columns:74px 1fr auto;gap:12px;align-items:center;padding:10px;border:1px solid #e3efe8;border-radius:18px;background:#f9fdf9}.saved-trip-item img{width:74px;height:66px;object-fit:cover;border-radius:14px;background:#e5eee9}.saved-trip-item h4{margin:0;color:#064e45;font-size:15px}.saved-trip-item p{margin:4px 0 0;color:#657285;font-weight:700;font-size:12px}.saved-trip-item button{border:none;background:#fee2e2;color:#991b1b;border-radius:999px;padding:9px 12px;font-weight:900;cursor:pointer}.saved-trip-foot{display:flex;gap:10px;justify-content:space-between;padding:14px;border-top:1px solid #e5efe9;background:#fbfcf7}.saved-trip-foot button,.saved-trip-foot a{border:none;text-decoration:none;border-radius:14px;padding:12px 14px;font-weight:900;cursor:pointer;text-align:center}.saved-trip-foot button{background:#fff0f0;color:#a31515}.saved-trip-foot a{background:#ffc22b;color:#063c38;flex:1}.saved-trip-empty{padding:28px;text-align:center}.saved-trip-empty strong{color:#064e45;font-size:20px}.saved-trip-empty p{color:#657285;font-weight:700;line-height:1.6}@keyframes savedPulse{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}.hero-explore{position:relative;min-height:480px;background:#093f43;display:grid;place-items:center;text-align:center;color:#fff;overflow:hidden}.hero-bg-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;animation:heroFadeZoom 4.15s ease-in-out both;filter:saturate(1.08) contrast(1.02) brightness(1.05)}.hero-overlay{position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(1,55,63,.62),rgba(1,55,63,.36),rgba(1,38,49,.68)),radial-gradient(circle at center,rgba(255,194,43,.16),transparent 45%)}.hero-content{position:relative;z-index:2;max-width:1060px;padding:40px 22px}.hero-content p,.section-head p{letter-spacing:.42em;color:#ffbc38;font-weight:900;margin:0 0 20px;font-size:13px}.hero-content h1{font-size:clamp(44px,7vw,72px);letter-spacing:.08em;margin:0 0 18px;font-weight:900;text-shadow:0 5px 22px rgba(0,0,0,.35)}.hero-content span{display:block;max-width:760px;margin:auto;color:#f0fffb;line-height:1.8;font-size:18px;font-weight:700;text-shadow:0 3px 16px rgba(0,0,0,.35)}.hero-photo-note{display:inline-flex;margin-top:18px;padding:9px 16px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);color:#fff4bf;font-weight:900;letter-spacing:.05em}.hero-categories{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:34px}@keyframes heroFadeZoom{0%{opacity:.08;transform:scale(1.025)}12%{opacity:1}100%{opacity:1;transform:scale(1.075)}}.hero-categories button,.tab-switch button,.filters-panel button{border:none;border-radius:999px;padding:14px 30px;background:#fff;color:#242424;font-weight:900;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.08)}.hero-categories button.on,.tab-switch button.on{background:#0aa6c7;color:#fff}.tab-switch{width:max-content;max-width:90%;margin:-34px auto 42px;background:#fff;border-radius:999px;padding:8px;box-shadow:0 18px 46px rgba(0,0,0,.14);position:relative;z-index:3}.tab-switch button{box-shadow:none;min-width:170px}.section{max-width:1250px;margin:0 auto 50px;padding:0 22px}.section-head{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:24px}.section-head h2{font-size:clamp(32px,4vw,52px);letter-spacing:.08em;margin:0;color:#102936}.section-head span{color:#00647a;font-weight:800}.top-grid,.place-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.filters-panel{max-width:1250px;margin:0 auto 46px;padding:20px;display:grid;grid-template-columns:2fr repeat(4,1fr);gap:12px;background:#fff;border:1px solid #e4efe9;border-radius:24px;box-shadow:0 14px 40px rgba(8,52,55,.06)}.filters-panel input,.filters-panel select{border:1px solid #dbe9e2;border-radius:16px;padding:14px 16px;font-weight:700;outline:none}.filters-panel button{background:#064e45;color:#fff;border-radius:16px}.exp-card{background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 18px 42px rgba(7,43,44,.08);border:1px solid #e7eee7;display:flex;flex-direction:column;min-height:100%}.exp-photo{height:235px;display:block;position:relative;overflow:hidden;background:#ddd}.exp-photo img{width:100%;height:100%;object-fit:cover;transition:transform .35s}.exp-card:hover .exp-photo img{transform:scale(1.06)}.exp-region,.exp-featured{position:absolute;top:16px;border-radius:999px;padding:8px 14px;font-size:12px;font-weight:900}.exp-region{left:16px;background:#fff;color:#035f64}.exp-featured{right:16px;background:#ffc22b;color:#0d3d39}.exp-body{padding:18px;display:flex;flex-direction:column;flex:1}.exp-title-row{display:flex;justify-content:space-between;gap:12px}.exp-title-row h3{margin:0;color:#064e45;font-size:22px}.exp-location{margin:7px 0 0;color:#08715f;font-weight:800}.budget-pill{height:max-content;padding:7px 12px;border-radius:999px;text-transform:uppercase;font-size:12px;font-weight:900}.budget-pill.low{background:#dcfce7;color:#166534}.budget-pill.medium{background:#fff3c4;color:#8a5b00}.budget-pill.high{background:#fee2e2;color:#991b1b}.exp-desc{line-height:1.65;color:#415466;font-weight:600}.exp-meta,.exp-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto}.exp-meta span{background:#f0faf6;border:1px solid #d9eee4;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:800}.exp-tags span{background:#f6f4ed;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:800}.exp-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px}.exp-actions a,.exp-actions button{text-decoration:none;border:none;border-radius:14px;text-align:center;padding:12px 8px;font-weight:900;cursor:pointer}.exp-actions a:first-child{background:#064e45;color:#fff}.exp-actions button{background:#ffc22b;color:#063c38}.exp-actions button.saved-action{background:#e8fff5;color:#05614f;border:1px solid #64c8a8}.exp-actions a:last-child{background:#fff;color:#006b5c;border:1px solid #006b5c}.season-section{max-width:1250px;margin:20px auto 70px;padding:34px 28px;border-radius:30px;color:#fff;display:grid;grid-template-columns:.34fr .66fr;gap:28px;position:relative;overflow:hidden;background-size:cover;background-position:center;box-shadow:0 24px 55px rgba(0,76,65,.18);transition:background-image .6s ease}.month-pill{background:#fff6c9;color:#3b3b00;border-radius:999px;padding:10px 16px;font-weight:900;font-size:12px}.season-section h2{font-size:42px;margin:28px 0 16px;position:relative}.season-section p{line-height:1.8;color:#f2fffc;font-weight:850;text-shadow:0 3px 14px rgba(0,0,0,.35)}.season-copy,.season-grid{position:relative;z-index:1}.season-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.season-card{display:grid;grid-template-columns:88px 1fr;gap:16px;padding:14px;border:1px solid rgba(255,255,255,.22);border-radius:20px;background:rgba(4,60,52,.48);backdrop-filter:blur(8px);text-decoration:none;color:#fff;box-shadow:0 14px 34px rgba(0,0,0,.16)}.season-card img{width:88px;height:78px;object-fit:cover;border-radius:14px}.season-card small{color:#ffe68b;font-weight:900}.season-card strong{display:block;margin:6px 0}.season-card span{color:#cdfef4;font-weight:700}.itinerary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.itinerary-card{background:#fff;border:1px solid #e1ebe6;border-radius:26px;padding:24px;box-shadow:0 16px 40px rgba(0,0,0,.06)}.itinerary-card h3{font-size:26px;color:#064e45;margin:0 0 8px}.itinerary-card>span{color:#b45309;font-weight:900}.itinerary-card p{line-height:1.7;color:#475569}.itinerary-card div{display:flex;flex-direction:column;gap:8px}.itinerary-card a{padding:10px 12px;background:#f0faf6;color:#064e45;border-radius:12px;text-decoration:none;font-weight:800}.state-card{max-width:900px;margin:30px auto;padding:22px;border-radius:18px;background:#fff;border:1px dashed #cadbd4;text-align:center;font-weight:800}.state-card.error{color:#9b1c1c;background:#fff1f1}.season-top{margin:0 auto 46px;border-radius:30px}.season-empty{grid-column:1/-1;background:rgba(255,255,255,.1);border:1px dashed rgba(255,255,255,.28);border-radius:18px;padding:22px;color:#fff;font-weight:900;text-align:center}@media(max-width:1050px){.top-grid,.place-grid,.itinerary-grid{grid-template-columns:repeat(2,1fr)}.filters-panel,.season-section{grid-template-columns:1fr}}@media(max-width:680px){.top-grid,.place-grid,.itinerary-grid,.season-grid{grid-template-columns:1fr}.filters-panel{grid-template-columns:1fr}.tab-switch{display:grid;width:auto}.hero-categories button{width:100%}.section-head{display:block}.exp-actions{grid-template-columns:1fr}.saved-trip-fab{right:14px;bottom:18px}.saved-trip-fab strong{display:none}.saved-trip-panel{right:12px;bottom:82px;width:calc(100vw - 24px)}.saved-trip-item{grid-template-columns:64px 1fr}.saved-trip-item button{grid-column:1/-1}}

/* professional Explore top showcase */
.explore-showcase-hero{
  min-height: 620px;
  padding: 56px max(18px, 6vw) 86px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  text-align: left;
  background-size: cover;
  background-position: center;
}
.explore-showcase-hero .hero-overlay{
  background:
    linear-gradient(90deg, rgba(1, 42, 39, .68) 0%, rgba(3, 91, 81, .42) 48%, rgba(5, 36, 41, .58) 100%),
    radial-gradient(circle at 74% 18%, rgba(255, 202, 48, .14), transparent 32%);
}
.explore-hero-inner{
  position: relative;
  z-index: 2;
  width: min(1480px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(330px, .56fr);
  gap: 44px;
  align-items: center;
}
.explore-hero-copy p{
  letter-spacing: .42em;
  color: #ffe176;
  font-weight: 950;
  margin: 0 0 20px;
  font-size: 13px;
}
.explore-hero-copy h1{
  margin: 0 0 22px;
  max-width: 860px;
  font-size: clamp(58px, 7.8vw, 110px);
  line-height: .92;
  letter-spacing: -.055em;
  font-weight: 1000;
  color: #fff;
  text-shadow: 0 18px 50px rgba(0,0,0,.28);
}
.explore-hero-copy > span{
  display: block;
  max-width: 820px;
  margin: 0 0 28px;
  color: #f3fffb;
  line-height: 1.75;
  font-size: clamp(17px, 1.3vw, 22px);
  font-weight: 750;
  text-shadow: 0 8px 25px rgba(0,0,0,.22);
}
.explore-hero-search{
  width: min(800px, 100%);
  min-height: 72px;
  display: grid;
  grid-template-columns: 54px 1fr;
  align-items: center;
  background: rgba(255,255,255,.96);
  border-radius: 999px;
  padding: 0 24px 0 18px;
  box-shadow: 0 24px 70px rgba(0,0,0,.18);
  border: 1px solid rgba(255,255,255,.45);
}
.explore-hero-search span{
  font-size: 25px;
  display: grid;
  place-items: center;
}
.explore-hero-search input{
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 16px;
  font-weight: 850;
  color: #11302f;
}
.explore-showcase-hero .hero-photo-note{
  margin: 18px 0 0;
  background: rgba(255,255,255,.16);
  border-color: rgba(255,255,255,.22);
}
.explore-showcase-hero .hero-categories{
  justify-content: flex-start;
  margin-top: 24px;
  max-width: 980px;
}
.explore-hero-card{
  min-height: 430px;
  border-radius: 34px;
  padding: 26px;
  color: #fff;
  background: linear-gradient(145deg, rgba(255,255,255,.24), rgba(255,255,255,.1));
  border: 1px solid rgba(255,255,255,.34);
  box-shadow: 0 32px 80px rgba(0,0,0,.22);
  backdrop-filter: blur(13px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}
.explore-hero-card-photo{
  height: 180px;
  border-radius: 26px;
  background-size: cover;
  background-position: center;
  margin-bottom: auto;
  filter: saturate(1.08) brightness(1.08);
  box-shadow: inset 0 -60px 90px rgba(0,0,0,.18);
}
.explore-hero-card > span{
  width: max-content;
  margin-top: 20px;
  padding: 9px 13px;
  border-radius: 999px;
  background: rgba(7, 102, 88, .82);
  color: #fff3a7;
  font-size: 12px;
  font-weight: 950;
}
.explore-hero-card h2{
  margin: 22px 0 8px;
  font-size: clamp(28px, 2.8vw, 44px);
  line-height: 1.05;
  letter-spacing: -.04em;
}
.explore-hero-card p{
  margin: 0;
  font-weight: 850;
  color: #effffb;
}
.explore-hero-card div{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:18px;
}
.explore-hero-card b{
  border-radius:999px;
  padding:9px 13px;
  background:rgba(255,255,255,.18);
  border:1px solid rgba(255,255,255,.25);
  color:#fff8cc;
  font-size:12px;
}
.explore-hero-stats{
  position: relative;
  z-index: 2;
  width: min(1480px, 100%);
  margin: 34px auto 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.explore-hero-stats article{
  min-height: 96px;
  border-radius: 24px;
  padding: 20px 22px;
  background: rgba(255,255,255,.16);
  border: 1px solid rgba(255,255,255,.28);
  color: #fff;
  backdrop-filter: blur(10px);
}
.explore-hero-stats strong{
  display:block;
  color:#ffe176;
  font-size: clamp(28px, 3vw, 44px);
  line-height: 1;
}
.explore-hero-stats span{
  display:block;
  margin-top:8px;
  letter-spacing:.12em;
  text-transform:uppercase;
  font-size:12px;
  font-weight:950;
}

/* clear photo preview card effect */
.explore-hero-card.clear-preview-card{
  position:relative;
  min-height:430px;
  padding:0;
  background:#063f39;
  border:1px solid rgba(255,255,255,.34);
  box-shadow:0 32px 80px rgba(0,0,0,.24);
  backdrop-filter:none;
  display:block;
  overflow:hidden;
  isolation:isolate;
}
.explore-hero-card-photo.clear-preview-photo{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  margin:0;
  border-radius:0;
  background-size:cover;
  background-position:center;
  filter:saturate(1.08) contrast(1.02) brightness(1.08);
  box-shadow:none;
  transform:scale(1.01);
  transition:transform 4s ease, opacity .45s ease;
  z-index:0;
}
.explore-hero-card.clear-preview-card:hover .clear-preview-photo{transform:scale(1.055);}
.explore-hero-card .clear-preview-shade{
  position:absolute;
  inset:0;
  z-index:1;
  background:linear-gradient(0deg,rgba(3,39,35,.84) 0%,rgba(4,65,58,.48) 46%,rgba(255,196,37,.07) 100%);
}
.explore-hero-card-content.clear-preview-content{
  position:absolute;
  left:30px;
  right:30px;
  bottom:30px;
  z-index:2;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  justify-content:flex-end;
}
.explore-hero-card-content.clear-preview-content > span{
  width:max-content;
  margin:0;
  padding:9px 13px;
  border-radius:999px;
  background:rgba(5,85,75,.80);
  color:#fff3a7;
  font-size:12px;
  font-weight:950;
  border:1px solid rgba(255,255,255,.24);
  box-shadow:0 10px 24px rgba(0,0,0,.16);
}
.explore-hero-card-content.clear-preview-content h2{
  margin:24px 0 10px;
  font-size:clamp(28px,2.8vw,44px);
  line-height:1.03;
  letter-spacing:-.045em;
  text-shadow:0 4px 18px rgba(0,0,0,.36);
}
.explore-hero-card-content.clear-preview-content p{
  margin:0;
  font-weight:850;
  color:#eafffb;
  text-shadow:0 2px 12px rgba(0,0,0,.32);
}
.explore-hero-card-tags.clear-preview-tags{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:16px;
}
.explore-hero-card-tags.clear-preview-tags b{
  border-radius:999px;
  padding:9px 13px;
  background:rgba(255,255,255,.18);
  border:1px solid rgba(255,255,255,.28);
  color:#fff8cc;
  font-size:12px;
  backdrop-filter:blur(4px);
}

.explore-showcase-hero + .tab-switch{margin-top:-34px;}
@media(max-width:1050px){
  .explore-hero-inner{grid-template-columns:1fr;}
  .explore-hero-card{min-height:360px;}
  .explore-hero-stats{grid-template-columns:repeat(2,1fr);}
}
@media(max-width:680px){
  .explore-showcase-hero{min-height:auto;padding:44px 16px 80px;}
  .explore-hero-copy h1{font-size:clamp(42px,15vw,64px);}
  .explore-hero-search{min-height:58px;grid-template-columns:42px 1fr;padding-right:14px;}
  .explore-hero-stats{grid-template-columns:1fr;}
}

/* 100% zoom desktop balance + sharp preview card */
@media(min-width:1024px){
  .explore-showcase-hero{
    min-height:clamp(500px,58vh,560px);
    padding-top:38px;
    padding-bottom:54px;
  }
  .explore-showcase-hero .hero-bg-image{
    filter:blur(2px) saturate(1.08) contrast(1.02) brightness(.98);
  }
  .explore-hero-copy p{margin-bottom:14px;}
  .explore-hero-copy h1{
    max-width:760px;
    font-size:clamp(50px,6.3vw,88px);
    margin-bottom:16px;
  }
  .explore-hero-copy > span{
    max-width:760px;
    margin-bottom:22px;
    font-size:clamp(16px,1.15vw,19px);
  }
  .explore-hero-search{
    min-height:60px;
    width:min(740px,100%);
  }
  .explore-showcase-hero .hero-categories{
    margin-top:18px;
    gap:10px;
  }
  .explore-showcase-hero .hero-categories button{
    padding:11px 24px;
  }
  .explore-hero-card.clear-preview-card{
    min-height:360px;
  }
  .explore-hero-card-photo.clear-preview-photo{
    filter:saturate(1.16) contrast(1.08) brightness(1.08);
  }
  .explore-hero-card .clear-preview-shade{
    background:linear-gradient(0deg,rgba(3,39,35,.60) 0%,rgba(4,65,58,.24) 46%,rgba(255,196,37,.03) 100%);
  }
  .explore-hero-card-content.clear-preview-content{
    left:24px;
    right:24px;
    bottom:24px;
  }
  .explore-hero-card-content.clear-preview-content h2{
    font-size:clamp(24px,2.1vw,34px);
    margin-top:18px;
  }
  .explore-hero-stats{
    margin-top:22px;
    gap:12px;
  }
  .explore-hero-stats article{
    min-height:74px;
    padding:14px 18px;
    border-radius:18px;
  }
  .explore-hero-stats strong{font-size:clamp(24px,2.4vw,34px);}
}


/* compact first-screen landing fix - keeps filters, search and tab buttons visible at 100% zoom */
@media (min-width:1024px){
  .explore-showcase-hero{
    min-height:min(560px,calc(100vh - 118px));
    padding:34px max(18px,6vw) 54px;
    justify-content:center;
  }
  .explore-hero-inner{
    grid-template-columns:minmax(0,1.12fr) minmax(330px,.55fr);
    gap:36px;
  }
  .explore-hero-copy p{
    margin-bottom:12px;
    font-size:12px;
    letter-spacing:.32em;
  }
  .explore-hero-copy h1{
    max-width:760px;
    font-size:clamp(46px,5.7vw,76px);
    line-height:.94;
    margin-bottom:14px;
  }
  .explore-hero-copy > span{
    max-width:760px;
    margin-bottom:18px;
    font-size:clamp(15px,1.05vw,18px);
    line-height:1.55;
  }
  .explore-hero-search{
    width:min(720px,100%);
    min-height:58px;
    grid-template-columns:48px 1fr;
    padding:0 20px 0 14px;
  }
  .explore-hero-search span{font-size:22px;}
  .explore-hero-search input{font-size:15px;}
  .explore-showcase-hero .hero-photo-note{
    margin-top:12px;
    padding:8px 13px;
    font-size:11px;
  }
  .explore-showcase-hero .hero-categories{
    margin-top:16px;
    gap:10px;
    max-width:940px;
  }
  .explore-showcase-hero .hero-categories button{
    padding:11px 22px;
    font-size:14px;
  }
  .explore-hero-card.clear-preview-card{
    min-height:320px;
    border-radius:28px;
  }
  .explore-hero-card-content.clear-preview-content{
    left:24px;
    right:24px;
    bottom:24px;
  }
  .explore-hero-card-content.clear-preview-content span{
    padding:8px 12px;
    font-size:11px;
  }
  .explore-hero-card-content.clear-preview-content h2{
    font-size:clamp(24px,2.2vw,34px);
    margin:14px 0 8px;
  }
  .explore-hero-card-content.clear-preview-content p{font-size:14px;}
  .explore-hero-card-tags.clear-preview-tags{
    margin-top:12px;
    gap:8px;
  }
  .explore-hero-card-tags.clear-preview-tags b{
    padding:8px 11px;
    font-size:11px;
  }
  .explore-hero-stats{
    margin-top:22px;
    gap:14px;
  }
  .explore-hero-stats article{
    min-height:74px;
    padding:14px 18px;
    border-radius:18px;
  }
  .explore-hero-stats strong{font-size:clamp(26px,2.3vw,34px);}
  .explore-hero-stats span{
    margin-top:5px;
    font-size:11px;
  }
  .tab-switch{
    margin:-38px auto 28px;
    padding:7px;
  }
  .tab-switch button{
    min-width:150px;
    padding:12px 26px;
  }
}
@media (min-width:1024px) and (max-height:760px){
  .explore-showcase-hero{
    min-height:520px;
    padding-top:28px;
    padding-bottom:48px;
  }
  .explore-hero-copy h1{font-size:clamp(42px,5.2vw,68px);}
  .explore-hero-card.clear-preview-card{min-height:290px;}
  .explore-hero-stats article{min-height:68px;padding:12px 16px;}
  .tab-switch{margin-top:-34px;}
}


/* extra compact hero v2 - reduces top section height more for 100% browser zoom */
@media (min-width:1024px){
  .explore-showcase-hero{
    min-height:460px !important;
    padding:24px max(18px,5.2vw) 34px !important;
    border-bottom-left-radius:28px;
    border-bottom-right-radius:28px;
  }
  .explore-hero-inner{
    grid-template-columns:minmax(0,1.05fr) minmax(300px,.46fr) !important;
    gap:28px !important;
    align-items:center;
  }
  .explore-hero-copy p{
    font-size:10.5px !important;
    margin-bottom:8px !important;
    letter-spacing:.26em !important;
  }
  .explore-hero-copy h1{
    max-width:670px !important;
    font-size:clamp(38px,4.6vw,62px) !important;
    line-height:.92 !important;
    margin-bottom:10px !important;
  }
  .explore-hero-copy > span{
    max-width:650px !important;
    font-size:14px !important;
    line-height:1.45 !important;
    margin-bottom:12px !important;
  }
  .explore-hero-search{
    width:min(620px,100%) !important;
    min-height:48px !important;
    grid-template-columns:40px 1fr !important;
    padding:0 16px 0 12px !important;
    border-radius:999px !important;
  }
  .explore-hero-search span{font-size:19px !important;}
  .explore-hero-search input{font-size:13.5px !important;}
  .explore-showcase-hero .hero-photo-note{
    margin-top:8px !important;
    padding:6px 11px !important;
    font-size:10px !important;
  }
  .explore-showcase-hero .hero-categories{
    margin-top:10px !important;
    gap:7px !important;
    max-width:790px !important;
  }
  .explore-showcase-hero .hero-categories button{
    padding:8px 16px !important;
    font-size:12.5px !important;
    box-shadow:0 6px 18px rgba(0,0,0,.07) !important;
  }
  .explore-hero-card.clear-preview-card{
    min-height:260px !important;
    border-radius:24px !important;
  }
  .explore-hero-card-content.clear-preview-content{
    left:18px !important;
    right:18px !important;
    bottom:18px !important;
  }
  .explore-hero-card-content.clear-preview-content span{
    padding:6px 10px !important;
    font-size:10px !important;
  }
  .explore-hero-card-content.clear-preview-content h2{
    font-size:clamp(21px,1.8vw,28px) !important;
    margin:10px 0 6px !important;
  }
  .explore-hero-card-content.clear-preview-content p{font-size:12.5px !important;}
  .explore-hero-card-tags.clear-preview-tags{margin-top:8px !important;gap:6px !important;}
  .explore-hero-card-tags.clear-preview-tags b{padding:6px 9px !important;font-size:10px !important;}
  .explore-hero-stats{
    margin-top:14px !important;
    gap:10px !important;
  }
  .explore-hero-stats article{
    min-height:56px !important;
    padding:9px 14px !important;
    border-radius:16px !important;
  }
  .explore-hero-stats strong{font-size:clamp(22px,2vw,28px) !important;}
  .explore-hero-stats span{font-size:9.5px !important;margin-top:3px !important;}
  .tab-switch{
    margin:-26px auto 24px !important;
    padding:6px !important;
  }
  .tab-switch button{
    min-width:132px !important;
    padding:10px 22px !important;
    font-size:13.5px !important;
  }
}
@media (min-width:1024px) and (max-height:760px){
  .explore-showcase-hero{
    min-height:430px !important;
    padding-top:20px !important;
    padding-bottom:30px !important;
  }
  .explore-hero-copy h1{font-size:clamp(34px,4.2vw,56px) !important;}
  .explore-hero-card.clear-preview-card{min-height:235px !important;}
  .explore-hero-stats article{min-height:52px !important;padding:8px 12px !important;}
}

`;
