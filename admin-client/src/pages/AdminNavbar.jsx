import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/property-approvals", label: "Properties" },
  { to: "/event-approvals", label: "Events" },
  { to: "/guide-approvals", label: "Guides" },
  { to: "/explore-manager", label: "Explore" },
  { to: "/revenue", label: "Revenue" },
  { to: "/system-risk", label: "Risk" },
];

function AdminNavbar() {
  const navigate = useNavigate();
  const { admin, logoutAdmin } = useAdminAuth();

  const handleLogout = () => {
    logoutAdmin();
    navigate("/login");
  };

  return (
    <header className="admin-navbar-wrap admin-navbar-wrap-modern">
      <nav className="admin-navbar admin-navbar-modern">
        <NavLink to="/dashboard" className="admin-brand admin-brand-modern">
          <span className="admin-brand-logo">TH</span>
          <span>
            <strong>TourismHub LK</strong>
            <small>Admin Command Center</small>
          </span>
        </NavLink>

        <div className="admin-nav-links admin-nav-links-modern">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="admin-nav-user admin-nav-user-modern">
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
