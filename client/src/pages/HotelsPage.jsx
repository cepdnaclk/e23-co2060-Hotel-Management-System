import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/api";

const PRICE_LIMIT_MIN = 0;
const PRICE_LIMIT_MAX = 50000;
const PRICE_GAP = 500;

const fallbackHotelImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
];

function formatMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getStartingPrice(property) {
  return Number(property?.starting_price || 0);
}

function getRoomCount(property) {
  return Number(property?.total_rooms_count || 0);
}

function getImageUrl(property) {
  if (property?.main_image) return property.main_image;

  const index = Number(property?.id || 0) % fallbackHotelImages.length;
  return fallbackHotelImages[index];
}

function getTypeLabel(type) {
  return type || "Stay";
}

function buildAmenityPills(property) {
  const description = normalizeText(property?.description);
  const name = normalizeText(property?.name);
  const text = `${description} ${name}`;
  const pills = [];

  if (text.includes("lake")) pills.push("Lake view");
  if (text.includes("mountain") || text.includes("hill")) pills.push("Mountain view");
  if (text.includes("beach") || text.includes("ocean")) pills.push("Beach access");
  if (text.includes("pool")) pills.push("Pool");
  if (text.includes("family")) pills.push("Family friendly");
  if (text.includes("business")) pills.push("Business stay");
  if (text.includes("cultural") || text.includes("attraction")) pills.push("Near attractions");

  if (getRoomCount(property) > 0) pills.push(`${getRoomCount(property)} rooms`);
  if (pills.length === 0) pills.push("Trusted stay", "Sri Lankan hospitality");

  return pills.slice(0, 4);
}

function PriceRangeSlider({ minPrice, maxPrice, onMinChange, onMaxChange }) {
  const minPercent =
    ((minPrice - PRICE_LIMIT_MIN) / (PRICE_LIMIT_MAX - PRICE_LIMIT_MIN)) * 100;
  const maxPercent =
    ((maxPrice - PRICE_LIMIT_MIN) / (PRICE_LIMIT_MAX - PRICE_LIMIT_MIN)) * 100;

  return (
    <div className="hotel-price-card">
      <div className="hotel-price-values">
        <span>{formatMoney(minPrice)}</span>
        <span>{formatMoney(maxPrice)}</span>
      </div>

      <div className="hotel-price-range">
        <div className="hotel-price-track" />
        <div
          className="hotel-price-fill"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          type="range"
          min={PRICE_LIMIT_MIN}
          max={PRICE_LIMIT_MAX}
          value={minPrice}
          step="500"
          onChange={(event) => onMinChange(Number(event.target.value))}
          aria-label="Minimum hotel price"
          style={{ zIndex: minPrice > PRICE_LIMIT_MAX - 8000 ? 8 : 6 }}
        />
        <input
          type="range"
          min={PRICE_LIMIT_MIN}
          max={PRICE_LIMIT_MAX}
          value={maxPrice}
          step="500"
          onChange={(event) => onMaxChange(Number(event.target.value))}
          aria-label="Maximum hotel price"
          style={{ zIndex: 7 }}
        />
      </div>

      <div className="hotel-price-limits">
        <span>{formatMoney(PRICE_LIMIT_MIN)}</span>
        <span>{formatMoney(PRICE_LIMIT_MAX)}</span>
      </div>
    </div>
  );
}

function HotelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCityFromUrl = searchParams.get("city") || "";
  const selectedSearchFromUrl = searchParams.get("search") || "";

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [cityFilter, setCityFilter] = useState(selectedCityFromUrl);
  const [districtFilter, setDistrictFilter] = useState("");
  const [searchText, setSearchText] = useState(selectedSearchFromUrl);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [budgetPreset, setBudgetPreset] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [viewMode, setViewMode] = useState("list");

  const [minPrice, setMinPrice] = useState(PRICE_LIMIT_MIN);
  const [maxPrice, setMaxPrice] = useState(PRICE_LIMIT_MAX);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/properties");
      setProperties(response.data.data || []);
    } catch (error) {
      console.error("Load properties error:", error);
      setErrorMessage("Could not load hotels. Please check the backend server and try again.");
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

  useEffect(() => {
    setSearchText(selectedSearchFromUrl);
  }, [selectedSearchFromUrl]);

  const approvedProperties = useMemo(() => {
    return properties.filter((property) => {
      const status = normalizeText(property.status || "approved");
      return status === "approved";
    });
  }, [properties]);

  const availableCities = useMemo(() => {
    const cities = approvedProperties.map((property) => property.city).filter(Boolean);
    return [...new Set(cities)].sort((a, b) => a.localeCompare(b));
  }, [approvedProperties]);

  const availableDistricts = useMemo(() => {
    const districts = approvedProperties
      .map((property) => property.district)
      .filter(Boolean);
    return [...new Set(districts)].sort((a, b) => a.localeCompare(b));
  }, [approvedProperties]);

  const availableTypes = useMemo(() => {
    const types = approvedProperties
      .map((property) => property.property_type)
      .filter(Boolean);
    return [...new Set(types)].sort((a, b) => a.localeCompare(b));
  }, [approvedProperties]);

  const stats = useMemo(() => {
    const prices = approvedProperties.map(getStartingPrice).filter((price) => price > 0);
    const lowestPrice = prices.length ? Math.min(...prices) : 0;
    const destinationCount = availableCities.length;
    const roomCount = approvedProperties.reduce((total, property) => total + getRoomCount(property), 0);

    return { lowestPrice, destinationCount, roomCount };
  }, [approvedProperties, availableCities.length]);

  const filteredProperties = useMemo(() => {
    const query = normalizeText(searchText);

    const filtered = approvedProperties.filter((property) => {
      const searchMatches =
        !query ||
        [
          property.name,
          property.city,
          property.district,
          property.address,
          property.description,
          property.property_type,
          property.quote,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const cityMatches =
        !cityFilter || normalizeText(property.city) === normalizeText(cityFilter);

      const districtMatches =
        !districtFilter || normalizeText(property.district) === normalizeText(districtFilter);

      const typeMatches =
        !propertyTypeFilter ||
        normalizeText(property.property_type) === normalizeText(propertyTypeFilter);

      const price = getStartingPrice(property);
      const priceMatches = price >= minPrice && price <= maxPrice;

      const hasRooms = getRoomCount(property) > 0;
      const roomMatches = roomFilter === "all" || (roomFilter === "rooms" && hasRooms);

      return (
        searchMatches &&
        cityMatches &&
        districtMatches &&
        typeMatches &&
        priceMatches &&
        roomMatches
      );
    });

    return filtered.sort((a, b) => {
      const priceA = getStartingPrice(a);
      const priceB = getStartingPrice(b);
      const roomsA = getRoomCount(a);
      const roomsB = getRoomCount(b);

      if (sortBy === "price_low") return priceA - priceB;
      if (sortBy === "price_high") return priceB - priceA;
      if (sortBy === "rooms") return roomsB - roomsA;
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      if (sortBy === "newest") return new Date(b.created_at || 0) - new Date(a.created_at || 0);

      return roomsB - roomsA || priceA - priceB;
    });
  }, [
    approvedProperties,
    searchText,
    cityFilter,
    districtFilter,
    propertyTypeFilter,
    minPrice,
    maxPrice,
    roomFilter,
    sortBy,
  ]);

  const updateUrlFilters = ({ city = cityFilter, search = searchText } = {}) => {
    const params = new URLSearchParams(searchParams);

    if (city) params.set("city", city);
    else params.delete("city");

    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");

    setSearchParams(params);
  };

  const handleCityChange = (cityName) => {
    setCityFilter(cityName);
    updateUrlFilters({ city: cityName });
  };

  const handleSearchChange = (value) => {
    setSearchText(value);
    updateUrlFilters({ search: value });
  };

  const handleMinPriceChange = (value) => {
    const nextValue = Math.min(value, maxPrice - PRICE_GAP);
    setMinPrice(Math.max(PRICE_LIMIT_MIN, nextValue));
    setBudgetPreset("custom");
  };

  const handleMaxPriceChange = (value) => {
    const nextValue = Math.max(value, minPrice + PRICE_GAP);
    setMaxPrice(Math.min(PRICE_LIMIT_MAX, nextValue));
    setBudgetPreset("custom");
  };

  const applyBudgetPreset = (preset) => {
    setBudgetPreset(preset);

    if (preset === "budget") {
      setMinPrice(0);
      setMaxPrice(12000);
    } else if (preset === "comfort") {
      setMinPrice(12000);
      setMaxPrice(25000);
    } else if (preset === "premium") {
      setMinPrice(25000);
      setMaxPrice(50000);
    } else {
      setMinPrice(PRICE_LIMIT_MIN);
      setMaxPrice(PRICE_LIMIT_MAX);
    }
  };

  const handleClearFilters = () => {
    setCityFilter("");
    setDistrictFilter("");
    setSearchText("");
    setPropertyTypeFilter("");
    setRoomFilter("all");
    setBudgetPreset("all");
    setSortBy("recommended");
    setMinPrice(PRICE_LIMIT_MIN);
    setMaxPrice(PRICE_LIMIT_MAX);
    setSearchParams({});
  };

  const activeChips = [
    searchText && { label: `Search: ${searchText}`, clear: () => handleSearchChange("") },
    cityFilter && { label: `City: ${cityFilter}`, clear: () => handleCityChange("") },
    districtFilter && { label: `District: ${districtFilter}`, clear: () => setDistrictFilter("") },
    propertyTypeFilter && { label: `Type: ${propertyTypeFilter}`, clear: () => setPropertyTypeFilter("") },
    roomFilter === "rooms" && { label: "Has rooms", clear: () => setRoomFilter("all") },
    (minPrice !== PRICE_LIMIT_MIN || maxPrice !== PRICE_LIMIT_MAX) && {
      label: `${formatMoney(minPrice)} - ${formatMoney(maxPrice)}`,
      clear: () => {
        setMinPrice(PRICE_LIMIT_MIN);
        setMaxPrice(PRICE_LIMIT_MAX);
        setBudgetPreset("all");
      },
    },
  ].filter(Boolean);

  return (
    <div className="hotels-page">
      <style>{hotelsPageCss}</style>

      <section className="hotels-hero-section">
        <div className="hotels-hero-content">
          <div className="hotels-eyebrow">Trusted stays across Sri Lanka</div>
          <h1>Find the right hotel for your journey</h1>
          <p>
            Browse admin-approved stays, compare destinations, filter by price and
            room availability, then open the hotel profile when you are ready to book.
          </p>

          <div className="hotels-hero-search">
            <span aria-hidden="true">🔎</span>
            <input
              type="text"
              value={searchText}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search by hotel, city, district, address or type..."
            />
            {searchText && (
              <button type="button" onClick={() => handleSearchChange("")}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="hotels-hero-stats">
          <div>
            <strong>{approvedProperties.length}</strong>
            <span>approved stays</span>
          </div>
          <div>
            <strong>{stats.destinationCount}</strong>
            <span>destinations</span>
          </div>
          <div>
            <strong>{stats.lowestPrice ? formatMoney(stats.lowestPrice) : "Rs. 0"}</strong>
            <span>lowest start price</span>
          </div>
          <div>
            <strong>{stats.roomCount}</strong>
            <span>listed rooms</span>
          </div>
        </div>
      </section>

      <section className="hotels-toolbar">
        <div>
          <span className="toolbar-kicker">Hotel finder</span>
          <h2>{filteredProperties.length} stays match your filters</h2>
        </div>

        <div className="toolbar-actions">
          <label>
            Sort
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="recommended">Recommended</option>
              <option value="price_low">Lowest price</option>
              <option value="price_high">Highest price</option>
              <option value="rooms">Most rooms</option>
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
            </select>
          </label>

          <div className="view-toggle" aria-label="Change hotel result view">
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
      </section>

      <div className="hotels-layout">
        <aside className="hotels-filter-panel">
          <div className="filter-panel-head">
            <div>
              <span>Advanced filters</span>
              <h3>Refine your stay</h3>
            </div>
            <button type="button" onClick={handleClearFilters}>
              Reset
            </button>
          </div>

          <div className="filter-block">
            <label>Destination</label>
            <div className="filter-option-grid">
              <button
                type="button"
                className={!cityFilter ? "selected" : ""}
                onClick={() => handleCityChange("")}
              >
                All cities
                <small>{approvedProperties.length}</small>
              </button>
              {availableCities.map((city) => {
                const count = approvedProperties.filter(
                  (property) => normalizeText(property.city) === normalizeText(city)
                ).length;
                return (
                  <button
                    type="button"
                    key={city}
                    className={normalizeText(cityFilter) === normalizeText(city) ? "selected" : ""}
                    onClick={() => handleCityChange(city)}
                  >
                    {city}
                    <small>{count}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-block">
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

          <div className="filter-block">
            <label>Stay type</label>
            <div className="type-card-grid">
              <button
                type="button"
                className={!propertyTypeFilter ? "selected" : ""}
                onClick={() => setPropertyTypeFilter("")}
              >
                <span>🏨</span>
                All types
              </button>
              {availableTypes.map((type) => (
                <button
                  type="button"
                  key={type}
                  className={propertyTypeFilter === type ? "selected" : ""}
                  onClick={() => setPropertyTypeFilter(type)}
                >
                  <span>{type.toLowerCase().includes("villa") ? "🏡" : type.toLowerCase().includes("resort") ? "🌊" : "🏨"}</span>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <label>Price range</label>
            <PriceRangeSlider
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinChange={handleMinPriceChange}
              onMaxChange={handleMaxPriceChange}
            />
          </div>

          <div className="filter-block">
            <label>Budget quick pick</label>
            <div className="budget-pills">
              {[
                { value: "all", label: "Any budget" },
                { value: "budget", label: "Budget friendly" },
                { value: "comfort", label: "Comfort range" },
                { value: "premium", label: "Premium stays" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.value}
                  className={budgetPreset === item.value ? "selected" : ""}
                  onClick={() => applyBudgetPreset(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <label>Booking readiness</label>
            <button
              type="button"
              className={`switch-row ${roomFilter === "rooms" ? "selected" : ""}`}
              onClick={() => setRoomFilter((current) => (current === "rooms" ? "all" : "rooms"))}
            >
              <span>
                <strong>Has room listings</strong>
                <small>Show hotels with rooms added by the partner</small>
              </span>
              <b>{roomFilter === "rooms" ? "On" : "Off"}</b>
            </button>
          </div>
        </aside>

        <main className="hotel-results-area">
          {activeChips.length > 0 && (
            <div className="active-filter-strip">
              <span>Active filters</span>
              {activeChips.map((chip) => (
                <button type="button" key={chip.label} onClick={chip.clear}>
                  {chip.label} ×
                </button>
              ))}
              <button type="button" className="clear-all-chip" onClick={handleClearFilters}>
                Clear all
              </button>
            </div>
          )}

          {loading ? (
            <div className="hotel-empty-state">
              <div className="loader-dot" />
              <h3>Loading trusted hotels...</h3>
              <p>Please wait while TourismHub LK loads approved properties.</p>
            </div>
          ) : errorMessage ? (
            <div className="hotel-empty-state error">
              <h3>Could not load hotels</h3>
              <p>{errorMessage}</p>
              <button type="button" onClick={loadProperties}>Try again</button>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="hotel-empty-state">
              <h3>No hotels found</h3>
              <p>Try widening the price range or clearing one of the filters.</p>
              <button type="button" onClick={handleClearFilters}>Clear filters</button>
            </div>
          ) : (
            <div className={`hotel-results ${viewMode === "grid" ? "grid-mode" : "list-mode"}`}>
              {filteredProperties.map((property) => (
                <article className="hotel-card" key={property.id}>
                  <div className="hotel-card-image-wrap">
                    <img src={getImageUrl(property)} alt={property.name} />
                    <div className="hotel-card-badges">
                      <span>Approved</span>
                      <span>{getTypeLabel(property.property_type)}</span>
                    </div>
                  </div>

                  <div className="hotel-card-body">
                    <div className="hotel-card-main">
                      <p className="hotel-location">📍 {property.city}{property.district ? `, ${property.district}` : ""}</p>
                      <h3>{property.name}</h3>
                      <p className="hotel-description">
                        {property.description ||
                          "A trusted Sri Lankan stay approved for TourismHub LK travellers."}
                      </p>

                      <div className="amenity-row">
                        {buildAmenityPills(property).map((pill) => (
                          <span key={pill}>{pill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="hotel-price-panel">
                      <span>Starting from</span>
                      <strong>{formatMoney(getStartingPrice(property))}</strong>
                      <small>per night</small>
                      <Link to={`/hotels/${property.id}`}>View Details</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const hotelsPageCss = `
  .hotels-page {
    width: min(1440px, calc(100% - 40px));
    margin: 0 auto;
    padding: 34px 0 10px;
    color: #102033;
  }

  .hotels-hero-section {
    position: relative;
    overflow: hidden;
    min-height: 315px;
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.75fr);
    gap: 28px;
    align-items: stretch;
    padding: 38px;
    border-radius: 34px;
    background:
      linear-gradient(135deg, rgba(3, 73, 67, 0.93), rgba(8, 117, 104, 0.88)),
      url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=80") center/cover;
    box-shadow: 0 28px 80px rgba(6, 78, 69, 0.22);
  }

  .hotels-hero-section::after {
    content: "";
    position: absolute;
    width: 420px;
    height: 420px;
    right: -170px;
    top: -170px;
    border-radius: 50%;
    background: rgba(251, 191, 36, 0.22);
    filter: blur(4px);
  }

  .hotels-hero-content,
  .hotels-hero-stats {
    position: relative;
    z-index: 2;
  }

  .hotels-eyebrow {
    width: fit-content;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.22);
    color: #fde68a;
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .hotels-hero-content h1 {
    max-width: 760px;
    margin: 18px 0 14px;
    color: #ffffff;
    font-size: clamp(38px, 5vw, 76px);
    line-height: 0.96;
    letter-spacing: -0.06em;
    font-weight: 950;
  }

  .hotels-hero-content p {
    max-width: 720px;
    color: rgba(255, 255, 255, 0.86);
    font-size: 17px;
    line-height: 1.75;
  }

  .hotels-hero-search {
    max-width: 760px;
    margin-top: 24px;
    min-height: 62px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 10px 8px 18px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.16);
  }

  .hotels-hero-search span {
    font-size: 20px;
  }

  .hotels-hero-search input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #102033;
    font-size: 15px;
    font-weight: 750;
  }

  .hotels-hero-search button,
  .filter-panel-head button,
  .hotel-empty-state button {
    border: 0;
    border-radius: 999px;
    background: #fee2e2;
    color: #991b1b;
    padding: 10px 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .hotels-hero-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .hotels-hero-stats div {
    min-height: 126px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 20px;
    border-radius: 26px;
    background: rgba(255, 255, 255, 0.13);
    border: 1px solid rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(12px);
  }

  .hotels-hero-stats strong {
    color: #fde68a;
    font-size: 30px;
    line-height: 1;
    font-weight: 950;
  }

  .hotels-hero-stats span {
    margin-top: 9px;
    color: rgba(255, 255, 255, 0.82);
    font-size: 13px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .hotels-toolbar {
    margin: 24px 0 18px;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border-radius: 26px;
    background: rgba(255, 255, 255, 0.86);
    border: 1px solid rgba(8, 117, 104, 0.12);
    box-shadow: 0 16px 42px rgba(15, 23, 42, 0.06);
    backdrop-filter: blur(12px);
  }

  .toolbar-kicker {
    color: #087568;
    font-size: 12px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.13em;
  }

  .hotels-toolbar h2 {
    margin: 3px 0 0;
    color: #102033;
    font-size: 24px;
    font-weight: 950;
    letter-spacing: -0.03em;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .toolbar-actions label {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #64748b;
    font-size: 13px;
    font-weight: 850;
  }

  .toolbar-actions select,
  .filter-block select {
    min-height: 44px;
    border: 1px solid #cfe4de;
    border-radius: 16px;
    background: #ffffff;
    color: #102033;
    padding: 0 42px 0 14px;
    font-weight: 850;
    outline: none;
  }

  .view-toggle {
    display: inline-flex;
    padding: 5px;
    border-radius: 16px;
    background: #effdfa;
    border: 1px solid #cfe4de;
  }

  .view-toggle button {
    border: 0;
    background: transparent;
    color: #087568;
    border-radius: 12px;
    padding: 10px 14px;
    font-weight: 900;
    cursor: pointer;
  }

  .view-toggle button.active {
    background: #087568;
    color: #ffffff;
    box-shadow: 0 10px 24px rgba(8, 117, 104, 0.18);
  }

  .hotels-layout {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 24px;
    align-items: start;
  }

  .hotels-filter-panel {
    position: sticky;
    top: 92px;
    padding: 24px;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(8, 117, 104, 0.12);
    box-shadow: 0 18px 54px rgba(15, 23, 42, 0.08);
  }

  .filter-panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2eee9;
  }

  .filter-panel-head span {
    color: #d99a14;
    font-size: 11px;
    font-weight: 950;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .filter-panel-head h3 {
    margin: 3px 0 0;
    color: #102033;
    font-size: 25px;
    line-height: 1.05;
    font-weight: 950;
    letter-spacing: -0.04em;
  }

  .filter-block {
    padding: 20px 0;
    border-bottom: 1px solid #e2eee9;
  }

  .filter-block:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .filter-block > label {
    display: block;
    margin-bottom: 11px;
    color: #102033;
    font-size: 15px;
    font-weight: 950;
  }

  .filter-option-grid {
    display: grid;
    gap: 9px;
    max-height: 270px;
    overflow: auto;
    padding-right: 4px;
  }

  .filter-option-grid button,
  .type-card-grid button,
  .budget-pills button,
  .switch-row {
    width: 100%;
    border: 1px solid #d9e9e4;
    background: #f8fbfa;
    color: #102033;
    border-radius: 17px;
    padding: 12px 14px;
    font-weight: 850;
    cursor: pointer;
    text-align: left;
    transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
  }

  .filter-option-grid button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .filter-option-grid small {
    min-width: 30px;
    min-height: 25px;
    display: inline-grid;
    place-items: center;
    border-radius: 999px;
    background: #e7f7f3;
    color: #087568;
    font-weight: 950;
  }

  .filter-option-grid button:hover,
  .type-card-grid button:hover,
  .budget-pills button:hover,
  .switch-row:hover {
    transform: translateY(-1px);
    border-color: #087568;
  }

  .filter-option-grid button.selected,
  .type-card-grid button.selected,
  .budget-pills button.selected,
  .switch-row.selected {
    background: linear-gradient(135deg, #064e45, #087568);
    color: #ffffff;
    border-color: #087568;
    box-shadow: 0 14px 32px rgba(8, 117, 104, 0.18);
  }

  .filter-option-grid button.selected small {
    background: rgba(255, 255, 255, 0.18);
    color: #fde68a;
  }

  .filter-block select {
    width: 100%;
  }

  .type-card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px;
  }

  .type-card-grid button {
    min-height: 72px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 7px;
    text-align: center;
  }

  .type-card-grid span {
    font-size: 21px;
  }

  .hotel-price-card {
    padding: 18px;
    border-radius: 22px;
    background: linear-gradient(180deg, #ffffff, #f6fbfa);
    border: 1px solid #d9e9e4;
  }

  .hotel-price-values,
  .hotel-price-limits {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #102033;
    font-weight: 950;
  }

  .hotel-price-values {
    font-size: 16px;
    margin-bottom: 20px;
  }

  .hotel-price-limits {
    margin-top: 14px;
    color: #64748b;
    font-size: 12px;
  }

  .hotel-price-range {
    position: relative;
    height: 34px;
    display: flex;
    align-items: center;
  }

  .hotel-price-track,
  .hotel-price-fill {
    position: absolute;
    left: 0;
    right: 0;
    height: 9px;
    border-radius: 999px;
  }

  .hotel-price-track {
    background: #dceee9;
  }

  .hotel-price-fill {
    background: linear-gradient(90deg, #fbbf24, #14b8a6, #087568);
    box-shadow: 0 8px 20px rgba(8, 117, 104, 0.18);
  }

  .hotel-price-range input[type="range"] {
    position: absolute !important;
    left: 0 !important;
    width: 100% !important;
    height: 34px !important;
    margin: 0 !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    background: transparent !important;
    pointer-events: none !important;
    outline: 0 !important;
  }

  .hotel-price-range input[type="range"]::-webkit-slider-runnable-track {
    height: 9px !important;
    background: transparent !important;
    border: 0 !important;
  }

  .hotel-price-range input[type="range"]::-moz-range-track {
    height: 9px !important;
    background: transparent !important;
    border: 0 !important;
  }

  .hotel-price-range input[type="range"]::-webkit-slider-thumb {
    pointer-events: auto !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    width: 26px !important;
    height: 26px !important;
    border-radius: 50% !important;
    background: #0ea5a4 !important;
    border: 4px solid #ffffff !important;
    box-shadow: 0 8px 22px rgba(8, 117, 104, 0.28) !important;
    cursor: pointer !important;
  }

  .hotel-price-range input[type="range"]::-moz-range-thumb {
    pointer-events: auto !important;
    width: 26px !important;
    height: 26px !important;
    border-radius: 50% !important;
    background: #0ea5a4 !important;
    border: 4px solid #ffffff !important;
    box-shadow: 0 8px 22px rgba(8, 117, 104, 0.28) !important;
    cursor: pointer !important;
  }

  .budget-pills {
    display: grid;
    gap: 9px;
  }

  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .switch-row span {
    display: grid;
    gap: 4px;
  }

  .switch-row small {
    color: #64748b;
    line-height: 1.4;
    font-weight: 700;
  }

  .switch-row.selected small {
    color: rgba(255, 255, 255, 0.76);
  }

  .hotel-results-area {
    min-width: 0;
  }

  .active-filter-strip {
    margin-bottom: 16px;
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 9px;
    flex-wrap: wrap;
    border-radius: 22px;
    background: #ffffff;
    border: 1px solid rgba(8, 117, 104, 0.12);
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.055);
  }

  .active-filter-strip span {
    color: #64748b;
    font-size: 12px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .active-filter-strip button {
    border: 0;
    border-radius: 999px;
    background: #ecfdf5;
    color: #087568;
    padding: 8px 12px;
    font-weight: 900;
    cursor: pointer;
  }

  .active-filter-strip .clear-all-chip {
    background: #fff7ed;
    color: #c2410c;
  }

  .hotel-results {
    display: grid;
    gap: 18px;
  }

  .hotel-results.grid-mode {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hotel-card {
    overflow: hidden;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(8, 117, 104, 0.12);
    box-shadow: 0 18px 52px rgba(15, 23, 42, 0.08);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .hotel-card:hover {
    transform: translateY(-3px);
    border-color: rgba(8, 117, 104, 0.34);
    box-shadow: 0 26px 66px rgba(15, 23, 42, 0.12);
  }

  .hotel-results.list-mode .hotel-card {
    display: grid;
    grid-template-columns: 310px minmax(0, 1fr);
  }

  .hotel-card-image-wrap {
    position: relative;
    min-height: 250px;
    overflow: hidden;
    background: #d9e9e4;
  }

  .hotel-results.grid-mode .hotel-card-image-wrap {
    min-height: 235px;
  }

  .hotel-card-image-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.22s ease;
  }

  .hotel-card:hover .hotel-card-image-wrap img {
    transform: scale(1.035);
  }

  .hotel-card-badges {
    position: absolute;
    left: 16px;
    right: 16px;
    top: 16px;
    display: flex;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .hotel-card-badges span {
    padding: 8px 11px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.94);
    color: #087568;
    font-size: 12px;
    font-weight: 950;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  }

  .hotel-card-badges span:first-child {
    background: #fef3c7;
    color: #92400e;
  }

  .hotel-card-body {
    padding: 26px;
    display: flex;
    gap: 24px;
    justify-content: space-between;
  }

  .hotel-results.grid-mode .hotel-card-body {
    flex-direction: column;
  }

  .hotel-card-main {
    min-width: 0;
  }

  .hotel-location {
    margin: 0 0 7px;
    color: #087568;
    font-weight: 950;
    font-size: 14px;
  }

  .hotel-card h3 {
    margin: 0;
    color: #102033;
    font-size: 27px;
    line-height: 1.05;
    letter-spacing: -0.045em;
    font-weight: 950;
  }

  .hotel-description {
    max-width: 650px;
    margin: 13px 0 17px;
    color: #64748b;
    line-height: 1.7;
    font-size: 15px;
  }

  .amenity-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .amenity-row span {
    padding: 8px 11px;
    border-radius: 999px;
    background: #effdfa;
    color: #087568;
    border: 1px solid #cceee7;
    font-size: 12px;
    font-weight: 900;
  }

  .hotel-price-panel {
    min-width: 185px;
    align-self: stretch;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    padding-left: 22px;
    border-left: 1px solid #e2eee9;
    text-align: right;
  }

  .hotel-results.grid-mode .hotel-price-panel {
    align-items: flex-start;
    border-left: 0;
    border-top: 1px solid #e2eee9;
    padding: 18px 0 0;
    text-align: left;
  }

  .hotel-price-panel span,
  .hotel-price-panel small {
    color: #64748b;
    font-weight: 750;
  }

  .hotel-price-panel strong {
    margin: 7px 0 2px;
    color: #102033;
    font-size: 24px;
    font-weight: 950;
    letter-spacing: -0.03em;
  }

  .hotel-price-panel a {
    margin-top: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    padding: 0 18px;
    border-radius: 16px;
    background: linear-gradient(135deg, #064e45, #087568);
    color: #ffffff;
    font-weight: 950;
    text-decoration: none;
    box-shadow: 0 14px 30px rgba(8, 117, 104, 0.20);
  }

  .hotel-empty-state {
    min-height: 360px;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 12px;
    padding: 36px;
    border-radius: 30px;
    background: #ffffff;
    border: 1px solid rgba(8, 117, 104, 0.12);
    box-shadow: 0 18px 52px rgba(15, 23, 42, 0.08);
    text-align: center;
  }

  .hotel-empty-state h3 {
    margin: 0;
    color: #102033;
    font-size: 28px;
    font-weight: 950;
  }

  .hotel-empty-state p {
    margin: 0;
    color: #64748b;
    max-width: 520px;
    line-height: 1.6;
  }

  .hotel-empty-state button {
    margin-top: 8px;
    background: #087568;
    color: #ffffff;
  }

  .hotel-empty-state.error button {
    background: #dc2626;
  }

  .loader-dot {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 5px solid #d9e9e4;
    border-top-color: #087568;
    animation: hotelSpin 0.8s linear infinite;
  }

  @keyframes hotelSpin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1180px) {
    .hotels-layout,
    .hotels-hero-section {
      grid-template-columns: 1fr;
    }

    .hotels-filter-panel {
      position: static;
    }
  }

  @media (max-width: 820px) {
    .hotels-page {
      width: min(100% - 24px, 1440px);
      padding-top: 20px;
    }

    .hotels-hero-section {
      padding: 26px;
      border-radius: 26px;
    }

    .hotels-hero-stats,
    .hotel-results.grid-mode {
      grid-template-columns: 1fr;
    }

    .hotels-toolbar,
    .hotel-card-body {
      align-items: stretch;
      flex-direction: column;
    }

    .toolbar-actions {
      justify-content: stretch;
    }

    .toolbar-actions label,
    .toolbar-actions select,
    .view-toggle {
      width: 100%;
    }

    .view-toggle button {
      flex: 1;
    }

    .hotel-results.list-mode .hotel-card {
      grid-template-columns: 1fr;
    }

    .hotel-card-image-wrap {
      min-height: 220px;
    }

    .hotel-price-panel {
      align-items: flex-start;
      border-left: 0;
      border-top: 1px solid #e2eee9;
      padding: 18px 0 0;
      text-align: left;
    }
  }

  @media (max-width: 560px) {
    .hotels-hero-search {
      flex-wrap: wrap;
      padding: 14px;
      border-radius: 20px;
    }

    .hotels-hero-search input {
      flex-basis: calc(100% - 40px);
    }

    .hotels-hero-search button {
      width: 100%;
    }

    .type-card-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default HotelsPage;
