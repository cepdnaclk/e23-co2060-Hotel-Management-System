import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../../api/api";

const formatMoney = (amount) => {
  const value = Number(amount || 0);
  if (!value) return "Ask price";
  return `Rs. ${value.toLocaleString()}`;
};

const getStoredProperty = () => {
  try {
    const stored = localStorage.getItem("tourismhub_reception_property");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const todayInputValue = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const addDays = (dateString, daysToAdd) => {
  const date = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  date.setDate(date.getDate() + daysToAdd);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const defaultBookingForm = () => {
  const today = todayInputValue();
  return {
    full_name: "",
    email: "",
    nationality: "Sri Lankan",
    country_code: "+94",
    phone: "",
    check_in: today,
    check_out: addDays(today, 1),
    check_in_package: "night",
    check_out_package: "day",
    guests: "1",
    notes: "",
  };
};

const getDateDifference = (checkIn, checkOut) => {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
};

const packageToUnits = (packageType) => {
  if (packageType === "day") return { dayUnits: 1, nightUnits: 0 };
  if (packageType === "night") return { dayUnits: 0, nightUnits: 1 };
  return { dayUnits: 1, nightUnits: 1 };
};

const calculatePreview = (room, form) => {
  if (!room) return { dayUnits: 0, nightUnits: 0, total: 0, extraGuests: 0 };
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
  const guests = Number(form.guests || 1);
  const extraGuests = Math.max(0, guests - Number(room.base_occupancy || 1));
  const extraCost = extraGuests * Number(room.extra_person_price || 0);
  const nightAmount = (Number(room.price_per_night || 0) + extraCost) * nightUnits;
  const dayAmount = (Number(room.price_per_day || room.price_per_night || 0) + extraCost) * dayUnits;

  return { dayUnits, nightUnits, total: nightAmount + dayAmount, extraGuests };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getBookingFormErrors = (form) => {
  const errors = {};

  if (!form.full_name.trim()) errors.full_name = "Guest name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (!form.phone.trim()) errors.phone = "Phone number is required.";
  if (form.check_out < form.check_in) errors.check_out = "Check-out cannot be before check-in.";

  return errors;
};

function ReceptionDashboardPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("tourismhub_reception_token");
  const [property, setProperty] = useState(getStoredProperty);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingRoomId, setUpdatingRoomId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activePanel, setActivePanel] = useState("rooms");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingForm, setBookingForm] = useState(defaultBookingForm);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingRoomValue, setEditingRoomValue] = useState("");

  useEffect(() => {
    if (!token) return undefined;

    let stillMounted = true;

    const loadDesk = async () => {
      try {
        setLoading(true);
        const [propertyResponse, bookingsResponse] = await Promise.all([
          api.get("/reception/property"),
          api.get("/reception/bookings"),
        ]);
        if (!stillMounted) return;
        setProperty(propertyResponse.data.data);
        setBookings(bookingsResponse.data.data || []);
        localStorage.setItem("tourismhub_reception_property", JSON.stringify(propertyResponse.data.data));
      } catch (err) {
        if (!stillMounted) return;
        setError(err.response?.data?.message || "Failed to load reception desk.");
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("tourismhub_reception_token");
          localStorage.removeItem("tourismhub_reception_user");
          localStorage.removeItem("tourismhub_reception_property");
        }
      } finally {
        if (stillMounted) setLoading(false);
      }
    };

    loadDesk();

    return () => {
      stillMounted = false;
    };
  }, [token]);

  const refreshBookings = async () => {
    const response = await api.get("/reception/bookings");
    setBookings(response.data.data || []);
  };

  const stats = useMemo(() => {
    const rooms = property?.rooms || [];
    const total = rooms.reduce((sum, room) => sum + Number(room.total_rooms || 0), 0);
    const available = rooms.reduce((sum, room) => sum + Number(room.available_rooms || 0), 0);

    return {
      roomTypes: rooms.length,
      total,
      available,
      occupied: Math.max(total - available, 0),
    };
  }, [property]);

  if (!token) {
    return <Navigate to="/reception/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("tourismhub_reception_token");
    localStorage.removeItem("tourismhub_reception_user");
    localStorage.removeItem("tourismhub_reception_property");
    navigate("/reception/login");
  };

  const updateAvailability = async (room, nextAvailable) => {
    const safeAvailable = Math.min(
      Math.max(Number(nextAvailable), 0),
      Number(room.total_rooms || 0)
    );

    try {
      setUpdatingRoomId(room.id);
      setError("");
      const response = await api.patch(`/reception/rooms/${room.id}/availability`, {
        available_rooms: safeAvailable,
      });
      setProperty(response.data.data);
      localStorage.setItem("tourismhub_reception_property", JSON.stringify(response.data.data));
      setNotice(`${room.room_type} availability updated.`);
      window.setTimeout(() => setNotice(""), 2200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update room availability.");
    } finally {
      setUpdatingRoomId(null);
    }
  };

  const startEditRoomCount = (room) => {
    setEditingRoomId(room.id);
    setEditingRoomValue(String(room.available_rooms || 0));
  };

  const cancelEditRoomCount = () => {
    setEditingRoomId(null);
    setEditingRoomValue("");
  };

  const saveEditRoomCount = async (room) => {
    await updateAvailability(room, Number(editingRoomValue));
    setEditingRoomId(null);
    setEditingRoomValue("");
  };

  const startWalkInBooking = (room) => {
    setSelectedRoom(room);
    setBookingForm(defaultBookingForm());
    setActivePanel("booking");
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookingChange = (event) => {
    const { name, value } = event.target;
    setBookingForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "check_in" && next.check_out < value) {
        next.check_out = value;
      }
      return next;
    });
  };

  const submitWalkInBooking = async (paymentMethod) => {
    if (!selectedRoom) {
      setError("Select a room type before creating a walk-in booking.");
      return;
    }

    if (Object.keys(getBookingFormErrors(bookingForm)).length > 0) {
      setError("Please fix the highlighted guest details before taking payment.");
      return;
    }

    try {
      setBookingSubmitting(true);
      setError("");
      const response = await api.post("/reception/bookings", {
        ...bookingForm,
        room_id: selectedRoom.id,
        guests: Number(bookingForm.guests || 1),
        payment_method: paymentMethod,
      });

      setProperty(response.data.data);
      localStorage.setItem("tourismhub_reception_property", JSON.stringify(response.data.data));
      await refreshBookings();
      setNotice(response.data.message || "Payment successful. Room marked occupied.");
      setSelectedRoom(null);
      setBookingForm(defaultBookingForm());
      setActivePanel("bookings");
      window.setTimeout(() => setNotice(""), 2600);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete walk-in booking.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const bookingPreview = calculatePreview(selectedRoom, bookingForm);
  const bookingFormErrors = getBookingFormErrors(bookingForm);
  const hasBookingFormErrors = Object.keys(bookingFormErrors).length > 0;

  return (
    <main className="reception-desk-page">
      <style>{styles}</style>

      <header className="reception-topbar">
        <Link to="/" className="reception-logo">TourismHub LK</Link>
        <nav>
          <button type="button" onClick={() => window.location.reload()}>Refresh</button>
          <button type="button" onClick={handleLogout} className="danger">Logout</button>
        </nav>
      </header>

      <section className="reception-hero">
        <div>
          <span className="desk-kicker">Reception desk</span>
          <h1>{property?.name || "Hotel room desk"}</h1>
          <p>
            Manage walk-in room availability for guests who visit the hotel
            directly without using the online booking flow.
          </p>
          <div className="desk-meta">
            <strong>{property?.city || "Sri Lanka"}</strong>
            {property?.district ? <strong>{property.district}</strong> : null}
            <strong>{property?.property_type || "Hotel"}</strong>
          </div>
        </div>

        <aside className="desk-status-card">
          <span>Live room status</span>
          <strong>{stats.available}</strong>
          <p>available of {stats.total} total rooms</p>
          <div className="desk-progress">
            <i style={{ width: `${stats.total ? (stats.available / stats.total) * 100 : 0}%` }} />
          </div>
        </aside>
      </section>

      <section className="reception-stats-grid">
        <article>
          <span>Room types</span>
          <strong>{stats.roomTypes}</strong>
        </article>
        <article>
          <span>Total rooms</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Available now</span>
          <strong>{stats.available}</strong>
        </article>
        <article>
          <span>Occupied / held</span>
          <strong>{stats.occupied}</strong>
        </article>
      </section>

      {error ? <div className="desk-alert error">{error}</div> : null}
      {notice ? <div className="desk-alert success">{notice}</div> : null}

      <section className="reception-tabs">
        <button
          type="button"
          className={activePanel === "rooms" ? "active" : ""}
          onClick={() => setActivePanel("rooms")}
        >
          Room types
        </button>
        <button
          type="button"
          className={activePanel === "booking" ? "active" : ""}
          onClick={() => setActivePanel("booking")}
          disabled={!selectedRoom}
        >
          Walk-in booking
        </button>
        <button
          type="button"
          className={activePanel === "bookings" ? "active" : ""}
          onClick={() => setActivePanel("bookings")}
        >
          Reception bookings
        </button>
      </section>

      {activePanel === "booking" && selectedRoom ? (
        <section className="walkin-booking-panel">
          <div className="walkin-form-card">
            <div className="panel-heading">
              <span>Complete booking</span>
              <h2>Guest details</h2>
              <p>Cash or card payment will approve the booking and occupy one room immediately.</p>
            </div>

            <div className="booking-form-grid">
              <label>
                Full name
                <input
                  name="full_name"
                  className={bookingFormErrors.full_name ? "field-invalid" : ""}
                  value={bookingForm.full_name}
                  onChange={handleBookingChange}
                />
                {bookingFormErrors.full_name ? <small className="field-error">{bookingFormErrors.full_name}</small> : null}
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  className={bookingFormErrors.email ? "field-invalid" : ""}
                  value={bookingForm.email}
                  onChange={handleBookingChange}
                />
                {bookingFormErrors.email ? <small className="field-error">{bookingFormErrors.email}</small> : null}
              </label>
              <label>
                Nationality
                <input name="nationality" value={bookingForm.nationality} onChange={handleBookingChange} />
              </label>
              <label>
                Phone
                <div className="phone-row">
                  <input name="country_code" value={bookingForm.country_code} onChange={handleBookingChange} />
                  <input
                    name="phone"
                    className={bookingFormErrors.phone ? "field-invalid" : ""}
                    value={bookingForm.phone}
                    onChange={handleBookingChange}
                  />
                </div>
                {bookingFormErrors.phone ? <small className="field-error">{bookingFormErrors.phone}</small> : null}
              </label>
              <label>
                Check-in date
                <input name="check_in" type="date" value={bookingForm.check_in} onChange={handleBookingChange} />
              </label>
              <label>
                Check-out date
                <input
                  name="check_out"
                  type="date"
                  className={bookingFormErrors.check_out ? "field-invalid" : ""}
                  value={bookingForm.check_out}
                  onChange={handleBookingChange}
                />
                {bookingFormErrors.check_out ? <small className="field-error">{bookingFormErrors.check_out}</small> : null}
              </label>
              <label>
                Check-in package
                <select name="check_in_package" value={bookingForm.check_in_package} onChange={handleBookingChange}>
                  <option value="day">Day</option>
                  <option value="night">Night</option>
                  <option value="both">Both</option>
                </select>
              </label>
              <label>
                Check-out package
                <select name="check_out_package" value={bookingForm.check_out_package} onChange={handleBookingChange}>
                  <option value="day">Day</option>
                  <option value="night">Night</option>
                  <option value="both">Both</option>
                </select>
              </label>
              <label>
                Guests
                <input name="guests" type="number" min="1" max={selectedRoom.capacity} value={bookingForm.guests} onChange={handleBookingChange} />
              </label>
              <label>
                Special notes
                <input name="notes" value={bookingForm.notes} onChange={handleBookingChange} />
              </label>
            </div>
          </div>

          <aside className="booking-summary-card">
            <div className="summary-photo">
              {selectedRoom.main_image ? <img src={selectedRoom.main_image} alt={selectedRoom.room_type} /> : null}
            </div>
            <h2>{selectedRoom.room_type}</h2>
            <p>{property?.name}</p>
            <div className="summary-lines">
              <span><b>Available</b><strong>{selectedRoom.available_rooms} room(s)</strong></span>
              <span><b>Night price</b><strong>{formatMoney(selectedRoom.price_per_night)}</strong></span>
              <span><b>Day price</b><strong>{formatMoney(selectedRoom.price_per_day)}</strong></span>
              <span><b>Extra guests</b><strong>{bookingPreview.extraGuests}</strong></span>
              <span><b>Day units</b><strong>{bookingPreview.dayUnits}</strong></span>
              <span><b>Night units</b><strong>{bookingPreview.nightUnits}</strong></span>
            </div>
            <div className="total-box">
              <span>Total amount</span>
              <strong>{formatMoney(bookingPreview.total)}</strong>
            </div>
            {hasBookingFormErrors ? (
              <p className="form-validation-hint">Fill in guest name, a valid email, and phone to enable payment.</p>
            ) : null}

            <div className="payment-actions">
              <button
                type="button"
                disabled={bookingSubmitting || hasBookingFormErrors}
                onClick={() => submitWalkInBooking("cash")}
              >
                Pay Cash
              </button>
              <button
                type="button"
                disabled={bookingSubmitting || hasBookingFormErrors}
                onClick={() => submitWalkInBooking("card")}
              >
                Pay Card
              </button>
            </div>
          </aside>
        </section>
      ) : null}

      {activePanel === "bookings" ? (
        <section className="reception-bookings-panel">
          <div className="panel-heading">
            <span>Reception history</span>
            <h2>Hotel bookings</h2>
            <p>Walk-in bookings are approved, paid, and occupied immediately.</p>
          </div>
          {bookings.length ? (
            <div className="booking-list">
              {bookings.map((booking) => (
                <article className="booking-row" key={booking.id}>
                  <div>
                    <span>{booking.booking_reference}</span>
                    <h3>{booking.full_name}</h3>
                    <p>{booking.room_type} - {booking.check_in} to {booking.check_out}</p>
                  </div>
                  <div>
                    <b>{formatMoney(booking.total_amount)}</b>
                    <small>{booking.payment_status} / {booking.booking_status}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="desk-empty">No reception bookings yet.</div>
          )}
        </section>
      ) : null}

      {loading ? (
        <section className="desk-empty">Loading reception room desk...</section>
      ) : !property?.rooms?.length ? (
        <section className="desk-empty">
          <h2>No room types added yet</h2>
          <p>Room types added in property management will appear here.</p>
        </section>
      ) : activePanel === "rooms" ? (
        <section className="reception-room-grid">
          {property.rooms.map((room) => {
            const available = Number(room.available_rooms || 0);
            const total = Number(room.total_rooms || 0);
            const occupied = Math.max(total - available, 0);
            const busy = updatingRoomId === room.id;

            return (
              <article className="reception-room-card" key={room.id}>
                <div className="room-photo">
                  {room.main_image ? <img src={room.main_image} alt={room.room_type} /> : <span>No photo</span>}
                  <strong>{available > 0 ? "Available" : "Full"}</strong>
                </div>

                <div className="room-body">
                  <div className="room-title-row">
                    <div>
                      <span>Room type</span>
                      <h2>{room.room_type}</h2>
                    </div>
                    <b>{formatMoney(room.price_per_night)}</b>
                  </div>

                  <div className="room-facts">
                    <span>Capacity {room.capacity}</span>
                    <span>Base {room.base_occupancy}</span>
                    <span>Day {formatMoney(room.price_per_day)}</span>
                    <span>Extra {formatMoney(room.extra_person_price)}</span>
                  </div>

                  <div className="availability-panel">
                    <div>
                      <small>Available</small>
                      <strong>{available}</strong>
                    </div>
                    <div>
                      <small>Occupied / held</small>
                      <strong>{occupied}</strong>
                    </div>
                    <div>
                      <small>Total</small>
                      <strong>{total}</strong>
                    </div>
                  </div>

                  <div className="room-actions">
                    <button
                      type="button"
                      disabled={busy || available <= 0}
                      onClick={() => startWalkInBooking(room)}
                    >
                      Create walk-in booking
                    </button>
                    <button
                      type="button"
                      disabled={busy || available >= total}
                      onClick={() => updateAvailability(room, available + 1)}
                    >
                      Release room
                    </button>
                    {editingRoomId === room.id ? (
                      <div className="room-count-editor">
                        <input
                          type="number"
                          min="0"
                          max={total}
                          value={editingRoomValue}
                          onChange={(event) => setEditingRoomValue(event.target.value)}
                          autoFocus
                        />
                        <button type="button" disabled={busy} onClick={() => saveEditRoomCount(room)}>Save</button>
                        <button type="button" onClick={cancelEditRoomCount}>Cancel</button>
                      </div>
                    ) : (
                      <button type="button" disabled={busy} onClick={() => startEditRoomCount(room)}>
                        Set count
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}

const styles = `
.reception-desk-page{min-height:100vh;background:linear-gradient(180deg,#edf8f5 0%,#ffffff 42%,#f7fbf8 100%);font-family:Inter,system-ui,Arial,sans-serif;color:#102033}
.reception-topbar{height:74px;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 min(5vw,70px);background:#fff;border-bottom:1px solid #d9e8e3;position:sticky;top:0;z-index:20}
.reception-logo{text-decoration:none;color:#087969;font-size:26px;font-weight:1000;letter-spacing:-.04em}
.reception-topbar nav{display:flex;gap:10px}.reception-topbar button{border:1px solid #cfe3dc;background:#fff;color:#07584e;border-radius:999px;padding:12px 16px;font-weight:950;cursor:pointer}.reception-topbar button.danger{background:#ef4444;color:#fff;border-color:#ef4444}
.reception-hero{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:28px;align-items:stretch;padding:54px min(5vw,70px) 28px;background:linear-gradient(135deg,#064e45,#0a8170);color:#fff}
.desk-kicker{display:inline-flex;background:#fff3bf;color:#064e45;border-radius:999px;padding:9px 14px;font-weight:1000;font-size:12px;text-transform:uppercase;letter-spacing:.12em}
.reception-hero h1{font-size:clamp(44px,5vw,78px);line-height:.96;margin:22px 0 14px;letter-spacing:-.06em;color:#fff}
.reception-hero p{max-width:850px;color:#eafffb;font-size:19px;line-height:1.65;font-weight:760}
.desk-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.desk-meta strong{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:10px 13px}
.desk-status-card{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);border-radius:28px;padding:26px;box-shadow:inset 0 1px 0 rgba(255,255,255,.16)}
.desk-status-card span{color:#fff3bf;font-weight:1000;text-transform:uppercase;letter-spacing:.12em;font-size:12px}.desk-status-card strong{display:block;font-size:72px;line-height:1;margin-top:16px;color:#fff}.desk-status-card p{margin:4px 0 18px;color:#eafffb}.desk-progress{height:12px;border-radius:999px;background:rgba(255,255,255,.18);overflow:hidden}.desk-progress i{display:block;height:100%;border-radius:inherit;background:#ffc527}
.reception-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:28px min(5vw,70px)}
.reception-stats-grid article{background:#fff;border:1px solid #dbe8e3;border-radius:24px;padding:22px;box-shadow:0 18px 44px rgba(15,58,50,.08)}.reception-stats-grid span{display:block;color:#64748b;font-weight:950;text-transform:uppercase;letter-spacing:.08em;font-size:12px}.reception-stats-grid strong{display:block;color:#064e45;font-size:42px;margin-top:8px}
.desk-alert{margin:0 min(5vw,70px) 18px;border-radius:18px;padding:14px 16px;font-weight:900}.desk-alert.error{background:#fee2e2;color:#991b1b}.desk-alert.success{background:#dcfce7;color:#166534}
.reception-tabs{display:flex;gap:10px;flex-wrap:wrap;padding:0 min(5vw,70px) 22px}.reception-tabs button{border:1px solid #cfe3dc;background:#fff;color:#07584e;border-radius:999px;padding:13px 18px;font-weight:1000;cursor:pointer;box-shadow:0 12px 30px rgba(15,58,50,.06)}.reception-tabs button.active{background:#087969;color:#fff;border-color:#087969}.reception-tabs button:disabled{opacity:.5;cursor:not-allowed}
.walkin-booking-panel{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:22px;padding:0 min(5vw,70px) 34px}.walkin-form-card,.booking-summary-card,.reception-bookings-panel{background:#fff;border:1px solid #dbe8e3;border-radius:28px;box-shadow:0 22px 58px rgba(15,58,50,.08)}.walkin-form-card{padding:24px}.panel-heading span{display:inline-flex;background:#e8fff7;color:#087060;border:1px solid #a8ead8;border-radius:999px;padding:7px 11px;font-weight:1000;font-size:11px;text-transform:uppercase;letter-spacing:.1em}.panel-heading h2{margin:12px 0 6px;color:#063f3a;font-size:32px;letter-spacing:-.04em}.panel-heading p{margin:0 0 18px;color:#64748b;font-weight:760;line-height:1.55}
.booking-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.booking-form-grid label{display:grid;gap:7px;color:#233044;font-weight:950}.booking-form-grid input,.booking-form-grid select{width:100%;box-sizing:border-box;border:1px solid #cfdeda;border-radius:14px;padding:13px 14px;font-size:14px;font-weight:760;background:#fff;color:#102033;outline:none}.booking-form-grid input:focus,.booking-form-grid select:focus{border-color:#087969;box-shadow:0 0 0 4px rgba(8,121,105,.11)}.phone-row{display:grid;grid-template-columns:90px 1fr;gap:8px}
.booking-summary-card{padding:18px;align-self:start;position:sticky;top:94px}.summary-photo{height:170px;border-radius:20px;background:#e6f1ee;overflow:hidden}.summary-photo img{width:100%;height:100%;object-fit:cover}.booking-summary-card h2{margin:16px 0 4px;color:#063f3a;font-size:28px;letter-spacing:-.04em}.booking-summary-card p{margin:0 0 14px;color:#64748b;font-weight:850}.summary-lines{display:grid;gap:8px}.summary-lines span{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #edf3f1;padding:8px 0}.summary-lines b{color:#64748b}.summary-lines strong{color:#063f3a}.total-box{margin-top:14px;background:#e8fff7;border:1px solid #a8ead8;border-radius:18px;padding:16px}.total-box span{display:block;color:#087060;font-weight:950}.total-box strong{display:block;color:#063f3a;font-size:30px;margin-top:4px}.payment-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.payment-actions button{border:none;border-radius:15px;padding:14px 16px;font-weight:1000;cursor:pointer}.payment-actions button:first-child{background:#087969;color:#fff}.payment-actions button:last-child{background:#111827;color:#fff}.payment-actions button:disabled{opacity:.55;cursor:not-allowed}
.reception-bookings-panel{margin:0 min(5vw,70px) 34px;padding:24px}.booking-list{display:grid;gap:12px}.booking-row{display:flex;align-items:center;justify-content:space-between;gap:18px;border:1px solid #e2ece8;background:#fbfdf9;border-radius:18px;padding:15px}.booking-row span{display:block;color:#087060;font-size:12px;font-weight:1000}.booking-row h3{margin:5px 0;color:#063f3a}.booking-row p{margin:0;color:#64748b;font-weight:760}.booking-row b{display:block;color:#063f3a;font-size:20px;text-align:right}.booking-row small{display:block;color:#087060;font-weight:900;text-align:right}
.desk-empty{margin:20px min(5vw,70px);background:#fff;border:1px dashed #b8d4cc;border-radius:28px;padding:44px;text-align:center;color:#64748b;font-weight:800}
.desk-empty h2{color:#064e45;margin-top:0}
.reception-room-grid{display:grid;gap:22px;padding:0 min(5vw,70px) 70px}
.reception-room-card{display:grid;grid-template-columns:300px 1fr;background:#fff;border:1px solid #dbe8e3;border-radius:30px;overflow:hidden;box-shadow:0 22px 58px rgba(15,58,50,.09)}
.room-photo{position:relative;min-height:260px;background:#e6f1ee;display:grid;place-items:center;color:#64748b;font-weight:900}.room-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.room-photo:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(3,47,43,.58),rgba(3,47,43,.05))}.room-photo strong{position:absolute;left:18px;bottom:18px;z-index:2;background:#ffc527;color:#063f38;border-radius:999px;padding:9px 13px;font-weight:1000}
.room-body{padding:24px;display:grid;gap:18px}.room-title-row{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.room-title-row span{color:#64748b;font-weight:950;text-transform:uppercase;font-size:12px;letter-spacing:.08em}.room-title-row h2{margin:6px 0 0;color:#063f3a;font-size:32px;letter-spacing:-.04em}.room-title-row b{background:#e8fff7;color:#087060;border-radius:999px;padding:10px 13px;white-space:nowrap}
.room-facts{display:flex;gap:9px;flex-wrap:wrap}.room-facts span{background:#f4faf7;border:1px solid #dbe8e3;color:#334155;border-radius:999px;padding:8px 11px;font-weight:850;font-size:13px}
.availability-panel{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.availability-panel div{border:1px solid #dbe8e3;background:#fbfdf9;border-radius:20px;padding:16px}.availability-panel small{display:block;color:#64748b;font-weight:950}.availability-panel strong{display:block;color:#064e45;font-size:34px;margin-top:4px}
.room-actions{display:flex;gap:10px;flex-wrap:wrap}.room-actions button{border:none;border-radius:15px;padding:13px 16px;font-weight:1000;cursor:pointer;background:#087969;color:#fff}.room-actions button:nth-child(2){background:#ffc527;color:#063f38}.room-actions button:nth-child(3){background:#eef6f3;color:#07584e}.room-actions button:disabled{opacity:.52;cursor:not-allowed}
.room-count-editor{display:flex;gap:8px;align-items:center}.room-count-editor input{width:70px;border:1px solid #cfdeda;border-radius:12px;padding:10px;font-weight:900;text-align:center;color:#102033}.room-count-editor button{padding:10px 14px;border-radius:12px}.room-count-editor button:first-of-type{background:#087969;color:#fff}.room-count-editor button:last-of-type{background:#eef6f3;color:#07584e}
.field-invalid{border-color:#dc2626!important;box-shadow:0 0 0 3px rgba(220,38,38,.12)!important}
.field-error{display:block;margin-top:4px;color:#b91c1c;font-weight:800;font-size:12px}
.form-validation-hint{margin:10px 0 0;color:#b45309;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:10px 12px;font-weight:800;font-size:13px}
@media(max-width:980px){.reception-hero,.reception-room-card,.walkin-booking-panel{grid-template-columns:1fr}.reception-stats-grid{grid-template-columns:repeat(2,1fr)}.room-photo{min-height:230px}.booking-summary-card{position:relative;top:auto}}
@media(max-width:560px){.reception-topbar{padding:0 14px}.reception-logo{font-size:20px}.reception-hero,.reception-stats-grid,.reception-room-grid,.walkin-booking-panel,.reception-tabs{padding-left:14px;padding-right:14px}.reception-stats-grid,.availability-panel,.booking-form-grid,.payment-actions{grid-template-columns:1fr}.room-title-row,.booking-row{flex-direction:column;align-items:flex-start}.room-actions button{width:100%}.booking-row b,.booking-row small{text-align:left}}
`;

export default ReceptionDashboardPage;
