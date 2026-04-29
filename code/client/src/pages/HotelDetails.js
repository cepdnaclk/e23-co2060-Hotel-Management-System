import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./HotelDetails.css";

function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2 adults · 1 room");

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
  });

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
      price: "LKR 17,950",
      oldPrice: "LKR 35,900",
      size: "30 m²",
      guests: "2 guests",
      bed: "1 king or twin bed",
      image:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Deluxe Room",
      price: "LKR 24,450",
      oldPrice: "LKR 45,900",
      size: "40 m²",
      guests: "2 guests",
      bed: "1 king bed",
      image:
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80",
    },
  ];

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/hotels/${id}`);

        if (!response.ok) {
          throw new Error("Hotel not found");
        }

        const data = await response.json();

        if (data) {
          setHotel({
            ...getFallbackHotel(),
            ...data,
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
        <p>Loading hotel details...</p>
      </div>
    );
  }

  return (
    <div className="hotel-details-page">
      {/* Header */}
      <header className="details-header">
        <Link to="/" className="details-brand">
          <div className="details-brand-icon">🌴</div>
          <div>
            <h2>TourismHub LK</h2>
            <span>Smart Hotel & Tourism</span>
          </div>
        </Link>

        <nav className="details-nav">
          <button>🇱🇰 EN / LKR</button>
          <Link to="/help">Help</Link>
          <Link to="/partner">List your property</Link>
          <Link to="/register" className="details-outline-btn">
            Register
          </Link>
          <Link to="/login" className="details-primary-btn">
            Sign In
          </Link>
        </nav>
      </header>

      {/* Breadcrumb */}
      <div className="details-container">
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to={`/results?city=${hotel.city}`}>{hotel.city}</Link>
          <span>›</span>
          <p>{hotel.name}</p>
        </div>
      </div>

      {/* Gallery */}
      <section className="details-container">
        <div className="hotel-gallery">
          <div className="main-gallery-image">
            <img src={galleryImages[0]} alt={hotel.name} />
            <button className="favorite-btn">♡</button>
            <div className="gallery-badge">Best seller in {hotel.city}</div>
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

      {/* Tabs */}
      <section className="details-container">
        <div className="details-tabs">
          <a href="#overview">Overview</a>
          <a href="#rooms">Rooms</a>
          <a href="#dine">Dine</a>
          <a href="#events">Events</a>
          <a href="#reviews">Reviews</a>
          <a href="#policies">Policies</a>
          <a href="#contact">Contact</a>
        </div>
      </section>

      {/* Availability Bar */}
      <section className="details-container">
        <form className="details-search-bar" onSubmit={handleAvailability}>
          <div className="details-search-field destination-field">
            <label>Destination</label>
            <input type="text" value={hotel.city} readOnly />
          </div>

          <div className="details-search-field">
            <label>Check-in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>

          <div className="details-search-field">
            <label>Check-out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          <div className="details-search-field">
            <label>Guests</label>
            <select value={guests} onChange={(e) => setGuests(e.target.value)}>
              <option>1 adult · 1 room</option>
              <option>2 adults · 1 room</option>
              <option>2 adults · 2 rooms</option>
              <option>Family · 1 room</option>
              <option>Group · 3 rooms</option>
            </select>
          </div>

          <button type="submit">Check Availability</button>
        </form>
      </section>

      {/* Main Details */}
      <main className="details-container details-layout" id="overview">
        <section className="details-main-content">
          <div className="hotel-title-card">
            <div>
              <div className="hotel-type-row">
                <span>{hotel.property_type || "Hotel"}</span>
                <span>⭐ ⭐ ⭐ ⭐</span>
                {hotel.is_verified ? (
                  <span className="verified-badge">✓ Verified</span>
                ) : (
                  <span className="pending-badge">Pending Verification</span>
                )}
              </div>

              <h1>{hotel.name}</h1>

              <p className="hotel-location">
                📍 {hotel.address || `${hotel.city}, ${hotel.district}, Sri Lanka`}
              </p>
            </div>

            <div className="rating-box">
              <strong>{hotel.rating || "4.6"}</strong>
              <span>Excellent</span>
              <p>{hotel.review_count || 325} reviews</p>
            </div>
          </div>

          <p className="hotel-description">{hotel.description}</p>

          <div className="highlight-row">
            <div className="highlight-card">
              <span>🏆</span>
              <div>
                <h4>Top-rated stay</h4>
                <p>Guests love this hotel for comfort and location.</p>
              </div>
            </div>

            <div className="highlight-card">
              <span>💳</span>
              <div>
                <h4>Pay at hotel</h4>
                <p>Book now and complete payment during check-in.</p>
              </div>
            </div>

            <div className="highlight-card">
              <span>🌿</span>
              <div>
                <h4>Great location</h4>
                <p>Close to attractions, restaurants, and transport.</p>
              </div>
            </div>
          </div>

          {/* Experiences */}
          <section className="details-section" id="events">
            <div className="section-heading">
              <div>
                <h2>Experiences Near This Hotel</h2>
                <p>Discover exciting places and activities nearby.</p>
              </div>
              <Link to="/events">View all</Link>
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
                    <button>Get directions</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rooms Preview */}
          <section className="details-section" id="rooms">
            <div className="section-heading">
              <div>
                <h2>Rooms & Availability</h2>
                <p>Select dates to see available rooms and pricing.</p>
              </div>
              <button onClick={handleReserve}>View all rooms</button>
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
                    <small>{room.oldPrice}</small>
                    <strong>{room.price}</strong>
                    <p>per night</p>
                    <button onClick={handleReserve}>Reserve</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Facilities */}
          <section className="details-section" id="dine">
            <div className="section-heading">
              <div>
                <h2>Facilities</h2>
                <p>Everything you need for a comfortable stay.</p>
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

          {/* Policies */}
          <section className="details-section policies-section" id="policies">
            <div className="section-heading">
              <div>
                <h2>Policies</h2>
                <p>Please read the hotel policies before booking.</p>
              </div>
            </div>

            <div className="policy-grid">
              <div>
                <h4>Check-in</h4>
                <p>From 2:00 PM</p>
              </div>

              <div>
                <h4>Check-out</h4>
                <p>Until 11:00 AM</p>
              </div>

              <div>
                <h4>Cancellation</h4>
                <p>Free cancellation before selected policy deadline.</p>
              </div>

              <div>
                <h4>Payment</h4>
                <p>Pay at hotel option available for demo booking.</p>
              </div>
            </div>
          </section>
        </section>

        {/* Sidebar */}
        <aside className="details-sidebar">
          <div className="map-card">
            <div className="map-placeholder">
              <span>📍</span>
              <p>{hotel.city}, Sri Lanka</p>
            </div>

            <button>Show on map</button>
          </div>

          <div className="booking-card">
            <p className="booking-card-label">Starting from</p>
            <h2>LKR 17,950</h2>
            <p>per night for 2 adults</p>

            <button onClick={handleReserve}>Reserve Now</button>

            <ul>
              <li>✓ No booking fees</li>
              <li>✓ Pay at hotel available</li>
              <li>✓ Verified hotel listing</li>
            </ul>
          </div>

          <div className="support-card">
            <span>💬</span>
            <h3>Need help?</h3>
            <p>Our support team can help you with bookings and hotel details.</p>
            <button>Contact Support</button>
          </div>
        </aside>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="sticky-availability">
        <div>
          <strong>{hotel.name}</strong>
          <p>
            {checkIn || "Select check-in"} → {checkOut || "Select check-out"} ·{" "}
            {guests}
          </p>
        </div>

        <button onClick={handleReserve}>Check Availability</button>
      </div>
    </div>
  );
}

export default HotelDetails;