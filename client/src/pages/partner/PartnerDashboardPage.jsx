import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const getStatusCount = (items, status) =>
  items.filter((item) => item.status === status).length;

function PartnerDashboardPage() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileResponse, propertiesResponse, eventsResponse] =
        await Promise.allSettled([
          api.get("/partner/profile"),
          api.get("/partner/properties"),
          api.get("/partner/events"),
        ]);

      if (profileResponse.status === "fulfilled") {
        setProfile(profileResponse.value.data.data);
      }

      if (propertiesResponse.status === "fulfilled") {
        setProperties(propertiesResponse.value.data.data || []);
      }

      if (eventsResponse.status === "fulfilled") {
        setEvents(eventsResponse.value.data.events || []);
      }

      if (profileResponse.status === "rejected" || propertiesResponse.status === "rejected") {
        setError("Some dashboard details could not be loaded. Please refresh again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load partner dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.role === "partner") {
      loadDashboard();
    }
  }, [isLoggedIn, user]);

  const stats = useMemo(
    () => ({
      properties: properties.length,
      approvedProperties: getStatusCount(properties, "approved"),
      pendingProperties: getStatusCount(properties, "pending"),
      events: events.length,
      pendingEvents: getStatusCount(events, "pending"),
      approvedEvents: events.filter((event) => event.status === "approved" || event.status === "published").length,
      rejectedEvents: getStatusCount(events, "rejected"),
    }),
    [properties, events]
  );

  if (!isLoggedIn) {
    return <Navigate to="/partner/login" />;
  }

  if (user?.role !== "partner") {
    return (
      <div className="page">
        <div className="card" style={styles.noticeCard}>
          <h2>Access denied</h2>
          <p>This page is only for partners.</p>
        </div>
      </div>
    );
  }

  const handleManageProperty = (propertyId) => {
    navigate(`/partner/property-login/${propertyId}`);
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");

    if (confirmLogout) {
      logout();
      navigate("/partner/login");
    }
  };

  const partnerName = profile?.full_name || user?.full_name || "Partner";

  return (
    <div style={styles.pageShell}>
      <section style={styles.hero}>
        <div style={styles.heroPattern} />
        <div style={styles.heroContent}>
          <div>
            <span style={styles.badge}>TourismHub LK Partner Portal</span>
            <h1 style={styles.heroTitle}>Welcome back, {partnerName}</h1>
            <p style={styles.heroText}>
              Register properties, publish tourism events, and manage your business presence from one dashboard.
            </p>
          </div>

          <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <section style={styles.actionGrid}>
        <Link to="/partner/register-property" style={styles.actionCard}>
          <div style={styles.actionIcon}>🏨</div>
          <div>
            <p style={styles.actionLabel}>Property Registration</p>
            <h2 style={styles.actionTitle}>Register a hotel or property</h2>
            <p style={styles.actionText}>
              Add hotel details, rooms, photos, pricing, policies, and submit for admin approval.
            </p>
          </div>
          <span style={styles.actionButton}>Go to Property Registration →</span>
        </Link>

        <Link to="/partner/event-registration" style={{ ...styles.actionCard, ...styles.eventActionCard }}>
          <div style={styles.actionIcon}>🎉</div>
          <div>
            <p style={styles.actionLabel}>Event Registration</p>
            <h2 style={styles.actionTitle}>Register and edit events</h2>
            <p style={styles.actionText}>
              Create hotel experiences, cultural nights, food events, and submit them for admin approval before tourists see them.
            </p>
          </div>
          <span style={styles.actionButton}>Go to Event Registration →</span>
        </Link>
      </section>

      <section style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span>Total Properties</span>
          <strong>{stats.properties}</strong>
          <small>{stats.approvedProperties} approved</small>
        </div>
        <div style={styles.statCard}>
          <span>Pending Properties</span>
          <strong>{stats.pendingProperties}</strong>
          <small>Waiting for admin review</small>
        </div>
        <div style={styles.statCard}>
          <span>Total Events</span>
          <strong>{stats.events}</strong>
          <small>{stats.approvedEvents} approved</small>
        </div>
        <div style={styles.statCard}>
          <span>Pending Events</span>
          <strong>{stats.pendingEvents}</strong>
          <small>{stats.rejectedEvents} rejected by admin</small>
        </div>
      </section>

      <section style={styles.contentGrid}>
        <div className="card" style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>My Properties</h2>
              <p style={styles.panelSubtitle}>Open property management after password verification.</p>
            </div>
            <Link to="/partner/register-property" style={styles.smallLink}>+ Add Property</Link>
          </div>

          {loading ? (
            <p style={styles.mutedText}>Loading properties...</p>
          ) : properties.length === 0 ? (
            <div style={styles.emptyBox}>
              <h3>No properties yet</h3>
              <p>Use the Property Registration button to submit your first property.</p>
            </div>
          ) : (
            <div style={styles.listStack}>
              {properties.slice(0, 4).map((property) => (
                <div key={property.id} style={styles.propertyRow}>
                  <div style={styles.thumbWrap}>
                    {property.main_image ? (
                      <img src={property.main_image} alt={property.name} style={styles.thumbImage} />
                    ) : (
                      <span style={styles.thumbFallback}>Hotel</span>
                    )}
                  </div>
                  <div style={styles.rowMain}>
                    <h3 style={styles.rowTitle}>{property.name}</h3>
                    <p style={styles.rowText}>{property.city}{property.district ? `, ${property.district}` : ""}</p>
                  </div>
                  <span className={`status-badge status-${property.status}`}>
                    {property.status}
                  </span>
                  <button type="button" onClick={() => handleManageProperty(property.id)} style={styles.rowButton}>
                    Manage
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>My Events</h2>
              <p style={styles.panelSubtitle}>Edit events and track admin approval status.</p>
            </div>
            <Link to="/partner/event-registration" style={styles.smallLink}>+ Add Event</Link>
          </div>

          {loading ? (
            <p style={styles.mutedText}>Loading events...</p>
          ) : events.length === 0 ? (
            <div style={styles.emptyBox}>
              <h3>No events yet</h3>
              <p>Use the Event Registration button to submit your first event for admin approval.</p>
            </div>
          ) : (
            <div style={styles.listStack}>
              {events.slice(0, 4).map((event) => (
                <div key={event.id} style={styles.eventRow}>
                  <div style={styles.eventDateBox}>
                    <strong>{event.month_name?.slice(0, 3) || "EVT"}</strong>
                    <span>{event.event_date ? String(event.event_date).slice(8, 10) : "Soon"}</span>
                  </div>
                  <div style={styles.rowMain}>
                    <h3 style={styles.rowTitle}>{event.title}</h3>
                    <p style={styles.rowText}>{event.city} • {event.category}</p>
                    {event.status === "rejected" && event.rejection_reason && (
                      <p style={styles.rejectReason}>Reason: {event.rejection_reason}</p>
                    )}
                  </div>
                  <span style={styles.eventStatus(event.status)}>{event.status}</span>
                  <Link to={`/partner/event-registration?edit=${event.id}`} style={styles.editEventLink}>
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const styles = {
  pageShell: {
    padding: "34px 20px 60px",
    background:
      "linear-gradient(135deg, rgba(240,253,244,0.95), rgba(239,246,255,0.9))",
    minHeight: "calc(100vh - 76px)",
  },
  noticeCard: {
    padding: "30px",
    textAlign: "center",
  },
  hero: {
    maxWidth: "1180px",
    margin: "0 auto 22px",
    position: "relative",
    overflow: "hidden",
    borderRadius: "30px",
    background:
      "linear-gradient(135deg, #064e3b 0%, #0f7a43 45%, #0b63ce 100%)",
    boxShadow: "0 28px 70px rgba(6,78,59,0.28)",
  },
  heroPattern: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.20), transparent 28%), radial-gradient(circle at 85% 10%, rgba(255,255,255,0.16), transparent 24%)",
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
    padding: "42px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },
  badge: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.22)",
    fontWeight: 900,
    fontSize: "13px",
  },
  heroTitle: {
    margin: "18px 0 10px",
    fontSize: "clamp(34px, 5vw, 54px)",
    lineHeight: 1.02,
  },
  heroText: {
    maxWidth: "720px",
    margin: 0,
    color: "rgba(255,255,255,0.88)",
    fontSize: "17px",
    lineHeight: 1.7,
  },
  logoutBtn: {
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.14)",
    color: "#ffffff",
    padding: "12px 18px",
    borderRadius: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  errorBox: {
    maxWidth: "1180px",
    margin: "0 auto 18px",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px 18px",
    borderRadius: "16px",
    fontWeight: 800,
  },
  actionGrid: {
    maxWidth: "1180px",
    margin: "0 auto 22px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  actionCard: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#ffffff",
    border: "1px solid #bbf7d0",
    borderRadius: "26px",
    padding: "26px",
    minHeight: "250px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
  },
  eventActionCard: {
    border: "1px solid #bfdbfe",
    background:
      "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
  },
  actionIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    display: "grid",
    placeItems: "center",
    fontSize: "30px",
    background: "#ecfdf5",
    marginBottom: "18px",
  },
  actionLabel: {
    margin: 0,
    color: "#0f7a43",
    fontWeight: 900,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    fontSize: "12px",
  },
  actionTitle: {
    margin: "8px 0",
    fontSize: "28px",
  },
  actionText: {
    color: "#64748b",
    lineHeight: 1.65,
    margin: 0,
  },
  actionButton: {
    marginTop: "20px",
    display: "inline-flex",
    width: "fit-content",
    background: "#111827",
    color: "#ffffff",
    padding: "12px 16px",
    borderRadius: "14px",
    fontWeight: 900,
  },
  statsGrid: {
    maxWidth: "1180px",
    margin: "0 auto 22px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "16px",
  },
  statCard: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid #e2e8f0",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
    display: "grid",
    gap: "6px",
  },
  contentGrid: {
    maxWidth: "1180px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "20px",
  },
  panel: {
    padding: "24px",
    borderRadius: "24px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "18px",
  },
  panelTitle: {
    margin: 0,
  },
  panelSubtitle: {
    margin: "6px 0 0",
    color: "#64748b",
  },
  smallLink: {
    textDecoration: "none",
    color: "#0b63ce",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  mutedText: {
    color: "#64748b",
  },
  emptyBox: {
    padding: "24px",
    borderRadius: "18px",
    background: "#f8fafc",
    textAlign: "center",
    color: "#64748b",
  },
  listStack: {
    display: "grid",
    gap: "12px",
  },
  propertyRow: {
    display: "grid",
    gridTemplateColumns: "60px 1fr auto auto",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    background: "#ffffff",
  },
  eventRow: {
    display: "grid",
    gridTemplateColumns: "64px 1fr auto auto",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    background: "#ffffff",
  },
  thumbWrap: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    overflow: "hidden",
    background: "#ecfdf5",
    display: "grid",
    placeItems: "center",
    color: "#0f7a43",
    fontWeight: 900,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  thumbFallback: {
    fontSize: "12px",
  },
  rowMain: {
    minWidth: 0,
  },
  rowTitle: {
    margin: 0,
    fontSize: "16px",
  },
  rowText: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },
  rowButton: {
    border: "none",
    background: "#111827",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  eventDateBox: {
    width: "64px",
    height: "60px",
    borderRadius: "16px",
    background: "#eff6ff",
    color: "#0b63ce",
    display: "grid",
    placeItems: "center",
    gap: "0",
  },

  editEventLink: {
    textDecoration: "none",
    border: "none",
    background: "#0b63ce",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "10px 13px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  rejectReason: {
    color: "#991b1b",
    fontWeight: 800,
  },
  eventStatus: (status) => {
    const clean = status === "published" ? "approved" : status;
    return {
      padding: "8px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 900,
      textTransform: "capitalize",
      background:
        clean === "approved"
          ? "#dcfce7"
          : clean === "rejected" || clean === "hidden"
          ? "#fee2e2"
          : "#fef3c7",
      color:
        clean === "approved"
          ? "#166534"
          : clean === "rejected" || clean === "hidden"
          ? "#991b1b"
          : "#92400e",
    };
  },
};

export default PartnerDashboardPage;
