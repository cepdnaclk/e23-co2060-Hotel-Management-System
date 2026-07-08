import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/hotels", label: "Hotels" },
  { to: "/explore", label: "Explore" },
  { to: "/trip-planner", label: "Plan Trip" },
  { to: "/events", label: "Events" },
  { to: "/tourist-guides", label: "Guides" },
  { to: "/about", label: "About Us" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "si", label: "සිංහල" },
  { value: "ta", label: "தமிழ்" },
];

const currencies = [
  { value: "LKR", label: "LKR" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
];


function SiteFooter({ onNavigateTop }) {
  return (
    <footer className="public-site-footer">
      <div className="footer-glow footer-glow-left" />
      <div className="footer-glow footer-glow-right" />

      <div className="public-footer-inner">
        <div className="public-footer-main">
          <div className="public-footer-brand-card">
            <Link to="/" onClick={onNavigateTop} className="public-footer-logo">
              <span className="public-footer-logo-mark">🌴</span>
              <span>TourismHub LK</span>
            </Link>
            <p>
              A smart Sri Lankan travel platform for discovering places, booking verified stays,
              planning journeys, finding events, and connecting with trusted travel services.
            </p>

            <div className="public-footer-trust-grid">
              <div>
                <span>Tourism hotline</span>
                <strong>1912</strong>
              </div>
              <div>
                <span>Emergency service</span>
                <strong>1990</strong>
              </div>
            </div>
          </div>

          <div className="public-footer-column">
            <h3>Explore</h3>
            <Link to="/explore" onClick={onNavigateTop}>Explore Sri Lanka</Link>
            <Link to="/hotels" onClick={onNavigateTop}>Verified hotels</Link>
            <Link to="/trip-planner" onClick={onNavigateTop}>Plan a trip</Link>
            <Link to="/events" onClick={onNavigateTop}>Events</Link>
            <Link to="/tourist-guides" onClick={onNavigateTop}>Tourist guides</Link>
          </div>

          <div className="public-footer-column">
            <h3>Partners</h3>
            <Link to="/list-your-property" onClick={onNavigateTop}>List your property</Link>
            <Link to="/partner/login" onClick={onNavigateTop}>Partner login</Link>
            <Link to="/partner/register" onClick={onNavigateTop}>Partner register</Link>
            <Link to="/about" onClick={onNavigateTop}>About the platform</Link>
          </div>

          <div className="public-footer-column">
            <h3>Support</h3>
            <Link to="/about" onClick={onNavigateTop}>About us</Link>
            <Link to="/my-bookings" onClick={onNavigateTop}>My bookings</Link>
            <Link to="/login" onClick={onNavigateTop}>Login</Link>
            <Link to="/register" onClick={onNavigateTop}>Create account</Link>
          </div>

          <div className="public-footer-column official-links">
            <h3>Travel essentials</h3>
            <a href="https://www.sltda.gov.lk/" target="_blank" rel="noreferrer">Sri Lanka Tourism Development Authority</a>
            <a href="https://www.immigration.gov.lk/" target="_blank" rel="noreferrer">Immigration & Emigration</a>
            <a href="https://www.airport.lk/" target="_blank" rel="noreferrer">Airport & Aviation Services</a>
            <a href="https://www.srilankan.com/" target="_blank" rel="noreferrer">SriLankan Airlines</a>
          </div>
        </div>

        <div className="public-footer-strip">
          <div>
            <strong>Built for Sri Lankan travel.</strong>
            <span>Hotels, places, trips, events, guides, and bookings connected in one trusted system.</span>
          </div>
          <div className="public-footer-socials" aria-label="Social links">
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">f</a>
            <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube">▶</a>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">◎</a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn">in</a>
          </div>
        </div>

        <div className="public-footer-bottom">
          <p>© 2026 TourismHub LK. Smart Hotel & Tourism Management System.</p>
          <div>
            <Link to="/about" onClick={onNavigateTop}>Privacy Policy</Link>
            <Link to="/about" onClick={onNavigateTop}>Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function PublicLayout() {
  const { user, isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState(
    () => localStorage.getItem("tourismhub_language") || "en"
  );
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("tourismhub_currency") || "LKR"
  );
  const [showScrollTop, setShowScrollTop] = useState(false);

  const username =
    user?.full_name ||
    user?.name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Traveler";

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem("tourismhub_language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("tourismhub_currency", currency);
  }, [currency]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 420);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleNavigateTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  return (
    <div className="tourismhub-shell">
      <style>{layoutCss}</style>

      <header className="site-header">
        <div className="top-line" />

        <div className="site-header-inner">
          <Link to="/" className="brand-link" aria-label="TourismHub LK home">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-mark-sun" />
              <span className="brand-mark-wave" />
              <strong>TH</strong>
            </span>
            <span className="brand-name">
              TourismHub <span>LK</span>
            </span>
          </Link>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            <span className="hamburger-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          <nav className={`main-navigation ${menuOpen ? "main-navigation-open" : ""}`}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  isActive ? "nav-item nav-item-active" : "nav-item"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className={`header-actions ${menuOpen ? "header-actions-open" : ""}`}>
            <Link to="/list-your-property" className="property-link">
              List your property
            </Link>

            <label className="clean-select" title="Select language">
              <span>🌐</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                aria-label="Select language"
              >
                {languages.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="clean-select" title="Select currency">
              <span>💱</span>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                aria-label="Select currency"
              >
                {currencies.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            {isLoggedIn ? (
              <>
                <Link
                  to="/my-bookings"
                  className="booking-link cart-icon-link"
                  title="My bookings"
                  aria-label="Open booking cart"
                >
                  🛒
                </Link>
                <span className="user-greeting">Hi, {username}</span>
                <button type="button" className="logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="login-link">
                  Login
                </Link>
                <Link to="/register" className="register-link">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="page-body">
        <Outlet />
      </main>

      <SiteFooter onNavigateTop={handleNavigateTop} />

      <button
        type="button"
        className={`floating-scroll-top ${showScrollTop ? "is-visible" : ""}`}
        aria-label="Back to top"
        title="Back to top"
        onClick={scrollToTop}
      >
        <span className="floating-scroll-icon">↑</span>
        <span className="floating-scroll-text">Back to top</span>
      </button>
    </div>
  );
}

const layoutCss = `
  :root {
    --hub-green: #087568;
    --hub-green-dark: #034943;
    --hub-gold: #d99a14;
    --hub-paper: #f7f1e4;
    --hub-ink: #1f2937;
    --hub-muted: #6b7280;
    --hub-line: #e5e7eb;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: #ffffff;
    color: var(--hub-ink);
    font-family: var(--font-sans, Inter, Aptos, "Segoe UI", Roboto, Arial, sans-serif);
  }

  a { color: inherit; }

  .tourismhub-shell {
    min-height: 100vh;
    background: #ffffff;
  }

  .site-header {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.98);
    border-bottom: 1px solid var(--hub-line);
    box-shadow: 0 8px 26px rgba(15, 23, 42, 0.035);
    backdrop-filter: blur(14px);
  }

  .top-line {
    height: 3px;
    background: linear-gradient(90deg, var(--hub-green), #14b8a6, var(--hub-gold));
  }

  .site-header-inner {
    width: 100%;
    min-height: 76px;
    margin: 0 auto;
    padding: 0 clamp(22px, 3vw, 48px);
    display: grid;
    grid-template-columns: minmax(228px, max-content) minmax(0, 1fr) max-content;
    align-items: center;
    column-gap: clamp(18px, 2vw, 34px);
  }

  .brand-link {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    min-width: max-content;
    text-decoration: none;
    flex: 0 0 auto;
  }

  .brand-mark {
    position: relative;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 16px;
    overflow: hidden;
    color: #ffffff;
    background:
      radial-gradient(circle at 70% 25%, #facc15 0 16%, transparent 17%),
      linear-gradient(135deg, #047857 0%, #079b8f 55%, #0ea5e9 100%);
    box-shadow: 0 14px 28px rgba(8, 117, 104, 0.22);
  }

  .brand-mark::before {
    content: "";
    position: absolute;
    left: 8px;
    bottom: 10px;
    width: 28px;
    height: 11px;
    border-radius: 999px 999px 0 0;
    background: rgba(255, 255, 255, 0.30);
    transform: rotate(-8deg);
  }

  .brand-mark-sun,
  .brand-mark-wave {
    position: absolute;
    pointer-events: none;
  }

  .brand-mark-sun {
    right: 9px;
    top: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fde68a;
    box-shadow: 0 0 0 4px rgba(253, 230, 138, 0.22);
  }

  .brand-mark-wave {
    left: 8px;
    right: 7px;
    bottom: 9px;
    height: 7px;
    border-radius: 999px;
    border-top: 2px solid rgba(255, 255, 255, 0.78);
  }

  .brand-mark strong {
    position: relative;
    z-index: 1;
    transform: translateY(-1px);
    color: #ffffff;
    font-size: 13px;
    font-weight: 850;
    line-height: 1;
  }

  .brand-name {
    color: var(--hub-green);
    font-size: clamp(22px, 1.7vw, 27px);
    font-weight: 800;
    letter-spacing: 0;
  }

  .brand-name span {
    color: #0f9f8f;
  }

  .main-navigation {
    justify-self: center;
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(14px, 1.45vw, 25px);
    overflow: visible;
    scrollbar-width: none;
  }

  .main-navigation::-webkit-scrollbar {
    display: none;
  }

  .nav-item {
    position: relative;
    color: #111827;
    text-decoration: none;
    font-size: 13px;
    font-weight: 730;
    line-height: 1;
    padding: 30px 0 29px;
    white-space: nowrap;
    transition: color 0.18s ease;
  }

  .nav-item:hover,
  .nav-item-active {
    color: var(--hub-green);
  }

  .nav-item-active::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 17px;
    height: 2px;
    background: var(--hub-green);
    border-radius: 999px;
  }

  .header-actions {
    justify-self: end;
    max-width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    white-space: nowrap;
  }

  .property-link,
  .login-link,
  .register-link,
  .logout-button,
  .booking-link {
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    border-radius: 999px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 760;
    border: 1px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    flex: 0 0 auto;
    transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
  }

  .property-link {
    background: var(--hub-green);
    color: #ffffff;
    box-shadow: 0 10px 22px rgba(8, 117, 104, 0.16);
  }

  .login-link,
  .booking-link {
    background: #ffffff;
    color: var(--hub-green);
    border-color: rgba(8, 117, 104, 0.28);
  }

  .cart-icon-link {
    width: 38px;
    min-width: 38px;
    height: 38px;
    min-height: 38px;
    padding: 0;
    font-size: 19px;
    line-height: 1;
    border-radius: 14px;
    background: #effdfa;
    border-color: #b7eee6;
    box-shadow: 0 8px 22px rgba(8, 117, 104, 0.08);
  }

  .register-link {
    background: #0f766e;
    color: #ffffff;
    box-shadow: 0 10px 22px rgba(8, 117, 104, 0.14);
  }

  .logout-button {
    background: #ef4444;
    color: #ffffff;
    box-shadow: 0 10px 22px rgba(239, 68, 68, 0.16);
  }

  .property-link:hover,
  .login-link:hover,
  .register-link:hover,
  .logout-button:hover,
  .booking-link:hover {
    transform: translateY(-1px);
  }

  .clean-select {
    height: 38px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 1px solid rgba(8, 117, 104, 0.18);
    background: #ffffff;
    border-radius: 999px;
    padding: 0 9px;
    color: var(--hub-green);
    font-size: 13px;
    font-weight: 760;
  }

  .clean-select select {
    border: 0;
    outline: 0;
    background: transparent;
    color: #111827;
    font-size: 13px;
    font-weight: 720;
    cursor: pointer;
    max-width: 76px;
  }

  .user-greeting {
    color: #1f2937;
    font-size: 13px;
    font-weight: 720;
    max-width: 126px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-menu-button {
    display: none;
    width: 38px;
    height: 38px;
    border: 1px solid rgba(8, 117, 104, 0.22);
    background: #ffffff;
    border-radius: 10px;
    color: var(--hub-green);
    font-size: 20px;
    cursor: pointer;
  }

  .page-body {
    min-height: calc(100vh - 69px);
  }



  .public-site-footer {
    position: relative;
    isolation: isolate;
    margin-top: 90px;
    overflow: hidden;
    background:
      radial-gradient(circle at 14% 12%, rgba(251, 191, 36, 0.20), transparent 24rem),
      radial-gradient(circle at 86% 10%, rgba(20, 184, 166, 0.22), transparent 25rem),
      linear-gradient(135deg, #042f2e 0%, #075e55 48%, #0b8796 100%);
    color: #ffffff;
    box-shadow: 0 -26px 70px rgba(6, 78, 69, 0.18);
  }

  .footer-glow {
    position: absolute;
    z-index: -1;
    width: 360px;
    height: 360px;
    border-radius: 50%;
    filter: blur(10px);
    opacity: 0.28;
    pointer-events: none;
  }

  .footer-glow-left {
    left: -130px;
    bottom: -170px;
    background: #fbbf24;
  }

  .footer-glow-right {
    right: -140px;
    top: -160px;
    background: #2dd4bf;
  }

  .public-footer-inner {
    width: min(1280px, calc(100% - 52px));
    margin: 0 auto;
    padding: 60px 0 28px;
  }

  .public-footer-main {
    display: grid;
    grid-template-columns: minmax(260px, 1.35fr) repeat(3, minmax(140px, 0.72fr)) minmax(190px, 0.95fr);
    gap: 36px;
    align-items: start;
  }

  .public-footer-brand-card {
    padding: 24px;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.09);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(14px);
  }

  .public-footer-logo {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: #ffffff;
    text-decoration: none;
    font-size: 29px;
    font-weight: 950;
    letter-spacing: -0.045em;
  }

  .public-footer-logo-mark {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(255,255,255,0.24), rgba(255,255,255,0.08));
    border: 1px solid rgba(255,255,255,0.22);
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.12);
  }

  .public-footer-brand-card p {
    margin: 20px 0 22px;
    color: rgba(255, 255, 255, 0.80);
    line-height: 1.75;
    font-size: 14.5px;
    font-weight: 650;
  }

  .public-footer-trust-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .public-footer-trust-grid div {
    padding: 15px 15px 14px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.11);
    border: 1px solid rgba(255, 255, 255, 0.16);
  }

  .public-footer-trust-grid span,
  .public-footer-trust-grid strong {
    display: block;
  }

  .public-footer-trust-grid span {
    color: rgba(255, 255, 255, 0.72);
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.13em;
    line-height: 1.35;
  }

  .public-footer-trust-grid strong {
    margin-top: 8px;
    color: #fde68a;
    font-size: 27px;
    font-weight: 950;
    letter-spacing: -0.04em;
  }

  .public-footer-column h3 {
    margin: 8px 0 18px;
    color: #fde68a;
    font-size: 12px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }

  .public-footer-column a {
    display: block;
    width: fit-content;
    margin: 12px 0;
    color: rgba(255, 255, 255, 0.84);
    text-decoration: none;
    font-size: 14px;
    font-weight: 760;
    line-height: 1.35;
    transition: color 0.18s ease, transform 0.18s ease;
  }

  .public-footer-column a:hover {
    color: #fde68a;
    transform: translateX(5px);
  }

  .official-links a {
    color: rgba(255, 255, 255, 0.74);
  }

  .public-footer-strip {
    margin-top: 42px;
    padding: 24px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.16);
    border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  }

  .public-footer-strip strong,
  .public-footer-strip span {
    display: block;
  }

  .public-footer-strip strong {
    color: #ffffff;
    font-size: 18px;
    font-weight: 950;
  }

  .public-footer-strip span {
    margin-top: 5px;
    color: rgba(255, 255, 255, 0.74);
    font-weight: 650;
  }

  .public-footer-socials {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .public-footer-socials a {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #ffffff;
    color: var(--hub-green);
    text-decoration: none;
    font-size: 13px;
    font-weight: 950;
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.14);
    transition: transform 0.18s ease, background 0.18s ease;
  }

  .public-footer-socials a:hover {
    transform: translateY(-3px);
    background: #fde68a;
  }

  .public-footer-bottom {
    padding-top: 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    color: rgba(255, 255, 255, 0.78);
    font-size: 13px;
    font-weight: 650;
  }

  .public-footer-bottom p {
    margin: 0;
  }

  .public-footer-bottom div {
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
  }

  .public-footer-bottom a {
    color: rgba(255, 255, 255, 0.84);
    text-decoration: none;
    font-weight: 800;
  }

  .public-footer-bottom a:hover {
    color: #fde68a;
  }

  .floating-scroll-top {
    position: fixed;
    left: 24px;
    bottom: 24px;
    z-index: 1200;
    min-width: 154px;
    height: 58px;
    padding: 8px 18px 8px 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-radius: 999px;
    border: 1px solid rgba(251, 191, 36, 0.72);
    background: linear-gradient(135deg, #043f3a 0%, #087568 56%, #c89116 100%);
    color: #ffffff;
    cursor: pointer;
    opacity: 0;
    transform: translateY(18px) scale(0.96);
    pointer-events: none;
    box-shadow: 0 20px 46px rgba(6, 78, 69, 0.30), 0 0 0 8px rgba(251, 191, 36, 0.10);
    transition: opacity 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
  }

  .floating-scroll-top.is-visible {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  .floating-scroll-icon {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #fbbf24;
    color: #043f3a;
    font-size: 26px;
    font-weight: 950;
    line-height: 1;
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.62);
  }

  .floating-scroll-text {
    font-size: 12px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  .floating-scroll-top:hover {
    transform: translateY(-4px) scale(1.03);
    box-shadow: 0 25px 56px rgba(6, 78, 69, 0.40), 0 0 0 12px rgba(251, 191, 36, 0.15);
  }

  @media (max-width: 1500px) {
    .site-header-inner {
      grid-template-columns: minmax(215px, max-content) minmax(0, 1fr) max-content;
      min-height: 70px;
      padding-left: 18px;
      padding-right: 18px;
      column-gap: 16px;
    }

    .brand-name {
      font-size: 22px;
    }

    .main-navigation {
      justify-content: center;
      gap: 15px;
    }

    .nav-item {
      font-size: 12.5px;
    }

    .property-link,
    .login-link,
    .register-link,
    .logout-button,
    .booking-link {
      padding-left: 11px;
      padding-right: 11px;
      font-size: 12.5px;
    }

    .clean-select {
      padding-left: 7px;
      padding-right: 7px;
    }

    .user-greeting {
      max-width: 96px;
    }
  }

  @media (max-width: 1280px) {
    .site-header-inner {
      grid-template-columns: 1fr;
      justify-items: center;
      padding: 12px 18px 10px;
      row-gap: 10px;
    }

    .brand-link {
      justify-self: center;
    }

    .header-actions {
      grid-column: 1;
      grid-row: 2;
      justify-self: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .main-navigation {
      grid-column: 1;
      grid-row: 3;
      width: 100%;
      justify-content: center;
      gap: 20px;
      padding: 2px 0 0;
    }

    .nav-item {
      padding-top: 12px;
      padding-bottom: 13px;
    }

    .nav-item-active::after {
      bottom: 4px;
    }
  }

  @media (max-width: 760px) {
    .site-header-inner {
      padding: 11px 14px;
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 10px;
    }

    .brand-link {
      min-width: 0;
      overflow: hidden;
      justify-self: start;
    }

    .brand-name {
      font-size: 22px;
      letter-spacing: 0;
      white-space: nowrap;
    }

    .brand-mark {
      width: 40px;
      height: 40px;
      border-radius: 14px;
    }

    .mobile-menu-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      justify-self: end;
      width: 42px;
      height: 42px;
      border: 1px solid rgba(8, 117, 104, 0.28);
      background: #ffffff;
      border-radius: 12px;
      color: var(--hub-green);
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(8, 117, 104, 0.08);
    }

    .hamburger-lines {
      width: 19px;
      display: inline-flex;
      flex-direction: column;
      gap: 4px;
    }

    .hamburger-lines span {
      display: block;
      height: 2px;
      width: 100%;
      background: var(--hub-green-dark);
      border-radius: 999px;
      transition: transform 0.18s ease, opacity 0.18s ease;
    }

    .mobile-menu-button[aria-expanded="true"] .hamburger-lines span:nth-child(1) {
      transform: translateY(6px) rotate(45deg);
    }

    .mobile-menu-button[aria-expanded="true"] .hamburger-lines span:nth-child(2) {
      opacity: 0;
    }

    .mobile-menu-button[aria-expanded="true"] .hamburger-lines span:nth-child(3) {
      transform: translateY(-6px) rotate(-45deg);
    }

    .main-navigation,
    .header-actions {
      grid-column: 1 / -1;
      display: none;
    }

    .main-navigation.main-navigation-open {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      width: 100%;
      margin-top: 8px;
      padding: 12px;
      background: #ffffff;
      border: 1px solid rgba(8, 117, 104, 0.12);
      border-radius: 18px 18px 8px 8px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    }

    .header-actions.header-actions-open {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 0 12px 13px;
      margin-top: -10px;
      background: #ffffff;
      border: 1px solid rgba(8, 117, 104, 0.12);
      border-top: 0;
      border-radius: 0 0 18px 18px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    }

    .nav-item {
      width: 100%;
      padding: 11px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 850;
      line-height: 1;
      background: #f8fafc;
      border: 1px solid rgba(8, 117, 104, 0.11);
      text-align: center;
    }

    .nav-item-active::after {
      display: none;
    }

    .nav-item-active {
      color: var(--hub-green);
      background: #ecfdf5;
      border-color: rgba(8, 117, 104, 0.28);
    }

    .property-link,
    .login-link,
    .register-link,
    .logout-button,
    .booking-link {
      min-height: 36px;
      padding: 0 14px;
      font-size: 12px;
      flex: 0 0 auto;
    }

    .cart-icon-link {
      width: 38px;
      min-width: 38px;
      height: 38px;
      min-height: 38px;
      padding: 0;
      font-size: 18px;
      border-radius: 13px;
    }

    .clean-select {
      height: 36px;
      padding: 0 9px;
      flex: 0 0 auto;
    }

    .clean-select select {
      max-width: 76px;
      font-size: 12px;
    }

    .user-greeting {
      max-width: 160px;
      font-size: 12px;
      flex: 1 1 100%;
      text-align: center;
      order: -1;
      color: var(--hub-green-dark);
    }
  }

  @media (max-width: 520px) {
    .site-header-inner {
      padding-left: 11px;
      padding-right: 11px;
    }

    .brand-name {
      font-size: 20px;
    }

    .main-navigation.main-navigation-open {
      grid-template-columns: 1fr;
    }

    .header-actions.header-actions-open {
      justify-content: center;
    }

    .property-link {
      flex: 1 1 100%;
    }

    .logout-button,
    .register-link,
    .login-link {
      min-width: 104px;
    }
  }

  @media (max-width: 1120px) {
    .public-footer-main {
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 30px;
    }

    .official-links {
      grid-column: span 2;
    }
  }

  @media (max-width: 760px) {
    .public-site-footer {
      margin-top: 64px;
    }

    .public-footer-inner {
      width: min(100% - 28px, 1280px);
      padding: 42px 0 24px;
    }

    .public-footer-main {
      grid-template-columns: 1fr;
      gap: 28px;
    }

    .official-links {
      grid-column: auto;
    }

    .public-footer-brand-card {
      padding: 20px;
      border-radius: 24px;
    }

    .public-footer-logo {
      font-size: 25px;
    }

    .public-footer-trust-grid {
      grid-template-columns: 1fr;
    }

    .public-footer-strip,
    .public-footer-bottom {
      flex-direction: column;
      align-items: flex-start;
    }

    .floating-scroll-top {
      left: 15px;
      bottom: 18px;
      min-width: 58px;
      width: 58px;
      height: 58px;
      padding: 8px;
      border-radius: 50%;
    }

    .floating-scroll-text {
      display: none;
    }
  }

`;

export default PublicLayout;
