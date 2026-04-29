import { Link } from "react-router-dom";

function HomePage() {
  const services = [
    {
      title: "Explore Sri Lanka",
      icon: "🧭",
      text: "Discover destinations, attractions, culture, beaches, wildlife, and travel ideas.",
      link: "/explore",
      button: "Explore Places",
    },
    {
      title: "Accommodation",
      icon: "🏨",
      text: "Find verified hotels, check rooms, compare stays, and complete your booking.",
      link: "/accommodation",
      button: "Find Hotels",
    },
    {
      title: "Events & Experiences",
      icon: "🎉",
      text: "Browse festivals, cultural shows, food experiences, and activities near destinations.",
      link: "/events",
      button: "View Events",
    },
    {
      title: "Tour Guides",
      icon: "🧑‍🏫",
      text: "Select guides by city, language, rating, and travel specialization.",
      link: "/guides",
      button: "Find Guides",
    },
    {
      title: "Trip Planner",
      icon: "🗺️",
      text: "Create a day-by-day Sri Lanka travel plan based on your days, budget, and interests.",
      link: "/trip-planner",
      button: "Plan My Trip",
    },
    {
      title: "Travel Essentials",
      icon: "🛟",
      text: "Get safety contacts, transport tips, weather guidance, budget help, and travel information.",
      link: "/travel-essentials",
      button: "Get Info",
    },
  ];

  const destinations = [
    {
      name: "Kandy",
      text: "Culture, lake views, and hill country",
      image:
        "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Ella",
      text: "Mountains, waterfalls, and scenic train journeys",
      image:
        "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Galle",
      text: "Fort, beaches, and colonial history",
      image:
        "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=900&q=80",
    },
    {
      name: "Sigiriya",
      text: "Heritage, ancient kingdom, and nature",
      image:
        "https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <div className="portal-home-page">
      <section className="portal-hero">
        <div className="portal-hero-content">
          <p className="portal-eyebrow">TourismHub LK</p>
          <h1>Plan your perfect Sri Lanka journey in one place</h1>
          <p>
            Explore destinations, plan your trip, book accommodation, discover
            events, select guides, and travel with confidence.
          </p>

          <div className="portal-hero-actions">
            <Link to="/explore" className="portal-primary-button">
              Explore Sri Lanka
            </Link>
            <Link to="/accommodation" className="portal-secondary-button">
              Find Accommodation
            </Link>
            <Link to="/trip-planner" className="portal-light-button">
              Plan My Trip
            </Link>
          </div>
        </div>
      </section>

      <section className="portal-section">
        <div className="portal-section-header">
          <p className="portal-eyebrow">Main services</p>
          <h2>Everything tourists need for a better travel plan</h2>
        </div>

        <div className="portal-service-grid">
          {services.map((service) => (
            <article className="portal-service-card" key={service.title}>
              <div className="portal-service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <Link to={service.link}>{service.button}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-section">
        <div className="portal-section-header">
          <p className="portal-eyebrow">Popular destinations</p>
          <h2>Start with Sri Lanka’s most loved places</h2>
        </div>

        <div className="portal-destination-grid">
          {destinations.map((destination) => (
            <article className="portal-destination-card" key={destination.name}>
              <img src={destination.image} alt={destination.name} />
              <div>
                <h3>{destination.name}</h3>
                <p>{destination.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-why-section">
        <div>
          <p className="portal-eyebrow">Why TourismHub LK?</p>
          <h2>A complete travel companion for Sri Lanka</h2>
          <p>
            TourismHub LK connects exploration, planning, accommodation, events,
            guides, and travel support in one platform. Your existing hotel
            booking system becomes the accommodation module of this larger smart
            tourism platform.
          </p>
        </div>

        <div className="portal-why-list">
          <div>
            <strong>01</strong>
            <span>Explore before booking</span>
          </div>
          <div>
            <strong>02</strong>
            <span>Plan trips by interest and budget</span>
          </div>
          <div>
            <strong>03</strong>
            <span>Book verified accommodation</span>
          </div>
        </div>
      </section>

      <section className="portal-partner-banner">
        <div>
          <p className="portal-eyebrow">For partners</p>
          <h2>List your property and manage bookings</h2>
          <p>
            Hotels can register properties, manage rooms, update content, handle
            bookings, and publish hotel events.
          </p>
        </div>

        <Link to="/partner">List your property</Link>
      </section>
    </div>
  );
}

export default HomePage;