import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { explorePlaces } from "../data/exploreData";

const fallbackHotels = [
  {
    id: 1,
    name: "Kandy Lake Hotel",
    city: "Kandy",
    district: "Kandy",
    property_type: "Hotel",
    main_photo:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    name: "Colombo City Stay",
    city: "Colombo",
    district: "Colombo",
    property_type: "City Stay",
    main_photo:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    name: "Ella Mountain Resort",
    city: "Ella",
    district: "Badulla",
    property_type: "Resort",
    main_photo:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  },
];


const heroVideoUrl = "/videos/sri-lanka-real-hero.mp4";
const heroPosterUrl = "/videos/sri-lanka-real-hero-poster.jpg";

const getPlaceImage = (place) =>
  place?.image ||
  "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1200&q=80";

const getHotelImage = (hotel) =>
  hotel?.main_photo ||
  hotel?.image_url ||
  hotel?.photo_url ||
  hotel?.cover_image ||
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

function HomePage() {
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

  const heroSlides = useMemo(() => {
    const featured = explorePlaces.filter((place) => place.featured).slice(0, 4);
    return featured.length >= 4 ? featured : explorePlaces.slice(0, 4);
  }, []);

  const exploreCards = useMemo(() => {
    const preferredPlaces = [
      "sigiriya",
      "nine arch",
      "mirissa",
      "tooth",
      "yala",
      "galle fort",
    ];

    const selected = preferredPlaces
      .map((keyword) =>
        explorePlaces.find((place) =>
          place.name?.toLowerCase().includes(keyword)
        )
      )
      .filter(Boolean);

    const extraPlaces = explorePlaces
      .filter((place) => !selected.some((item) => item.id === place.id))
      .slice(0, Math.max(0, 6 - selected.length));

    return [...selected, ...extraPlaces].slice(0, 6);
  }, []);

  const tripPlannerPreview = useMemo(() => {
    return {
      image:
        "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1400&q=85",
      steps: [
        { number: "01", title: "Choose days", text: "Set dates, travel style, and budget." },
        { number: "02", title: "Add places", text: "Place saved destinations into each day." },
        { number: "03", title: "Check stay", text: "Find hotels near the city for that night." },
      ],
    };
  }, []);

  const eventCards = useMemo(() => {
    const kandy = explorePlaces.find((place) => place.city === "Kandy") || explorePlaces[0];
    const mirissa = explorePlaces.find((place) => place.city === "Mirissa") || explorePlaces[0];
    const colombo = explorePlaces.find((place) => place.city === "Colombo") || explorePlaces[0];

    return [
      {
        id: "perahera-night",
        title: "Cultural nights",
        subtitle: "Kandy • Perahera • temple city",
        image: getPlaceImage(kandy),
        meta: "Festivals",
        eventLink: "/events?search=Kandy&category=Cultural%20%26%20Religious",
      },
      {
        id: "coastal-events",
        title: "Coastal evenings",
        subtitle: "Mirissa • music • sunsets",
        image: getPlaceImage(mirissa),
        meta: "Beach life",
        eventLink: "/events?search=Mirissa&category=Beach%20%26%20Coastal",
      },
      {
        id: "city-food-events",
        title: "City food walks",
        subtitle: "Colombo • street food • local stories",
        image: getPlaceImage(colombo),
        meta: "Food events",
        eventLink: "/events?search=Colombo&category=Food%20%26%20Culinary",
      },
    ];
  }, []);

  const guideCards = useMemo(() => {
    const sigiriya = explorePlaces.find((place) => place.name?.toLowerCase().includes("sigiriya")) || explorePlaces[0];
    const ella = explorePlaces.find((place) => place.city === "Ella") || explorePlaces[0];
    const yala = explorePlaces.find((place) => place.name?.toLowerCase().includes("yala")) || explorePlaces[0];

    return [
      {
        id: "heritage-guide",
        title: "Heritage guide",
        subtitle: "Ancient cities • temples • UNESCO sites",
        image: getPlaceImage(sigiriya),
        meta: "Culture",
      },
      {
        id: "hill-country-guide",
        title: "Hill country guide",
        subtitle: "Tea trails • train rides • viewpoints",
        image: getPlaceImage(ella),
        meta: "Scenic",
      },
      {
        id: "wildlife-guide",
        title: "Wildlife guide",
        subtitle: "Safari routes • parks • nature safety",
        image: getPlaceImage(yala),
        meta: "Adventure",
      },
    ];
  }, []);

  const quickStartCards = useMemo(() => {
    const sigiriya = explorePlaces.find((place) => place.name?.toLowerCase().includes("sigiriya")) || explorePlaces[0];
    const ella = explorePlaces.find((place) => place.city === "Ella") || explorePlaces[1] || explorePlaces[0];
    const mirissa = explorePlaces.find((place) => place.city === "Mirissa") || explorePlaces[2] || explorePlaces[0];

    return [
      {
        id: "discover-first",
        label: "Start with inspiration",
        title: "Explore Sri Lanka",
        text: "Open destination stories, browse experiences, and save the places that match your mood before choosing where to stay.",
        action: "Start exploring",
        to: "/explore",
        icon: "🧭",
        image: getPlaceImage(sigiriya),
        badge: "Best first step",
        chips: ["Places", "Experiences", "Local tips"],
      },
      {
        id: "already-know",
        label: "Ready to stay",
        title: "Find hotels",
        text: "Search approved hotels by city, compare room options, and continue smoothly to reservation details.",
        action: "Browse hotels",
        to: "/hotels",
        icon: "🏨",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
        badge: "Book-ready",
        chips: ["Approved stays", "Room details", "Bookings"],
      },
      {
        id: "need-route",
        label: "Build the route",
        title: "Plan my trip",
        text: "Arrange saved places into travel days, check hotel needs for each night, and download a clean itinerary.",
        action: "Build route",
        to: "/trip-planner",
        icon: "🗺️",
        image: getPlaceImage(ella || mirissa),
        badge: "Day-by-day",
        chips: ["Daily plan", "Stay checks", "PDF export"],
      },
    ];
  }, []);

  const landingStats = useMemo(() => [
    { value: "Explore", label: "places, events, guides" },
    { value: "Plan", label: "day-by-day travel routes" },
    { value: "Stay", label: "hotels near each city" },
    { value: "Book", label: "continue reservations" },
  ], []);

  const loadHotels = async () => {
    try {
      setLoadingHotels(true);
      const response = await api.get("/properties");
      const data = response.data.data || response.data.properties || response.data || [];
      setHotels(Array.isArray(data) && data.length > 0 ? data.slice(0, 3) : fallbackHotels);
    } catch (error) {
      console.error("Load home hotels error:", error);
      setHotels(fallbackHotels);
    } finally {
      setLoadingHotels(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);


  const handleNavigateTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  return (
    <main className="cinematic-home-page" id="top">
      <style>{homeCss}</style>

      <section className="hero-cinema-section">
        <div className="hero-video-shell">
          <video
            className="hero-bg-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={heroPosterUrl}
            aria-hidden="true"
          >
            <source src={heroVideoUrl} type="video/mp4" />
          </video>

          <div className="hero-video-layer hero-fallback-layer">
            {heroSlides.map((place, index) => (
              <div
                className="hero-slide"
                key={place.id}
                style={{ animationDelay: `${index * 5}s` }}
              >
                <img src={place.image} alt={place.name} />
              </div>
            ))}
          </div>

          <div className="hero-gradient" />
          <div className="moving-light light-one" />
          <div className="moving-light light-two" />
          <div className="wave-line wave-one" />
          <div className="wave-line wave-two" />

          <div className="hero-center-copy">
            <span>TourismHub LK</span>
            <h1>Your {"Sri\u00a0Lanka"} journey starts here.</h1>
            <p>Real journeys. Local smiles. Stays that bring you closer.</p>

            <div className="hero-center-actions" aria-label="Main landing actions">
              <Link to="/hotels" onClick={handleNavigateTop}>Find hotels</Link>
              <Link to="/explore" onClick={handleNavigateTop}>Explore Sri Lanka</Link>
              <Link to="/trip-planner" onClick={handleNavigateTop}>Plan trip</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-start-section" aria-label="Choose how to start using TourismHub LK">
        <div className="quick-start-header">
          <span className="section-kicker">Start your journey</span>
          <h2>What would you like to do first?</h2>
          <p>
            Choose a path that matches your travel mood: discover the island, find a stay, or build
            a day-by-day route across Sri Lanka.
          </p>
        </div>

        <div className="quick-start-grid">
          {quickStartCards.map((card) => (
            <Link
              to={card.to}
              onClick={handleNavigateTop}
              className={`quick-start-card ${card.id}`}
              key={card.id}
            >
              <div className="quick-card-visual">
                <img src={card.image} alt={card.title} />
                <div className="quick-card-shade" />
                <span className="quick-card-badge">{card.badge}</span>
                <div className="quick-icon">{card.icon}</div>
              </div>

              <div className="quick-card-content">
                <span className="quick-eyebrow">{card.label}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <div className="quick-chip-row">
                  {card.chips.map((chip) => (
                    <em key={chip}>{chip}</em>
                  ))}
                </div>
                <strong>{card.action} →</strong>
              </div>
            </Link>
          ))}
        </div>

        <div className="journey-flow-strip" aria-label="TourismHub LK journey flow">
          {landingStats.map((item, index) => (
            <div className="flow-item" key={item.value}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              {index < landingStats.length - 1 && <em>→</em>}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-showcase-section first-showcase">
        <div className="showcase-heading">
          <div>
            <span className="section-kicker">Explore Sri Lanka</span>
            <h2>Things to see and do</h2>
            <p>
              Start with iconic places, culture, beaches, wildlife, and local experiences. Click a
              card to open the matching destination detail view in Explore.
            </p>
          </div>
          <Link to="/explore" onClick={handleNavigateTop} className="outline-action">Explore more</Link>
        </div>

        <div className="showcase-card-grid">
          {exploreCards.map((place) => (
            <Link
              to={`/explore?place=${place.id}`}
              onClick={handleNavigateTop}
              className="showcase-card"
              key={place.id}
              aria-label={`View ${place.name} details in Explore Sri Lanka`}
            >
              <img src={getPlaceImage(place)} alt={place.name} />
              <div className="showcase-card-body">
                <span>{place.region || place.category}</span>
                <h3>{place.name}</h3>
                <p>{place.shortDescription || place.city}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-showcase-section tinted-showcase planner-showcase">
        <div className="showcase-heading">
          <div>
            <span className="section-kicker">Plan your dream holiday</span>
            <h2>Build a route that feels natural</h2>
            <p>
              Turn saved destinations into a clear daily route with dates, notes, budget checks,
              travel flow, and hotel links for each night.
            </p>
          </div>
          <Link to="/trip-planner" onClick={handleNavigateTop} className="outline-action">Plan more</Link>
        </div>

        <div className="planner-showcase-layout">
          <Link to="/trip-planner" onClick={handleNavigateTop} className="planner-image-panel">
            <img src={tripPlannerPreview.image} alt="Travel map, camera, and trip planning notebook" />
            <div className="planner-image-overlay">
              <span>Trip Planner</span>
              <h3>From saved places to a complete Sri Lanka route</h3>
              <p>Plan the island day by day before choosing where to stay.</p>
            </div>
          </Link>

          <div className="planner-feature-card">
            <span className="mini-label">How it helps</span>
            <h3>A clear travel board for your Sri Lanka route</h3>
            <p>
              Save places from Explore, arrange each travel day, add notes, and continue to nearby
              hotels when your route is ready.
            </p>

            <div className="planner-step-list">
              {tripPlannerPreview.steps.map((step) => (
                <div className="planner-step" key={step.number}>
                  <strong>{step.number}</strong>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/trip-planner" onClick={handleNavigateTop} className="solid-action">Start planning</Link>
          </div>
        </div>
      </section>

      <section className="landing-showcase-section">
        <div className="showcase-heading">
          <div>
            <span className="section-kicker">Hotels and stays</span>
            <h2>Stay closer to your journey</h2>
            <p>
              Move from travel inspiration to real hotel choices. Open approved stays by city,
              compare options, and continue the booking flow.
            </p>
          </div>
          <Link to="/hotels" onClick={handleNavigateTop} className="outline-action">Hotel more</Link>
        </div>

        <div className="showcase-card-grid hotel-grid">
          {loadingHotels ? (
            <div className="loading-card">Loading hotels...</div>
          ) : (
            hotels.map((hotel) => (
              <Link
                to={`/hotels/${hotel.id || hotel.property_id}`}
                onClick={handleNavigateTop}
                className="showcase-card hotel-card"
                key={hotel.id || hotel.property_id || hotel.name}
              >
                <img src={getHotelImage(hotel)} alt={hotel.name || hotel.property_name} />
                <div className="showcase-card-body">
                  <span>{hotel.property_type || "Hotel"}</span>
                  <h3>{hotel.name || hotel.property_name}</h3>
                  <p>{hotel.city || hotel.district || "Sri Lanka"}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="landing-showcase-section tinted-showcase event-showcase">
        <div className="showcase-heading">
          <div>
            <span className="section-kicker">Events and moments</span>
            <h2>Find what is happening around the island</h2>
            <p>
              Add local events, cultural nights, food walks, and coastal moments to the same journey
              you are planning.
            </p>
          </div>
          <Link to="/events" onClick={handleNavigateTop} className="outline-action">View events</Link>
        </div>

        <div className="showcase-card-grid event-grid">
          {eventCards.map((event) => (
            <Link to={event.eventLink || "/events"} onClick={handleNavigateTop} className="showcase-card route-card" key={event.id}>
              <img src={event.image} alt={event.title} />
              <div className="route-badge">{event.meta}</div>
              <div className="showcase-card-body">
                <span>{event.subtitle}</span>
                <h3>{event.title}</h3>
                <p>Browse events and connect the experience with nearby hotels and trip days.</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-showcase-section guide-showcase">
        <div className="showcase-heading">
          <div>
            <span className="section-kicker">Tourist guides</span>
            <h2>Travel with local knowledge</h2>
            <p>
              Discover guide options for heritage routes, hill-country journeys, safari days, and
              local food experiences.
            </p>
          </div>
          <Link to="/tourist-guides" onClick={handleNavigateTop} className="outline-action">Find guides</Link>
        </div>

        <div className="showcase-card-grid guide-grid">
          {guideCards.map((guide) => (
            <Link to="/tourist-guides" onClick={handleNavigateTop} className="showcase-card guide-card" key={guide.id}>
              <img src={guide.image} alt={guide.title} />
              <div className="route-badge guide-badge">{guide.meta}</div>
              <div className="showcase-card-body">
                <span>{guide.subtitle}</span>
                <h3>{guide.title}</h3>
                <p>Choose a suitable guide and make each route easier to enjoy.</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="partner-strip-section">
        <div>
          <span className="section-kicker light">Hotel partners</span>
          <h2>Bring your property to travellers.</h2>
        </div>
        <Link to="/list-your-property" onClick={handleNavigateTop}>List your property</Link>
      </section>

    </main>
  );
}

const homeCss = `
  .cinematic-home-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 12% 12%, rgba(20, 184, 166, 0.10), transparent 28rem),
      radial-gradient(circle at 90% 18%, rgba(229, 165, 20, 0.12), transparent 26rem),
      linear-gradient(135deg, #f8f4ea 0%, #ffffff 52%, #ecfdf5 100%);
    color: #172033;
    padding-bottom: 0;
  }

  .hero-cinema-section {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  .hero-video-shell {
    position: relative;
    min-height: calc(100vh - 76px);
    overflow: hidden;
    border-radius: 0;
    background: #062f2c;
    box-shadow: none;
    border: none;
  }

  .hero-bg-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    filter: saturate(1.08) contrast(1.03) brightness(0.96);
  }

  .hero-fallback-layer {
    z-index: 0;
  }

  .hero-video-layer,
  .hero-slide,
  .hero-slide img,
  .hero-gradient {
    position: absolute;
    inset: 0;
  }

  .hero-slide {
    opacity: 0;
    animation: sriLankaCinema 20s infinite;
  }

  .hero-slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.08);
    filter: saturate(1.08) contrast(1.03);
  }

  .hero-gradient {
    z-index: 2;
    background:
      radial-gradient(circle at 50% 44%, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.50) 74%),
      linear-gradient(90deg, rgba(5, 48, 44, 0.54), rgba(5, 48, 44, 0.10), rgba(5, 48, 44, 0.54));
  }

  .moving-light {
    position: absolute;
    z-index: 3;
    width: 220px;
    height: 220px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(252, 211, 77, 0.16), transparent 70%);
    filter: blur(4px);
    animation: floatingGlow 12s ease-in-out infinite alternate;
  }

  .light-one { top: 14%; left: 8%; }
  .light-two { bottom: 8%; right: 10%; animation-delay: -4s; }

  .wave-line {
    position: absolute;
    z-index: 4;
    left: -10%;
    width: 120%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
    opacity: 0.32;
    animation: waveSweep 8s linear infinite;
  }

  .wave-one { bottom: 24%; }
  .wave-two { bottom: 18%; animation-delay: -3s; opacity: 0.22; }

  .hero-center-copy {
    position: relative;
    z-index: 5;
    min-height: clamp(500px, 76vh, 720px);
    display: grid;
    align-content: center;
    justify-items: center;
    text-align: center;
    padding: 36px;
    color: #ffffff;
  }

  .hero-center-copy span {
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.42);
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(12px);
    border-radius: 999px;
    padding: 9px 16px;
    color: #d1fae5;
    font-size: 12px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }

  .hero-center-copy h1 {
    margin: 18px 0 8px;
    max-width: 1120px;
    font-size: clamp(44px, 6.2vw, 88px);
    line-height: 0.96;
    letter-spacing: -0.055em;
    color: #ffffff;
    text-shadow: 0 16px 46px rgba(0,0,0,0.34);
  }

  .hero-nowrap {
    white-space: nowrap;
    display: inline-block;
  }

  .hero-center-copy p {
    max-width: 980px;
    margin: 0;
    color: #fde68a;
    font-size: clamp(18px, 2.2vw, 31px);
    font-weight: 850;
    letter-spacing: 0.02em;
    text-shadow: 0 10px 26px rgba(0,0,0,0.32);
  }

  .hero-center-copy h1::after {
    content: "";
    display: block;
    width: min(220px, 42vw);
    height: 3px;
    margin: 24px auto 0;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, #fbbf24, #14b8a6, transparent);
    animation: phraseGlow 3.5s ease-in-out infinite alternate;
  }

  .hero-center-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 28px;
  }

  .hero-center-actions a {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 22px;
    border-radius: 999px;
    text-decoration: none;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.42);
    background: rgba(255, 255, 255, 0.14);
    backdrop-filter: blur(12px);
    font-weight: 950;
    transition: transform 0.18s ease, background 0.18s ease;
  }

  .hero-center-actions a:nth-child(1) {
    color: #092f2b;
    border-color: #fbbf24;
    background: #fbbf24;
  }

  .hero-center-actions a:nth-child(2) {
    color: #ffffff;
    border-color: rgba(20, 184, 166, 0.82);
    background: rgba(15, 118, 110, 0.72);
  }

  .hero-center-actions a:nth-child(3) {
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.48);
    background: rgba(255, 255, 255, 0.14);
  }

  .hero-center-actions a:hover {
    transform: translateY(-3px);
    background: rgba(255, 255, 255, 0.22);
  }

  .hero-center-actions a:nth-child(1):hover { background: #f59e0b; }
  .hero-center-actions a:nth-child(2):hover { background: rgba(13, 148, 136, 0.86); }

  .quick-start-section {
    width: min(1180px, calc(100% - 36px));
    margin: 58px auto 0;
    padding: 34px;
    border-radius: 34px;
    background:
      radial-gradient(circle at 10% 10%, rgba(20,184,166,0.12), transparent 22rem),
      linear-gradient(135deg, rgba(255,255,255,0.94), rgba(248,244,234,0.94));
    border: 1px solid rgba(15,118,110,0.14);
    box-shadow: 0 22px 60px rgba(15,23,42,0.07);
  }

  .quick-start-header {
    display: grid;
    grid-template-columns: minmax(0, 0.82fr) minmax(280px, 0.55fr);
    gap: 30px;
    align-items: end;
    margin-bottom: 22px;
  }

  .quick-start-header h2 {
    margin: 14px 0 0;
    color: #083f3b;
    font-size: clamp(30px, 4.2vw, 52px);
    line-height: 1;
    letter-spacing: -0.045em;
  }

  .quick-start-header p {
    margin: 0;
    color: #475569;
    font-size: 16px;
    line-height: 1.7;
    font-weight: 720;
  }

  .quick-start-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 22px;
  }

  .quick-start-card {
    position: relative;
    display: grid;
    grid-template-rows: 190px 1fr;
    min-height: 440px;
    overflow: hidden;
    border-radius: 30px;
    text-decoration: none;
    color: #172033;
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(15,118,110,0.16);
    box-shadow: 0 24px 58px rgba(15,23,42,0.10);
    transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  }

  .quick-start-card::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 6px;
    background: linear-gradient(90deg, #fbbf24, #14b8a6, #0f766e);
    z-index: 4;
  }

  .quick-start-card:hover {
    transform: translateY(-8px);
    border-color: rgba(20,184,166,0.52);
    box-shadow: 0 34px 76px rgba(15,23,42,0.16);
  }

  .quick-card-visual {
    position: relative;
    overflow: hidden;
    background: #063f3a;
  }

  .quick-card-visual img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transform: scale(1.02);
    transition: transform 0.38s ease, filter 0.38s ease;
  }

  .quick-start-card:hover .quick-card-visual img {
    transform: scale(1.09);
    filter: saturate(1.12);
  }

  .quick-card-shade {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 18% 12%, rgba(251, 191, 36, 0.24), transparent 16rem),
      linear-gradient(180deg, rgba(6, 63, 58, 0.05) 0%, rgba(6, 63, 58, 0.78) 100%);
  }

  .quick-card-badge {
    position: absolute;
    top: 18px;
    left: 18px;
    z-index: 2;
    display: inline-flex;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.88);
    color: #063f3a;
    font-size: 11px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    backdrop-filter: blur(10px);
  }

  .quick-icon {
    position: absolute;
    right: 18px;
    bottom: 18px;
    z-index: 2;
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    border-radius: 22px;
    background: #fbbf24;
    color: #063f3a;
    font-size: 28px;
    box-shadow: 0 14px 30px rgba(0,0,0,0.20), inset 0 0 0 2px rgba(255,255,255,0.56);
  }

  .quick-card-content {
    padding: 26px;
    display: flex;
    flex-direction: column;
  }

  .quick-eyebrow {
    color: #0f766e;
    font-size: 12px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.09em;
  }

  .quick-start-card h3 {
    margin: 10px 0 10px;
    color: #083f3b;
    font-size: clamp(25px, 2.4vw, 34px);
    line-height: 1.02;
    letter-spacing: -0.045em;
  }

  .quick-start-card p {
    margin: 0;
    color: #4b5f78;
    line-height: 1.65;
    font-weight: 720;
  }

  .quick-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 20px 0 22px;
  }

  .quick-chip-row em {
    display: inline-flex;
    padding: 7px 10px;
    border-radius: 999px;
    background: #ecfdf5;
    color: #0f766e;
    border: 1px solid rgba(20,184,166,0.20);
    font-size: 12px;
    font-style: normal;
    font-weight: 900;
  }

  .quick-start-card strong {
    margin-top: auto;
    min-height: 46px;
    width: fit-content;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 18px;
    border-radius: 999px;
    background: #063f3a;
    color: #ffffff;
    font-weight: 950;
    box-shadow: 0 14px 30px rgba(6, 63, 58, 0.16);
  }

  .quick-start-card.discover-first strong {
    background: #fbbf24;
    color: #092f2b;
  }

  .quick-start-card.already-know strong {
    background: #0f766e;
  }

  .journey-flow-strip {
    margin-top: 20px;
    padding: 18px;
    border-radius: 24px;
    background: #063f3a;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    color: #ffffff;
  }

  .flow-item {
    position: relative;
    min-height: 74px;
    padding: 14px 18px;
    border-radius: 18px;
    background: rgba(255,255,255,0.09);
    border: 1px solid rgba(255,255,255,0.12);
  }

  .flow-item strong,
  .flow-item span {
    display: block;
  }

  .flow-item strong {
    color: #fde68a;
    font-size: 22px;
    font-weight: 950;
  }

  .flow-item span {
    margin-top: 4px;
    color: #ccfbf1;
    font-size: 13px;
    font-weight: 730;
  }

  .flow-item em {
    position: absolute;
    right: -16px;
    top: 50%;
    transform: translateY(-50%);
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #fbbf24;
    color: #063f3a;
    font-style: normal;
    font-weight: 950;
    z-index: 2;
  }

  .landing-showcase-section,
  .partner-strip-section {
    width: min(1180px, calc(100% - 36px));
    margin-left: auto;
    margin-right: auto;
  }

  .landing-showcase-section {
    padding: 86px 0 0;
  }

  .first-showcase {
    padding-top: 72px;
  }

  .tinted-showcase {
    margin-top: 70px;
    padding: 58px 34px 42px;
    border-radius: 34px;
    background:
      radial-gradient(circle at 8% 10%, rgba(20,184,166,0.12), transparent 22rem),
      linear-gradient(135deg, rgba(255,255,255,0.86), rgba(248,244,234,0.94));
    border: 1px solid rgba(15,118,110,0.14);
    box-shadow: 0 24px 70px rgba(15,23,42,0.08);
  }

  .showcase-heading {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 30px;
    align-items: center;
    margin-bottom: 36px;
  }

  .section-kicker {
    display: inline-flex;
    width: fit-content;
    padding: 8px 13px;
    border-radius: 999px;
    background: #ccfbf1;
    color: #0f766e;
    font-size: 12px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.09em;
  }

  .section-kicker.light {
    background: rgba(255,255,255,0.13);
    color: #ccfbf1;
  }

  .showcase-heading h2,
  .partner-strip-section h2 {
    margin: 14px 0 0;
    color: #083f3b;
    font-size: clamp(34px, 4.5vw, 58px);
    line-height: 1;
    letter-spacing: -0.045em;
  }

  .showcase-heading p {
    max-width: 720px;
    margin: 14px 0 0;
    color: #475569;
    font-size: 17px;
    line-height: 1.7;
    font-weight: 700;
  }

  .outline-action {
    min-width: 160px;
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 24px;
    border-radius: 999px;
    border: 1px solid #14b8a6;
    color: #0f766e;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 950;
    background: rgba(255,255,255,0.78);
    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  }

  .outline-action:hover {
    transform: translateY(-3px);
    background: #ecfdf5;
    box-shadow: 0 16px 34px rgba(15, 118, 110, 0.14);
  }

  .showcase-card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 22px;
  }

  .showcase-card {
    position: relative;
    display: flex;
    min-height: 470px;
    overflow: hidden;
    border-radius: 28px;
    background: #ffffff;
    text-decoration: none;
    color: #172033;
    border: 1px solid rgba(15, 118, 110, 0.14);
    box-shadow: 0 24px 55px rgba(15, 23, 42, 0.10);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .showcase-card:hover {
    transform: translateY(-7px);
    box-shadow: 0 34px 72px rgba(15, 23, 42, 0.16);
  }

  .showcase-card img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.02);
    transition: transform 0.36s ease;
  }

  .showcase-card:hover img {
    transform: scale(1.08);
  }

  .showcase-card::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 22%, rgba(3, 31, 29, 0.92) 100%);
  }

  .showcase-card-body {
    position: relative;
    z-index: 2;
    align-self: end;
    width: 100%;
    padding: 26px;
    color: #ffffff;
  }

  .showcase-card-body span {
    display: inline-flex;
    color: #fde68a;
    font-size: 12px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .showcase-card-body h3 {
    margin: 9px 0 10px;
    font-size: clamp(24px, 2.2vw, 32px);
    line-height: 1.04;
    color: #ffffff;
    text-shadow: 0 8px 24px rgba(0,0,0,0.30);
  }

  .showcase-card-body p {
    margin: 0;
    color: #d1fae5;
    line-height: 1.55;
    font-weight: 750;
  }

  .planner-showcase-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.72fr);
    gap: 24px;
    align-items: stretch;
  }

  .planner-image-panel {
    position: relative;
    min-height: 470px;
    overflow: hidden;
    border-radius: 30px;
    text-decoration: none;
    color: #ffffff;
    background: #063f3a;
    border: 1px solid rgba(15, 118, 110, 0.16);
    box-shadow: 0 25px 60px rgba(15, 23, 42, 0.12);
  }

  .planner-image-panel img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.02);
    transition: transform 0.35s ease;
  }

  .planner-image-panel:hover img {
    transform: scale(1.08);
  }

  .planner-image-panel::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 22% 16%, rgba(251, 191, 36, 0.24), transparent 24rem),
      linear-gradient(180deg, rgba(3, 31, 29, 0.06) 0%, rgba(3, 31, 29, 0.88) 100%);
  }

  .planner-image-overlay {
    position: absolute;
    z-index: 2;
    left: 30px;
    right: 30px;
    bottom: 30px;
  }

  .planner-image-overlay span,
  .mini-label {
    display: inline-flex;
    width: fit-content;
    padding: 8px 12px;
    border-radius: 999px;
    background: #fbbf24;
    color: #092f2b;
    font-size: 12px;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .planner-image-overlay h3 {
    margin: 14px 0 10px;
    max-width: 640px;
    font-size: clamp(30px, 3.5vw, 48px);
    line-height: 1;
    color: #ffffff;
    letter-spacing: -0.04em;
  }

  .planner-image-overlay p {
    margin: 0;
    max-width: 560px;
    color: #d1fae5;
    font-size: 17px;
    line-height: 1.6;
    font-weight: 780;
  }

  .planner-feature-card {
    min-height: 470px;
    padding: 34px;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(15, 118, 110, 0.16);
    box-shadow: 0 24px 55px rgba(15, 23, 42, 0.08);
  }

  .planner-feature-card h3 {
    margin: 16px 0 12px;
    color: #083f3b;
    font-size: clamp(28px, 3vw, 40px);
    line-height: 1.04;
    letter-spacing: -0.035em;
  }

  .planner-feature-card > p {
    margin: 0;
    color: #475569;
    line-height: 1.7;
    font-weight: 730;
  }

  .planner-step-list {
    display: grid;
    gap: 12px;
    margin: 22px 0 24px;
  }

  .planner-step {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 12px;
    align-items: start;
    padding: 14px;
    border-radius: 18px;
    background: #f8f4ea;
    border: 1px solid rgba(15, 118, 110, 0.12);
  }

  .planner-step strong {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #063f3a;
    color: #fbbf24;
    font-weight: 950;
  }

  .planner-step h4 {
    margin: 0 0 4px;
    color: #083f3b;
    font-size: 16px;
  }

  .planner-step p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
    line-height: 1.5;
    font-weight: 700;
  }

  .solid-action {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 22px;
    border-radius: 999px;
    text-decoration: none;
    color: #092f2b;
    background: #fbbf24;
    font-weight: 950;
    box-shadow: 0 16px 34px rgba(251, 191, 36, 0.22);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .solid-action:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 42px rgba(251, 191, 36, 0.30);
  }

  .route-card {
    min-height: 420px;
  }

  .route-badge {
    position: absolute;
    z-index: 2;
    top: 18px;
    left: 18px;
    display: inline-flex;
    padding: 8px 12px;
    border-radius: 999px;
    background: #fbbf24;
    color: #092f2b;
    font-size: 12px;
    font-weight: 950;
    box-shadow: 0 12px 28px rgba(0,0,0,0.15);
  }

  .hotel-card {
    min-height: 380px;
  }

  .loading-card {
    grid-column: 1 / -1;
    min-height: 180px;
    display: grid;
    place-items: center;
    border-radius: 24px;
    background: #ffffff;
    border: 1px solid rgba(15,118,110,0.14);
    color: #64748b;
    font-weight: 950;
  }

  .partner-strip-section {
    margin-top: 78px;
    padding: 34px;
    border-radius: 30px;
    background: linear-gradient(135deg, #063f3a, #0f766e);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    box-shadow: 0 25px 55px rgba(15, 118, 110, 0.22);
  }

  .partner-strip-section h2 {
    color: #ffffff;
    max-width: 760px;
  }

  .partner-strip-section a {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 22px;
    border-radius: 999px;
    text-decoration: none;
    color: #092f2b;
    background: #fbbf24;
    font-weight: 950;
    white-space: nowrap;
  }


  .event-showcase {
    background:
      radial-gradient(circle at 82% 10%, rgba(251, 191, 36, 0.16), transparent 22rem),
      linear-gradient(135deg, rgba(255,255,255,0.90), rgba(240,253,250,0.88));
  }

  .guide-showcase {
    margin-top: 70px;
  }

  .guide-card {
    min-height: 420px;
  }

  .guide-badge {
    background: #ccfbf1;
    color: #063f3a;
  }

  .tourismhub-footer {
    width: 100%;
    margin: 96px 0 0;
    background: #087f9d;
    color: #ffffff;
    box-shadow: 0 -22px 55px rgba(8, 127, 157, 0.16);
    border-radius: 0;
    overflow: hidden;
  }

  .footer-inner {
    width: min(1240px, calc(100% - 48px));
    margin: 0 auto;
    padding: 56px 0 28px;
  }

  .footer-top {
    display: grid;
    grid-template-columns: 1.45fr 0.85fr 0.85fr 0.75fr 1.15fr;
    gap: 42px;
    align-items: start;
  }

  .footer-logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #ffffff;
    text-decoration: none;
    font-size: 30px;
    font-weight: 950;
    letter-spacing: -0.04em;
  }

  .footer-logo-mark {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.20);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
  }

  .footer-brand-panel p {
    max-width: 440px;
    margin: 20px 0 24px;
    color: rgba(255, 255, 255, 0.84);
    line-height: 1.75;
    font-size: 15px;
    font-weight: 650;
  }

  .footer-hotlines {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    max-width: 410px;
  }

  .footer-hotlines div {
    padding: 18px 18px 16px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.11);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }

  .footer-hotlines strong,
  .footer-hotlines span {
    display: block;
  }

  .footer-hotlines strong {
    color: rgba(255, 255, 255, 0.82);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    line-height: 1.35;
  }

  .footer-hotlines span {
    margin-top: 7px;
    color: #fde68a;
    font-size: 26px;
    font-weight: 950;
    letter-spacing: -0.03em;
  }

  .footer-column h3 {
    margin: 6px 0 18px;
    color: #fde68a;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  .footer-column a {
    display: block;
    width: fit-content;
    margin: 11px 0;
    color: rgba(255, 255, 255, 0.88);
    text-decoration: none;
    font-size: 14px;
    font-weight: 720;
    line-height: 1.35;
    transition: color 0.16s ease, transform 0.16s ease;
  }

  .footer-column a:hover {
    color: #fde68a;
    transform: translateX(4px);
  }

  .footer-official a {
    color: rgba(255, 255, 255, 0.76);
  }

  .footer-middle {
    margin-top: 44px;
    padding: 24px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.18);
    border-bottom: 1px solid rgba(255, 255, 255, 0.18);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .footer-middle strong,
  .footer-middle span {
    display: block;
  }

  .footer-middle strong {
    color: #ffffff;
    font-size: 18px;
    font-weight: 950;
  }

  .footer-middle span {
    margin-top: 5px;
    color: rgba(255, 255, 255, 0.78);
    font-weight: 650;
  }

  .footer-socials {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .footer-socials span {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #ffffff;
    color: #087f9d;
    font-size: 13px;
    font-weight: 950;
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.12);
  }

  .footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding-top: 22px;
    color: rgba(255, 255, 255, 0.78);
    font-size: 13px;
    font-weight: 650;
  }

  .footer-bottom p {
    margin: 0;
  }

  .footer-legal-links {
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
  }

  .footer-legal-links a {
    color: rgba(255, 255, 255, 0.82);
    text-decoration: none;
    font-weight: 780;
  }

  .footer-legal-links a:hover {
    color: #fde68a;
  }

  .back-to-top {
    position: fixed;
    left: 24px;
    bottom: 28px;
    z-index: 90;
    min-width: 138px;
    height: 58px;
    border: 1px solid rgba(251, 191, 36, 0.86);
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 9px 18px 9px 10px;
    background: linear-gradient(135deg, #063f3a 0%, #0f766e 55%, #e0a118 100%);
    color: #ffffff;
    cursor: pointer;
    box-shadow: 0 18px 42px rgba(6, 63, 58, 0.32), 0 0 0 7px rgba(251, 191, 36, 0.14);
    transform: translateX(-18px) scale(0.94);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
  }

  .back-to-top.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0) scale(1);
    animation: backToTopPulse 1.9s ease-in-out infinite;
  }

  .back-to-top::before {
    content: "";
    position: absolute;
    inset: -5px;
    border-radius: inherit;
    border: 1px solid rgba(251, 191, 36, 0.42);
    pointer-events: none;
  }

  .back-icon-wrap {
    position: relative;
    z-index: 1;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: #fbbf24;
    color: #063f3a;
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.58);
    flex: 0 0 auto;
  }

  .back-arrow {
    display: block;
    font-size: 25px;
    line-height: 1;
    font-weight: 950;
    transform: translateY(1px);
  }

  .back-label {
    position: relative;
    z-index: 1;
    display: block;
    font-size: 12px;
    line-height: 1.05;
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  .back-to-top:hover {
    transform: translateY(-4px) scale(1.03);
    box-shadow: 0 24px 54px rgba(6, 63, 58, 0.38), 0 0 0 10px rgba(251, 191, 36, 0.20);
  }

  @keyframes backToTopPulse {
    0%, 100% { box-shadow: 0 18px 42px rgba(6, 63, 58, 0.32), 0 0 0 7px rgba(251, 191, 36, 0.14); }
    50% { box-shadow: 0 22px 52px rgba(6, 63, 58, 0.40), 0 0 0 13px rgba(251, 191, 36, 0.08); }
  }

  @keyframes phraseGlow {
    from { opacity: 0.62; transform: scaleX(0.82); }
    to { opacity: 1; transform: scaleX(1); }
  }

  @keyframes sriLankaCinema {
    0% { opacity: 0; transform: scale(1.08); }
    8% { opacity: 1; }
    28% { opacity: 1; }
    36% { opacity: 0; transform: scale(1.16); }
    100% { opacity: 0; transform: scale(1.16); }
  }

  @keyframes floatingGlow {
    from { transform: translate3d(0, 0, 0) scale(1); }
    to { transform: translate3d(28px, -24px, 0) scale(1.22); }
  }

  @keyframes waveSweep {
    from { transform: translateX(-12%); }
    to { transform: translateX(12%); }
  }

  @media (max-width: 1050px) {
    .footer-top {
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 32px;
    }

    .footer-official {
      grid-column: span 2;
    }

    .quick-start-header,
    .quick-start-grid,
    .journey-flow-strip {
      grid-template-columns: 1fr;
    }

    .flow-item em {
      display: none;
    }

    .footer-main {
      grid-template-columns: 1fr 1fr;
    }

    .showcase-heading,
    .partner-strip-section {
      grid-template-columns: 1fr;
    }

    .showcase-card-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .planner-showcase-layout {
      grid-template-columns: 1fr;
    }

    .partner-strip-section {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 760px) {
    .back-to-top {
      left: 14px;
      bottom: 18px;
      min-width: 58px;
      width: 58px;
      height: 58px;
      padding: 9px;
      border-radius: 50%;
    }

    .back-icon-wrap {
      width: 38px;
      height: 38px;
    }

    .back-arrow {
      font-size: 23px;
    }

    .back-label {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .quick-start-section {
      width: min(100% - 20px, 1180px);
      padding: 24px 18px;
      border-radius: 26px;
    }

    .quick-start-card {
      min-height: auto;
    }

    .tourismhub-footer {
      width: 100%;
      margin-top: 64px;
      border-radius: 0;
    }

    .footer-inner {
      width: min(100% - 28px, 1240px);
      padding: 38px 0 22px;
    }

    .footer-top {
      grid-template-columns: 1fr;
      gap: 30px;
    }

    .footer-hotlines {
      grid-template-columns: 1fr;
    }

    .footer-middle,
    .footer-bottom {
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-cinema-section { width: 100%; }
    .hero-video-shell { border-radius: 0; min-height: calc(100vh - 72px); }
    .hero-center-copy { min-height: calc(100vh - 72px); padding: 24px; }
    .showcase-card-grid { grid-template-columns: 1fr; }
    .landing-showcase-section { padding-top: 58px; }
    .tinted-showcase { padding: 34px 18px 26px; }
    .showcase-card { min-height: 390px; }
    .planner-image-panel,
    .planner-feature-card { min-height: auto; }
    .planner-image-panel { min-height: 390px; }
    .planner-feature-card { padding: 24px; }
    .outline-action,
    .solid-action { width: 100%; }
  }
`;

export default HomePage;
