import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../api/api";

const todayValue = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const addDays = (dateString, days) => {
  const date = new Date(`${dateString || todayValue()}T00:00:00`);
  date.setDate(date.getDate() + days);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const makeBookingForm = (roomId = "") => {
  const today = todayValue();
  return {
    room_id: roomId ? String(roomId) : "",
    full_name: "",
    email: "",
    nationality: "Sri Lankan",
    country_code: "+94",
    phone: "",
    check_in: today,
    check_out: addDays(today, 1),
    check_in_package: "night",
    check_out_package: "day",
    adults: "1",
    children: "0",
    notes: "",
  };
};

const getStoredProperty = () => {
  try {
    const stored = localStorage.getItem("tourismhub_reception_property");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const formatMoney = (amount) => `Rs. ${Number(amount || 0).toLocaleString("en-LK")}`;

const dateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  const key = dateKey(value);
  if (!key) return "—";
  return new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 5);
};

const getDateDifference = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
};

const packageToUnits = (packageType) => {
  if (packageType === "day") return { dayUnits: 1, nightUnits: 0 };
  if (packageType === "night") return { dayUnits: 0, nightUnits: 1 };
  return { dayUnits: 1, nightUnits: 1 };
};

const calculatePreview = (room, form) => {
  if (!room) return { dayUnits: 0, nightUnits: 0, guests: 0, extraGuests: 0, total: 0 };

  const dateDifference = getDateDifference(form.check_in, form.check_out);
  const first = dateDifference === 0
    ? packageToUnits(form.check_in_package || "day")
    : packageToUnits(form.check_in_package || "night");
  const last = dateDifference === 0
    ? { dayUnits: 0, nightUnits: 0 }
    : packageToUnits(form.check_out_package || "day");
  const middleDays = Math.max(0, dateDifference - 1);
  const dayUnits = first.dayUnits + last.dayUnits + middleDays;
  const nightUnits = first.nightUnits + last.nightUnits + middleDays;
  const guests = Number(form.adults || 0) + Number(form.children || 0);
  const extraGuests = Math.max(0, guests - Number(room.base_occupancy || 1));
  const extra = extraGuests * Number(room.extra_person_price || 0);
  const total =
    (Number(room.price_per_night || 0) + extra) * nightUnits +
    (Number(room.price_per_day || room.price_per_night || 0) + extra) * dayUnits;

  return { dayUnits, nightUnits, guests, extraGuests, total };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateBookingForm = (form, room) => {
  const errors = {};
  const guests = Number(form.adults || 0) + Number(form.children || 0);

  if (!form.room_id) errors.room_id = "Select a room type.";
  if (!form.full_name.trim()) errors.full_name = "Guest name is required.";
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email.";
  if (!form.nationality.trim()) errors.nationality = "Nationality is required.";
  if (!form.phone.trim()) errors.phone = "Phone number is required.";
  if (!form.check_in) errors.check_in = "Check-in date is required.";
  if (!form.check_out) errors.check_out = "Check-out date is required.";
  if (form.check_in && form.check_out && form.check_out < form.check_in) {
    errors.check_out = "Check-out cannot be before check-in.";
  }
  if (Number(form.adults) < 1) errors.adults = "At least one adult is required.";
  if (Number(form.children) < 0) errors.children = "Children cannot be negative.";
  if (room && guests > Number(room.capacity || 0)) {
    errors.adults = `Maximum capacity is ${room.capacity} guest(s).`;
  }
  if (room && Number(room.available_rooms || 0) <= 0) errors.room_id = "This room type has no availability.";

  return errors;
};

const bookingStatusClass = (status) =>
  String(status || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function ReceptionDashboardPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("tourismhub_reception_token");
  const [property, setProperty] = useState(getStoredProperty);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [section, setSection] = useState("overview");
  const [bookingForm, setBookingForm] = useState(makeBookingForm);
  const [bookingSearch, setBookingSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [guestSearch, setGuestSearch] = useState("");
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingAvailability, setEditingAvailability] = useState("");

  const clearSession = () => {
    localStorage.removeItem("tourismhub_reception_token");
    localStorage.removeItem("tourismhub_reception_user");
    localStorage.removeItem("tourismhub_reception_property");
  };

  const refreshDesk = async ({ quiet = false } = {}) => {
    if (!token) return;
    try {
      if (!quiet) setLoading(true);
      setError("");
      const [propertyResponse, bookingResponse] = await Promise.all([
        api.get("/reception/property"),
        api.get("/reception/bookings"),
      ]);
      const nextProperty = propertyResponse.data.data;
      setProperty(nextProperty);
      setBookings(bookingResponse.data.data || []);
      localStorage.setItem("tourismhub_reception_property", JSON.stringify(nextProperty));
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the reception dashboard.");
      if (err.response?.status === 401 || err.response?.status === 403) {
        clearSession();
        navigate("/login", { replace: true });
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) refreshDesk();
    // The reception token is fixed for this mounted desk session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const rooms = useMemo(() => property?.rooms || [], [property]);
  const selectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(bookingForm.room_id)) || null,
    [rooms, bookingForm.room_id]
  );
  const preview = useMemo(() => calculatePreview(selectedRoom, bookingForm), [selectedRoom, bookingForm]);
  const bookingErrors = useMemo(
    () => validateBookingForm(bookingForm, selectedRoom),
    [bookingForm, selectedRoom]
  );

  const stats = useMemo(() => {
    const today = todayValue();
    const totalRooms = rooms.reduce((sum, room) => sum + Number(room.total_rooms || 0), 0);
    const availableRooms = rooms.reduce((sum, room) => sum + Number(room.available_rooms || 0), 0);
    const arrivals = bookings.filter(
      (booking) => dateKey(booking.check_in) === today && !["Rejected", "Cancelled"].includes(booking.booking_status)
    ).length;
    const departures = bookings.filter(
      (booking) => dateKey(booking.check_out) === today && !["Rejected", "Cancelled"].includes(booking.booking_status)
    ).length;
    const pending = bookings.filter((booking) => booking.booking_status === "Pending Partner Approval").length;
    const inHouse = bookings.filter((booking) => booking.booking_status === "Checked In").length;
    return { totalRooms, availableRooms, occupiedRooms: Math.max(totalRooms - availableRooms, 0), arrivals, departures, pending, inHouse };
  }, [rooms, bookings]);

  const filteredBookings = useMemo(() => {
    const search = bookingSearch.trim().toLowerCase();
    return bookings.filter((booking) => {
      const statusMatches = statusFilter === "all" || booking.booking_status === statusFilter;
      const searchMatches = !search || [
        booking.booking_reference,
        booking.full_name,
        booking.email,
        booking.phone,
        booking.room_type,
      ].some((value) => String(value || "").toLowerCase().includes(search));
      return statusMatches && searchMatches;
    });
  }, [bookings, bookingSearch, statusFilter]);

  const guests = useMemo(() => {
    const map = new Map();
    for (const booking of bookings) {
      const key = String(booking.email || booking.phone || booking.full_name || booking.id).toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          full_name: booking.full_name,
          email: booking.email,
          phone: `${booking.country_code || ""} ${booking.phone || ""}`.trim(),
          nationality: booking.nationality,
          bookingCount: 1,
          latestStay: booking.check_in,
          latestStatus: booking.booking_status,
        });
      } else {
        existing.bookingCount += 1;
        if (dateKey(booking.check_in) > dateKey(existing.latestStay)) {
          existing.latestStay = booking.check_in;
          existing.latestStatus = booking.booking_status;
        }
      }
    }
    const search = guestSearch.trim().toLowerCase();
    return Array.from(map.values()).filter((guest) =>
      !search || [guest.full_name, guest.email, guest.phone, guest.nationality]
        .some((value) => String(value || "").toLowerCase().includes(search))
    );
  }, [bookings, guestSearch]);

  if (!token) return <Navigate to="/login" replace />;

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const openNewBooking = (roomId = "") => {
    setBookingForm(makeBookingForm(roomId));
    setError("");
    setSection("new-booking");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookingChange = (event) => {
    const { name, value } = event.target;
    setBookingForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "check_in" && next.check_out < value) next.check_out = value;
      return next;
    });
  };

  const submitBooking = async (paymentMethod) => {
    if (Object.keys(bookingErrors).length > 0) {
      setError("Please correct the highlighted booking details.");
      return;
    }

    try {
      setWorking(true);
      setError("");
      const response = await api.post("/reception/bookings", {
        ...bookingForm,
        room_id: Number(bookingForm.room_id),
        adults: Number(bookingForm.adults || 0),
        children: Number(bookingForm.children || 0),
        guests: preview.guests,
        payment_method: paymentMethod,
      });
      await refreshDesk({ quiet: true });
      setBookingForm(makeBookingForm());
      setSection("bookings");
      showNotice(response.data.message || "Reception booking created.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create this booking.");
    } finally {
      setWorking(false);
    }
  };

  const saveAvailability = async (room) => {
    const value = Number(editingAvailability);
    if (!Number.isInteger(value) || value < 0 || value > Number(room.total_rooms || 0)) {
      setError(`Availability must be between 0 and ${room.total_rooms}.`);
      return;
    }

    try {
      setWorking(true);
      setError("");
      const response = await api.patch(`/reception/rooms/${room.id}/availability`, { available_rooms: value });
      setProperty(response.data.data);
      localStorage.setItem("tourismhub_reception_property", JSON.stringify(response.data.data));
      setEditingRoomId(null);
      setEditingAvailability("");
      showNotice(`${room.room_type} availability updated.`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update room availability.");
    } finally {
      setWorking(false);
    }
  };

  const runBookingAction = async (booking, action) => {
    let note = "";
    if (action === "reject" || action === "cancel") {
      const promptLabel = action === "reject" ? "Reason for rejection (optional):" : "Cancellation note (optional):";
      const promptedNote = window.prompt(promptLabel, "");
      if (promptedNote === null) return;
      note = promptedNote;
    }

    try {
      setWorking(true);
      setError("");
      const response = await api.patch(`/reception/bookings/${booking.id}/status`, { action, note });
      await refreshDesk({ quiet: true });
      showNotice(response.data.message || "Booking status updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update booking status.");
    } finally {
      setWorking(false);
    }
  };

  const togglePayment = async (booking) => {
    const nextStatus = booking.payment_status === "Paid" ? "Pending Payment" : "Paid";
    try {
      setWorking(true);
      setError("");
      const response = await api.patch(`/reception/bookings/${booking.id}/payment`, {
        payment_status: nextStatus,
      });
      await refreshDesk({ quiet: true });
      showNotice(response.data.message || "Payment status updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update payment status.");
    } finally {
      setWorking(false);
    }
  };

  const renderActions = (booking) => {
    const status = booking.booking_status;
    return (
      <div className="booking-actions">
        {status === "Pending Partner Approval" ? (
          <>
            <button type="button" className="action-positive" disabled={working} onClick={() => runBookingAction(booking, "approve")}>Approve</button>
            <button type="button" className="action-negative" disabled={working} onClick={() => runBookingAction(booking, "reject")}>Reject</button>
          </>
        ) : null}
        {status === "Approved" ? (
          <button type="button" className="action-positive" disabled={working} onClick={() => runBookingAction(booking, "check_in")}>Check in</button>
        ) : null}
        {status === "Checked In" ? (
          <button type="button" className="action-primary" disabled={working} onClick={() => runBookingAction(booking, "check_out")}>Check out</button>
        ) : null}
        {["Pending Partner Approval", "Approved"].includes(status) ? (
          <button type="button" className="action-muted" disabled={working} onClick={() => runBookingAction(booking, "cancel")}>Cancel</button>
        ) : null}
        {!["Rejected", "Cancelled"].includes(status) ? (
          <button type="button" className="action-payment" disabled={working} onClick={() => togglePayment(booking)}>
            {booking.payment_status === "Paid" ? "Mark unpaid" : "Mark paid"}
          </button>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="reception-loading-page">
        <style>{styles}</style>
        <div className="loading-card"><span className="loading-spinner" />Loading reception dashboard…</div>
      </main>
    );
  }

  return (
    <main className="reception-app">
      <style>{styles}</style>

      <aside className="reception-sidebar">
        <Link to="/dashboard" className="reception-brand">TourismHub <b>LK</b></Link>
        <div className="property-mini">
          <div className="property-avatar">
            {property?.logo_url ? <img src={property.logo_url} alt="" /> : String(property?.name || "H").slice(0, 1)}
          </div>
          <div><strong>{property?.name || "Hotel Reception"}</strong><span>{property?.city || "Sri Lanka"}</span></div>
        </div>

        <nav className="reception-nav">
          <button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}>01 <span>Dashboard</span></button>
          <button className={section === "rooms" ? "active" : ""} onClick={() => setSection("rooms")}>02 <span>Rooms</span></button>
          <button className={section === "new-booking" ? "active" : ""} onClick={() => openNewBooking()}>03 <span>New booking</span></button>
          <button className={section === "bookings" ? "active" : ""} onClick={() => setSection("bookings")}>04 <span>Bookings</span>{stats.pending > 0 ? <i>{stats.pending}</i> : null}</button>
          <button className={section === "guests" ? "active" : ""} onClick={() => setSection("guests")}>05 <span>Guests</span></button>
        </nav>

        <div className="sidebar-footer">
          <button type="button" onClick={() => refreshDesk()}>Refresh data</button>
          <button type="button" className="logout-button" onClick={handleLogout}>Log out</button>
        </div>
      </aside>

      <section className="reception-workspace">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">Reception portal</span>
            <h1>{section === "overview" ? "Front desk overview" : section === "rooms" ? "Room inventory" : section === "new-booking" ? "Register guest & book" : section === "bookings" ? "Booking management" : "Guest directory"}</h1>
          </div>
          <div className="header-actions">
            <span className="date-pill">{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>
            <button type="button" className="primary-button" onClick={() => openNewBooking()}>+ New booking</button>
          </div>
        </header>

        {error ? <div className="alert error-alert">{error}<button onClick={() => setError("")}>×</button></div> : null}
        {notice ? <div className="alert success-alert">{notice}</div> : null}

        {section === "overview" ? (
          <>
            <section className="summary-grid">
              <article><span>Available rooms</span><strong>{stats.availableRooms}</strong><small>of {stats.totalRooms} total</small></article>
              <article><span>Arrivals today</span><strong>{stats.arrivals}</strong><small>{stats.inHouse} currently checked in</small></article>
              <article><span>Departures today</span><strong>{stats.departures}</strong><small>{stats.occupiedRooms} occupied / held</small></article>
              <article className={stats.pending ? "attention" : ""}><span>Pending approvals</span><strong>{stats.pending}</strong><small>online booking requests</small></article>
            </section>

            <section className="overview-grid">
              <article className="panel property-panel">
                <div className="property-cover">
                  {property?.main_image ? <img src={property.main_image} alt={property.name} /> : null}
                  <div className="cover-overlay"><span>{property?.property_type || "Property"}</span><h2>{property?.name}</h2></div>
                </div>
                <div className="property-details">
                  <div><span>Location</span><strong>{[property?.city, property?.district].filter(Boolean).join(", ") || "—"}</strong></div>
                  <div><span>Check-in</span><strong>{formatTime(property?.check_in_time)}</strong></div>
                  <div><span>Check-out</span><strong>{formatTime(property?.check_out_time)}</strong></div>
                  <div><span>Property status</span><strong>{property?.is_verified ? "Verified" : property?.status || "—"}</strong></div>
                </div>
              </article>

              <article className="panel quick-panel">
                <div className="panel-title"><div><span>Quick actions</span><h2>Front desk tools</h2></div></div>
                <div className="quick-actions">
                  <button type="button" onClick={() => openNewBooking()}><b>+</b><span><strong>Register walk-in guest</strong><small>Create a paid hotel booking</small></span></button>
                  <button type="button" onClick={() => setSection("bookings")}><b>✓</b><span><strong>Process bookings</strong><small>Approve and check guests in/out</small></span></button>
                  <button type="button" onClick={() => setSection("rooms")}><b>#</b><span><strong>Update availability</strong><small>Correct live room counts</small></span></button>
                  <button type="button" onClick={() => setSection("guests")}><b>◎</b><span><strong>Guest directory</strong><small>Find previous and current guests</small></span></button>
                </div>
              </article>
            </section>

            <section className="panel recent-panel">
              <div className="panel-title">
                <div><span>Latest activity</span><h2>Recent bookings</h2></div>
                <button type="button" className="text-button" onClick={() => setSection("bookings")}>View all</button>
              </div>
              <div className="compact-bookings">
                {bookings.slice(0, 6).map((booking) => (
                  <div className="compact-row" key={booking.id}>
                    <div><strong>{booking.full_name || "Guest"}</strong><span>{booking.booking_reference}</span></div>
                    <div><strong>{booking.room_type}</strong><span>{formatDate(booking.check_in)} → {formatDate(booking.check_out)}</span></div>
                    <span className={`status-badge ${bookingStatusClass(booking.booking_status)}`}>{booking.booking_status}</span>
                    <strong className="money-cell">{formatMoney(booking.total_amount)}</strong>
                  </div>
                ))}
                {bookings.length === 0 ? <div className="empty-state">No bookings have been recorded for this property yet.</div> : null}
              </div>
            </section>
          </>
        ) : null}

        {section === "rooms" ? (
          <section className="room-grid">
            {rooms.map((room) => {
              const occupied = Math.max(Number(room.total_rooms || 0) - Number(room.available_rooms || 0), 0);
              return (
                <article className="room-card" key={room.id}>
                  <div className="room-image">
                    {room.main_image ? <img src={room.main_image} alt={room.room_type} /> : <span>No room image</span>}
                    <span className={`availability-tag ${room.available_rooms > 0 ? "available" : "full"}`}>{room.available_rooms > 0 ? `${room.available_rooms} available` : "Full"}</span>
                  </div>
                  <div className="room-content">
                    <div className="room-heading"><div><span>Room type</span><h2>{room.room_type}</h2></div><strong>{formatMoney(room.price_per_night)}<small>/ night</small></strong></div>
                    <div className="room-facts"><span>Capacity <b>{room.capacity}</b></span><span>Total <b>{room.total_rooms}</b></span><span>Occupied <b>{occupied}</b></span><span>Day rate <b>{formatMoney(room.price_per_day || room.price_per_night)}</b></span></div>
                    <div className="room-actions">
                      <button type="button" className="primary-button" disabled={Number(room.available_rooms) <= 0} onClick={() => openNewBooking(room.id)}>Book this room</button>
                      {editingRoomId === room.id ? (
                        <div className="availability-editor">
                          <input type="number" min="0" max={room.total_rooms} value={editingAvailability} onChange={(event) => setEditingAvailability(event.target.value)} />
                          <button type="button" disabled={working} onClick={() => saveAvailability(room)}>Save</button>
                          <button type="button" onClick={() => setEditingRoomId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button type="button" className="secondary-button" onClick={() => { setEditingRoomId(room.id); setEditingAvailability(String(room.available_rooms)); }}>Edit availability</button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
            {rooms.length === 0 ? <div className="empty-state large">No room types are registered for this property. Ask the hotel partner to add rooms first.</div> : null}
          </section>
        ) : null}

        {section === "new-booking" ? (
          <section className="booking-layout">
            <article className="panel booking-form-card">
              <div className="panel-title"><div><span>Guest registration</span><h2>Walk-in booking details</h2><p>Register the guest and reserve one available room from this property.</p></div></div>
              <div className="form-grid">
                <label className="full-field">Room type<select name="room_id" value={bookingForm.room_id} onChange={handleBookingChange} className={bookingErrors.room_id ? "invalid" : ""}><option value="">Select room type</option>{rooms.map((room) => <option key={room.id} value={room.id} disabled={Number(room.available_rooms) <= 0}>{room.room_type} — {room.available_rooms} available</option>)}</select>{bookingErrors.room_id ? <small className="field-error">{bookingErrors.room_id}</small> : null}</label>
                <label>Guest full name<input name="full_name" value={bookingForm.full_name} onChange={handleBookingChange} className={bookingErrors.full_name ? "invalid" : ""} placeholder="Full name" />{bookingErrors.full_name ? <small className="field-error">{bookingErrors.full_name}</small> : null}</label>
                <label>Email <small className="optional">optional</small><input name="email" type="email" value={bookingForm.email} onChange={handleBookingChange} className={bookingErrors.email ? "invalid" : ""} placeholder="guest@example.com" />{bookingErrors.email ? <small className="field-error">{bookingErrors.email}</small> : null}</label>
                <label>Nationality<input name="nationality" value={bookingForm.nationality} onChange={handleBookingChange} className={bookingErrors.nationality ? "invalid" : ""} />{bookingErrors.nationality ? <small className="field-error">{bookingErrors.nationality}</small> : null}</label>
                <label>Phone number<div className="phone-control"><input name="country_code" value={bookingForm.country_code} onChange={handleBookingChange} /><input name="phone" value={bookingForm.phone} onChange={handleBookingChange} className={bookingErrors.phone ? "invalid" : ""} placeholder="77 123 4567" /></div>{bookingErrors.phone ? <small className="field-error">{bookingErrors.phone}</small> : null}</label>
                <label>Check-in date<input name="check_in" type="date" value={bookingForm.check_in} onChange={handleBookingChange} className={bookingErrors.check_in ? "invalid" : ""} />{bookingErrors.check_in ? <small className="field-error">{bookingErrors.check_in}</small> : null}</label>
                <label>Check-out date<input name="check_out" type="date" value={bookingForm.check_out} onChange={handleBookingChange} className={bookingErrors.check_out ? "invalid" : ""} />{bookingErrors.check_out ? <small className="field-error">{bookingErrors.check_out}</small> : null}</label>
                <label>Check-in package<select name="check_in_package" value={bookingForm.check_in_package} onChange={handleBookingChange}><option value="day">Day</option><option value="night">Night</option><option value="both">Day + Night</option></select></label>
                <label>Check-out package<select name="check_out_package" value={bookingForm.check_out_package} onChange={handleBookingChange}><option value="day">Day</option><option value="night">Night</option><option value="both">Day + Night</option></select></label>
                <label>Adults<input name="adults" type="number" min="1" value={bookingForm.adults} onChange={handleBookingChange} className={bookingErrors.adults ? "invalid" : ""} />{bookingErrors.adults ? <small className="field-error">{bookingErrors.adults}</small> : null}</label>
                <label>Children<input name="children" type="number" min="0" value={bookingForm.children} onChange={handleBookingChange} className={bookingErrors.children ? "invalid" : ""} />{bookingErrors.children ? <small className="field-error">{bookingErrors.children}</small> : null}</label>
                <label className="full-field">Guest / stay notes<textarea name="notes" value={bookingForm.notes} onChange={handleBookingChange} rows="3" placeholder="Requests, arrival information, accessibility needs, etc." /></label>
              </div>
            </article>

            <aside className="panel booking-summary">
              <span className="eyebrow">Booking summary</span>
              <h2>{selectedRoom?.room_type || "Select a room"}</h2>
              <p>{property?.name}</p>
              {selectedRoom?.main_image ? <img className="summary-image" src={selectedRoom.main_image} alt={selectedRoom.room_type} /> : null}
              <div className="summary-list">
                <div><span>Guests</span><strong>{preview.guests || 0}</strong></div>
                <div><span>Day units</span><strong>{preview.dayUnits}</strong></div>
                <div><span>Night units</span><strong>{preview.nightUnits}</strong></div>
                <div><span>Available rooms</span><strong>{selectedRoom?.available_rooms ?? "—"}</strong></div>
              </div>
              <div className="summary-total"><span>Total</span><strong>{formatMoney(preview.total)}</strong></div>
              <p className="payment-note">Reception bookings are recorded as paid and approved immediately. Choose the payment method used at the desk.</p>
              <div className="payment-buttons">
                <button type="button" disabled={working || Object.keys(bookingErrors).length > 0} onClick={() => submitBooking("cash")}>Cash payment</button>
                <button type="button" disabled={working || Object.keys(bookingErrors).length > 0} onClick={() => submitBooking("card")}>Card payment</button>
              </div>
            </aside>
          </section>
        ) : null}

        {section === "bookings" ? (
          <section className="panel bookings-panel">
            <div className="panel-title bookings-title">
              <div><span>Property bookings</span><h2>Manage reservations</h2><p>Online requests and reception-created reservations for this hotel only.</p></div>
              <div className="booking-filters"><input value={bookingSearch} onChange={(event) => setBookingSearch(event.target.value)} placeholder="Search guest, phone, reference…" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="Pending Partner Approval">Pending approval</option><option value="Approved">Approved</option><option value="Checked In">Checked in</option><option value="Checked Out">Checked out</option><option value="Rejected">Rejected</option><option value="Cancelled">Cancelled</option></select></div>
            </div>

            <div className="booking-table-wrap">
              <table className="booking-table">
                <thead><tr><th>Guest</th><th>Stay</th><th>Room</th><th>Source</th><th>Status</th><th>Payment</th><th>Total</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td><strong>{booking.full_name || "Guest"}</strong><small>{booking.booking_reference}</small><small>{booking.country_code || ""} {booking.phone || ""}</small></td>
                      <td><strong>{formatDate(booking.check_in)}</strong><small>to {formatDate(booking.check_out)}</small><small>{booking.guests} guest(s)</small></td>
                      <td><strong>{booking.room_type}</strong><small>{booking.day_units} day / {booking.night_units} night unit(s)</small></td>
                      <td><span className={`source-badge ${booking.booking_source === "Reception" ? "reception" : "online"}`}>{booking.booking_source}</span></td>
                      <td><span className={`status-badge ${bookingStatusClass(booking.booking_status)}`}>{booking.booking_status}</span>{booking.partner_note ? <small className="note-text">{booking.partner_note}</small> : null}</td>
                      <td><span className={`payment-badge ${booking.payment_status === "Paid" ? "paid" : "pending"}`}>{booking.payment_status}</span></td>
                      <td><strong>{formatMoney(booking.total_amount)}</strong></td>
                      <td>{renderActions(booking)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBookings.length === 0 ? <div className="empty-state">No bookings match the current filters.</div> : null}
            </div>
          </section>
        ) : null}

        {section === "guests" ? (
          <section className="panel guests-panel">
            <div className="panel-title bookings-title">
              <div><span>Guest records</span><h2>Reception guest directory</h2><p>Guest details are collected from this property’s bookings and walk-in registrations.</p></div>
              <div className="booking-filters"><input value={guestSearch} onChange={(event) => setGuestSearch(event.target.value)} placeholder="Search guest, phone, email…" /><button type="button" className="primary-button" onClick={() => openNewBooking()}>Register new guest</button></div>
            </div>
            <div className="guest-grid">
              {guests.map((guest) => (
                <article className="guest-card" key={guest.key}>
                  <div className="guest-avatar">{String(guest.full_name || "G").slice(0, 1).toUpperCase()}</div>
                  <div className="guest-main"><h3>{guest.full_name || "Guest"}</h3><span>{guest.nationality || "Nationality not recorded"}</span><p>{guest.email || "No email"}<br />{guest.phone || "No phone"}</p></div>
                  <div className="guest-meta"><span>Bookings <b>{guest.bookingCount}</b></span><span>Latest stay <b>{formatDate(guest.latestStay)}</b></span><span className={`status-badge ${bookingStatusClass(guest.latestStatus)}`}>{guest.latestStatus}</span></div>
                </article>
              ))}
              {guests.length === 0 ? <div className="empty-state large">No guest records match this search.</div> : null}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

const styles = `
*{box-sizing:border-box}.reception-app{min-height:100vh;background:#f4f7f6;color:#18302c;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.reception-app button,.reception-app input,.reception-app select,.reception-app textarea{font:inherit}.reception-sidebar{position:fixed;inset:0 auto 0 0;width:258px;background:#073e38;color:#fff;padding:28px 20px;display:flex;flex-direction:column;z-index:30;box-shadow:10px 0 34px rgba(7,62,56,.08)}.reception-brand{color:#fff;text-decoration:none;font-weight:1000;font-size:25px;letter-spacing:-.045em;padding:0 10px}.reception-brand b{color:#ffd45c}.property-mini{display:grid;grid-template-columns:46px 1fr;gap:11px;align-items:center;margin:28px 0 24px;padding:14px 10px;border-top:1px solid rgba(255,255,255,.12);border-bottom:1px solid rgba(255,255,255,.12)}.property-avatar{width:46px;height:46px;border-radius:14px;background:#fff3c4;color:#073e38;display:grid;place-items:center;font-weight:1000;font-size:20px;overflow:hidden}.property-avatar img{width:100%;height:100%;object-fit:cover}.property-mini strong,.property-mini span{display:block}.property-mini strong{font-size:13px;line-height:1.25}.property-mini span{font-size:12px;color:#b9d8d1;margin-top:3px}.reception-nav{display:grid;gap:6px}.reception-nav button{width:100%;border:0;background:transparent;color:#b9d8d1;border-radius:14px;padding:13px 14px;display:grid;grid-template-columns:28px 1fr auto;align-items:center;text-align:left;gap:8px;font-size:12px;font-weight:900;cursor:pointer}.reception-nav button span{font-size:14px}.reception-nav button.active{background:#fff;color:#073e38;box-shadow:0 12px 30px rgba(0,0,0,.13)}.reception-nav button i{font-style:normal;min-width:24px;height:24px;padding:0 7px;border-radius:999px;background:#ffd45c;color:#073e38;display:grid;place-items:center}.sidebar-footer{margin-top:auto;display:grid;gap:8px}.sidebar-footer button{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;border-radius:13px;padding:11px 13px;text-align:left;font-weight:850;cursor:pointer}.sidebar-footer .logout-button{background:#7f1d1d;border-color:#9f2c2c}.reception-workspace{margin-left:258px;min-height:100vh;padding:28px 34px 60px}.workspace-header{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}.workspace-header h1{margin:5px 0 0;font-size:38px;line-height:1;letter-spacing:-.045em;color:#143b35}.eyebrow,.panel-title>div>span{font-size:11px;font-weight:1000;text-transform:uppercase;letter-spacing:.13em;color:#0b7a69}.header-actions{display:flex;gap:10px;align-items:center}.date-pill{background:#fff;border:1px solid #dbe7e3;border-radius:999px;padding:11px 15px;color:#60716d;font-weight:800;font-size:13px}.primary-button{border:0;background:#087c6b;color:#fff;border-radius:13px;padding:12px 17px;font-weight:950;cursor:pointer;box-shadow:0 10px 24px rgba(8,124,107,.18)}.primary-button:disabled{opacity:.5;cursor:not-allowed}.secondary-button{border:1px solid #cadbd6;background:#fff;color:#0b6256;border-radius:13px;padding:11px 15px;font-weight:900;cursor:pointer}.alert{border-radius:14px;padding:13px 15px;margin:0 0 18px;font-weight:850;display:flex;align-items:center;justify-content:space-between}.alert button{border:0;background:transparent;font-size:20px;cursor:pointer}.error-alert{background:#fee2e2;color:#991b1b}.success-alert{background:#dcfce7;color:#166534}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}.summary-grid article{background:#fff;border:1px solid #dbe7e3;border-radius:20px;padding:20px;min-height:142px;box-shadow:0 10px 26px rgba(17,72,63,.055)}.summary-grid article.attention{border-color:#f6cd57;background:#fffdf5}.summary-grid span,.summary-grid small{display:block}.summary-grid span{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#71817d;font-weight:950}.summary-grid strong{display:block;font-size:45px;line-height:1;color:#073e38;margin:16px 0 8px}.summary-grid small{color:#83918e;font-weight:700}.overview-grid{display:grid;grid-template-columns:1.3fr .7fr;gap:18px;margin-bottom:18px}.panel{background:#fff;border:1px solid #dbe7e3;border-radius:22px;box-shadow:0 12px 32px rgba(17,72,63,.055)}.property-panel{overflow:hidden}.property-cover{height:245px;background:linear-gradient(135deg,#174a43,#0b7a69);position:relative;overflow:hidden}.property-cover img{width:100%;height:100%;object-fit:cover}.property-cover:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(5,48,43,.82),rgba(5,48,43,.04))}.cover-overlay{position:absolute;left:24px;bottom:22px;z-index:2;color:#fff}.cover-overlay span{font-weight:950;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#ffe59a}.cover-overlay h2{margin:6px 0 0;font-size:30px;letter-spacing:-.035em}.property-details{display:grid;grid-template-columns:2fr 1fr 1fr 1fr}.property-details div{padding:17px 20px;border-right:1px solid #e7efec}.property-details div:last-child{border-right:0}.property-details span,.property-details strong{display:block}.property-details span{font-size:10px;color:#82918d;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.property-details strong{margin-top:6px;font-size:13px}.quick-panel{padding:22px}.panel-title{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:17px}.panel-title h2{margin:5px 0 0;font-size:26px;letter-spacing:-.035em;color:#143b35}.panel-title p{margin:6px 0 0;color:#7c8a87;font-size:13px;line-height:1.5}.quick-actions{display:grid;gap:10px}.quick-actions button{border:1px solid #e0ebe7;background:#f9fbfa;border-radius:15px;padding:13px;display:grid;grid-template-columns:38px 1fr;gap:11px;text-align:left;cursor:pointer}.quick-actions button>b{width:38px;height:38px;border-radius:11px;background:#e4f6f1;color:#087c6b;display:grid;place-items:center;font-size:18px}.quick-actions span strong,.quick-actions span small{display:block}.quick-actions span strong{color:#1b403a}.quick-actions span small{color:#82918d;margin-top:3px}.recent-panel{padding:22px}.text-button{border:0;background:transparent;color:#087c6b;font-weight:950;cursor:pointer}.compact-bookings{display:grid}.compact-row{display:grid;grid-template-columns:1.2fr 1.1fr .8fr .6fr;gap:14px;align-items:center;padding:14px 6px;border-top:1px solid #e7efec}.compact-row>div strong,.compact-row>div span{display:block}.compact-row>div span{font-size:12px;color:#7b8986;margin-top:3px}.money-cell{text-align:right}.status-badge,.payment-badge,.source-badge{display:inline-flex;align-items:center;width:max-content;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:950;white-space:nowrap}.status-badge.pending-partner-approval{background:#fff3cd;color:#8a5d00}.status-badge.approved{background:#dff7ed;color:#08785f}.status-badge.checked-in{background:#dbeafe;color:#1d4ed8}.status-badge.checked-out{background:#eef2f7;color:#475569}.status-badge.rejected,.status-badge.cancelled{background:#fee2e2;color:#b91c1c}.payment-badge.paid{background:#dcfce7;color:#166534}.payment-badge.pending{background:#fff7ed;color:#c2410c}.source-badge.reception{background:#e0f2fe;color:#0369a1}.source-badge.online{background:#ede9fe;color:#6d28d9}.room-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.room-card{background:#fff;border:1px solid #dbe7e3;border-radius:22px;overflow:hidden;box-shadow:0 12px 32px rgba(17,72,63,.055)}.room-image{height:220px;background:#e8f0ed;position:relative;display:grid;place-items:center;color:#83918e;font-weight:850}.room-image img{width:100%;height:100%;object-fit:cover}.availability-tag{position:absolute;top:14px;right:14px;border-radius:999px;padding:8px 11px;font-size:11px;font-weight:1000}.availability-tag.available{background:#dcfce7;color:#166534}.availability-tag.full{background:#fee2e2;color:#991b1b}.room-content{padding:20px}.room-heading{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.room-heading span{font-size:10px;color:#84938f;font-weight:950;text-transform:uppercase;letter-spacing:.09em}.room-heading h2{margin:5px 0 0;font-size:27px;color:#173f39;letter-spacing:-.035em}.room-heading>strong{text-align:right;font-size:18px;color:#087c6b}.room-heading>strong small{display:block;font-size:10px;color:#8a9895;margin-top:2px}.room-facts{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}.room-facts span{background:#f4f8f7;border:1px solid #e0e9e6;border-radius:999px;padding:8px 10px;color:#61716d;font-size:12px;font-weight:800}.room-facts b{color:#173f39}.room-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.availability-editor{display:flex;gap:7px;align-items:center}.availability-editor input{width:75px;border:1px solid #cadbd6;border-radius:11px;padding:10px;text-align:center;font-weight:900}.availability-editor button{border:0;border-radius:10px;padding:10px 12px;font-weight:900;cursor:pointer}.availability-editor button:first-of-type{background:#087c6b;color:#fff}.availability-editor button:last-of-type{background:#edf3f1;color:#36544f}.booking-layout{display:grid;grid-template-columns:minmax(0,1fr) 355px;gap:18px;align-items:start}.booking-form-card{padding:24px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.form-grid label{display:grid;gap:7px;color:#344e49;font-size:13px;font-weight:900}.form-grid .full-field{grid-column:1/-1}.form-grid input,.form-grid select,.form-grid textarea,.booking-filters input,.booking-filters select{width:100%;border:1px solid #ccdcd7;background:#fff;border-radius:12px;padding:11px 12px;color:#18302c;outline:none}.form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus,.booking-filters input:focus,.booking-filters select:focus{border-color:#087c6b;box-shadow:0 0 0 3px rgba(8,124,107,.1)}.form-grid .invalid{border-color:#dc2626}.field-error{color:#b91c1c;font-size:11px}.optional{font-size:10px;color:#8b9996;font-weight:700}.phone-control{display:grid;grid-template-columns:85px 1fr;gap:8px}.booking-summary{padding:22px;position:sticky;top:20px}.booking-summary h2{margin:8px 0 2px;font-size:27px;color:#153e38}.booking-summary>p{margin:0 0 14px;color:#7b8a86;font-size:13px}.summary-image{width:100%;height:150px;object-fit:cover;border-radius:16px;margin:4px 0 14px}.summary-list{display:grid;gap:7px}.summary-list div{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #e8efed}.summary-list span{color:#758582;font-size:12px;font-weight:800}.summary-list strong{color:#183f39}.summary-total{background:#e8f7f3;border:1px solid #c6e9e1;border-radius:16px;padding:15px;margin-top:14px}.summary-total span,.summary-total strong{display:block}.summary-total span{color:#0b7a69;font-size:11px;text-transform:uppercase;font-weight:950}.summary-total strong{font-size:28px;margin-top:3px;color:#073e38}.booking-summary .payment-note{margin-top:13px;background:#fff8e5;border:1px solid #f4df9c;border-radius:12px;padding:10px;color:#73590f;font-size:11px;line-height:1.45}.payment-buttons{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.payment-buttons button{border:0;border-radius:12px;padding:12px;font-weight:950;cursor:pointer}.payment-buttons button:first-child{background:#087c6b;color:#fff}.payment-buttons button:last-child{background:#172c29;color:#fff}.payment-buttons button:disabled{opacity:.45;cursor:not-allowed}.bookings-panel,.guests-panel{padding:22px}.bookings-title{align-items:flex-end}.booking-filters{display:flex;gap:8px;align-items:center}.booking-filters input{min-width:250px}.booking-filters select{min-width:170px}.booking-table-wrap{overflow-x:auto}.booking-table{width:100%;border-collapse:collapse;min-width:1120px}.booking-table th{text-align:left;padding:11px 10px;border-bottom:1px solid #dce7e3;color:#7b8b87;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.booking-table td{vertical-align:top;padding:14px 10px;border-bottom:1px solid #e7efec;font-size:12px}.booking-table td>strong,.booking-table td>small{display:block}.booking-table td>small{color:#7e8c89;margin-top:4px}.booking-table .note-text{max-width:170px;color:#92400e}.booking-actions{display:flex;flex-wrap:wrap;gap:5px;min-width:190px}.booking-actions button{border:0;border-radius:9px;padding:7px 9px;font-size:10px;font-weight:950;cursor:pointer}.booking-actions button:disabled{opacity:.45}.action-positive{background:#dcfce7;color:#166534}.action-negative{background:#fee2e2;color:#991b1b}.action-primary{background:#dbeafe;color:#1d4ed8}.action-muted{background:#eef2f7;color:#475569}.action-payment{background:#fff3cd;color:#8a5d00}.guest-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.guest-card{border:1px solid #e0ebe7;border-radius:17px;padding:16px;display:grid;grid-template-columns:48px 1fr auto;gap:13px;align-items:start;background:#fbfdfc}.guest-avatar{width:48px;height:48px;border-radius:14px;background:#dff3ee;color:#087c6b;display:grid;place-items:center;font-size:19px;font-weight:1000}.guest-main h3{margin:2px 0 3px;color:#173f39}.guest-main>span{font-size:11px;color:#0b7a69;font-weight:900}.guest-main p{margin:8px 0 0;color:#788783;font-size:12px;line-height:1.5}.guest-meta{display:grid;gap:7px;text-align:right}.guest-meta>span:not(.status-badge){font-size:10px;color:#7f8d89}.guest-meta b{display:block;color:#234741;font-size:12px;margin-top:1px}.empty-state{padding:28px;text-align:center;color:#83918e;font-weight:800}.empty-state.large{grid-column:1/-1;background:#fff;border:1px dashed #c7d8d3;border-radius:18px}.reception-loading-page{min-height:100vh;background:#f4f7f6;display:grid;place-items:center;font-family:Inter,system-ui,sans-serif}.loading-card{background:#fff;border:1px solid #dbe7e3;border-radius:18px;padding:20px 24px;box-shadow:0 18px 50px rgba(17,72,63,.1);display:flex;align-items:center;gap:12px;font-weight:900;color:#18413a}.loading-spinner{width:18px;height:18px;border:2px solid #bdd8d1;border-top-color:#087c6b;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:1180px){.overview-grid{grid-template-columns:1fr}.summary-grid{grid-template-columns:repeat(2,1fr)}.room-grid{grid-template-columns:1fr}.guest-grid{grid-template-columns:1fr}.booking-layout{grid-template-columns:1fr}.booking-summary{position:static}.property-details{grid-template-columns:repeat(2,1fr)}}
@media(max-width:820px){.reception-sidebar{position:relative;width:100%;height:auto;padding:18px}.property-mini{margin:15px 0}.reception-nav{grid-template-columns:repeat(5,minmax(0,1fr));overflow-x:auto}.reception-nav button{grid-template-columns:1fr;text-align:center;min-width:105px}.reception-nav button span{font-size:12px}.sidebar-footer{grid-template-columns:1fr 1fr;margin-top:14px}.reception-workspace{margin-left:0;padding:22px 16px 45px}.workspace-header{align-items:flex-start;flex-direction:column}.workspace-header h1{font-size:31px}.header-actions{width:100%;flex-wrap:wrap}.summary-grid{grid-template-columns:1fr 1fr}.compact-row{grid-template-columns:1fr 1fr}.compact-row>.status-badge,.compact-row>.money-cell{justify-self:start;text-align:left}.bookings-title{align-items:flex-start;flex-direction:column}.booking-filters{width:100%;flex-wrap:wrap}.booking-filters input,.booking-filters select{min-width:0;flex:1}.form-grid{grid-template-columns:1fr}.form-grid .full-field{grid-column:auto}.guest-card{grid-template-columns:48px 1fr}.guest-meta{grid-column:1/-1;grid-template-columns:repeat(3,1fr);text-align:left}}
@media(max-width:520px){.summary-grid{grid-template-columns:1fr}.summary-grid article{min-height:auto}.property-details{grid-template-columns:1fr}.property-details div{border-right:0;border-bottom:1px solid #e7efec}.compact-row{grid-template-columns:1fr}.room-heading{flex-direction:column}.room-heading>strong{text-align:left}.phone-control{grid-template-columns:75px 1fr}.payment-buttons{grid-template-columns:1fr}.guest-meta{grid-template-columns:1fr}.date-pill{display:none}}
`;

export default ReceptionDashboardPage;
