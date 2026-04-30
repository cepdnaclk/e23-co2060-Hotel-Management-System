import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./PartnerDashboard.css";
import LanguageCurrencySelector from "../components/LanguageCurrencySelector";
import { useAppSettings } from "../context/AppSettingsContext";

function PartnerDashboard() {
  const navigate = useNavigate();
  const { t, formatPrice } = useAppSettings();

  const [partnerName, setPartnerName] = useState("John");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  useEffect(() => {
    const storedName =
      localStorage.getItem("name") || sessionStorage.getItem("name");

    if (storedName) {
      setPartnerName(storedName.split(" ")[0]);
    }
  }, []);

  const dashboardStats = [
    {
      title: t("newBookings") || "New Bookings",
      value: "12",
      subtitle: t("upcomingBookings") || "3 upcoming",
      icon: "📅",
      color: "blue",
    },
    {
      title: t("todayCheckIns") || "Today Check-Ins",
      value: "14",
      subtitle: t("remainingCheckIns") || "5 remaining",
      icon: "✅",
      color: "green",
    },
    {
      title: t("todayCheckOuts") || "Today Check-Outs",
      value: "8",
      subtitle: t("allCheckedOut") || "All checked out",
      icon: "🧳",
      color: "orange",
    },
    {
      title: t("availabilityAlert") || "Availability Alert",
      value: "2",
      subtitle: t("roomsNeedAttention") || "rooms need attention",
      icon: "⚠️",
      color: "yellow",
    },
    {
      title: t("averageRating") || "Average Rating",
      value: "4.8",
      subtitle: t("onlyOneRoomLeft") || "Only 1 Deluxe Room left",
      icon: "⭐",
      color: "purple",
    },
  ];

  const bookings = [
    {
      id: "BKG-15782",
      guest: "Mohammed S.",
      room: "Deluxe Suite",
      roomCount: "1 booked",
      dates: "Sat, May 4 - Mon, May 6",
      amount: 48900,
      status: "Confirmed",
    },
    {
      id: "BKG-15760",
      guest: "Sarah & Michael",
      room: "Standard Room",
      roomCount: "2 booked",
      dates: "Sun, May 5 - Tue, May 7",
      amount: 35900,
      status: "Confirmed",
    },
    {
      id: "BKG-15743",
      guest: "Jessica L.",
      room: "Deluxe Suite",
      roomCount: "2 booked",
      dates: "Mon, May 6 - Wed, May 8",
      amount: 52400,
      status: "Pending",
    },
    {
      id: "BKG-15741",
      guest: "Tom & Jane W.",
      room: "Family Room",
      roomCount: "1 booked",
      dates: "Mon, May 6 - Fri, May 10",
      amount: 76500,
      status: "Cancelled",
    },
  ];

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.room.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All Statuses" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("name");

    navigate("/login");
  };

  const getStatusText = (status) => {
    if (status === "Confirmed") return t("confirmed") || "Confirmed";
    if (status === "Pending") return t("pending") || "Pending";
    if (status === "Cancelled") return t("cancelled") || "Cancelled";
    return status;
  };

  return (
    <div className="partner-dashboard-page">
      <header className="partner-header">
        <Link to="/" className="partner-brand">
          <div className="partner-brand-icon">🌴</div>
          <div>
            <h2>TourismHub LK</h2>
            <span>{t("partnerPortal") || "Partner Portal"}</span>
          </div>
        </Link>

        <nav className="partner-top-nav">
          <LanguageCurrencySelector />

          <Link to="/help">{t("help")}</Link>

          <div className="partner-profile">
            <div className="profile-avatar">
              {partnerName.charAt(0).toUpperCase()}
            </div>
            <span>{partnerName}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            {t("logout")}
          </button>
        </nav>
      </header>

      <section className="partner-menu-wrap">
        <div className="partner-menu">
          <Link className="active" to="/partner-dashboard">
            {t("dashboard")}
          </Link>
          <Link to="/partner-bookings">{t("bookings") || "Bookings"}</Link>
          <Link to="/partner-calendar">{t("calendar") || "Calendar"}</Link>
          <Link to="/partner-rooms">{t("roomsPricing")}</Link>
          <Link to="/partner-promotions">
            {t("promotions") || "Promotions"}
          </Link>
          <Link to="/partner-management">
            {t("management") || "Management"}
          </Link>
          <Link to="/partner-reports">{t("reports") || "Reports"}</Link>
        </div>
      </section>

      <main className="partner-container">
        <section className="partner-welcome">
          <div>
            <span className="welcome-badge">
              {t("hotelPartnerDashboard") || "Hotel Partner Dashboard"}
            </span>

            <h1>
              {t("welcomeBack")}, {partnerName}!
            </h1>

            <p>
              {t("partnerWelcomeText") ||
                "Here’s what’s happening at your property. Manage bookings, rooms, check-ins, and availability from one place."}
            </p>
          </div>

          <div className="welcome-actions">
            <button onClick={() => navigate("/partner-rooms")}>
              + {t("addRoom") || "Add Room"}
            </button>

            <button onClick={() => navigate("/partner-management")}>
              {t("editHotel") || "Edit Hotel"}
            </button>
          </div>
        </section>

        <section className="stats-grid">
          {dashboardStats.map((stat, index) => (
            <div className={`stat-card ${stat.color}`} key={index}>
              <div className="stat-icon">{stat.icon}</div>

              <div>
                <p>{stat.title}</p>
                <h2>{stat.value}</h2>
                <span>{stat.subtitle}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="dashboard-layout">
          <div className="dashboard-main">
            <div className="bookings-card">
              <div className="card-header">
                <div>
                  <h2>{t("latestBookings")}</h2>
                  <p>
                    {t("latestBookingsDesc") ||
                      "View and manage your latest hotel reservations."}
                  </p>
                </div>

                <Link to="/partner-bookings">{t("viewAll") || "View all"}</Link>
              </div>

              <div className="booking-filters">
                <select>
                  <option>{t("showAllBookings") || "Show: All Bookings"}</option>
                  <option>{t("today") || "Today"}</option>
                  <option>{t("thisWeek") || "This Week"}</option>
                  <option>{t("thisMonth") || "This Month"}</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All Statuses</option>
                  <option>Confirmed</option>
                  <option>Pending</option>
                  <option>Cancelled</option>
                </select>

                <select>
                  <option>{t("allRooms") || "All Rooms"}</option>
                  <option>Standard Room</option>
                  <option>Deluxe Suite</option>
                  <option>Family Room</option>
                </select>

                <div className="search-booking">
                  <span>🔍</span>
                  <input
                    type="text"
                    placeholder={t("searchBookings") || "Search bookings..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="booking-table-wrap">
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th>{t("bookingId") || "Booking ID"}</th>
                      <th>{t("guest") || "Guest"}</th>
                      <th>{t("room") || "Room"}</th>
                      <th>{t("dates") || "Dates"}</th>
                      <th>{t("amount") || "Amount"}</th>
                      <th>{t("status") || "Status"}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>
                            <strong>{booking.id}</strong>
                          </td>
                          <td>{booking.guest}</td>
                          <td>
                            {booking.room}
                            <span>{booking.roomCount}</span>
                          </td>
                          <td>{booking.dates}</td>
                          <td>
                            <strong>{formatPrice(booking.amount)}</strong>
                          </td>
                          <td>
                            <span
                              className={`status-badge ${booking.status.toLowerCase()}`}
                            >
                              {getStatusText(booking.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="empty-table">
                          {t("noBookingsFound") || "No bookings found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="partner-banner">
              <div>
                <span>{t("growProperty") || "Grow your property"}</span>
                <h2>
                  {t("improveListingTitle") ||
                    "Improve your listing and attract more travelers"}
                </h2>
                <p>
                  {t("improveListingDesc") ||
                    "Add better photos, update room prices, and keep availability accurate to increase bookings."}
                </p>
              </div>

              <button onClick={() => navigate("/partner-management")}>
                {t("updateListing") || "Update Listing"}
              </button>
            </div>
          </div>

          <aside className="dashboard-sidebar">
            <div className="quick-card">
              <h3>{t("quickActions")}</h3>

              <button onClick={() => navigate("/partner-bookings")}>
                📋 {t("manageBookings")}
              </button>

              <button onClick={() => navigate("/partner-rooms")}>
                🛏️ {t("roomsPricing")}
              </button>

              <button onClick={() => navigate("/partner-calendar")}>
                📆 {t("availabilityCalendar") || "Availability Calendar"}
              </button>

              <button onClick={() => navigate("/partner-promotions")}>
                🎁 {t("createPromotion") || "Create Promotion"}
              </button>
            </div>

            <div className="property-card">
              <div className="property-image"></div>

              <div className="property-info">
                <span>{t("verifiedProperty") || "Verified Property"}</span>
                <h3>White Sands Resort</h3>
                <p>Kandy, Sri Lanka</p>

                <div className="property-rating">
                  <strong>4.8</strong>
                  <p>{t("excellentRating") || "Excellent rating"}</p>
                </div>
              </div>
            </div>

            <div className="support-box">
              <div className="support-avatar">👨‍💼</div>
              <h3>{t("needHelp") || "Need help?"}</h3>
              <p>
                {t("partnerSupportText") ||
                  "Our support team is here to assist you with bookings, rooms, and account settings."}
              </p>

              <div className="support-contact">
                <span>📞 +94 77 123 4567</span>
                <span>✉️ partner@tourismhub.lk</span>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <footer className="partner-footer">
        <p>{t("footerText") || "TourismHub LK Partner Portal 🇱🇰"}</p>
      </footer>
    </div>
  );
}

export default PartnerDashboard;