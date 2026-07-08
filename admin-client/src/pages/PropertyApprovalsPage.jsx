import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

const filters = [
  { key: "all", label: "All Properties" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const formatDate = (value) => {
  if (!value) return "Not set";
  return String(value).slice(0, 10);
};

const statusClass = (status) => {
  if (status === "approved") return "status-badge status-approved";
  if (status === "rejected") return "status-badge status-rejected";
  return "status-badge status-pending";
};

function PropertyApprovalsPage() {
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("status", filter);

      const [propertiesRes, dashboardRes] = await Promise.all([
        api.get(`/admin/properties?${params.toString()}`),
        api.get("/admin/dashboard"),
      ]);

      setProperties(propertiesRes.data.data || []);
      setStats(dashboardRes.data.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load property approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [filter]);

  const filteredProperties = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return properties;

    return properties.filter((property) => {
      const values = [
        property.name,
        property.city,
        property.district,
        property.partner_name,
        property.partner_email,
        property.property_type,
        property.plan_type,
      ];

      return values.some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [properties, search]);

  const openProperty = async (propertyId) => {
    try {
      setError("");
      const response = await api.get(`/admin/properties/${propertyId}`);
      setSelectedProperty(response.data.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load property details");
    }
  };

  const refreshSelectedProperty = async (propertyId) => {
    if (!propertyId) return;
    try {
      const response = await api.get(`/admin/properties/${propertyId}`);
      setSelectedProperty(response.data.data || null);
    } catch {
      setSelectedProperty(null);
    }
  };

  const approveProperty = async (propertyId) => {
    try {
      setActionLoading(true);
      setMessage("");
      setError("");
      await api.put(`/admin/properties/${propertyId}/approve`);
      setMessage("Property approved successfully. It can now appear on the tourist hotel pages.");
      await loadProperties();
      await refreshSelectedProperty(propertyId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve property");
    } finally {
      setActionLoading(false);
    }
  };

  const rejectProperty = async (propertyId) => {
    const reason = window.prompt("Enter the reason for rejecting this property");
    if (!reason || !reason.trim()) return;

    try {
      setActionLoading(true);
      setMessage("");
      setError("");
      await api.put(`/admin/properties/${propertyId}/reject`, {
        rejection_reason: reason.trim(),
      });
      setMessage("Property rejected successfully. Partner can correct and resubmit it.");
      await loadProperties();
      await refreshSelectedProperty(propertyId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject property");
    } finally {
      setActionLoading(false);
    }
  };

  const removeProperty = async (propertyId) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently remove this property?");
    if (!confirmDelete) return;

    try {
      setActionLoading(true);
      setMessage("");
      setError("");
      await api.delete(`/admin/properties/${propertyId}`);
      setSelectedProperty(null);
      setMessage("Property removed successfully.");
      await loadProperties();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove property");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="admin-page approval-page-modern">
      <section className="admin-hero property-admin-hero">
        <div>
          <p className="eyebrow">Partner Property Approval</p>
          <h1>Property Review Center</h1>
          <p>
            Review hotels and property registrations submitted by partners. Approved properties
            become available for tourists in the Hotels section.
          </p>
        </div>
      </section>

      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}

      <section className="admin-grid approval-stat-grid">
        <div className="admin-card stat-soft-card">
          <span>Pending Properties</span>
          <strong>{Number(stats?.pending_properties || 0)}</strong>
          <p>Waiting for review.</p>
        </div>
        <div className="admin-card stat-soft-card">
          <span>Approved</span>
          <strong>{Number(stats?.approved_properties || 0)}</strong>
          <p>Available to tourists.</p>
        </div>
        <div className="admin-card stat-soft-card">
          <span>Rejected</span>
          <strong>{Number(stats?.rejected_properties || 0)}</strong>
          <p>Needs partner correction.</p>
        </div>
        <div className="admin-card stat-soft-card">
          <span>Visible Properties</span>
          <strong>{Number(stats?.visible_properties || 0)}</strong>
          <p>Shown on public pages.</p>
        </div>
      </section>

      <section className="table-card event-admin-card modern-approval-card">
        <div className="table-head approval-table-head">
          <div>
            <h2>Property Approval Requests</h2>
            <p>Search, review, approve, reject, or remove partner-submitted properties.</p>
          </div>
          <div className="event-admin-tools">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search property, partner, city..."
              className="event-search-input"
            />
            <button type="button" onClick={loadProperties} className="refresh-btn">
              Refresh
            </button>
          </div>
        </div>

        <div className="tabs">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`tab-btn ${filter === item.key ? "tab-btn-active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-box">Loading property approval requests...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="empty-box">No properties found for this filter.</div>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Partner</th>
                  <th>Location</th>
                  <th>Plan</th>
                  <th>Rooms</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => (
                  <tr key={property.id}>
                    <td>
                      <div className="event-title-cell">
                        {property.main_image || property.logo_url ? (
                          <img src={property.main_image || property.logo_url} alt={property.name} />
                        ) : (
                          <span className="event-thumb-fallback">HT</span>
                        )}
                        <div>
                          <strong>{property.name}</strong>
                          <p>{property.property_type || "Property"}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {property.partner_name || "Partner"}
                      <br />
                      <small>{property.partner_email || "No email"}</small>
                    </td>
                    <td>
                      {property.city || "Not set"}
                      <p>{property.district || property.address || "No district"}</p>
                    </td>
                    <td>
                      {property.plan_type || "Basic"}
                      <p>Limit: {property.room_limit || 0} rooms</p>
                    </td>
                    <td>
                      {property.total_rooms_count || 0}/{property.room_limit || 0}
                      <p>{property.room_type_count || 0} room types</p>
                    </td>
                    <td>
                      <span
                        className={
                          property.registration_payment_status === "Paid"
                            ? "status paid"
                            : "status pending"
                        }
                      >
                        Reg: {property.registration_payment_status || "Unpaid"}
                      </span>
                      <p>Monthly: {property.monthly_payment_status || "Not set"}</p>
                    </td>
                    <td>
                      <span className={statusClass(property.status)}>{property.status}</span>
                    </td>
                    <td>
                      <div className="approval-actions-stack">
                        <button type="button" onClick={() => openProperty(property.id)}>
                          Review
                        </button>
                        {property.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => approveProperty(property.id)}
                            disabled={actionLoading}
                            className="approve-btn"
                          >
                            Approve
                          </button>
                        )}
                        {property.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => rejectProperty(property.id)}
                            disabled={actionLoading}
                            className="reject-btn"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedProperty && (
        <section className="approval-detail-panel">
          <div className="approval-detail-header">
            <div>
              <p className="eyebrow">Selected Property</p>
              <h2>{selectedProperty.name}</h2>
              <p>{selectedProperty.address || selectedProperty.city}</p>
            </div>
            <button type="button" className="tab-btn" onClick={() => setSelectedProperty(null)}>
              Close
            </button>
          </div>

          <div className="approval-detail-grid">
            <div>
              <span>Partner</span>
              <strong>{selectedProperty.partner_name || "Partner"}</strong>
              <p>{selectedProperty.partner_email || "No email"}</p>
            </div>
            <div>
              <span>Status</span>
              <strong>{selectedProperty.status}</strong>
              <p>{selectedProperty.rejection_reason || "No rejection reason"}</p>
            </div>
            <div>
              <span>Rooms</span>
              <strong>{selectedProperty.total_rooms_count || 0}</strong>
              <p>{selectedProperty.rooms?.length || 0} room records</p>
            </div>
            <div>
              <span>Submitted</span>
              <strong>{formatDate(selectedProperty.created_at)}</strong>
              <p>Last update: {formatDate(selectedProperty.updated_at)}</p>
            </div>
          </div>

          <div className="approval-description-box">
            <h3>Description</h3>
            <p>{selectedProperty.description || "No description provided."}</p>
          </div>

          <div className="approval-footer-actions">
            <button
              type="button"
              onClick={() => approveProperty(selectedProperty.id)}
              disabled={actionLoading}
              className="approve-btn"
            >
              Approve Property
            </button>
            <button
              type="button"
              onClick={() => rejectProperty(selectedProperty.id)}
              disabled={actionLoading}
              className="reject-btn"
            >
              Reject Property
            </button>
            <button
              type="button"
              onClick={() => removeProperty(selectedProperty.id)}
              disabled={actionLoading}
              className="remove-btn"
            >
              Remove Property
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

export default PropertyApprovalsPage;
