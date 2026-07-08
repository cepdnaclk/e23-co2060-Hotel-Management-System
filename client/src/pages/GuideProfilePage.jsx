import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  Copy,
  CreditCard,
  HeartHandshake,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import api from "../api/api";
import DemoPaymentModal from "../components/DemoPaymentModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const assetUrl = (url) => {
  if (!url) return "";
  const value = String(url);
  if (value.startsWith("http")) return value;
  return `${SERVER_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

const cleanArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const formatLkr = (amount) => {
  const value = Number(amount || 0);
  if (!value) return "Ask price";
  return `Rs. ${value.toLocaleString("en-LK")}`;
};

const getGuideLocation = (guide) =>
  [guide.city, guide.district].filter(Boolean).join(", ") ||
  guide.base_location ||
  "Sri Lanka";

const makeOfferCards = (guide) => {
  const services = cleanArray(guide.services);
  const specialities = cleanArray(guide.specialities);
  const baseTitle = guide.guide_type || "Local";
  const city = guide.city || "Sri Lanka";

  const cards = [
    {
      title: `${baseTitle} highlights in ${city}`,
      meta: `${formatLkr(guide.price_per_hour)} per hour`,
      duration: "Flexible hours",
      tags: [baseTitle, "Private", "Custom route"],
      description:
        guide.short_description ||
        `Explore ${city} with a verified local guide and a route shaped around your pace.`,
    },
    {
      title: `Full day with ${guide.display_name || "your guide"}`,
      meta: `${formatLkr(guide.price_per_day)} per day`,
      duration: "Full day",
      tags: ["Day trip", "Local insight", "Hotel support"],
      description:
        services.slice(0, 2).join(", ") ||
        "Plan a comfortable full-day experience with local context, timing help, and practical travel support.",
    },
    {
      title: "Personalized Sri Lanka experience",
      meta: "Request offer",
      duration: "Built for you",
      tags: specialities.slice(0, 3).length
        ? specialities.slice(0, 3)
        : ["Personalized", "Private", "Flexible"],
      description:
        "Share your interests, travel dates, group size, and comfort level to request a tailor-made guide plan.",
    },
  ];

  return cards;
};

function GuideProfilePage() {
  const { slug } = useParams();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [reviewSort, setReviewSort] = useState("recent");
  const [guidePaymentOpen, setGuidePaymentOpen] = useState(false);
  const [guidePaymentSuccess, setGuidePaymentSuccess] = useState("");
  const [inquiry, setInquiry] = useState({
    date: "",
    guests: "2",
    interest: "Personalized tour",
  });

  useEffect(() => {
    const loadGuide = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get(`/guides/${slug}`);
        setGuide(response.data.guide || null);
      } catch (err) {
        setError(err.response?.data?.message || "Guide profile not found");
      } finally {
        setLoading(false);
      }
    };

    loadGuide();
  }, [slug]);

  const guideData = guide || {};
  const image = assetUrl(guideData.image_url);
  const languages = useMemo(() => cleanArray(guideData.languages), [guideData.languages]);
  const services = useMemo(() => cleanArray(guideData.services), [guideData.services]);
  const specialities = useMemo(() => cleanArray(guideData.specialities), [guideData.specialities]);
  const offers = useMemo(() => makeOfferCards(guideData), [guideData]);
  const rating = Number(guideData.rating || 4.8).toFixed(1);
  const reviewCount = Number(guideData.total_reviews || 0);
  const whatsappHref = guideData.whatsapp_number
    ? `https://wa.me/${String(guideData.whatsapp_number).replace(/[^0-9]/g, "")}`
    : "";
  const emailSubject = encodeURIComponent(`Guide inquiry for ${guideData.display_name || "Sri Lanka"}`);
  const emailBody = encodeURIComponent(
    `Hi ${guideData.display_name || "there"},\n\nI would like to request a guide experience.\nDate: ${inquiry.date || "Not selected"}\nGuests: ${inquiry.guests}\nInterest: ${inquiry.interest}\n\nThank you.`
  );
  const guideBookingAmount = Number(guideData.price_per_day || guideData.price_per_hour || 0);

  const shareProfile = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${guideData.display_name || "Guide"} on TourismHub LK`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      setCopied(false);
    }
  };

  const confirmGuideBookingPayment = async ({ gateway, card_last4 }) => {
    const receipt = {
      guide_id: guideData.id,
      guide_name: guideData.display_name,
      date: inquiry.date,
      guests: inquiry.guests,
      interest: inquiry.interest,
      amount: guideBookingAmount,
      gateway,
      card_last4,
      paid_at: new Date().toISOString(),
    };

    const current = JSON.parse(localStorage.getItem("tourismhub_guide_payments") || "[]");
    localStorage.setItem("tourismhub_guide_payments", JSON.stringify([receipt, ...current]));
    setGuidePaymentOpen(false);
    setGuidePaymentSuccess("Guide booking payment completed. Contact the guide to confirm meeting details.");
  };

  if (loading) {
    return (
      <main className="guide-profile-page">
        <style>{profileCss}</style>
        <div className="profile-state-card">Loading guide profile...</div>
      </main>
    );
  }

  if (error || !guide) {
    return (
      <main className="guide-profile-page">
        <style>{profileCss}</style>
        <div className="profile-state-card">
          <h1>Guide profile unavailable</h1>
          <p>{error || "This guide profile is not available right now."}</p>
          <Link to="/tourist-guides">Back to Tourist Guides</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="guide-profile-page">
      <style>{profileCss}</style>
      <DemoPaymentModal
        open={guidePaymentOpen}
        title="Guide booking payment"
        description="Select a gateway and enter card details for this demo guide booking payment."
        amount={guideBookingAmount}
        reference={guideData.display_name}
        submitLabel="Pay guide booking"
        onClose={() => setGuidePaymentOpen(false)}
        onConfirm={confirmGuideBookingPayment}
      />

      <section className="guide-profile-hero">
        <div className="guide-profile-breadcrumb">
          <Link to="/tourist-guides">Tourist Guides</Link>
          <span>/</span>
          <span>{guideData.city || "Sri Lanka"}</span>
          <span>/</span>
          <strong>{guideData.display_name}</strong>
        </div>

        <div className="profile-hero-grid">
          <div className="profile-photo-panel">
            {image ? (
              <img src={image} alt={guideData.display_name} />
            ) : (
              <div className="profile-photo-empty">{String(guideData.display_name || "G").slice(0, 1)}</div>
            )}
            {guideData.is_promoted && <span className="profile-top-ad">Top ad</span>}
          </div>

          <div className="profile-hero-copy">
            <span className="profile-kicker">{guideData.guide_type || "Local guide"}</span>
            <h1>{guideData.display_name}</h1>
            <p className="profile-tagline">
              {guideData.short_description ||
                `Private and personalized guide support around ${getGuideLocation(guideData)}.`}
            </p>

            <div className="profile-rating-row">
              <span><Star size={17} fill="currentColor" /> {rating}</span>
              <span>{reviewCount ? `${reviewCount} reviews` : "New verified guide"}</span>
              <span>Responds quickly</span>
            </div>

            <div className="profile-facts">
              <span><MapPin size={17} /> Lives in {guideData.city || "Sri Lanka"}</span>
              <span><Languages size={17} /> Speaks {languages.length ? languages.join(", ") : "languages on request"}</span>
              <span><BadgeCheck size={17} /> Verified local guide</span>
              <span><Clock size={17} /> Response time less than 24 hours</span>
            </div>

            <div className="profile-main-actions">
              {guideData.phone && <a className="primary" href={`tel:${guideData.phone}`}><Phone size={18} /> Book me</a>}
              {whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Contact me</a>}
              {guideData.email && <a href={`mailto:${guideData.email}?subject=${emailSubject}&body=${emailBody}`}><Mail size={18} /> Email</a>}
              <button type="button" onClick={shareProfile}><Copy size={18} /> {copied ? "Copied" : "Share profile"}</button>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-content-grid">
        <div className="profile-main-column">
          <section className="profile-section about-section">
            <div className="section-heading">
              <span>Nice to meet you</span>
              <h2>About {guideData.display_name}</h2>
            </div>
            <p>{guideData.bio || guideData.short_description || "This verified guide has not added a full bio yet."}</p>
            <div className="profile-mini-facts">
              <span><MapPin size={16} /> {getGuideLocation(guideData)}</span>
              <span><Users size={16} /> {Number(guideData.experience_years || 0)} years experience</span>
              <span><CalendarDays size={16} /> {guideData.availability || "Available with prior booking"}</span>
            </div>
          </section>

          <section className="profile-section">
            <div className="section-heading">
              <span>Book one of my offers</span>
              <h2>Private guide experiences in {guideData.city || "Sri Lanka"}</h2>
            </div>
            <div className="offer-grid">
              {offers.map((offer) => (
                <article className="offer-card" key={offer.title}>
                  <div className="offer-icon"><Sparkles size={22} /></div>
                  <div>
                    <h3>{offer.title}</h3>
                    <p>{offer.description}</p>
                    <div className="offer-meta">
                      <span>{offer.meta}</span>
                      <span>{offer.duration}</span>
                    </div>
                    <div className="offer-tags">
                      {offer.tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="profile-section personalize-section">
            <div>
              <span>Customizable</span>
              <h2>Request a personalized guide plan</h2>
              <p>
                Tell the guide what you enjoy, your dates, pickup point, group size, and pace. They can shape a
                private Sri Lanka experience around your travel style.
              </p>
            </div>
            {guideData.email ? (
              <a href={`mailto:${guideData.email}?subject=${emailSubject}&body=${emailBody}`}>Request personalized offer</a>
            ) : (
              <Link to="/trip-planner">Plan trip details</Link>
            )}
          </section>

          <section className="profile-section">
            <div className="section-heading">
              <span>Guide style</span>
              <h2>Services and specialities</h2>
            </div>
            <div className="profile-chip-board">
              {[...specialities, ...services].length ? (
                [...specialities, ...services].map((item) => <span key={item}>{item}</span>)
              ) : (
                <span>Personal local guiding</span>
              )}
            </div>
          </section>

          <section className="profile-section reviews-section">
            <div className="reviews-top">
              <div className="section-heading">
                <span>Guest feedback</span>
                <h2>Reviews</h2>
              </div>
              <label>
                Sort by
                <select value={reviewSort} onChange={(event) => setReviewSort(event.target.value)}>
                  <option value="recent">Most recent</option>
                  <option value="relevant">Most relevant</option>
                  <option value="rating">Highest rating</option>
                </select>
              </label>
            </div>

            <div className="review-summary">
              <strong><Star size={20} fill="currentColor" /> {rating}</strong>
              <span>{reviewCount ? `${reviewCount} public review${reviewCount === 1 ? "" : "s"}` : "No public reviews yet"}</span>
            </div>

            <div className="review-empty">
              <h3>Review collection is ready</h3>
              <p>
                When tourists complete guide experiences, their public reviews can appear here with date,
                rating, trip title, and comments.
              </p>
            </div>
          </section>
        </div>

        <aside className="profile-booking-panel">
          <div className="booking-panel-card">
            <h2>Plan with {guideData.display_name}</h2>
            <p>Send a quick inquiry using the guide contact details.</p>

            <label>
              Date
              <input
                type="date"
                value={inquiry.date}
                onChange={(event) => setInquiry((current) => ({ ...current, date: event.target.value }))}
              />
            </label>
            <label>
              Guests
              <input
                type="number"
                min="1"
                value={inquiry.guests}
                onChange={(event) => setInquiry((current) => ({ ...current, guests: event.target.value }))}
              />
            </label>
            <label>
              Interest
              <select
                value={inquiry.interest}
                onChange={(event) => setInquiry((current) => ({ ...current, interest: event.target.value }))}
              >
                <option>Personalized tour</option>
                <option>City highlights</option>
                <option>Full day trip</option>
                <option>Adventure or nature</option>
                <option>Airport or hotel support</option>
              </select>
            </label>

            <div className="booking-price-grid">
              <div>
                <span>Day price</span>
                <strong>{formatLkr(guideData.price_per_day)}</strong>
              </div>
              <div>
                <span>Hour price</span>
                <strong>{formatLkr(guideData.price_per_hour)}</strong>
              </div>
            </div>

            {guidePaymentSuccess && <div className="guide-payment-success">{guidePaymentSuccess}</div>}

            {guideData.email && (
              <a className="booking-primary" href={`mailto:${guideData.email}?subject=${emailSubject}&body=${emailBody}`}>
                Request guide
              </a>
            )}
            <button
              className="booking-pay-btn"
              type="button"
              onClick={() => setGuidePaymentOpen(true)}
              disabled={guideBookingAmount <= 0}
            >
              Pay guide booking
            </button>
            {whatsappHref && (
              <a className="booking-secondary" href={whatsappHref} target="_blank" rel="noreferrer">
                WhatsApp guide
              </a>
            )}
            <Link className="booking-secondary" to={`/hotels?city=${encodeURIComponent(guideData.city || "")}`}>
              Hotels nearby
            </Link>
            <Link className="booking-trip" to="/trip-planner">
              Add to trip
            </Link>
          </div>

          <div className="trust-stack">
            <div><ShieldCheck size={20} /><span>Verified by admin before public listing</span></div>
            <div><RefreshCcw size={20} /><span>Discuss changes directly with your guide</span></div>
            <div><CreditCard size={20} /><span>Future online checkout can support local and card payments</span></div>
            <div><HeartHandshake size={20} /><span>Private, flexible, locally hosted travel support</span></div>
          </div>
        </aside>
      </section>
    </main>
  );
}

const profileCss = `
.guide-profile-page{min-height:100vh;background:linear-gradient(135deg,#f7fbf7 0%,#fffdf4 48%,#edf8f6 100%);color:#0f2437;font-family:Inter,system-ui,Arial,sans-serif}
.profile-state-card{width:min(780px,calc(100% - 32px));margin:70px auto;background:#fff;border:1px solid #dbece7;border-radius:24px;padding:32px;box-shadow:0 22px 60px rgba(6,78,69,.08)}
.profile-state-card h1{margin:0 0 10px;color:#064e45}.profile-state-card a{display:inline-flex;margin-top:12px;background:#064e45;color:#fff;text-decoration:none;border-radius:14px;padding:12px 16px;font-weight:900}
.guide-profile-hero{padding:34px 24px 42px;background:linear-gradient(135deg,#063f38 0%,#087568 52%,#0b8796 100%);color:#fff}
.guide-profile-breadcrumb{width:min(1180px,100%);margin:0 auto 24px;display:flex;gap:9px;flex-wrap:wrap;align-items:center;color:rgba(255,255,255,.78);font-size:13px;font-weight:800}.guide-profile-breadcrumb a{color:#fff;text-decoration:none}.guide-profile-breadcrumb strong{color:#ffe88a}
.profile-hero-grid{width:min(1180px,100%);margin:0 auto;display:grid;grid-template-columns:390px 1fr;gap:34px;align-items:center}.profile-photo-panel{position:relative;min-height:520px;border-radius:34px;overflow:hidden;background:#0a6358;box-shadow:0 32px 80px rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.22)}.profile-photo-panel img{width:100%;height:100%;min-height:520px;object-fit:cover;display:block}.profile-photo-empty{height:520px;display:grid;place-items:center;font-size:110px;font-weight:1000;background:linear-gradient(135deg,#0a7c6e,#ffc527)}.profile-top-ad{position:absolute;right:18px;bottom:18px;background:#ffc527;color:#063f38;border-radius:999px;padding:10px 14px;font-weight:1000;font-size:12px}
.profile-kicker{display:inline-flex;width:max-content;background:#ffe88a;color:#063f38;border-radius:999px;padding:10px 14px;font-size:12px;font-weight:1000;text-transform:uppercase;letter-spacing:.12em}.profile-hero-copy h1{font-size:clamp(48px,7vw,92px);line-height:.92;margin:22px 0 14px;letter-spacing:-.06em}.profile-tagline{font-size:20px;line-height:1.65;max-width:760px;color:rgba(255,255,255,.9);font-weight:750;margin:0 0 20px}
.profile-rating-row,.profile-facts,.profile-main-actions{display:flex;flex-wrap:wrap;gap:10px}.profile-rating-row span,.profile-facts span{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.24);border-radius:999px;padding:9px 12px;font-weight:900}.profile-rating-row{margin-bottom:16px}.profile-facts{margin-bottom:24px}.profile-main-actions a,.profile-main-actions button{border:none;display:inline-flex;align-items:center;gap:8px;text-decoration:none;border-radius:15px;padding:13px 16px;background:#fff;color:#064e45;font-weight:1000;cursor:pointer}.profile-main-actions .primary{background:#ffc527;color:#063f38}
.profile-content-grid{width:min(1180px,calc(100% - 32px));margin:34px auto 86px;display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:26px;align-items:start}.profile-main-column{display:grid;gap:22px}.profile-section,.booking-panel-card,.trust-stack{background:#fff;border:1px solid #dbece7;border-radius:28px;box-shadow:0 22px 60px rgba(6,78,69,.08)}.profile-section{padding:28px}.section-heading span,.personalize-section span{display:block;color:#c47a00;font-size:12px;font-weight:1000;letter-spacing:.13em;text-transform:uppercase}.section-heading h2,.personalize-section h2{margin:8px 0 0;color:#063f38;font-size:32px;line-height:1.05;letter-spacing:-.04em}.about-section p,.personalize-section p{color:#435368;font-weight:700;line-height:1.8;font-size:16px}.profile-mini-facts{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.profile-mini-facts span{display:inline-flex;align-items:center;gap:7px;background:#f4fbf8;border:1px solid #dbece7;border-radius:999px;padding:9px 12px;color:#064e45;font-weight:900;font-size:13px}
.offer-grid{display:grid;gap:14px;margin-top:20px}.offer-card{display:grid;grid-template-columns:48px 1fr;gap:16px;border:1px solid #dbece7;background:#fbfefd;border-radius:22px;padding:18px}.offer-icon{width:48px;height:48px;border-radius:16px;background:#fff2bd;color:#8a5600;display:grid;place-items:center}.offer-card h3{margin:0 0 8px;color:#064e45;font-size:20px}.offer-card p{margin:0;color:#435368;line-height:1.6;font-weight:700}.offer-meta,.offer-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.offer-meta span{background:#064e45;color:#fff;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:1000}.offer-tags span,.profile-chip-board span{background:#f8f5ec;color:#25364a;border-radius:999px;padding:8px 11px;font-size:12px;font-weight:900}
.personalize-section{display:flex;gap:20px;justify-content:space-between;align-items:center;background:#fff7d8;border-color:#f5d76e}.personalize-section a{flex:0 0 auto;background:#064e45;color:#fff;text-decoration:none;border-radius:15px;padding:13px 16px;font-weight:1000}.profile-chip-board{display:flex;gap:9px;flex-wrap:wrap;margin-top:20px}
.reviews-top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.reviews-top label{display:grid;gap:7px;color:#64748b;font-size:12px;font-weight:1000;text-transform:uppercase}.reviews-top select{border:1px solid #dbece7;border-radius:14px;padding:10px 12px;font-weight:850;color:#102033;background:#fff}.review-summary{display:flex;align-items:center;gap:12px;margin-top:18px;background:#f6fbf8;border:1px solid #dbece7;border-radius:18px;padding:14px}.review-summary strong{display:inline-flex;align-items:center;gap:7px;color:#9a5b00}.review-summary span{font-weight:850;color:#435368}.review-empty{margin-top:14px;border:1px dashed #bddbd3;border-radius:20px;padding:20px;color:#64748b}.review-empty h3{margin:0 0 8px;color:#064e45}.review-empty p{margin:0;line-height:1.6;font-weight:750}
.profile-booking-panel{position:sticky;top:92px;display:grid;gap:16px}.booking-panel-card{padding:22px}.booking-panel-card h2{margin:0 0 8px;color:#063f38;font-size:25px;letter-spacing:-.035em}.booking-panel-card p{margin:0 0 18px;color:#64748b;font-weight:750;line-height:1.55}.booking-panel-card label{display:grid;gap:7px;margin-bottom:13px;color:#334155;font-size:12px;font-weight:1000;text-transform:uppercase}.booking-panel-card input,.booking-panel-card select{width:100%;border:1px solid #d5e7e2;border-radius:14px;padding:12px 13px;font-weight:850;color:#102033;background:#fff}.booking-price-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}.booking-price-grid div{background:#f6fbf8;border:1px solid #dbece7;border-radius:16px;padding:12px}.booking-price-grid span{display:block;color:#64748b;font-size:11px;font-weight:1000;text-transform:uppercase}.booking-price-grid strong{display:block;margin-top:6px;color:#064e45;font-size:14px}.guide-payment-success{background:#dcfce7;border:1px solid #86efac;color:#166534;border-radius:15px;padding:12px 13px;font-size:13px;font-weight:900;line-height:1.45;margin-bottom:12px}.booking-primary,.booking-secondary,.booking-trip,.booking-pay-btn{display:flex;justify-content:center;text-decoration:none;border-radius:15px;padding:13px 16px;font-weight:1000}.booking-primary{background:#064e45;color:#fff}.booking-pay-btn{width:100%;border:none;background:#0b63ce;color:#fff;margin-top:9px;cursor:pointer}.booking-pay-btn:disabled{opacity:.58;cursor:not-allowed}.booking-secondary{margin-top:9px;background:#fff;border:1px solid #d5e7e2;color:#064e45}.booking-trip{margin-top:9px;background:#ffc527;color:#063f38}
.trust-stack{padding:16px;display:grid;gap:10px}.trust-stack div{display:flex;gap:10px;align-items:flex-start;background:#f6fbf8;border:1px solid #dbece7;border-radius:16px;padding:12px;color:#064e45}.trust-stack span{color:#334155;font-weight:800;line-height:1.45;font-size:13px}
@media(max-width:980px){.profile-hero-grid,.profile-content-grid{grid-template-columns:1fr}.profile-photo-panel,.profile-photo-panel img,.profile-photo-empty{min-height:420px}.profile-booking-panel{position:static}.personalize-section{align-items:flex-start;flex-direction:column}}
@media(max-width:620px){.guide-profile-hero{padding:24px 14px 34px}.profile-content-grid{width:calc(100% - 24px);margin-top:24px}.profile-photo-panel,.profile-photo-panel img,.profile-photo-empty{min-height:340px}.profile-section{padding:21px}.profile-main-actions a,.profile-main-actions button{width:100%;justify-content:center}.profile-rating-row span,.profile-facts span{width:100%;border-radius:16px}.reviews-top{flex-direction:column}.booking-price-grid{grid-template-columns:1fr}.profile-hero-copy h1{font-size:44px}}
`;

export default GuideProfilePage;
