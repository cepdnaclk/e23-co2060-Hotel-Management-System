import { useNavigate } from "react-router-dom";

function ExploreSriLankaPage() {
  const navigate = useNavigate();

  const travelStyles = [
    {
      title: "Beach Holidays",
      icon: "🏖️",
      description:
        "Relax on golden beaches, enjoy whale watching, surfing, seafood, and sunsets.",
      places: "Mirissa, Bentota, Hikkaduwa, Trincomalee",
    },
    {
      title: "Cultural Heritage",
      icon: "🏛️",
      description:
        "Discover ancient kingdoms, temples, historic cities, and UNESCO heritage sites.",
      places: "Kandy, Sigiriya, Dambulla, Anuradhapura",
    },
    {
      title: "Hill Country",
      icon: "⛰️",
      description:
        "Enjoy mountains, waterfalls, tea estates, cool weather, and scenic train journeys.",
      places: "Ella, Nuwara Eliya, Haputale, Kandy",
    },
    {
      title: "Wildlife Safari",
      icon: "🐘",
      description:
        "Explore national parks, elephants, leopards, birds, and nature experiences.",
      places: "Yala, Udawalawe, Wilpattu, Minneriya",
    },
    {
      title: "Adventure",
      icon: "🚴",
      description:
        "Try hiking, rafting, diving, surfing, cycling, and outdoor activities.",
      places: "Kitulgala, Ella, Arugam Bay, Hikkaduwa",
    },
    {
      title: "Wellness & Ayurveda",
      icon: "🌿",
      description:
        "Experience spa treatments, Ayurveda, yoga, meditation, and peaceful retreats.",
      places: "Bentota, Kandy, Galle, Habarana",
    },
  ];

  const destinations = [
    {
      name: "Kandy",
      region: "Central Province",
      bestFor: "Culture, lake views, temples, hill country",
      stay: "2 days",
      image:
        "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1000&q=80",
      attractions: ["Temple of the Tooth", "Kandy Lake", "Peradeniya Garden"],
    },
    {
      name: "Ella",
      region: "Uva Province",
      bestFor: "Mountains, waterfalls, hiking, scenic train ride",
      stay: "2 days",
      image:
        "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1000&q=80",
      attractions: ["Nine Arches Bridge", "Little Adam's Peak", "Ravana Falls"],
    },
    {
      name: "Sigiriya",
      region: "Central Province",
      bestFor: "Ancient kingdom, history, nature, photography",
      stay: "1 day",
      image:
        "https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1000&q=80",
      attractions: ["Sigiriya Rock", "Pidurangala", "Dambulla Cave Temple"],
    },
    {
      name: "Galle",
      region: "Southern Province",
      bestFor: "Fort, beaches, colonial history, cafes",
      stay: "2 days",
      image:
        "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1000&q=80",
      attractions: ["Galle Fort", "Unawatuna Beach", "Jungle Beach"],
    },
    {
      name: "Colombo",
      region: "Western Province",
      bestFor: "City hotels, shopping, nightlife, food",
      stay: "1 day",
      image:
        "https://images.unsplash.com/photo-1575994532957-773da2f935fb?auto=format&fit=crop&w=1000&q=80",
      attractions: ["Galle Face Green", "Lotus Tower", "Pettah Market"],
    },
    {
      name: "Mirissa",
      region: "Southern Province",
      bestFor: "Beach, whale watching, surfing, relaxation",
      stay: "2 days",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
      attractions: ["Coconut Tree Hill", "Whale Watching", "Secret Beach"],
    },
  ];

  const quickTips = [
    {
      title: "Best travel idea",
      text: "Mix culture, hill country, wildlife, and beaches for a balanced Sri Lanka trip.",
      icon: "💡",
    },
    {
      title: "Recommended duration",
      text: "A 7 to 10 day trip is ideal for first-time tourists visiting Sri Lanka.",
      icon: "📅",
    },
    {
      title: "Smart next step",
      text: "After choosing destinations, use Accommodation to book stays in each city.",
      icon: "🏨",
    },
  ];

  function findHotels(destinationName) {
    const searchData = {
      destination: destinationName,
      checkIn: localStorage.getItem("tourismhub_check_in") || "2026-05-18",
      checkOut: localStorage.getItem("tourismhub_check_out") || "2026-05-19",
      guests: localStorage.getItem("tourismhub_guests") || "2",
      guestText: localStorage.getItem("tourismhub_guest_text") || "2 adults · 1 room",
    };

    localStorage.setItem("tourismhub_search_data", JSON.stringify(searchData));
    localStorage.setItem("tourismhub_check_in", searchData.checkIn);
    localStorage.setItem("tourismhub_check_out", searchData.checkOut);
    localStorage.setItem("tourismhub_guests", searchData.guests);
    localStorage.setItem("tourismhub_guest_text", searchData.guestText);

    navigate("/hotels");
  }

  return (
    <div className="explore-page">
      <section className="explore-hero">
        <div className="explore-hero-content">
          <p className="explore-eyebrow">Explore Sri Lanka</p>
          <h1>Discover places before you plan and book</h1>
          <p>
            Learn about Sri Lankan destinations, travel styles, attractions, and
            recommended stays. Then connect your selected destination with
            accommodation, events, guides, and trip planning.
          </p>

          <div className="explore-hero-actions">
            <a href="#destinations">Popular Destinations</a>
            <a href="#travel-styles" className="outline">
              Travel Styles
            </a>
          </div>
        </div>
      </section>

      <section className="explore-section" id="travel-styles">
        <div className="explore-section-header">
          <p className="explore-eyebrow">Travel styles</p>
          <h2>Choose what type of trip you want</h2>
          <p>
            Tourists can first understand their travel interest, then choose
            matching destinations and accommodation.
          </p>
        </div>

        <div className="travel-style-grid">
          {travelStyles.map((style) => (
            <article className="travel-style-card" key={style.title}>
              <div className="travel-style-icon">{style.icon}</div>
              <h3>{style.title}</h3>
              <p>{style.description}</p>
              <span>{style.places}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="explore-section" id="destinations">
        <div className="explore-section-header">
          <p className="explore-eyebrow">Popular destinations</p>
          <h2>Start your Sri Lanka journey from these places</h2>
          <p>
            Each destination can connect directly with hotel search, events,
            guides, and future trip planning.
          </p>
        </div>

        <div className="explore-destination-grid">
          {destinations.map((destination) => (
            <article className="explore-destination-card" key={destination.name}>
              <img src={destination.image} alt={destination.name} />

              <div className="explore-destination-body">
                <div className="destination-title-row">
                  <div>
                    <h3>{destination.name}</h3>
                    <p>{destination.region}</p>
                  </div>
                  <span>{destination.stay}</span>
                </div>

                <p className="destination-best-for">{destination.bestFor}</p>

                <div className="attraction-list">
                  {destination.attractions.map((attraction) => (
                    <span key={attraction}>{attraction}</span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => findHotels(destination.name)}
                >
                  Find accommodation in {destination.name}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="explore-info-section">
        {quickTips.map((tip) => (
          <article className="explore-info-card" key={tip.title}>
            <div>{tip.icon}</div>
            <h3>{tip.title}</h3>
            <p>{tip.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default ExploreSriLankaPage;