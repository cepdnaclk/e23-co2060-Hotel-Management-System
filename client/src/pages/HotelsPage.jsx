import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/api";

const PRICE_MIN = 0;
const PRICE_MAX = 50000;
const PRICE_GAP = 500;

const propertyTypes = ["Hotel", "Resort", "Villa", "Guesthouse"];

const safeLower = (value) => String(value || "").toLowerCase();

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString()}`;
};

function HotelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCityFromUrl = searchParams.get("city") || "";

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [cityFilter, setCityFilter] = useState(selectedCityFromUrl);
  const [districtFilter, setDistrictFilter] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [minPrice, setMinPrice] = useState(PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [availableRoomsOnly, setAvailableRoomsOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");
  const [viewMode, setViewMode] = useState("list");

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/properties");
      setProperties(response.data.data || []);
    } catch (loadError) {
      console.error("Load properties error:", loadError);
      setError("Unable to load verified hotels. Please check the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    setCityFilter(selectedCityFromUrl);
  }, [selectedCityFromUrl]);

  const verifiedProperties = useMemo(() => {
    return properties.filter((property) => Boolean(property.is_verified));
  }, [properties]);

  const availableCities = useMemo(() => {
    const cities = verifiedProperties.map((property) => property.city).filter(Boolean);
    return [...new Set(cities)].sort((a, b) => a.localeCompare(b));
  }, [verifiedProperties]);

  const availableDistricts = useMemo(() => {
    const districts = verifiedProperties
      .filter((property) => {
        if (!cityFilter) return true;
        return safeLower(property.city) === safeLower(cityFilter);
      })
      .map((property) => property.district)
      .filter(Boolean);

    return [...new Set(districts)].sort((a, b) => a.localeCompare(b));
  }, [verifiedProperties, cityFilter]);

  const cityCounts = useMemo(() => {
    return verifiedProperties.reduce((counts, property) => {
      const city = property.city || "Unknown";
      counts[city] = (counts[city] || 0) + 1;
      return counts;
    }, {});
  }, [verifiedProperties]);

  const typeCounts = useMemo(() => {
    return verifiedProperties.reduce((counts, property) => {
      const type = property.property_type || "Hotel";
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});
  }, [verifiedProperties]);

  const filteredProperties = useMemo(() => {
    const searched = searchText.trim().toLowerCase();

    const filtered = verifiedProperties.filter((property) => {
      const cityMatches =
        !cityFilter || safeLower(property.city) === safeLower(cityFilter);

      const districtMatches =
        !districtFilter ||
        safeLower(property.district) === safeLower(districtFilter);

      const typeMatches =
        !propertyTypeFilter ||
        safeLower(property.property_type) === safeLower(propertyTypeFilter);

      const price = Number(property.starting_price || 0);
      const priceMatches = price >= minPrice && price <= maxPrice;

      const searchMatches =
        !searched ||
        [
          property.name,
          property.city,
          property.district,
          property.address,
          property.description,
          property.property_type,
        ]
          .filter(Boolean)
          .some((item) => safeLower(item).includes(searched));

      const roomsMatches =
        !availableRoomsOnly || Number(property.total_rooms_count || 0) > 0;

      return (
        cityMatches &&
        districtMatches &&
        typeMatches &&
        priceMatches &&
        searchMatches &&
        roomsMatches
      );
    });

    return [...filtered].sort((a, b) => {
      const priceA = Number(a.starting_price || 0);
      const priceB = Number(b.starting_price || 0);
      const roomsA = Number(a.total_rooms_count || 0);
      const roomsB = Number(b.total_rooms_count || 0);
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      if (sortBy === "price-low") return priceA - priceB;
      if (sortBy === "price-high") return priceB - priceA;
      if (sortBy === "rooms") return roomsB - roomsA;
      if (sortBy === "newest") return dateB - dateA;

      return priceA - priceB;
    });
  }, [
    verifiedProperties,
    searchText,
    cityFilter,
    districtFilter,
    propertyTypeFilter,
    minPrice,
    maxPrice,
    availableRoomsOnly,
    sortBy,
  ]);

  const stats = useMemo(() => {
    const prices = verifiedProperties
      .map((property) => Number(property.starting_price || 0))
      .filter((price) => price > 0);

    const lowestPrice = prices.length ? Math.min(...prices) : 0;
    const destinations = new Set(
      verifiedProperties.map((property) => property.city).filter(Boolean)
    ).size;
    const totalRooms = verifiedProperties.reduce(
      (sum, property) => sum + Number(property.total_rooms_count || 0),
      0
    );

    return {
      totalHotels: verifiedProperties.length,
      destinations,
      totalRooms,
      lowestPrice,
    };
  }, [verifiedProperties]);

  const activeFilterCount = useMemo(() => {
    return [
      searchText.trim(),
      cityFilter,
      districtFilter,
      propertyTypeFilter,
      minPrice !== PRICE_MIN || maxPrice !== PRICE_MAX,
      availableRoomsOnly,
    ].filter(Boolean).length;
  }, [
    searchText,
    cityFilter,
    districtFilter,
    propertyTypeFilter,
    minPrice,
    maxPrice,
    availableRoomsOnly,
  ]);

  const handleCityChange = (cityName) => {
    setCityFilter(cityName);
    setDistrictFilter("");

    const params = new URLSearchParams(searchParams);

    if (cityName) {
      params.set("city", cityName);
    } else {
      params.delete("city");
    }

    setSearchParams(params);
  };

  const handleMinPriceChange = (event) => {
    const value = Number(event.target.value);

    if (value <= maxPrice - PRICE_GAP) {
      setMinPrice(value);
    }
  };

  const handleMaxPriceChange = (event) => {
    const value = Number(event.target.value);

    if (value >= minPrice + PRICE_GAP) {
      setMaxPrice(value);
    }
  };

  const handleMinPriceInputChange = (event) => {
    const value = Number(event.target.value);

    if (Number.isNaN(value)) return;

    const safeValue = Math.min(
      Math.max(value, PRICE_MIN),
      maxPrice - PRICE_GAP
    );

    setMinPrice(safeValue);
  };

  const handleMaxPriceInputChange = (event) => {
    const value = Number(event.target.value);

    if (Number.isNaN(value)) return;

    const safeValue = Math.max(
      Math.min(value, PRICE_MAX),
      minPrice + PRICE_GAP
    );

    setMaxPrice(safeValue);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setCityFilter("");
    setDistrictFilter("");
    setPropertyTypeFilter("");
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setAvailableRoomsOnly(false);
    setSortBy("recommended");
    setSearchParams({});
  };

  const minPercent = ((minPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const maxPercent = ((maxPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  return (
    <div className="hotels-page-shell">
      <style>{hotelPageCss}</style>

      <section className="hotels-hero">
        <div className="hotels-hero-content">
          <span className="eyebrow">TourismHub Stays</span>
          <h1>Find verified hotels for your Sri Lankan journey</h1>
          <p>
            Browse trusted verified stays, compare prices, filter by destination and pick
            a comfortable place near your next adventure.
          </p>

          <div className="hero-search-card">
            <span className="hero-search-icon">🔎</span>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search hotels, destinations, districts or property type..."
            />
            {searchText && (
              <button type="button" onClick={() => setSearchText("")}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="hero-stats-card">
          <div>
            <strong>{stats.totalHotels}</strong>
            <span>Verified stays</span>
          </div>
          <div>
            <strong>{stats.destinations}</strong>
            <span>Destinations</span>
          </div>
          <div>
            <strong>{stats.totalRooms}</strong>
            <span>Listed rooms</span>
          </div>
          <div>
            <strong>{stats.lowestPrice ? formatMoney(stats.lowestPrice) : "—"}</strong>
            <span>Lowest start</span>
          </div>
        </div>
      </section>

      <main className="hotels-page-content">
        <div className="hotels-toolbar">
          <div>
            <span className="toolbar-kicker">Verified Hotels</span>
            <h2>
              {cityFilter ? (
                <>
                  Stays in <span>{cityFilter}</span>
                </>
              ) : (
                "All verified places to stay"
              )}
            </h2>
            <p>
              Showing {filteredProperties.length} of {verifiedProperties.length} verified
              properties. {activeFilterCount > 0 && `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active.`}
            </p>
          </div>

          <div className="toolbar-actions">
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rooms">Most rooms</option>
              <option value="newest">Newest first</option>
            </select>

            <div className="view-toggle" aria-label="Select view mode">
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

            <Link to="/" className="soft-link">
              Back to Home
            </Link>
          </div>
        </div>

        <div className="hotels-layout">
          <aside className="hotels-filter-card">
            <div className="filter-card-head">
              <div>
                <span>Smart Filters</span>
                <h3>Refine stays</h3>
              </div>

              <button type="button" onClick={handleClearFilters}>
                Clear all
              </button>
            </div>

            <div className="filter-section">
              <label>Search</label>
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Hotel name or place"
              />
            </div>

            <div className="filter-section">
              <label>Destination</label>
              <button
                type="button"
                onClick={() => handleCityChange("")}
                className={cityFilter === "" ? "filter-chip active" : "filter-chip"}
              >
                <span>All Destinations</span>
                <small>{verifiedProperties.length}</small>
              </button>

              <div className="scroll-chip-list">
                {availableCities.map((city) => (
                  <button
                    type="button"
                    key={city}
                    onClick={() => handleCityChange(city)}
                    className={
                      safeLower(cityFilter) === safeLower(city)
                        ? "filter-chip active"
                        : "filter-chip"
                    }
                  >
                    <span>{city}</span>
                    <small>{cityCounts[city] || 0}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section two-inputs">
              <div>
                <label>District</label>
                <select
                  value={districtFilter}
                  onChange={(event) => setDistrictFilter(event.target.value)}
                >
                  <option value="">All districts</option>
                  {availableDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Sort</label>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="recommended">Best match</option>
                  <option value="price-low">Lowest price</option>
                  <option value="price-high">Highest price</option>
                  <option value="rooms">Most rooms</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            <div className="filter-section">
              <label>Price range</label>
              <div className="price-card">
                <div className="price-row">
                  <strong>{formatMoney(minPrice)}</strong>
                  <strong>{formatMoney(maxPrice)}</strong>
                </div>

                <div className="slider-wrapper">
                  <div className="slider-track" />
                  <div
                    className="slider-range"
                    style={{
                      left: `calc(${minPercent}% + ${12 - (minPercent * 24) / 100}px)`,
                      right: `calc(${100 - maxPercent}% + ${12 - ((100 - maxPercent) * 24) / 100}px)`,
                    }}
                  />

                  <input
                    className="range-thumb min-thumb"
                    type="range"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    value={minPrice}
                    step="500"
                    onChange={handleMinPriceChange}
                    aria-label="Minimum price"
                  />

                  <input
                    className="range-thumb max-thumb"
                    type="range"
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    value={maxPrice}
                    step="500"
                    onChange={handleMaxPriceChange}
                    aria-label="Maximum price"
                  />
                </div>


                <div className="price-limit-row">
                  <span>{formatMoney(PRICE_MIN)}</span>
                  <span>{formatMoney(PRICE_MAX)}</span>
                </div>
              </div>
            </div>

            <div className="filter-section">
              <label>Property type</label>
              <div className="type-grid">
                <button
                  type="button"
                  onClick={() => setPropertyTypeFilter("")}
                  className={propertyTypeFilter === "" ? "type-option active" : "type-option"}
                >
                  <span>🏡</span>
                  <strong>All</strong>
                  <small>{verifiedProperties.length}</small>
                </button>

                {propertyTypes.map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setPropertyTypeFilter(type)}
                    className={propertyTypeFilter === type ? "type-option active" : "type-option"}
                  >
                    <span>{type === "Hotel" ? "🏨" : type === "Resort" ? "🌴" : type === "Villa" ? "🏘️" : "🛏️"}</span>
                    <strong>{type}</strong>
                    <small>{typeCounts[type] || 0}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <label>Quick filters</label>
              <button
                type="button"
                className={availableRoomsOnly ? "toggle-row active" : "toggle-row"}
                onClick={() => setAvailableRoomsOnly((current) => !current)}
              >
                <span>🛌 Has room listings</span>
                <strong>{availableRoomsOnly ? "On" : "Off"}</strong>
              </button>
            </div>
          </aside>

          <section className="hotel-results-section">
            {error && <div className="hotel-alert error">{error}</div>}

            {activeFilterCount > 0 && (
              <div className="active-filter-bar">
                <span>Active filters</span>
                {searchText.trim() && <button onClick={() => setSearchText("")}>Search: {searchText}</button>}
                {cityFilter && <button onClick={() => handleCityChange("")}>City: {cityFilter}</button>}
                {districtFilter && <button onClick={() => setDistrictFilter("")}>District: {districtFilter}</button>}
                {propertyTypeFilter && <button onClick={() => setPropertyTypeFilter("")}>Type: {propertyTypeFilter}</button>}
                {(minPrice !== PRICE_MIN || maxPrice !== PRICE_MAX) && (
                  <button
                    onClick={() => {
                      setMinPrice(PRICE_MIN);
                      setMaxPrice(PRICE_MAX);
                    }}
                  >
                    Price: {formatMoney(minPrice)} - {formatMoney(maxPrice)}
                  </button>
                )}
                {availableRoomsOnly && <button onClick={() => setAvailableRoomsOnly(false)}>Rooms listed</button>}
              </div>
            )}

            {loading ? (
              <div className="hotel-empty-card loading-card">
                <span className="loading-orb" />
                <h3>Loading verified hotels...</h3>
                <p>Please wait while we collect verified properties.</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="hotel-empty-card">
                <span>🏨</span>
                <h3>No verified hotels found</h3>
                <p>
                  No hotels match the selected filters. Try clearing filters or
                  choosing another destination.
                </p>
                <button type="button" onClick={handleClearFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "hotel-grid" : "hotel-list"}>
                {filteredProperties.map((property) => (
                  <article className="hotel-card" key={property.id}>
                    <div className="hotel-image-wrap">
                      <img
                        src={
                          property.main_image ||
                          property.logo_url ||
                          "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80"
                        }
                        alt={property.name}
                      />

                      <div className="image-gradient" />

                      <div className="hotel-card-badges">
                        <span>{property.property_type || "Hotel"}</span>
                        <span>Verified</span>
                      </div>
                    </div>

                    <div className="hotel-card-body">
                      <div className="hotel-main-info">
                        <div className="hotel-location-line">
                          <span>📍 {property.city}</span>
                          {property.district && <span>{property.district}</span>}
                        </div>

                        <h3>{property.name}</h3>

                        <p>
                          {property.description ||
                            "A verified TourismHub LK property ready for your stay."}
                        </p>

                        <div className="hotel-meta-row">
                          <span>🛌 {Number(property.total_rooms_count || 0)} rooms</span>
                          <span>🌿 {property.plan_type || "standard"} listing</span>
                          <span>🛡️ Verified stay</span>
                        </div>
                      </div>

                      <div className="hotel-book-box">
                        <span>Starting from</span>
                        <strong>{formatMoney(property.starting_price)}</strong>
                        <small>per night</small>

                        <Link to={`/hotels/${property.id}`}>View Details</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

const hotelPageCss = `
  .hotels-page-shell {
    min-height: calc(100vh - 69px);
    background:
      radial-gradient(circle at 7% 8%, rgba(20, 184, 166, 0.14), transparent 28rem),
      radial-gradient(circle at 90% 15%, rgba(217, 154, 20, 0.12), transparent 26rem),
      linear-gradient(135deg, #f8f4ea 0%, #ffffff 48%, #eefdfa 100%);
    color: #13263a;
  }

  .hotels-hero {
    width: min(1440px, calc(100% - 48px));
    margin: 0 auto;
    padding: 54px 0 32px;
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 26px;
    align-items: stretch;
  }

  .hotels-hero-content {
    position: relative;
    overflow: hidden;
    min-height: 280px;
    border-radius: 34px;
    padding: 42px;
    background:
      linear-gradient(90deg, rgba(3, 73, 67, 0.94), rgba(8, 117, 104, 0.82)),
      url("https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80") center/cover;
    box-shadow: 0 28px 70px rgba(3, 73, 67, 0.2);
    color: #ffffff;
  }

  .hotels-hero-content::after {
    content: "";
    position: absolute;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    right: -70px;
    bottom: -90px;
    background: rgba(246, 196, 83, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }

  .eyebrow,
  .toolbar-kicker {
    display: inline-flex;
    align-items: center;
    color: #f6c453;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  .hotels-hero h1 {
    position: relative;
    z-index: 1;
    max-width: 820px;
    margin: 12px 0 14px;
    font-size: clamp(34px, 5vw, 64px);
    line-height: 0.98;
    letter-spacing: -0.06em;
  }

  .hotels-hero p {
    position: relative;
    z-index: 1;
    max-width: 760px;
    margin: 0;
    color: rgba(255, 255, 255, 0.84);
    font-size: 17px;
    line-height: 1.75;
  }

  .hero-search-card {
    position: relative;
    z-index: 2;
    max-width: 760px;
    margin-top: 28px;
    padding: 10px 10px 10px 18px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
  }

  .hero-search-icon {
    font-size: 18px;
  }

  .hero-search-card input,
  .filter-section input,
  .filter-section select,
  .toolbar-actions select {
    width: 100%;
    border: 1px solid #d8e5df;
    outline: none;
    border-radius: 16px;
    padding: 13px 14px;
    color: #102033;
    background: #ffffff;
    font-size: 14px;
    font-weight: 750;
  }

  .hero-search-card input {
    border: none;
    padding: 12px 6px;
    font-size: 15px;
  }

  .hero-search-card button,
  .soft-link,
  .hotel-empty-card button {
    border: none;
    border-radius: 999px;
    background: #064e45;
    color: #ffffff;
    padding: 11px 16px;
    font-weight: 900;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
  }

  .hero-stats-card {
    border-radius: 34px;
    padding: 26px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(8, 117, 104, 0.15);
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
    display: grid;
    gap: 14px;
  }

  .hero-stats-card div {
    padding: 18px;
    border-radius: 24px;
    background: linear-gradient(135deg, #f0fdfa, #ffffff);
    border: 1px solid #d7eee8;
  }

  .hero-stats-card strong {
    display: block;
    color: #064e45;
    font-size: 28px;
    line-height: 1;
    font-weight: 950;
    letter-spacing: -0.04em;
  }

  .hero-stats-card span {
    display: block;
    margin-top: 7px;
    color: #667085;
    font-weight: 850;
    font-size: 13px;
  }

  .hotels-page-content {
    width: min(1440px, calc(100% - 48px));
    margin: 0 auto;
    padding: 0 0 54px;
  }

  .hotels-toolbar {
    margin-bottom: 22px;
    padding: 20px;
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(8, 117, 104, 0.12);
    box-shadow: 0 18px 55px rgba(15, 23, 42, 0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
  }

  .hotels-toolbar h2 {
    margin: 8px 0 4px;
    color: #102033;
    font-size: 28px;
    letter-spacing: -0.04em;
  }

  .hotels-toolbar h2 span {
    color: #087568;
  }

  .hotels-toolbar p {
    margin: 0;
    color: #667085;
    font-weight: 700;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .toolbar-actions select {
    min-width: 180px;
    border-radius: 999px;
  }

  .view-toggle {
    padding: 5px;
    display: inline-flex;
    border-radius: 999px;
    background: #ecfdf7;
    border: 1px solid #cfebe4;
  }

  .view-toggle button {
    border: none;
    border-radius: 999px;
    padding: 10px 14px;
    background: transparent;
    color: #064e45;
    font-weight: 900;
    cursor: pointer;
  }

  .view-toggle button.active {
    background: #064e45;
    color: #ffffff;
  }

  .hotels-layout {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 24px;
    align-items: start;
  }

  .hotels-filter-card,
  .hotel-empty-card,
  .hotel-card,
  .active-filter-bar,
  .hotel-alert {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(8, 117, 104, 0.14);
    box-shadow: 0 18px 55px rgba(15, 23, 42, 0.07);
  }

  .hotels-filter-card {
    position: sticky;
    top: 92px;
    border-radius: 30px;
    padding: 22px;
  }

  .filter-card-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: start;
    margin-bottom: 18px;
  }

  .filter-card-head span {
    color: #d99a14;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-weight: 950;
  }

  .filter-card-head h3 {
    margin: 4px 0 0;
    color: #064e45;
    font-size: 25px;
    letter-spacing: -0.04em;
  }

  .filter-card-head button {
    border: none;
    border-radius: 999px;
    background: #fff1f2;
    color: #be123c;
    padding: 9px 12px;
    font-weight: 950;
    cursor: pointer;
  }

  .filter-section {
    padding: 18px 0;
    border-top: 1px solid #e4eee9;
  }

  .filter-section label {
    display: block;
    margin-bottom: 10px;
    color: #102033;
    font-weight: 950;
  }

  .filter-chip {
    width: 100%;
    border: 1px solid #d8e5df;
    border-radius: 16px;
    background: #f8fbf8;
    color: #39485d;
    padding: 12px 13px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-weight: 850;
    text-align: left;
  }

  .filter-chip small {
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(8, 117, 104, 0.09);
    color: #087568;
    font-weight: 950;
  }

  .filter-chip.active,
  .type-option.active,
  .toggle-row.active {
    background: linear-gradient(135deg, #064e45, #087568);
    color: #ffffff;
    border-color: #064e45;
    box-shadow: 0 14px 34px rgba(6, 78, 69, 0.2);
  }

  .filter-chip.active small {
    background: rgba(255, 255, 255, 0.16);
    color: #ffffff;
  }

  .scroll-chip-list {
    max-height: 190px;
    overflow: auto;
    padding-right: 2px;
  }

  .two-inputs {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .price-card {
    border-radius: 24px;
    padding: 22px 24px 20px;
    background: #f9fbfc;
    border: 1px solid #dfe8e6;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
  }

  .price-row,
  .price-limit-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .price-row strong {
    color: #102033;
    font-size: 18px;
    font-weight: 950;
  }

  .price-limit-row {
    margin-top: 0;
    color: #667085;
    font-size: 15px;
    font-weight: 950;
  }

  .slider-wrapper {
    position: relative;
    height: 64px;
    margin: 2px 0 0;
    padding: 0 21px;
  }

  .slider-track,
  .slider-range {
    position: absolute;
    top: 31px;
    height: 9px;
    border-radius: 999px;
  }

  .slider-track {
    left: 21px;
    right: 21px;
    z-index: 1;
    background: #e7edf2;
    box-shadow: inset 0 1px 3px rgba(15, 23, 42, 0.1);
  }

  .slider-range {
    z-index: 2;
    background: #8b5cf6;
    box-shadow: 0 8px 18px rgba(139, 92, 246, 0.22);
  }

  .filter-section input.range-thumb {
    position: absolute;
    top: 20px;
    left: 21px;
    z-index: 3;
    width: calc(100% - 42px);
    height: 32px;
    margin: 0;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    pointer-events: none;
    appearance: none;
    -webkit-appearance: none;
    outline: none;
  }

  .filter-section input.range-thumb:focus {
    outline: none;
    box-shadow: none !important;
  }

  .filter-section input.min-thumb {
    z-index: 5;
  }

  .filter-section input.max-thumb {
    z-index: 4;
  }

  .filter-section input.range-thumb::-webkit-slider-thumb {
    pointer-events: auto;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #11a4df;
    border: 0;
    box-shadow: 0 8px 22px rgba(17, 164, 223, 0.32);
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }

  .filter-section input.range-thumb::-moz-range-thumb {
    pointer-events: auto;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #11a4df;
    border: 0;
    box-shadow: 0 8px 22px rgba(17, 164, 223, 0.32);
    cursor: pointer;
  }

  .filter-section input.range-thumb::-webkit-slider-runnable-track {
    height: 9px;
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  .filter-section input.range-thumb::-moz-range-track {
    height: 9px;
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  .filter-section input.range-thumb::-moz-range-progress {
    background: transparent !important;
    border: 0 !important;
  }

  .type-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 9px;
  }

  .type-option {
    min-height: 92px;
    border: 1px solid #d8e5df;
    border-radius: 18px;
    background: #f8fbf8;
    color: #102033;
    padding: 12px;
    text-align: left;
    cursor: pointer;
  }

  .type-option span,
  .type-option strong,
  .type-option small {
    display: block;
  }

  .type-option span {
    font-size: 19px;
  }

  .type-option strong {
    margin-top: 6px;
    font-size: 13px;
  }

  .type-option small {
    margin-top: 3px;
    opacity: 0.8;
    font-weight: 850;
  }

  .toggle-row {
    width: 100%;
    margin-bottom: 8px;
    border: 1px solid #d8e5df;
    border-radius: 16px;
    background: #f8fbf8;
    color: #102033;
    padding: 13px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    text-align: left;
    font-weight: 850;
  }

  .hotel-results-section {
    min-width: 0;
  }

  .hotel-alert,
  .active-filter-bar {
    border-radius: 22px;
    padding: 14px 16px;
    margin-bottom: 16px;
  }

  .hotel-alert.error {
    background: #fff1f2;
    color: #be123c;
    border-color: #fecdd3;
    font-weight: 900;
  }

  .active-filter-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .active-filter-bar span {
    color: #667085;
    font-size: 12px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .active-filter-bar button {
    border: none;
    border-radius: 999px;
    background: #ecfdf7;
    color: #064e45;
    padding: 8px 11px;
    font-weight: 900;
    cursor: pointer;
  }

  .hotel-list {
    display: grid;
    gap: 18px;
  }

  .hotel-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .hotel-card {
    position: relative;
    overflow: hidden;
    border-radius: 30px;
    display: grid;
    grid-template-columns: 320px 1fr;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }

  .hotel-grid .hotel-card {
    grid-template-columns: 1fr;
  }

  .hotel-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 28px 70px rgba(6, 78, 69, 0.15);
  }

  .hotel-image-wrap {
    position: relative;
    min-height: 265px;
    overflow: hidden;
    background: #dbeee9;
  }

  .hotel-grid .hotel-image-wrap {
    min-height: 230px;
  }

  .hotel-image-wrap img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform 0.35s ease;
  }

  .hotel-card:hover .hotel-image-wrap img {
    transform: scale(1.05);
  }

  .image-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.03), rgba(3, 73, 67, 0.35));
  }

  .hotel-card-badges {
    position: absolute;
    top: 16px;
    left: 16px;
    right: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .hotel-card-badges span {
    border-radius: 999px;
    padding: 8px 11px;
    background: rgba(255, 255, 255, 0.93);
    color: #064e45;
    font-size: 12px;
    font-weight: 950;
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.1);
  }

  .hotel-card-body {
    padding: 28px;
    display: grid;
    grid-template-columns: 1fr 180px;
    gap: 20px;
    align-items: stretch;
  }

  .hotel-grid .hotel-card-body {
    grid-template-columns: 1fr;
  }

  .hotel-location-line {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    color: #087568;
    font-size: 13px;
    font-weight: 950;
  }

  .hotel-location-line span:last-child:not(:first-child) {
    color: #667085;
  }

  .hotel-main-info h3 {
    margin: 10px 0 10px;
    color: #102033;
    font-size: 27px;
    line-height: 1.1;
    letter-spacing: -0.04em;
  }

  .hotel-main-info p {
    margin: 0;
    color: #667085;
    line-height: 1.65;
    font-weight: 650;
  }

  .hotel-meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 18px;
  }

  .hotel-meta-row span {
    border-radius: 999px;
    padding: 8px 10px;
    background: #f4faf7;
    border: 1px solid #d7eee8;
    color: #064e45;
    font-size: 12px;
    font-weight: 950;
    text-transform: capitalize;
  }

  .hotel-book-box {
    min-width: 170px;
    padding: 20px;
    border-radius: 24px;
    background: linear-gradient(180deg, #f7fbf8, #ffffff);
    border: 1px solid #d7eee8;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 8px;
    text-align: right;
  }

  .hotel-grid .hotel-book-box {
    align-items: flex-start;
    text-align: left;
  }

  .hotel-book-box span,
  .hotel-book-box small {
    color: #667085;
    font-weight: 750;
  }

  .hotel-book-box strong {
    color: #064e45;
    font-size: 24px;
    letter-spacing: -0.04em;
  }

  .hotel-book-box a {
    width: 100%;
    display: inline-flex;
    justify-content: center;
    margin-top: 10px;
    border-radius: 16px;
    padding: 13px 16px;
    background: #064e45;
    color: #ffffff;
    font-weight: 950;
    text-decoration: none;
    box-shadow: 0 16px 34px rgba(6, 78, 69, 0.22);
  }

  .hotel-empty-card {
    border-radius: 30px;
    padding: 48px 28px;
    text-align: center;
  }

  .hotel-empty-card > span {
    display: inline-flex;
    margin-bottom: 12px;
    font-size: 38px;
  }

  .hotel-empty-card h3 {
    margin: 0 0 8px;
    color: #064e45;
    font-size: 26px;
  }

  .hotel-empty-card p {
    margin: 0 auto 18px;
    max-width: 520px;
    color: #667085;
    line-height: 1.6;
  }

  .loading-card {
    min-height: 260px;
  }

  .loading-orb {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 5px solid #d7eee8;
    border-top-color: #087568;
    animation: hotelSpin 0.9s linear infinite;
  }

  @keyframes hotelSpin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1180px) {
    .hotels-hero,
    .hotels-layout {
      grid-template-columns: 1fr;
    }

    .hotels-filter-card {
      position: static;
    }

    .hotel-card {
      grid-template-columns: 270px 1fr;
    }
  }

  @media (max-width: 840px) {
    .hotels-hero,
    .hotels-page-content {
      width: min(100% - 28px, 1440px);
    }

    .hotels-hero-content {
      padding: 30px 22px;
      border-radius: 28px;
    }

    .hero-search-card {
      grid-template-columns: auto 1fr;
      border-radius: 22px;
    }

    .hero-search-card button {
      grid-column: 1 / -1;
    }

    .hotels-toolbar {
      align-items: stretch;
      flex-direction: column;
    }

    .toolbar-actions {
      justify-content: flex-start;
    }

    .hotel-card,
    .hotel-card-body {
      grid-template-columns: 1fr;
    }

    .hotel-image-wrap {
      min-height: 230px;
    }

    .hotel-book-box {
      align-items: flex-start;
      text-align: left;
    }

    .hotel-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default HotelsPage;
