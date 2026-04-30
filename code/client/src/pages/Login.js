import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import LanguageCurrencySelector from "../components/LanguageCurrencySelector";
import { useAppSettings } from "../context/AppSettingsContext";

function Login() {
  const navigate = useNavigate();
  const { t } = useAppSettings();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMessage({ type: "", text: "" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      setMessage({
        type: "error",
        text: t("enterEmailPassword") || "Please enter your email and password.",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || t("invalidLogin") || "Invalid email or password.",
        });
        return;
      }

      if (rememberMe) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("name", data.name || "");
      } else {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("role", data.role);
        sessionStorage.setItem("name", data.name || "");
      }

      setMessage({
        type: "success",
        text: t("loginSuccess") || "Login successful. Redirecting...",
      });

      setTimeout(() => {
        if (data.role === "admin") {
          navigate("/admin");
        } else if (data.role === "partner") {
          navigate("/partner-dashboard");
        } else {
          navigate("/");
        }
      }, 700);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          t("serverConnectionFailed") ||
          "Cannot connect to server. Please check if backend is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/" className="login-brand">
          <div className="login-brand-icon">🌴</div>
          <div>
            <h2>TourismHub LK</h2>
            <span>Smart Hotel & Tourism</span>
          </div>
        </Link>

        <nav className="login-nav">
          <LanguageCurrencySelector />
          <Link to="/">{t("home")}</Link>
          <Link to="/partner">{t("listProperty")}</Link>
          <Link to="/register" className="login-outline-btn">
            {t("register")}
          </Link>
        </nav>
      </header>

      <main className="login-main">
        <section className="login-left">
          <div className="login-left-content">
            <span className="login-badge">
              {t("welcomeBack") || "Welcome Back"}
            </span>

            <h1>
              {t("loginHeroTitle") ||
                "Sign in and continue your Sri Lanka journey"}
            </h1>

            <p>
              {t("loginHeroSubtitle") ||
                "Access your bookings, saved hotels, partner dashboard, and admin tools using one secure TourismHub LK account."}
            </p>

            <div className="login-benefits">
              <div className="login-benefit-card">
                <span>🏨</span>
                <div>
                  <h3>{t("bookHotelsFaster") || "Book Hotels Faster"}</h3>
                  <p>
                    {t("loginBenefitBooking") ||
                      "Continue your searches and manage reservations easily."}
                  </p>
                </div>
              </div>

              <div className="login-benefit-card">
                <span>🔐</span>
                <div>
                  <h3>{t("secureLogin") || "Secure Login"}</h3>
                  <p>
                    {t("secureLoginDesc") ||
                      "Your account uses role-based access for better safety."}
                  </p>
                </div>
              </div>

              <div className="login-benefit-card">
                <span>🌴</span>
                <div>
                  <h3>{t("exploreSriLanka") || "Explore Sri Lanka"}</h3>
                  <p>
                    {t("exploreSriLankaDesc") ||
                      "Discover stays, events, and experiences in one platform."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="login-card-section">
          <div className="login-card">
            <div className="login-card-header">
              <span>👋</span>
              <h2>{t("loginTitle")}</h2>
              <p>{t("loginSubtitle")}</p>
            </div>

            {message.text && (
              <div className={`login-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              <div className="login-field">
                <label>{t("email")}</label>
                <div className="login-input-wrap">
                  <span>✉️</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="login-field">
                <label>{t("password")}</label>
                <div className="login-input-wrap">
                  <span>🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={t("enterPassword") || "Enter your password"}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword
                      ? t("hidePassword") || "Hide"
                      : t("showPassword") || "Show"}
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="remember-box">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>{t("rememberMe")}</span>
                </label>

                <Link to="/forgot-password">
                  {t("forgotPassword")}
                </Link>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? t("signingIn") || "Signing in..." : t("signIn")}
              </button>
            </form>

            <div className="demo-login-box">
              <h4>{t("demoLoginGuide") || "Demo login guide"}</h4>
              <p>
                {t("demoLoginGuideDesc") ||
                  "Use the email and password you inserted into your database using registration or Postman."}
              </p>
            </div>

            <div className="login-footer-text">
              <p>
                {t("doNotHaveAccount") || "Do not have an account?"}{" "}
                <Link to="/register">{t("createAccount")}</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;