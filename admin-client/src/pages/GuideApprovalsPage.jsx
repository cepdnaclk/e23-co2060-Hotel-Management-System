import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

const filters = [
  { key: "all", label: "All Guides" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "hidden", label: "Hidden" },
];

const formatDate = (value) => {
  if (!value) return "Not set";
  return String(value).slice(0, 10);
};

const formatMoney = (amount) => `Rs. ${Number(amount || 0).toLocaleString("en-LK")}`;

const statusClass = (status) => {
  if (status === "approved") return "status-badge status-approved";
  if (status === "rejected" || status === "hidden") return "status-badge status-rejected";
  return "status-badge status-pending";
};

function GuideApprovalsPage() {
  const [guides, setGuides] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("status", filter);
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [filter, search]);

  const loadGuides = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/admin/guides?${queryString}`);
      setGuides(response.data.guides || []);
      setStats(response.data.stats || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load guide approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuides();
  }, [queryString]);

  const refreshSelectedGuide = async (id) => {
    try {
      const response = await api.get(`/admin/guides/${id}`);
      setSelectedGuide(response.data.guide);
    } catch {
      setSelectedGuide(null);
    }
  };

  const approveGuide = async (guideId) => {
    try {
      setActionLoading(true);
      setMessage("");
      setError("");
      await api.put(`/admin/guides/${guideId}/approve`);
      setMessage("Guide profile approved successfully. It is now visible to tourists.");
      await loadGuides();
      await refreshSelectedGuide(guideId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve guide profile");
    } finally {
      setActionLoading(false);
    }
  };

  const rejectGuide = async (guideId) => {
    const reason = window.prompt("Enter the reason for rejecting this guide profile");
    if (!reason || !reason.trim()) return;

    try {
      setActionLoading(true);
      setMessage("");
      setError("");
      await api.put(`/admin/guides/${guideId}/reject`, {
        rejection_reason: reason.trim(),
      });
      setMessage("Guide profile rejected successfully. Partner can edit and resubmit it.");
      await loadGuides();
      await refreshSelectedGuide(guideId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject guide profile");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteGuide = async (guideId) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently remove this guide profile?");
    if (!confirmDelete) return;

    try {
      setActionLoading(true);
      setMessage("");
      setError("");
      await api.delete(`/admin/guides/${guideId}`);
      setSelectedGuide(null);
      setMessage("Guide profile removed successfully.");
      await loadGuides();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove guide profile");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="admin-page">
      <section className="admin-hero guide-admin-hero">
        <div>
          <p className="eyebrow">Partner Guider Approval</p>
          <h1>Guide Review Center</h1>
          <p>
            Review partner-submitted guider profiles. Only approved guide profiles appear on the public Tourist Guides page.
          </p>
        </div>
      </section>

      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}

      <section className="admin-grid">
        <div className="admin-card">
          <span>Total Guides</span>
          <strong>{Number(stats?.total_guides || 0)}</strong>
          <p>All guide profile records.</p>
        </div>
        <div className="admin-card">
          <span>Pending Approval</span>
          <strong>{Number(stats?.pending_guides || 0)}</strong>
          <p>Needs admin review.</p>
        </div>
        <div className="admin-card">
          <span>Approved</span>
          <strong>{Number(stats?.approved_guides || 0)}</strong>
          <p>Visible to tourists.</p>
        </div>
        <div className="admin-card">
          <span>Rejected</span>
          <strong>{Number(stats?.rejected_guides || 0)}</strong>
          <p>Needs partner correction.</p>
        </div>
        <div className="admin-card">
          <span>Paid Registration</span>
          <strong>{Number(stats?.paid_registration_guides || 0)}</strong>
          <p>Eligible for admin approval.</p>
        </div>
        <div className="admin-card">
          <span>Top Ads</span>
          <strong>{Number(stats?.promoted_guides || 0)}</strong>
          <p>Paid promoted guide placements.</p>
        </div>
      </section>

      <section className="table-card event-admin-card">
        <div className="table-head">
          <div>
            <h2>Guide Approval Requests</h2>
            <p>Open a guide profile to review full details, approve, reject, or remove it.</p>
          </div>
          <div className="event-admin-tools">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guide, partner, city..."
              className="event-search-input"
            />
            <button type="button" onClick={loadGuides} className="refresh-btn">
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
          <div className="empty-box">Loading partner guide profiles...</div>
        ) : guides.length === 0 ? (
          <div className="empty-box">No guide profiles found for this filter.</div>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Guide</th>
                  <th>Partner</th>
                  <th>Location</th>
                  <th>Experience</th>
                  <th>Price</th>
                  <th>Payments</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {guides.map((guide) => (
                  <tr key={guide.id}>
                    <td>
                      <div className="event-title-cell">
                        {guide.image_url ? (
                          <img src={guide.image_url} alt={guide.display_name} />
                        ) : (
                          <span className="event-thumb-fallback">GD</span>
                        )}
                        <div>
                          <strong>{guide.display_name}</strong>
                          <p>{guide.guide_type}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {guide.partner_name || "Partner"}
                      <br />
                      <small>{guide.partner_email || "No email"}</small>
                    </td>
                    <td>
                      {guide.city}
                      <p>{guide.base_location || guide.district || "Not set"}</p>
                    </td>
                    <td>
                      {guide.experience_years} years
                      <p>{guide.languages?.join(" / ") || "No languages"}</p>
                    </td>
                    <td>
                      Day Rs. {Number(guide.price_per_day || 0).toLocaleString()}
                      <p>Hour Rs. {Number(guide.price_per_hour || 0).toLocaleString()}</p>
                    </td>
                    <td>
                      <span className={guide.registration_payment_status === "Paid" ? "status-badge status-approved" : "status-badge status-pending"}>
                        Reg {guide.registration_payment_status || "Unpaid"}
                      </span>
                      <p>
                        {guide.is_promoted ? "Top ad paid" : `Top ad ${guide.promotion_payment_status || "Unpaid"}`}
                      </p>
                    </td>
                    <td>
                      <span className={statusClass(guide.status)}>{guide.status}</span>
                    </td>
                    <td className="action-row">
                      <button type="button" onClick={() => setSelectedGuide(guide)}>
                        Review
                      </button>
                      {guide.status !== "approved" && (
                        <button
                          type="button"
                          className="approve-btn"
                          disabled={actionLoading || guide.registration_payment_status !== "Paid"}
                          title={guide.registration_payment_status !== "Paid" ? "Registration fee must be paid before approval" : ""}
                          onClick={() => approveGuide(guide.id)}
                        >
                          Approve
                        </button>
                      )}
                      {guide.status !== "rejected" && (
                        <button
                          type="button"
                          className="danger-btn small"
                          disabled={actionLoading}
                          onClick={() => rejectGuide(guide.id)}
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedGuide && (
        <div className="modal-overlay">
          <div className="modal event-review-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Guide Review</p>
                <h2>{selectedGuide.display_name}</h2>
                <p>{selectedGuide.guide_type} • {selectedGuide.city}</p>
              </div>
              <button type="button" className="close-btn" onClick={() => setSelectedGuide(null)}>
                ×
              </button>
            </div>

            {selectedGuide.image_url && (
              <img className="event-review-image" src={selectedGuide.image_url} alt={selectedGuide.display_name} />
            )}

            <div className="review-grid">
              <div className="review-box">
                <h3>Partner Details</h3>
                <p><strong>Partner:</strong> {selectedGuide.partner_name || "Not set"}</p>
                <p><strong>Email:</strong> {selectedGuide.partner_email || "Not set"}</p>
                <p><strong>Phone:</strong> {selectedGuide.partner_phone || "Not set"}</p>
              </div>

              <div className="review-box">
                <h3>Guide Details</h3>
                <p><strong>Full Name:</strong> {selectedGuide.full_name}</p>
                <p><strong>Display Name:</strong> {selectedGuide.display_name}</p>
                <p><strong>License:</strong> {selectedGuide.license_number || "Not set"}</p>
                <p><strong>NIC/Passport:</strong> {selectedGuide.nic_or_passport || "Not set"}</p>
              </div>

              <div className="review-box">
                <h3>Contact & Pricing</h3>
                <p><strong>Phone:</strong> {selectedGuide.phone}</p>
                <p><strong>Email:</strong> {selectedGuide.email}</p>
                <p><strong>WhatsApp:</strong> {selectedGuide.whatsapp_number || "Not set"}</p>
                <p><strong>Day Price:</strong> Rs. {Number(selectedGuide.price_per_day || 0).toLocaleString()}</p>
                <p><strong>Hour Price:</strong> Rs. {Number(selectedGuide.price_per_hour || 0).toLocaleString()}</p>
              </div>

              <div className="review-box">
                <h3>Approval Status</h3>
                <p><strong>Status:</strong> <span className={statusClass(selectedGuide.status)}>{selectedGuide.status}</span></p>
                <p><strong>Registration Fee:</strong> {formatMoney(selectedGuide.registration_fee)} - {selectedGuide.registration_payment_status || "Unpaid"}</p>
                <p><strong>Top Ad Fee:</strong> {formatMoney(selectedGuide.promotion_fee)} - {selectedGuide.promotion_payment_status || "Unpaid"}</p>
                <p><strong>Promoted Until:</strong> {formatDate(selectedGuide.promotion_expires_at)}</p>
                <p><strong>Submitted:</strong> {formatDate(selectedGuide.submitted_at)}</p>
                <p><strong>Approved:</strong> {formatDate(selectedGuide.approved_at)}</p>
                {selectedGuide.rejection_reason && (
                  <p><strong>Reject Reason:</strong> {selectedGuide.rejection_reason}</p>
                )}
              </div>
            </div>

            <div className="review-box">
              <h3>Description</h3>
              <p>{selectedGuide.short_description}</p>
              <p>{selectedGuide.bio}</p>
            </div>

            <div className="review-grid">
              <div className="review-box">
                <h3>Services</h3>
                {selectedGuide.services?.length ? (
                  <ul>{selectedGuide.services.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : (
                  <p>No services added.</p>
                )}
              </div>
              <div className="review-box">
                <h3>Specialities</h3>
                {selectedGuide.specialities?.length ? (
                  <ul>{selectedGuide.specialities.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : (
                  <p>No specialities added.</p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              {selectedGuide.status !== "approved" && (
                <button
                  type="button"
                  className="approve-btn"
                  disabled={actionLoading || selectedGuide.registration_payment_status !== "Paid"}
                  title={selectedGuide.registration_payment_status !== "Paid" ? "Registration fee must be paid before approval" : ""}
                  onClick={() => approveGuide(selectedGuide.id)}
                >
                  Approve Guide
                </button>
              )}
              {selectedGuide.status !== "rejected" && (
                <button
                  type="button"
                  className="reject-btn"
                  disabled={actionLoading}
                  onClick={() => rejectGuide(selectedGuide.id)}
                >
                  Reject Guide
                </button>
              )}
              <button
                type="button"
                className="remove-btn"
                disabled={actionLoading}
                onClick={() => deleteGuide(selectedGuide.id)}
              >
                Remove Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default GuideApprovalsPage;
