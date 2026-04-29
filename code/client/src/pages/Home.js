import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2 adults · 1 room");

  const handleSearch = (e) => {
    e.preventDefault();

    if (!destination.trim()) {
      alert("Please enter a destination or hotel name");
      return;
    }

    navigate(
      `/results?city=${encodeURIComponent(destination)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${encodeURIComponent(
        guests
      )}`
    );
  };

  const categories = [
    { icon: "🔥", name: "Popular" },
    { icon: "🏖️", name: "Beach" },
    { icon: "🛕", name: "Cultural" },
    { icon: "🌿", name: "Nature" },
    { icon: "💎", name: "Luxury" },
    { icon: "💰", name: "Budget" },
    { icon: "🎉", name: "Festivals" },
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
      title: "Save up to 20% on early bookings",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Get 15% off on weekend stays",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <Link to="/" className="brand">
          <div className="brand-icon">🌴</div>
          <div>
            <h2>TourismHub LK</h2>
            <span>Smart Hotel & Tourism</span>
          </div>
        </Link>

        <nav className="home-nav">
          <button className="language-btn">🇱🇰 EN / LKR</button>
          <Link to="/help">Help</Link>
          <Link to="/partner">List your property</Link>
          <Link to="/register" className="outline-btn">
            Register
          </Link>
          <Link to="/login" className="primary-btn">
            Sign In
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <p className="welcome-text">Explore • Book • Experience</p>
            <h1>Find hotels and plan your Sri Lanka trip in one place</h1>
            <p>
              Search by destination or hotel name. Compare stays, discover
              experiences, and book faster.
            </p>

            <form className="search-box" onSubmit={handleSearch}>
              <div className="search-field destination-field">
                <label>Destination</label>
                <input
                  type="text"
                  placeholder="Where are you going? Colombo, Kandy, Ella..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="search-field">
                <label>Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              <div className="search-field">
                <label>Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>

              <div className="search-field">
                <label>Guests</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                >
                  <option>1 adult · 1 room</option>
                  <option>2 adults · 1 room</option>
                  <option>2 adults · 2 rooms</option>
                  <option>Family · 1 room</option>
                  <option>Group · 3 rooms</option>
                </select>
              </div>

              <button type="submit" className="search-btn">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="home-main">
        {/* Categories */}
        <section className="category-section">
          <div className="category-row">
            {categories.map((category, index) => (
              <button className="category-chip" key={index}>
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Destinations */}
        <section className="section-block">
          <div className="section-title">
            <h2>Popular Destinations in Sri Lanka</h2>
            <p>Start your journey with the most searched cities.</p>
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
                  <button>Explore Hotels</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* More Destinations */}
        <section className="section-block">
          <div className="section-title">
            <h2>Discover Beautiful Places</h2>
            <p>Find stays near beaches, mountains, heritage cities, and more.</p>
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
                  <button>Explore Hotels</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Offers */}
        <section className="section-block">
          <div className="section-title">
            <h2>Exciting Offers</h2>
            <p>Special deals for your next Sri Lankan getaway.</p>
          </div>

          <div className="offer-grid">
            {offers.map((offer, index) => (
              <div className="offer-card" key={index}>
                <img src={offer.image} alt={offer.title} />
                <div className="offer-content">
                  <span>Limited Offer</span>
                  <h3>{offer.title}</h3>
                  <button>View Details</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partner CTA */}
        <section className="partner-cta">
          <div>
            <span>For hotel owners</span>
            <h2>List your property on TourismHub LK</h2>
            <p>
              Reach more travelers, manage bookings, and grow your hotel
              business with our partner dashboard.
            </p>
          </div>

          <Link to="/partner" className="partner-btn">
            Register Your Property
          </Link>
        </section>
      </main>
    </div>
  );
}

export default Home;