import { useEffect, useState } from "react";
import api from "../api/api";
import { useAdminAuth } from "../context/AdminAuthContext";

function AdminDashboardPage() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [message, setMessage] = useState("");

  const loadDashboard = async () => {
    try {
      const [dashboardRes, propertiesRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/properties"),
      ]);

      setStats(dashboardRes.data.data);
      setProperties(propertiesRes.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load admin dashboard");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const updateStatus = async (propertyId, action) => {
    try {
      if (action === "approve") {
        await api.put(`/admin/properties/${propertyId}/approve`);
      }

      if (action === "reject") {
        const reason = window.prompt("Enter rejection reason");
        if (!reason) return;

        await api.put(`/admin/properties/${propertyId}/reject`, {
          rejection_reason: reason,
        });
      }

      setMessage("Property updated successfully");
      loadDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || "Action failed");
    }
  };

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <div>
          <p className="eyebrow">TourismHub LK Admin</p>
          <h1>Admin Control Center</h1>
          <p>
            Welcome {admin?.full_name || "Admin"}. Control property approvals,
            payment status, revenue, and platform safety from the admin panel.
          </p>
        </div>
      </section>

      {message && <div className="alert-card">{message}</div>}

      <section className="admin-grid">
        <div className="admin-card">
          <span>Pending Properties</span>
          <strong>{stats?.pending_properties ?? 0}</strong>
          <p>Properties waiting for admin approval.</p>
        </div>

        <div className="admin-card">
          <span>Approved Properties</span>
          <strong>{stats?.approved_properties ?? 0}</strong>
          <p>Properties approved and controlled by admin.</p>
        </div>

        <div className="admin-card">
          <span>Visible Properties</span>
          <strong>{stats?.visible_properties ?? 0}</strong>
          <p>Properties currently visible to tourists.</p>
        </div>

        <div className="admin-card">
          <span>Total Revenue</span>
          <strong>Rs. {Number(stats?.total_revenue || 0).toLocaleString()}</strong>
          <p>Total collected platform revenue.</p>
        </div>
      </section>

      <section className="table-card">
        <div className="table-head">
          <h2>Property Approval Requests</h2>
          <p>Approve or reject partner submitted properties.</p>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Partner</th>
                <th>Version</th>
                <th>Rooms</th>
                <th>Reg. Fee</th>
                <th>Monthly</th>
                <th>Visible</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {properties.map((property) => (
                <tr key={property.id}>
                  <td>
                    <strong>{property.name}</strong>
                    <br />
                    <small>{property.city}</small>
                  </td>

                  <td>
                    {property.partner_name}
                    <br />
                    <small>{property.partner_email}</small>
                  </td>

                  <td>{property.plan_type}</td>

                  <td>
                    {property.total_rooms_count}/{property.room_limit}
                  </td>

                  <td>
                    <span
                      className={
                        property.registration_payment_status === "Paid"
                          ? "status paid"
                          : "status pending"
                      }
                    >
                      {property.registration_payment_status}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        property.monthly_payment_status === "Paid" ||
                        property.monthly_payment_status === "Free Trial"
                          ? "status paid"
                          : "status pending"
                      }
                    >
                      {property.monthly_payment_status}
                    </span>
                  </td>

                  <td>{property.public_visible ? "Yes" : "No"}</td>
                  <td>{property.status}</td>

                  <td className="action-row">
                    {property.status !== "approved" && (
                      <button onClick={() => updateStatus(property.id, "approve")}>
                        Approve
                      </button>
                    )}

                    {property.status !== "rejected" && (
                      <button
                        className="danger-btn small"
                        onClick={() => updateStatus(property.id, "reject")}
                      >
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {properties.length === 0 && (
                <tr>
                  <td colSpan="9">No properties found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default AdminDashboardPage;
