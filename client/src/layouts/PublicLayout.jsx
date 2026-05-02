import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PublicLayout() {
  const { user, isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");

    if (confirmLogout) {
      logout();
    }
  };

  return (
    <div>
      <header style={styles.header}>
        <Link to="/" style={styles.logo}>
          🌴 TourismHub LK
        </Link>

        <nav style={styles.nav}>
          <Link to="/" style={styles.link}>
            Home
          </Link>

          <Link to="/explore" style={styles.link}>
            Explore
          </Link>

          <Link to="/trip-planner" style={styles.link}>
            Plan Trip
          </Link>

          <Link to="/hotels" style={styles.link}>
            Hotels
          </Link>

          <Link to="/travel-essentials" style={styles.link}>
            Travel Essentials
          </Link>

          <Link to="/list-your-property" style={styles.partnerButton}>
            List your property
          </Link>
        </nav>

        <div style={styles.rightSide}>
          <Link to="/my-bookings" style={styles.cartIcon} title="My Bookings">
            🛒
          </Link>

          {isLoggedIn ? (
            <>
              <span style={styles.userText}>
                Hi, {user?.full_name || user?.name || "User"}
              </span>

              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.loginButton}>
                Login
              </Link>

              <Link to="/register" style={styles.registerButton}>
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  header: {
    width: "100%",
    minHeight: "76px",
    padding: "14px 34px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },

  logo: {
    fontSize: "24px",
    fontWeight: "900",
    color: "#0f766e",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },

  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "22px",
    flex: 1,
  },

  link: {
    color: "#334155",
    fontSize: "15px",
    fontWeight: "700",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },

  partnerButton: {
    color: "#ffffff",
    background: "linear-gradient(135deg, #0f766e, #14b8a6)",
    padding: "10px 16px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: "800",
    textDecoration: "none",
    whiteSpace: "nowrap",
    boxShadow: "0 8px 18px rgba(20, 184, 166, 0.25)",
  },

  rightSide: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "13px",
    whiteSpace: "nowrap",
  },

  cartIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#ecfeff",
    color: "#0f766e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    textDecoration: "none",
    boxShadow: "0 8px 20px rgba(15, 118, 110, 0.18)",
    border: "1px solid #ccfbf1",
  },

  userText: {
    color: "#334155",
    fontSize: "14px",
    fontWeight: "700",
  },

  loginButton: {
    color: "#0f766e",
    background: "#ffffff",
    border: "1px solid #99f6e4",
    padding: "10px 16px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: "800",
    textDecoration: "none",
  },

  registerButton: {
    color: "#ffffff",
    background: "#0f766e",
    padding: "10px 16px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: "800",
    textDecoration: "none",
    boxShadow: "0 8px 18px rgba(15, 118, 110, 0.22)",
  },

  logoutButton: {
    color: "#ffffff",
    background: "#ef4444",
    padding: "10px 16px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: "800",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(239, 68, 68, 0.22)",
  },
};

export default PublicLayout;