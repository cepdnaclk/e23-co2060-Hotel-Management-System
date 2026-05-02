import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

function MyBookingsPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/bookings/my");
      setBookings(response.data.data || []);
    } catch (error) {
      console.error("Load bookings error:", error);
      setError(
        error.response?.data?.message ||
          "Server error while getting your bookings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const getStatusStyle = (status) => {
    const normalStatus = String(status || "").toLowerCase();

    if (normalStatus.includes("approved") || normalStatus.includes("paid")) {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (
      normalStatus.includes("rejected") ||
      normalStatus.includes("pending")
    ) {
      return {
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Not available";

    return new Date(dateValue).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatLongDate = (dateValue) => {
    if (!dateValue) return "Not available";

    return new Date(dateValue).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString("en-LK")}`;
  };

  const getInitials = (name) => {
    return String(name || "Hotel")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const handleOnlinePayment = async (booking) => {
    try {
      const confirmPay = window.confirm(
        "This is a future online payment demo. Do you want to mark this booking as Paid?"
      );

      if (!confirmPay) return;

      await api.put(`/bookings/${booking.id}/pay-online`);

      setBookings((prevBookings) =>
        prevBookings.map((item) =>
          item.id === booking.id
            ? {
                ...item,
                payment_status: "Paid",
              }
            : item
        )
      );

      navigate(
        `/online-payment-future?bookingId=${booking.id}&reference=${
          booking.booking_reference || ""
        }`
      );
    } catch (error) {
      console.error("Online payment error:", error);

      alert(
        error.response?.data?.message ||
          "Server error while updating payment status."
      );
    }
  };

  const downloadInvoice = (booking) => {
    const doc = new jsPDF("p", "mm", "a4");

    const hotelName = booking.property_name || "Hotel";
    const hotelCity = booking.property_city || "Sri Lanka";
    const hotelDistrict = booking.property_district || "";
    const hotelThemeColor = booking.property_theme_color || "#0f766e";

    const bookingReference = booking.booking_reference || `BK-${booking.id}`;
    const status = booking.booking_status || "Pending Partner Approval";
    const paymentStatus = booking.payment_status || "Pending Payment";

    const approvalStatusLower = String(status).toLowerCase();
    const paymentStatusLower = String(paymentStatus).toLowerCase();

    const isApproved = approvalStatusLower.includes("approved");
    const isRejected = approvalStatusLower.includes("rejected");
    const isApprovalPending = approvalStatusLower.includes("pending");
    const isPaid = paymentStatusLower.includes("paid");
    const isPaymentPending = paymentStatusLower.includes("pending");

    const guestName =
      booking.full_name || booking.tourist_name || "Not available";
    const guestEmail = booking.email || "Not available";
    const guestPhone = booking.phone || "Not available";
    const roomType = booking.room_type || "N/A";
    const checkIn = formatDate(booking.check_in);
    const checkOut = formatDate(booking.check_out);
    const guests = booking.guests || 1;
    const nights = booking.nights || 1;
    const totalAmount = formatCurrency(booking.total_amount);

    const hexToRgb = (hex) => {
      let cleanHex = String(hex || "#0f766e").replace("#", "").trim();

      if (cleanHex.length === 3) {
        cleanHex = cleanHex
          .split("")
          .map((char) => char + char)
          .join("");
      }

      if (cleanHex.length !== 6) {
        return [15, 118, 110];
      }

      const numberValue = parseInt(cleanHex, 16);

      if (Number.isNaN(numberValue)) {
        return [15, 118, 110];
      }

      return [
        (numberValue >> 16) & 255,
        (numberValue >> 8) & 255,
        numberValue & 255,
      ];
    };

    const lightenColor = (rgb, percent) => {
      return rgb.map((value) =>
        Math.round(value + (255 - value) * (percent / 100))
      );
    };

    const darkenColor = (rgb, percent) => {
      return rgb.map((value) => Math.round(value * (1 - percent / 100)));
    };

    const themeRgb = hexToRgb(hotelThemeColor);
    const themeLight = lightenColor(themeRgb, 92);
    const themeSoft = lightenColor(themeRgb, 78);
    const themeDark = darkenColor(themeRgb, 18);
    const watermarkColor = lightenColor(themeRgb, 60);

    const safeText = (value, fallback = "Not available") => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }

      return String(value);
    };

    const getBadgeColors = (type) => {
      if (type === "green") {
        return {
          fill: [220, 252, 231],
          text: [22, 101, 52],
          border: [34, 197, 94],
        };
      }

      if (type === "red") {
        return {
          fill: [254, 226, 226],
          text: [153, 27, 27],
          border: [239, 68, 68],
        };
      }

      return {
        fill: [254, 243, 199],
        text: [146, 64, 14],
        border: [245, 158, 11],
      };
    };

    const paymentBadgeColors = getBadgeColors(
      isPaid ? "green" : isPaymentPending ? "red" : "yellow"
    );

    const approvalBadgeColors = getBadgeColors(
      isApproved ? "green" : isRejected || isApprovalPending ? "red" : "yellow"
    );

    let approvalMessage = "This booking is waiting for hotel approval.";
    let approvalMessageColor = [153, 27, 27];

    if (isApproved) {
      approvalMessage = "This booking has been approved by the hotel.";
      approvalMessageColor = [22, 101, 52];
    }

    if (isRejected) {
      approvalMessage = "This booking has been rejected by the hotel.";
      approvalMessageColor = [153, 27, 27];
    }

    const drawBadge = (label, value, x, y, width, colors) => {
      doc.setFillColor(colors.fill[0], colors.fill[1], colors.fill[2]);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.roundedRect(x, y, width, 18, 4, 4, "FD");

      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(label, x + 5, y + 7);

      doc.setFontSize(9);
      const badgeText = doc.splitTextToSize(String(value), width - 10);
      doc.text(badgeText[0], x + 5, y + 14);

      doc.setTextColor(15, 23, 42);
    };

    const drawSectionTitle = (title, x, y, width = 70) => {
      doc.setTextColor(themeDark[0], themeDark[1], themeDark[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(title, x, y);

      doc.setDrawColor(themeSoft[0], themeSoft[1], themeSoft[2]);
      doc.line(x, y + 4, x + width, y + 4);

      doc.setTextColor(15, 23, 42);
    };

    const drawInfoItem = (label, value, x, y, width) => {
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.text(label.toUpperCase(), x, y);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.3);

      const splitValue = doc.splitTextToSize(safeText(value), width);
      doc.text(splitValue.slice(0, 2), x, y + 5);
    };

    const drawSmallCard = (x, y, width, height, title) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(themeSoft[0], themeSoft[1], themeSoft[2]);
      doc.roundedRect(x, y, width, height, 6, 6, "FD");
      drawSectionTitle(title, x + 6, y + 12, width - 18);
    };

    // Background
    doc.setFillColor(themeLight[0], themeLight[1], themeLight[2]);
    doc.rect(0, 0, 210, 297, "F");

    // Main paper
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(10, 10, 190, 277, 8, 8, "F");

    // Header
    doc.setFillColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.roundedRect(10, 10, 190, 45, 8, 8, "F");
    doc.rect(10, 43, 190, 12, "F");

    doc.setFillColor(255, 255, 255);
    doc.circle(29, 32, 12, "F");

    doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(getInitials(hotelName), 29, 36, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text(doc.splitTextToSize(hotelName, 95)[0], 47, 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `${hotelCity}${hotelDistrict ? `, ${hotelDistrict}` : ""}`,
      47,
      38
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("HOTEL INVOICE", 185, 28, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Issued by hotel", 185, 38, { align: "right" });

    // Visible watermark in open middle area
    doc.setTextColor(watermarkColor[0], watermarkColor[1], watermarkColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);

    const watermarkText = doc.splitTextToSize(hotelName.toUpperCase(), 115);
    doc.text(watermarkText.slice(0, 2), 105, 142, {
      align: "center",
      angle: 35,
    });

    // Invoice meta
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("INVOICE REFERENCE", 16, 69);
    doc.text("GENERATED DATE", 118, 69);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10.5);
    doc.text(bookingReference, 16, 77);
    doc.text(formatLongDate(new Date()), 118, 77);

    drawBadge("PAYMENT STATUS", paymentStatus, 16, 88, 82, paymentBadgeColors);
    drawBadge("HOTEL APPROVAL", status, 112, 88, 82, approvalBadgeColors);

    // Approval message
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(themeSoft[0], themeSoft[1], themeSoft[2]);
    doc.roundedRect(16, 115, 178, 18, 5, 5, "FD");

    doc.setTextColor(
      approvalMessageColor[0],
      approvalMessageColor[1],
      approvalMessageColor[2]
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(approvalMessage, 22, 127);

    // Cards layout
    drawSmallCard(16, 145, 82, 62, "Guest Details");
    drawInfoItem("Name", guestName, 22, 166, 66);
    drawInfoItem("Email", guestEmail, 22, 181, 66);
    drawInfoItem("Phone", guestPhone, 22, 196, 66);

    drawSmallCard(106, 145, 88, 62, "Hotel & Room");
    drawInfoItem("Hotel", hotelName, 112, 166, 70);
    drawInfoItem(
      "Location",
      `${hotelCity}${hotelDistrict ? `, ${hotelDistrict}` : ""}`,
      112,
      181,
      70
    );
    drawInfoItem("Room Type", roomType, 112, 196, 70);

    drawSmallCard(16, 216, 82, 45, "Stay Details");
    drawInfoItem("Check-in", checkIn, 22, 237, 34);
    drawInfoItem("Check-out", checkOut, 60, 237, 34);
    drawInfoItem("Guests", String(guests), 22, 252, 34);
    drawInfoItem("Nights", String(nights), 60, 252, 34);

    drawSmallCard(106, 216, 88, 45, "Payment Summary");

    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Nights", 112, 238);
    doc.text(String(nights), 188, 238, { align: "right" });

    doc.text("Payment", 112, 250);
    doc.setFont("helvetica", "bold");
    doc.text(paymentStatus, 188, 250, { align: "right" });

    // Total amount strip
    doc.setFillColor(themeLight[0], themeLight[1], themeLight[2]);
    doc.setDrawColor(themeSoft[0], themeSoft[1], themeSoft[2]);
    doc.roundedRect(16, 268, 178, 14, 4, 4, "FD");

    doc.setTextColor(themeDark[0], themeDark[1], themeDark[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total Amount", 22, 277);

    doc.setFontSize(13);
    doc.text(totalAmount, 188, 277, { align: "right" });

    // Footer note
    const noteText =
      booking.partner_note ||
      booking.notes ||
      `Please keep this invoice for your records. This invoice is officially issued by ${hotelName}.`;

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);

    const shortNote = doc.splitTextToSize(noteText, 160);
    doc.text(shortNote.slice(0, 1), 16, 291);

    const cleanHotelName = hotelName.replace(/[^a-zA-Z0-9]/g, "-");

    doc.save(`${cleanHotelName}-Invoice-${bookingReference}.pdf`);
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loading}>Loading your bookings...</div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <Link to="/" style={styles.backLink}>
              ← Back to Home
            </Link>

            <h1 style={styles.title}>My Bookings</h1>

            <p style={styles.subtitle}>
              View booking status, hotel approval, payment status, and download
              your hotel-issued invoice.
            </p>
          </div>

          <button style={styles.refreshButton} onClick={loadBookings}>
            Refresh
          </button>
        </div>

        {!isLoggedIn && (
          <div style={styles.guestNotice}>
            You are viewing guest bookings saved on this browser. Login to keep
            bookings under your account.
          </div>
        )}

        {error && <div style={styles.errorBox}>{error}</div>}

        {bookings.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2 style={styles.emptyTitle}>No bookings found</h2>
            <p style={styles.emptyText}>
              Your bookings will appear here after you submit a room booking.
            </p>

            <Link to="/hotels" style={styles.primaryLink}>
              Explore Hotels
            </Link>
          </div>
        ) : (
          <div style={styles.bookingList}>
            {bookings.map((booking) => {
              const status =
                booking.booking_status || "Pending Partner Approval";
              const paymentStatus =
                booking.payment_status || "Pending Payment";
              const isPaid = String(paymentStatus)
                .toLowerCase()
                .includes("paid");

              return (
                <div key={booking.id} style={styles.bookingCard}>
                  <div style={styles.cardTop}>
                    <div style={styles.hotelInfo}>
                      {booking.property_logo ? (
                        <img
                          src={booking.property_logo}
                          alt={booking.property_name}
                          style={styles.logo}
                        />
                      ) : (
                        <div
                          style={{
                            ...styles.logoPlaceholder,
                            background:
                              booking.property_theme_color || "#0f766e",
                          }}
                        >
                          {getInitials(booking.property_name)}
                        </div>
                      )}

                      <div>
                        <h2 style={styles.hotelName}>
                          {booking.property_name || "Hotel"}
                        </h2>

                        <p style={styles.location}>
                          {booking.property_city || "Sri Lanka"}
                          {booking.property_district
                            ? `, ${booking.property_district}`
                            : ""}
                        </p>

                        <p style={styles.reference}>
                          Ref:{" "}
                          {booking.booking_reference || `BK-${booking.id}`}
                        </p>
                      </div>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(status),
                      }}
                    >
                      {status}
                    </span>
                  </div>

                  <div style={styles.detailsGrid}>
                    <div style={styles.detailBox}>
                      <span style={styles.detailLabel}>Room</span>
                      <strong style={styles.detailValue}>
                        {booking.room_type || "N/A"}
                      </strong>
                    </div>

                    <div style={styles.detailBox}>
                      <span style={styles.detailLabel}>Check-in</span>
                      <strong style={styles.detailValue}>
                        {formatDate(booking.check_in)}
                      </strong>
                    </div>

                    <div style={styles.detailBox}>
                      <span style={styles.detailLabel}>Check-out</span>
                      <strong style={styles.detailValue}>
                        {formatDate(booking.check_out)}
                      </strong>
                    </div>

                    <div style={styles.detailBox}>
                      <span style={styles.detailLabel}>Guests</span>
                      <strong style={styles.detailValue}>
                        {booking.guests || 1}
                      </strong>
                    </div>

                    <div style={styles.detailBox}>
                      <span style={styles.detailLabel}>Nights</span>
                      <strong style={styles.detailValue}>
                        {booking.nights || 1}
                      </strong>
                    </div>

                    <div style={styles.detailBox}>
                      <span style={styles.detailLabel}>Total Amount</span>
                      <strong style={styles.price}>
                        {formatCurrency(booking.total_amount)}
                      </strong>
                    </div>
                  </div>

                  <div style={styles.customerBox}>
                    <h3 style={styles.sectionTitle}>Customer Details</h3>

                    <p style={styles.customerText}>
                      <strong>Name:</strong>{" "}
                      {booking.full_name ||
                        booking.tourist_name ||
                        "Not available"}
                    </p>

                    <p style={styles.customerText}>
                      <strong>Email:</strong> {booking.email || "Not available"}
                    </p>

                    <p style={styles.customerText}>
                      <strong>Phone:</strong> {booking.phone || "Not available"}
                    </p>

                    {booking.nationality && (
                      <p style={styles.customerText}>
                        <strong>Nationality:</strong> {booking.nationality}
                      </p>
                    )}
                  </div>

                  <div style={styles.approvalBox}>
                    <div>
                      <p style={styles.approvalLabel}>Payment Status</p>
                      <strong
                        style={{
                          ...styles.smallStatusBadge,
                          ...getStatusStyle(paymentStatus),
                        }}
                      >
                        {paymentStatus}
                      </strong>
                    </div>

                    <div>
                      <p style={styles.approvalLabel}>Approval</p>
                      <strong
                        style={{
                          ...styles.smallStatusBadge,
                          ...getStatusStyle(status),
                        }}
                      >
                        {status}
                      </strong>
                    </div>
                  </div>

                  {booking.partner_note && (
                    <div style={styles.partnerNote}>
                      <strong>Partner Note:</strong> {booking.partner_note}
                    </div>
                  )}

                  {booking.notes && (
                    <div style={styles.customerNote}>
                      <strong>Your Note:</strong> {booking.notes}
                    </div>
                  )}

                  <div style={styles.actionRow}>
                    {isPaid ? (
                      <button style={styles.paidButton} disabled>
                        Paid
                      </button>
                    ) : (
                      <button
                        style={styles.payOnlineButton}
                        onClick={() => handleOnlinePayment(booking)}
                      >
                        Pay Online
                      </button>
                    )}

                    <button
                      style={styles.invoiceButton}
                      onClick={() => downloadInvoice(booking)}
                    >
                      Download Invoice PDF
                    </button>

                    <Link
                      to={`/hotels/${booking.property_id}`}
                      style={styles.viewHotelButton}
                    >
                      View Hotel Page
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f7fb",
    padding: "40px 16px",
  },

  container: {
    maxWidth: "1120px",
    margin: "0 auto",
  },

  loading: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "18px",
    fontWeight: "800",
    color: "#0f172a",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "22px",
  },

  backLink: {
    color: "#0b63ce",
    fontWeight: "900",
    textDecoration: "none",
    fontSize: "16px",
  },

  title: {
    margin: "18px 0 8px",
    fontSize: "42px",
    lineHeight: "1.1",
    color: "#061b36",
  },

  subtitle: {
    margin: 0,
    color: "#475569",
    fontSize: "17px",
    fontWeight: "600",
  },

  refreshButton: {
    background: "#111827",
    color: "#ffffff",
    border: "none",
    padding: "14px 22px",
    borderRadius: "14px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.18)",
  },

  guestNotice: {
    background: "#eff6ff",
    color: "#1e3a8a",
    border: "1px solid #bfdbfe",
    padding: "16px 18px",
    borderRadius: "16px",
    marginBottom: "18px",
    fontWeight: "700",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "16px 18px",
    borderRadius: "16px",
    marginBottom: "18px",
    fontWeight: "900",
  },

  emptyCard: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
  },

  emptyTitle: {
    color: "#061b36",
    fontSize: "28px",
    marginBottom: "10px",
  },

  emptyText: {
    color: "#475569",
    fontSize: "16px",
    marginBottom: "24px",
  },

  primaryLink: {
    display: "inline-block",
    background: "#0b63ce",
    color: "#ffffff",
    textDecoration: "none",
    padding: "13px 22px",
    borderRadius: "14px",
    fontWeight: "900",
  },

  bookingList: {
    display: "grid",
    gap: "22px",
  },

  bookingCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "22px",
  },

  hotelInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  logo: {
    width: "78px",
    height: "78px",
    objectFit: "contain",
    borderRadius: "18px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    padding: "8px",
  },

  logoPlaceholder: {
    width: "78px",
    height: "78px",
    borderRadius: "18px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "22px",
  },

  hotelName: {
    margin: "0 0 6px",
    color: "#061b36",
    fontSize: "25px",
  },

  location: {
    margin: "0 0 6px",
    color: "#0b63ce",
    fontWeight: "800",
  },

  reference: {
    margin: 0,
    color: "#64748b",
    fontWeight: "700",
  },

  statusBadge: {
    padding: "10px 16px",
    borderRadius: "999px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  smallStatusBadge: {
    display: "inline-block",
    padding: "7px 13px",
    borderRadius: "999px",
    fontWeight: "900",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
    marginBottom: "18px",
  },

  detailBox: {
    background: "#f8fafc",
    padding: "14px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
  },

  detailLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "800",
    marginBottom: "6px",
  },

  detailValue: {
    color: "#0f172a",
    fontSize: "16px",
  },

  price: {
    color: "#0f766e",
    fontSize: "18px",
  },

  customerBox: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: "16px",
    borderRadius: "16px",
    marginBottom: "16px",
  },

  sectionTitle: {
    margin: "0 0 10px",
    color: "#061b36",
    fontSize: "18px",
  },

  customerText: {
    margin: "5px 0",
    color: "#334155",
    fontWeight: "600",
  },

  approvalBox: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    padding: "16px",
    borderRadius: "16px",
    marginBottom: "16px",
  },

  approvalLabel: {
    margin: "0 0 6px",
    color: "#92400e",
    fontWeight: "900",
  },

  partnerNote: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "14px",
    fontWeight: "700",
  },

  customerNote: {
    background: "#eef2ff",
    color: "#3730a3",
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "14px",
    fontWeight: "700",
  },

  actionRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  payOnlineButton: {
    background: "#7c3aed",
    color: "#ffffff",
    border: "none",
    padding: "13px 18px",
    borderRadius: "14px",
    fontWeight: "900",
    cursor: "pointer",
  },

  paidButton: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
    padding: "13px 18px",
    borderRadius: "14px",
    fontWeight: "900",
    cursor: "not-allowed",
  },

  invoiceButton: {
    background: "#0f766e",
    color: "#ffffff",
    border: "none",
    padding: "13px 18px",
    borderRadius: "14px",
    fontWeight: "900",
    cursor: "pointer",
  },

  viewHotelButton: {
    background: "#0b63ce",
    color: "#ffffff",
    textDecoration: "none",
    padding: "13px 18px",
    borderRadius: "14px",
    fontWeight: "900",
  },
};

export default MyBookingsPage;