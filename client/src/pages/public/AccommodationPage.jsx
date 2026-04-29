import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AccommodationPage() {
  const navigate = useNavigate();

  const [searchData, setSearchData] = useState({
    destination: "",
    checkIn: "2026-05-18",
    checkOut: "2026-05-19",
    guests: "2",
    guestText: "2 adults · 1 room",
  });

  const categories = [
    "Popular",
    "Beach",
    "Cultural",
    "Nature",
    "Luxury",
    "Budget",
    "Festivals",
  ];

  const destinations = [
    {
      name: "Colombo",
      description: "City hotels, shopping, and nightlife",
      image:
        "https://images.unsplash.com/photo-1575994532957-773da2f935fb?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Kandy",
      description: "Culture, lake views, and hill country",
      image:
        "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Ella",
      description: "Mountains, waterfalls, and nature",
      image:
        "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Galle",
      description: "Fort, beaches, and colonial history",
      image:
        "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=900&q=80",
    },
  ];

  const offers = [
    {
      title: "Save up to 20% on early bookings",
      text: "Book your Sri Lanka stay early and save more.",
    },
    {
      title: "Weekend stay offers",
      text: "Find special deals for short trips and holidays.",
    },
  ];

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "guests") {
      setSearchData((currentData) => ({
        ...currentData,
        guests: value,
        guestText: `${value} adult${Number(value) > 1 ? "s" : ""} · 1 room`,
      }));
      return;
    }

    setSearchData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function saveSearchAndNavigate(finalSearchData) {
    localStorage.setItem(
      "tourismhub_search_data",
      JSON.stringify(finalSearchData)
    );

    localStorage.setItem("tourismhub_check_in", finalSearchData.checkIn);
    localStorage.setItem("tourismhub_check_out", finalSearchData.checkOut);
    localStorage.setItem("tourismhub_guests", finalSearchData.guests);
    localStorage.setItem("tourismhub_guest_text", finalSearchData.guestText);

    navigate("/hotels");
  }

  function handleSearch() {
    const destination = searchData.destination.trim() || "Sri Lanka";

    const finalSearchData = {
      ...searchData,
      destination,
    };

    saveSearchAndNavigate(finalSearchData);
  }

  function handleDestinationClick(destinationName) {
    const finalSearchData = {
      ...searchData,
      destination: destinationName,
    };

    saveSearchAndNavigate(finalSearchData);
  }

  return (
    <div className="home-page">
      <section className="hero-section accommodation-hero-section">
        <div className="hero-overlay">
          <p className="eyebrow">Accommodation</p>
          <h1>Find the perfect place to stay in Sri Lanka</h1>
          <p>
            Search hotels, resorts, villas, and guest houses by destination,
            dates, and guests.
          </p>

          <div className="search-box home-search-box">
            <input
              type="text"
              name="destination"
              placeholder="Where are you going? Colombo, Kandy, Ella..."
              value={searchData.destination}
              onChange={handleChange}
            />

            <input
              type="date"
              name="checkIn"
              value={searchData.checkIn}
              onChange={handleChange}
            />

            <input
              type="date"
              name="checkOut"
              value={searchData.checkOut}
              onChange={handleChange}
            />

            <select
              name="guests"
              value={searchData.guests}
              onChange={handleChange}
            >
              <option value="1">1 adult · 1 room</option>
              <option value="2">2 adults · 1 room</option>
              <option value="3">3 adults · 1 room</option>
              <option value="4">4 adults · 1 room</option>
            </select>

            <button
              type="button"
              className="search-button"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="category-section">
        {categories.map((category) => (
          <button key={category} className="category-chip">
            {category}
          </button>
        ))}
      </section>

      <section className="section-block">
        <div className="section-title-row">
          <h2>Popular accommodation destinations</h2>
          <Link to="/hotels">View all hotels</Link>
        </div>

        <div className="destination-grid">
          {destinations.map((destination) => (
            <div
              className="destination-card"
              key={destination.name}
              style={{ backgroundImage: `url(${destination.image})` }}
            >
              <div className="destination-content">
                <h3>{destination.name}</h3>
                <p>{destination.description}</p>

                <button
                  type="button"
                  className="destination-explore-button"
                  onClick={() => handleDestinationClick(destination.name)}
                >
                  Explore hotels
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-block">
        <h2>Accommodation offers</h2>

        <div className="offer-grid">
          {offers.map((offer) => (
            <div className="offer-card" key={offer.title}>
              <h3>{offer.title}</h3>
              <p>{offer.text}</p>
              <Link to="/hotels">View deals</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AccommodationPage;