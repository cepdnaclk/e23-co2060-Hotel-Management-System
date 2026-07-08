import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useAdminAuth } from "../context/AdminAuthContext";

const safeNumber = (value) => Number(value || 0);

function AdminIcon({ name }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const paths = {
    property: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
        <path d="M9 9h.01M15 9h.01" />
      </>
    ),
    event: (
      <>
        <path d="M7 2v3M17 2v3" />
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <path d="M3 10h18" />
        <path d="m9 15 2 2 4-4" />
      </>
    ),
    guide: (
      <>
        <path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    card: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </>
    ),
    calendar: (
      <>
        <path d="M7 2v3M17 2v3" />
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <path d="M8 14h.01M12 14h.01M16 14h.01" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 3 5-7" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15 9-2 6-4 2 2-6 4-2Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.property}</svg>;
}

function AdminDashboardPage() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [guideStats, setGuideStats] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setMessage("");

      const [dashboardRes, eventsRes, guidesRes] = await Promise.allSettled([
        api.get("/admin/dashboard"),
        api.get("/admin/events?status=all"),
        api.get("/admin/guides?status=all"),
      ]);

      if (dashboardRes.status === "fulfilled") {
        setStats(dashboardRes.value.data.data || null);
      } else {
        throw dashboardRes.reason;
      }

      if (eventsRes.status === "fulfilled") {
        setEventStats(eventsRes.value.data.stats || null);
      }

      if (guidesRes.status === "fulfilled") {
        setGuideStats(guidesRes.value.data.stats || null);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const approvalCards = useMemo(
    () => [
      {
        title: "Property Approvals",
        count: safeNumber(stats?.pending_properties),
        subtitle: "Review hotel and property registration requests from partners.",
        to: "/property-approvals",
        iconName: "property",
        tone: "green",
      },
      {
        title: "Event Approvals",
        count: safeNumber(eventStats?.pending_events),
        subtitle: "Approve partner-created events before they appear to tourists.",
        to: "/event-approvals",
        iconName: "event",
        tone: "blue",
      },
      {
        title: "Guide Approvals",
        count: safeNumber(guideStats?.pending_guides),
        subtitle: "Verify guider profiles and publish approved tourist guides.",
        to: "/guide-approvals",
        iconName: "guide",
        tone: "amber",
      },
    ],
    [stats, eventStats, guideStats]
  );

  const managementCards = [
    {
      title: "Registration Fees",
      subtitle: "Check property registration payments and fee status.",
      to: "/registration-fees",
      iconName: "card",
    },
    {
      title: "Monthly Fees",
      subtitle: "Track monthly partner payments and active billing cycles.",
      to: "/monthly-fees",
      iconName: "calendar",
    },
    {
      title: "Payment Versions",
      subtitle: "Manage package limits, plan fees, and partner versions.",
      to: "/payment-versions",
      iconName: "card",
    },
    {
      title: "Revenue",
      subtitle: "View registration revenue, monthly income, and summaries.",
      to: "/revenue",
      iconName: "chart",
    },
    {
      title: "Explore Manager",
      subtitle: "Manage public explore places and destination content.",
      to: "/explore-manager",
      iconName: "compass",
    },
    {
      title: "System Risk",
      subtitle: "Review security risks, issues, and admin monitoring notes.",
      to: "/system-risk",
      iconName: "shield",
    },
  ];

  return (
    <main className="admin-page admin-dashboard-modern-page">
      <section className="admin-dashboard-hero">
        <div className="admin-dashboard-hero-content">
          <p className="eyebrow">TourismHub LK Admin</p>
          <h1>Admin Dashboard</h1>
          <p>
            Welcome {admin?.full_name || "Admin"}. Use this control center to review approvals,
            manage payments, monitor revenue, and maintain trusted tourism content.
          </p>
          <div className="admin-hero-actions">
            <Link to="/property-approvals">Review Properties</Link>
            <Link to="/event-approvals" className="secondary-action">
              Review Events
            </Link>
            <Link to="/guide-approvals" className="secondary-action">
              Review Guides
            </Link>
          </div>
        </div>

        <div className="admin-dashboard-hero-panel">
          <span>Today's Priority</span>
          <strong>
            {safeNumber(stats?.pending_properties) +
              safeNumber(eventStats?.pending_events) +
              safeNumber(guideStats?.pending_guides)}
          </strong>
          <p>approval requests need admin attention</p>
        </div>
      </section>

      {message && <div className="alert-card">{message}</div>}
      {loading && <div className="loading-card">Loading admin dashboard...</div>}

      <section className="admin-kpi-strip">
        <div>
          <span>Pending Properties</span>
          <strong>{safeNumber(stats?.pending_properties)}</strong>
        </div>
        <div>
          <span>Approved Properties</span>
          <strong>{safeNumber(stats?.approved_properties)}</strong>
        </div>
        <div>
          <span>Visible Properties</span>
          <strong>{safeNumber(stats?.visible_properties)}</strong>
        </div>
        <div>
          <span>Partners</span>
          <strong>{safeNumber(stats?.partners)}</strong>
        </div>
        <div>
          <span>Tourists</span>
          <strong>{safeNumber(stats?.tourists)}</strong>
        </div>
        <div>
          <span>Total Revenue</span>
          <strong>Rs. {safeNumber(stats?.total_revenue).toLocaleString()}</strong>
        </div>
      </section>

      <section className="admin-section-head">
        <div>
          <p className="eyebrow">Main Review Area</p>
          <h2>Approval Center</h2>
          <p>Each approval type now has its own landing page for a cleaner admin workflow.</p>
        </div>
      </section>

      <section className="approval-card-grid">
        {approvalCards.map((card) => (
          <Link key={card.to} to={card.to} className={`approval-action-card ${card.tone}`}>
            <div className="approval-card-topline">
              <span className="approval-card-icon">
                <AdminIcon name={card.iconName} />
              </span>
              <span className="approval-card-count">{card.count}</span>
            </div>
            <h3>{card.title}</h3>
            <p>{card.subtitle}</p>
            <span className="approval-card-link">Open review page</span>
          </Link>
        ))}
      </section>

      <section className="admin-section-head compact">
        <div>
          <p className="eyebrow">Other Admin Tools</p>
          <h2>Management Center</h2>
        </div>
      </section>

      <section className="management-card-grid">
        {managementCards.map((card) => (
          <Link key={card.to} to={card.to} className="management-tool-card">
            <span>
              <AdminIcon name={card.iconName} />
            </span>
            <div>
              <h3>{card.title}</h3>
              <p>{card.subtitle}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

export default AdminDashboardPage;
