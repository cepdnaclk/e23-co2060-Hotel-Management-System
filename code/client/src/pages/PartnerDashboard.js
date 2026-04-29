import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./PartnerDashboard.css";

function PartnerDashboard() {
  const navigate = useNavigate();

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
      title: "New Bookings",
      value: "12",
      subtitle: "3 upcoming",
      icon: "📅",
      color: "blue",
    },
    {
      title: "Today Check-Ins",
      value: "14",
      subtitle: "5 remaining",
      icon: "✅",
      color: "green",
    },
    {
      title: "Today Check-Outs",
      value: "8",
      subtitle: "All checked out",
      icon: "🧳",
      color: "orange",
    },
    {
      title: "Availability Alert",
      value: "2",
      subtitle: "rooms need attention",
      icon: "⚠️",
      color: "yellow",
    },
    {
      title: "Average Rating",
      value: "4.8",
      subtitle: "Only 1 Deluxe Room left",
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
      amount: "LKR 48,900",
      status: "Confirmed",
    },
    {
      id: "BKG-15760",
      guest: "Sarah & Michael",
      room: "Standard Room",
      roomCount: "2 booked",
      dates: "Sun, May 5 - Tue, May 7",
      amount: "LKR 35,900",
      status: "Confirmed",
    },
    {
      id: "BKG-15743",
      guest: "Jessica L.",
      room: "Deluxe Suite",
      roomCount: "2 booked",
      dates: "Mon, May 6 - Wed, May 8",
      amount: "LKR 52,400",
      status: "Pending",
    },
    {
      id: "BKG-15741",
      guest: "Tom & Jane W.",
      room: "Family Room",
      roomCount: "1 booked",
      dates: "Mon, May 6 - Fri, May 10",
      amount: "LKR 76,500",
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

  return (
    <div className="partner-dashboard-page">
      {/* Header */}
      <header className="partner-header">
        <Link to="/" className="partner-brand">
          <div className="partner-brand-icon">🌴</div>
          <div>
            <h2>TourismHub LK</h2>
            <span>Partner Portal</span>
          </div>
        </Link>

        <nav className="partner-top-nav">
          <button>🇱🇰 EN / LKR</button>
          <Link to="/help">Help</Link>

          <div className="partner-profile">
            <div className="profile-avatar">
              {partnerName.charAt(0).toUpperCase()}
            </div>
            <span>{partnerName}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      {/* Dashboard Navigation */}
      <section className="partner-menu-wrap">
        <div className="partner-menu">
          <Link className="active" to="/partner-dashboard">
            Dashboard
          </Link>
          <Link to="/partner-bookings">Bookings</Link>
          <Link to="/partner-calendar">Calendar</Link>
          <Link to="/partner-rooms">Rooms & Rates</Link>
          <Link to="/partner-promotions">Promotions</Link>
          <Link to="/partner-management">Management</Link>
          <Link to="/partner-reports">Reports</Link>
        </div>
      </section>

      <main className="partner-container">
        {/* Welcome */}
        <section className="partner-welcome">
          <div>
            <span className="welcome-badge">Hotel Partner Dashboard</span>
            <h1>Welcome back, {partnerName}!</h1>
            <p>
              Here’s what’s happening at your property. Manage bookings, rooms,
              check-ins, and availability from one place.
            </p>
          </div>

          <div className="welcome-actions">
            <button onClick={() => navigate("/partner-rooms")}>
              + Add Room
            </button>
            <button onClick={() => navigate("/partner-management")}>
              Edit Hotel
            </button>
          </div>
        </section>

        {/* Stats */}
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

        {/* Content Layout */}
        <section className="dashboard-layout">
          <div className="dashboard-main">
            {/* Latest Bookings */}
            <div className="bookings-card">
              <div className="card-header">
                <div>
                  <h2>Latest Bookings</h2>
                  <p>View and manage your latest hotel reservations.</p>
                </div>

                <Link to="/partner-bookings">View all</Link>
              </div>

              <div className="booking-filters">
                <select>
                  <option>Show: All Bookings</option>
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
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
                  <option>All Rooms</option>
                  <option>Standard Room</option>
                  <option>Deluxe Suite</option>
                  <option>Family Room</option>
                </select>

                <div className="search-booking">
                  <span>🔍</span>
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="booking-table-wrap">
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Dates</th>
                      <th>Amount</th>
                      <th>Status</th>
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
                            <strong>{booking.amount}</strong>
                          </td>
                          <td>
                            <span
                              className={`status-badge ${booking.status.toLowerCase()}`}
                            >
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="empty-table">
                          No bookings found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Banner */}
            <div className="partner-banner">
              <div>
                <span>Grow your property</span>
                <h2>Improve your listing and attract more travelers</h2>
                <p>
                  Add better photos, update room prices, and keep availability
                  accurate to increase bookings.
                </p>
              </div>

              <button onClick={() => navigate("/partner-management")}>
                Update Listing
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="dashboard-sidebar">
            <div className="quick-card">
              <h3>Quick Actions</h3>

              <button onClick={() => navigate("/partner-bookings")}>
                📋 Manage Bookings
              </button>
              <button onClick={() => navigate("/partner-rooms")}>
                🛏️ Rooms & Pricing
              </button>
              <button onClick={() => navigate("/partner-calendar")}>
                📆 Availability Calendar
              </button>
              <button onClick={() => navigate("/partner-promotions")}>
                🎁 Create Promotion
              </button>
            </div>

            <div className="property-card">
              <div className="property-image"></div>

              <div className="property-info">
                <span>Verified Property</span>
                <h3>White Sands Resort</h3>
                <p>Kandy, Sri Lanka</p>

                <div className="property-rating">
                  <strong>4.8</strong>
                  <p>Excellent rating</p>
                </div>
              </div>
            </div>

            <div className="support-box">
              <div className="support-avatar">👨‍💼</div>
              <h3>Need help?</h3>
              <p>
                Our support team is here to assist you with bookings, rooms, and
                account settings.
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
        <p>Here’s most events to GL 🇱🇰</p>
      </footer>
    </div>
  );
}

export default PartnerDashboard;