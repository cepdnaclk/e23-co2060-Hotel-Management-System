import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function EventsPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    city: "All",
    category: "All",
    searchText: "",
  });

  const events = [
    {
      id: 1,
      title: "Kandy Cultural Dance Evening",
      city: "Kandy",
      category: "Cultural",
      date: "2026-05-20",
      time: "6:30 PM",
      price: 3500,
      image:
        "https://images.unsplash.com/photo-1518084823714-2f59a7315a39?auto=format&fit=crop&w=1000&q=80",
      description:
        "An evening of traditional Kandyan dance, drums, costumes, and cultural storytelling near Kandy Lake.",
      highlight: "Heritage performance",
    },
    {
      id: 2,
      title: "Galle Fort Heritage Walk",
      city: "Galle",
      category: "Heritage",
      date: "2026-05-22",
      time: "4:00 PM",
      price: 2500,
      image:
        "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1000&q=80",
      description:
        "Explore colonial streets, museums, lighthouse views, hidden cafes, and the living history of Galle Fort.",
      highlight: "Guided old town walk",
    },
    {
      id: 3,
      title: "Mirissa Whale Watching Morning",
      city: "Mirissa",
      category: "Nature",
      date: "2026-05-24",
      time: "6:00 AM",
      price: 9500,
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
      description:
        "A morning ocean experience for tourists who want to discover Sri Lanka’s marine life and coastal beauty.",
      highlight: "Ocean experience",
    },
    {
      id: 4,
      title: "Ella Sunrise Hike",
      city: "Ella",
      category: "Adventure",
      date: "2026-05-26",
      time: "5:30 AM",
      price: 4000,
      image:
        "https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1000&q=80",
      description:
        "Start early and hike to scenic viewpoints with a local guide, mountain air, tea country views, and waterfalls.",
      highlight: "Hill country adventure",
    },
    {
      id: 5,
      title: "Colombo Street Food Night",
      city: "Colombo",
      category: "Food",
      date: "2026-05-28",
      time: "7:00 PM",
      price: 3000,
      image:
        "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1000&q=80",
      description:
        "Taste kottu, hoppers, short eats, seafood, and local desserts while exploring Colombo’s night food culture.",
      highlight: "Local taste journey",
    },
    {
      id: 6,
      title: "Yala Safari Experience",
      city: "Yala",
      category: "Wildlife",
      date: "2026-05-30",
      time: "2:30 PM",
      price: 12000,
      image:
        "https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=1000&q=80",
      description:
        "Discover wildlife, birds, elephants, and possible leopard sightings with a safari team and nature guide.",
      highlight: "Wildlife safari",
    },
  ];

  const cities = ["All", ...new Set(events.map((event) => event.city))];
  const categories = ["All", ...new Set(events.map((event) => event.category))];

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCity = filters.city === "All" || event.city === filters.city;
      const matchesCategory =
        filters.category === "All" || event.category === filters.category;

      const searchValue = filters.searchText.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        event.title.toLowerCase().includes(searchValue) ||
        event.city.toLowerCase().includes(searchValue) ||
        event.category.toLowerCase().includes(searchValue);

      return matchesCity && matchesCategory && matchesSearch;
    });
  }, [filters]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function resetFilters() {
    setFilters({
      city: "All",
      category: "All",
      searchText: "",
    });
  }

  function findAccommodation(city) {
    const searchData = {
      destination: city,
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

  function addEventToTrip(selectedEvent) {
    const storedTrip = localStorage.getItem("tourismhub_saved_trip_plan");

    if (!storedTrip) {
      const goToPlanner = window.confirm(
        "You do not have a saved trip plan yet. Go to Trip Planner now?"
      );

      if (goToPlanner) {
        navigate("/trip-planner");
      }

      return;
    }

    const savedTrip = JSON.parse(storedTrip);
    const existingEvents = savedTrip.events || [];

    const alreadyAdded = existingEvents.some(
      (event) => event.id === selectedEvent.id
    );

    if (alreadyAdded) {
      alert("This event is already added to your saved trip.");
      return;
    }

    const updatedTrip = {
      ...savedTrip,
      events: [
        ...existingEvents,
        {
          id: selectedEvent.id,
          title: selectedEvent.title,
          city: selectedEvent.city,
          category: selectedEvent.category,
          date: selectedEvent.date,
          time: selectedEvent.time,
          price: selectedEvent.price,
          addedAt: new Date().toISOString(),
        },
      ],
    };

    localStorage.setItem("tourismhub_saved_trip_plan", JSON.stringify(updatedTrip));

    alert(`${selectedEvent.title} added to your saved trip.`);
  }

  return (
    <div className="events-page">
      <section className="events-heritage-hero">
        <div className="events-heritage-content">
          <p className="events-kicker">Events & Experiences</p>
          <h1>A journey through culture, flavor, nature, and celebration</h1>
          <p>
            Discover Sri Lankan festivals, heritage walks, food nights, wildlife
            safaris, cultural performances, and destination-based experiences.
          </p>

          <div className="events-hero-actions">
            <a href="#events-list">Explore Events</a>
            <button type="button" onClick={() => navigate("/trip-planner")}>
              Plan Around Events
            </button>
          </div>
        </div>
      </section>

      <section className="events-intro-section">
        <div>
          <p className="events-kicker">Curated experiences</p>
          <h2>Make your Sri Lanka trip more memorable</h2>
        </div>
        <p>
          Inspired by premium heritage travel design, this page presents events
          as experiences tourists can add to their journey, connect with hotels,
          and later manage through admin and partner modules.
        </p>
      </section>

      <section className="events-filter-panel" id="events-list">
        <div className="events-filter-heading">
          <div>
            <p className="events-kicker">Find experiences</p>
            <h2>Filter events by city and category</h2>
          </div>

          <button type="button" onClick={resetFilters}>
            Reset
          </button>
        </div>

        <div className="events-filter-grid">
          <label>
            Search
            <input
              type="text"
              name="searchText"
              placeholder="Search cultural, safari, food..."
              value={filters.searchText}
              onChange={handleChange}
            />
          </label>

          <label>
            City
            <select name="city" value={filters.city} onChange={handleChange}>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label>
            Category
            <select
              name="category"
              value={filters.category}
              onChange={handleChange}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="events-showcase-grid">
        {filteredEvents.map((event) => (
          <article className="heritage-event-card" key={event.id}>
            <div className="heritage-event-image">
              <img src={event.image} alt={event.title} />
              <span>{event.highlight}</span>
            </div>

            <div className="heritage-event-body">
              <p className="events-kicker">{event.category}</p>
              <h3>{event.title}</h3>
              <p>{event.description}</p>

              <div className="heritage-event-meta">
                <span>{event.city}</span>
                <span>{event.date}</span>
                <span>{event.time}</span>
              </div>

              <div className="heritage-event-footer">
                <strong>LKR {event.price.toLocaleString()}</strong>

                <div>
                  <button
                    type="button"
                    className="event-gold-button"
                    onClick={() => addEventToTrip(event)}
                  >
                    Add to My Trip
                  </button>

                  <button
                    type="button"
                    className="event-outline-button"
                    onClick={() => findAccommodation(event.city)}
                  >
                    Hotels nearby
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {filteredEvents.length === 0 && (
        <section className="no-events-card">
          <h3>No events found</h3>
          <p>Try changing city, category, or search text.</p>
        </section>
      )}

      <section className="events-closing-banner">
        <div>
          <p className="events-kicker">TourismHub LK</p>
          <h2>Turn experiences into a complete journey</h2>
          <p>
            Tourists can add events to their saved trip, find nearby
            accommodation, request guides, and later combine everything into one
            travel package.
          </p>
        </div>
      </section>
    </div>
  );
}

export default EventsPage;