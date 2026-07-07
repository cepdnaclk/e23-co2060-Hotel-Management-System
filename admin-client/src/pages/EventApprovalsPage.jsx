import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

const filters = [
  { key: "all", label: "All Events" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "hidden", label: "Hidden" },
];

const formatDate = (value) => {
  if (!value) return "Not set";
  return String(value).slice(0, 10);
};

const statusClass = (status) => {
  if (status === "approved" || status === "published") return "status-badge status-approved";
  if (status === "rejected" || status === "hidden") return "status-badge status-rejected";
  return "status-badge status-pending";
};

function EventApprovalsPage() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
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

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/admin/events?${queryString}`);
      setEvents(response.data.events || []);
      setStats(response.data.stats || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load event approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [queryString]);

  const refreshSelectedEvent = async (id) => {
    try {
      const response = await api.get(`/admin/events/${id}`);
      setSelectedEvent(response.data.event);
    } catch {
      setSelectedEvent(null);
    }
  };

  const approveEvent = async (eventId) => {
    try {
      setActionLoading(true);
      setMessage("");
      setError("");
      await api.put(`/admin/events/${eventId}/approve`);
      setMessage("Event approved successfully. It is now visible to tourists.");
      await loadEvents();
      await refreshSelectedEvent(eventId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve event");
    } finally {
      setActionLoading(false);
    }
  };

  const rejectEvent = async (eventId) => {
    const reason = window.prompt("Enter the reason for rejecting this event");
    if (!reason || !reason.trim()) return;

    try {
      setActionLoading(true);
      setMessage("");
      setError("");
      await api.put(`/admin/events/${eventId}/reject`, {
        rejection_reason: reason.trim(),
      });
      setMessage("Event rejected successfully. Partner can edit and resubmit it.");
      await loadEvents();
      await refreshSelectedEvent(eventId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject event");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently remove this event?");
    if (!confirmDelete) return;

    try {
      setActionLoading(true);
      setMessage("");
      setError("");
      await api.delete(`/admin/events/${eventId}`);
      setSelectedEvent(null);
      setMessage("Event removed successfully.");
      await loadEvents();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove event");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="admin-page">
      <section className="admin-hero event-admin-hero">
        <div>
          <p className="eyebrow">Partner Event Approval</p>
          <h1>Event Review Center</h1>
          <p>
            Review partner-submitted tourist events. New and edited events stay pending until admin approval.
            Only approved events appear on the tourist Events page.
          </p>
        </div>
      </section>

      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}

      <section className="admin-grid">
        <div className="admin-card">
          <span>Total Events</span>
          <strong>{Number(stats?.total_events || 0)}</strong>
          <p>All partner event records.</p>
        </div>
        <div className="admin-card">
          <span>Pending Approval</span>
          <strong>{Number(stats?.pending_events || 0)}</strong>
          <p>Needs admin review.</p>
        </div>
        <div className="admin-card">
          <span>Approved</span>
          <strong>{Number(stats?.approved_events || 0)}</strong>
          <p>Visible to tourists.</p>
        </div>
        <div className="admin-card">
          <span>Rejected</span>
          <strong>{Number(stats?.rejected_events || 0)}</strong>
          <p>Needs partner correction.</p>
        </div>
      </section>

      <section className="table-card event-admin-card">
        <div className="table-head">
          <div>
            <h2>Event Approval Requests</h2>
            <p>Open an event to review full details, approve, reject, or remove it.</p>
          </div>
          <div className="event-admin-tools">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search event, partner, city..."
              className="event-search-input"
            />
            <button type="button" onClick={loadEvents} className="refresh-btn">
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
          <div className="empty-box">Loading partner events...</div>
        ) : events.length === 0 ? (
          <div className="empty-box">No events found for this filter.</div>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Partner</th>
                  <th>Location</th>
                  <th>Date & Time</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <div className="event-title-cell">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} />
                        ) : (
                          <span className="event-thumb-fallback">EV</span>
                        )}
                        <div>
                          <strong>{event.title}</strong>
                          <p>{event.category}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {event.partner_name || "Partner"}
                      <br />
                      <small>{event.partner_email || "No email"}</small>
                    </td>
                    <td>
                      {event.city}
                      <p>{event.venue}</p>
                    </td>
                    <td>
                      {formatDate(event.event_date)}
                      <p>{event.time_label}</p>
                    </td>
                    <td>
                      {event.price_type}
                      <p>Rs. {Number(event.price || 0).toLocaleString()}</p>
                    </td>
                    <td>
                      <span className={statusClass(event.status)}>{event.status}</span>
                    </td>
                    <td className="action-row">
                      <button type="button" onClick={() => setSelectedEvent(event)}>
                        Review
                      </button>
                      {event.status !== "approved" && event.status !== "published" && (
                        <button
                          type="button"
                          className="approve-btn"
                          disabled={actionLoading}
                          onClick={() => approveEvent(event.id)}
                        >
                          Approve
                        </button>
                      )}
                      {event.status !== "rejected" && (
                        <button
                          type="button"
                          className="danger-btn small"
                          disabled={actionLoading}
                          onClick={() => rejectEvent(event.id)}
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

      {selectedEvent && (
        <div className="modal-overlay">
          <div className="modal event-review-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Event Review</p>
                <h2>{selectedEvent.title}</h2>
                <p>{selectedEvent.category} • {selectedEvent.city} • {selectedEvent.venue}</p>
              </div>
              <button type="button" className="close-btn" onClick={() => setSelectedEvent(null)}>
                ×
              </button>
            </div>

            {selectedEvent.image_url && (
              <img className="event-review-image" src={selectedEvent.image_url} alt={selectedEvent.title} />
            )}

            <div className="review-grid">
              <div className="review-box">
                <h3>Partner Details</h3>
                <p><strong>Partner:</strong> {selectedEvent.partner_name || "Not set"}</p>
                <p><strong>Email:</strong> {selectedEvent.partner_email || "Not set"}</p>
                <p><strong>Phone:</strong> {selectedEvent.partner_phone || "Not set"}</p>
                <p><strong>Property:</strong> {selectedEvent.property_name || "No property selected"}</p>
              </div>

              <div className="review-box">
                <h3>Event Schedule</h3>
                <p><strong>Date:</strong> {formatDate(selectedEvent.event_date)}</p>
                <p><strong>Month:</strong> {selectedEvent.month_name}</p>
                <p><strong>Time:</strong> {selectedEvent.time_label}</p>
                <p><strong>Duration:</strong> {selectedEvent.duration || "Not set"}</p>
              </div>

              <div className="review-box">
                <h3>Pricing & Contact</h3>
                <p><strong>Price Type:</strong> {selectedEvent.price_type}</p>
                <p><strong>Price:</strong> Rs. {Number(selectedEvent.price || 0).toLocaleString()}</p>
                <p><strong>Contact:</strong> {selectedEvent.contact_name || "Not set"}</p>
                <p><strong>Email:</strong> {selectedEvent.contact_email || "Not set"}</p>
                <p><strong>Phone:</strong> {selectedEvent.contact_phone || "Not set"}</p>
              </div>

              <div className="review-box">
                <h3>Approval Status</h3>
                <p><strong>Status:</strong> <span className={statusClass(selectedEvent.status)}>{selectedEvent.status}</span></p>
                <p><strong>Submitted:</strong> {formatDate(selectedEvent.submitted_at)}</p>
                <p><strong>Approved:</strong> {formatDate(selectedEvent.approved_at)}</p>
                {selectedEvent.rejection_reason && (
                  <p><strong>Reject Reason:</strong> {selectedEvent.rejection_reason}</p>
                )}
              </div>
            </div>

            <div className="review-box">
              <h3>Description</h3>
              <p>{selectedEvent.short_description}</p>
              <p>{selectedEvent.description}</p>
            </div>

            <div className="review-grid">
              <div className="review-box">
                <h3>Highlights</h3>
                {selectedEvent.highlights?.length ? (
                  <ul>{selectedEvent.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : (
                  <p>No highlights added.</p>
                )}
              </div>
              <div className="review-box">
                <h3>Nearby Hotels</h3>
                {selectedEvent.near_hotels?.length ? (
                  <ul>{selectedEvent.near_hotels.map((item) => <li key={item}>{item}</li>)}</ul>
                ) : (
                  <p>No nearby hotels added.</p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              {selectedEvent.status !== "approved" && selectedEvent.status !== "published" && (
                <button
                  type="button"
                  className="approve-btn"
                  disabled={actionLoading}
                  onClick={() => approveEvent(selectedEvent.id)}
                >
                  Approve Event
                </button>
              )}
              {selectedEvent.status !== "rejected" && (
                <button
                  type="button"
                  className="reject-btn"
                  disabled={actionLoading}
                  onClick={() => rejectEvent(selectedEvent.id)}
                >
                  Reject Event
                </button>
              )}
              <button
                type="button"
                className="remove-btn"
                disabled={actionLoading}
                onClick={() => deleteEvent(selectedEvent.id)}
              >
                Remove Event
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default EventApprovalsPage;
