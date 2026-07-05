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

  const username =
    user?.full_name ||
    user?.name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Traveler";

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem("tourismhub_language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("tourismhub_currency", currency);
  }, [currency]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  return (
    <div className="tourismhub-shell">
      <style>{layoutCss}</style>

      <header className="site-header">
        <div className="top-line" />

        <div className="site-header-inner">
          <Link to="/" className="brand-link" aria-label="TourismHub LK home">
            <span className="brand-icon">🌴</span>
            <span className="brand-name">TourismHub LK</span>
          </Link>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label="Open navigation menu"
          >
            ☰
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

          <div className="header-actions">
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
    background: var(--hub-paper);
    color: var(--hub-ink);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  a { color: inherit; }

  .tourismhub-shell {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(20, 184, 166, 0.09), transparent 34rem),
      linear-gradient(135deg, #f8f4ea 0%, #ffffff 52%, #f0fdfa 100%);
  }

  .site-header {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.97);
    border-bottom: 1px solid var(--hub-line);
    box-shadow: 0 6px 22px rgba(15, 23, 42, 0.045);
    backdrop-filter: blur(14px);
  }

  .top-line {
    height: 3px;
    background: linear-gradient(90deg, var(--hub-green), #14b8a6, var(--hub-gold));
  }

  .site-header-inner {
    width: min(1440px, 100%);
    min-height: 66px;
    margin: 0 auto;
    padding: 0 30px;
    display: flex;
    align-items: center;
    gap: 26px;
  }

  .brand-link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: max-content;
    text-decoration: none;
  }

  .brand-icon {
    font-size: 24px;
    line-height: 1;
  }

  .brand-name {
    color: var(--hub-green);
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -0.03em;
  }

  .main-navigation {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  .nav-item {
    position: relative;
    color: #111827;
    text-decoration: none;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
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
    bottom: -11px;
    height: 2px;
    background: var(--hub-green);
    border-radius: 999px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    white-space: nowrap;
  }

  .property-link,
  .login-link,
  .register-link,
  .logout-button,
  .booking-link {
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    border-radius: 999px;
    padding: 0 14px;
    font-size: 12px;
    font-weight: 800;
    border: 1px solid transparent;
    cursor: pointer;
    white-space: nowrap;
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
    height: 34px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 1px solid rgba(8, 117, 104, 0.18);
    background: #ffffff;
    border-radius: 999px;
    padding: 0 8px;
    color: var(--hub-green);
    font-size: 12px;
    font-weight: 800;
  }

  .clean-select select {
    border: 0;
    outline: 0;
    background: transparent;
    color: #111827;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    max-width: 78px;
  }

  .user-greeting {
    color: #1f2937;
    font-size: 12px;
    font-weight: 800;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
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

  @media (max-width: 1180px) {
    .site-header-inner {
      min-height: auto;
      padding: 12px 20px;
      flex-wrap: wrap;
      gap: 14px;
    }

    .main-navigation {
      order: 3;
      width: 100%;
      justify-content: flex-start;
      gap: 18px;
      overflow-x: auto;
      padding: 8px 0 3px;
    }

    .header-actions {
      margin-left: auto;
    }
  }

  @media (max-width: 760px) {
    .site-header-inner {
      padding: 10px 14px;
    }

    .brand-name {
      font-size: 21px;
    }

    .mobile-menu-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
    }

    .main-navigation {
      display: none;
      order: 4;
      width: 100%;
      flex-direction: column;
      align-items: stretch;
      gap: 0;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 8px;
      box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
    }

    .main-navigation-open {
      display: flex;
    }

    .nav-item {
      width: 100%;
      padding: 12px 10px;
      border-radius: 10px;
    }

    .nav-item-active::after {
      display: none;
    }

    .nav-item-active {
      background: #ecfdf5;
    }

    .header-actions {
      order: 3;
      width: 100%;
      justify-content: flex-start;
      overflow-x: auto;
      padding-bottom: 4px;
    }
  }
`;

export default PublicLayout;
