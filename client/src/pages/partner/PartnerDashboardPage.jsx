import ContentImage from "../../components/ContentImage";
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

import "../../styles/partnerDashboard.css";

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
  return <Icon size={size} strokeWidth={2.1} />;
}

function normalizeStatus(status) {
  return status === "published" ? "approved" : status || "pending";
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
      approvedEvents: events.filter(
        (event) => event.status === "approved" || event.status === "published"
      ).length,
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
    },
    {
      label: "Property Review",
      value: stats.pendingProperties,
      note: "pending approval",
      iconName: "pending",
    },
    {
      label: "Events",
      value: stats.events,
      note: `${stats.approvedEvents} approved`,
      iconName: "event",
    },
    {
      label: "Event Review",
      value: stats.pendingEvents,
      note: `${stats.rejectedEvents} rejected`,
      iconName: "review",
    },
    {
      label: "Guiders",
      value: stats.guides,
      note: `${stats.approvedGuides} approved`,
      iconName: "guide",
    },
    {
      label: "Guider Review",
      value: stats.pendingGuides,
      note: `${stats.rejectedGuides} rejected`,
      iconName: "approved",
    },
  ];

  if (!isLoggedIn) {
    return <Navigate to="/partner/login" />;
  }

  if (user?.role !== "partner") {
    return (
      <main className="partner-dashboard-page">
        <div className="partner-dashboard-access-card">
          <h2>Access denied</h2>
          <p>This page is only for partners.</p>
        </div>
      </main>
    );
  }

  const handleManageProperty = (propertyId) => {
    navigate(`/partner/properties/${propertyId}`);
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
    <main className="partner-dashboard-page">
      <section className="partner-dashboard-hero">
        <div className="partner-dashboard-hero-decoration" aria-hidden="true">
          <span className="partner-dashboard-orbit partner-dashboard-orbit-one" />
          <span className="partner-dashboard-orbit partner-dashboard-orbit-two" />
          <span className="partner-dashboard-dot partner-dashboard-dot-one" />
          <span className="partner-dashboard-dot partner-dashboard-dot-two" />
          <span className="partner-dashboard-dot partner-dashboard-dot-three" />
        </div>

        <div className="partner-dashboard-hero-main">
          <span className="partner-dashboard-kicker">
            TRIPLANKA · PARTNER PORTAL
          </span>

          <h1>
            Welcome back, <span>{partnerName}</span>
          </h1>

          <p>
            Manage your properties, tourism events and guide services from one
            professional workspace.
          </p>

          <div className="partner-dashboard-hero-tags">
            <span>Property management</span>
            <span>Event publishing</span>
            <span>Guide services</span>
          </div>
        </div>

        <aside className="partner-dashboard-hero-side">
          <div className="partner-dashboard-side-heading">
            <span>PARTNER SERVICES</span>
            <h2>Your business at a glance</h2>
          </div>

          <div className="partner-dashboard-service-list">
            <div>
              <span className="partner-dashboard-service-icon">
                <Hotel size={20} />
              </span>
              <div>
                <strong>Hotels & Properties</strong>
                <small>{stats.properties} registered</small>
              </div>
            </div>

            <div>
              <span className="partner-dashboard-service-icon">
                <CalendarCheck size={20} />
              </span>
              <div>
                <strong>Tourism Events</strong>
                <small>{stats.events} registered</small>
              </div>
            </div>

            <div>
              <span className="partner-dashboard-service-icon">
                <UserCheck size={20} />
              </span>
              <div>
                <strong>Guide Services</strong>
                <small>{stats.guides} registered</small>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="partner-dashboard-logout"
          >
            Logout
          </button>
        </aside>
      </section>

      {error ? <div className="partner-dashboard-error">{error}</div> : null}

      <section className="partner-dashboard-section-heading">
        <div>
          <span>MANAGE YOUR SERVICES</span>
          <h2>Choose what you want to manage</h2>
        </div>
        <p>
          Register and maintain the services you offer to travellers through TripLanka.
        </p>
      </section>

      <section className="partner-dashboard-action-grid">
        <Link
          to="/partner/register-property"
          className="partner-dashboard-action-card"
        >
          <div className="partner-dashboard-action-icon">
            <DashboardIcon name="propertyAction" size={30} />
          </div>

          <div className="partner-dashboard-action-content">
            <span>PROPERTY REGISTRATION</span>
            <h2>Register a hotel or property</h2>
            <p>
              Add rooms, photos, pricing and policies, then submit your property
              for admin approval.
            </p>
          </div>

          <strong className="partner-dashboard-action-button">
            Go to Property Registration
          </strong>
        </Link>

        <Link
          to="/partner/event-registration"
          className="partner-dashboard-action-card"
        >
          <div className="partner-dashboard-action-icon">
            <DashboardIcon name="eventAction" size={30} />
          </div>

          <div className="partner-dashboard-action-content">
            <span>EVENT REGISTRATION</span>
            <h2>Register tourism events</h2>
            <p>
              Create cultural nights, hotel experiences, food walks and public
              tourism events.
            </p>
          </div>

          <strong className="partner-dashboard-action-button">
            Go to Event Registration
          </strong>
        </Link>

        <Link
          to="/partner/guides"
          className="partner-dashboard-action-card"
        >
          <div className="partner-dashboard-action-icon">
            <DashboardIcon name="guideAction" size={30} />
          </div>

          <div className="partner-dashboard-action-content">
            <span>GUIDER REGISTRATION</span>
            <h2>Become a tourist guider</h2>
            <p>
              Add your guide profile, languages, experience, services and pricing
              for tourists.
            </p>
          </div>

          <strong className="partner-dashboard-action-button">
            Go to Guider Registration
          </strong>
        </Link>
      </section>

      <section className="partner-dashboard-metrics">
        {metricCards.map((item) => (
          <article key={item.label} className="partner-dashboard-metric-card">
            <div className="partner-dashboard-metric-icon">
              <DashboardIcon name={item.iconName} size={22} />
            </div>

            <div>
              <span>{item.label}</span>
              <strong>{loading ? "..." : item.value}</strong>
              <small>{item.note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="partner-dashboard-content-grid">
        <article className="partner-dashboard-panel">
          <header className="partner-dashboard-panel-header">
            <div>
              <span>ACCOMMODATION</span>
              <h2>My Properties</h2>
              <p>Open property management after password verification.</p>
            </div>

            <Link to="/partner/register-property">+ Add Property</Link>
          </header>

          {loading ? (
            <p className="partner-dashboard-muted">Loading properties...</p>
          ) : properties.length === 0 ? (
            <div className="partner-dashboard-empty">
              <h3>No properties yet</h3>
              <p>Register your first property to start managing accommodation.</p>
            </div>
          ) : (
            <div className="partner-dashboard-list">
              {properties.slice(0, 4).map((property) => (
                <div key={property.id} className="partner-dashboard-row">
                  <div className="partner-dashboard-thumb">
                    {property.main_image ? (
                      <ContentImage
                        src={property.main_image}
                        alt={property.name}
                        className="partner-dashboard-thumb-image"
                      />
                    ) : (
                      <span>Hotel</span>
                    )}
                  </div>

                  <div className="partner-dashboard-row-main">
                    <h3>{property.name}</h3>
                    <p>
                      {property.city}
                      {property.district ? `, ${property.district}` : ""}
                    </p>
                  </div>

                  <span
                    className={`partner-dashboard-status partner-dashboard-status-${normalizeStatus(
                      property.status
                    )}`}
                  >
                    {property.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleManageProperty(property.id)}
                    className="partner-dashboard-row-action"
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="partner-dashboard-panel">
          <header className="partner-dashboard-panel-header">
            <div>
              <span>TOURISM EVENTS</span>
              <h2>My Events</h2>
              <p>Edit events and track admin approval status.</p>
            </div>

            <Link to="/partner/event-registration">+ Add Event</Link>
          </header>

          {loading ? (
            <p className="partner-dashboard-muted">Loading events...</p>
          ) : events.length === 0 ? (
            <div className="partner-dashboard-empty">
              <h3>No events yet</h3>
              <p>Submit your first tourism event for admin approval.</p>
            </div>
          ) : (
            <div className="partner-dashboard-list">
              {events.slice(0, 4).map((event) => (
                <div key={event.id} className="partner-dashboard-row">
                  <div className="partner-dashboard-event-date">
                    <strong>{event.month_name?.slice(0, 3) || "EVT"}</strong>
                    <span>
                      {event.event_date ? String(event.event_date).slice(8, 10) : "Soon"}
                    </span>
                  </div>

                  <div className="partner-dashboard-row-main">
                    <h3>{event.title}</h3>
                    <p>
                      {event.city} / {event.category}
                    </p>

                    {event.status === "rejected" && event.rejection_reason ? (
                      <p className="partner-dashboard-reject">
                        Reason: {event.rejection_reason}
                      </p>
                    ) : null}
                  </div>

                  <span
                    className={`partner-dashboard-status partner-dashboard-status-${normalizeStatus(
                      event.status
                    )}`}
                  >
                    {event.status}
                  </span>

                  <Link
                    to={`/partner/event-registration?edit=${event.id}`}
                    className="partner-dashboard-row-action"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="partner-dashboard-panel">
          <header className="partner-dashboard-panel-header">
            <div>
              <span>GUIDE SERVICES</span>
              <h2>My Guiders</h2>
              <p>Edit guide profiles and manage tourist requests.</p>
            </div>

            <Link to="/partner/guides">+ Add Guider</Link>
          </header>

          {loading ? (
            <p className="partner-dashboard-muted">Loading guider profiles...</p>
          ) : guides.length === 0 ? (
            <div className="partner-dashboard-empty">
              <h3>No guide profiles yet</h3>
              <p>Submit your first guide profile for approval.</p>
            </div>
          ) : (
            <div className="partner-dashboard-list">
              {guides.slice(0, 4).map((guide) => (
                <div key={guide.id} className="partner-dashboard-row">
                  <div className="partner-dashboard-guide-avatar">
                    {guide.image_url ? (
                      <ContentImage
                        src={guide.image_url}
                        alt={guide.display_name}
                        className="partner-dashboard-thumb-image"
                      />
                    ) : (
                      <DashboardIcon name="guideFallback" size={22} />
                    )}
                  </div>

                  <div className="partner-dashboard-row-main">
                    <h3>{guide.display_name}</h3>
                    <p>
                      {guide.city} / {guide.guide_type}
                    </p>

                    {guide.status === "rejected" && guide.rejection_reason ? (
                      <p className="partner-dashboard-reject">
                        Reason: {guide.rejection_reason}
                      </p>
                    ) : null}
                  </div>

                  <span
                    className={`partner-dashboard-status partner-dashboard-status-${normalizeStatus(
                      guide.status
                    )}`}
                  >
                    {guide.status}
                  </span>

                  <div className="partner-dashboard-guide-actions">
                    <Link
                      to={`/partner/guides?edit=${guide.id}`}
                      className="partner-dashboard-row-action"
                    >
                      Edit
                    </Link>

                    {guide.status === "approved" &&
                    guide.registration_payment_status === "Paid" ? (
                      <Link
                        to={`/partner/guides/${guide.id}/requests`}
                        className="partner-dashboard-request-action"
                      >
                        Manage Requests
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

export default PartnerDashboardPage;
