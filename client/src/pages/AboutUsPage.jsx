import { Link } from "react-router-dom";

function AboutUsPage() {
  return (
    <main className="about-page">
      <style>{aboutCss}</style>
      <section className="about-card">
        <span>About TourismHub LK</span>
        <h1>Smart hotel and tourism management for Sri Lanka.</h1>
        <p>
          TourismHub LK is a university semester project that connects tourists, hotel partners,
          and platform admins in one web-based system. It supports hotel booking, trip planning,
          events, tourist guide discovery, property management, and admin hotel approval.
        </p>
        <div className="about-actions">
          <Link to="/hotels">Search hotels</Link>
          <Link to="/list-your-property">List your property</Link>
        </div>
      </section>
    </main>
  );
}

const aboutCss = `
  .about-page { min-height: 100vh; display: grid; place-items: center; padding: 64px 18px; background: linear-gradient(135deg, #f8f4ea, #ffffff 54%, #ecfdf5); }
  .about-card { width: min(900px, 100%); background: white; border: 1px solid #d1fae5; border-radius: 32px; padding: clamp(28px, 5vw, 56px); box-shadow: 0 25px 70px rgba(15,23,42,0.1); }
  .about-card span { display: inline-flex; background: #0b4b45; color: white; border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 950; text-transform: uppercase; }
  .about-card h1 { margin: 16px 0 14px; color: #083f3b; font-size: clamp(38px, 5vw, 64px); line-height: 1; letter-spacing: -0.05em; }
  .about-card p { color: #64748b; font-size: 17px; line-height: 1.8; font-weight: 700; }
  .about-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
  .about-actions a { min-height: 46px; display: inline-flex; align-items: center; justify-content: center; border-radius: 14px; padding: 0 20px; text-decoration: none; font-weight: 950; }
  .about-actions a:first-child { background: #0f766e; color: white; }
  .about-actions a:last-child { background: #e5a514; color: #172033; }
`;

export default AboutUsPage;
