import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/api";

const fallbackRoomImage =
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80";

const fallbackHotelImage =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80";

function RoomAvailabilityPage() {
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const themeColor = property?.theme_color || "#0f766e";

  const theme = useMemo(() => {
    return {
      main: themeColor,
      dark: shadeColor(themeColor, -28),
      light: shadeColor(themeColor, 88),
      soft: shadeColor(themeColor, 75),
    };
  }, [themeColor]);

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString("en-LK")}`;
  };

  const pluralGuest = (count) => {
    return Number(count) === 1 ? "guest" : "guests";
  };

  const pluralRoom = (count) => {
    return Number(count) === 1 ? "room" : "rooms";
  };

  const getInitials = (name) => {
    return String(name || "Hotel")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const getPropertyImage = () => {
    return (
      property?.main_photo ||
      property?.main_image ||
      property?.image_url ||
      property?.photo_url ||
      fallbackHotelImage
    );
  };

  const getRoomImage = (room) => {
    return (
      room?.main_image ||
      room?.image_url ||
      room?.photo_url ||
      room?.room_photo ||
      fallbackRoomImage
    );
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [propertyResponse, roomsResponse] = await Promise.all([
        api.get(`/properties/${id}`),
        api.get(`/properties/${id}/rooms`),
      ]);

      const propertyData =
        propertyResponse.data.data ||
        propertyResponse.data.property ||
        propertyResponse.data;

      const roomsData =
        roomsResponse.data.data ||
        roomsResponse.data.rooms ||
        roomsResponse.data ||
        [];

      setProperty(propertyData);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
    } catch (error) {
      console.error("Load rooms page error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load rooms. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>Loading rooms...</div>
        </div>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <h2>Rooms not found</h2>
            <p>{error || "Property details could not be loaded."}</p>

            <Link to="/hotels" style={styles.backButton}>
              Back to Hotels
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        ...styles.page,
        background: `linear-gradient(135deg, ${theme.light}, #f8fafc 45%, #ffffff)`,
      }}
    >
      <section
        style={{
          ...styles.hero,
          backgroundImage: `linear-gradient(135deg, rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.35)), url('${getPropertyImage()}')`,
        }}
      >
        <div style={styles.heroContainer}>
          <div style={styles.topRow}>
            <Link to={`/hotels/${property.id}`} style={styles.backLink}>
              ← Back to Hotel Details
            </Link>

            <span
              style={{
                ...styles.statusPill,
                background: property.is_verified ? "#dcfce7" : "#fef3c7",
                color: property.is_verified ? "#166534" : "#92400e",
              }}
            >
              {property.is_verified ? "Verified Hotel" : "Pending Verification"}
            </span>
          </div>

          <div style={styles.heroContent}>
            <div style={styles.logoWrap}>
              {property.logo_url ? (
                <img
                  src={property.logo_url}
                  alt={`${property.name} logo`}
                  style={styles.logo}
                />
              ) : (
                <div
                  style={{
                    ...styles.logoPlaceholder,
                    background: theme.main,
                  }}
                >
                  {getInitials(property.name)}
                </div>
              )}
            </div>

            <div>
              <p style={styles.kicker}>Rooms & Availability</p>

              <h1 style={styles.title}>{property.name} Rooms</h1>

              <p style={styles.subtitle}>
                {property.address || property.city}
                {property.district ? `, ${property.district}` : ""}
              </p>

              <p style={styles.heroText}>
                Choose a room category, check availability, review guest
                capacity, and continue to booking.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.container}>
        <div style={styles.summaryBand}>
          <div>
            <span style={styles.summaryLabel}>Hotel</span>
            <strong>{property.name}</strong>
          </div>

          <div>
            <span style={styles.summaryLabel}>Location</span>
            <strong>
              {property.city}
              {property.district ? `, ${property.district}` : ""}
            </strong>
          </div>

          <div>
            <span style={styles.summaryLabel}>Room Categories</span>
            <strong>{rooms.length}</strong>
          </div>

          <div>
            <span style={styles.summaryLabel}>Brand Theme</span>
            <strong style={{ color: theme.main }}>Hotel branded page</strong>
          </div>
        </div>

        {rooms.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2>No rooms available yet</h2>
            <p>
              This hotel has not added room categories yet. Please check again
              later.
            </p>
          </div>
        ) : (
          <div style={styles.roomsList}>
            {rooms.map((room) => {
              const availableRooms = Number(room.available_rooms || 0);
              const totalRooms = Number(room.total_rooms || 0);
              const capacity = Number(room.capacity || 1);
              const baseOccupancy = Number(room.base_occupancy || 1);
              const basePrice = Number(room.price_per_night || 0);
              const extraPersonPrice = Number(room.extra_person_price || 0);
              const isSoldOut = availableRooms <= 0;

              return (
                <article
                  key={room.id}
                  style={{
                    ...styles.roomCard,
                    borderColor: isSoldOut ? "#fecaca" : theme.soft,
                  }}
                >
                  <div style={styles.imageColumn}>
                    <img
                      src={getRoomImage(room)}
                      alt={room.room_type}
                      style={styles.roomImage}
                    />

                    <div
                      style={{
                        ...styles.imageBadge,
                        background: isSoldOut ? "#dc2626" : theme.main,
                      }}
                    >
                      {isSoldOut
                        ? "Fully Booked"
                        : `${availableRooms} ${pluralRoom(
                            availableRooms
                          )} left`}
                    </div>
                  </div>

                  <div style={styles.roomMiddle}>
                    <div style={styles.roomHeader}>
                      <div>
                        <h2 style={styles.roomTitle}>{room.room_type}</h2>

                        <p style={styles.roomSubText}>
                          Comfortable stay option from {property.name}
                        </p>
                      </div>

                      <div style={styles.iconRow}>
                        <span style={styles.iconPill}>
                          👥 {capacity} {pluralGuest(capacity)}
                        </span>
                        <span style={styles.iconPill}>🛏️ Room</span>
                      </div>
                    </div>

                    <div style={styles.featuresGrid}>
                      <div style={styles.featureBox}>
                        <span style={styles.featureLabel}>Maximum Guests</span>
                        <strong style={styles.featureValue}>
                          {capacity} {pluralGuest(capacity)}
                        </strong>
                      </div>

                      <div style={styles.featureBox}>
                        <span style={styles.featureLabel}>
                          Base Guests Included
                        </span>
                        <strong style={styles.featureValue}>
                          {baseOccupancy} {pluralGuest(baseOccupancy)}
                        </strong>
                      </div>

                      <div style={styles.featureBox}>
                        <span style={styles.featureLabel}>Total Rooms</span>
                        <strong style={styles.featureValue}>
                          {totalRooms} {pluralRoom(totalRooms)}
                        </strong>
                      </div>

                      <div style={styles.featureBox}>
                        <span style={styles.featureLabel}>Available Rooms</span>
                        <strong
                          style={{
                            ...styles.featureValue,
                            color: isSoldOut ? "#dc2626" : "#15803d",
                          }}
                        >
                          {availableRooms} {pluralRoom(availableRooms)}
                        </strong>
                      </div>
                    </div>

                    <div style={styles.priceRuleBox}>
                      <strong>Price Rule</strong>
                      <p>
                        The base price includes {baseOccupancy}{" "}
                        {pluralGuest(baseOccupancy)}. Each extra guest costs{" "}
                        {formatCurrency(extraPersonPrice)} per night.
                      </p>
                    </div>

                    {isSoldOut && (
                      <div style={styles.soldOutNotice}>
                        This room category is fully booked. Please choose
                        another room category from this hotel.
                      </div>
                    )}
                  </div>

                  <div style={styles.priceColumn}>
                    <span style={styles.priceLabel}>Base price / night</span>

                    <strong
                      style={{
                        ...styles.price,
                        color: theme.dark,
                      }}
                    >
                      {formatCurrency(basePrice)}
                    </strong>

                    {room.price_per_day && (
                      <span style={styles.dayPrice}>
                        Day price: {formatCurrency(room.price_per_day)}
                      </span>
                    )}

                    <span style={styles.taxText}>Price set by hotel partner</span>

                    {isSoldOut ? (
                      <button style={styles.disabledButton} disabled>
                        Fully Booked
                      </button>
                    ) : (
                      <Link
                        to={`/booking?propertyId=${property.id}&roomId=${room.id}`}
                        style={{
                          ...styles.bookButton,
                          background: theme.main,
                        }}
                      >
                        Book This Room
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

const shadeColor = (hex, percent) => {
  let cleanHex = String(hex || "#0f766e").replace("#", "");

  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (cleanHex.length !== 6) {
    cleanHex = "0f766e";
  }

  const numberValue = parseInt(cleanHex, 16);

  let r = (numberValue >> 16) & 255;
  let g = (numberValue >> 8) & 255;
  let b = numberValue & 255;

  if (percent >= 0) {
    r = Math.round(r + (255 - r) * (percent / 100));
    g = Math.round(g + (255 - g) * (percent / 100));
    b = Math.round(b + (255 - b) * (percent / 100));
  } else {
    const positivePercent = Math.abs(percent);
    r = Math.round(r * (1 - positivePercent / 100));
    g = Math.round(g * (1 - positivePercent / 100));
    b = Math.round(b * (1 - positivePercent / 100));
  }

  return `rgb(${r}, ${g}, ${b})`;
};

const styles = {
  page: {
    minHeight: "100vh",
    paddingBottom: "70px",
  },

  container: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "0 20px",
  },

  hero: {
    minHeight: "390px",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    marginBottom: "34px",
    boxShadow: "0 18px 60px rgba(15, 23, 42, 0.18)",
  },

  heroContainer: {
    maxWidth: "1180px",
    width: "100%",
    margin: "0 auto",
    padding: "34px 20px",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "34px",
  },

  backLink: {
    color: "#ffffff",
    background: "rgba(255, 255, 255, 0.16)",
    border: "1px solid rgba(255, 255, 255, 0.24)",
    padding: "10px 15px",
    borderRadius: "999px",
    textDecoration: "none",
    fontWeight: "900",
    backdropFilter: "blur(8px)",
  },

  statusPill: {
    padding: "10px 15px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "13px",
  },

  heroContent: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },

  logoWrap: {
    width: "112px",
    height: "112px",
    background: "rgba(255, 255, 255, 0.92)",
    borderRadius: "28px",
    padding: "10px",
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.24)",
  },

  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    borderRadius: "20px",
  },

  logoPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: "20px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "1000",
  },

  kicker: {
    margin: "0 0 8px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontSize: "13px",
    fontWeight: "1000",
    color: "rgba(255, 255, 255, 0.85)",
  },

  title: {
    margin: "0 0 10px",
    fontSize: "50px",
    lineHeight: "1.05",
    fontWeight: "1000",
  },

  subtitle: {
    margin: "0 0 12px",
    fontSize: "19px",
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.92)",
  },

  heroText: {
    maxWidth: "720px",
    margin: 0,
    color: "rgba(255, 255, 255, 0.84)",
    fontWeight: "600",
    lineHeight: "1.6",
  },

  summaryBand: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "20px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "18px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
    marginBottom: "24px",
  },

  summaryLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: "6px",
  },

  roomsList: {
    display: "grid",
    gap: "22px",
  },

  roomCard: {
    background: "#ffffff",
    borderRadius: "26px",
    overflow: "hidden",
    border: "1px solid",
    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
    display: "grid",
    gridTemplateColumns: "310px 1fr 250px",
    minHeight: "265px",
  },

  imageColumn: {
    position: "relative",
    minHeight: "265px",
    overflow: "hidden",
  },

  roomImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  imageBadge: {
    position: "absolute",
    top: "16px",
    left: "16px",
    color: "#ffffff",
    padding: "9px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "1000",
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.18)",
  },

  roomMiddle: {
    padding: "28px",
  },

  roomHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "20px",
  },

  roomTitle: {
    margin: "0 0 7px",
    color: "#0f172a",
    fontSize: "27px",
    fontWeight: "1000",
  },

  roomSubText: {
    margin: 0,
    color: "#64748b",
    fontWeight: "700",
  },

  iconRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  iconPill: {
    background: "#f1f5f9",
    color: "#0f172a",
    padding: "8px 11px",
    borderRadius: "12px",
    fontWeight: "900",
    fontSize: "13px",
  },

  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginBottom: "16px",
  },

  featureBox: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px 16px",
    minHeight: "76px",
  },

  featureLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "900",
    marginBottom: "8px",
  },

  featureValue: {
    display: "block",
    color: "#0f172a",
    fontSize: "18px",
    fontWeight: "1000",
    lineHeight: "1.25",
  },

  priceRuleBox: {
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
    borderRadius: "16px",
    padding: "14px 16px",
    fontWeight: "700",
    lineHeight: "1.5",
  },

  soldOutNotice: {
    marginTop: "12px",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "14px",
    fontWeight: "800",
  },

  priceColumn: {
    padding: "28px",
    borderLeft: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    textAlign: "right",
    gap: "10px",
  },

  priceLabel: {
    color: "#64748b",
    fontWeight: "800",
  },

  price: {
    fontSize: "34px",
    fontWeight: "1000",
    letterSpacing: "-0.5px",
  },

  dayPrice: {
    color: "#64748b",
    fontWeight: "700",
  },

  taxText: {
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "700",
  },

  bookButton: {
    marginTop: "18px",
    color: "#ffffff",
    textDecoration: "none",
    padding: "15px 22px",
    borderRadius: "16px",
    fontWeight: "1000",
    fontSize: "16px",
    boxShadow: "0 14px 28px rgba(15, 23, 42, 0.18)",
  },

  disabledButton: {
    marginTop: "18px",
    background: "#94a3b8",
    color: "#ffffff",
    border: "none",
    padding: "15px 22px",
    borderRadius: "16px",
    fontWeight: "1000",
    fontSize: "16px",
    cursor: "not-allowed",
  },

  emptyCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "34px",
    textAlign: "center",
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
  },

  loadingCard: {
    background: "#ffffff",
    padding: "26px",
    borderRadius: "22px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
    fontWeight: "900",
    color: "#0f172a",
  },

  errorCard: {
    background: "#ffffff",
    padding: "34px",
    borderRadius: "24px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
    textAlign: "center",
  },

  backButton: {
    display: "inline-block",
    marginTop: "16px",
    background: "#0f766e",
    color: "#ffffff",
    padding: "12px 18px",
    borderRadius: "14px",
    textDecoration: "none",
    fontWeight: "900",
  },
};

export default RoomAvailabilityPage;