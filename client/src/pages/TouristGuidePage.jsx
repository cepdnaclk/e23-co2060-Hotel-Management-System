import { Link } from "react-router-dom";

const guides = [
  { name: "Cultural Heritage Guide", city: "Kandy / Sigiriya", icon: "🏛️", specialty: "Temples, UNESCO sites, history routes" },
  { name: "Wildlife Safari Guide", city: "Yala / Udawalawe", icon: "🐆", specialty: "Safari planning, nature safety, bird watching" },
  { name: "Adventure & Hiking Guide", city: "Ella / Nuwara Eliya", icon: "⛰️", specialty: "Hikes, waterfalls, scenic train routes" },
  { name: "City Food Guide", city: "Colombo / Galle", icon: "🍛", specialty: "Street food, markets, local culture" },
];

function TouristGuidePage() {
  return (
    <main className="guides-page">
      <style>{guideCss}</style>
      <section className="guide-hero">
        <span>Tourist Guides</span>
        <h1>Select trusted guide support for a smoother Sri Lankan journey.</h1>
        <p>
          Guide booking can be a future enhancement. For the current project, this page gives a clear entry point
          for tourists who want local guidance connected to destinations and hotels.
        </p>
      </section>

      <section className="guide-grid">
        {guides.map((guide) => (
          <article className="guide-card" key={guide.name}>
            <div className="guide-icon">{guide.icon}</div>
            <h2>{guide.name}</h2>
            <p>{guide.specialty}</p>
            <span>{guide.city}</span>
            <Link to="/trip-planner">Add guide idea to trip →</Link>
          </article>
        ))}
      </section>
    </main>
  );
}

const guideCss = `
  .guides-page { min-height: 100vh; padding: 64px 18px; background: linear-gradient(135deg, #f8f4ea, #ffffff 54%, #ecfdf5); color: #172033; }
  .guide-hero, .guide-grid { width: min(1180px, 100%); margin: 0 auto; }
  .guide-hero span { display: inline-flex; background: #0b4b45; color: white; border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 950; text-transform: uppercase; }
  .guide-hero h1 { margin: 16px 0 12px; max-width: 860px; color: #083f3b; font-size: clamp(36px, 5vw, 60px); line-height: 1; letter-spacing: -0.05em; }
  .guide-hero p { max-width: 760px; color: #64748b; line-height: 1.8; font-weight: 700; }
  .guide-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-top: 34px; }
  .guide-card { background: white; border: 1px solid #d1fae5; border-radius: 24px; padding: 22px; box-shadow: 0 18px 42px rgba(15,23,42,0.08); }
  .guide-icon { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 16px; background: #ecfdf5; font-size: 28px; }
  .guide-card h2 { color: #083f3b; margin: 16px 0 8px; }
  .guide-card p { color: #64748b; line-height: 1.6; font-weight: 700; }
  .guide-card span { display: block; color: #0f766e; font-weight: 950; margin-bottom: 14px; }
  .guide-card a { color: #0f766e; text-decoration: none; font-weight: 950; }
  @media (max-width: 980px) { .guide-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 620px) { .guide-grid { grid-template-columns: 1fr; } }
`;

export default TouristGuidePage;
