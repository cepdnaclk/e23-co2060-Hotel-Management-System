import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Compass,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
} from "lucide-react";

import "../../styles/partnerLanding.css";

const listingTypes = [
  {
    icon: Building2,
    title: "Hotels & Stays",
    text: "List a hotel, resort, villa, or guesthouse with rooms, photos, and pricing.",
  },
  {
    icon: CalendarDays,
    title: "Tourism Events",
    text: "Promote festivals, tours, food walks, or experiences tourists can join.",
  },
  {
    icon: Compass,
    title: "Tourist Guide Services",
    text: "Offer your services as a local guide with your languages and specialities.",
  },
];

const steps = [
  {
    icon: UserRoundPlus,
    number: "01",
    title: "Register as Partner",
    text: "Create your partner account with your business details.",
  },
  {
    icon: Building2,
    number: "02",
    title: "Add What You Offer",
    text: "List a property, register a tourism event, or set up your tourist guide profile.",
  },
  {
    icon: CheckCircle2,
    number: "03",
    title: "Admin Approval",
    text: "Your listing becomes visible to tourists after admin approval.",
  },
];

function ListYourPropertyPage() {
  return (
    <main className="partner-landing-page">
      <section className="partner-landing-hero">
        <div className="partner-landing-hero-art" aria-hidden="true">
          <span className="partner-landing-orb partner-landing-orb-one" />
          <span className="partner-landing-orb partner-landing-orb-two" />

          <div className="partner-landing-watermark partner-landing-watermark-building">
            <Building2 strokeWidth={1.25} />
          </div>

          <div className="partner-landing-watermark partner-landing-watermark-calendar">
            <CalendarDays strokeWidth={1.25} />
          </div>

          <div className="partner-landing-watermark partner-landing-watermark-compass">
            <Compass strokeWidth={1.25} />
          </div>

          <span className="partner-landing-route-line partner-landing-route-line-one" />
          <span className="partner-landing-route-line partner-landing-route-line-two" />
          <span className="partner-landing-route-dot partner-landing-route-dot-one" />
          <span className="partner-landing-route-dot partner-landing-route-dot-two" />
          <span className="partner-landing-route-dot partner-landing-route-dot-three" />
        </div>

        <div className="partner-landing-hero-copy">
          <span className="partner-landing-kicker">TRIPLANKA · PARTNERS</span>

          <h1>
            Grow your tourism business with <span>TripLanka.</span>
          </h1>

          <p>
            Register your hotel, resort, villa, guesthouse, tourism event, or tourist guide service and connect with travellers exploring Sri Lanka.
          </p>

          <div className="partner-landing-hero-actions">
            <Link to="/partner/register" className="partner-landing-primary-button">
              Register Partner
              <ArrowRight size={17} />
            </Link>

            <Link to="/partner/login" className="partner-landing-secondary-button">
              <LogIn size={16} />
              Partner Login
            </Link>
          </div>

          <div className="partner-landing-hero-tags" aria-label="Partner opportunities">
            <span>Hotels & stays</span>
            <span>Tourism events</span>
            <span>Guide services</span>
          </div>
        </div>

        <aside className="partner-landing-hero-panel">
          <div className="partner-landing-panel-heading">
            <span>PARTNER OPPORTUNITIES</span>
            <strong>Choose what you offer</strong>
          </div>

          <div className="partner-landing-panel-list">
            {listingTypes.map((item) => {
              const Icon = item.icon;

              return (
                <div className="partner-landing-panel-item" key={item.title}>
                  <div className="partner-landing-panel-icon">
                    <Icon size={19} strokeWidth={2} />
                  </div>

                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="partner-landing-section">
        <div className="partner-landing-section-heading">
          <div>
            <span className="partner-landing-section-kicker">LIST WITH TRIPLANKA</span>
            <h2>What you can list</h2>
          </div>

          <p>One partner account, three ways to reach tourists.</p>
        </div>

        <div className="partner-landing-listing-grid">
          {listingTypes.map((item, index) => {
            const Icon = item.icon;

            return (
              <article className="partner-landing-listing-card" key={item.title}>
                <div className="partner-landing-card-topline">
                  <div className="partner-landing-listing-icon">
                    <Icon size={23} strokeWidth={2} />
                  </div>

                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>

                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="partner-landing-section partner-landing-process-section">
        <div className="partner-landing-section-heading">
          <div>
            <span className="partner-landing-section-kicker">GET STARTED</span>
            <h2>Simple partner setup</h2>
          </div>

          <p>Create your account, add your service, and submit it for approval.</p>
        </div>

        <div className="partner-landing-process-grid">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article className="partner-landing-process-card" key={step.title}>
                <div className="partner-landing-process-number">{step.number}</div>

                <div className="partner-landing-process-icon">
                  <Icon size={22} strokeWidth={2} />
                </div>

                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="partner-landing-approval-note">
          <div className="partner-landing-approval-icon">
            <ShieldCheck size={23} strokeWidth={2} />
          </div>

          <div className="partner-landing-approval-copy">
            <span>APPROVAL</span>
            <strong>Listings are reviewed before going live.</strong>
            <p>
              New listings are saved as <b>Pending</b> and appear on tourist-facing pages after admin approval.
            </p>
          </div>

          <Sparkles className="partner-landing-approval-mark" size={26} strokeWidth={1.6} aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}

export default ListYourPropertyPage;
