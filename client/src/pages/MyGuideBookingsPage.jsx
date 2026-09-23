import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import PaymentModal from "../components/PaymentModal";

const money = (n) => `Rs. ${Number(n || 0).toLocaleString("en-LK")}`;
const dateText = (v) => v ? new Date(v).toLocaleDateString("en-LK", { year:"numeric", month:"short", day:"numeric" }) : "-";

export default function MyGuideBookingsPage() {
  const { isLoggedIn, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: "" });

  const load = async () => {
    try {
      setLoading(true); setError("");
      const r = await api.get("/guide-bookings/my");
      setBookings(r.data.bookings || []);
    } catch (e) { setError(e.response?.data?.message || "Could not load guide bookings."); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (isLoggedIn && user?.role === "tourist") load(); }, [isLoggedIn, user]);

  if (!isLoggedIn) return <Navigate to="/login" />;
  if (user?.role !== "tourist") return <Navigate to="/" />;

  const pay = async ({ gateway, card_last4 }) => {
    await api.post(`/guide-bookings/${paymentBooking.id}/pay`, { payment_gateway: gateway, card_last4 });
    setPaymentBooking(null); await load();
  };
  const cancel = async (id) => {
    if (!window.confirm("Cancel this guide booking?")) return;
    try { await api.patch(`/guide-bookings/${id}/cancel`); await load(); }
    catch (e) { alert(e.response?.data?.message || "Could not cancel booking."); }
  };
  const submitReview = async () => {
    try {
      await api.post(`/guide-bookings/${reviewBooking.id}/review`, review);
      setReviewBooking(null); setReview({ rating:5, comment:"" }); await load();
    } catch (e) { alert(e.response?.data?.message || "Could not submit review."); }
  };

  return <main className="gb-page"><style>{css}</style>
    <PaymentModal open={!!paymentBooking} title="Pay guide booking" description="Complete payment for your approved guide request." amount={paymentBooking?.total_amount || 0} reference={paymentBooking?.booking_reference || ""} submitLabel="Pay and confirm" onClose={()=>setPaymentBooking(null)} onConfirm={pay}/>
    {reviewBooking && <div className="gb-modal"><div className="gb-modal-card"><h2>Review {reviewBooking.guide_name}</h2><label>Rating<select value={review.rating} onChange={e=>setReview({...review,rating:Number(e.target.value)})}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} star{n>1?"s":""}</option>)}</select></label><label>Comment<textarea rows="4" value={review.comment} onChange={e=>setReview({...review,comment:e.target.value})}/></label><div className="gb-actions"><button onClick={()=>setReviewBooking(null)}>Cancel</button><button className="primary" onClick={submitReview}>Submit review</button></div></div></div>}

    <section className="gb-hero"><span>Tourist account</span><h1>My Guide Bookings</h1><p>Track requests, pay approved bookings, contact your guide, and review completed trips.</p></section>
    <section className="gb-wrap">
      {loading ? <div className="gb-state">Loading guide bookings...</div> : error ? <div className="gb-state error">{error}</div> : !bookings.length ? <div className="gb-state"><h2>No guide bookings yet</h2><p>Choose a verified guide and send your first request.</p><Link to="/tourist-guides">Browse guides</Link></div> :
      <div className="gb-list">{bookings.map(b=><article className="gb-card" key={b.id}>
        <div className="gb-card-top"><div><small>{b.booking_reference}</small><h2>{b.guide_name}</h2><p>{b.guide_city} · {dateText(b.booking_date)} · {b.duration_type === "hourly" ? `${b.hours} hours` : "Full day"}</p></div><strong>{money(b.total_amount)}</strong></div>
        <div className="gb-badges"><span className={`status ${b.booking_status}`}>{b.booking_status}</span><span className={`payment ${b.payment_status}`}>{b.payment_status}</span></div>
        <div className="gb-grid"><div><span>Guests</span><b>{b.guests}</b></div><div><span>Tour</span><b>{b.tour_type || "Personalized tour"}</b></div><div><span>Pickup</span><b>{b.pickup_location || "To arrange"}</b></div><div><span>Partner note</span><b>{b.partner_note || "No note"}</b></div></div>
        <div className="gb-actions">
          <Link to={`/tourist-guides/${b.guide_slug}`}>Guide profile</Link>
          {b.guide_phone && <a href={`tel:${b.guide_phone}`}>Call</a>}
          {b.booking_status === "approved" && b.payment_status !== "paid" && <button className="primary" onClick={()=>setPaymentBooking(b)}>Pay now</button>}
          {["pending","approved","confirmed"].includes(b.booking_status) && <button className="danger" onClick={()=>cancel(b.id)}>Cancel</button>}
          {b.booking_status === "completed" && !b.review_id && <button className="primary" onClick={()=>setReviewBooking(b)}>Leave review</button>}
          {b.review_id && <span className="reviewed">Reviewed · {b.review_rating}/5</span>}
        </div>
      </article>)}</div>}
    </section>
  </main>;
}

const css=`
.gb-page{min-height:100vh;background:#f5faf8;color:#102033;font-family:Inter,system-ui,sans-serif}.gb-hero{padding:48px 24px;background:linear-gradient(135deg,#064e45,#0b8796);color:#fff;text-align:center}.gb-hero span{text-transform:uppercase;font-size:12px;font-weight:900;letter-spacing:.12em;color:#ffe88a}.gb-hero h1{font-size:44px;margin:10px 0}.gb-hero p{margin:0 auto;max-width:700px;font-weight:700;color:#e6fffb}.gb-wrap{width:min(1080px,calc(100% - 32px));margin:30px auto 70px}.gb-list{display:grid;gap:16px}.gb-card,.gb-state{background:#fff;border:1px solid #dbece7;border-radius:24px;padding:22px;box-shadow:0 12px 35px rgba(6,78,69,.07)}.gb-card-top{display:flex;justify-content:space-between;gap:18px}.gb-card h2{margin:4px 0;color:#064e45}.gb-card p{margin:0;color:#64748b;font-weight:700}.gb-card-top>strong{color:#064e45;font-size:20px}.gb-card small{font-weight:900;color:#0b8796}.gb-badges{display:flex;gap:8px;margin:16px 0}.gb-badges span{padding:7px 10px;border-radius:999px;text-transform:capitalize;font-size:12px;font-weight:900;background:#eef2f7}.gb-badges .approved,.gb-badges .confirmed,.gb-badges .completed,.gb-badges .paid{background:#dcfce7;color:#166534}.gb-badges .pending,.gb-badges .unpaid{background:#fef3c7;color:#92400e}.gb-badges .rejected,.gb-badges .cancelled,.gb-badges .refunded{background:#fee2e2;color:#991b1b}.gb-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.gb-grid div{background:#f7fbfa;border-radius:14px;padding:12px}.gb-grid span{display:block;color:#64748b;font-size:11px;text-transform:uppercase;font-weight:900}.gb-grid b{display:block;margin-top:4px;font-size:13px}.gb-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}.gb-actions a,.gb-actions button,.gb-state a{border:1px solid #cfe1dc;background:#fff;color:#064e45;text-decoration:none;border-radius:12px;padding:10px 13px;font-weight:900;cursor:pointer}.gb-actions .primary,.gb-state a{background:#064e45;color:#fff;border-color:#064e45}.gb-actions .danger{color:#991b1b}.reviewed{padding:10px;font-weight:900;color:#166534}.gb-state{text-align:center}.gb-state.error{color:#991b1b}.gb-modal{position:fixed;inset:0;z-index:100;background:rgba(15,23,42,.55);display:grid;place-items:center;padding:20px}.gb-modal-card{width:min(480px,100%);background:#fff;border-radius:22px;padding:24px}.gb-modal-card h2{margin-top:0;color:#064e45}.gb-modal-card label{display:grid;gap:6px;margin:12px 0;font-weight:900}.gb-modal-card select,.gb-modal-card textarea{border:1px solid #cfe1dc;border-radius:12px;padding:11px;font:inherit}@media(max-width:760px){.gb-grid{grid-template-columns:1fr 1fr}.gb-card-top{flex-direction:column}}@media(max-width:480px){.gb-grid{grid-template-columns:1fr}.gb-hero h1{font-size:34px}}
`;
