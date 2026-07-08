import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const priceLimitMin = 0;
const priceLimitMax = 50000;
const priceGap = 500;

const defaultFilterState = {
  city: "",
  district: "",
  type: "",
  search: "",
  minPrice: 0,
  maxPrice: 50000,
  hasRoomsOnly: false,
  sort: "recommended",
};

const budgetPresets = [
  { id: "all", label: "All budgets", min: 0, max: 50000 },
  { id: "budget", label: "Budget friendly", min: 0, max: 15000 },
  { id: "comfort", label: "Comfort stays", min: 15000, max: 30000 },
  { id: "premium", label: "Premium stays", min: 30000, max: 50000 },
];

function HotelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [heroIndex, setHeroIndex] = useState(0);
  const [filters, setFilters] = useState({
    ...defaultFilterState,
    city: searchParams.get("city") || "",
    search: searchParams.get("search") || "",
  });

  const loadPageData = async () => {
    try {
      setLoading(true);

      const [propertiesResponse, placesResponse] = await Promise.allSettled([
        api.get("/properties"),
        api.get("/explore/places"),
      ]);

      if (propertiesResponse.status === "fulfilled") {
        const approvedHotels = (propertiesResponse.value.data.data || []).filter(
          (property) =>
            !property.status || String(property.status).toLowerCase() === "approved"
        );
        setProperties(approvedHotels);
      }

      if (placesResponse.status === "fulfilled") {
        setPlaces(placesResponse.value.data.places || []);
      }
    } catch (error) {
      console.error("Load hotels page data error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    setFilters((previous) => ({
      ...previous,
      city: searchParams.get("city") || "",
      search: searchParams.get("search") || "",
    }));
  }, [searchParams]);

  const toImageUrl = (imageUrl) => {
    if (!imageUrl) return "";
    const value = String(imageUrl).trim();

    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;

    return `${ASSET_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
  };

  const hotelHeroImages = useMemo(() => {
    return properties
      .map((property) => ({
        src: toImageUrl(property.main_image || property.hero_image || property.logo_url),
        title: property.name,
        label: property.city || "Hotel stay",
        type: "Hotel",
      }))
      .filter((item) => item.src)
      .slice(0, 4);
  }, [properties]);

  const placeHeroImages = useMemo(() => {
    const used = new Set();
    const images = [];

    places.forEach((place) => {
      const imageCandidates = [
        place.image_url,
        place.image,
        ...(Array.isArray(place.images) ? place.images : []),
        ...(Array.isArray(place.photos)
          ? place.photos.map((photo) => photo.image_url || photo.url || photo.image)
          : []),
      ];

      const image = imageCandidates.map(toImageUrl).find((url) => url && !used.has(url));

      if (image) {
        used.add(image);
        images.push({
          src: image,
          title: place.name,
          label: place.region || place.city || "Explore place",
          type: "Explore",
        });
      }
    });

    return images.slice(0, 2);
  }, [places]);

  const heroImages = useMemo(() => {
    return [...hotelHeroImages, ...placeHeroImages];
  }, [hotelHeroImages, placeHeroImages]);

  useEffect(() => {
    setHeroIndex(0);
  }, [heroImages.length]);

  useEffect(() => {
    if (heroImages.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroImages.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [heroImages.length]);

  const currentHero = heroImages[heroIndex] || null;

  const destinationOptions = useMemo(() => {
    const countMap = properties.reduce((acc, property) => {
      if (!property.city) return acc;
      acc[property.city] = (acc[property.city] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [properties]);

  const districtOptions = useMemo(() => {
    const countMap = properties.reduce((acc, property) => {
      if (!property.district) return acc;
      acc[property.district] = (acc[property.district] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [properties]);

  const typeOptions = useMemo(() => {
    const countMap = properties.reduce((acc, property) => {
      const type = property.property_type || "Hotel";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [properties]);

  const stats = useMemo(() => {
    const cities = new Set(properties.map((property) => property.city).filter(Boolean));
    const prices = properties
      .map((property) => Number(property.starting_price || 0))
      .filter((price) => price > 0);
    const totalRooms = properties.reduce(
      (sum, property) => sum + Number(property.total_rooms_count || 0),
      0
    );

    return {
      approvedStays: properties.length,
      destinations: cities.size,
      lowestPrice: prices.length ? Math.min(...prices) : 0,
      rooms: totalRooms,
    };
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    const matched = properties.filter((property) => {
      const searchMatches =
        !query ||
        [
          property.name,
          property.city,
          property.district,
          property.address,
          property.description,
          property.property_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const cityMatches =
        !filters.city || property.city?.toLowerCase() === filters.city.toLowerCase();

      const districtMatches =
        !filters.district ||
        property.district?.toLowerCase() === filters.district.toLowerCase();

      const typeMatches =
        !filters.type ||
        property.property_type?.toLowerCase() === filters.type.toLowerCase();

      const price = Number(property.starting_price || 0);
      const priceMatches = price >= filters.minPrice && price <= filters.maxPrice;

      const roomMatches =
        !filters.hasRoomsOnly || Number(property.total_rooms_count || 0) > 0;

      return (
        searchMatches &&
        cityMatches &&
        districtMatches &&
        typeMatches &&
        priceMatches &&
        roomMatches
      );
    });

    return [...matched].sort((a, b) => {
      const priceA = Number(a.starting_price || 0);
      const priceB = Number(b.starting_price || 0);
      const roomsA = Number(a.total_rooms_count || 0);
      const roomsB = Number(b.total_rooms_count || 0);

      if (filters.sort === "priceLow") return priceA - priceB;
      if (filters.sort === "priceHigh") return priceB - priceA;
      if (filters.sort === "rooms") return roomsB - roomsA;
      if (filters.sort === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (filters.sort === "name") return a.name.localeCompare(b.name);

      return roomsB - roomsA || priceA - priceB;
    });
  }, [properties, filters]);

  const updateFilters = (updates) => {
    setFilters((previous) => {
      const next = { ...previous, ...updates };
      const params = new URLSearchParams(searchParams);

      if (updates.city !== undefined) {
        if (next.city) params.set("city", next.city);
        else params.delete("city");
      }

      if (updates.search !== undefined) {
        if (next.search.trim()) params.set("search", next.search.trim());
        else params.delete("search");
      }

      setSearchParams(params);
      return next;
    });
  };

  const handleMinPriceChange = (event) => {
    const value = Number(event.target.value);
    updateFilters({ minPrice: Math.min(value, filters.maxPrice - priceGap) });
  };

  const handleMaxPriceChange = (event) => {
    const value = Number(event.target.value);
    updateFilters({ maxPrice: Math.max(value, filters.minPrice + priceGap) });
  };

  const handleClearFilters = () => {
    setFilters(defaultFilterState);
    setSearchParams({});
  };

  const applyBudgetPreset = (preset) => {
    updateFilters({ minPrice: preset.min, maxPrice: preset.max });
  };

  const minPercent =
    ((filters.minPrice - priceLimitMin) / (priceLimitMax - priceLimitMin)) * 100;
  const maxPercent =
    ((filters.maxPrice - priceLimitMin) / (priceLimitMax - priceLimitMin)) * 100;

  const activeChips = [
    filters.search && `Search: ${filters.search}`,
    filters.city && `City: ${filters.city}`,
    filters.district && `District: ${filters.district}`,
    filters.type && `Type: ${filters.type}`,
    filters.hasRoomsOnly && "Has rooms",
    (filters.minPrice !== 0 || filters.maxPrice !== 50000) &&
      `Rs. ${filters.minPrice.toLocaleString()} - Rs. ${filters.maxPrice.toLocaleString()}`,
  ].filter(Boolean);

  return (
    <div className="hotels-page-shell">
      <style>{pageStyles}</style>

      <section
        className="hotels-hero"
        style={{
          backgroundImage: currentHero
            ? `linear-gradient(90deg, rgba(0, 69, 61, 0.84), rgba(0, 92, 81, 0.68)), url(${currentHero.src})`
            : "linear-gradient(135deg, #00453d, #087264)",
        }}
      >
        <div className="hero-copy">
          <span className="hero-kicker">Trusted stays across Sri Lanka</span>
          <h1>Find the right hotel for your journey</h1>
          <p>
            Browse admin-approved registered hotels, compare destinations and use
            smart filters to find the stay that matches your trip.
          </p>

          <div className="hero-search-box">
            <span>🔎</span>
            <input
              type="text"
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder="Search by hotel, city, district, address or type..."
            />
          </div>

          {currentHero && (
            <div className="hero-photo-source">
              <span>{currentHero.type}</span>
              <strong>{currentHero.title}</strong>
              <small>{currentHero.label}</small>
            </div>
          )}
        </div>

        <div className="hero-stats-grid">
          <div className="hero-stat-card">
            <strong>{stats.approvedStays}</strong>
            <span>Approved stays</span>
          </div>
          <div className="hero-stat-card">
            <strong>{stats.destinations}</strong>
            <span>Destinations</span>
          </div>
          <div className="hero-stat-card">
            <strong>
              {stats.lowestPrice ? `Rs. ${stats.lowestPrice.toLocaleString()}` : "-"}
            </strong>
            <span>Lowest start price</span>
          </div>
          <div className="hero-stat-card">
            <strong>{stats.rooms}</strong>
            <span>Listed rooms</span>
          </div>
        </div>
      </section>

      <section className="hotel-content-grid">
        <aside className="hotel-filter-panel">
          <div className="filter-panel-top">
            <div>
              <span className="section-kicker">Smart filter</span>
              <h2>Refine hotels</h2>
            </div>
            <button type="button" onClick={handleClearFilters} className="clear-filter-btn">
              Clear
            </button>
          </div>

          <div className="filter-block">
            <label>Destination</label>
            <button
              type="button"
              onClick={() => updateFilters({ city: "" })}
              className={`filter-option ${!filters.city ? "active" : ""}`}
            >
              <span>All destinations</span>
              <small>{properties.length}</small>
            </button>
            {destinationOptions.map((city) => (
              <button
                type="button"
                key={city.name}
                onClick={() => updateFilters({ city: city.name })}
                className={`filter-option ${filters.city === city.name ? "active" : ""}`}
              >
                <span>{city.name}</span>
                <small>{city.count}</small>
              </button>
            ))}
          </div>

          <div className="filter-block">
            <label>District</label>
            <select
              value={filters.district}
              onChange={(event) => updateFilters({ district: event.target.value })}
            >
              <option value="">All districts</option>
              {districtOptions.map((district) => (
                <option value={district.name} key={district.name}>
                  {district.name} ({district.count})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-block">
            <label>Stay type</label>
            <div className="type-grid">
              <button
                type="button"
                onClick={() => updateFilters({ type: "" })}
                className={`type-pill ${!filters.type ? "active" : ""}`}
              >
                All
              </button>
              {typeOptions.map((type) => (
                <button
                  type="button"
                  key={type.name}
                  onClick={() => updateFilters({ type: type.name })}
                  className={`type-pill ${filters.type === type.name ? "active" : ""}`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <label>Price range</label>
            <div className="price-card">
              <div className="price-top-row">
                <strong>Rs. {filters.minPrice.toLocaleString()}</strong>
                <strong>Rs. {filters.maxPrice.toLocaleString()}</strong>
              </div>

              <div className="dual-slider-wrap">
                <div className="dual-slider-base" />
                <div
                  className="dual-slider-active"
                  style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
                />
                <input
                  className="hotel-range-input"
                  type="range"
                  min={priceLimitMin}
                  max={priceLimitMax}
                  step="500"
                  value={filters.minPrice}
                  onChange={handleMinPriceChange}
                  style={{ zIndex: filters.minPrice > priceLimitMax - 8000 ? 5 : 3 }}
                />
                <input
                  className="hotel-range-input"
                  type="range"
                  min={priceLimitMin}
                  max={priceLimitMax}
                  step="500"
                  value={filters.maxPrice}
                  onChange={handleMaxPriceChange}
                  style={{ zIndex: 4 }}
                />
              </div>

              <div className="price-bottom-row">
                <span>Rs. 0</span>
                <span>Rs. 50,000</span>
              </div>
            </div>
          </div>

          <div className="filter-block">
            <label>Budget quick picks</label>
            <div className="budget-grid">
              {budgetPresets.map((preset) => {
                const isActive =
                  filters.minPrice === preset.min && filters.maxPrice === preset.max;

                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => applyBudgetPreset(preset)}
                    className={`budget-pill ${isActive ? "active" : ""}`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-block">
            <label>Availability</label>
            <button
              type="button"
              onClick={() => updateFilters({ hasRoomsOnly: !filters.hasRoomsOnly })}
              className={`toggle-row ${filters.hasRoomsOnly ? "active" : ""}`}
            >
              <span>🛏️ Has room listings</span>
              <strong>{filters.hasRoomsOnly ? "On" : "Off"}</strong>
            </button>
          </div>
        </aside>

        <main className="hotel-results-area">
          <div className="results-toolbar">
            <div>
              <span className="section-kicker">Approved hotel results</span>
              <h2>{filteredProperties.length} stays found</h2>
            </div>

            <div className="toolbar-actions">
              <select
                value={filters.sort}
                onChange={(event) => updateFilters({ sort: event.target.value })}
              >
                <option value="recommended">Recommended</option>
                <option value="priceLow">Lowest price</option>
                <option value="priceHigh">Highest price</option>
                <option value="rooms">Most rooms</option>
                <option value="newest">Newest</option>
                <option value="name">Name A-Z</option>
              </select>

              <div className="view-toggle">
                <button
                  type="button"
                  className={viewMode === "list" ? "active" : ""}
                  onClick={() => setViewMode("list")}
                >
                  List
                </button>
                <button
                  type="button"
                  className={viewMode === "grid" ? "active" : ""}
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </button>
              </div>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="active-chip-row">
              {activeChips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
          )}

          {loading ? (
            <div className="empty-result-card">
              <h3>Loading approved hotels...</h3>
              <p>Please wait while TourismHub LK loads registered hotel data.</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="empty-result-card">
              <h3>No approved hotels found</h3>
              <p>Try changing the destination, price range or search text.</p>
              <button type="button" onClick={handleClearFilters}>
                Reset filters
              </button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "hotel-grid-view" : "hotel-list-view"}>
              {filteredProperties.map((property) => (
                <HotelCard key={property.id} property={property} toImageUrl={toImageUrl} />
              ))}
            </div>
          )}
        </main>
      </section>
    </div>
  );
}

function HotelCard({ property, toImageUrl }) {
  const imageUrl = toImageUrl(property.main_image || property.logo_url);
  const price = Number(property.starting_price || 0);
  const totalRooms = Number(property.total_rooms_count || 0);

  return (
    <article className="hotel-result-card">
      {imageUrl ? (
        <img src={imageUrl} alt={property.name} className="hotel-card-image" />
      ) : (
        <div className="hotel-image-placeholder">
          <span>🏨</span>
          <strong>{property.name}</strong>
        </div>
      )}

      <div className="hotel-card-content">
        <div className="hotel-main-info">
          <div className="hotel-card-badges">
            <span className="verified-badge">Approved</span>
            {property.property_type && <span>{property.property_type}</span>}
            {totalRooms > 0 && <span>{totalRooms} rooms</span>}
          </div>

          <h3>{property.name}</h3>
          <p className="hotel-location">📍 {property.city}, {property.district}</p>
          <p className="hotel-description">
            {property.description || "No description added yet."}
          </p>
        </div>

        <div className="hotel-price-panel">
          <span>Starting from</span>
          <strong>{price ? `Rs. ${price.toLocaleString()}` : "Contact hotel"}</strong>
          <small>per night</small>
          <Link to={`/hotels/${property.id}`}>View Details</Link>
        </div>
      </div>
    </article>
  );
}

const pageStyles = `
  .hotels-page-shell{
    width:min(1480px, calc(100% - 36px));
    margin:0 auto;
    padding:30px 0 60px;
    color:#102033;
  }

  .hotels-hero{
    min-height:420px;
    border-radius:34px;
    padding:46px;
    display:grid;
    grid-template-columns:1.15fr .85fr;
    gap:34px;
    align-items:center;
    background-size:cover;
    background-position:center;
    box-shadow:0 26px 70px rgba(0, 69, 61, .18);
    overflow:hidden;
    position:relative;
    transition:background-image .9s ease-in-out;
  }

  .hotels-hero::after{
    content:"";
    position:absolute;
    inset:0;
    background:radial-gradient(circle at 75% 25%, rgba(255, 199, 44, .18), transparent 32%), linear-gradient(180deg, rgba(0,0,0,.03), rgba(0,0,0,.18));
    pointer-events:none;
  }

  .hero-copy,.hero-stats-grid{position:relative;z-index:1;}

  .hero-kicker,.section-kicker{
    display:inline-flex;
    align-items:center;
    width:max-content;
    background:rgba(255, 238, 168, .95);
    color:#00453d;
    border:1px solid rgba(255, 255, 255, .45);
    border-radius:999px;
    padding:10px 18px;
    text-transform:uppercase;
    letter-spacing:.14em;
    font-size:12px;
    font-weight:950;
  }

  .hero-copy h1{
    margin:24px 0 16px;
    font-size:clamp(48px, 6vw, 92px);
    line-height:.98;
    letter-spacing:-.06em;
    color:#ffffff;
    max-width:850px;
  }

  .hero-copy p{
    color:rgba(255,255,255,.9);
    font-size:19px;
    line-height:1.7;
    max-width:800px;
    margin:0 0 24px;
  }

  .hero-search-box{
    width:min(760px, 100%);
    display:flex;
    align-items:center;
    gap:14px;
    background:#fff;
    border-radius:999px;
    padding:15px 22px;
    box-shadow:0 22px 45px rgba(0,0,0,.18);
  }

  .hero-search-box span{font-size:22px;}

  .hero-search-box input{
    flex:1;
    border:none;
    outline:none;
    font-size:16px;
    font-weight:800;
    color:#102033;
    min-width:0;
  }

  .hero-photo-source{
    margin-top:16px;
    display:flex;
    align-items:center;
    gap:10px;
    flex-wrap:wrap;
    color:#ffffff;
  }

  .hero-photo-source span{
    background:rgba(255,255,255,.18);
    border:1px solid rgba(255,255,255,.28);
    padding:7px 12px;
    border-radius:999px;
    font-size:12px;
    font-weight:950;
    text-transform:uppercase;
    letter-spacing:.08em;
  }

  .hero-photo-source strong{font-weight:950;}
  .hero-photo-source small{opacity:.88;font-weight:800;}

  .hero-stats-grid{
    display:grid;
    grid-template-columns:repeat(2, minmax(180px, 1fr));
    gap:18px;
  }

  .hero-stat-card{
    min-height:145px;
    border:1px solid rgba(255,255,255,.25);
    background:rgba(255,255,255,.12);
    backdrop-filter:blur(8px);
    border-radius:28px;
    padding:28px;
    display:flex;
    flex-direction:column;
    justify-content:center;
  }

  .hero-stat-card strong{
    color:#ffdf74;
    font-size:34px;
    line-height:1;
    margin-bottom:12px;
    letter-spacing:-.03em;
  }

  .hero-stat-card span{
    color:#ffffff;
    font-size:13px;
    font-weight:950;
    text-transform:uppercase;
    letter-spacing:.12em;
  }

  .hotel-content-grid{
    display:grid;
    grid-template-columns:340px 1fr;
    gap:26px;
    margin-top:28px;
    align-items:start;
  }

  .hotel-filter-panel{
    position:sticky;
    top:92px;
    background:rgba(255,255,255,.94);
    border:1px solid #dbece7;
    border-radius:28px;
    padding:24px;
    box-shadow:0 24px 55px rgba(0,69,61,.09);
  }

  .filter-panel-top{
    display:flex;
    justify-content:space-between;
    gap:16px;
    align-items:flex-start;
    border-bottom:1px solid #e3efeb;
    padding-bottom:20px;
    margin-bottom:18px;
  }

  .filter-panel-top h2,.results-toolbar h2{
    margin:8px 0 0;
    color:#00453d;
    font-size:25px;
    letter-spacing:-.04em;
  }

  .clear-filter-btn{
    border:none;
    background:#ffe2e2;
    color:#a30d17;
    border-radius:999px;
    padding:10px 14px;
    font-weight:950;
    cursor:pointer;
  }

  .filter-block{margin-top:22px;}
  .filter-block label{
    display:block;
    color:#102033;
    font-weight:950;
    margin-bottom:10px;
  }

  .filter-block select,.toolbar-actions select{
    width:100%;
    border:1px solid #cfdfda;
    background:#f9fffd;
    color:#102033;
    border-radius:15px;
    padding:13px 14px;
    font-weight:850;
    outline:none;
  }

  .filter-option{
    width:100%;
    border:1px solid #d9e8e4;
    background:#fbfffd;
    color:#244257;
    border-radius:16px;
    padding:13px 14px;
    display:flex;
    justify-content:space-between;
    gap:12px;
    margin-bottom:9px;
    cursor:pointer;
    font-weight:850;
    text-align:left;
  }

  .filter-option small{
    background:#ecf7f3;
    color:#006655;
    border-radius:999px;
    padding:2px 8px;
    font-weight:950;
  }

  .filter-option.active{
    background:#006655;
    color:#ffffff;
    border-color:#006655;
    box-shadow:0 12px 26px rgba(0,102,85,.18);
  }

  .filter-option.active small{
    background:#ffcf4a;
    color:#00453d;
  }

  .type-grid,.budget-grid{
    display:flex;
    gap:8px;
    flex-wrap:wrap;
  }

  .type-pill,.budget-pill{
    border:1px solid #dbece7;
    background:#fbfffd;
    color:#00453d;
    border-radius:999px;
    padding:10px 13px;
    font-weight:950;
    cursor:pointer;
  }

  .type-pill.active,.budget-pill.active{
    background:#006655;
    color:#ffffff;
    border-color:#006655;
  }

  .price-card{
    border:1px solid #dbece7;
    background:#f9fffd;
    border-radius:22px;
    padding:20px 20px 17px;
  }

  .price-top-row,.price-bottom-row{
    display:flex;
    justify-content:space-between;
    align-items:center;
  }

  .price-top-row strong{
    color:#102033;
    font-size:17px;
  }

  .price-bottom-row{
    color:#6b788c;
    font-size:13px;
    font-weight:950;
  }

  .dual-slider-wrap{
    position:relative;
    height:44px;
    margin:18px 0 6px;
    display:flex;
    align-items:center;
  }

  .dual-slider-base,.dual-slider-active{
    position:absolute;
    height:8px;
    border-radius:999px;
    pointer-events:none;
  }

  .dual-slider-base{
    left:0;
    right:0;
    background:#dce7e3;
  }

  .dual-slider-active{
    background:linear-gradient(90deg, #ffcf4a, #009c89);
    box-shadow:0 8px 20px rgba(0,156,137,.28);
  }

  .hotel-range-input{
    position:absolute;
    left:0;
    width:100%;
    height:8px;
    background:transparent!important;
    pointer-events:none;
    appearance:none;
    -webkit-appearance:none;
    outline:none;
  }

  .hotel-range-input::-webkit-slider-thumb{
    pointer-events:auto;
    width:28px;
    height:28px;
    border-radius:50%;
    background:#009cde;
    border:4px solid #009cde;
    box-shadow:0 7px 18px rgba(0,156,222,.35);
    cursor:pointer;
    appearance:none;
    -webkit-appearance:none;
  }

  .hotel-range-input::-moz-range-thumb{
    pointer-events:auto;
    width:24px;
    height:24px;
    border-radius:50%;
    background:#009cde;
    border:4px solid #009cde;
    box-shadow:0 7px 18px rgba(0,156,222,.35);
    cursor:pointer;
  }

  .hotel-range-input::-webkit-slider-runnable-track{background:transparent!important;border:none;}
  .hotel-range-input::-moz-range-track{background:transparent!important;border:none;}

  .toggle-row{
    width:100%;
    border:1px solid #dbece7;
    background:#fbfffd;
    color:#102033;
    border-radius:16px;
    padding:13px 14px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    font-weight:900;
    cursor:pointer;
  }

  .toggle-row.active{
    background:#e6fff6;
    border-color:#8fd9c9;
    color:#006655;
  }

  .hotel-results-area{min-width:0;}

  .results-toolbar{
    background:#fff;
    border:1px solid #dbece7;
    border-radius:24px;
    padding:18px 20px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:18px;
    margin-bottom:14px;
    box-shadow:0 18px 40px rgba(0,69,61,.07);
  }

  .toolbar-actions{
    display:flex;
    align-items:center;
    gap:12px;
    flex-wrap:wrap;
    justify-content:flex-end;
  }

  .toolbar-actions select{min-width:180px;}

  .view-toggle{
    display:flex;
    gap:6px;
    background:#ecf7f3;
    border:1px solid #dbece7;
    padding:5px;
    border-radius:999px;
  }

  .view-toggle button{
    border:none;
    background:transparent;
    color:#006655;
    border-radius:999px;
    padding:9px 14px;
    font-weight:950;
    cursor:pointer;
  }

  .view-toggle button.active{
    background:#006655;
    color:#fff;
  }

  .active-chip-row{
    display:flex;
    flex-wrap:wrap;
    gap:8px;
    margin:0 0 14px;
  }

  .active-chip-row span{
    background:#fff4c8;
    color:#00453d;
    border:1px solid #ffdf74;
    border-radius:999px;
    padding:8px 12px;
    font-size:12px;
    font-weight:950;
  }

  .hotel-list-view{display:grid;gap:18px;}
  .hotel-grid-view{
    display:grid;
    grid-template-columns:repeat(2, minmax(0, 1fr));
    gap:18px;
  }

  .hotel-result-card{
    background:#fff;
    border:1px solid #dbece7;
    border-radius:28px;
    overflow:hidden;
    box-shadow:0 20px 48px rgba(0,69,61,.08);
  }

  .hotel-list-view .hotel-result-card{
    display:grid;
    grid-template-columns:310px 1fr;
  }

  .hotel-grid-view .hotel-result-card{display:block;}

  .hotel-card-image,.hotel-image-placeholder{
    width:100%;
    height:100%;
    min-height:245px;
    object-fit:cover;
    display:block;
  }

  .hotel-grid-view .hotel-card-image,.hotel-grid-view .hotel-image-placeholder{
    height:245px;
  }

  .hotel-image-placeholder{
    background:linear-gradient(135deg, #e6fff6, #fff4c8);
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:10px;
    color:#00453d;
    text-align:center;
    padding:24px;
  }

  .hotel-image-placeholder span{font-size:42px;}
  .hotel-image-placeholder strong{font-size:20px;}

  .hotel-card-content{
    padding:24px;
    display:flex;
    justify-content:space-between;
    gap:24px;
  }

  .hotel-grid-view .hotel-card-content{
    display:block;
  }

  .hotel-card-badges{
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    margin-bottom:12px;
  }

  .hotel-card-badges span{
    background:#ecf7f3;
    color:#006655;
    border-radius:999px;
    padding:7px 10px;
    font-size:12px;
    font-weight:950;
  }

  .hotel-card-badges .verified-badge{
    background:#dcfce7;
    color:#15803d;
  }

  .hotel-main-info h3{
    margin:0;
    font-size:28px;
    color:#00453d;
    letter-spacing:-.04em;
  }

  .hotel-location{
    color:#006655;
    font-weight:950;
    margin:10px 0 0;
  }

  .hotel-description{
    color:#536276;
    font-size:16px;
    line-height:1.65;
    max-width:650px;
  }

  .hotel-price-panel{
    min-width:190px;
    border-left:1px solid #e5efeb;
    padding-left:24px;
    text-align:right;
    display:flex;
    flex-direction:column;
    align-items:flex-end;
    justify-content:center;
  }

  .hotel-grid-view .hotel-price-panel{
    border-left:none;
    border-top:1px solid #e5efeb;
    padding-left:0;
    padding-top:18px;
    margin-top:18px;
    align-items:flex-start;
    text-align:left;
  }

  .hotel-price-panel span,.hotel-price-panel small{
    color:#6b788c;
    font-weight:750;
  }

  .hotel-price-panel strong{
    color:#102033;
    font-size:26px;
    margin:8px 0 2px;
  }

  .hotel-price-panel a{
    margin-top:18px;
    background:#006655;
    color:#ffffff;
    border-radius:16px;
    padding:13px 18px;
    font-weight:950;
    text-decoration:none;
    box-shadow:0 15px 30px rgba(0,102,85,.22);
  }

  .empty-result-card{
    background:#ffffff;
    border:1px solid #dbece7;
    border-radius:26px;
    padding:44px;
    text-align:center;
    color:#102033;
    box-shadow:0 18px 45px rgba(0,69,61,.08);
  }

  .empty-result-card h3{
    color:#00453d;
    margin:0 0 8px;
    font-size:25px;
  }

  .empty-result-card button{
    border:none;
    background:#006655;
    color:#fff;
    border-radius:999px;
    padding:12px 18px;
    font-weight:950;
    cursor:pointer;
    margin-top:12px;
  }

  @media (max-width: 1100px){
    .hotels-hero{grid-template-columns:1fr;padding:34px;}
    .hero-stats-grid{grid-template-columns:repeat(2, minmax(0,1fr));}
    .hotel-content-grid{grid-template-columns:1fr;}
    .hotel-filter-panel{position:static;}
  }

  @media (max-width: 760px){
    .hotels-page-shell{width:min(100% - 22px, 1480px);padding-top:16px;}
    .hotels-hero{border-radius:24px;padding:24px;}
    .hero-copy h1{font-size:44px;}
    .hero-stats-grid{grid-template-columns:1fr;}
    .hotel-list-view .hotel-result-card{grid-template-columns:1fr;}
    .hotel-grid-view{grid-template-columns:1fr;}
    .hotel-card-content{display:block;}
    .hotel-price-panel{border-left:none;border-top:1px solid #e5efeb;padding-left:0;padding-top:18px;margin-top:18px;align-items:flex-start;text-align:left;}
    .results-toolbar{align-items:flex-start;flex-direction:column;}
    .toolbar-actions{width:100%;justify-content:space-between;}
    .toolbar-actions select{flex:1;min-width:160px;}
  }
`;

export default HotelsPage;
