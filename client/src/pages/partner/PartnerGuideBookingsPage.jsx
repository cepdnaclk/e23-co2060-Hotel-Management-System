import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin, Phone, UserRound } from "lucide-react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-LK")}`;

const dateText = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-LK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

const timeText = (value) => {
  if (!value) return "";
  const [hours, minutes] = String(value).split(":");
  const date = new Date();
  date.setHours(Number(hours || 0), Number(minutes || 0), 0, 0);
  return date.toLocaleTimeString("en-LK", { hour: "numeric", minute: "2-digit" });
};

const statusLabels = {
  pending: "Pending",
  approved: "Approved - waiting for payment",
  confirmed: "Confirmed & paid",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export default function PartnerGuideBookingsPage() {
  const { isLoggedIn, user } = useAuth();
  const { guideId } = useParams();

  const [guide, setGuide] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    if (!guideId) return;

    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/partner/guide-bookings/${guideId}`);
      setGuide(response.data.guide || null);
      setItems(response.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load this guide's tourist requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.role === "partner" && guideId) {
      load();
    }
  }, [isLoggedIn, user, guideId]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.booking_status === filter)),
    [items, filter]
  );

  const stats = useMemo(
    () => ({
      pending: items.filter((item) => item.booking_status === "pending").length,
      confirmed: items.filter((item) => item.booking_status === "confirmed").length,
      completed: items.filter((item) => item.booking_status === "completed").length,
      revenue: items
        .filter((item) => item.payment_status === "paid")
        .reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    }),
    [items]
  );

  if (!isLoggedIn) return <Navigate to="/partner/login" />;
  if (user?.role !== "partner") return <Navigate to="/" />;
  if (!guideId) return <Navigate to="/partner/guides" replace />;

  const updateStatus = async (booking, status) => {
    let note = "";

    if (status === "rejected") {
      note = window.prompt("Optional rejection reason:", "") || "";
    }

    if (status === "completed") {
      const confirmed = window.confirm("Mark this paid guide experience as completed?");
      if (!confirmed) return;
    }

    try {
      setUpdatingId(booking.id);
      setError("");
      await api.patch(`/partner/guide-bookings/${guideId}/${booking.id}/status`, {
        status,
        partner_note: note,
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update this guide request.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filters = ["all", "pending", "approved", "confirmed", "completed", "rejected", "cancelled"];

  return (
    <main className="guide-requests-page">
      <style>{css}</style>

      <section className="requests-hero">
        <div className="hero-copy">
          <Link className="back-link" to="/partner/dashboard">
            <ArrowLeft size={17} /> Partner Dashboard
          </Link>
          <span className="eyebrow">Guide request management</span>
          <h1>{guide?.display_name || "Guide Requests"}</h1>
          <p>
            Review and manage tourist booking requests only for this guide profile. Accept requests,
            wait for tourist payment, and mark completed trips when they finish.
          </p>
        </div>

        <div className="hero-actions">
          <Link to="/partner/guides">My Guiders</Link>
          {guide && <Link to={`/partner/guides?edit=${guide.id}`}>Edit Guide</Link>}
        </div>
      </section>

      <section className="requests-wrap">
        {guide && (
          <article className="guide-summary-card">
            <div className="guide-avatar-large">
              {guide.image_url ? (
                <img src={guide.image_url} alt={guide.display_name} />
              ) : (
                <UserRound size={32} />
              )}
            </div>
            <div className="guide-summary-main">
              <div className="guide-summary-title-row">
                <div>
                  <span>Managing requests for</span>
                  <h2>{guide.display_name}</h2>
                </div>
                <span className={`guide-profile-status ${guide.status}`}>{guide.status}</span>
              </div>
              <p>
                {guide.city}
                {guide.district ? `, ${guide.district}` : ""} · {guide.guide_type}
              </p>
            </div>
          </article>
        )}

        <div className="request-stats">
          <div>
            <b>{stats.pending}</b>
            <span>New requests</span>
          </div>
          <div>
            <b>{stats.confirmed}</b>
            <span>Confirmed & paid</span>
          </div>
          <div>
            <b>{stats.completed}</b>
            <span>Completed trips</span>
          </div>
          <div>
            <b>{money(stats.revenue)}</b>
            <span>Paid booking value</span>
          </div>
        </div>

        <div className="request-toolbar">
          <div>
            <h2>Tourist requests</h2>
            <p>Each request below belongs only to {guide?.display_name || "this guide"}.</p>
          </div>
          <div className="request-filters">
            {filters.map((item) => (
              <button
                type="button"
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="request-state error">{error}</div>}

        {loading ? (
          <div className="request-state">Loading this guide's requests...</div>
        ) : !error && !visible.length ? (
          <div className="request-state empty">
            <CheckCircle2 size={34} />
            <h3>No {filter === "all" ? "tourist" : filter} requests</h3>
            <p>
              {filter === "all"
                ? "There are no guide booking requests for this profile yet."
                : `There are no ${filter} requests for this guide.`}
            </p>
          </div>
        ) : !error ? (
          <div className="request-list">
            {visible.map((booking) => (
              <article className="request-card" key={booking.id}>
                <div className="request-card-top">
                  <div>
                    <small>{booking.booking_reference}</small>
                    <h3>{booking.tourist_name}</h3>
                    <p>{booking.tourist_email}</p>
                  </div>
                  <div className="amount-block">
                    <span>Total</span>
                    <strong>{money(booking.total_amount)}</strong>
                  </div>
                </div>

                <div className="request-badges">
                  <span className={`booking-status ${booking.booking_status}`}>
                    {statusLabels[booking.booking_status] || booking.booking_status}
                  </span>
                  <span className={`payment-status ${booking.payment_status}`}>
                    Payment: {booking.payment_status}
                  </span>
                </div>

                <div className="request-details">
                  <div>
                    <CalendarDays size={17} />
                    <span>Date</span>
                    <b>{dateText(booking.booking_date)}</b>
                  </div>
                  <div>
                    <Clock3 size={17} />
                    <span>Duration</span>
                    <b>
                      {booking.duration_type === "hourly"
                        ? `${booking.hours} hour${Number(booking.hours) === 1 ? "" : "s"}${
                            booking.start_time ? ` from ${timeText(booking.start_time)}` : ""
                          }`
                        : "Full day"}
                    </b>
                  </div>
                  <div>
                    <UserRound size={17} />
                    <span>Guests</span>
                    <b>{booking.guests}</b>
                  </div>
                  <div>
                    <MapPin size={17} />
                    <span>Pickup</span>
                    <b>{booking.pickup_location || "Not specified"}</b>
                  </div>
                </div>

                <div className="request-note-grid">
                  <div>
                    <span>Tour interest</span>
                    <p>{booking.tour_type || "Personalized tour"}</p>
                  </div>
                  <div>
                    <span>Tourist message</span>
                    <p>{booking.message || "No additional message."}</p>
                  </div>
                  {booking.partner_note && (
                    <div>
                      <span>Your note</span>
                      <p>{booking.partner_note}</p>
                    </div>
                  )}
                </div>

                <div className="request-actions">
                  {booking.booking_status === "pending" && (
                    <>
                      <button
                        type="button"
                        className="accept"
                        disabled={updatingId === booking.id}
                        onClick={() => updateStatus(booking, "approved")}
                      >
                        {updatingId === booking.id ? "Updating..." : "Accept Request"}
                      </button>
                      <button
                        type="button"
                        className="reject"
                        disabled={updatingId === booking.id}
                        onClick={() => updateStatus(booking, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {booking.booking_status === "approved" && (
                    <span className="waiting-message">Accepted · waiting for tourist payment</span>
                  )}

                  {booking.booking_status === "confirmed" && (
                    <button
                      type="button"
                      className="complete"
                      disabled={updatingId === booking.id}
                      onClick={() => updateStatus(booking, "completed")}
                    >
                      {updatingId === booking.id ? "Updating..." : "Mark Trip Completed"}
                    </button>
                  )}

                  {booking.tourist_phone && (
                    <a href={`tel:${booking.tourist_phone}`}>
                      <Phone size={16} /> Contact Tourist
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

const css = `
.guide-requests-page{min-height:100vh;background:linear-gradient(180deg,#f8fafc 0%,#f5f7fb 100%);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033}.requests-hero{background:linear-gradient(135deg,#0f766e 0%,#0f6d73 42%,#4338ca 100%);color:#fff;padding:38px max(24px,calc((100% - 1180px)/2));display:flex;justify-content:space-between;gap:28px;align-items:flex-end}.hero-copy{max-width:760px}.back-link{display:inline-flex!important;align-items:center;gap:7px;color:#d5faf1!important;text-decoration:none;font-weight:850;font-size:13px;margin-bottom:18px}.eyebrow{display:block;text-transform:uppercase;letter-spacing:.11em;font-size:12px;font-weight:950;color:#ccfbf1}.requests-hero h1{font-size:clamp(36px,5vw,58px);line-height:1;margin:9px 0 12px;letter-spacing:-.045em}.requests-hero p{margin:0;color:#e7f7f5;line-height:1.65;font-weight:650;max-width:720px}.hero-actions{display:flex;gap:9px;flex-wrap:wrap}.hero-actions a{color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.34);background:rgba(255,255,255,.09);padding:11px 14px;border-radius:13px;font-weight:900;white-space:nowrap}.hero-actions a:first-child{background:#fff;color:#0f766e}.requests-wrap{width:min(1180px,calc(100% - 32px));margin:22px auto 70px}.guide-summary-card{background:#fff;border:1px solid #dce5ed;border-radius:22px;padding:16px 18px;display:flex;align-items:center;gap:16px;box-shadow:0 12px 32px rgba(15,23,42,.05);margin-bottom:14px}.guide-avatar-large{width:72px;height:72px;border-radius:18px;overflow:hidden;background:#e6fffa;color:#0f766e;display:grid;place-items:center;flex:0 0 auto}.guide-avatar-large img{width:100%;height:100%;object-fit:cover}.guide-summary-main{flex:1;min-width:0}.guide-summary-title-row{display:flex;align-items:center;justify-content:space-between;gap:14px}.guide-summary-title-row>div>span{font-size:11px;color:#64748b;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.guide-summary-card h2{margin:3px 0 0;font-size:24px;letter-spacing:-.03em}.guide-summary-card p{margin:5px 0 0;color:#64748b;font-weight:750}.guide-profile-status{padding:7px 10px;border-radius:999px;text-transform:capitalize;font-size:12px;font-weight:900}.guide-profile-status.approved{background:#dcfce7;color:#166534}.guide-profile-status.pending{background:#fef3c7;color:#92400e}.guide-profile-status.rejected,.guide-profile-status.hidden{background:#fee2e2;color:#991b1b}.request-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.request-stats>div,.request-card,.request-state{background:#fff;border:1px solid #dce5ed;border-radius:20px;box-shadow:0 10px 28px rgba(15,23,42,.04)}.request-stats>div{padding:18px}.request-stats b{display:block;font-size:25px;line-height:1.1;color:#0f766e;margin-bottom:6px}.request-stats span{color:#64748b;font-weight:800;font-size:13px}.request-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin:24px 0 14px}.request-toolbar h2{margin:0;font-size:26px;letter-spacing:-.035em}.request-toolbar p{margin:5px 0 0;color:#64748b;font-weight:650}.request-filters{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.request-filters button{border:1px solid #d7dee8;background:#fff;border-radius:999px;padding:8px 11px;text-transform:capitalize;font-weight:850;color:#334155;cursor:pointer}.request-filters button.active{background:#0f766e;color:#fff;border-color:#0f766e}.request-list{display:grid;gap:14px}.request-card{padding:20px}.request-card-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.request-card-top small{font-weight:950;color:#0f766e;letter-spacing:.04em}.request-card-top h3{font-size:22px;margin:5px 0 3px}.request-card-top p{margin:0;color:#64748b;font-weight:650}.amount-block{text-align:right}.amount-block span{display:block;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:900}.amount-block strong{font-size:21px;color:#0f766e}.request-badges{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}.request-badges span{border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900}.booking-status.pending{background:#fef3c7;color:#92400e}.booking-status.approved{background:#dbeafe;color:#1d4ed8}.booking-status.confirmed{background:#dcfce7;color:#166534}.booking-status.completed{background:#ccfbf1;color:#115e59}.booking-status.rejected,.booking-status.cancelled{background:#fee2e2;color:#991b1b}.payment-status{background:#f1f5f9;color:#475569}.payment-status.paid{background:#ecfdf5;color:#047857}.payment-status.refunded{background:#fff7ed;color:#c2410c}.request-details{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.request-details>div{background:#f8fafc;border:1px solid #edf2f7;border-radius:14px;padding:12px;display:grid;grid-template-columns:20px 1fr;column-gap:7px;align-items:center}.request-details svg{grid-row:1/3;color:#0f766e}.request-details span{font-size:10px;color:#64748b;text-transform:uppercase;font-weight:900}.request-details b{font-size:13px;overflow-wrap:anywhere}.request-note-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:9px}.request-note-grid>div{background:#fbfdff;border:1px solid #edf2f7;border-radius:14px;padding:12px}.request-note-grid span{font-size:10px;text-transform:uppercase;color:#64748b;font-weight:900}.request-note-grid p{margin:5px 0 0;line-height:1.55;color:#334155;font-weight:650}.request-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:16px}.request-actions button,.request-actions a{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:11px;padding:10px 13px;font-weight:900;text-decoration:none;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.request-actions button:disabled{opacity:.55;cursor:not-allowed}.request-actions .accept{background:#047857;color:#fff;border-color:#047857}.request-actions .reject{color:#991b1b;border-color:#fecaca}.request-actions .complete{background:#0f766e;color:#fff;border-color:#0f766e}.waiting-message{background:#eff6ff;color:#1d4ed8;padding:9px 12px;border-radius:10px;font-weight:850;font-size:13px}.request-state{padding:28px;text-align:center;color:#475569}.request-state.error{color:#991b1b;background:#fff7f7;border-color:#fecaca}.request-state.empty{padding:42px 24px}.request-state.empty svg{color:#0f766e}.request-state.empty h3{margin:10px 0 5px}.request-state.empty p{margin:0;color:#64748b}@media(max-width:900px){.requests-hero{flex-direction:column;align-items:flex-start}.request-stats{grid-template-columns:1fr 1fr}.request-toolbar{align-items:flex-start;flex-direction:column}.request-filters{justify-content:flex-start}.request-details{grid-template-columns:1fr 1fr}}@media(max-width:620px){.requests-wrap{width:min(100% - 20px,1180px)}.requests-hero{padding:30px 18px}.guide-summary-title-row{align-items:flex-start;flex-direction:column}.request-stats,.request-details,.request-note-grid{grid-template-columns:1fr}.request-card-top{flex-direction:column}.amount-block{text-align:left}.request-filters{overflow-x:auto;flex-wrap:nowrap;width:100%;padding-bottom:4px}.request-filters button{white-space:nowrap}.request-actions>*{width:100%;justify-content:center}.hero-actions{width:100%}.hero-actions a{flex:1;text-align:center}}
`;
