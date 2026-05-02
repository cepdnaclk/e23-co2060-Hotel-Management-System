import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function PartnerDashboardPage() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileResponse, propertiesResponse] = await Promise.all([
        api.get("/partner/profile"),
        api.get("/partner/properties"),
      ]);

      setProfile(profileResponse.data.data);
      setProperties(propertiesResponse.data.data || []);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load partner dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.role === "partner") {
      loadDashboard();
    }
  }, [isLoggedIn, user]);

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

  return (
    <div className="page">
      <div style={styles.header}>
        <div>
          <h1>Partner Dashboard</h1>
          <p>
            Welcome,{" "}
            <strong>{profile?.full_name || user?.full_name || "Partner"}</strong>
          </p>
        </div>

        <div style={styles.headerActions}>
          <Link to="/partner/register-property" className="btn-primary">
            Register New Property
          </Link>

          <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.statsGrid}>
        <div className="card" style={styles.statCard}>
          <h3>Total Properties</h3>
          <strong>{properties.length}</strong>
        </div>

        <div className="card" style={styles.statCard}>
          <h3>Approved</h3>
          <strong>
            {properties.filter((property) => property.status === "approved").length}
          </strong>
        </div>

        <div className="card" style={styles.statCard}>
          <h3>Pending</h3>
          <strong>
            {properties.filter((property) => property.status === "pending").length}
          </strong>
        </div>
      </div>

      <div className="card" style={styles.propertiesCard}>
        <h2>My Properties</h2>

        {loading ? (
          <p>Loading properties...</p>
        ) : properties.length === 0 ? (
          <div style={styles.emptyBox}>
            <h3>No properties yet</h3>
            <p>Register your first hotel or property.</p>
            <Link to="/partner/register-property" className="btn-primary">
              Register Property
            </Link>
          </div>
        ) : (
          <div style={styles.propertyGrid}>
            {properties.map((property) => (
              <div key={property.id} style={styles.propertyCard}>
                <div style={styles.imageWrap}>
                  {property.main_image ? (
                    <img
                      src={property.main_image}
                      alt={property.name}
                      style={styles.propertyImage}
                    />
                  ) : (
                    <div style={styles.emptyImage}>No main photo</div>
                  )}

                  {property.logo_url && (
                    <img
                      src={property.logo_url}
                      alt={`${property.name} logo`}
                      style={styles.logo}
                    />
                  )}
                </div>

                <div style={styles.propertyContent}>
                  <div style={styles.propertyTitleRow}>
                    <h3>{property.name}</h3>
                    <span className={`status-badge status-${property.status}`}>
                      {property.status}
                    </span>
                  </div>

                  <p style={styles.city}>
                    {property.city}
                    {property.district ? `, ${property.district}` : ""}
                  </p>

                  <p style={styles.description}>
                    {property.description || "No description added."}
                  </p>

                  <div style={styles.actionRow}>
                    <button
                      type="button"
                      onClick={() => handleManageProperty(property.id)}
                      style={styles.manageBtn}
                    >
                      Manage Property
                    </button>

                    <Link
                      to={`/hotels/${property.id}`}
                      target="_blank"
                      style={styles.viewBtn}
                    >
                      View Page
                    </Link>
                  </div>

                  <p style={styles.securityNote}>
                    Manage Property requires the password created during property
                    registration.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  noticeCard: {
    padding: "30px",
    textAlign: "center",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "24px",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  logoutBtn: {
    border: "none",
    background: "#ef4444",
    color: "#ffffff",
    padding: "12px 16px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px 18px",
    borderRadius: "14px",
    marginBottom: "18px",
    fontWeight: "800",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
    marginBottom: "22px",
  },

  statCard: {
    padding: "22px",
  },

  propertiesCard: {
    padding: "24px",
  },

  emptyBox: {
    textAlign: "center",
    padding: "35px",
  },

  propertyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginTop: "18px",
  },

  propertyCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
    background: "#ffffff",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
  },

  imageWrap: {
    height: "210px",
    position: "relative",
    background: "#f1f5f9",
  },

  propertyImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  emptyImage: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontWeight: "900",
  },

  logo: {
    position: "absolute",
    left: "16px",
    bottom: "-28px",
    width: "64px",
    height: "64px",
    objectFit: "contain",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "6px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 22px rgba(15, 23, 42, 0.18)",
  },

  propertyContent: {
    padding: "38px 18px 18px",
  },

  propertyTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },

  city: {
    color: "#0b63ce",
    fontWeight: "800",
  },

  description: {
    color: "#64748b",
    lineHeight: "1.5",
  },

  actionRow: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
  },

  manageBtn: {
    flex: 1,
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "12px 14px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },

  viewBtn: {
    flex: 1,
    background: "#eff6ff",
    color: "#0b63ce",
    padding: "12px 14px",
    borderRadius: "12px",
    fontWeight: "900",
    textDecoration: "none",
    textAlign: "center",
  },

  securityNote: {
    marginTop: "12px",
    color: "#64748b",
    fontSize: "13px",
  },
};

export default PartnerDashboardPage;