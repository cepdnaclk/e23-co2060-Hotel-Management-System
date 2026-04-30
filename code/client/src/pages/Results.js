import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Results.css";
import LanguageCurrencySelector from "../components/LanguageCurrencySelector";
import { useAppSettings } from "../context/AppSettingsContext";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, formatPrice } = useAppSettings();

  const queryParams = new URLSearchParams(location.search);
  const initialCity = queryParams.get("city") || "";

  const [city, setCity] = useState(initialCity);
  const [checkIn, setCheckIn] = useState(queryParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(queryParams.get("checkOut") || "");
  const [guests, setGuests] = useState(
    queryParams.get("guests") || "2 adults · 1 room"
  );

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("Recommended");
  const [viewMode, setViewMode] = useState("list");

  const [filters, setFilters] = useState({
    maxPrice: 50000,
    freeWifi: false,
    breakfast: false,
    pool: false,
    parking: false,
    verifiedOnly: false,
  });

  const fallbackHotels = [
    {
      hotel_id: 1,
      name: "Heeran Gardens House",
      city: "Kandy",
      district: "Kandy",
      address: "Kandy City Center, Sri Lanka",
      description:
        "A peaceful boutique hotel with mountain views, breakfast, pool, and easy access to Kandy attractions.",
      image:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
      rating: 4.8,
      review_count: 325,
      price: 17950,
      old_price: 35900,
      is_verified: true,
      facilities: ["Free Wi-Fi", "Breakfast", "Pool", "Parking"],
    },
    {
      hotel_id: 2,
      name: "Kandy Myst by Cinnamon",
      city: "Kandy",
      district: "Kandy",
      address: "Peradeniya Road, Kandy",
      description:
        "A modern stay with comfortable rooms, beautiful views, and quick access to the city center.",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
      rating: 9.3,
      review_count: 218,
      price: 27750,
      old_price: 42000,
      is_verified: true,
      facilities: ["Free Wi-Fi", "Pool", "Parking"],
    },
    {
      hotel_id: 3,
      name: "Cinnamon Citadel Kandy",
      city: "Kandy",
      district: "Kandy",
      address: "River Side, Kandy",
      description:
        "A riverside hotel with relaxing rooms, restaurant service, and a scenic Sri Lankan atmosphere.",
      image:
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80",
      rating: 8.9,
      review_count: 491,
      price: 19850,
      old_price: 31200,
      is_verified: true,
      facilities: ["Free Wi-Fi", "Breakfast", "Pool"],
    },
    {
      hotel_id: 4,
      name: "Hotel Cassamara",
      city: "Kandy",
      district: "Kandy",
      address: "Lake Round, Kandy",
      description:
        "Budget friendly hotel close to the lake, restaurants, cultural places, and shopping areas.",
      image:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",
      rating: 8.3,
      review_count: 156,
      price: 16950,
      old_price: 26000,
      is_verified: false,
      facilities: ["Free Wi-Fi", "Parking"],
    },
  ];

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);

        const searchCity = initialCity || "Kandy";

        const response = await fetch(
          `http://localhost:5000/api/hotels?city=${encodeURIComponent(
            searchCity
          )}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch hotels");
        }

        const data = await response.json();

        if (data && data.length > 0) {
          const formattedHotels = data.map((hotel, index) => ({
            hotel_id: hotel.hotel_id,
            name: hotel.name,
            city: hotel.city,
            district: hotel.district,
            address: hotel.address || `${hotel.city}, ${hotel.district}`,
            description:
              hotel.description ||
              "Comfortable stay with essential facilities for travelers in Sri Lanka.",
            image:
              hotel.image ||
              fallbackHotels[index % fallbackHotels.length].image,
            rating:
              hotel.rating ||
              fallbackHotels[index % fallbackHotels.length].rating,
            review_count:
              hotel.review_count ||
              fallbackHotels[index % fallbackHotels.length].review_count,
            price:
              hotel.price ||
              hotel.base_price_per_night ||
              fallbackHotels[index % fallbackHotels.length].price,
            old_price:
              hotel.old_price ||
              fallbackHotels[index % fallbackHotels.length].old_price,
            is_verified:
              hotel.is_verified === 1 ||
              hotel.is_verified === true ||
              hotel.is_verified === "1",
            facilities:
              hotel.facilities ||
              fallbackHotels[index % fallbackHotels.length].facilities,
          }));

          setHotels(formattedHotels);
        } else {
          setHotels(fallbackHotels);
        }
      } catch (error) {
        console.log("Using fallback hotel data:", error.message);
        setHotels(fallbackHotels);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [initialCity]);

  const handleSearch = (e) => {
    e.preventDefault();

    if (!city.trim()) {
      alert("Please enter a city or destination.");
      return;
    }

    navigate(
      `/results?city=${encodeURIComponent(
        city
      )}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${encodeURIComponent(
        guests
      )}`
    );
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const filteredAndSortedHotels = useMemo(() => {
    let result = [...hotels];

    result = result.filter((hotel) => {
      const price = Number(hotel.price) || 0;

      if (price > filters.maxPrice) return false;
      if (filters.verifiedOnly && !hotel.is_verified) return false;

      const facilities = hotel.facilities || [];

      if (filters.freeWifi && !facilities.includes("Free Wi-Fi")) return false;
      if (filters.breakfast && !facilities.includes("Breakfast")) return false;
      if (filters.pool && !facilities.includes("Pool")) return false;
      if (filters.parking && !facilities.includes("Parking")) return false;

      return true;
    });

    if (sortBy === "Price Low to High") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sortBy === "Rating High to Low") {
      result.sort((a, b) => Number(b.rating) - Number(a.rating));
    }

    return result;
  }, [hotels, filters, sortBy]);

  const resetFilters = () => {
    setFilters({
      maxPrice: 50000,
      freeWifi: false,
      breakfast: false,
      pool: false,
      parking: false,
      verifiedOnly: false,
    });

    setSortBy("Recommended");
  };

  const getRatingText = (rating) => {
    if (rating >= 9 || rating >= 4.7) return t("excellent");
    if (rating >= 8 || rating >= 4.2) return "Very Good";
    if (rating >= 7 || rating >= 3.8) return "Good";
    return "Pleasant";
  };

  return (
    <div className="results-page">
      <header className="results-header">
        <Link to="/" className="results-brand">
          <div className="results-brand-icon">🌴</div>
          <div>
            <h2>TourismHub LK</h2>
            <span>Smart Hotel & Tourism</span>
          </div>
        </Link>

        <nav className="results-nav">
          <LanguageCurrencySelector />
          <Link to="/help">{t("help")}</Link>
          <Link to="/partner">{t("listProperty")}</Link>
          <Link to="/register" className="results-outline-btn">
            {t("register")}
          </Link>
          <Link to="/login" className="results-primary-btn">
            {t("signIn")}
          </Link>
        </nav>
      </header>

      <section className="results-search-section">
        <form className="results-search-bar" onSubmit={handleSearch}>
          <div className="results-search-field destination-field">
            <label>{t("destination")}</label>
            <input
              type="text"
              placeholder="Where are you going?"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="results-search-field">
            <label>{t("checkIn")}</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>

          <div className="results-search-field">
            <label>{t("checkOut")}</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          <div className="results-search-field">
            <label>{t("guests")}</label>
            <select value={guests} onChange={(e) => setGuests(e.target.value)}>
              <option>1 adult · 1 room</option>
              <option>2 adults · 1 room</option>
              <option>2 adults · 2 rooms</option>
              <option>Family · 1 room</option>
              <option>Group · 3 rooms</option>
            </select>
          </div>

          <button type="submit" className="results-search-btn">
            {t("search")}
          </button>
        </form>
      </section>

      <main className="results-container">
        <section className="results-title-row">
          <div>
            <p className="breadcrumb-text">
              {t("home")} <span>›</span> {t("searchResults")} <span>›</span>{" "}
              {city || "Kandy"}
            </p>

            <h1>
              {city || "Kandy"}: {filteredAndSortedHotels.length}{" "}
              {t("staysFound")}
            </h1>

            <p>
              Compare verified hotels, facilities, ratings, and prices for your
              Sri Lanka trip.
            </p>
          </div>

          <div className="view-toggle">
            <button
              type="button"
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
            >
              ☰ List
            </button>

            <button
              type="button"
              className={viewMode === "map" ? "active" : ""}
              onClick={() => setViewMode("map")}
            >
              🗺️ Map
            </button>
          </div>
        </section>

        <section className="results-layout">
          <aside className="filters-sidebar">
            <div className="filter-card">
              <div className="filter-header">
                <h2>{t("filterBy")}</h2>
                <button type="button" onClick={resetFilters}>
                  {t("reset")}
                </button>
              </div>

              <div className="filter-block">
                <label className="filter-label">{t("priceRange")}</label>

                <div className="price-output">
                  {formatPrice(0)} - {formatPrice(filters.maxPrice)}
                </div>

                <input
                  type="range"
                  min="5000"
                  max="80000"
                  step="1000"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", Number(e.target.value))
                  }
                />
              </div>

              <div className="filter-block">
                <label className="filter-label">{t("popularFilters")}</label>

                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.freeWifi}
                    onChange={(e) =>
                      handleFilterChange("freeWifi", e.target.checked)
                    }
                  />
                  Free Wi-Fi
                </label>

                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.breakfast}
                    onChange={(e) =>
                      handleFilterChange("breakfast", e.target.checked)
                    }
                  />
                  Breakfast included
                </label>

                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.pool}
                    onChange={(e) =>
                      handleFilterChange("pool", e.target.checked)
                    }
                  />
                  Pool
                </label>

                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.parking}
                    onChange={(e) =>
                      handleFilterChange("parking", e.target.checked)
                    }
                  />
                  Parking
                </label>
              </div>

              <div className="filter-block">
                <label className="filter-label">Trust & quality</label>

                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) =>
                      handleFilterChange("verifiedOnly", e.target.checked)
                    }
                  />
                  {t("verifiedOnly")}
                </label>
              </div>

              <div className="filter-block">
                <label className="filter-label">Property type</label>

                <label className="filter-checkbox">
                  <input type="checkbox" />
                  Hotel
                </label>

                <label className="filter-checkbox">
                  <input type="checkbox" />
                  Resort
                </label>

                <label className="filter-checkbox">
                  <input type="checkbox" />
                  Guesthouse
                </label>

                <label className="filter-checkbox">
                  <input type="checkbox" />
                  Villa
                </label>
              </div>

              <div className="filter-block">
                <label className="filter-label">Review score</label>

                <div className="rating-filter-list">
                  <button type="button">9+ ⭐</button>
                  <button type="button">8+ ⭐</button>
                  <button type="button">7+ ⭐</button>
                </div>
              </div>
            </div>
          </aside>

          <section className="results-content">
            <div className="results-toolbar">
              <p>
                {t("showing")}{" "}
                <strong>{filteredAndSortedHotels.length}</strong> {t("hotels")}
              </p>

              <div>
                <label>{t("sortBy")}: </label>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option>Recommended</option>
                  <option>Price Low to High</option>
                  <option>Rating High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="results-loading">
                <div className="loader"></div>
                <p>Loading hotels...</p>
              </div>
            ) : filteredAndSortedHotels.length === 0 ? (
              <div className="no-results">
                <span>🏨</span>
                <h2>No hotels found</h2>
                <p>Try changing your filters or searching another city.</p>
                <button type="button" onClick={resetFilters}>
                  Clear filters
                </button>
              </div>
            ) : viewMode === "map" ? (
              <div className="map-view">
                <div className="map-placeholder">
                  <span>🗺️</span>
                  <h2>Map Preview</h2>
                  <p>
                    Map view is a frontend preview for your semester project.
                    Hotel cards are shown below.
                  </p>
                </div>

                {filteredAndSortedHotels.map((hotel) => (
                  <HotelCard
                    key={hotel.hotel_id}
                    hotel={hotel}
                    getRatingText={getRatingText}
                    formatPrice={formatPrice}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="hotel-list">
                {filteredAndSortedHotels.map((hotel) => (
                  <HotelCard
                    key={hotel.hotel_id}
                    hotel={hotel}
                    getRatingText={getRatingText}
                    formatPrice={formatPrice}
                    t={t}
                  />
                ))}
              </div>
            )}

            <div className="pagination">
              <button type="button">‹</button>
              <button type="button" className="active">
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">4</button>
              <button type="button">Next ›</button>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function HotelCard({ hotel, getRatingText, formatPrice, t }) {
  const facilities = hotel.facilities || [];

  return (
    <article className="hotel-card">
      <div className="hotel-image-wrap">
        <img src={hotel.image} alt={hotel.name} />

        {hotel.is_verified && (
          <span className="image-verified">✓ {t("verified")}</span>
        )}

        <button type="button" className="save-btn">
          ♡
        </button>
      </div>

      <div className="hotel-info">
        <div className="hotel-name-row">
          <div>
            <h2>{hotel.name}</h2>
            <p className="hotel-location">📍 {hotel.address}</p>
          </div>

          {hotel.is_verified && (
            <span className="verified-badge">✓ {t("verified")}</span>
          )}
        </div>

        <div className="rating-row">
          <span className="rating-score">{hotel.rating}</span>
          <strong>{getRatingText(Number(hotel.rating))}</strong>
          <p>
            {hotel.review_count} {t("reviews")}
          </p>
        </div>

        <p className="hotel-description">{hotel.description}</p>

        <div className="facility-row">
          {facilities.slice(0, 4).map((facility, index) => (
            <span key={index}>
              {facility === "Free Wi-Fi" && "📶 "}
              {facility === "Breakfast" && "🍳 "}
              {facility === "Pool" && "🏊 "}
              {facility === "Parking" && "🅿️ "}
              {facility}
            </span>
          ))}
        </div>
      </div>

      <div className="price-box">
        <p>2 nights, 2 adults</p>

        {hotel.old_price && <small>{formatPrice(hotel.old_price)}</small>}

        <h3>{formatPrice(hotel.price)}</h3>

        <span>Includes taxes and charges</span>

        <Link to={`/hotel/${hotel.hotel_id}`} className="view-details-btn">
          {t("viewDetails")}
        </Link>
      </div>
    </article>
  );
}

export default Results;