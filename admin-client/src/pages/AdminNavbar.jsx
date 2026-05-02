import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

function AdminNavbar() {
  const navigate = useNavigate();
  const { admin, logoutAdmin } = useAdminAuth();

  const handleLogout = () => {
    logoutAdmin();
    navigate("/login");
  };

  return (
    <header className="admin-navbar-wrap">
      <nav className="admin-navbar">
        <NavLink to="/dashboard" className="admin-brand">
          <span className="admin-brand-logo">TH</span>
          <span>
            <strong>TourismHub LK</strong>
            <small>Admin Panel</small>
          </span>
        </NavLink>

        <div className="admin-nav-links">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/registration-fees">Registration Fees</NavLink>
          <NavLink to="/monthly-fees">Monthly Fees</NavLink>
          <NavLink to="/payment-versions">Payment Versions</NavLink>
          <NavLink to="/revenue">Revenue</NavLink>
          <NavLink to="/system-risk">System Risk</NavLink>
        </div>

        <div className="admin-nav-user">
          <span>{admin?.full_name || "Admin"}</span>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}

export default AdminNavbar;