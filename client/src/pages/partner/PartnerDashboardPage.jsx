import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  ClipboardCheck,
  FileText,
  Hotel,
  Loader,
  Map,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const getStatusCount = (items, status) =>
  items.filter((item) => item.status === status).length;

const dashboardIcons = {
  hotel: Hotel,
  pending: Loader,
  event: CalendarCheck,
  review: FileText,
  guide: Map,
  approved: ShieldCheck,
  propertyAction: Hotel,
  eventAction: CalendarCheck,
  guideAction: UserCheck,
  guideFallback: Map,
};

function DashboardIcon({ name, size = 24 }) {
  const Icon = dashboardIcons[name] || ClipboardCheck;
  return <Icon size={size} strokeWidth={2.3} />;
}

function PartnerDashboardPage() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [events, setEvents] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileResponse, propertiesResponse, eventsResponse, guidesResponse] =
        await Promise.allSettled([
          api.get("/partner/profile"),
          api.get("/partner/properties"),
          api.get("/partner/events"),
          api.get("/partner/guides"),
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

      if (guidesResponse.status === "fulfilled") {
        setGuides(guidesResponse.value.data.guides || []);
      }

      if (
        profileResponse.status === "rejected" ||
        propertiesResponse.status === "rejected" ||
        eventsResponse.status === "rejected" ||
        guidesResponse.status === "rejected"
      ) {
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
      guides: guides.length,
      pendingGuides: getStatusCount(guides, "pending"),
      approvedGuides: getStatusCount(guides, "approved"),
      rejectedGuides: getStatusCount(guides, "rejected"),
    }),
    [properties, events, guides]
  );

  const metricCards = [
    {
      label: "Properties",
      value: stats.properties,
      note: `${stats.approvedProperties} approved`,
      iconName: "hotel",
      tint: "#ecfdf5",
      color: "#047857",
    },
    {
      label: "Property Review",
      value: stats.pendingProperties,
      note: "pending approval",
      iconName: "pending",
      tint: "#fff7ed",
      color: "#c2410c",
    },
    {
      label: "Events",
      value: stats.events,
      note: `${stats.approvedEvents} approved`,
      iconName: "event",
      tint: "#eff6ff",
      color: "#0b63ce",
    },
    {
      label: "Event Review",
      value: stats.pendingEvents,
      note: `${stats.rejectedEvents} rejected`,
      iconName: "review",
      tint: "#fef3c7",
      color: "#b45309",
    },
    {
      label: "Guiders",
      value: stats.guides,
      note: `${stats.approvedGuides} approved`,
      iconName: "guide",
      tint: "#eef2ff",
      color: "#4f46e5",
    },
    {
      label: "Guider Review",
      value: stats.pendingGuides,
      note: `${stats.rejectedGuides} rejected`,
      iconName: "approved",
      tint: "#fdf2f8",
      color: "#be185d",
    },
  ];

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
              Register properties, publish tourism events, become a verified guider, and manage your tourism business from one calm dashboard.
            </p>
          </div>

          <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <section style={styles.actionGrid}>
        <Link to="/partner/register-property" style={{ ...styles.actionCard, ...styles.propertyActionCard }}>
          <div style={{ ...styles.actionIcon, background: "#dcfce7", color: "#047857" }}>
            <DashboardIcon name="propertyAction" size={30} />
          </div>
          <div>
            <p style={{ ...styles.actionLabel, color: "#047857" }}>Property Registration</p>
            <h2 style={styles.actionTitle}>Register a hotel or property</h2>
            <p style={styles.actionText}>
              Add rooms, photos, pricing, policies, and submit your property for admin approval.
            </p>
          </div>
          <span style={{ ...styles.actionButton, background: "#047857" }}>Go to Property Registration</span>
        </Link>

        <Link to="/partner/event-registration" style={{ ...styles.actionCard, ...styles.eventActionCard }}>
          <div style={{ ...styles.actionIcon, background: "#dbeafe", color: "#0b63ce" }}>
            <DashboardIcon name="eventAction" size={30} />
          </div>
          <div>
            <p style={{ ...styles.actionLabel, color: "#0b63ce" }}>Event Registration</p>
            <h2 style={styles.actionTitle}>Register tourism events</h2>
            <p style={styles.actionText}>
              Create cultural nights, hotel experiences, food walks, and public tourist events.
            </p>
          </div>
          <span style={{ ...styles.actionButton, background: "#0b63ce" }}>Go to Event Registration</span>
        </Link>

        <Link to="/partner/guides" style={{ ...styles.actionCard, ...styles.guideActionCard }}>
          <div style={{ ...styles.actionIcon, background: "#e0e7ff", color: "#4f46e5" }}>
            <DashboardIcon name="guideAction" size={30} />
          </div>
          <div>
            <p style={{ ...styles.actionLabel, color: "#4f46e5" }}>Guider Registration</p>
            <h2 style={styles.actionTitle}>Become a tourist guider</h2>
            <p style={styles.actionText}>
              Add your guide profile, languages, experience, services, and pricing for tourists.
            </p>
          </div>
          <span style={{ ...styles.actionButton, background: "#4f46e5" }}>Go to Guider Registration</span>
        </Link>
      </section>

      <section style={styles.metricRibbon}>
        {metricCards.map((item) => (
          <article key={item.label} style={{ ...styles.metricCard, background: item.tint }}>
            <div style={{ ...styles.metricIcon, color: item.color }}>
              <DashboardIcon name={item.iconName} size={22} />
            </div>
            <div>
              <span style={styles.metricLabel}>{item.label}</span>
              <strong style={{ ...styles.metricValue, color: item.color }}>{loading ? "..." : item.value}</strong>
              <small style={styles.metricNote}>{item.note}</small>
            </div>
          </article>
        ))}
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
                    <p style={styles.rowText}>{event.city} / {event.category}</p>
                    {event.status === "rejected" && event.rejection_reason && (
                      <p style={styles.rejectReason}>Reason: {event.rejection_reason}</p>
                    )}
                  </div>
                  <span style={styles.statusBadge(event.status)}>{event.status}</span>
                  <Link to={`/partner/event-registration?edit=${event.id}`} style={styles.editLink}>
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>My Guiders</h2>
              <p style={styles.panelSubtitle}>Track guide profile approval and edit details.</p>
            </div>
            <Link to="/partner/guides" style={styles.smallLink}>+ Add Guider</Link>
          </div>

          {loading ? (
            <p style={styles.mutedText}>Loading guider profiles...</p>
          ) : guides.length === 0 ? (
            <div style={styles.emptyBox}>
              <h3>No guide profiles yet</h3>
              <p>Use the Guider Registration button to submit your first guide profile.</p>
            </div>
          ) : (
            <div style={styles.listStack}>
              {guides.slice(0, 4).map((guide) => (
                <div key={guide.id} style={styles.guideRow}>
                  <div style={styles.guideAvatar}>
                    {guide.image_url ? (
                      <img src={guide.image_url} alt={guide.display_name} style={styles.thumbImage} />
                    ) : (
                      <DashboardIcon name="guideFallback" size={22} />
                    )}
                  </div>
                  <div style={styles.rowMain}>
                    <h3 style={styles.rowTitle}>{guide.display_name}</h3>
                    <p style={styles.rowText}>{guide.city} / {guide.guide_type}</p>
                    {guide.status === "rejected" && guide.rejection_reason && (
                      <p style={styles.rejectReason}>Reason: {guide.rejection_reason}</p>
                    )}
                  </div>
                  <span style={styles.statusBadge(guide.status)}>{guide.status}</span>
                  <Link to={`/partner/guides?edit=${guide.id}`} style={styles.editLink}>
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
    padding: "34px 20px 70px",
    background:
      "radial-gradient(circle at 8% 10%, rgba(187,247,208,0.72), transparent 30%), radial-gradient(circle at 92% 2%, rgba(191,219,254,0.76), transparent 32%), linear-gradient(135deg,#f8fafc 0%,#f0fdfa 48%,#eef6ff 100%)",
    minHeight: "calc(100vh - 76px)",
  },
  noticeCard: {
    padding: "30px",
    textAlign: "center",
  },
  hero: {
    maxWidth: "1280px",
    margin: "0 auto 22px",
    position: "relative",
    overflow: "hidden",
    borderRadius: "34px",
    background:
      "linear-gradient(135deg, #064e3b 0%, #0f7a43 44%, #0b63ce 100%)",
    boxShadow: "0 28px 70px rgba(6,78,59,0.24)",
  },
  heroPattern: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.22), transparent 28%), radial-gradient(circle at 88% 8%, rgba(255,255,255,0.16), transparent 24%)",
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
    fontSize: "clamp(36px, 5vw, 58px)",
    lineHeight: 1,
    letterSpacing: "-0.055em",
  },
  heroText: {
    maxWidth: "780px",
    margin: 0,
    color: "rgba(255,255,255,0.9)",
    fontSize: "17px",
    lineHeight: 1.7,
    fontWeight: 650,
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
    maxWidth: "1280px",
    margin: "0 auto 18px",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px 18px",
    borderRadius: "16px",
    fontWeight: 800,
  },
  actionGrid: {
    maxWidth: "1280px",
    margin: "0 auto 22px",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
    gap: "18px",
  },
  actionCard: {
    textDecoration: "none",
    color: "#0f172a",
    borderRadius: "28px",
    padding: "24px",
    minHeight: "240px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 20px 55px rgba(15,23,42,0.08)",
    border: "1px solid rgba(148,163,184,0.20)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  propertyActionCard: {
    background: "linear-gradient(135deg,#ffffff 0%,#f0fdf4 100%)",
  },
  eventActionCard: {
    background: "linear-gradient(135deg,#ffffff 0%,#eff6ff 100%)",
  },
  guideActionCard: {
    background: "linear-gradient(135deg,#ffffff 0%,#eef2ff 58%,#fdf2f8 100%)",
  },
  actionIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "20px",
    display: "grid",
    placeItems: "center",
    fontSize: "30px",
    marginBottom: "18px",
  },
  actionLabel: {
    margin: 0,
    fontWeight: 950,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    fontSize: "12px",
  },
  actionTitle: {
    margin: "8px 0",
    fontSize: "26px",
    letterSpacing: "-0.04em",
  },
  actionText: {
    color: "#64748b",
    lineHeight: 1.65,
    margin: 0,
    fontWeight: 650,
  },
  actionButton: {
    marginTop: "20px",
    display: "inline-flex",
    width: "fit-content",
    color: "#ffffff",
    padding: "12px 16px",
    borderRadius: "14px",
    fontWeight: 900,
  },
  metricRibbon: {
    maxWidth: "1280px",
    margin: "0 auto 22px",
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(150px, 1fr))",
    gap: "14px",
  },
  metricCard: {
    border: "1px solid rgba(148,163,184,0.20)",
    borderRadius: "22px",
    padding: "16px",
    boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },
  metricIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "16px",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.75)",
    fontSize: "22px",
    flexShrink: 0,
  },
  metricLabel: {
    display: "block",
    color: "#475569",
    fontSize: "12px",
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  metricValue: {
    display: "block",
    fontSize: "30px",
    lineHeight: 1,
    marginTop: "4px",
  },
  metricNote: {
    color: "#64748b",
    fontWeight: 800,
  },
  contentGrid: {
    maxWidth: "1280px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(280px, 1fr))",
    gap: "20px",
  },
  panel: {
    padding: "24px",
    borderRadius: "26px",
    border: "1px solid rgba(148,163,184,0.22)",
    boxShadow: "0 20px 55px rgba(15,23,42,0.07)",
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
    letterSpacing: "-0.035em",
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
    background: "linear-gradient(135deg,#f8fafc,#f0fdfa)",
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
  guideRow: {
    display: "grid",
    gridTemplateColumns: "58px 1fr auto auto",
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
  guideAvatar: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    overflow: "hidden",
    background: "#e0e7ff",
    display: "grid",
    placeItems: "center",
    color: "#4f46e5",
    fontWeight: 900,
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
  editLink: {
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
    margin: "6px 0 0",
    fontSize: "12px",
  },
  statusBadge: (status) => {
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
