import { Link } from "react-router-dom";

const events = [
  {
    title: "Kandy Cultural Evening",
    city: "Kandy",
    date: "Daily",
    type: "Culture",
    image: "https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&q=80",
    description: "Traditional dance, drumming, and cultural storytelling near the Temple of the Tooth.",
  },
  {
    title: "South Coast Beach Night",
    city: "Mirissa",
    date: "Weekend",
    type: "Beach",
    image: "https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&q=80",
    description: "Beach music, seafood, sunset activities, and local hospitality along the coast.",
  },
  {
    title: "Hill Country Tea Experience",
    city: "Nuwara Eliya",
    date: "Seasonal",
    type: "Food & Nature",
    image: "https://images.pexels.com/photos/207353/pexels-photo-207353.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&q=80",
    description: "Tea estate walks, factory visits, tasting sessions, and cool-climate photography.",
  },
];

function EventsPage() {
  return (
    <main className="simple-tourism-page">
      <style>{pageCss}</style>
      <section className="simple-hero">
        <span>Events & Experiences</span>
        <h1>Find cultural events and travel experiences around Sri Lanka.</h1>
        <p>
          This section can later connect with partner hotel events and admin moderation.
          For now, it gives tourists a clear place to discover activities before booking hotels.
        </p>
      </section>

      <section className="simple-grid">
        {events.map((event) => (
          <article className="simple-card" key={event.title}>
            <img src={event.image} alt={event.title} />
            <div>
              <span>{event.type} · {event.date}</span>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
              <Link to={`/hotels?city=${encodeURIComponent(event.city)}`}>Find hotels in {event.city} →</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

const pageCss = `
  .simple-tourism-page { min-height: 100vh; padding: 64px 18px; background: linear-gradient(135deg, #f8f4ea, #ffffff 54%, #ecfdf5); color: #172033; }
  .simple-hero, .simple-grid { width: min(1180px, 100%); margin: 0 auto; }
  .simple-hero span { display: inline-flex; background: #0b4b45; color: white; border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 950; text-transform: uppercase; }
  .simple-hero h1 { margin: 16px 0 12px; max-width: 780px; color: #083f3b; font-size: clamp(36px, 5vw, 60px); line-height: 1; letter-spacing: -0.05em; }
  .simple-hero p { max-width: 760px; color: #64748b; line-height: 1.8; font-weight: 700; }
  .simple-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 34px; }
  .simple-card { background: white; border: 1px solid #d1fae5; border-radius: 24px; overflow: hidden; box-shadow: 0 18px 42px rgba(15,23,42,0.08); }
  .simple-card img { width: 100%; height: 190px; object-fit: cover; display: block; }
  .simple-card div { padding: 18px; }
  .simple-card span { color: #0f766e; font-size: 12px; font-weight: 950; text-transform: uppercase; }
  .simple-card h2 { color: #083f3b; margin: 8px 0; }
  .simple-card p { color: #64748b; line-height: 1.6; font-weight: 700; }
  .simple-card a { color: #0f766e; text-decoration: none; font-weight: 950; }
  @media (max-width: 820px) { .simple-grid { grid-template-columns: 1fr; } }
`;

export default EventsPage;
