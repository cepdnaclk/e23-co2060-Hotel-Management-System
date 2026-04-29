import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function TripPlannerPage() {
  const navigate = useNavigate();

  const [plannerData, setPlannerData] = useState({
    days: "5",
    style: "Cultural",
    budget: "Mid-range",
    startCity: "Colombo",
    travelers: "2",
  });

  const tripPlans = {
    Cultural: {
      title: "Cultural Heritage Journey",
      description:
        "A route focused on ancient kingdoms, temples, cultural cities, and Sri Lankan history.",
      days: [
        {
          day: 1,
          city: "Colombo",
          title: "Arrival and Colombo city introduction",
          activities: ["Galle Face Green", "Lotus Tower", "Pettah Market"],
          guide: "City guide recommended",
        },
        {
          day: 2,
          city: "Sigiriya",
          title: "Ancient rock fortress and village experience",
          activities: ["Sigiriya Rock", "Pidurangala", "Village tour"],
          guide: "Cultural guide recommended",
        },
        {
          day: 3,
          city: "Dambulla",
          title: "Temple and heritage exploration",
          activities: ["Dambulla Cave Temple", "Spice garden", "Local food stop"],
          guide: "Heritage guide recommended",
        },
        {
          day: 4,
          city: "Kandy",
          title: "Kandy culture and sacred sites",
          activities: ["Temple of the Tooth", "Kandy Lake", "Cultural dance show"],
          guide: "Kandy cultural guide recommended",
        },
        {
          day: 5,
          city: "Nuwara Eliya",
          title: "Tea country and cool climate",
          activities: ["Tea estate", "Gregory Lake", "Victoria Park"],
          guide: "Local guide optional",
        },
      ],
    },

    Beach: {
      title: "Beach Holiday Escape",
      description:
        "A relaxing coastal route with beaches, seafood, surfing, whale watching, and sunset views.",
      days: [
        {
          day: 1,
          city: "Colombo",
          title: "Arrival and city stay",
          activities: ["Galle Face Green", "Shopping", "Food tour"],
          guide: "City guide optional",
        },
        {
          day: 2,
          city: "Bentota",
          title: "Beach relaxation and water activities",
          activities: ["Bentota Beach", "Boat safari", "Water sports"],
          guide: "Activity guide optional",
        },
        {
          day: 3,
          city: "Galle",
          title: "Fort, cafes, and coastal history",
          activities: ["Galle Fort", "Unawatuna Beach", "Jungle Beach"],
          guide: "Fort guide recommended",
        },
        {
          day: 4,
          city: "Mirissa",
          title: "Whale watching and beach sunset",
          activities: ["Whale watching", "Coconut Tree Hill", "Secret Beach"],
          guide: "Marine tour guide optional",
        },
        {
          day: 5,
          city: "Hikkaduwa",
          title: "Snorkeling and coral beach",
          activities: ["Coral reef", "Snorkeling", "Beach cafes"],
          guide: "Activity guide optional",
        },
      ],
    },

    Wildlife: {
      title: "Wildlife Safari Adventure",
      description:
        "A nature-focused trip with national parks, elephants, leopards, birds, and scenic stays.",
      days: [
        {
          day: 1,
          city: "Colombo",
          title: "Arrival and preparation",
          activities: ["Rest", "Travel briefing", "City dinner"],
          guide: "Travel assistant optional",
        },
        {
          day: 2,
          city: "Udawalawe",
          title: "Elephant safari experience",
          activities: ["Udawalawe National Park", "Elephant Transit Home"],
          guide: "Safari guide recommended",
        },
        {
          day: 3,
          city: "Yala",
          title: "Leopard and wildlife safari",
          activities: ["Yala National Park", "Evening safari", "Nature photography"],
          guide: "Safari guide recommended",
        },
        {
          day: 4,
          city: "Ella",
          title: "Nature and hill country rest",
          activities: ["Nine Arches Bridge", "Little Adam's Peak", "Ravana Falls"],
          guide: "Hiking guide optional",
        },
        {
          day: 5,
          city: "Kandy",
          title: "Culture and nature combination",
          activities: ["Kandy Lake", "Botanical Garden", "Temple visit"],
          guide: "Local guide optional",
        },
      ],
    },

    Adventure: {
      title: "Adventure and Nature Route",
      description:
        "A route for tourists who enjoy hiking, rafting, surfing, waterfalls, and active experiences.",
      days: [
        {
          day: 1,
          city: "Colombo",
          title: "Arrival and trip preparation",
          activities: ["City walk", "Food stop", "Rest"],
          guide: "City guide optional",
        },
        {
          day: 2,
          city: "Kitulgala",
          title: "Rafting and rainforest adventure",
          activities: ["White water rafting", "Rainforest walk", "River bathing"],
          guide: "Adventure guide recommended",
        },
        {
          day: 3,
          city: "Ella",
          title: "Hiking and viewpoints",
          activities: ["Little Adam's Peak", "Nine Arches Bridge", "Ravana Falls"],
          guide: "Hiking guide optional",
        },
        {
          day: 4,
          city: "Nuwara Eliya",
          title: "Highland adventure",
          activities: ["Horton Plains", "World's End", "Tea estate"],
          guide: "Nature guide recommended",
        },
        {
          day: 5,
          city: "Arugam Bay",
          title: "Surfing and beach activities",
          activities: ["Surf lesson", "Beach sunset", "Lagoon tour"],
          guide: "Surf instructor optional",
        },
      ],
    },

    Family: {
      title: "Family Friendly Sri Lanka Trip",
      description:
        "A comfortable route for families with safe activities, easy transport, nature, and culture.",
      days: [
        {
          day: 1,
          city: "Colombo",
          title: "Arrival and easy city visit",
          activities: ["Galle Face", "Shopping mall", "Family dinner"],
          guide: "City guide optional",
        },
        {
          day: 2,
          city: "Kandy",
          title: "Culture and lake views",
          activities: ["Temple of the Tooth", "Kandy Lake", "Botanical Garden"],
          guide: "Family guide recommended",
        },
        {
          day: 3,
          city: "Nuwara Eliya",
          title: "Cool climate and gardens",
          activities: ["Gregory Lake", "Tea factory", "Victoria Park"],
          guide: "Local guide optional",
        },
        {
          day: 4,
          city: "Ella",
          title: "Light nature experiences",
          activities: ["Nine Arches Bridge", "Ravana Falls", "Scenic viewpoints"],
          guide: "Guide optional",
        },
        {
          day: 5,
          city: "Galle",
          title: "Beach and fort walk",
          activities: ["Galle Fort", "Unawatuna Beach", "Cafe visit"],
          guide: "Fort guide optional",
        },
      ],
    },
  };

  const generatedPlan = useMemo(() => {
    const selectedPlan = tripPlans[plannerData.style] || tripPlans.Cultural;
    const requestedDays = Number(plannerData.days);
    const selectedDays = selectedPlan.days.slice(0, requestedDays);

    if (requestedDays > selectedPlan.days.length) {
      const extraDays = requestedDays - selectedPlan.days.length;

      for (let index = 1; index <= extraDays; index += 1) {
        selectedDays.push({
          day: selectedPlan.days.length + index,
          city: selectedPlan.days[selectedPlan.days.length - 1].city,
          title: "Flexible free day",
          activities: [
            "Relax at hotel",
            "Explore nearby attractions",
            "Add event or guide activity",
          ],
          guide: "Guide optional",
        });
      }
    }

    return {
      ...selectedPlan,
      days: selectedDays,
    };
  }, [plannerData.days, plannerData.style]);

  function handleChange(event) {
    const { name, value } = event.target;

    setPlannerData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function findAccommodation(city) {
    const searchData = {
      destination: city,
      checkIn: localStorage.getItem("tourismhub_check_in") || "2026-05-18",
      checkOut: localStorage.getItem("tourismhub_check_out") || "2026-05-19",
      guests: plannerData.travelers,
      guestText: `${plannerData.travelers} adult${
        Number(plannerData.travelers) > 1 ? "s" : ""
      } · 1 room`,
    };

    localStorage.setItem("tourismhub_search_data", JSON.stringify(searchData));
    localStorage.setItem("tourismhub_check_in", searchData.checkIn);
    localStorage.setItem("tourismhub_check_out", searchData.checkOut);
    localStorage.setItem("tourismhub_guests", searchData.guests);
    localStorage.setItem("tourismhub_guest_text", searchData.guestText);

    navigate("/hotels");
  }

  function saveTripPlan() {
    const savedTrip = {
      plannerData,
      generatedPlan,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("tourismhub_saved_trip_plan", JSON.stringify(savedTrip));

    alert("Trip plan saved successfully. Later we can show it inside My Trips.");
  }

  return (
    <div className="trip-planner-page">
      <section className="trip-planner-hero">
        <div className="trip-planner-hero-content">
          <p className="trip-eyebrow">Smart Trip Planner</p>
          <h1>Create your Sri Lanka tour plan</h1>
          <p>
            Choose your travel days, style, budget, and start city. TourismHub LK
            will suggest a simple route and connect each destination with
            accommodation, events, guides, and transport options.
          </p>
        </div>
      </section>

      <section className="planner-layout">
        <aside className="planner-control-card">
          <h2>Plan settings</h2>
          <p>Change your preferences and the suggested route will update.</p>

          <label>
            Number of days
            <select name="days" value={plannerData.days} onChange={handleChange}>
              <option value="3">3 days</option>
              <option value="5">5 days</option>
              <option value="7">7 days</option>
              <option value="10">10 days</option>
            </select>
          </label>

          <label>
            Travel style
            <select name="style" value={plannerData.style} onChange={handleChange}>
              <option value="Cultural">Cultural</option>
              <option value="Beach">Beach holiday</option>
              <option value="Wildlife">Wildlife safari</option>
              <option value="Adventure">Adventure</option>
              <option value="Family">Family trip</option>
            </select>
          </label>

          <label>
            Budget level
            <select
              name="budget"
              value={plannerData.budget}
              onChange={handleChange}
            >
              <option value="Budget">Budget</option>
              <option value="Mid-range">Mid-range</option>
              <option value="Luxury">Luxury</option>
            </select>
          </label>

          <label>
            Start city
            <select
              name="startCity"
              value={plannerData.startCity}
              onChange={handleChange}
            >
              <option value="Colombo">Colombo</option>
              <option value="Kandy">Kandy</option>
              <option value="Galle">Galle</option>
              <option value="Ella">Ella</option>
            </select>
          </label>

          <label>
            Travelers
            <select
              name="travelers"
              value={plannerData.travelers}
              onChange={handleChange}
            >
              <option value="1">1 traveler</option>
              <option value="2">2 travelers</option>
              <option value="3">3 travelers</option>
              <option value="4">4 travelers</option>
            </select>
          </label>

          <button type="button" onClick={saveTripPlan}>
            Save Trip Plan
          </button>
        </aside>

        <div className="planner-result-area">
          <div className="planner-result-header">
            <div>
              <p className="trip-eyebrow">Suggested route</p>
              <h2>{generatedPlan.title}</h2>
              <p>{generatedPlan.description}</p>
            </div>

            <div className="planner-summary-box">
              <strong>{plannerData.days} days</strong>
              <span>{plannerData.style}</span>
              <span>{plannerData.budget}</span>
            </div>
          </div>

          <div className="trip-day-list">
            {generatedPlan.days.map((day) => (
              <article className="trip-day-card" key={`${day.day}-${day.city}`}>
                <div className="trip-day-number">
                  <span>Day</span>
                  <strong>{day.day}</strong>
                </div>

                <div className="trip-day-content">
                  <div className="trip-day-title-row">
                    <div>
                      <h3>{day.city}</h3>
                      <p>{day.title}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => findAccommodation(day.city)}
                    >
                      Find accommodation
                    </button>
                  </div>

                  <div className="trip-activity-list">
                    {day.activities.map((activity) => (
                      <span key={activity}>{activity}</span>
                    ))}
                  </div>

                  <div className="trip-guide-note">
                    <strong>Guide:</strong> {day.guide}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default TripPlannerPage;