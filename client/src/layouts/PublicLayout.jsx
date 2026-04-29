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

          <Link to="/accommodation" style={styles.link}>
            Accommodation
          </Link>

          <Link to="/events" style={styles.link}>
            Events
          </Link>

          <Link to="/guides" style={styles.link}>
            Guides
          </Link>

          <Link to="/transport" style={styles.link}>
            Transport
          </Link>

          <Link to="/partner" style={styles.link}>
            List your property
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/account/bookings" style={styles.link}>
                My Bookings
              </Link>

              <span style={styles.userText}>
                Hi, {user?.full_name?.split(" ")[0] || "User"}
              </span>

              <button
                type="button"
                style={styles.logoutButton}
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>
                Login
              </Link>

              <Link to="/register" style={styles.button}>
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  header: {
    minHeight: "70px",
    padding: "0 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  logo: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f766e",
    textDecoration: "none",
    whiteSpace: "nowrap",
    marginRight: "20px",
  },
  nav: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  link: {
    textDecoration: "none",
    color: "#1f2937",
    fontWeight: "500",
    whiteSpace: "nowrap",
    fontSize: "15px",
  },
  button: {
    textDecoration: "none",
    background: "#2563eb",
    color: "white",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "600",
    whiteSpace: "nowrap",
    fontSize: "15px",
  },
  logoutButton: {
    border: "none",
    background: "#dc2626",
    color: "white",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontSize: "15px",
  },
  userText: {
    color: "#0f766e",
    fontWeight: "700",
    whiteSpace: "nowrap",
    fontSize: "15px",
  },
  main: {
    padding: "0 40px 40px",
  },
};

export default PublicLayout;