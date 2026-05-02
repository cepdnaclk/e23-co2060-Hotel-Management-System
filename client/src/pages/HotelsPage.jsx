import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/api";

function HotelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCityFromUrl = searchParams.get("city") || "";

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cityFilter, setCityFilter] = useState(selectedCityFromUrl);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000);

  const priceLimitMin = 0;
  const priceLimitMax = 50000;
  const priceGap = 500;

  const loadProperties = async () => {
    try {
      setLoading(true);

      const response = await api.get("/properties");
      setProperties(response.data.data || []);
    } catch (error) {
      console.error("Load properties error:", error);
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

  const availableCities = useMemo(() => {
    const cities = properties.map((property) => property.city).filter(Boolean);
    return [...new Set(cities)];
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const cityMatches =
        !cityFilter ||
        property.city?.toLowerCase() === cityFilter.toLowerCase();

      const typeMatches =
        !propertyTypeFilter ||
        property.property_type?.toLowerCase() ===
          propertyTypeFilter.toLowerCase();

      const price = Number(property.starting_price || 0);
      const priceMatches = price >= minPrice && price <= maxPrice;

      return cityMatches && typeMatches && priceMatches;
    });
  }, [properties, cityFilter, propertyTypeFilter, minPrice, maxPrice]);

  const handleCityChange = (cityName) => {
    setCityFilter(cityName);

    const params = new URLSearchParams(searchParams);

    if (cityName) {
      params.set("city", cityName);
    } else {
      params.delete("city");
    }

    setSearchParams(params);
  };

  const handleMinPriceChange = (e) => {
    const value = Number(e.target.value);

    if (value <= maxPrice - priceGap) {
      setMinPrice(value);
    }
  };

  const handleMaxPriceChange = (e) => {
    const value = Number(e.target.value);

    if (value >= minPrice + priceGap) {
      setMaxPrice(value);
    }
  };

  const handleClearFilters = () => {
    setCityFilter("");
    setPropertyTypeFilter("");
    setMinPrice(0);
    setMaxPrice(50000);
    setSearchParams({});
  };

  const minPercent =
    ((minPrice - priceLimitMin) / (priceLimitMax - priceLimitMin)) * 100;

  const maxPercent =
    ((maxPrice - priceLimitMin) / (priceLimitMax - priceLimitMin)) * 100;

  return (
    <div className="page">
      <style>
        {`
          .range-thumb {
            position: absolute;
            width: 100%;
            height: 8px;
            background: transparent;
            pointer-events: none;
            appearance: none;
            -webkit-appearance: none;
            outline: none;
          }

          .range-thumb::-webkit-slider-thumb {
            pointer-events: auto;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #0b8fe8;
            border: 3px solid #0b8fe8;
            box-shadow: 0 5px 14px rgba(11, 143, 232, 0.35);
            cursor: pointer;
            appearance: none;
            -webkit-appearance: none;
          }

          .range-thumb::-moz-range-thumb {
            pointer-events: auto;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #0b8fe8;
            border: 3px solid #0b8fe8;
            box-shadow: 0 5px 14px rgba(11, 143, 232, 0.35);
            cursor: pointer;
          }

          .range-thumb::-webkit-slider-runnable-track {
            background: transparent;
          }

          .range-thumb::-moz-range-track {
            background: transparent;
          }
        `}
      </style>

      <div style={styles.header}>
        <div>
          <h1>Approved Hotels</h1>

          {cityFilter ? (
            <p>
              Showing approved hotels in{" "}
              <strong style={styles.highlightText}>{cityFilter}</strong>.
            </p>
          ) : (
            <p>Only admin-approved properties are shown to tourists.</p>
          )}
        </div>

        <Link to="/" style={styles.backHomeBtn}>
          Back to Home
        </Link>
      </div>

      <div style={styles.layout}>
        <aside className="card" style={styles.filterBox}>
          <div style={styles.filterTop}>
            <h3 style={styles.filterTitle}>Filter by</h3>

            <button
              type="button"
              style={styles.clearBtn}
              onClick={handleClearFilters}
            >
              Clear
            </button>
          </div>

          <label style={styles.filterLabel}>Destination</label>

          <button
            type="button"
            onClick={() => handleCityChange("")}
            style={{
              ...styles.optionButton,
              ...(cityFilter === "" ? styles.activeOption : {}),
            }}
          >
            All Destinations
          </button>

          {availableCities.map((city) => (
            <button
              type="button"
              key={city}
              onClick={() => handleCityChange(city)}
              style={{
                ...styles.optionButton,
                ...(cityFilter.toLowerCase() === city.toLowerCase()
                  ? styles.activeOption
                  : {}),
              }}
            >
              {city}
            </button>
          ))}

          <label style={styles.filterLabel}>Price Range</label>

          <div style={styles.priceRangeBox}>
            <div style={styles.priceValues}>
              <span>Rs. {minPrice.toLocaleString()}</span>
              <span>Rs. {maxPrice.toLocaleString()}</span>
            </div>

            <div style={styles.sliderWrapper}>
              <div style={styles.sliderTrack}></div>

              <div
                style={{
                  ...styles.sliderRange,
                  left: `${minPercent}%`,
                  right: `${100 - maxPercent}%`,
                }}
              ></div>

              <input
                className="range-thumb"
                type="range"
                min={priceLimitMin}
                max={priceLimitMax}
                value={minPrice}
                step="500"
                onChange={handleMinPriceChange}
                style={{
                  zIndex: minPrice > priceLimitMax - 10000 ? 5 : 3,
                }}
              />

              <input
                className="range-thumb"
                type="range"
                min={priceLimitMin}
                max={priceLimitMax}
                value={maxPrice}
                step="500"
                onChange={handleMaxPriceChange}
                style={{
                  zIndex: 4,
                }}
              />
            </div>

            <div style={styles.priceLimitRow}>
              <span>Rs. {priceLimitMin}</span>
              <span>Rs. {priceLimitMax.toLocaleString()}</span>
            </div>
          </div>

          <label style={styles.filterLabel}>Property Type</label>

          <button
            type="button"
            onClick={() => setPropertyTypeFilter("")}
            style={{
              ...styles.optionButton,
              ...(propertyTypeFilter === "" ? styles.activeOption : {}),
            }}
          >
            All Types
          </button>

          {["Hotel", "Resort", "Villa", "Guesthouse"].map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setPropertyTypeFilter(type)}
              style={{
                ...styles.optionButton,
                ...(propertyTypeFilter === type ? styles.activeOption : {}),
              }}
            >
              {type}
            </button>
          ))}
        </aside>

        <section style={styles.results}>
          {loading ? (
            <div className="card" style={styles.emptyBox}>
              <h3>Loading hotels...</h3>
              <p>Please wait while we load approved properties.</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="card" style={styles.emptyBox}>
              <h3>No approved hotels found</h3>

              {cityFilter ? (
                <p>
                  No approved hotels are available in {cityFilter} for the
                  selected price range.
                </p>
              ) : (
                <p>No hotels match your selected filters.</p>
              )}
            </div>
          ) : (
            filteredProperties.map((property) => (
              <div className="card" style={styles.hotelCard} key={property.id}>
                <img
                  src={
                    property.main_image ||
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80"
                  }
                  alt={property.name}
                  style={styles.hotelImage}
                />

                <div style={styles.hotelInfo}>
                  <div>
                    <h2 style={styles.hotelName}>{property.name}</h2>

                    <p style={styles.city}>
                      {property.city}, {property.district}
                    </p>

                    <p style={styles.description}>
                      {property.description || "No description available."}
                    </p>

                    <div style={styles.badgeRow}>
                      <span className="status-badge status-approved">
                        Approved
                      </span>

                      {property.property_type && (
                        <span style={styles.typeBadge}>
                          {property.property_type}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={styles.priceBox}>
                    <p style={styles.fromText}>Starting from</p>

                    <h3>
                      Rs.{" "}
                      {Number(property.starting_price || 0).toLocaleString()}
                    </h3>

                    <p style={styles.perNight}>per night</p>

                    <Link to={`/hotels/${property.id}`} className="btn-primary">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },

  highlightText: {
    color: "#7c3aed",
  },

  backHomeBtn: {
    background: "#f5f3ff",
    color: "#7c3aed",
    padding: "11px 16px",
    borderRadius: "999px",
    fontWeight: "800",
    textDecoration: "none",
    border: "1px solid #ddd6fe",
    whiteSpace: "nowrap",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "22px",
  },

  filterBox: {
    padding: "22px",
    height: "fit-content",
    position: "sticky",
    top: "92px",
  },

  filterTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },

  filterTitle: {
    margin: 0,
  },

  clearBtn: {
    border: "none",
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  filterLabel: {
    display: "block",
    marginTop: "22px",
    marginBottom: "10px",
    fontWeight: "800",
  },

  optionButton: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "8px",
    color: "#4b5563",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "14px",
    textAlign: "left",
    cursor: "pointer",
  },

  activeOption: {
    background: "#7c3aed",
    color: "#ffffff",
    borderColor: "#7c3aed",
    fontWeight: "800",
  },

  priceRangeBox: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px 18px 14px",
    marginBottom: "8px",
  },

  priceValues: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    fontWeight: "900",
    color: "#111827",
    marginBottom: "16px",
  },

  sliderWrapper: {
    position: "relative",
    height: "38px",
    display: "flex",
    alignItems: "center",
  },

  sliderTrack: {
    position: "absolute",
    width: "100%",
    height: "8px",
    background: "#c4b5fd",
    borderRadius: "999px",
  },

  sliderRange: {
    position: "absolute",
    height: "8px",
    background: "linear-gradient(90deg, #a855f7, #7c3aed)",
    borderRadius: "999px",
  },

  priceLimitRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "800",
    marginTop: "8px",
  },

  results: {
    display: "grid",
    gap: "18px",
  },

  hotelCard: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    overflow: "hidden",
  },

  hotelImage: {
    width: "100%",
    height: "220px",
    objectFit: "cover",
  },

  hotelInfo: {
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
  },

  hotelName: {
    margin: 0,
  },

  city: {
    color: "#7c3aed",
    fontWeight: "700",
  },

  description: {
    color: "#6b7280",
    lineHeight: "1.5",
  },

  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  typeBadge: {
    background: "#f5f3ff",
    color: "#7c3aed",
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },

  priceBox: {
    minWidth: "170px",
    textAlign: "right",
  },

  fromText: {
    color: "#6b7280",
    margin: 0,
  },

  perNight: {
    color: "#6b7280",
    fontSize: "13px",
  },

  emptyBox: {
    padding: "30px",
    textAlign: "center",
  },
};

export default HotelsPage;