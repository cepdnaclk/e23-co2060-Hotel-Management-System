import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/api";

function HotelDetailsPage() {
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProperty = async () => {
    try {
      const propertyResponse = await api.get(`/properties/${id}`);
      const roomsResponse = await api.get(`/properties/${id}/rooms`);

      setProperty(propertyResponse.data.data);
      setRooms(roomsResponse.data.data || []);
    } catch (error) {
      console.error("Load property details error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <p>Loading hotel details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="page">
        <div className="card" style={styles.emptyCard}>
          <h2>Hotel not found</h2>
          <p>This hotel may not be approved yet.</p>
          <Link to="/hotels" className="btn-primary">
            Back to Hotels
          </Link>
        </div>
      </div>
    );
  }

  const propertyPhotos = property.photos || [];

  const mainPhoto = propertyPhotos.find((photo) => photo.is_main);
  const mainImage = mainPhoto?.image_url || "";

  const introImageOne =
    propertyPhotos.find((photo) => !photo.is_main)?.image_url || "";

  const introImageTwo =
    propertyPhotos.filter((photo) => !photo.is_main)?.[1]?.image_url || "";

  const logoUrl =
    property.logo_url ||
    "https://dummyimage.com/180x180/ffffff/111827.png&text=HOTEL";

  const themeColor = property.theme_color || "#5b1235";

  /*
    Important:
    Manage Property now goes to password verification page first.
    After password success, PropertyLoginPage will redirect to:
    /partner/properties/:id
  */
  const managePropertyLink = `/partner/property-login/${property.id}`;

  return (
    <div style={styles.site}>
      <header style={styles.hotelNav}>
        <Link to="/hotels" style={styles.backLink}>
          ← Hotels
        </Link>

        <img src={logoUrl} alt={property.name} style={styles.logo} />

        <div style={styles.navRight}>
          <Link to={`/hotels/${property.id}/rooms`} style={styles.menuText}>
            Rooms
          </Link>

          <Link to={managePropertyLink} style={styles.manageBtn}>
            Manage Property
          </Link>

          <Link
            to={`/hotels/${property.id}/rooms`}
            style={{ ...styles.reserveBtn, borderColor: themeColor }}
          >
            Reserve
          </Link>
        </div>
      </header>

      <section style={styles.hero}>
        {mainImage ? (
          <img src={mainImage} alt={property.name} style={styles.heroImage} />
        ) : (
          <div style={styles.emptyHeroImage}>
            No hotel main photo uploaded yet
          </div>
        )}

        <div style={styles.heroOverlay}>
          <img src={logoUrl} alt={property.name} style={styles.heroLogo} />

          <p style={styles.heroQuote}>
            {property.quote || "Add hotel quote from property management"}
          </p>

          <h1 style={styles.heroTitle}>
            {property.hero_title || property.name}
          </h1>

          <p style={styles.heroLocation}>
            {property.city}, {property.district}
          </p>
        </div>
      </section>

      <section style={styles.reserveStrip}>
        <div style={styles.reserveInfo}>
          <p>Book directly and enjoy the best available rooms and rates.</p>
        </div>

        <Link
          to={`/hotels/${property.id}/rooms`}
          style={{ ...styles.reserveNow, background: themeColor }}
        >
          Reserve Now
        </Link>
      </section>

      <section style={styles.introSection}>
        <div style={styles.introText}>
          <p style={styles.welcome}>Welcome to</p>
          <h2>{property.name}</h2>
          <p>{property.description}</p>

          <div style={styles.awards}>
            <span>Admin Verified</span>
            <span>{property.property_type}</span>
            <span>{property.city}</span>
          </div>

          <Link
            to={`/hotels/${property.id}/rooms`}
            style={{ ...styles.solidBtn, background: themeColor }}
          >
            Reserve Now
          </Link>
        </div>

        <div style={styles.introImages}>
          {introImageOne ? (
            <img
              src={introImageOne}
              alt={`${property.name} view 1`}
              style={styles.introImage1}
            />
          ) : (
            <div style={styles.emptyImageBox}>No intro photo uploaded</div>
          )}

          {introImageTwo ? (
            <img
              src={introImageTwo}
              alt={`${property.name} view 2`}
              style={styles.introImage2}
            />
          ) : (
            <div style={styles.emptyImageBox}>
              No second intro photo uploaded
            </div>
          )}
        </div>
      </section>

      <section style={styles.roomsSection}>
        <div style={styles.verticalTitle}>Rooms & Suites</div>

        <div style={styles.roomsContent}>
          <div style={styles.sectionHeader}>
            <p style={styles.welcome}>Stay with comfort</p>
            <h2>Rooms & Suites</h2>
          </div>

          {rooms.length === 0 ? (
            <div className="card" style={styles.emptyCard}>
              <h3>No rooms added yet</h3>
            </div>
          ) : (
            <div style={styles.roomGrid}>
              {rooms.slice(0, 4).map((room) => (
                <div key={room.id} style={styles.roomCard}>
                  <div style={styles.roomImageWrap}>
                    {room.main_image ? (
                      <img
                        src={room.main_image}
                        alt={room.room_type}
                        style={styles.roomImage}
                      />
                    ) : (
                      <div style={styles.emptyRoomImage}>
                        No room photo uploaded
                      </div>
                    )}

                    <div style={styles.roomImageDark}></div>
                    <h3>{room.room_type}</h3>
                  </div>

                  <p>
                    Designed for comfort with capacity for {room.capacity} guest
                    {room.capacity > 1 ? "s" : ""}. Perfect for a relaxing Sri
                    Lankan stay.
                  </p>

                  <div style={styles.roomFooter}>
                    <strong>
                      Rs. {Number(room.price_per_night).toLocaleString()}
                    </strong>

                    <Link
                      to={`/booking?propertyId=${property.id}&roomId=${room.id}`}
                      style={{ ...styles.learnMore, color: themeColor }}
                    >
                      Select Room →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.centerButton}>
            <Link
              to={`/hotels/${property.id}/rooms`}
              style={{ ...styles.solidBtn, background: themeColor }}
            >
              View All Rooms
            </Link>
          </div>
        </div>
      </section>

      <section style={styles.policiesSection}>
        <h2>Hotel Information</h2>

        <div style={styles.policyGrid}>
          <div>
            <strong>Address</strong>
            <p>{property.address}</p>
          </div>

          <div>
            <strong>Check-in</strong>
            <p>{property.policies?.check_in_time || "14:00:00"}</p>
          </div>

          <div>
            <strong>Check-out</strong>
            <p>{property.policies?.check_out_time || "11:00:00"}</p>
          </div>

          <div>
            <strong>Cancellation</strong>
            <p>
              {property.policies?.cancellation_policy ||
                "Cancellation policy not provided."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  site: {
    background: "#ffffff",
    color: "#111827",
  },

  hotelNav: {
    height: "110px",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 7%",
    borderBottom: "1px solid #f1f1f1",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },

  backLink: {
    fontWeight: "800",
    color: "#111827",
    textDecoration: "none",
  },

  logo: {
    width: "82px",
    height: "82px",
    objectFit: "contain",
  },

  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "22px",
  },

  menuText: {
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "2px",
    color: "#111827",
    textDecoration: "none",
  },

  manageBtn: {
    padding: "12px 22px",
    background: "#f5f8fc",
    border: "1px solid #d1d5db",
    color: "#0b63ce",
    textTransform: "uppercase",
    letterSpacing: "2px",
    fontWeight: "800",
    fontSize: "13px",
    textDecoration: "none",
  },

  reserveBtn: {
    padding: "14px 34px",
    border: "1px solid #111827",
    textTransform: "uppercase",
    letterSpacing: "3px",
    fontWeight: "700",
    color: "#111827",
    textDecoration: "none",
  },

  hero: {
    height: "680px",
    position: "relative",
    overflow: "hidden",
    background: "#f3f4f6",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  emptyHeroImage: {
    width: "100%",
    height: "100%",
    background: "#f3f4f6",
    border: "2px dashed #d1d5db",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontWeight: "900",
    fontSize: "22px",
  },

  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.68))",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    textAlign: "center",
    padding: "70px 20px",
  },

  heroLogo: {
    width: "110px",
    height: "110px",
    objectFit: "contain",
    marginBottom: "22px",
    filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.45))",
  },

  heroQuote: {
    textTransform: "uppercase",
    letterSpacing: "3px",
    fontSize: "18px",
    marginBottom: "12px",
  },

  heroTitle: {
    fontFamily: "Georgia, serif",
    fontSize: "72px",
    fontWeight: "500",
    margin: 0,
  },

  heroLocation: {
    fontSize: "18px",
    marginTop: "14px",
    letterSpacing: "2px",
  },

  reserveStrip: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    minHeight: "96px",
  },

  reserveInfo: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "18px",
    padding: "20px",
    textAlign: "center",
  },

  reserveNow: {
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textTransform: "uppercase",
    letterSpacing: "3px",
    fontWeight: "800",
    fontSize: "18px",
    textDecoration: "none",
  },

  introSection: {
    maxWidth: "1180px",
    margin: "90px auto",
    padding: "0 24px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "70px",
    alignItems: "center",
  },

  welcome: {
    textTransform: "uppercase",
    letterSpacing: "2px",
    fontWeight: "800",
    marginBottom: "10px",
  },

  introText: {
    fontSize: "20px",
    lineHeight: "1.7",
  },

  awards: {
    margin: "26px 0",
    display: "grid",
    gap: "8px",
    textTransform: "uppercase",
    letterSpacing: "2px",
    fontSize: "14px",
  },

  solidBtn: {
    display: "inline-block",
    color: "white",
    padding: "16px 32px",
    textTransform: "uppercase",
    letterSpacing: "2px",
    fontWeight: "800",
    textDecoration: "none",
  },

  introImages: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "22px",
  },

  introImage1: {
    width: "100%",
    height: "430px",
    objectFit: "cover",
    marginTop: "60px",
  },

  introImage2: {
    width: "100%",
    height: "520px",
    objectFit: "cover",
  },

  emptyImageBox: {
    width: "100%",
    height: "430px",
    background: "#f3f4f6",
    border: "2px dashed #d1d5db",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontWeight: "800",
    textAlign: "center",
    padding: "20px",
  },

  roomsSection: {
    maxWidth: "1260px",
    margin: "80px auto",
    padding: "0 24px",
    display: "grid",
    gridTemplateColumns: "100px 1fr",
    gap: "24px",
  },

  verticalTitle: {
    writingMode: "vertical-rl",
    transform: "rotate(180deg)",
    fontSize: "48px",
    color: "#d1d5db",
    fontFamily: "Georgia, serif",
    textAlign: "center",
  },

  roomsContent: {
    width: "100%",
  },

  sectionHeader: {
    marginBottom: "30px",
  },

  roomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "36px",
  },

  roomCard: {
    fontSize: "18px",
    lineHeight: "1.6",
  },

  roomImageWrap: {
    position: "relative",
    height: "360px",
    overflow: "hidden",
    marginBottom: "20px",
    background: "#f3f4f6",
  },

  roomImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  emptyRoomImage: {
    width: "100%",
    height: "100%",
    background: "#f3f4f6",
    border: "2px dashed #d1d5db",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontWeight: "800",
    textAlign: "center",
  },

  roomImageDark: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
  },

  roomFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "18px",
  },

  learnMore: {
    fontWeight: "900",
    textDecoration: "none",
  },

  centerButton: {
    textAlign: "center",
    marginTop: "40px",
  },

  policiesSection: {
    maxWidth: "1180px",
    margin: "80px auto",
    padding: "50px 24px",
    borderTop: "1px solid #e5e7eb",
  },

  policyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "24px",
  },

  emptyCard: {
    padding: "30px",
    textAlign: "center",
  },
};

export default HotelDetailsPage;