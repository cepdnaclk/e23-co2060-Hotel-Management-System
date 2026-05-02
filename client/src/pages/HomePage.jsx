import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

const toDateInputValue = (date) => {
  const fixedDate = new Date(date);
  fixedDate.setMinutes(fixedDate.getMinutes() - fixedDate.getTimezoneOffset());
  return fixedDate.toISOString().slice(0, 10);
};

const addDays = (dateString, days) => {
  const date = dateString ? new Date(dateString) : new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
};

const fallbackHotels = [
  {
    id: 1,
    name: "Kandy Lake Hotel",
    city: "Kandy",
    district: "Kandy",
    description: "A peaceful hotel near Kandy Lake with cultural views.",
    property_type: "Hotel",
    theme_color: "#0f766e",
    logo_url: "",
    main_photo:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    name: "Colombo City Stay",
    city: "Colombo",
    district: "Colombo",
    description: "A modern city hotel close to shopping and business areas.",
    property_type: "Hotel",
    theme_color: "#5b1235",
    logo_url: "",
    main_photo:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    name: "Ella Mountain Resort",
    city: "Ella",
    district: "Badulla",
    description: "Relax with mountain views, waterfalls, and cool weather.",
    property_type: "Resort",
    theme_color: "#166534",
    logo_url: "",
    main_photo:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  },
];

function HomePage() {
  const navigate = useNavigate();

  const todayDate = toDateInputValue(new Date());

  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

  const minimumCheckOutDate = useMemo(() => {
    return checkIn ? addDays(checkIn, 1) : addDays(todayDate, 1);
  }, [checkIn, todayDate]);

  const loadHotels = async () => {
    try {
      setLoadingHotels(true);

      const response = await api.get("/properties");

      const data =
        response.data.data ||
        response.data.properties ||
        response.data ||
        [];

      if (Array.isArray(data) && data.length > 0) {
        setHotels(data.slice(0, 6));
      } else {
        setHotels(fallbackHotels);
      }
    } catch (error) {
      console.error("Load home hotels error:", error);
      setHotels(fallbackHotels);
    } finally {
      setLoadingHotels(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  const handleCheckInChange = (event) => {
    const selectedDate = event.target.value;

    setCheckIn(selectedDate);

    if (checkOut && checkOut <= selectedDate) {
      setCheckOut("");
    }
  };

  const handleCheckOutChange = (event) => {
    setCheckOut(event.target.value);
  };

  const handleGuestsChange = (event) => {
    const value = event.target.value;
    const numberValue = Number(value);

    if (!value) {
      setGuests("");
      return;
    }

    if (numberValue < 1) {
      setGuests("1");
      return;
    }

    if (numberValue > 20) {
      setGuests("20");
      return;
    }

    setGuests(value);
  };

  const handleSearch = (event) => {
    event.preventDefault();

    if (checkIn && checkIn < todayDate) {
      alert("Check-in date cannot be a past date.");
      return;
    }

    if (checkIn && checkOut && checkOut <= checkIn) {
      alert("Check-out date must be after check-in date.");
      return;
    }

    const params = new URLSearchParams();

    if (destination.trim()) {
      params.set("destination", destination.trim());
    }

    if (checkIn) {
      params.set("check_in", checkIn);
    }

    if (checkOut) {
      params.set("check_out", checkOut);
    }

    if (guests) {
      params.set("guests", guests);
    }

    navigate(`/hotels?${params.toString()}`);
  };

  const getHotelImage = (hotel) => {
    return (
      hotel.main_photo ||
      hotel.image_url ||
      hotel.photo_url ||
      hotel.cover_image ||
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    );
  };

  const getHotelInitials = (name) => {
    return String(name || "Hotel")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroOverlay}></div>

        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>Discover Sri Lanka</div>

          <h1 style={styles.heroTitle}>
            Find beautiful hotels and stays around Sri Lanka
          </h1>

          <p style={styles.heroText}>
            Search approved properties, choose your room, and submit booking
            requests with hotel approval.
          </p>

          <form style={styles.searchBox} onSubmit={handleSearch}>
            <div style={styles.searchFieldLarge}>
              <label style={styles.searchLabel}>Destination</label>
              <input
                style={styles.searchInput}
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Kandy, Colombo, Ella..."
              />
            </div>

            <div style={styles.searchField}>
              <label style={styles.searchLabel}>Check-in</label>
              <input
                style={styles.searchInput}
                type="date"
                value={checkIn}
                min={todayDate}
                onChange={handleCheckInChange}
              />
            </div>

            <div style={styles.searchField}>
              <label style={styles.searchLabel}>Check-out</label>
              <input
                style={styles.searchInput}
                type="date"
                value={checkOut}
                min={minimumCheckOutDate}
                onChange={handleCheckOutChange}
              />
            </div>

            <div style={styles.searchFieldSmall}>
              <label style={styles.searchLabel}>Guests</label>
              <input
                style={styles.searchInput}
                type="number"
                value={guests}
                min="1"
                max="20"
                onChange={handleGuestsChange}
              />
            </div>

            <button style={styles.searchButton} type="submit">
              Search Hotels
            </button>
          </form>

          <p style={styles.dateHelpText}>
            Past dates are blocked. Check-out must be after check-in.
          </p>
        </div>
      </section>

      <section style={styles.categoriesSection}>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.sectionKicker}>Travel Categories</p>
            <h2 style={styles.sectionTitle}>Explore by your travel style</h2>
          </div>

          <Link to="/hotels" style={styles.sectionLink}>
            View all hotels →
          </Link>
        </div>

        <div style={styles.categoriesGrid}>
          {[
            "Beach",
            "Culture",
            "Nature",
            "Luxury",
            "Family",
            "Budget",
            "Adventure",
            "City Stay",
          ].map((category) => (
            <Link
              key={category}
              to={`/hotels?category=${encodeURIComponent(category)}`}
              style={styles.categoryCard}
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section style={styles.hotelsSection}>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.sectionKicker}>Approved Properties</p>
            <h2 style={styles.sectionTitle}>Popular stays for tourists</h2>
          </div>

          <Link to="/hotels" style={styles.sectionLink}>
            Explore hotels →
          </Link>
        </div>

        {loadingHotels ? (
          <div style={styles.loadingCard}>Loading hotels...</div>
        ) : (
          <div style={styles.hotelsGrid}>
            {hotels.map((hotel) => (
              <article key={hotel.id} style={styles.hotelCard}>
                <div style={styles.hotelImageBox}>
                  <img
                    src={getHotelImage(hotel)}
                    alt={hotel.name}
                    style={styles.hotelImage}
                  />

                  <div style={styles.hotelTypeBadge}>
                    {hotel.property_type || "Hotel"}
                  </div>
                </div>

                <div style={styles.hotelBody}>
                  <div style={styles.hotelTopRow}>
                    {hotel.logo_url ? (
                      <img
                        src={hotel.logo_url}
                        alt={`${hotel.name} logo`}
                        style={styles.hotelLogo}
                      />
                    ) : (
                      <div
                        style={{
                          ...styles.hotelLogoPlaceholder,
                          background: hotel.theme_color || "#0f766e",
                        }}
                      >
                        {getHotelInitials(hotel.name)}
                      </div>
                    )}

                    <div>
                      <h3 style={styles.hotelName}>{hotel.name}</h3>
                      <p style={styles.hotelLocation}>
                        {hotel.city || "Sri Lanka"}
                        {hotel.district ? `, ${hotel.district}` : ""}
                      </p>
                    </div>
                  </div>

                  <p style={styles.hotelDescription}>
                    {hotel.description ||
                      "A beautiful approved property for your Sri Lanka journey."}
                  </p>

                  <div style={styles.hotelActions}>
                    <Link to={`/hotels/${hotel.id}`} style={styles.viewButton}>
                      View Details
                    </Link>

                    <Link
                      to={`/hotels/${hotel.id}/rooms`}
                      style={styles.dealButton}
                    >
                      View Rooms
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={styles.partnerSection}>
        <div style={styles.partnerCard}>
          <div>
            <p style={styles.sectionKicker}>For Property Owners</p>
            <h2 style={styles.partnerTitle}>List your hotel on TourismHub LK</h2>
            <p style={styles.partnerText}>
              Register as a partner, add your property, create rooms with guest
              capacity and prices, then wait for admin approval.
            </p>
          </div>

          <Link to="/list-your-property" style={styles.partnerButton}>
            List your property
          </Link>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
  },

  hero: {
    minHeight: "620px",
    position: "relative",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?auto=format&fit=crop&w=1800&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
  },

  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, rgba(2, 6, 23, 0.72), rgba(15, 118, 110, 0.5))",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1180px",
    width: "100%",
    color: "#ffffff",
    textAlign: "center",
  },

  heroBadge: {
    display: "inline-block",
    background: "rgba(255, 255, 255, 0.18)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    padding: "9px 16px",
    borderRadius: "999px",
    fontWeight: "900",
    marginBottom: "18px",
    backdropFilter: "blur(8px)",
  },

  heroTitle: {
    maxWidth: "850px",
    margin: "0 auto 18px",
    fontSize: "58px",
    lineHeight: "1.05",
    fontWeight: "1000",
    letterSpacing: "-1.5px",
  },

  heroText: {
    maxWidth: "720px",
    margin: "0 auto 34px",
    fontSize: "19px",
    lineHeight: "1.6",
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },

  searchBox: {
    maxWidth: "1120px",
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "16px",
    display: "grid",
    gridTemplateColumns: "1.45fr 1fr 1fr 0.75fr 170px",
    gap: "12px",
    alignItems: "end",
    boxShadow: "0 28px 80px rgba(2, 6, 23, 0.35)",
  },

  searchFieldLarge: {
    textAlign: "left",
  },

  searchField: {
    textAlign: "left",
  },

  searchFieldSmall: {
    textAlign: "left",
  },

  searchLabel: {
    display: "block",
    color: "#334155",
    fontWeight: "900",
    fontSize: "13px",
    marginBottom: "8px",
  },

  searchInput: {
    width: "100%",
    height: "52px",
    border: "1px solid #cbd5e1",
    borderRadius: "16px",
    padding: "0 14px",
    outline: "none",
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
    background: "#ffffff",
  },

  searchButton: {
    height: "52px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #0f766e, #14b8a6)",
    color: "#ffffff",
    fontWeight: "1000",
    cursor: "pointer",
    boxShadow: "0 12px 26px rgba(15, 118, 110, 0.28)",
  },

  dateHelpText: {
    marginTop: "14px",
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "700",
    fontSize: "14px",
  },

  categoriesSection: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "56px 20px 20px",
  },

  hotelsSection: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "36px 20px 30px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "22px",
  },

  sectionKicker: {
    margin: "0 0 8px",
    color: "#0f766e",
    fontWeight: "1000",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    fontSize: "13px",
  },

  sectionTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "34px",
    lineHeight: "1.15",
  },

  sectionLink: {
    color: "#0f766e",
    fontWeight: "900",
    textDecoration: "none",
  },

  categoriesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "14px",
  },

  categoryCard: {
    background: "#ffffff",
    color: "#0f172a",
    textDecoration: "none",
    padding: "20px",
    borderRadius: "20px",
    fontWeight: "1000",
    border: "1px solid #e5e7eb",
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.06)",
    transition: "0.2s ease",
  },

  loadingCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "20px",
    fontWeight: "900",
    color: "#0f172a",
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.06)",
  },

  hotelsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "22px",
  },

  hotelCard: {
    background: "#ffffff",
    borderRadius: "24px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
  },

  hotelImageBox: {
    height: "210px",
    position: "relative",
    overflow: "hidden",
  },

  hotelImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  hotelTypeBadge: {
    position: "absolute",
    top: "14px",
    right: "14px",
    background: "rgba(255, 255, 255, 0.92)",
    color: "#0f766e",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "1000",
  },

  hotelBody: {
    padding: "20px",
  },

  hotelTopRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },

  hotelLogo: {
    width: "52px",
    height: "52px",
    objectFit: "contain",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    padding: "6px",
    background: "#ffffff",
  },

  hotelLogoPlaceholder: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "1000",
  },

  hotelName: {
    margin: "0 0 4px",
    color: "#0f172a",
    fontSize: "20px",
  },

  hotelLocation: {
    margin: 0,
    color: "#0f766e",
    fontWeight: "900",
  },

  hotelDescription: {
    color: "#64748b",
    lineHeight: "1.55",
    fontWeight: "600",
    minHeight: "50px",
  },

  hotelActions: {
    display: "flex",
    gap: "10px",
    marginTop: "18px",
  },

  viewButton: {
    flex: 1,
    textAlign: "center",
    background: "#f1f5f9",
    color: "#0f172a",
    textDecoration: "none",
    padding: "12px",
    borderRadius: "14px",
    fontWeight: "1000",
  },

  dealButton: {
    flex: 1,
    textAlign: "center",
    background: "#0f766e",
    color: "#ffffff",
    textDecoration: "none",
    padding: "12px",
    borderRadius: "14px",
    fontWeight: "1000",
  },

  partnerSection: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "30px 20px 70px",
  },

  partnerCard: {
    background: "linear-gradient(135deg, #0f766e, #115e59)",
    color: "#ffffff",
    borderRadius: "28px",
    padding: "34px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    boxShadow: "0 24px 70px rgba(15, 118, 110, 0.24)",
  },

  partnerTitle: {
    margin: "0 0 10px",
    fontSize: "32px",
  },

  partnerText: {
    margin: 0,
    maxWidth: "720px",
    color: "rgba(255, 255, 255, 0.88)",
    fontWeight: "600",
    lineHeight: "1.6",
  },

  partnerButton: {
    background: "#ffffff",
    color: "#0f766e",
    textDecoration: "none",
    padding: "14px 20px",
    borderRadius: "16px",
    fontWeight: "1000",
    whiteSpace: "nowrap",
  },
};

export default HomePage;