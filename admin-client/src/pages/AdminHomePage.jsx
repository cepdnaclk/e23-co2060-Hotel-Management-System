import { Link } from "react-router-dom";

function AdminHomePage() {
  return (
    <main className="admin-home-page">
      <div className="admin-home-overlay" />

      <section className="admin-home-card">
        <div className="admin-home-logo">TH</div>

        <p className="admin-home-eyebrow">Admin Portal</p>
        <h1>TourismHub LK</h1>
        <p className="admin-home-subtitle">
          Manage property approvals, payments, revenue, and system records from
          one clean admin platform.
        </p>

        <div className="admin-home-actions">
          <Link className="home-primary-btn" to="/register">
            Register
          </Link>
          <Link className="home-secondary-btn" to="/login">
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}

export default AdminHomePage;