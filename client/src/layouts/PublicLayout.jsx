import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import TripBasketWidget from "../components/TripBasketWidget";

const shouldHideTripBasket = (pathname) =>
  pathname.startsWith("/partner") ||
  pathname.startsWith("/admin") ||
  pathname === "/list-your-property" ||
  pathname === "/trip-planner";

const navLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/hotels", label: "Hotels" },
  { to: "/explore", label: "Explore" },
  { to: "/trip-planner", label: "Plan Trip" },
  { to: "/events", label: "Events" },
  { to: "/tourist-guides", label: "Guides" },
  { to: "/about", label: "About Us" },
];

function TripLankaLogoMark({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="2" width="60" height="60" rx="18" fill="#087568" />
      <path
        d="M2 39C13 31 22 31 31 36C41 42 49 39 62 30V62H2V39Z"
        fill="#0ea99b"
      />
      <path
        d="M2 47C13 41 22 42 31 47C42 53 51 48 62 40V62H2V47Z"
        fill="#19bec6"
        opacity="0.92"
      />

      <circle cx="48" cy="15" r="8" fill="#f4c247" />

      <circle
        cx="30.5"
        cy="29.5"
        r="15.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        opacity="0.94"
      />

      <path d="M30.5 10L34 18H27L30.5 10Z" fill="#ffffff" />
      <path d="M30.5 49L27 42H34L30.5 49Z" fill="#d9fffa" opacity="0.9" />
      <path d="M11 29.5L19 26V33L11 29.5Z" fill="#d9fffa" opacity="0.9" />
      <path d="M50 29.5L42 33V26L50 29.5Z" fill="#ffffff" />

      <path
        d="M39.5 20.5L34.2 32.5L22 40L27.3 28L39.5 20.5Z"
        fill="#f5b927"
      />
      <path
        d="M22 40L27.3 28L34.2 32.5L22 40Z"
        fill="#ffffff"
        opacity="0.98"
      />
      <circle cx="30.7" cy="30.2" r="2.4" fill="#075f57" />

      <path
        d="M8 47C16 42.5 23.5 43 30 46.5C37 50.5 45 50 56 43"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M9 52C17 48.5 24 49 31 52C39 55.5 47 54 56 49"
        fill="none"
        stroke="#9ff3e9"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SiteFooter({ onNavigateTop }) {
  return (
    <footer className="public-site-footer">
      <div className="public-footer-inner">
        <div className="public-footer-top">
          <div className="public-footer-brand">
            <Link
              to="/"
              onClick={onNavigateTop}
              className="public-footer-logo"
              aria-label="TripLanka home"
              data-no-translate
            >
              <span
                className="public-footer-logo-mark trip-lanka-footer-mark"
                aria-hidden="true"
              >
                <TripLankaLogoMark className="footer-logo-svg" />
              </span>

              <span className="public-footer-logo-copy">
                <strong>Trip<span className="footer-brand-lanka">Lanka</span></strong>
                <small>Plan · Explore · Travel</small>
              </span>
            </Link>

            <p>
              Explore destinations, book verified stays, build
              day-by-day trips, discover events, and connect with
              trusted tourist guides in one place.
            </p>

            <div className="public-footer-contact-row">
              <a
                href="tel:1912"
                className="public-footer-contact"
              >
                <span>Tourism hotline</span>
                <strong>1912</strong>
              </a>

              <a
                href="tel:1990"
                className="public-footer-contact"
              >
                <span>Emergency</span>
                <strong>1990</strong>
              </a>
            </div>
          </div>

          <div className="public-footer-links-grid">
            <div className="public-footer-column">
              <h3>Explore</h3>

              <Link to="/explore" onClick={onNavigateTop}>
                Explore Sri Lanka
              </Link>

              <Link to="/hotels" onClick={onNavigateTop}>
                Hotels
              </Link>

              <Link to="/trip-planner" onClick={onNavigateTop}>
                Plan a trip
              </Link>

              <Link to="/events" onClick={onNavigateTop}>
                Events
              </Link>

              <Link to="/tourist-guides" onClick={onNavigateTop}>
                Tourist guides
              </Link>
            </div>

            <div className="public-footer-column">
              <h3>Account</h3>

              <Link to="/my-bookings" onClick={onNavigateTop}>
                My bookings
              </Link>

              <Link to="/my-reports" onClick={onNavigateTop}>
                My Reports
              </Link>

              <Link to="/login" onClick={onNavigateTop}>
                Login
              </Link>

              <Link to="/register" onClick={onNavigateTop}>
                Create account
              </Link>

              <Link to="/about" onClick={onNavigateTop}>
                About us
              </Link>
            </div>

            <div className="public-footer-column">
              <h3>Partners</h3>

              <Link to="/list-your-property" onClick={onNavigateTop}>
                Become a Partner
              </Link>

              <Link to="/partner/login" onClick={onNavigateTop}>
                Partner login
              </Link>

              <Link to="/partner/register" onClick={onNavigateTop}>
                Partner register
              </Link>
            </div>

            <div className="public-footer-column public-footer-column-wide">
              <h3>Travel essentials</h3>

              <a
                href="https://www.sltda.gov.lk/"
                target="_blank"
                rel="noreferrer"
              >
                Sri Lanka Tourism Development Authority
              </a>

              <a
                href="https://www.immigration.gov.lk/"
                target="_blank"
                rel="noreferrer"
              >
                Immigration & Emigration
              </a>

              <a
                href="https://www.airport.lk/"
                target="_blank"
                rel="noreferrer"
              >
                Airport & Aviation Services
              </a>

              <a
                href="https://www.srilankan.com/"
                target="_blank"
                rel="noreferrer"
              >
                SriLankan Airlines
              </a>
            </div>
          </div>
        </div>

        <div className="public-footer-highlight">
          <div>
            <strong>Everything for your Sri Lanka journey.</strong>

            <span>
              Places, stays, trips, events, guides, and bookings —
              connected in TripLanka.
            </span>
          </div>

          <div
            className="public-footer-socials"
            aria-label="Social links"
          >
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
            >
              f
            </a>

            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
            >
              ▶
            </a>

            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              ◎
            </a>

            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
            >
              in
            </a>
          </div>
        </div>

        <div className="public-footer-bottom">
          <p>
            © 2026 TripLanka. All rights reserved.
          </p>

          <div>
            <Link to="/about" onClick={onNavigateTop}>
              Privacy Policy
            </Link>

            <Link to="/about" onClick={onNavigateTop}>
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function PublicLayout() {
  const { user, isLoggedIn, logout } = useAuth();
  const {
    language,
    currency,
    languages,
    currencies,
    setLanguage,
    setCurrency,
  } = usePreferences();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const showTripBasket = !shouldHideTripBasket(location.pathname);
  const currentLanguage =
    languages.find((item) => item.value === language) || languages[0];

  const username =
    user?.full_name ||
    user?.name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Traveler";

  useEffect(() => {
    setMenuOpen(false);
    setLanguageMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 420);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  useEffect(() => {
    const header = document.querySelector(".site-header");
    if (!header) return undefined;

    const syncTranslatedHeaderLabels = () => {
      const items = header.querySelectorAll("[data-header-label-container]");

      items.forEach((item) => {
        const label = item.querySelector("[data-header-label]");
        if (!label) return;

        const visibleText = String(label.textContent || "")
          .replace(/\s+/g, " ")
          .trim();

        if (visibleText) {
          item.setAttribute("data-tooltip", visibleText);
          item.setAttribute("aria-label", visibleText);
        }

        const overflowing =
          label.scrollWidth > label.clientWidth + 1;

        item.setAttribute(
          "data-overflowing",
          overflowing ? "true" : "false"
        );
      });
    };

    const mutationObserver = new MutationObserver(() => {
      window.requestAnimationFrame(syncTranslatedHeaderLabels);
    });

    mutationObserver.observe(header, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            window.requestAnimationFrame(syncTranslatedHeaderLabels);
          })
        : null;

    header
      .querySelectorAll("[data-header-label]")
      .forEach((label) => resizeObserver?.observe(label));

    syncTranslatedHeaderLabels();

    window.addEventListener("resize", syncTranslatedHeaderLabels);

    return () => {
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncTranslatedHeaderLabels);
    };
  }, [language, menuOpen, isLoggedIn]);

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

      <header className={`site-header${menuOpen ? " site-header-menu-open" : ""}`}>
        <div className="top-line" />

        <div className="site-header-inner">
          <Link
            to="/"
            className="brand-link notranslate"
            aria-label="TripLanka home"
            data-no-translate
          >
            <span className="brand-logo-symbol" aria-hidden="true">
              <TripLankaLogoMark className="brand-logo-svg" />
            </span>

            <span className="brand-logo-copy" aria-label="TripLanka">
              <span className="brand-logo-name">
                <span className="brand-trip">Trip</span>
                <span className="brand-lanka">Lanka</span>
              </span>

              <span className="brand-logo-tagline">
                Plan · Explore · Travel
              </span>
            </span>
          </Link>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="public-navigation public-header-actions"
          >
            <span className="hamburger-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          <nav id="public-navigation" aria-label="Main navigation" className={`main-navigation ${menuOpen ? "main-navigation-open" : ""}`}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  isActive ? "nav-item nav-item-active" : "nav-item"
                }
                title={link.label}
                data-tooltip={link.label}
                data-dynamic-title="true"
                data-header-label-container
              >
                <span className="nav-label" data-header-label>
                  {link.label}
                </span>
              </NavLink>
            ))}
          </nav>

          <div id="public-header-actions" className={`header-actions ${menuOpen ? "header-actions-open" : ""}`}>
            <Link
              to="/list-your-property"
              onClick={() => setMenuOpen(false)}
              className="property-link"
              title="Become a Partner"
              data-tooltip="Become a Partner"
              data-dynamic-title="true"
              data-header-label-container
            >
              <span className="header-action-label" data-header-label>
                Become a Partner
              </span>
            </Link>

            <div
              className="language-picker notranslate"
              data-no-translate
              translate="no"
            >
              <button
                type="button"
                className="language-picker-button"
                onClick={() => setLanguageMenuOpen((current) => !current)}
                aria-label="Select language"
                aria-expanded={languageMenuOpen}
              >
                <span className="language-globe">🌐</span>
                <img
                  src={currentLanguage.flag}
                  alt=""
                  className="language-flag"
                  loading="lazy"
                />
                <span className="language-current-text">
                  {currentLanguage.code} {currentLanguage.name}
                </span>
                <span className="language-caret">▾</span>
              </button>

              {languageMenuOpen && (
                <div className="language-menu" role="listbox">
                  {languages.map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      className={`language-option ${
                        item.value === language ? "is-active" : ""
                      }`}
                      onClick={() => {
                        setLanguage(item.value);
                        setLanguageMenuOpen(false);
                      }}
                      role="option"
                      aria-selected={item.value === language}
                    >
                      <img
                        src={item.flag}
                        alt=""
                        className="language-flag"
                        loading="lazy"
                      />
                      <span>{item.code}</span>
                      <strong>{item.name}</strong>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label
              className="clean-select notranslate"
              title="Select currency"
              data-no-translate
              translate="no"
            >
              <span>💱</span>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                aria-label="Select currency"
                data-no-translate
                translate="no"
              >
                {currencies.map((item) => (
                  <option key={item.value} value={item.value} translate="no">
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            {isLoggedIn ? (
              <>
                <Link
                  to="/my-bookings"
                  onClick={() => setMenuOpen(false)}
                  className="booking-link cart-icon-link"
                  title="My bookings"
                  aria-label="Open booking cart"
                >
                  🛒
                </Link>
                {user?.role === "tourist" && (
                  <Link
                    to="/my-reports"
                    onClick={() => setMenuOpen(false)}
                    className="booking-link"
                  >
                    My Reports
                  </Link>
                )}
                <span className="user-greeting notranslate" data-no-translate>Hi, {username}</span>
                <button
                  type="button"
                  className="logout-button"
                  title="Logout"
                  data-tooltip="Logout"
                  data-dynamic-title="true"
                  onClick={handleLogout}
                  data-header-label-container
                >
                  <span className="header-action-label" data-header-label>
                    Logout
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="login-link"
                  title="Login"
                  data-tooltip="Login"
                  data-dynamic-title="true"
                  data-header-label-container
                >
                  <span className="header-action-label" data-header-label>
                    Login
                  </span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="register-link"
                  title="Register"
                  data-tooltip="Register"
                  data-dynamic-title="true"
                  data-header-label-container
                >
                  <span className="header-action-label" data-header-label>
                    Register
                  </span>
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

      {showTripBasket ? <TripBasketWidget /> : null}

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
  @import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");

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
    grid-template-columns: minmax(220px, 280px) minmax(0, 1fr) minmax(0, max-content);
    align-items: center;
    column-gap: clamp(18px, 2vw, 34px);
    overflow: visible;
  }

  .brand-link {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    max-width: 280px;
    overflow: hidden;
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .brand-name span {
    color: #0f9f8f;
  }

  .main-navigation {
    justify-self: center;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(8px, 0.9vw, 16px);
    overflow: hidden;
    scrollbar-width: none;
  }

  .main-navigation:hover .nav-item {
    max-width: 58px;
  }

  .main-navigation::-webkit-scrollbar {
    display: none;
  }

  .nav-item {
    position: relative;
    min-width: 0;
    max-width: clamp(86px, 9.5vw, 148px);
    flex: 0 1 clamp(64px, 8vw, 118px);
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    color: #111827;
    text-decoration: none;
    font-size: 13px;
    font-weight: 730;
    line-height: 1;
    padding: 30px 0 29px;
    white-space: nowrap;
    transition: color 0.18s ease, max-width 0.2s ease, flex-basis 0.2s ease;
  }

  .main-navigation:hover .nav-item:hover {
    flex-basis: clamp(142px, 16vw, 260px);
    max-width: clamp(142px, 16vw, 260px);
    text-overflow: clip;
  }

  .nav-item font,
  .property-link font,
  .logout-button font,
  .login-link font,
  .register-link font {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    overflow: visible;
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
    min-width: 0;
    max-width: 154px;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
  }

  .property-link {
    position: relative;
    max-width: 220px;
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
    position: relative;
    max-width: 108px;
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

  .clean-select select.language-select-field {
    max-width: 156px;
  }

  .language-picker {
    position: relative;
    flex: 0 0 auto;
  }

  .language-picker-button {
    height: 38px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid rgba(8, 117, 104, 0.18);
    background: #ffffff;
    border-radius: 999px;
    padding: 0 10px;
    color: #111827;
    font-size: 12px;
    font-weight: 780;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.03);
  }

  .language-globe {
    color: var(--hub-green);
    font-size: 13px;
    line-height: 1;
  }

  .language-flag {
    width: 20px;
    height: 14px;
    object-fit: cover;
    border-radius: 2px;
    box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.12);
    flex: 0 0 auto;
  }

  .language-current-text {
    max-width: 112px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .language-caret {
    color: #0f172a;
    font-size: 12px;
    line-height: 1;
  }

  .language-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    z-index: 1300;
    width: 210px;
    max-height: min(470px, calc(100vh - 110px));
    overflow-y: auto;
    padding: 6px;
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 12px;
    box-shadow: 0 22px 48px rgba(15, 23, 42, 0.18);
  }

  .language-option {
    width: 100%;
    min-height: 34px;
    display: grid;
    grid-template-columns: 20px 28px 1fr;
    align-items: center;
    gap: 8px;
    border: 0;
    background: transparent;
    border-radius: 8px;
    padding: 7px 8px;
    color: #111827;
    text-align: left;
    cursor: pointer;
  }

  .language-option span {
    font-size: 11px;
    font-weight: 820;
    color: #0f766e;
  }

  .language-option strong {
    font-size: 13px;
    font-weight: 820;
    letter-spacing: 0;
  }

  .language-option:hover,
  .language-option.is-active {
    background: #e8f8f5;
  }

  .language-option.is-active strong {
    color: var(--hub-green);
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
    font-size: 16px;
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
    min-width: 148px;
    height: 56px;
    padding: 8px 16px 8px 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-radius: 999px;
    border: 1px solid rgba(8, 117, 104, 0.18);
    background: linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,250,247,0.96) 100%);
    color: #12332f;
    cursor: pointer;
    opacity: 0;
    transform: translateY(18px) scale(0.96);
    pointer-events: none;
    box-shadow: 0 18px 42px rgba(6, 78, 69, 0.18), 0 3px 12px rgba(6, 78, 69, 0.08);
    transition: opacity 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    backdrop-filter: blur(10px);
  }

  .floating-scroll-top.is-visible {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  .floating-scroll-icon {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 50%;
    background: linear-gradient(145deg, #0a5c53 0%, #0f8a79 100%);
    color: #ffffff;
    font-size: 22px;
    font-weight: 900;
    line-height: 1;
    box-shadow: 0 8px 18px rgba(8, 91, 80, 0.22);
  }

  .floating-scroll-text {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  .floating-scroll-top:hover {
    transform: translateY(-4px) scale(1.02);
    border-color: rgba(8, 117, 104, 0.35);
    box-shadow: 0 24px 52px rgba(6, 78, 69, 0.24), 0 6px 18px rgba(6, 78, 69, 0.10);
  }

  @media (max-width: 1500px) {
    .site-header-inner {
      grid-template-columns: minmax(200px, 240px) minmax(0, 1fr) minmax(0, max-content);
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
      gap: 10px;
    }

    .nav-item {
      font-size: 12.5px;
      max-width: 112px;
      flex-basis: 88px;
    }

    .main-navigation:hover .nav-item {
      max-width: 48px;
      flex-basis: 48px;
    }

    .main-navigation:hover .nav-item:hover {
      flex-basis: 190px;
      max-width: 190px;
    }

    .property-link {
      max-width: 190px;
    }

    .logout-button {
      max-width: 96px;
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


  /* =========================================================
     SET 15.2 — DARK MODERN BACK TO TOP
  ========================================================= */

  .floating-scroll-top {
    min-width: 154px;
    height: 58px;

    padding:
      8px
      17px
      8px
      9px;

    gap: 11px;

    border:
      1px
      solid
      rgba(231, 181, 51, 0.46);

    border-radius: 999px;

    background:
      radial-gradient(
        circle at 84% 20%,
        rgba(231, 181, 51, 0.18),
        transparent 32%
      ),
      linear-gradient(
        135deg,
        #062f2b 0%,
        #064e45 52%,
        #087568 100%
      );

    color: #ffffff;

    box-shadow:
      0 18px 42px
        rgba(4, 55, 49, 0.34),
      0 4px 13px
        rgba(4, 55, 49, 0.14),
      inset 0 1px 0
        rgba(255, 255, 255, 0.10);

    backdrop-filter: blur(10px);
  }

  .floating-scroll-icon {
    width: 40px;
    height: 40px;

    border:
      1px
      solid
      rgba(255, 226, 130, 0.72);

    background:
      linear-gradient(
        145deg,
        #d79e18 0%,
        #f0bd35 100%
      );

    color: #063f39;

    font-size: 23px;
    font-weight: 950;

    box-shadow:
      inset 0 0 0 2px
        rgba(255, 255, 255, 0.42),
      0 7px 16px
        rgba(0, 0, 0, 0.18);
  }

  .floating-scroll-text {
    color: #ffffff;

    font-size: 13px;
    font-weight: 850;

    letter-spacing: 0.015em;

    text-transform: none;
  }

  .floating-scroll-top:hover {
    transform:
      translateY(-3px)
      scale(1.02);

    border-color:
      rgba(255, 215, 100, 0.72);

    background:
      radial-gradient(
        circle at 84% 20%,
        rgba(231, 181, 51, 0.24),
        transparent 34%
      ),
      linear-gradient(
        135deg,
        #052823 0%,
        #075b50 52%,
        #0a8576 100%
      );

    box-shadow:
      0 23px 52px
        rgba(4, 55, 49, 0.40),
      0 6px 16px
        rgba(4, 55, 49, 0.16);
  }

  @media (max-width: 640px) {
    .floating-scroll-top {
      min-width: 58px;
      width: 58px;
      height: 58px;

      padding: 8px;

      border-radius: 50%;
    }

    .floating-scroll-icon {
      width: 40px;
      height: 40px;
    }

    .floating-scroll-text {
      display: none;
    }
  }


  /* =========================================================
     SET 15.3 — MATCHED MODERN BACK TO TOP
     Compact dark control matching the new AI assistant.
  ========================================================= */

  .floating-scroll-top {
    left: 24px;
    bottom: 24px;

    min-width: 136px;
    width: auto;
    height: 52px;

    padding:
      6px
      15px
      6px
      7px;

    gap: 9px;

    border:
      1px
      solid
      rgba(91, 173, 157, 0.34);

    border-radius: 18px;

    background:
      radial-gradient(
        circle at 92% 15%,
        rgba(231, 181, 51, 0.14),
        transparent 30%
      ),
      linear-gradient(
        145deg,
        #052f2b 0%,
        #064e45 58%,
        #07675c 100%
      );

    color: #ffffff;

    box-shadow:
      0 15px 34px
        rgba(5, 49, 44, 0.28),
      0 3px 10px
        rgba(5, 49, 44, 0.12),
      inset 0 1px 0
        rgba(255, 255, 255, 0.08);

    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    overflow: hidden;
  }

  .floating-scroll-top::after {
    content: "";

    position: absolute;

    top: 8px;
    right: 9px;

    width: 7px;
    height: 7px;

    border:
      2px
      solid
      rgba(255, 255, 255, 0.82);

    border-radius: 999px;

    background: #e7b533;

    box-shadow:
      0 0 0 3px
      rgba(231, 181, 51, 0.12);
  }

  .floating-scroll-icon {
    width: 38px;
    height: 38px;

    flex:
      0 0
      38px;

    border:
      1px
      solid
      rgba(255, 255, 255, 0.14);

    border-radius: 13px;

    background:
      linear-gradient(
        145deg,
        #0b675d 0%,
        #0d8b7b 100%
      );

    color: #ffffff;

    font-size: 21px;
    font-weight: 900;

    box-shadow:
      0 7px 16px
      rgba(0, 0, 0, 0.18);

    transform:
      translateY(-1px);
  }

  .floating-scroll-text {
    color: #f6fffc;

    font-size: 13px;
    font-weight: 800;

    line-height: 1;

    letter-spacing: -0.005em;

    text-transform: none;

    text-shadow:
      0 1px 0
      rgba(0, 0, 0, 0.12);
  }

  .floating-scroll-top:hover {
    transform:
      translateY(-3px)
      scale(1.015);

    border-color:
      rgba(108, 197, 179, 0.50);

    background:
      radial-gradient(
        circle at 92% 15%,
        rgba(231, 181, 51, 0.18),
        transparent 32%
      ),
      linear-gradient(
        145deg,
        #042925 0%,
        #07594f 58%,
        #087568 100%
      );

    box-shadow:
      0 20px 42px
        rgba(5, 49, 44, 0.34),
      0 5px 13px
        rgba(5, 49, 44, 0.14);
  }

  .floating-scroll-top:focus-visible {
    outline:
      3px
      solid
      rgba(13, 146, 130, 0.22);

    outline-offset: 3px;
  }

  @media (max-width: 640px) {
    .floating-scroll-top {
      left:
        max(
          12px,
          env(safe-area-inset-left)
        );

      bottom:
        max(
          14px,
          env(safe-area-inset-bottom)
        );

      min-width: 54px;
      width: 54px;
      height: 54px;

      padding: 6px;

      border-radius: 17px;
    }

    .floating-scroll-top::after {
      top: 6px;
      right: 6px;

      width: 6px;
      height: 6px;
    }

    .floating-scroll-icon {
      width: 40px;
      height: 40px;

      flex-basis: 40px;

      border-radius: 12px;

      font-size: 21px;
    }

    .floating-scroll-text {
      display: none;
    }
  }


  /* =========================================================
     SET 16 — MODERN PUBLIC FOOTER
     Cleaner sizing, stronger hierarchy, TourismHub palette.
  ========================================================= */

  .public-site-footer {
    position: relative;
    isolation: isolate;

    margin-top: 72px;

    overflow: hidden;

    background:
      radial-gradient(
        circle at 8% 15%,
        rgba(37, 164, 143, 0.15),
        transparent 28%
      ),
      radial-gradient(
        circle at 92% 0%,
        rgba(224, 176, 48, 0.12),
        transparent 24%
      ),
      linear-gradient(
        118deg,
        #052f2b 0%,
        #064e45 52%,
        #086d62 100%
      );

    color: #ffffff;

    box-shadow:
      0 -18px 48px
      rgba(11, 63, 55, 0.10);
  }

  .public-site-footer::before {
    content: "";

    position: absolute;

    top: 0;
    left: 0;
    right: 0;

    height: 3px;

    background:
      linear-gradient(
        90deg,
        #0d9182 0%,
        #45b5a2 45%,
        #dca827 76%,
        #edc65b 100%
      );
  }

  .footer-glow {
    display: none;
  }

  .public-footer-inner {
    width:
      min(
        1320px,
        calc(100% - 64px)
      );

    margin: 0 auto;

    padding:
      48px
      0
      20px;
  }

  .public-footer-top {
    display: grid;

    grid-template-columns:
      minmax(280px, 0.92fr)
      minmax(0, 2fr);

    gap: 64px;

    align-items: start;
  }

  .public-footer-brand {
    min-width: 0;
  }

  .public-footer-logo {
    display: inline-flex;
    align-items: center;
    gap: 11px;

    color: #ffffff;

    text-decoration: none;
  }

  .public-footer-logo-mark {
    width: 46px;
    height: 46px;

    flex:
      0 0
      46px;

    display: grid;
    place-items: center;

    border:
      1px
      solid
      rgba(255, 226, 130, 0.42);

    border-radius: 15px;

    background:
      linear-gradient(
        145deg,
        #08766b 0%,
        #0b9180 100%
      );

    box-shadow:
      0 10px 24px
      rgba(1, 30, 27, 0.22);
  }

  .public-footer-logo-mark strong {
    color: #f7c84b;

    font-size: 14px;
    font-weight: 950;

    letter-spacing: -0.03em;
  }

  .public-footer-logo-copy {
    display: grid;

    gap: 3px;
  }

  .public-footer-logo-copy > strong {
    color: #ffffff;

    font-size: 22px;
    font-weight: 850;

    line-height: 1;

    letter-spacing: -0.025em;
  }

  .public-footer-logo-copy small {
    color:
      rgba(
        231,
        248,
        243,
        0.70
      );

    font-size: 10px;
    font-weight: 650;

    line-height: 1.2;
  }

  .public-footer-brand > p {
    max-width: 390px;

    margin:
      18px
      0
      20px;

    color:
      rgba(
        236,
        250,
        246,
        0.73
      );

    font-size: 13px;
    font-weight: 520;

    line-height: 1.7;
  }

  .public-footer-contact-row {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }

  .public-footer-contact {
    min-width: 124px;

    padding:
      10px
      12px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    border:
      1px
      solid
      rgba(255, 255, 255, 0.12);

    border-radius: 12px;

    background:
      rgba(255, 255, 255, 0.07);

    color: #ffffff;

    text-decoration: none;

    transition:
      background 150ms ease,
      border-color 150ms ease,
      transform 150ms ease;
  }

  .public-footer-contact:hover {
    transform:
      translateY(-1px);

    border-color:
      rgba(255, 226, 130, 0.30);

    background:
      rgba(255, 255, 255, 0.11);
  }

  .public-footer-contact span {
    color:
      rgba(
        233,
        248,
        244,
        0.67
      );

    font-size: 9px;
    font-weight: 700;

    line-height: 1.2;

    text-transform: uppercase;

    letter-spacing: 0.045em;
  }

  .public-footer-contact strong {
    color: #f3c74f;

    font-size: 17px;
    font-weight: 850;

    line-height: 1;
  }

  .public-footer-links-grid {
    display: grid;

    grid-template-columns:
      repeat(
        4,
        minmax(0, 1fr)
      );

    gap: 30px;
  }

  .public-footer-column {
    min-width: 0;
  }

  .public-footer-column h3 {
    margin:
      1px
      0
      15px;

    color: #f1c64e;

    font-size: 10px;
    font-weight: 800;

    line-height: 1;

    text-transform: uppercase;

    letter-spacing: 0.09em;
  }

  .public-footer-column a {
    display: block;

    width: fit-content;
    max-width: 100%;

    margin:
      0
      0
      10px;

    color:
      rgba(
        241,
        251,
        248,
        0.78
      );

    font-size: 12.5px;
    font-weight: 580;

    line-height: 1.45;

    text-decoration: none;

    transition:
      color 150ms ease,
      transform 150ms ease;
  }

  .public-footer-column a:hover {
    color: #ffffff;

    transform:
      translateX(3px);
  }

  .public-footer-column-wide a {
    max-width: 220px;
  }

  .public-footer-highlight {
    margin-top: 38px;

    padding:
      19px
      0;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;

    border-top:
      1px
      solid
      rgba(255, 255, 255, 0.11);

    border-bottom:
      1px
      solid
      rgba(255, 255, 255, 0.11);
  }

  .public-footer-highlight strong,
  .public-footer-highlight span {
    display: block;
  }

  .public-footer-highlight strong {
    color: #ffffff;

    font-size: 15px;
    font-weight: 760;

    line-height: 1.3;
  }

  .public-footer-highlight span {
    margin-top: 4px;

    color:
      rgba(
        235,
        249,
        245,
        0.66
      );

    font-size: 11.5px;
    font-weight: 520;

    line-height: 1.45;
  }

  .public-footer-socials {
    display: flex;
    align-items: center;
    gap: 8px;

    flex-wrap: wrap;
  }

  .public-footer-socials a {
    width: 36px;
    height: 36px;

    display: grid;
    place-items: center;

    border:
      1px
      solid
      rgba(255, 255, 255, 0.16);

    border-radius: 11px;

    background:
      rgba(255, 255, 255, 0.08);

    color:
      rgba(
        255,
        255,
        255,
        0.88
      );

    font-size: 11px;
    font-weight: 800;

    text-decoration: none;

    box-shadow: none;

    transition:
      background 150ms ease,
      border-color 150ms ease,
      transform 150ms ease;
  }

  .public-footer-socials a:hover {
    transform:
      translateY(-2px);

    border-color:
      rgba(241, 198, 78, 0.45);

    background:
      rgba(241, 198, 78, 0.16);

    color: #ffffff;
  }

  .public-footer-bottom {
    padding-top: 16px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;

    color:
      rgba(
        229,
        246,
        241,
        0.52
      );

    font-size: 10.5px;
    font-weight: 520;
  }

  .public-footer-bottom p {
    margin: 0;
  }

  .public-footer-bottom div {
    display: flex;
    align-items: center;
    gap: 16px;

    flex-wrap: wrap;
  }

  .public-footer-bottom a {
    color:
      rgba(
        234,
        249,
        245,
        0.66
      );

    font-size: 10.5px;
    font-weight: 650;

    text-decoration: none;
  }

  .public-footer-bottom a:hover {
    color: #ffffff;
  }


  @media (max-width: 1120px) {
    .public-footer-top {
      grid-template-columns: 1fr;
      gap: 34px;
    }

    .public-footer-brand > p {
      max-width: 620px;
    }

    .public-footer-links-grid {
      grid-template-columns:
        repeat(
          4,
          minmax(0, 1fr)
        );
    }
  }


  @media (max-width: 820px) {
    .public-site-footer {
      margin-top: 58px;
    }

    .public-footer-inner {
      width:
        min(
          100% - 32px,
          1320px
        );

      padding:
        38px
        0
        18px;
    }

    .public-footer-links-grid {
      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );

      gap:
        28px
        22px;
    }

    .public-footer-highlight {
      align-items: flex-start;
    }
  }


  @media (max-width: 560px) {
    .public-footer-inner {
      width:
        calc(100% - 26px);
    }

    .public-footer-logo-copy > strong {
      font-size: 20px;
    }

    .public-footer-links-grid {
      grid-template-columns: 1fr;
      gap: 22px;
    }

    .public-footer-column h3 {
      margin-bottom: 11px;
    }

    .public-footer-column a {
      margin-bottom: 8px;
    }

    .public-footer-highlight,
    .public-footer-bottom {
      flex-direction: column;
      align-items: flex-start;
    }

    .public-footer-highlight {
      margin-top: 30px;
    }

    .public-footer-contact-row {
      width: 100%;
    }

    .public-footer-contact {
      flex: 1;
    }
  }


  /* =========================================================
     SET 16.1 — LIGHT MODERN FOOTER
     Matches the site's white / mint / teal / gold visual system.
  ========================================================= */

  .public-site-footer {
    margin-top: 64px;

    color: #263b35;

    background:
      radial-gradient(
        circle at 8% 10%,
        rgba(13, 146, 130, 0.11),
        transparent 29%
      ),
      radial-gradient(
        circle at 92% 0%,
        rgba(225, 175, 45, 0.12),
        transparent 25%
      ),
      linear-gradient(
        118deg,
        #edf8f5 0%,
        #f8fbf9 48%,
        #fff8e9 100%
      );

    border-top:
      1px
      solid
      rgba(139, 190, 177, 0.55);

    box-shadow:
      0 -14px 38px
      rgba(23, 72, 61, 0.07);
  }

  .public-site-footer::before {
    height: 3px;

    background:
      linear-gradient(
        90deg,
        #08786d 0%,
        #16a08e 43%,
        #8cbc9c 60%,
        #dba627 80%,
        #efca60 100%
      );
  }

  .public-footer-inner {
    width:
      min(
        1360px,
        calc(100% - 68px)
      );

    padding:
      44px
      0
      18px;
  }

  .public-footer-top {
    grid-template-columns:
      minmax(280px, 0.92fr)
      minmax(0, 2.1fr);

    gap: 62px;
  }


  /* Brand */

  .public-footer-logo {
    color: #16362f;
  }

  .public-footer-logo-mark {
    width: 48px;
    height: 48px;

    flex-basis: 48px;

    border:
      1px
      solid
      rgba(8, 120, 109, 0.20);

    background:
      linear-gradient(
        145deg,
        #08776c 0%,
        #0b9582 100%
      );

    box-shadow:
      0 9px 22px
      rgba(8, 91, 80, 0.15);
  }

  .public-footer-logo-mark strong {
    color: #f5c746;

    font-size: 14px;
  }

  .public-footer-logo-copy > strong {
    color: #17372f;

    font-size: 23px;
    font-weight: 820;
  }

  .public-footer-logo-copy small {
    color: #6b817a;

    font-size: 10px;
    font-weight: 650;
  }

  .public-footer-brand > p {
    margin:
      18px
      0
      19px;

    color: #657b74;

    font-size: 13px;
    font-weight: 500;

    line-height: 1.7;
  }


  /* Small contact cards */

  .public-footer-contact {
    min-width: 128px;

    border:
      1px
      solid
      rgba(147, 190, 178, 0.44);

    background:
      rgba(255, 255, 255, 0.64);

    color: #164c43;

    box-shadow:
      0 5px 15px
      rgba(34, 77, 67, 0.035);
  }

  .public-footer-contact:hover {
    border-color:
      rgba(8, 120, 109, 0.32);

    background:
      rgba(255, 255, 255, 0.88);
  }

  .public-footer-contact span {
    color: #748780;
  }

  .public-footer-contact strong {
    color: #b78310;

    font-size: 17px;
  }


  /* Link columns */

  .public-footer-column h3 {
    color: #0a786d;

    font-size: 10px;
    font-weight: 800;

    letter-spacing: 0.085em;
  }

  .public-footer-column a {
    color: #506a63;

    font-size: 12.5px;
    font-weight: 560;
  }

  .public-footer-column a:hover {
    color: #08786d;
  }


  /* Journey / social strip */

  .public-footer-highlight {
    margin-top: 35px;

    padding:
      18px
      0;

    border-top:
      1px
      solid
      rgba(133, 177, 165, 0.30);

    border-bottom:
      1px
      solid
      rgba(133, 177, 165, 0.30);
  }

  .public-footer-highlight strong {
    color: #1c3831;

    font-size: 15px;
    font-weight: 760;
  }

  .public-footer-highlight span {
    color: #6b817a;

    font-size: 11.5px;
    font-weight: 510;
  }

  .public-footer-socials a {
    width: 37px;
    height: 37px;

    border:
      1px
      solid
      rgba(129, 178, 165, 0.45);

    background:
      rgba(255, 255, 255, 0.66);

    color: #08786d;

    box-shadow:
      0 4px 12px
      rgba(30, 75, 65, 0.04);
  }

  .public-footer-socials a:hover {
    border-color:
      rgba(8, 120, 109, 0.45);

    background: #ffffff;

    color: #075f56;
  }


  /* Bottom legal row */

  .public-footer-bottom {
    color: #899892;

    font-size: 10.5px;
  }

  .public-footer-bottom a {
    color: #6c817a;

    font-size: 10.5px;
  }

  .public-footer-bottom a:hover {
    color: #08786d;
  }


  /* =========================================================
     SET 16.1 — BACK TO TOP
     Modern companion to the Alby launcher.
  ========================================================= */

  .floating-scroll-top {
    left: 24px;
    bottom: 24px;

    min-width: 138px;
    width: auto;
    height: 54px;

    padding:
      6px
      15px
      6px
      7px;

    gap: 10px;

    overflow: hidden;

    border:
      1px
      solid
      rgba(9, 118, 106, 0.34);

    border-radius: 19px;

    background:
      linear-gradient(
        145deg,
        rgba(255, 255, 255, 0.98) 0%,
        rgba(242, 250, 247, 0.98) 100%
      );

    color: #193630;

    box-shadow:
      0 15px 34px
      rgba(14, 61, 53, 0.17),
      0 3px 9px
      rgba(14, 61, 53, 0.07);

    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .floating-scroll-top::before {
    content: "";

    position: absolute;

    left: 0;
    top: 0;
    bottom: 0;

    width: 3px;

    background:
      linear-gradient(
        180deg,
        #08786d,
        #e1ac2b
      );
  }

  .floating-scroll-top::after {
    content: none;
  }

  .floating-scroll-icon {
    width: 40px;
    height: 40px;

    flex:
      0 0
      40px;

    border:
      1px
      solid
      rgba(255, 255, 255, 0.18);

    border-radius: 13px;

    background:
      linear-gradient(
        145deg,
        #064e45 0%,
        #0a8173 100%
      );

    color: #ffffff;

    font-size: 22px;
    font-weight: 900;

    box-shadow:
      0 8px 18px
      rgba(7, 83, 73, 0.22);

    transform: none;
  }

  .floating-scroll-text {
    color: #1d3832;

    font-size: 13px;
    font-weight: 760;

    letter-spacing: -0.008em;

    text-transform: none;
  }

  .floating-scroll-top:hover {
    transform:
      translateY(-2px)
      scale(1.01);

    border-color:
      rgba(9, 118, 106, 0.54);

    background:
      linear-gradient(
        145deg,
        #ffffff 0%,
        #ecf8f4 100%
      );

    box-shadow:
      0 19px 41px
      rgba(14, 61, 53, 0.21),
      0 4px 11px
      rgba(14, 61, 53, 0.08);
  }

  .floating-scroll-top:focus-visible {
    outline:
      3px
      solid
      rgba(13, 146, 130, 0.16);

    outline-offset: 3px;
  }


  @media (max-width: 820px) {
    .public-footer-inner {
      width:
        min(
          100% - 34px,
          1360px
        );
    }
  }


  @media (max-width: 640px) {
    .floating-scroll-top {
      left:
        max(
          12px,
          env(safe-area-inset-left)
        );

      bottom:
        max(
          14px,
          env(safe-area-inset-bottom)
        );

      min-width: 54px;
      width: 54px;
      height: 54px;

      padding: 6px;

      border-radius: 17px;
    }

    .floating-scroll-top::before {
      width: 2px;
    }

    .floating-scroll-icon {
      width: 40px;
      height: 40px;

      flex-basis: 40px;

      border-radius: 12px;
    }

    .floating-scroll-text {
      display: none;
    }
  }


  @media (max-width: 560px) {
    .public-site-footer {
      margin-top: 52px;
    }

    .public-footer-inner {
      width:
        calc(100% - 28px);

      padding-top: 36px;
    }
  }


  /* =========================================================
     SET 20 — MODERN PUBLIC NAVIGATION
     Matches the Manrope typography accepted on Trip Planner.
     Header/navigation only; application logic is untouched.
  ========================================================= */

  .site-header,
  .site-header button,
  .site-header select,
  .site-header a,
  .site-header span,
  .site-header strong {
    font-family:
      "Manrope",
      "Segoe UI",
      Arial,
      sans-serif;
  }

  .site-header {
    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.995) 0%,
        rgba(252, 255, 254, 0.985) 100%
      );

    border-bottom:
      1px solid
      rgba(15, 118, 110, 0.10);

    box-shadow:
      0 10px 32px
      rgba(15, 56, 49, 0.055);

    backdrop-filter:
      blur(18px)
      saturate(135%);

    -webkit-backdrop-filter:
      blur(18px)
      saturate(135%);
  }

  .top-line {
    height: 3px;

    background:
      linear-gradient(
        90deg,
        #087568 0%,
        #12a594 50%,
        #d9a514 100%
      );
  }

  .site-header-inner {
    min-height: 80px;

    padding:
      0
      clamp(28px, 3vw, 58px);

    grid-template-columns:
      minmax(260px, 304px)
      minmax(0, 1fr)
      minmax(0, max-content);

    column-gap:
      clamp(16px, 1.7vw, 30px);
  }


  /* Brand lock-up */

  .brand-link {
    max-width: 304px;

    gap: 13px;

    overflow: visible;

    transition:
      transform 160ms ease,
      opacity 160ms ease;
  }

  .brand-link:hover {
    transform:
      translateY(-1px);
  }

  .brand-mark {
    width: 48px;
    height: 48px;

    flex-basis: 48px;

    border-radius: 15px;

    border:
      1px solid
      rgba(255, 255, 255, 0.48);

    background:
      radial-gradient(
        circle at 72% 23%,
        #ffd644 0 11%,
        rgba(255, 214, 68, 0.28) 12% 20%,
        transparent 21%
      ),
      linear-gradient(
        145deg,
        #087568 0%,
        #07978a 54%,
        #0ca9c8 100%
      );

    box-shadow:
      0 12px 28px
      rgba(7, 105, 94, 0.18),
      inset 0 1px 0
      rgba(255, 255, 255, 0.24);
  }

  .brand-mark::before {
    left: 8px;
    bottom: 9px;

    width: 32px;
    height: 12px;

    background:
      rgba(255, 255, 255, 0.24);
  }

  .brand-mark-sun {
    right: 10px;
    top: 9px;

    width: 8px;
    height: 8px;

    background: #ffe06b;

    box-shadow:
      0 0 0 4px
      rgba(255, 224, 107, 0.17);
  }

  .brand-mark-wave {
    left: 8px;
    right: 8px;
    bottom: 9px;

    border-top:
      2px solid
      rgba(255, 255, 255, 0.84);
  }

  .brand-mark strong {
    font-size: 13px;
    font-weight: 800;

    letter-spacing:
      -0.025em;
  }

  .brand-name {
    color: #07695f;

    font-size:
      clamp(
        24px,
        1.55vw,
        29px
      );

    font-weight: 800;

    line-height: 1;

    letter-spacing:
      -0.045em;

    overflow: visible;

    text-overflow: clip;
  }

  .brand-name span {
    color: #0d9a8b;
  }


  /* Main navigation */

  .main-navigation {
    gap:
      clamp(
        2px,
        0.35vw,
        7px
      );

    overflow: visible;
  }

  .main-navigation:hover .nav-item,
  .main-navigation:hover .nav-item:hover {
    flex:
      0 0 auto;

    max-width: none;
  }

  .nav-item {
    min-width: auto;
    max-width: none;

    flex:
      0 0 auto;

    padding:
      10px
      clamp(
        8px,
        0.65vw,
        12px
      );

    border:
      1px solid
      transparent;

    border-radius:
      10px;

    overflow: visible;

    color: #1f2926;

    font-size: 11.5px;
    font-weight: 700;

    line-height: 1.15;

    letter-spacing:
      -0.018em;

    text-overflow: clip;

    transition:
      color 150ms ease,
      background 150ms ease,
      border-color 150ms ease,
      transform 150ms ease,
      box-shadow 150ms ease;
  }

  .nav-item:hover {
    color: #087568;

    background:
      #f1faf7;

    border-color:
      rgba(8, 117, 104, 0.11);

    transform:
      translateY(-1px);
  }

  .nav-item-active {
    color: #087568;

    background:
      linear-gradient(
        180deg,
        #f4fbf9 0%,
        #edf8f5 100%
      );

    border-color:
      rgba(8, 117, 104, 0.14);

    box-shadow:
      inset 0 -1px 0
      rgba(8, 117, 104, 0.05);
  }

  .nav-item-active::after {
    left: 12px;
    right: 12px;
    bottom: 4px;

    height: 2px;

    background:
      linear-gradient(
        90deg,
        #087568,
        #11a595
      );
  }


  /* Header actions */

  .header-actions {
    gap: 8px;
  }

  .property-link,
  .login-link,
  .register-link,
  .logout-button,
  .booking-link {
    min-height: 38px;

    padding:
      0 13px;

    border-radius:
      14px;

    font-size: 11.5px;
    font-weight: 700;

    line-height: 1;

    letter-spacing:
      -0.012em;

    transition:
      transform 150ms ease,
      box-shadow 150ms ease,
      background 150ms ease,
      border-color 150ms ease;
  }

  .property-link {
    background:
      linear-gradient(
        135deg,
        #087568 0%,
        #0b8477 100%
      );

    box-shadow:
      0 9px 22px
      rgba(8, 117, 104, 0.15);
  }

  .property-link:hover {
    box-shadow:
      0 12px 26px
      rgba(8, 117, 104, 0.20);
  }

  .logout-button {
    background:
      linear-gradient(
        135deg,
        #ef4444 0%,
        #f05252 100%
      );

    box-shadow:
      0 9px 22px
      rgba(239, 68, 68, 0.14);
  }

  .logout-button:hover {
    box-shadow:
      0 12px 26px
      rgba(239, 68, 68, 0.20);
  }

  .language-picker-button,
  .clean-select {
    height: 38px;

    border-color:
      rgba(8, 117, 104, 0.17);

    border-radius:
      14px;

    background:
      rgba(255, 255, 255, 0.96);

    box-shadow:
      0 7px 18px
      rgba(15, 50, 44, 0.035);
  }

  .language-picker-button {
    padding:
      0 12px;

    gap: 7px;

    font-size: 11px;
    font-weight: 700;

    letter-spacing:
      -0.01em;
  }

  .clean-select {
    padding:
      0 10px;

    gap: 5px;

    font-size: 11.5px;
    font-weight: 700;
  }

  .clean-select select {
    font-family:
      "Manrope",
      "Segoe UI",
      Arial,
      sans-serif;

    font-size: 11.5px;
    font-weight: 700;

    letter-spacing:
      -0.01em;
  }

  .language-picker-button:hover,
  .clean-select:hover,
  .booking-link:hover,
  .login-link:hover {
    border-color:
      rgba(8, 117, 104, 0.30);

    background:
      #f8fcfb;
  }

  .cart-icon-link {
    width: 38px;
    min-width: 38px;
    height: 38px;
    min-height: 38px;

    padding: 0;

    border-radius: 13px;

    font-size: 18px;

    background:
      #eefaf7;

    border-color:
      #bce8df;
  }

  .user-greeting {
    max-width: 126px;

    color: #273430;

    font-size: 12.5px;
    font-weight: 700;

    letter-spacing:
      -0.012em;
  }


  /* Dropdown text */

  .language-option {
    font-family:
      "Manrope",
      "Segoe UI",
      Arial,
      sans-serif;
  }

  .language-option span {
    font-size: 10px;
    font-weight: 700;
  }

  .language-option strong {
    font-size: 12.5px;
    font-weight: 700;

    letter-spacing:
      -0.012em;
  }


  /* Laptop compact mode */

  @media (max-width: 1500px) {
    .site-header-inner {
      min-height: 74px;

      grid-template-columns:
        minmax(220px, 252px)
        minmax(0, 1fr)
        minmax(0, max-content);

      padding:
        0 20px;

      column-gap:
        12px;
    }

    .brand-mark {
      width: 44px;
      height: 44px;

      flex-basis: 44px;

      border-radius: 14px;
    }

    .brand-name {
      font-size: 23px;
    }

    .main-navigation {
      gap: 1px;
    }

    .nav-item {
      padding:
        9px 7px;

      font-size: 10.8px;
    }

    .property-link,
    .login-link,
    .register-link,
    .logout-button,
    .booking-link {
      min-height: 36px;

      padding:
        0 10px;

      font-size: 10.8px;
    }

    .language-picker-button,
    .clean-select {
      height: 36px;
    }

    .language-picker-button {
      padding:
        0 9px;

      font-size: 10.8px;
    }

    .clean-select,
    .clean-select select,
    .user-greeting {
      font-size: 10.8px;
    }

    .cart-icon-link {
      width: 36px;
      min-width: 36px;
      height: 36px;
      min-height: 36px;
    }
  }


  /* Existing stacked-tablet behavior, visually refined */

  @media (max-width: 1280px) {
    .site-header-inner {
      padding:
        12px 20px
        10px;
    }

    .brand-link {
      max-width: none;
    }

    .main-navigation {
      gap: 5px;

      padding-top: 1px;
    }

    .nav-item {
      padding:
        9px 10px;

      font-size: 11px;
    }

    .nav-item-active::after {
      bottom: 2px;
    }
  }


  /* Mobile */

  @media (max-width: 760px) {
    .site-header-inner {
      padding:
        11px 14px;
    }

    .brand-link {
      gap: 10px;
    }

    .brand-mark {
      width: 42px;
      height: 42px;

      flex-basis: 42px;

      border-radius: 13px;
    }

    .brand-name {
      font-size: 21px;

      letter-spacing:
        -0.035em;
    }

    .mobile-menu-button {
      width: 42px;
      height: 42px;

      border-radius: 12px;

      background:
        #f8fcfb;

      box-shadow:
        0 7px 18px
        rgba(8, 117, 104, 0.07);
    }

    .main-navigation.main-navigation-open,
    .header-actions.header-actions-open {
      font-family:
        "Manrope",
        "Segoe UI",
        Arial,
        sans-serif;
    }

    .main-navigation.main-navigation-open {
      border-radius:
        16px
        16px
        8px
        8px;
    }

    .nav-item {
      padding:
        11px 12px;

      border-radius: 11px;

      font-size: 11px;
      font-weight: 700;
    }

    .property-link,
    .login-link,
    .register-link,
    .logout-button,
    .booking-link {
      min-height: 36px;

      border-radius: 12px;

      font-size: 10.8px;
    }

    .language-picker-button,
    .clean-select {
      height: 36px;

      border-radius: 12px;
    }

    .user-greeting {
      font-size: 10.8px;
    }
  }


  @media (max-width: 520px) {
    .brand-name {
      font-size: 19px;
    }
  }


  /* =========================================================
     SET 20.2 — FINAL COMPACT HEADER OVERRIDES
  ========================================================= */

  .main-navigation .nav-item {
    font-size: 11.5px;
  }

  .header-actions .property-link,
  .header-actions .login-link,
  .header-actions .register-link,
  .header-actions .logout-button,
  .header-actions .booking-link,
  .header-actions .language-picker-button,
  .header-actions .clean-select,
  .header-actions .clean-select select,
  .header-actions .user-greeting {
    font-size: 11.5px;
  }

  .header-actions .property-link,
  .header-actions .login-link,
  .header-actions .register-link,
  .header-actions .logout-button,
  .header-actions .booking-link {
    min-height: 38px;
  }

  .header-actions .language-picker-button,
  .header-actions .clean-select {
    height: 38px;
  }

  .header-actions .cart-icon-link {
    width: 38px;
    min-width: 38px;
    height: 38px;
    min-height: 38px;
  }

  @media (max-width: 1500px) {
    .main-navigation .nav-item {
      font-size: 10.8px;
    }

    .header-actions .property-link,
    .header-actions .login-link,
    .header-actions .register-link,
    .header-actions .logout-button,
    .header-actions .booking-link,
    .header-actions .language-picker-button,
    .header-actions .clean-select,
    .header-actions .clean-select select,
    .header-actions .user-greeting {
      font-size: 10.8px;
    }

    .header-actions .property-link,
    .header-actions .login-link,
    .header-actions .register-link,
    .header-actions .logout-button,
    .header-actions .booking-link,
    .header-actions .language-picker-button,
    .header-actions .clean-select {
      min-height: 36px;
      height: 36px;
    }

    .header-actions .cart-icon-link {
      width: 36px;
      min-width: 36px;
      height: 36px;
      min-height: 36px;
    }
  }

  @media (max-width: 1280px) {
    .main-navigation .nav-item {
      font-size: 11px;
    }
  }

  @media (max-width: 760px) {
    .main-navigation .nav-item {
      font-size: 11px;
    }

    .header-actions .property-link,
    .header-actions .login-link,
    .header-actions .register-link,
    .header-actions .logout-button,
    .header-actions .booking-link,
    .header-actions .language-picker-button,
    .header-actions .clean-select,
    .header-actions .clean-select select,
    .header-actions .user-greeting {
      font-size: 10.8px;
    }
  }


  /* =========================================================
     SET 20.3 — TRANSLATION-SAFE NAVIGATION
     Long translated labels stay centered and compact.
     Full translated text appears only on hover/focus.
  ========================================================= */

  .site-header {
    overflow: visible;
  }

  .site-header-inner,
  .main-navigation,
  .header-actions {
    overflow: visible;
  }

  .main-navigation {
    position: relative;

    justify-content: center;

    gap:
      clamp(
        3px,
        0.42vw,
        7px
      );
  }

  .main-navigation .nav-item {
    position: relative;

    flex:
      0 1
      clamp(
        68px,
        4.7vw,
        86px
      );

    width:
      clamp(
        68px,
        4.7vw,
        86px
      );

    min-width: 0;
    max-width:
      clamp(
        68px,
        4.7vw,
        86px
      );

    min-height: 38px;

    padding:
      0 7px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    overflow: visible;

    text-align: center;

    white-space: nowrap;
  }

  .main-navigation:hover .nav-item,
  .main-navigation:hover .nav-item:hover {
    flex:
      0 1
      clamp(
        68px,
        4.7vw,
        86px
      );

    max-width:
      clamp(
        68px,
        4.7vw,
        86px
      );
  }

  .nav-label {
    display: block;

    width: 100%;
    min-width: 0;

    overflow: hidden;

    text-overflow: ellipsis;
    white-space: nowrap;

    text-align: center;

    line-height: 1.2;
  }

  /* Google Translate can inject <font> elements.
     Keep them inside the same ellipsis box. */

  .nav-label > font,
  .header-action-label > font {
    display: block;

    width: 100%;
    min-width: 0;

    overflow: hidden;

    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-action-label {
    display: block;

    width: 100%;
    min-width: 0;

    overflow: hidden;

    text-overflow: ellipsis;
    white-space: nowrap;

    text-align: center;

    line-height: 1.2;
  }


  /* Only translated labels that genuinely overflow receive
     the full-text hover/focus bubble. */

  [data-header-label-container][data-overflowing="true"] {
    position: relative;
  }

  [data-header-label-container][data-overflowing="true"]::before,
  [data-header-label-container][data-overflowing="true"]::after {
    position: absolute;

    left: 50%;

    z-index: 10020;

    pointer-events: none;

    opacity: 0;
    visibility: hidden;

    transition:
      opacity 140ms ease,
      transform 140ms ease,
      visibility 140ms ease;
  }

  [data-header-label-container][data-overflowing="true"]::after {
    content: attr(data-tooltip);

    top: calc(100% + 10px);

    width: max-content;
    max-width: min(240px, 78vw);

    padding:
      8px 11px;

    border:
      1px solid
      rgba(8, 117, 104, 0.18);

    border-radius: 10px;

    background:
      rgba(255, 255, 255, 0.985);

    color: #1f332e;

    box-shadow:
      0 12px 30px
      rgba(20, 66, 57, 0.15);

    font-family:
      "Manrope",
      "Segoe UI",
      Arial,
      sans-serif;

    font-size: 11px;
    font-weight: 650;

    line-height: 1.4;

    letter-spacing: -0.01em;

    white-space: normal;

    text-align: center;

    overflow-wrap: anywhere;

    transform:
      translate(
        -50%,
        -3px
      );
  }

  [data-header-label-container][data-overflowing="true"]::before {
    content: "";

    top: calc(100% + 5px);

    width: 10px;
    height: 10px;

    border-left:
      1px solid
      rgba(8, 117, 104, 0.16);

    border-top:
      1px solid
      rgba(8, 117, 104, 0.16);

    background: #ffffff;

    transform:
      translateX(-50%)
      rotate(45deg);
  }

  [data-header-label-container][data-overflowing="true"]:hover::before,
  [data-header-label-container][data-overflowing="true"]:hover::after,
  [data-header-label-container][data-overflowing="true"]:focus-visible::before,
  [data-header-label-container][data-overflowing="true"]:focus-visible::after {
    opacity: 1;
    visibility: visible;
  }

  [data-header-label-container][data-overflowing="true"]:hover::after,
  [data-header-label-container][data-overflowing="true"]:focus-visible::after {
    transform:
      translate(
        -50%,
        0
      );
  }


  /* Keep translatable action buttons compact too. */

  .header-actions .property-link {
    width:
      clamp(
        112px,
        8vw,
        138px
      );

    max-width:
      clamp(
        112px,
        8vw,
        138px
      );

    min-width: 0;
  }

  .header-actions .logout-button,
  .header-actions .login-link,
  .header-actions .register-link {
    width:
      clamp(
        64px,
        4.8vw,
        80px
      );

    max-width:
      clamp(
        64px,
        4.8vw,
        80px
      );

    min-width: 0;
  }


  /* Do not let translated text change the vertical alignment. */

  .main-navigation .nav-item,
  .header-actions .property-link,
  .header-actions .login-link,
  .header-actions .register-link,
  .header-actions .logout-button {
    box-sizing: border-box;

    align-items: center;
    justify-content: center;

    vertical-align: middle;
  }


  @media (max-width: 1500px) {
    .main-navigation .nav-item,
    .main-navigation:hover .nav-item,
    .main-navigation:hover .nav-item:hover {
      flex:
        0 1
        clamp(
          62px,
          4.45vw,
          75px
        );

      width:
        clamp(
          62px,
          4.45vw,
          75px
        );

      max-width:
        clamp(
          62px,
          4.45vw,
          75px
        );

      min-height: 36px;

      padding:
        0 6px;
    }

    .header-actions .property-link {
      width:
        clamp(
          102px,
          7.6vw,
          124px
        );

      max-width:
        clamp(
          102px,
          7.6vw,
          124px
        );
    }

    .header-actions .logout-button,
    .header-actions .login-link,
    .header-actions .register-link {
      width:
        clamp(
          58px,
          4.4vw,
          70px
        );

      max-width:
        clamp(
          58px,
          4.4vw,
          70px
        );
    }
  }


  /* Tablet/mobile menus have room vertically, so show the
     complete translated text rather than truncating it. */

  @media (max-width: 1280px) {
    .main-navigation.main-navigation-open .nav-item,
    .main-navigation.main-navigation-open:hover .nav-item,
    .main-navigation.main-navigation-open:hover .nav-item:hover {
      width: 100%;
      max-width: none;

      flex: none;
      transition: color 0.18s ease, background-color 0.18s ease;
    }

    .main-navigation.main-navigation-open .nav-label,
    .main-navigation.main-navigation-open .nav-label > font {
      overflow: visible;

      text-overflow: clip;
      white-space: normal;
    }

    .main-navigation.main-navigation-open
      [data-header-label-container]::before,
    .main-navigation.main-navigation-open
      [data-header-label-container]::after {
      display: none;
    }
  }


  @media (max-width: 760px) {
    .header-actions.header-actions-open .property-link,
    .header-actions.header-actions-open .logout-button,
    .header-actions.header-actions-open .login-link,
    .header-actions.header-actions-open .register-link {
      width: auto;
      max-width: none;
    }

    .header-actions.header-actions-open .header-action-label,
    .header-actions.header-actions-open .header-action-label > font {
      overflow: visible;

      text-overflow: clip;
      white-space: normal;
    }

    .header-actions.header-actions-open
      [data-header-label-container]::before,
    .header-actions.header-actions-open
      [data-header-label-container]::after {
      display: none;
    }
  }


  /* =========================================================
     SET 20.4 — TRIPLANKA BRAND WORDMARK
     Modern, attractive, site-matched navbar identity.
  ========================================================= */

  .brand-link {
    position: relative;

    gap: 12px;

    max-width: 320px;

    overflow: visible;
  }

  .brand-link::after {
    content: "";

    position: absolute;

    left: 60px;
    bottom: -5px;

    width: 46px;
    height: 2px;

    border-radius: 999px;

    background:
      linear-gradient(
        90deg,
        #087568 0%,
        #0aa393 58%,
        #e3b72d 100%
      );

    opacity: 0;

    transform:
      scaleX(0.45);

    transform-origin: left;

    transition:
      opacity 160ms ease,
      transform 160ms ease;
  }

  .brand-link:hover::after {
    opacity: 1;

    transform:
      scaleX(1);
  }


  /* Refined brand symbol */

  .brand-mark {
    width: 48px;
    height: 48px;

    flex-basis: 48px;

    border-radius: 15px;

    border:
      1px solid
      rgba(255, 255, 255, 0.52);

    background:
      radial-gradient(
        circle at 73% 22%,
        #ffd84d 0 10%,
        rgba(255, 216, 77, 0.26) 11% 18%,
        transparent 19%
      ),
      linear-gradient(
        145deg,
        #075f57 0%,
        #07887b 42%,
        #0ca89a 68%,
        #13a7c6 100%
      );

    box-shadow:
      0 12px 26px
      rgba(7, 107, 96, 0.18),
      inset 0 1px 0
      rgba(255, 255, 255, 0.28);

    transition:
      transform 170ms ease,
      box-shadow 170ms ease;
  }

  .brand-link:hover .brand-mark {
    transform:
      translateY(-1px)
      rotate(-1deg);

    box-shadow:
      0 15px 32px
      rgba(7, 107, 96, 0.22),
      inset 0 1px 0
      rgba(255, 255, 255, 0.30);
  }

  .brand-mark::before {
    left: 8px;
    bottom: 9px;

    width: 32px;
    height: 12px;

    border-radius:
      50%
      50%
      18%
      18%;

    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.36),
        rgba(255, 255, 255, 0.13)
      );

    transform:
      rotate(-7deg);
  }

  .brand-mark-wave {
    left: 8px;
    right: 8px;
    bottom: 9px;

    height: 8px;

    border-top:
      2px solid
      rgba(255, 255, 255, 0.92);

    border-radius: 999px;

    transform:
      rotate(-4deg);
  }

  .brand-mark-sun {
    right: 9px;
    top: 8px;

    width: 8px;
    height: 8px;

    background: #ffe36a;

    box-shadow:
      0 0 0 4px
      rgba(255, 227, 106, 0.18);
  }

  .brand-mark strong {
    color: #ffffff;

    font-family:
      "Manrope",
      "Segoe UI",
      Arial,
      sans-serif;

    font-size: 12px;
    font-weight: 800;

    letter-spacing:
      -0.03em;

    text-shadow:
      0 1px 4px
      rgba(0, 52, 47, 0.22);
  }


  /* Legacy wordmark rules (kept for compatibility) */

  .brand-name {
    position: relative;

    display: inline-flex;
    align-items: baseline;

    max-width: none;

    overflow: visible;

    color: #123c36;

    font-family:
      "Manrope",
      "Segoe UI",
      Arial,
      sans-serif;

    font-size:
      clamp(
        24px,
        1.55vw,
        29px
      );

    font-weight: 800;

    line-height: 1;

    letter-spacing:
      -0.048em;

    white-space: nowrap;

    text-overflow: clip;
  }

  .brand-name > span {
    display: inline;

    width: auto;

    overflow: visible;

    text-overflow: clip;

    white-space: nowrap;
  }

  .brand-tourism {
    color: #123f39;
  }

  .brand-hub {
    margin-left: 1px;

    color: #078a7c;
  }

  .brand-lk {
    margin-left: 8px;

    background:
      linear-gradient(
        135deg,
        #c88f08 0%,
        #e4b72a 55%,
        #f0ca54 100%
      );

    -webkit-background-clip: text;
    background-clip: text;

    color: transparent;

    letter-spacing:
      -0.035em;

    text-shadow:
      0 5px 18px
      rgba(211, 160, 25, 0.07);
  }


  @media (max-width: 1500px) {
    .brand-link {
      max-width: 286px;

      gap: 11px;
    }

    .brand-mark {
      width: 44px;
      height: 44px;

      flex-basis: 44px;

      border-radius: 14px;
    }

    .brand-name {
      font-size: 23px;
    }

    .brand-lk {
      margin-left: 7px;
    }

    .brand-link::after {
      left: 55px;
    }
  }


  @media (max-width: 760px) {
    .brand-link {
      gap: 10px;
    }

    .brand-mark {
      width: 42px;
      height: 42px;

      flex-basis: 42px;
    }

    .brand-name {
      font-size: 20px;

      letter-spacing:
        -0.04em;
    }

    .brand-lk {
      margin-left: 6px;
    }

    .brand-link::after {
      display: none;
    }
  }


  @media (max-width: 420px) {
    .brand-name {
      font-size: 18px;
    }
  }


  /* =========================================================
     SET 20.5 — TRIPLANKA NAVBAR BRAND
     More visible logo badge + custom wordmark that matches
     the site while feeling more like a real product logo.
  ========================================================= */

  .brand-link {
    position: relative;

    display: inline-flex;
    align-items: center;
    gap: 14px;

    padding: 6px 10px 6px 8px;

    border-radius: 18px;

    max-width: 360px;

    text-decoration: none;

    background: transparent;

    overflow: visible;
  }

  .brand-link:hover {
    background: rgba(8, 130, 118, 0.045);
  }

  .brand-link::after {
    content: "";

    position: absolute;
    left: 80px;
    bottom: 2px;

    width: 78px;
    height: 3px;

    border-radius: 999px;

    background: linear-gradient(90deg, #0f7468 0%, #11b7ab 58%, #efc44d 100%);

    opacity: 0;
    transform: scaleX(0.52);
    transform-origin: left;

    transition: opacity 170ms ease, transform 170ms ease;
  }

  .brand-link:hover::after {
    opacity: 1;
    transform: scaleX(1);
  }

  .brand-mark {
    position: relative;

    width: 56px;
    height: 56px;
    flex: 0 0 56px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    border-radius: 17px;
    overflow: hidden;

    border: 1px solid rgba(255, 255, 255, 0.58);

    background:
      radial-gradient(circle at 76% 22%, #ffd84f 0 10%, rgba(255, 216, 79, 0.22) 11% 20%, transparent 21%),
      linear-gradient(145deg, #06584f 0%, #0c8276 44%, #11b4ac 76%, #18c2d2 100%);

    box-shadow:
      0 16px 30px rgba(6, 108, 97, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.34);

    transition: transform 170ms ease, box-shadow 170ms ease;
  }

  .brand-link:hover .brand-mark {
    transform: translateY(-1px) scale(1.02);
    box-shadow:
      0 18px 34px rgba(6, 108, 97, 0.26),
      inset 0 1px 0 rgba(255, 255, 255, 0.36);
  }

  .brand-mark::before {
    content: "";

    position: absolute;
    left: 9px;
    right: 9px;
    bottom: 11px;

    height: 12px;

    border-radius: 999px;

    background: linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));

    transform: rotate(-6deg);
  }

  .brand-mark-sun,
  .brand-mark-wave {
    position: absolute;
    display: block;
  }

  .brand-mark-sun {
    right: 10px;
    top: 9px;

    width: 10px;
    height: 10px;

    border-radius: 999px;
    background: #ffd651;

    box-shadow: 0 0 0 5px rgba(255, 214, 81, 0.15);
  }

  .brand-mark-wave {
    left: 11px;
    right: 11px;
    bottom: 12px;

    height: 8px;

    border-top: 2.2px solid rgba(255,255,255,0.95);
    border-radius: 999px;

    transform: rotate(-4deg);
  }

  .brand-mark strong {
    position: relative;
    z-index: 1;

    color: #ffffff;

    font-family: "Trebuchet MS", "Segoe UI", Arial, sans-serif;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: -0.05em;

    text-shadow: 0 2px 8px rgba(0, 66, 60, 0.24);
  }

  .brand-name {
    display: inline-flex;
    align-items: center;
    gap: 10px;

    max-width: none;
    overflow: visible;

    white-space: nowrap;
    text-overflow: clip;
  }

  .brand-wordmark {
    font-family: "Trebuchet MS", "Segoe UI", Arial, sans-serif;
    font-size: clamp(28px, 1.7vw, 34px);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.06em;
  }

  .brand-name span {
    width: auto;
    overflow: visible;
    white-space: nowrap;
    text-overflow: clip;
  }

  .brand-main-word {
    display: inline-flex;
    align-items: baseline;
    gap: 0;
  }

  .brand-tourism {
    color: #184641;
  }

  .brand-hub {
    color: #0a9687;
  }

  .brand-lk-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    min-width: 42px;
    height: 30px;
    padding: 0 10px;

    border-radius: 999px;

    background: linear-gradient(135deg, #0f786a 0%, #11a696 100%);
    color: #fff8db;

    box-shadow:
      0 8px 18px rgba(12, 126, 114, 0.18),
      inset 0 1px 0 rgba(255,255,255,0.2);

    font-size: 15px;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  @media (max-width: 1500px) {
    .brand-link {
      max-width: 332px;
      gap: 13px;
      padding-right: 8px;
    }

    .brand-mark {
      width: 52px;
      height: 52px;
      flex-basis: 52px;
      border-radius: 16px;
    }

    .brand-wordmark {
      font-size: 30px;
    }

    .brand-link::after {
      left: 73px;
      width: 72px;
    }

    .brand-lk-pill {
      min-width: 40px;
      height: 28px;
      font-size: 14px;
    }
  }

  @media (max-width: 760px) {
    .brand-link {
      gap: 10px;
      max-width: 255px;
      padding: 4px 6px 4px 4px;
    }

    .brand-mark {
      width: 44px;
      height: 44px;
      flex-basis: 44px;
      border-radius: 14px;
    }

    .brand-mark strong {
      font-size: 11px;
    }

    .brand-wordmark {
      font-size: 22px;
      gap: 8px;
    }

    .brand-lk-pill {
      min-width: 34px;
      height: 24px;
      padding: 0 8px;
      font-size: 12px;
    }

    .brand-link::after {
      display: none;
    }
  }


  /* =========================================================
     SET 21 — TRIPLANKA FINAL BRAND SYSTEM
     Inline SVG logo + modern Manrope wordmark.
     These rules intentionally come last so they override
     the older TourismHub brand styling above.
  ========================================================= */

  .brand-link {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    max-width: 300px;
    padding: 5px 8px 5px 4px;
    border-radius: 18px;
    overflow: visible;
    text-decoration: none;
    background: transparent;
    transition: transform 180ms ease, background 180ms ease;
  }

  .brand-link::after {
    display: none !important;
  }

  .brand-link:hover {
    transform: translateY(-1px);
    background: rgba(8, 117, 104, 0.045);
  }

  .brand-logo-symbol {
    width: 56px;
    height: 56px;
    flex: 0 0 56px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    overflow: hidden;
    box-shadow:
      0 15px 30px rgba(5, 101, 92, 0.20),
      0 4px 10px rgba(5, 101, 92, 0.09);
    transition: transform 180ms ease, box-shadow 180ms ease;
  }

  .brand-logo-svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .brand-link:hover .brand-logo-symbol {
    transform: translateY(-1px) rotate(-1deg) scale(1.025);
    box-shadow:
      0 18px 36px rgba(5, 101, 92, 0.24),
      0 5px 12px rgba(5, 101, 92, 0.11);
  }

  .brand-logo-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    overflow: visible;
  }

  .brand-logo-name {
    display: inline-flex;
    align-items: baseline;
    width: auto;
    overflow: visible;
    white-space: nowrap;
    font-family: "Manrope", "Segoe UI", Arial, sans-serif;
    font-size: clamp(27px, 1.68vw, 33px);
    font-weight: 800;
    line-height: 1.12;
    letter-spacing: -1.1px;
  }

  .brand-logo-name > span {
    width: auto;
    overflow: visible;
    white-space: nowrap;
  }

  .brand-trip {
    color: #173f3a;
  }

  .brand-lanka {
    position: relative;
    color: #0a998b;
  }

  .brand-lanka::after {
    content: "";
    position: absolute;
    top: -2px;
    right: -8px;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #e3ab2b;
    box-shadow: 0 0 0 3px rgba(227, 171, 43, 0.13);
  }

  .brand-logo-tagline {
    display: block;
    color: #526e68;
    font-family: "Manrope", "Segoe UI", Arial, sans-serif;
    font-size: 8px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: 1.65px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .trip-lanka-footer-mark {
    padding: 0;
    overflow: hidden;
    background: transparent;
    border: 0;
  }

  .footer-logo-svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .public-footer-logo-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .public-footer-logo-copy > strong {
    color: #173f3a;
    font-family: "Manrope", "Segoe UI", Arial, sans-serif;
    font-size: 28px;
    font-weight: 850;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .public-footer-logo-copy .footer-brand-lanka {
    color: #087568;
  }

  .brand-link:focus-visible,
  .public-footer-logo:focus-visible {
    outline: 3px solid #dcae36;
    outline-offset: 5px;
  }

  @media (prefers-reduced-motion: reduce) {
    .brand-link,
    .brand-logo-symbol {
      transition: none;
    }

    .brand-link:hover,
    .brand-link:hover .brand-logo-symbol {
      transform: none;
    }
  }

  .public-footer-logo-copy > small {
    color: #42645d;
    font-family: "Manrope", "Segoe UI", Arial, sans-serif;
    font-size: 9px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: 1.45px;
    text-transform: uppercase;
  }

  @media (max-width: 1500px) {
    .brand-link {
      max-width: 270px;
      gap: 10px;
    }

    .brand-logo-symbol {
      width: 50px;
      height: 50px;
      flex-basis: 50px;
      border-radius: 16px;
    }

    .brand-logo-name {
      font-size: 27px;
      letter-spacing: -1.2px;
    }

    .brand-logo-tagline {
      font-size: 7.2px;
      letter-spacing: 1.35px;
    }
  }

  @media (max-width: 760px) {
    .brand-link {
      max-width: 235px;
      gap: 9px;
      padding: 3px;
    }

    .brand-logo-symbol {
      width: 44px;
      height: 44px;
      flex-basis: 44px;
      border-radius: 14px;
    }

    .brand-logo-name {
      font-size: 22px;
      letter-spacing: -0.95px;
    }

    .brand-logo-tagline {
      font-size: 6.2px;
      letter-spacing: 1.05px;
    }

    .brand-lanka::after {
      top: -1px;
      right: -6px;
      width: 5px;
      height: 5px;
    }
  }

  @media (max-width: 430px) {
    .brand-logo-name {
      font-size: 20px;
    }

    .brand-logo-tagline {
      display: none;
    }
  }


  /* =========================================================
     FINAL RESPONSIVE HEADER FIX
     Keeps the full desktop header above 1280px and switches
     tablet/smaller widths to one reliable hamburger menu.
  ========================================================= */

  .site-header {
    isolation: isolate;
  }

  @media (max-width: 1280px) {
    .site-header.site-header-menu-open {
      z-index: 10001;
      max-height: 100dvh;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .site-header-inner {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-rows: auto;
      grid-auto-rows: auto;
      align-items: center;
      justify-items: stretch;
      gap: 10px;
      padding: 11px 18px;
      overflow: visible;
    }

    .brand-link {
      grid-column: 1;
      grid-row: 1;
      justify-self: start;
      min-width: 0;
      max-width: min(270px, calc(100vw - 92px));
      overflow: visible;
    }

    .mobile-menu-button {
      display: inline-flex;
      grid-column: 2;
      grid-row: 1;
      align-items: center;
      justify-content: center;
      justify-self: end;
      width: 44px;
      min-width: 44px;
      height: 44px;
      min-height: 44px;
      padding: 0;
      position: relative;
      z-index: 1010;
      border: 1px solid rgba(8, 117, 104, 0.28);
      background: #ffffff;
      border-radius: 13px;
      color: var(--hub-green);
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(8, 117, 104, 0.08);
      pointer-events: auto;
    }

    .hamburger-lines {
      width: 20px;
      display: inline-flex;
      flex-direction: column;
      gap: 4px;
    }

    .hamburger-lines span {
      display: block;
      width: 100%;
      height: 2px;
      border-radius: 999px;
      background: var(--hub-green-dark);
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
      display: none;
      width: 100%;
      max-width: none;
      min-width: 0;
      overflow: visible;
    }

    .main-navigation {
      grid-column: 1 / -1;
      grid-row: 2;
      align-self: start;
    }

    .header-actions {
      grid-column: 1 / -1;
      grid-row: 3;
      align-self: start;
    }

    .main-navigation.main-navigation-open {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      width: 100%;
      margin: 2px 0 0;
      padding: 12px;
      position: relative;
      z-index: 1005;
      background: #ffffff;
      border: 1px solid rgba(8, 117, 104, 0.14);
      border-radius: 16px 16px 8px 8px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      pointer-events: auto;
    }

    .header-actions.header-actions-open {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      margin: -4px 0 0;
      padding: 10px 12px 13px;
      position: relative;
      z-index: 1005;
      background: #ffffff;
      border: 1px solid rgba(8, 117, 104, 0.14);
      border-top: 0;
      border-radius: 0 0 16px 16px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      pointer-events: auto;
    }

    .main-navigation.main-navigation-open .nav-item {
      width: 100%;
      max-width: none;
      min-width: 0;
      min-height: 44px;
      padding: 11px 12px;
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;
      border-radius: 11px;
      background: #f8fafc;
      border: 1px solid rgba(8, 117, 104, 0.10);
      color: #1f2937;
      font-size: 12px;
      font-weight: 750;
      text-align: center;
      text-decoration: none;
      pointer-events: auto;
      cursor: pointer;
    }

    .main-navigation.main-navigation-open .nav-item:hover,
    .main-navigation.main-navigation-open .nav-item-active {
      color: var(--hub-green);
      background: #edf9f7;
      border-color: rgba(8, 117, 104, 0.25);
    }

    .main-navigation.main-navigation-open .nav-item-active::after {
      display: none;
    }

    .main-navigation.main-navigation-open .nav-label,
    .main-navigation.main-navigation-open .nav-label > font {
      width: 100%;
      overflow: visible;
      text-overflow: clip;
      white-space: normal;
      pointer-events: none;
    }

    .header-actions.header-actions-open > a,
    .header-actions.header-actions-open > button,
    .header-actions.header-actions-open .language-picker,
    .header-actions.header-actions-open .clean-select,
    .header-actions.header-actions-open .user-greeting {
      position: relative;
      z-index: 1;
      pointer-events: auto;
    }

    .header-actions.header-actions-open .property-link,
    .header-actions.header-actions-open .logout-button,
    .header-actions.header-actions-open .login-link,
    .header-actions.header-actions-open .register-link,
    .header-actions.header-actions-open .booking-link {
      width: auto;
      max-width: none;
    }
  }

  @media (max-width: 760px) {
    .site-header-inner {
      padding: 10px 12px;
    }

    .brand-link {
      max-width: min(235px, calc(100vw - 78px));
    }

    .main-navigation.main-navigation-open {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .header-actions.header-actions-open {
      padding: 10px;
    }
  }

  @media (max-width: 520px) {
    .main-navigation.main-navigation-open {
      grid-template-columns: 1fr;
    }

    .header-actions.header-actions-open {
      flex-direction: column;
      align-items: stretch;
    }

    .header-actions.header-actions-open > a,
    .header-actions.header-actions-open > button,
    .header-actions.header-actions-open .language-picker,
    .header-actions.header-actions-open .clean-select,
    .header-actions.header-actions-open .user-greeting {
      width: 100%;
      max-width: 100%;
    }

    .header-actions.header-actions-open .language-picker-button,
    .header-actions.header-actions-open .clean-select,
    .header-actions.header-actions-open .property-link,
    .header-actions.header-actions-open .booking-link,
    .header-actions.header-actions-open .login-link,
    .header-actions.header-actions-open .register-link,
    .header-actions.header-actions-open .logout-button {
      width: 100%;
      max-width: 100%;
      justify-content: center;
    }

    .header-actions.header-actions-open .user-greeting {
      text-align: center;
      order: -1;
    }
  }

`;

export default PublicLayout;

