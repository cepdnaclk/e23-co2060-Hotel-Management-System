function TravelEssentialsPage() {
  const emergencyContacts = [
    {
      title: "Tourism Hotline",
      number: "1912",
      description: "Tourism information, complaints, and tourism-related help.",
      type: "Tourism",
    },
    {
      title: "Police Emergency",
      number: "118 / 119",
      description: "Emergency police assistance.",
      type: "Safety",
    },
    {
      title: "Ambulance",
      number: "1990",
      description: "Suwa Seriya emergency ambulance service.",
      type: "Medical",
    },
    {
      title: "Ambulance / Fire & Rescue",
      number: "110",
      description: "Ambulance, fire, and rescue assistance.",
      type: "Emergency",
    },
    {
      title: "Emergency Service",
      number: "112",
      description: "General emergency service number.",
      type: "Emergency",
    },
    {
      title: "Disaster Management Centre",
      number: "117",
      description: "Disaster and emergency situation assistance.",
      type: "Disaster",
    },
  ];

  const essentials = [
    {
      title: "Visa & Entry",
      icon: "🛂",
      text: "Check visa and entry requirements before travelling. Add official visa links later in the backend/admin panel.",
      action: "Check before arrival",
    },
    {
      title: "Weather & Seasons",
      icon: "🌦️",
      text: "Sri Lanka has different weather patterns by region. Beach, hill country, and wildlife trips should be planned according to season.",
      action: "Plan by region",
    },
    {
      title: "Currency & Payments",
      icon: "💳",
      text: "Carry Sri Lankan Rupees for small payments. Use cards at hotels and larger shops, but keep cash for local transport and markets.",
      action: "Prepare cash + card",
    },
    {
      title: "Transport Tips",
      icon: "🚕",
      text: "Use trains for scenic routes, private cars for comfort, buses for budget travel, and tuk-tuks for short local trips.",
      action: "Choose transport type",
    },
    {
      title: "Health & Safety",
      icon: "🧳",
      text: "Keep emergency numbers saved, drink bottled water when needed, use sunscreen, and follow local travel advice.",
      action: "Save emergency contacts",
    },
    {
      title: "Local Culture",
      icon: "🙏",
      text: "Dress respectfully at religious places, remove shoes where required, and ask permission before photographing people.",
      action: "Respect local customs",
    },
  ];

  const travelTips = [
    "Save emergency numbers before starting your trip.",
    "Keep digital and printed copies of passport, visa, hotel booking, and travel insurance.",
    "Use verified accommodation and trusted guides where possible.",
    "Plan extra travel time between hill country destinations because roads can be slow.",
    "Check event dates and attraction opening times before visiting.",
    "Use the Trip Planner to connect destinations with hotels, guides, and events.",
  ];

  const seasonalGuides = [
    {
      region: "South & West Coast",
      bestTime: "December to April",
      places: "Galle, Bentota, Mirissa, Hikkaduwa",
    },
    {
      region: "East Coast",
      bestTime: "May to September",
      places: "Trincomalee, Arugam Bay, Pasikuda",
    },
    {
      region: "Hill Country",
      bestTime: "January to April",
      places: "Kandy, Nuwara Eliya, Ella, Haputale",
    },
    {
      region: "Wildlife Parks",
      bestTime: "Varies by park",
      places: "Yala, Udawalawe, Wilpattu, Minneriya",
    },
  ];

  return (
    <div className="travel-essentials-page">
      <section className="travel-essentials-hero">
        <div className="travel-essentials-hero-content">
          <p className="travel-eyebrow">Travel Essentials</p>
          <h1>Useful information for a safe Sri Lanka journey</h1>
          <p>
            Find emergency contacts, travel tips, weather guidance, currency
            advice, transport options, and cultural reminders before planning
            your trip.
          </p>
        </div>
      </section>

      <section className="travel-section">
        <div className="travel-section-header">
          <div>
            <p className="travel-eyebrow">Emergency contacts</p>
            <h2>Important numbers for tourists</h2>
          </div>
          <p>
            Save these numbers before travelling. In a real emergency, contact
            the official emergency service directly.
          </p>
        </div>

        <div className="emergency-grid">
          {emergencyContacts.map((contact) => (
            <article className="emergency-card" key={contact.title}>
              <div>
                <span>{contact.type}</span>
                <h3>{contact.title}</h3>
                <p>{contact.description}</p>
              </div>
              <strong>{contact.number}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="travel-section">
        <div className="travel-section-header">
          <div>
            <p className="travel-eyebrow">Before you travel</p>
            <h2>Essential information categories</h2>
          </div>
        </div>

        <div className="essentials-grid">
          {essentials.map((item) => (
            <article className="essential-info-card" key={item.title}>
              <div className="essential-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span>{item.action}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="travel-split-section">
        <div className="travel-tips-card">
          <p className="travel-eyebrow">Smart travel tips</p>
          <h2>Quick checklist</h2>

          <ul>
            {travelTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>

        <div className="season-card">
          <p className="travel-eyebrow">Weather guidance</p>
          <h2>Best time by region</h2>

          <div className="season-list">
            {seasonalGuides.map((guide) => (
              <div className="season-row" key={guide.region}>
                <div>
                  <h3>{guide.region}</h3>
                  <p>{guide.places}</p>
                </div>
                <span>{guide.bestTime}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="travel-note-banner">
        <div>
          <p className="travel-eyebrow">TourismHub LK note</p>
          <h2>Connect this page with your full travel plan</h2>
          <p>
            Later, this page can connect with the Trip Planner, Transport module,
            Guides module, and Admin content management so updated travel notices
            can be published by admins.
          </p>
        </div>
      </section>
    </div>
  );
}

export default TravelEssentialsPage;