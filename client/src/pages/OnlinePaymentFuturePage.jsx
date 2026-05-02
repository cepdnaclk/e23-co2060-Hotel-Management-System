import { Link, useSearchParams } from "react-router-dom";

function OnlinePaymentFuturePage() {
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get("bookingId");
  const reference = searchParams.get("reference");

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.iconCircle}>💳</div>

        <h1 style={styles.title}>Online Payment</h1>

        <p style={styles.subtitle}>
          This online payment gateway is planned for a future update.
        </p>

        <div style={styles.successBox}>
          <h2 style={styles.successTitle}>Payment Status Updated</h2>
          <p style={styles.successText}>
            For this project demo, your payment status has been changed to{" "}
            <strong>Paid</strong>.
          </p>
        </div>

        <div style={styles.detailsBox}>
          <p>
            <strong>Booking ID:</strong> {bookingId || "Not available"}
          </p>

          <p>
            <strong>Booking Reference:</strong> {reference || "Not available"}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            <span style={styles.paidBadge}>Paid</span>
          </p>
        </div>

        <p style={styles.note}>
          In the real future version, this page can connect with a payment
          gateway such as Visa, MasterCard, PayHere, Stripe, or bank payment.
        </p>

        <div style={styles.actions}>
          <Link to="/my-bookings" style={styles.primaryButton}>
            Back to My Bookings
          </Link>

          <Link to="/hotels" style={styles.secondaryButton}>
            Browse Hotels
          </Link>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #ecfeff 0%, #f8fafc 45%, #eff6ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
  },

  card: {
    width: "100%",
    maxWidth: "720px",
    background: "#ffffff",
    borderRadius: "28px",
    padding: "42px",
    textAlign: "center",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.15)",
    border: "1px solid #dbeafe",
  },

  iconCircle: {
    width: "90px",
    height: "90px",
    margin: "0 auto 20px",
    borderRadius: "50%",
    background: "#0f766e",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "42px",
    boxShadow: "0 16px 30px rgba(15, 118, 110, 0.3)",
  },

  title: {
    margin: "0 0 12px",
    fontSize: "42px",
    color: "#061b36",
  },

  subtitle: {
    margin: "0 auto 24px",
    color: "#475569",
    fontSize: "18px",
    fontWeight: "600",
    maxWidth: "520px",
  },

  successBox: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    padding: "18px",
    borderRadius: "18px",
    marginBottom: "18px",
  },

  successTitle: {
    margin: "0 0 8px",
    fontSize: "22px",
  },

  successText: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
  },

  detailsBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "18px",
    textAlign: "left",
    marginBottom: "18px",
    color: "#0f172a",
    fontWeight: "700",
  },

  paidBadge: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 14px",
    borderRadius: "999px",
    fontWeight: "900",
  },

  note: {
    color: "#64748b",
    fontSize: "15px",
    lineHeight: "1.6",
    marginBottom: "24px",
  },

  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "14px",
    flexWrap: "wrap",
  },

  primaryButton: {
    background: "#0f766e",
    color: "#ffffff",
    textDecoration: "none",
    padding: "14px 22px",
    borderRadius: "14px",
    fontWeight: "900",
  },

  secondaryButton: {
    background: "#0b63ce",
    color: "#ffffff",
    textDecoration: "none",
    padding: "14px 22px",
    borderRadius: "14px",
    fontWeight: "900",
  },
};

export default OnlinePaymentFuturePage;