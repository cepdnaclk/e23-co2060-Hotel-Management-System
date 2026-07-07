import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const guideTypes = ["All", "Heritage", "Food", "Nature", "Adventure", "City", "Wellness", "Wildlife"];

const guides = [
  {
    id: "kandy-heritage-guide",
    name: "Kandy Heritage Guide",
    city: "Kandy",
    type: "Heritage",
    icon: "🏛️",
    rating: 4.9,
    languages: "English / Sinhala",
    specialty: "Temple routes, cultural events, Kandyan dance nights, heritage walking paths",
    image: "https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&q=85",
    relatedEvent: "Kandy Cultural Dance Night",
  },
  {
    id: "colombo-food-guide",
    name: "Colombo Food Guide",
    city: "Colombo",
    type: "Food",
    icon: "🍛",
    rating: 4.8,
    languages: "English / Tamil / Sinhala",
    specialty: "Street food walks, Pettah market routes, city stories, safe evening planning",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=85",
    relatedEvent: "Colombo Street Food Walk",
  },
  {
    id: "ella-nature-guide",
    name: "Ella Nature Guide",
    city: "Ella",
    type: "Nature",
    icon: "⛰️",
    rating: 4.9,
    languages: "English / Sinhala",
    specialty: "Tea trails, Nine Arch Bridge timing, Little Adam's Peak and viewpoints",
    image: "https://images.unsplash.com/photo-1567515275959-4421b83c7056?auto=format&fit=crop&w=900&q=85",
    relatedEvent: "Ella Tea Estate Experience",
  },
  {
    id: "mirissa-coastal-guide",
    name: "Mirissa Coastal Guide",
    city: "Mirissa",
    type: "Adventure",
    icon: "🌊",
    rating: 4.7,
    languages: "English / Sinhala",
    specialty: "Beach evenings, whale watching guidance, surf and coastal safety support",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85",
    relatedEvent: "Mirissa Sunset Beach Music",
  },
  {
    id: "galle-fort-guide",
    name: "Galle Fort Story Guide",
    city: "Galle",
    type: "City",
    icon: "🏰",
    rating: 4.8,
    languages: "English / Sinhala",
    specialty: "Fort heritage, sunset ramparts, boutique streets, colonial architecture",
    image: "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=900&q=85",
    relatedEvent: "Galle Fort Heritage Evening",
  },
  {
    id: "yala-wildlife-guide",
    name: "Yala Wildlife Guide",
    city: "Yala",
    type: "Wildlife",
    icon: "🐆",
    rating: 4.9,
    languages: "English / Sinhala",
    specialty: "Safari safety, animal behaviour, birdlife, responsible wildlife tourism",
    image: "https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=900&q=85",
    relatedEvent: "Yala Wildlife Evening Talk",
  },
];

function TouristGuidePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("city") || "");
  const [type, setType] = useState(searchParams.get("type") || "All");

  const filteredGuides = useMemo(() => {
    const query = search.trim().toLowerCase();
    return guides.filter((guide) => {
      const matchesSearch = !query || [guide.name, guide.city, guide.specialty, guide.relatedEvent]
        .join(" ")
        .toLowerCase()
        .includes(query);
      const matchesType = type === "All" || guide.type === type || guide.specialty.toLowerCase().includes(type.toLowerCase());
      return matchesSearch && matchesType;
    });
  }, [search, type]);

  const updateFilters = (next = {}) => {
    const nextSearch = next.search ?? search;
    const nextType = next.type ?? type;
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("city", nextSearch.trim());
    if (nextType !== "All") params.set("type", nextType);
    setSearchParams(params);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateFilters();
  };

  return (
    <main className="guides-page">
      <style>{guideCss}</style>

      <section className="guide-hero">
        <div>
          <span className="eyebrow">Tourist Guide Support</span>
          <h1>Find guide support connected to events and places.</h1>
          <p>
            This tourist-side page gives travellers a professional guide discovery flow. It connects
            guide ideas with cities, events, Explore places, hotels, and trip planning.
          </p>
        </div>

        <form className="guide-search" onSubmit={handleSubmit}>
          <label>
            <span>Search city, event, or guide type</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Example: Kandy, food, Yala, cultural..."
            />
          </label>
          <label>
            <span>Guide type</span>
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                updateFilters({ type: event.target.value });
              }}
            >
              {guideTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <button type="submit">Search guides</button>
        </form>
      </section>

      <section className="guide-chip-row">
        {guideTypes.map((item) => (
          <button
            type="button"
            key={item}
            className={type === item ? "active" : ""}
            onClick={() => {
              setType(item);
              updateFilters({ type: item });
            }}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="guide-grid-wrap">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow small">Recommended guides</span>
            <h2>{filteredGuides.length} guide option{filteredGuides.length === 1 ? "" : "s"} found</h2>
          </div>
          <Link to="/events">Browse events →</Link>
        </div>

        <div className="guide-grid">
          {filteredGuides.map((guide) => (
            <article className="guide-card" key={guide.id}>
              <img src={guide.image} alt={guide.name} />
              <div className="guide-card-body">
                <div className="guide-topline">
                  <span>{guide.icon} {guide.type}</span>
                  <strong>⭐ {guide.rating}</strong>
                </div>
                <h2>{guide.name}</h2>
                <p>{guide.specialty}</p>
                <div className="guide-meta">
                  <span>📍 {guide.city}</span>
                  <span>🗣 {guide.languages}</span>
                  <span>🎟 Related: {guide.relatedEvent}</span>
                </div>
                <div className="guide-actions">
                  <Link to={`/events?search=${encodeURIComponent(guide.city)}`}>Events in {guide.city}</Link>
                  <Link to={`/hotels?city=${encodeURIComponent(guide.city)}`}>Hotels nearby</Link>
                  <Link to="/trip-planner">Add to trip</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const guideCss = `
.guides-page{min-height:100vh;background:linear-gradient(135deg,#f7faf8 0%,#fff 52%,#edf8f6 100%);color:#101828;font-family:Inter,system-ui,Arial,sans-serif}.guide-hero{width:min(1180px,calc(100% - 36px));margin:0 auto;padding:70px 0 28px;display:grid;grid-template-columns:1fr 430px;gap:36px;align-items:end}.eyebrow{display:inline-flex;background:#007e91;color:#fff;border-radius:999px;padding:9px 15px;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.eyebrow.small{background:#e5f6f4;color:#007e91}.guide-hero h1{font-size:clamp(42px,6vw,72px);line-height:.96;margin:18px 0 16px;letter-spacing:-.055em;color:#0b1720}.guide-hero p{font-size:18px;color:#52616f;line-height:1.8;font-weight:650}.guide-search{background:#fff;border:1px solid #dce9ea;border-radius:28px;padding:20px;box-shadow:0 24px 70px rgba(15,23,42,.1);display:grid;gap:14px}.guide-search label{display:grid;gap:7px}.guide-search span{font-size:12px;color:#667085;font-weight:950;text-transform:uppercase;letter-spacing:.06em}.guide-search input,.guide-search select{border:1px solid #d0d5dd;border-radius:16px;padding:14px 15px;font-size:15px;outline:none}.guide-search input:focus,.guide-search select:focus{border-color:#007e91;box-shadow:0 0 0 4px rgba(0,126,145,.1)}.guide-search button{border:none;border-radius:16px;background:#007e91;color:#fff;padding:14px;font-weight:950;cursor:pointer}.guide-chip-row{width:min(1180px,calc(100% - 36px));margin:8px auto 30px;display:flex;gap:10px;flex-wrap:wrap}.guide-chip-row button{border:1px solid #bfe3df;background:#fff;color:#007e91;border-radius:999px;padding:10px 15px;font-weight:900;cursor:pointer}.guide-chip-row .active{background:#007e91;color:#fff}.guide-grid-wrap{width:min(1180px,calc(100% - 36px));margin:0 auto 80px}.section-heading-row{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:18px}.section-heading-row h2{font-size:34px;margin:12px 0 0;letter-spacing:-.045em}.section-heading-row a{color:#007e91;text-decoration:none;font-weight:950}.guide-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}.guide-card{background:#fff;border:1px solid #e3e8ef;border-radius:30px;overflow:hidden;box-shadow:0 22px 60px rgba(15,23,42,.09);display:grid;grid-template-columns:230px 1fr}.guide-card img{width:100%;height:100%;object-fit:cover}.guide-card-body{padding:22px}.guide-topline{display:flex;justify-content:space-between;gap:12px;align-items:center}.guide-topline span,.guide-topline strong{border-radius:999px;padding:7px 10px;font-size:12px;font-weight:950}.guide-topline span{background:#e5f6f4;color:#007e91}.guide-topline strong{background:#fff7dc;color:#9a5b00}.guide-card h2{color:#0b4b45;font-size:26px;margin:14px 0 8px}.guide-card p{color:#52616f;line-height:1.7;font-weight:650}.guide-meta{display:grid;gap:6px;color:#475569;font-weight:800}.guide-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.guide-actions a{border:1px solid #d0d5dd;color:#007e91;text-decoration:none;border-radius:13px;padding:10px 12px;font-weight:950}.guide-actions a:first-child{background:#007e91;color:#fff;border-color:#007e91}@media(max-width:980px){.guide-hero{grid-template-columns:1fr}.guide-grid{grid-template-columns:1fr}.guide-card{grid-template-columns:1fr}.guide-card img{height:240px}.section-heading-row{align-items:flex-start;flex-direction:column}}@media(max-width:600px){.guide-hero,.guide-chip-row,.guide-grid-wrap{width:calc(100% - 24px)}.guide-hero{padding-top:48px}.guide-hero h1{font-size:44px}}
`;

export default TouristGuidePage;
