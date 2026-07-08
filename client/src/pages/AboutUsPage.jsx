import { Link } from "react-router-dom";

const platformModules = [
  {
    icon: "🏨",
    title: "Verified Hotels",
    text: "Tourists can search approved hotels, view rooms, compare stay details, and continue to booking smoothly.",
  },
  {
    icon: "🧭",
    title: "Explore Sri Lanka",
    text: "Beautiful destination pages help travelers discover heritage sites, beaches, nature, and city attractions.",
  },
  {
    icon: "🗺️",
    title: "Trip Planner",
    text: "Travelers can organize destinations into a day-by-day route and plan stays near each city.",
  },
  {
    icon: "🎉",
    title: "Events",
    text: "Approved events are displayed with useful details, location information, and directions for visitors.",
  },
  {
    icon: "🧑‍✈️",
    title: "Tourist Guides",
    text: "Local partners can register as tourist guides, and admins can approve trusted guider profiles.",
  },
  {
    icon: "🛡️",
    title: "Admin Control",
    text: "Admins can review hotels, events, and guide registrations before they appear publicly.",
  },
];

const userFlows = [
  {
    number: "01",
    title: "Tourists",
    text: "Discover places, find hotels, plan trips, view events, and connect with tourist guides from one platform.",
  },
  {
    number: "02",
    title: "Partners",
    text: "Register properties, create events, add guide details, and manage submitted services through the partner dashboard.",
  },
  {
    number: "03",
    title: "Admins",
    text: "Approve or reject submitted hotels, events, and guide profiles to keep the platform reliable and organized.",
  },
];

const values = [
  "Reliable travel information",
  "Simple booking workflow",
  "Support for local partners",
  "Professional admin approval",
  "Better tourist experience",
];

const teamMembers = [
  {
    name: "Anushka W.L.K.",
    role: "Frontend / Full-stack Development",
    text: "Focused on user interfaces, page flow, API integration, and core platform development.",
  },
  {
    name: "Anusara K.A.A.I.",
    role: "Database Design / Backend Support",
    text: "Focused on database structure, backend support, and data organization for the system.",
  },
  {
    name: "Lakshani R.M.K.S.",
    role: "Testing / Documentation / Database Support",
    text: "Focused on testing, documentation support, and database-related project work.",
  },
];

function AboutUsPage() {
  return (
    <main className="about-pro-page">
      <style>{aboutCss}</style>

      <section className="about-hero-section">
        <div className="about-hero-bg about-hero-bg-one" />
        <div className="about-hero-bg about-hero-bg-two" />

        <div className="about-hero-inner">
          <div className="about-hero-content">
            <span className="about-eyebrow">About TourismHub LK</span>
            <h1>Connecting tourists, hotels, events, and trusted local guides in Sri Lanka.</h1>
            <p>
              TourismHub LK is a smart hotel and tourism management system designed to make
              travel planning easier, safer, and more organized. The platform brings tourists,
              partners, and admins together through one modern web-based solution.
            </p>

            <div className="about-hero-actions">
              <Link to="/explore" className="about-primary-btn">Start exploring</Link>
              <Link to="/list-your-property" className="about-secondary-btn">Become a partner</Link>
            </div>
          </div>

          <div className="about-hero-panel" aria-label="Platform summary">
            <div className="about-panel-top">
              <span>🌴</span>
              <div>
                <strong>TourismHub LK</strong>
                <small>Smart Hotel & Tourism Management System</small>
              </div>
            </div>

            <div className="about-mini-map">
              <span className="map-dot dot-one" />
              <span className="map-dot dot-two" />
              <span className="map-dot dot-three" />
              <span className="route-line line-one" />
              <span className="route-line line-two" />
              <div className="map-card map-card-one">Hotels</div>
              <div className="map-card map-card-two">Events</div>
              <div className="map-card map-card-three">Guides</div>
            </div>

            <div className="about-quick-stats">
              <div>
                <strong>3</strong>
                <span>User roles</span>
              </div>
              <div>
                <strong>6+</strong>
                <span>Main modules</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Admin review</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section about-intro-section">
        <div className="about-section-heading">
          <span>Our purpose</span>
          <h2>Why we built this platform</h2>
        </div>

        <div className="about-intro-grid">
          <div className="about-story-card">
            <h3>Problem we address</h3>
            <p>
              Travelers often need to use different sources to find hotels, tourist places,
              events, guides, and route plans. This can make trip planning time-consuming and
              confusing, especially when information is scattered or not verified.
            </p>
          </div>

          <div className="about-story-card highlighted-card">
            <h3>Our solution</h3>
            <p>
              TourismHub LK combines major tourism services into one platform. Tourists get a
              simple travel experience, partners get a professional way to publish services, and
              admins can review submissions before they become visible to the public.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section about-modules-section">
        <div className="about-section-heading centered-heading">
          <span>Platform features</span>
          <h2>What TourismHub LK offers</h2>
          <p>
            The system is designed as a complete travel support platform with tourist-facing,
            partner-facing, and admin-facing features.
          </p>
        </div>

        <div className="about-module-grid">
          {platformModules.map((module) => (
            <article className="about-module-card" key={module.title}>
              <div className="about-module-icon">{module.icon}</div>
              <h3>{module.title}</h3>
              <p>{module.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section about-flow-section">
        <div className="about-flow-card">
          <div className="about-section-heading light-heading">
            <span>How it works</span>
            <h2>One platform. Three clear workflows.</h2>
          </div>

          <div className="about-flow-grid">
            {userFlows.map((flow) => (
              <article className="about-flow-item" key={flow.title}>
                <strong>{flow.number}</strong>
                <h3>{flow.title}</h3>
                <p>{flow.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-values-section">
        <div className="about-values-left">
          <span className="about-eyebrow dark-eyebrow">Our values</span>
          <h2>Built for a better Sri Lankan travel experience.</h2>
          <p>
            Our goal is to support tourists with clear information while helping Sri Lankan
            tourism partners promote their services in a trusted digital environment.
          </p>
          <Link to="/tourist-guides" className="about-text-link">Meet tourist guides →</Link>
        </div>

        <div className="about-values-list">
          {values.map((value) => (
            <div className="about-value-row" key={value}>
              <span>✓</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section about-tech-section">
        <div className="about-tech-card">
          <div>
            <span className="about-eyebrow">Technology</span>
            <h2>Modern full-stack web development</h2>
            <p>
              The project is developed using a React frontend, Node.js and Express backend,
              and a MySQL database. The system is structured to support API integration,
              partner dashboards, admin approvals, and future deployment.
            </p>
          </div>

          <div className="about-tech-tags">
            <span>React</span>
            <span>Vite</span>
            <span>Node.js</span>
            <span>Express</span>
            <span>MySQL</span>
            <span>REST API</span>
            <span>GitHub</span>
            <span>Responsive UI</span>
          </div>
        </div>
      </section>

      <section className="about-section about-team-section">
        <div className="about-section-heading centered-heading">
          <span>Project team</span>
          <h2>Developed as a university semester project</h2>
          <p>
            The project team worked on frontend development, backend support, database design,
            testing, and documentation to build a complete tourism platform.
          </p>
        </div>

        <div className="about-team-grid">
          {teamMembers.map((member) => (
            <article className="about-team-card" key={member.name}>
              <div className="about-avatar">{member.name.charAt(0)}</div>
              <h3>{member.name}</h3>
              <span>{member.role}</span>
              <p>{member.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-final-cta">
        <div>
          <span>Ready to travel smarter?</span>
          <h2>Explore Sri Lanka with hotels, events, guides, and trip planning in one place.</h2>
        </div>
        <div className="about-final-actions">
          <Link to="/hotels">Find hotels</Link>
          <Link to="/events">View events</Link>
        </div>
      </section>
    </main>
  );
}

const aboutCss = `
  .about-pro-page {
    width: 100%;
    min-height: 100vh;
    overflow: hidden;
    background:
      radial-gradient(circle at 8% 6%, rgba(20, 184, 166, 0.16), transparent 28rem),
      radial-gradient(circle at 92% 18%, rgba(217, 154, 20, 0.13), transparent 24rem),
      linear-gradient(135deg, #f8f4ea 0%, #ffffff 46%, #effdfb 100%);
    color: #0f172a;
    text-align: left;
  }

  .about-hero-section {
    position: relative;
    padding: clamp(52px, 7vw, 96px) 24px 56px;
  }

  .about-hero-bg {
    position: absolute;
    border-radius: 999px;
    filter: blur(4px);
    opacity: 0.8;
    pointer-events: none;
  }

  .about-hero-bg-one {
    width: 340px;
    height: 340px;
    top: 58px;
    right: -90px;
    background: rgba(20, 184, 166, 0.18);
  }

  .about-hero-bg-two {
    width: 260px;
    height: 260px;
    bottom: 20px;
    left: -80px;
    background: rgba(245, 158, 11, 0.16);
  }

  .about-hero-inner,
  .about-section,
  .about-final-cta {
    width: min(1180px, 100%);
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .about-hero-inner {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.72fr);
    gap: 34px;
    align-items: center;
  }

  .about-eyebrow,
  .about-section-heading span {
    display: inline-flex;
    align-items: center;
    width: max-content;
    max-width: 100%;
    border-radius: 999px;
    padding: 9px 14px;
    background: #087568;
    color: #ffffff;
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 12px 26px rgba(8, 117, 104, 0.18);
  }

  .dark-eyebrow {
    background: #0f172a;
  }

  .about-hero-content h1 {
    max-width: 780px;
    margin: 18px 0 18px;
    color: #071827;
    font-size: clamp(44px, 6.4vw, 82px);
    line-height: 0.96;
    letter-spacing: -0.065em;
    font-weight: 950;
  }

  .about-hero-content p {
    max-width: 760px;
    color: #435062;
    font-size: clamp(16px, 1.7vw, 20px);
    line-height: 1.8;
    font-weight: 650;
  }

  .about-hero-actions,
  .about-final-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 28px;
  }

  .about-primary-btn,
  .about-secondary-btn,
  .about-final-actions a {
    min-height: 50px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 0 22px;
    font-size: 14px;
    font-weight: 950;
    text-decoration: none;
    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  }

  .about-primary-btn,
  .about-final-actions a:first-child {
    background: linear-gradient(135deg, #087568, #10a38f);
    color: #ffffff;
    box-shadow: 0 18px 36px rgba(8, 117, 104, 0.24);
  }

  .about-secondary-btn,
  .about-final-actions a:last-child {
    background: #ffffff;
    color: #087568;
    border: 1px solid rgba(8, 117, 104, 0.22);
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
  }

  .about-primary-btn:hover,
  .about-secondary-btn:hover,
  .about-final-actions a:hover {
    transform: translateY(-2px);
  }

  .about-hero-panel {
    position: relative;
    min-height: 500px;
    border-radius: 34px;
    padding: 22px;
    background:
      linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(240, 253, 250, 0.94)),
      radial-gradient(circle at 50% 35%, rgba(20, 184, 166, 0.2), transparent 18rem);
    border: 1px solid rgba(8, 117, 104, 0.16);
    box-shadow: 0 30px 80px rgba(15, 23, 42, 0.12);
    overflow: hidden;
  }

  .about-hero-panel::before {
    content: "";
    position: absolute;
    inset: 18px;
    border: 1px dashed rgba(8, 117, 104, 0.28);
    border-radius: 28px;
    pointer-events: none;
  }

  .about-panel-top {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 22px;
    background: #ffffff;
    border: 1px solid #d9f3ef;
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
  }

  .about-panel-top > span {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    background: linear-gradient(135deg, #dffcf7, #fff5d7);
    font-size: 26px;
  }

  .about-panel-top strong,
  .about-panel-top small {
    display: block;
  }

  .about-panel-top strong {
    color: #073c37;
    font-size: 18px;
    font-weight: 950;
  }

  .about-panel-top small {
    margin-top: 3px;
    color: #64748b;
    font-size: 12px;
    font-weight: 750;
  }

  .about-mini-map {
    position: relative;
    height: 300px;
    margin-top: 20px;
    border-radius: 28px;
    background:
      linear-gradient(90deg, rgba(8, 117, 104, 0.07) 1px, transparent 1px),
      linear-gradient(rgba(8, 117, 104, 0.07) 1px, transparent 1px),
      linear-gradient(135deg, #f9fffd, #eefbf8);
    background-size: 34px 34px, 34px 34px, auto;
    border: 1px solid #d9f3ef;
    overflow: hidden;
  }

  .map-dot {
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #087568;
    border: 4px solid #ffffff;
    box-shadow: 0 0 0 7px rgba(8, 117, 104, 0.13), 0 12px 24px rgba(8, 117, 104, 0.22);
    z-index: 3;
  }

  .dot-one { left: 18%; top: 30%; }
  .dot-two { right: 22%; top: 44%; background: #d99a14; box-shadow: 0 0 0 7px rgba(217, 154, 20, 0.16), 0 12px 24px rgba(217, 154, 20, 0.22); }
  .dot-three { left: 42%; bottom: 20%; background: #0284c7; box-shadow: 0 0 0 7px rgba(2, 132, 199, 0.14), 0 12px 24px rgba(2, 132, 199, 0.2); }

  .route-line {
    position: absolute;
    height: 4px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(8, 117, 104, 0.4), rgba(217, 154, 20, 0.45));
    transform-origin: left center;
    z-index: 2;
  }

  .line-one { width: 48%; left: 20%; top: 36%; transform: rotate(11deg); }
  .line-two { width: 32%; right: 25%; top: 55%; transform: rotate(128deg); }

  .map-card {
    position: absolute;
    z-index: 4;
    min-width: 94px;
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: #ffffff;
    border: 1px solid #d9f3ef;
    color: #083f3b;
    font-size: 12px;
    font-weight: 950;
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.1);
  }

  .map-card-one { left: 10%; top: 14%; }
  .map-card-two { right: 10%; top: 27%; }
  .map-card-three { left: 34%; bottom: 10%; }

  .about-quick-stats {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 14px;
  }

  .about-quick-stats div {
    padding: 16px 10px;
    border-radius: 20px;
    background: #ffffff;
    border: 1px solid #d9f3ef;
    text-align: center;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  }

  .about-quick-stats strong,
  .about-quick-stats span {
    display: block;
  }

  .about-quick-stats strong {
    color: #087568;
    font-size: 26px;
    font-weight: 950;
    line-height: 1;
  }

  .about-quick-stats span {
    margin-top: 6px;
    color: #64748b;
    font-size: 11px;
    font-weight: 850;
  }

  .about-section {
    padding: 60px 24px;
  }

  .about-section-heading {
    margin-bottom: 28px;
  }

  .about-section-heading h2,
  .about-values-left h2,
  .about-tech-card h2,
  .about-final-cta h2 {
    margin: 14px 0 0;
    color: #071827;
    font-size: clamp(32px, 4vw, 52px);
    line-height: 1.02;
    letter-spacing: -0.055em;
    font-weight: 950;
  }

  .centered-heading {
    max-width: 760px;
    margin-inline: auto;
    text-align: center;
  }

  .centered-heading span {
    margin-inline: auto;
  }

  .centered-heading p,
  .about-values-left p,
  .about-tech-card p {
    margin-top: 14px;
    color: #5c6879;
    font-size: 16px;
    line-height: 1.75;
    font-weight: 650;
  }

  .about-intro-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .about-story-card,
  .about-module-card,
  .about-team-card {
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(8, 117, 104, 0.13);
    box-shadow: 0 20px 55px rgba(15, 23, 42, 0.08);
  }

  .about-story-card {
    padding: clamp(24px, 3vw, 34px);
  }

  .highlighted-card {
    background: linear-gradient(135deg, #087568, #10a38f);
    color: #ffffff;
    border-color: transparent;
  }

  .about-story-card h3,
  .about-module-card h3,
  .about-flow-item h3,
  .about-team-card h3 {
    margin: 0 0 10px;
    color: #073c37;
    font-size: 22px;
    line-height: 1.12;
    letter-spacing: -0.025em;
    font-weight: 950;
  }

  .highlighted-card h3 {
    color: #ffffff;
  }

  .about-story-card p,
  .about-module-card p,
  .about-flow-item p,
  .about-team-card p {
    margin: 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.75;
    font-weight: 650;
  }

  .highlighted-card p {
    color: rgba(255, 255, 255, 0.86);
  }

  .about-module-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .about-module-card {
    position: relative;
    min-height: 230px;
    padding: 24px;
    overflow: hidden;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .about-module-card::after {
    content: "";
    position: absolute;
    right: -38px;
    bottom: -38px;
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: rgba(20, 184, 166, 0.1);
  }

  .about-module-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 26px 70px rgba(15, 23, 42, 0.12);
  }

  .about-module-icon {
    width: 54px;
    height: 54px;
    display: grid;
    place-items: center;
    margin-bottom: 18px;
    border-radius: 18px;
    background: linear-gradient(135deg, #e0fbf7, #fff4cf);
    font-size: 25px;
  }

  .about-flow-card {
    border-radius: 36px;
    padding: clamp(26px, 4vw, 46px);
    background:
      radial-gradient(circle at 15% 18%, rgba(20, 184, 166, 0.18), transparent 19rem),
      linear-gradient(135deg, #071827, #073c37 60%, #087568);
    box-shadow: 0 26px 70px rgba(15, 23, 42, 0.18);
  }

  .light-heading span {
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
    box-shadow: none;
  }

  .light-heading h2 {
    color: #ffffff;
  }

  .about-flow-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .about-flow-item {
    padding: 24px;
    border-radius: 26px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.14);
    backdrop-filter: blur(12px);
  }

  .about-flow-item strong {
    display: inline-flex;
    margin-bottom: 18px;
    color: #facc15;
    font-size: 14px;
    font-weight: 950;
    letter-spacing: 0.08em;
  }

  .about-flow-item h3 {
    color: #ffffff;
  }

  .about-flow-item p {
    color: rgba(255, 255, 255, 0.78);
  }

  .about-values-section {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(320px, 0.75fr);
    gap: 28px;
    align-items: center;
  }

  .about-text-link {
    display: inline-flex;
    margin-top: 22px;
    color: #087568;
    font-size: 15px;
    font-weight: 950;
    text-decoration: none;
  }

  .about-values-list {
    display: grid;
    gap: 12px;
  }

  .about-value-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    border-radius: 20px;
    background: #ffffff;
    border: 1px solid #d9f3ef;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  }

  .about-value-row span {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: #dffcf7;
    color: #087568;
    font-weight: 950;
  }

  .about-value-row strong {
    color: #172033;
    font-size: 15px;
    font-weight: 900;
  }

  .about-tech-card {
    display: grid;
    grid-template-columns: minmax(0, 0.86fr) minmax(340px, 0.78fr);
    gap: 28px;
    align-items: center;
    padding: clamp(26px, 4vw, 42px);
    border-radius: 34px;
    background: linear-gradient(135deg, #fffaf0, #ffffff 46%, #eafdf9);
    border: 1px solid rgba(8, 117, 104, 0.13);
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.09);
  }

  .about-tech-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }

  .about-tech-tags span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    border-radius: 999px;
    padding: 0 16px;
    background: #ffffff;
    color: #073c37;
    border: 1px solid #d9f3ef;
    font-size: 13px;
    font-weight: 950;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  }

  .about-team-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .about-team-card {
    padding: 26px;
    text-align: center;
  }

  .about-avatar {
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
    margin: 0 auto 16px;
    border-radius: 22px;
    background: linear-gradient(135deg, #087568, #14b8a6);
    color: #ffffff;
    font-size: 26px;
    font-weight: 950;
    box-shadow: 0 16px 32px rgba(8, 117, 104, 0.22);
  }

  .about-team-card span {
    display: inline-flex;
    min-height: 30px;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 0 12px;
    margin-bottom: 14px;
    background: #effdfb;
    color: #087568;
    font-size: 12px;
    font-weight: 950;
  }

  .about-final-cta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    margin-bottom: 76px;
    padding: clamp(26px, 4vw, 44px);
    border-radius: 36px;
    background:
      radial-gradient(circle at 85% 20%, rgba(250, 204, 21, 0.18), transparent 18rem),
      linear-gradient(135deg, #073c37, #087568);
    color: #ffffff;
    box-shadow: 0 28px 70px rgba(8, 117, 104, 0.25);
  }

  .about-final-cta span {
    display: inline-flex;
    color: #facc15;
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .about-final-cta h2 {
    max-width: 760px;
    color: #ffffff;
  }

  .about-final-actions {
    margin-top: 0;
    flex: 0 0 auto;
  }

  .about-final-actions a:first-child {
    background: #ffffff;
    color: #087568;
    box-shadow: none;
  }

  .about-final-actions a:last-child {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.26);
    box-shadow: none;
  }

  @media (max-width: 980px) {
    .about-hero-inner,
    .about-values-section,
    .about-tech-card,
    .about-final-cta {
      grid-template-columns: 1fr;
    }

    .about-hero-inner {
      gap: 24px;
    }

    .about-hero-panel {
      min-height: 430px;
    }

    .about-module-grid,
    .about-flow-grid,
    .about-team-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .about-final-cta {
      display: grid;
    }

    .about-tech-tags {
      justify-content: flex-start;
    }
  }

  @media (max-width: 680px) {
    .about-hero-section {
      padding: 40px 16px 34px;
    }

    .about-section {
      padding: 44px 16px;
    }

    .about-hero-content h1 {
      font-size: 42px;
    }

    .about-intro-grid,
    .about-module-grid,
    .about-flow-grid,
    .about-team-grid {
      grid-template-columns: 1fr;
    }

    .about-hero-panel {
      min-height: 390px;
      padding: 16px;
      border-radius: 28px;
    }

    .about-mini-map {
      height: 238px;
    }

    .about-quick-stats {
      grid-template-columns: 1fr;
    }

    .about-final-cta {
      margin: 0 16px 52px;
      width: auto;
    }

    .about-primary-btn,
    .about-secondary-btn,
    .about-final-actions a {
      width: 100%;
    }
  }
`;

export default AboutUsPage;
