import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Home.css";
import LanguageCurrencySelector from "../components/LanguageCurrencySelector";
import { useAppSettings } from "../context/AppSettingsContext";

function Home() {
  const navigate = useNavigate();
  const { t } = useAppSettings();

  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2 adults · 1 room");

  const handleSearch = (e) => {
    e.preventDefault();

    if (!destination.trim()) {
      alert(t("destinationRequired") || "Please enter a destination or hotel name");
      return;
    }

    navigate(
      `/results?city=${encodeURIComponent(destination)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${encodeURIComponent(
        guests
      )}`
    );
  };

  const categories = [
    { icon: "🔥", name: t("popular") },
    { icon: "🏖️", name: t("beach") },
    { icon: "🛕", name: t("cultural") },
    { icon: "🌿", name: t("nature") },
    { icon: "💎", name: t("luxury") },
    { icon: "💰", name: t("budget") },
    { icon: "🎉", name: t("festivals") },
  ];

  const featuredDestinations = [
    {
      name: "Colombo",
      image:
        "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Kandy",
      image:
        "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=900&q=80",
    },
  ];

  const destinations = [
    {
      name: "Colombo",
      image:
        "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Kandy",
      image:
        "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Ella",
      image:
        "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Galle",
      image:
        "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=900&q=80",
    },
  ];

  const offers = [
    {
      title: t("offerEarlyBooking"),
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: t("offerWeekendStay"),
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <div className="home-page">
      <header className="home-header">
        <Link to="/" className="brand">
          <div className="brand-icon">🌴</div>
          <div>
            <h2>TourismHub LK</h2>
            <span>Smart Hotel & Tourism</span>
          </div>
        </Link>

        <nav className="home-nav">
          <LanguageCurrencySelector />

          <Link to="/help">{t("navHelp")}</Link>

          <Link to="/partner">{t("navListProperty")}</Link>

          <Link to="/register" className="outline-btn">
            {t("navRegister")}
          </Link>

          <Link to="/login" className="primary-btn">
            {t("navSignIn")}
          </Link>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <p className="welcome-text">{t("heroBadge")}</p>
            <h1>{t("heroTitle")}</h1>
            <p>{t("heroSubtitle")}</p>

            <form className="search-box" onSubmit={handleSearch}>
              <div className="search-field destination-field">
                <label>{t("destination")}</label>
                <input
                  type="text"
                  placeholder={t("destinationPlaceholder")}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="search-field">
                <label>{t("checkIn")}</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              <div className="search-field">
                <label>{t("checkOut")}</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>

              <div className="search-field">
                <label>{t("guests")}</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                >
                  <option value="2 adults · 1 room">{t("guestOption1")}</option>
                  <option value="1 adult · 1 room">{t("guestOption2")}</option>
                  <option value="2 adults · 2 rooms">{t("guestOption3")}</option>
                  <option value="Family · 1 room">{t("guestOption4")}</option>
                  <option value="Group · 3 rooms">{t("guestOption5")}</option>
                </select>
              </div>

              <button type="submit" className="search-btn">
                {t("search")}
              </button>
            </form>
          </div>
        </div>
      </section>

      <main className="home-main">
        <section className="category-section">
          <div className="category-row">
            {categories.map((category, index) => (
              <button type="button" className="category-chip" key={index}>
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-title">
            <h2>{t("popularDestinations")}</h2>
            <p>{t("popularDestinationsSub")}</p>
          </div>

          <div className="featured-grid">
            {featuredDestinations.map((place, index) => (
              <div
                className="destination-card large-card"
                key={index}
                onClick={() => navigate(`/results?city=${place.name}`)}
              >
                <img src={place.image} alt={place.name} />
                <div className="card-gradient"></div>
                <div className="destination-info">
                  <h3>{place.name}</h3>
                  <button type="button">{t("exploreHotels")}</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-title">
            <h2>{t("discoverBeautifulPlaces")}</h2>
            <p>{t("discoverBeautifulPlacesSub")}</p>
          </div>

          <div className="destination-grid">
            {destinations.map((place, index) => (
              <div
                className="destination-card"
                key={index}
                onClick={() => navigate(`/results?city=${place.name}`)}
              >
                <img src={place.image} alt={place.name} />
                <div className="card-gradient"></div>
                <div className="destination-info">
                  <h3>{place.name}</h3>
                  <button type="button">{t("exploreHotels")}</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-title">
            <h2>{t("excitingOffers")}</h2>
            <p>{t("excitingOffersSub")}</p>
          </div>

          <div className="offer-grid">
            {offers.map((offer, index) => (
              <div className="offer-card" key={index}>
                <img src={offer.image} alt={offer.title} />
                <div className="offer-content">
                  <span>{t("limitedOffer")}</span>
                  <h3>{offer.title}</h3>
                  <button type="button">{t("viewDetails")}</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="partner-cta">
          <div>
            <span>{t("forHotelOwners")}</span>
            <h2>{t("listPropertyTitle")}</h2>
            <p>{t("listPropertySubtitle")}</p>
          </div>

          <Link to="/partner" className="partner-btn">
            {t("registerYourProperty")}
          </Link>
        </section>
      </main>
    </div>
  );
}

export default Home;