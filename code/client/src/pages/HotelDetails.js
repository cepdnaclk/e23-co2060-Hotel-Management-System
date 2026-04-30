import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./HotelDetails.css";
import LanguageCurrencySelector from "../components/LanguageCurrencySelector";
import { useAppSettings } from "../context/AppSettingsContext";

function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, formatPrice } = useAppSettings();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2 adults · 1 room");

  const galleryImages = [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80",
  ];

  const experiences = [
    {
      title: "Kandy Esala Perahera",
      location: "Kandy",
      distance: "1.2 km away",
      tag: "Cultural",
      image:
        "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Royal Botanic Gardens",
      location: "Peradeniya",
      distance: "3 km away",
      tag: "Nature",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Lake Kandy Boat Rides",
      location: "Kandy Lake",
      distance: "1.5 km away",
      tag: "Relax",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    },
  ];

  const facilities = [
    { icon: "📶", name: "Free Wi-Fi" },
    { icon: "🍳", name: "Breakfast Included" },
    { icon: "🏊", name: "Outdoor Pool" },
    { icon: "🅿️", name: "Free Parking" },
    { icon: "❄️", name: "Air Conditioning" },
    { icon: "🍽️", name: "Restaurant" },
    { icon: "🛎️", name: "24/7 Front Desk" },
    { icon: "🚕", name: "Airport Shuttle" },
  ];

  const rooms = [
    {
      name: "Standard Room",
      price: 17950,
      oldPrice: 35900,
      size: "30 m²",
      guests: "2 guests",
      bed: "1 king or twin bed",
      image:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Deluxe Room",
      price: 24450,
      oldPrice: 45900,
      size: "40 m²",
      guests: "2 guests",
      bed: "1 king bed",
      image:
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80",
    },
  ];

  useEffect(() => {
    const getFallbackHotel = () => ({
      hotel_id: id || 1,
      name: "Heeran Gardens House",
      city: "Kandy",
      district: "Kandy",
      address: "Kandy City Center, Sri Lanka",
      description:
        "A serene boutique hotel in Sri Lanka featuring beautiful tropical surroundings, comfortable rooms, mountain views, authentic dining, and easy access to popular attractions.",
      property_type: "Hotel",
      is_verified: true,
      rating: "4.6",
      review_count: 325,
      starting_price: 17950,
    });

    const normalizeVerified = (value) => {
      return value === true || value === 1 || value === "1";
    };

    const fetchHotelDetails = async () => {
      try {
        setLoading(true);

        const response = await fetch(`http://localhost:5000/api/hotels/${id}`);

        if (!response.ok) {
          throw new Error("Hotel not found");
        }

        const data = await response.json();

        if (data) {
          setHotel({
            ...getFallbackHotel(),
            ...data,
            is_verified: normalizeVerified(data.is_verified),
            starting_price:
              data.starting_price ||
              data.base_price_per_night ||
              data.price ||
              17950,
          });
        } else {
          setHotel(getFallbackHotel());
        }
      } catch (error) {
        console.log("Using fallback hotel details:", error.message);
        setHotel(getFallbackHotel());
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [id]);

  const handleAvailability = (e) => {
    e.preventDefault();

    navigate(
      `/hotel/${hotel.hotel_id}/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${encodeURIComponent(
        guests
      )}`
    );
  };

  const handleReserve = () => {
    navigate(
      `/hotel/${hotel.hotel_id}/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${encodeURIComponent(
        guests
      )}`
    );
  };

  if (loading) {
    return (
      <div className="details-loading">
        <div className="loader"></div>
        <p>{t("loadingHotel")}</p>
      </div>
    );
  }

  return (
    <div className="hotel-details-page">
      <header className="details-header">
        <Link to="/" className="details-brand">
          <div className="details-brand-icon">🌴</div>
          <div>
            <h2>TourismHub LK</h2>
            <span>Smart Hotel & Tourism</span>
          </div>
        </Link>

        <nav className="details-nav">
          <LanguageCurrencySelector />
          <Link to="/help">{t("help")}</Link>
          <Link to="/partner">{t("listProperty")}</Link>
          <Link to="/register" className="details-outline-btn">
            {t("register")}
          </Link>
          <Link to="/login" className="details-primary-btn">
            {t("signIn")}
          </Link>
        </nav>
      </header>

      <div className="details-container">
        <div className="breadcrumb">
          <Link to="/">{t("home")}</Link>
          <span>›</span>
          <Link to={`/results?city=${hotel.city}`}>{hotel.city}</Link>
          <span>›</span>
          <p>{hotel.name}</p>
        </div>
      </div>

      <section className="details-container">
        <div className="hotel-gallery">
          <div className="main-gallery-image">
            <img src={galleryImages[0]} alt={hotel.name} />
            <button type="button" className="favorite-btn">
              ♡
            </button>
            <div className="gallery-badge">
              {t("bestSeller")} {hotel.city}
            </div>
          </div>

          <div className="small-gallery-grid">
            {galleryImages.slice(1).map((image, index) => (
              <div className="small-gallery-image" key={index}>
                <img src={image} alt={`${hotel.name} ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="details-container">
        <div className="details-tabs">
          <a href="#overview">{t("overview")}</a>
          <a href="#rooms">{t("rooms")}</a>
          <a href="#dine">{t("dine")}</a>
          <a href="#events">{t("events")}</a>
          <a href="#reviews">{t("reviews")}</a>
          <a href="#policies">{t("policies")}</a>
          <a href="#contact">{t("contact")}</a>
        </div>
      </section>

      <section className="details-container">
        <form className="details-search-bar" onSubmit={handleAvailability}>
          <div className="details-search-field destination-field">
            <label>{t("destination")}</label>
            <input type="text" value={hotel.city} readOnly />
          </div>

          <div className="details-search-field">
            <label>{t("checkIn")}</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>

          <div className="details-search-field">
            <label>{t("checkOut")}</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          <div className="details-search-field">
            <label>{t("guests")}</label>
            <select value={guests} onChange={(e) => setGuests(e.target.value)}>
              <option>1 adult · 1 room</option>
              <option>2 adults · 1 room</option>
              <option>2 adults · 2 rooms</option>
              <option>Family · 1 room</option>
              <option>Group · 3 rooms</option>
            </select>
          </div>

          <button type="submit">{t("checkAvailability")}</button>
        </form>
      </section>

      <main className="details-container details-layout" id="overview">
        <section className="details-main-content">
          <div className="hotel-title-card">
            <div>
              <div className="hotel-type-row">
                <span>{hotel.property_type || "Hotel"}</span>
                <span>⭐ ⭐ ⭐ ⭐</span>
                {hotel.is_verified ? (
                  <span className="verified-badge">✓ {t("verified")}</span>
                ) : (
                  <span className="pending-badge">
                    {t("pendingVerification")}
                  </span>
                )}
              </div>

              <h1>{hotel.name}</h1>

              <p className="hotel-location">
                📍{" "}
                {hotel.address ||
                  `${hotel.city}, ${hotel.district}, Sri Lanka`}
              </p>
            </div>

            <div className="rating-box">
              <strong>{hotel.rating || "4.6"}</strong>
              <span>{t("excellent")}</span>
              <p>
                {hotel.review_count || 325} {t("reviewText")}
              </p>
            </div>
          </div>

          <p className="hotel-description">{hotel.description}</p>

          <div className="highlight-row">
            <div className="highlight-card">
              <span>🏆</span>
              <div>
                <h4>{t("topRatedStay")}</h4>
                <p>{t("topRatedDesc")}</p>
              </div>
            </div>

            <div className="highlight-card">
              <span>💳</span>
              <div>
                <h4>{t("payAtHotel")}</h4>
                <p>{t("payAtHotelDesc")}</p>
              </div>
            </div>

            <div className="highlight-card">
              <span>🌿</span>
              <div>
                <h4>{t("greatLocation")}</h4>
                <p>{t("greatLocationDesc")}</p>
              </div>
            </div>
          </div>

          <section className="details-section" id="events">
            <div className="section-heading">
              <div>
                <h2>{t("experiencesNearHotel")}</h2>
                <p>{t("experiencesDesc")}</p>
              </div>
              <Link to="/events">{t("viewAll")}</Link>
            </div>

            <div className="experience-grid">
              {experiences.map((item, index) => (
                <div className="experience-card" key={index}>
                  <img src={item.image} alt={item.title} />
                  <div className="experience-content">
                    <span>{item.tag}</span>
                    <h3>{item.title}</h3>
                    <p>
                      {item.location} · {item.distance}
                    </p>
                    <button type="button">{t("getDirections")}</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="details-section" id="rooms">
            <div className="section-heading">
              <div>
                <h2>{t("roomsAvailability")}</h2>
                <p>{t("roomsAvailabilityDesc")}</p>
              </div>
              <button type="button" onClick={handleReserve}>
                {t("viewAllRooms")}
              </button>
            </div>

            <div className="rooms-preview-list">
              {rooms.map((room, index) => (
                <div className="room-preview-card" key={index}>
                  <img src={room.image} alt={room.name} />

                  <div className="room-preview-info">
                    <h3>{room.name}</h3>
                    <p>
                      👥 {room.guests} · 🛏️ {room.bed} · 📐 {room.size}
                    </p>

                    <div className="room-tags">
                      <span>Free Wi-Fi</span>
                      <span>Breakfast</span>
                      <span>Non-smoking</span>
                    </div>
                  </div>

                  <div className="room-price-box">
                    <small>{formatPrice(room.oldPrice)}</small>
                    <strong>{formatPrice(room.price)}</strong>
                    <p>{t("perNight")}</p>
                    <button type="button" onClick={handleReserve}>
                      {t("reserve")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="details-section" id="dine">
            <div className="section-heading">
              <div>
                <h2>{t("facilities")}</h2>
                <p>{t("facilitiesDesc")}</p>
              </div>
            </div>

            <div className="facility-grid">
              {facilities.map((facility, index) => (
                <div className="facility-card" key={index}>
                  <span>{facility.icon}</span>
                  <p>{facility.name}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="details-section policies-section" id="policies">
            <div className="section-heading">
              <div>
                <h2>{t("policies")}</h2>
                <p>{t("policiesDesc")}</p>
              </div>
            </div>

            <div className="policy-grid">
              <div>
                <h4>{t("checkIn")}</h4>
                <p>From 2:00 PM</p>
              </div>

              <div>
                <h4>{t("checkOut")}</h4>
                <p>Until 11:00 AM</p>
              </div>

              <div>
                <h4>{t("cancellation")}</h4>
                <p>{t("cancellationDesc")}</p>
              </div>

              <div>
                <h4>{t("payment")}</h4>
                <p>{t("paymentDesc")}</p>
              </div>
            </div>
          </section>
        </section>

        <aside className="details-sidebar">
          <div className="map-card">
            <div className="map-placeholder">
              <span>📍</span>
              <p>{hotel.city}, Sri Lanka</p>
            </div>

            <button type="button">{t("showOnMap")}</button>
          </div>

          <div className="booking-card">
            <p className="booking-card-label">{t("startingFrom")}</p>
            <h2>{formatPrice(hotel.starting_price || 17950)}</h2>
            <p>{t("perNightForTwo")}</p>

            <button type="button" onClick={handleReserve}>
              {t("reserveNow")}
            </button>

            <ul>
              <li>✓ {t("noBookingFees")}</li>
              <li>✓ {t("payAtHotelAvailable")}</li>
              <li>✓ {t("verifiedHotelListing")}</li>
            </ul>
          </div>

          <div className="support-card">
            <span>💬</span>
            <h3>{t("needHelp")}</h3>
            <p>{t("supportText")}</p>
            <button type="button">{t("contactSupport")}</button>
          </div>
        </aside>
      </main>

      <div className="sticky-availability">
        <div>
          <strong>{hotel.name}</strong>
          <p>
            {checkIn || t("selectCheckIn")} →{" "}
            {checkOut || t("selectCheckOut")} · {guests}
          </p>
        </div>

        <button type="button" onClick={handleReserve}>
          {t("checkAvailability")}
        </button>
      </div>
    </div>
  );
}

export default HotelDetails;