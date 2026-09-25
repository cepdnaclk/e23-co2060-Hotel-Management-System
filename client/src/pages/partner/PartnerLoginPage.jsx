import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, CalendarDays, Compass, ShieldCheck } from "lucide-react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";
import "../../styles/partnerAuth.css";

function PartnerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get("redirect") || "/partner/dashboard";

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);

      const response = await api.post("/auth/partner/login", form);

      login(response.data.user, response.data.token);
      navigate(redirectTo);
    } catch (error) {
      setError(error.response?.data?.message || "Partner login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="partner-auth-page partner-login-page">
      <div className="partner-auth-bg-art" aria-hidden="true">
        <Building2 className="partner-auth-bg-icon partner-auth-bg-building" />
        <CalendarDays className="partner-auth-bg-icon partner-auth-bg-calendar" />
        <Compass className="partner-auth-bg-icon partner-auth-bg-compass" />
      </div>

      <section className="partner-login-card">
        <aside className="partner-login-brand-panel">
          <div className="partner-login-brand-art" aria-hidden="true">
            <Building2 className="partner-login-brand-building" />
            <span className="partner-login-route route-one" />
            <span className="partner-login-route route-two" />
            <span className="partner-login-dot dot-one" />
            <span className="partner-login-dot dot-two" />
            <span className="partner-login-dot dot-three" />
          </div>

          <div className="partner-login-brand-copy">
            <span className="partner-auth-kicker">TRIPLANKA · PARTNER PORTAL</span>
            <h2>Manage your tourism business.</h2>
            <p>
              Access your hotels, events and guide services from one partner
              account.
            </p>

            <div className="partner-login-service-tags">
              <span>Hotels & Stays</span>
              <span>Tourism Events</span>
              <span>Guide Services</span>
            </div>
          </div>
        </aside>

        <div className="partner-login-form-panel">
          <header className="partner-auth-header partner-login-header">
            <span className="partner-auth-kicker mobile-login-kicker">
              TRIPLANKA · PARTNER PORTAL
            </span>
            <h1>Partner Login</h1>
            <p>Access your TripLanka partner account.</p>
          </header>

          {redirectTo !== "/partner/dashboard" ? (
            <div className="partner-auth-alert info">
              Login first. After login, you will return to the property
              management page.
            </div>
          ) : null}

          {error ? <div className="partner-auth-alert error">{error}</div> : null}

          <form onSubmit={handleSubmit} className="partner-auth-form login-form">
            <div className="partner-auth-field">
              <label htmlFor="partner-login-email">Business Email</label>
              <input
                id="partner-login-email"
                className="partner-auth-input"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="partner@example.com"
                required
              />
            </div>

            <div className="partner-auth-field">
              <label htmlFor="partner-login-password">Password</label>
              <PasswordInput
                id="partner-login-password"
                className="partner-auth-input"
                wrapperClassName="partner-password-wrapper"
                buttonClassName="partner-password-toggle"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="partner-auth-primary-button"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Partner Login"}
            </button>
          </form>

          <div className="partner-auth-trust-note login-trust-note">
            <ShieldCheck size={16} />
            <span>Secure access to your TripLanka partner workspace.</span>
          </div>

          <p className="partner-auth-bottom-text">
            New partner?{" "}
            <Link to="/partner/register">Register Partner</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default PartnerLoginPage;
