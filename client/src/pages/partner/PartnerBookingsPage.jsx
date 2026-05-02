import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function PartnerBookingsPage() {
  const { user, isLoggedIn } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/bookings/partner");
      setBookings(response.data.data || []);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load partner bookings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.role === "partner") {
      loadBookings();
    }
  }, [isLoggedIn, user]);

  if (!isLoggedIn) {
    return <Navigate to="/partner/login" />;
  }

  if (user?.role !== "partner") {
    return (
      <div className="page">
        <div className="card" style={styles.noticeCard}>
          <h2>Access denied</h2>
          <p>This page is only for partners.</p>
        </div>
      </div>
    );
  }

  const approveBooking = async (bookingId) => {
    const confirmApprove = window.confirm(
      "Are you sure you want to approve this booking?"
    );

    if (!confirmApprove) return;

    setMessage("");
    setError("");

    try {
      const response = await api.put(`/bookings/partner/${bookingId}/approve`);
      setMessage(response.data.message || "Booking approved successfully");
      loadBookings();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to approve booking");
    }
  };

  const rejectBooking = async (bookingId) => {
    const reason = window.prompt("Enter rejection reason:", "Room unavailable");

    if (reason === null) return;

    setMessage("");
    setError("");

    try {
      const response = await api.put(`/bookings/partner/${bookingId}/reject`, {
        partner_note: reason,
      });

      setMessage(response.data.message || "Booking rejected successfully");
      loadBookings();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to reject booking");
    }
  };

  return (
    <div className="page">
      <div style={styles.header}>
        <div>
          <Link to="/partner/dashboard" style={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1>Partner Bookings</h1>
          <p>Approve or reject tourist bookings for your properties.</p>
        </div>
      </div>

      {message && <div style={styles.successBox}>{message}</div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="card" style={styles.noticeCard}>
          <h2>No bookings yet</h2>
          <p>Tourist booking requests will appear here.</p>
        </div>
      ) : (
        <div style={styles.bookingGrid}>
          {bookings.map((booking) => (
            <div className="card" style={styles.bookingCard} key={booking.id}>
              <div style={styles.cardTop}>
                <div style={styles.logoBox}>
                  {booking.property_logo ? (
                    <img
                      src={booking.property_logo}
                      alt={booking.property_name}
                      style={styles.logo}
                    />
                  ) : (
                    <span>LOGO</span>
                  )}
                </div>

                <div>
                  <h2>{booking.property_name}</h2>
                  <p style={styles.city}>{booking.property_city}</p>
                </div>

                <span
                  style={{
                    ...styles.status,
                    ...(booking.booking_status === "Approved"
                      ? styles.approved
                      : {}),
                    ...(booking.booking_status === "Rejected"
                      ? styles.rejected
                      : {}),
                  }}
                >
                  {booking.booking_status}
                </span>
              </div>

              <div style={styles.detailsGrid}>
                <p>
                  <strong>Reference:</strong> {booking.booking_reference}
                </p>
                <p>
                  <strong>Tourist:</strong>{" "}
                  {booking.tourist_name || booking.full_name}
                </p>
                <p>
                  <strong>Email:</strong> {booking.email}
                </p>
                <p>
                  <strong>Phone:</strong> {booking.phone}
                </p>
                <p>
                  <strong>Room:</strong> {booking.room_type}
                </p>
                <p>
                  <strong>Guests:</strong> {booking.guests}
                </p>
                <p>
                  <strong>Check-in:</strong> {booking.check_in}
                </p>
                <p>
                  <strong>Check-out:</strong> {booking.check_out}
                </p>
                <p>
                  <strong>Total:</strong> Rs.{" "}
                  {Number(booking.total_amount || 0).toLocaleString()}
                </p>
              </div>

              {booking.notes && (
                <p style={styles.note}>
                  <strong>Tourist Note:</strong> {booking.notes}
                </p>
              )}

              {booking.partner_note && (
                <p style={styles.rejectNote}>
                  <strong>Partner Note:</strong> {booking.partner_note}
                </p>
              )}

              {booking.booking_status === "Pending Partner Approval" && (
                <div style={styles.actionRow}>
                  <button
                    type="button"
                    style={styles.approveBtn}
                    onClick={() => approveBooking(booking.id)}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    style={styles.rejectBtn}
                    onClick={() => rejectBooking(booking.id)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    marginBottom: "24px",
  },

  backLink: {
    color: "#0b63ce",
    fontWeight: "900",
    textDecoration: "none",
  },

  noticeCard: {
    padding: "30px",
    textAlign: "center",
  },

  successBox: {
    background: "#dcfce7",
    color: "#166534",
    padding: "14px 18px",
    borderRadius: "14px",
    marginBottom: "18px",
    fontWeight: "800",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px 18px",
    borderRadius: "14px",
    marginBottom: "18px",
    fontWeight: "800",
  },

  bookingGrid: {
    display: "grid",
    gap: "18px",
  },

  bookingCard: {
    padding: "24px",
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
  },

  logoBox: {
    width: "72px",
    height: "72px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    color: "#64748b",
    overflow: "hidden",
  },

  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    padding: "6px",
  },

  city: {
    color: "#0b63ce",
    fontWeight: "800",
  },

  status: {
    marginLeft: "auto",
    background: "#fef3c7",
    color: "#92400e",
    padding: "8px 12px",
    borderRadius: "999px",
    fontWeight: "900",
    fontSize: "13px",
  },

  approved: {
    background: "#dcfce7",
    color: "#166534",
  },

  rejected: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px 18px",
  },

  note: {
    background: "#eff6ff",
    color: "#1e40af",
    padding: "12px",
    borderRadius: "12px",
  },

  rejectNote: {
    background: "#fff7ed",
    color: "#9a3412",
    padding: "12px",
    borderRadius: "12px",
  },

  actionRow: {
    display: "flex",
    gap: "12px",
    marginTop: "18px",
  },

  approveBtn: {
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },

  rejectBtn: {
    background: "#ef4444",
    color: "#ffffff",
    border: "none",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: "900",
    cursor: "pointer",
  },
};

export default PartnerBookingsPage;