import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function PropertyLoginPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoggedIn) {
    return <Navigate to="/partner/login" />;
  }

  if (user?.role !== "partner") {
    return (
      <div className="page">
        <div className="card" style={styles.card}>
          <h2>Access denied</h2>
          <p>This page is only for partners.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!password) {
      setError("Please enter the property management password");
      return;
    }

    try {
      setSubmitting(true);

      await api.post(`/partner/properties/${id}/verify-password`, {
        password,
      });

      sessionStorage.setItem(`property_verified_${id}`, "true");

      setMessage("Property verified successfully");

      setTimeout(() => {
        navigate(`/partner/properties/${id}`);
      }, 300);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Incorrect property password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <form className="card" style={styles.card} onSubmit={handleSubmit}>
        <Link to="/partner/dashboard" style={styles.backLink}>
          ← Back to Dashboard
        </Link>

        <div style={styles.icon}>🔐</div>

        <h1>Verify Property</h1>

        <p style={styles.subtitle}>
          Enter the password you created during property registration to manage
          this property.
        </p>

        {message && <div style={styles.successBox}>{message}</div>}
        {error && <div style={styles.errorBox}>{error}</div>}

        <label style={styles.label}>Property Management Password</label>

        <div style={styles.passwordRow}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={styles.input}
            placeholder="Enter property password"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={styles.showBtn}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button type="submit" style={styles.submitBtn} disabled={submitting}>
          {submitting ? "Checking..." : "Verify and Manage Property"}
        </button>

        <p style={styles.note}>
          For old existing properties, temporary password is{" "}
          <strong>Property@123</strong>.
        </p>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 80px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    background: "#f8fafc",
  },

  card: {
    width: "100%",
    maxWidth: "520px",
    padding: "32px",
  },

  backLink: {
    color: "#0b63ce",
    fontWeight: "800",
    textDecoration: "none",
  },

  icon: {
    width: "72px",
    height: "72px",
    borderRadius: "22px",
    background: "#eff6ff",
    color: "#0b63ce",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
    margin: "20px 0",
  },

  subtitle: {
    color: "#64748b",
    lineHeight: "1.6",
  },

  successBox: {
    background: "#dcfce7",
    color: "#166534",
    padding: "13px 15px",
    borderRadius: "12px",
    marginBottom: "14px",
    fontWeight: "800",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "13px 15px",
    borderRadius: "12px",
    marginBottom: "14px",
    fontWeight: "800",
  },

  label: {
    display: "block",
    marginTop: "18px",
    marginBottom: "8px",
    fontWeight: "900",
  },

  passwordRow: {
    display: "flex",
    gap: "10px",
  },

  input: {
    flex: 1,
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
  },

  showBtn: {
    border: "none",
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "0 14px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },

  submitBtn: {
    width: "100%",
    marginTop: "18px",
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "14px 18px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },

  note: {
    marginTop: "16px",
    color: "#92400e",
    background: "#fffbeb",
    padding: "12px",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "14px",
  },
};

export default PropertyLoginPage;