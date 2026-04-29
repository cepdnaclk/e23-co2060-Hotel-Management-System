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
    pace: "Balanced",
    accommodationType: "Hotel",
    transport: "Mixed",
    guidePreference: "Cultural guide",
    interests: ["Culture", "Nature"],
  });

  const destinationOptions = [
    "Colombo",
    "Kandy",
    "Sigiriya",
    "Dambulla",
    "Nuwara Eliya",
    "Ella",
    "Galle",
    "Mirissa",
    "Bentota",
    "Hikkaduwa",
    "Yala",
    "Udawalawe",
    "Kitulgala",
    "Arugam Bay",
    "Trincomalee",
  ];

  const interestOptions = [
    "Beach",
    "Culture",
    "Wildlife",
    "Nature",
    "Adventure",
    "Food",
    "Wellness",
    "Shopping",
  ];

  const destinationData = {
    Colombo: {
      city: "Colombo",
      title: "Arrival and Colombo city experience",
      activities: ["Galle Face Green", "Lotus Tower", "Pettah Market"],
      bestFor: ["Food", "Shopping"],
    },
    Kandy: {
      city: "Kandy",
      title: "Culture, lake views, and sacred sites",
      activities: ["Temple of the Tooth", "Kandy Lake", "Cultural dance show"],
      bestFor: ["Culture", "Nature"],
    },
    Sigiriya: {
      city: "Sigiriya",
      title: "Ancient rock fortress and nature views",
      activities: ["Sigiriya Rock", "Pidurangala", "Village tour"],
      bestFor: ["Culture", "Nature", "Adventure"],
    },
    Dambulla: {
      city: "Dambulla",
      title: "Cave temple and heritage stop",
      activities: ["Dambulla Cave Temple", "Spice garden", "Local food stop"],
      bestFor: ["Culture", "Food"],
    },
    "Nuwara Eliya": {
      city: "Nuwara Eliya",
      title: "Tea country and cool climate",
      activities: ["Tea estate", "Gregory Lake", "Victoria Park"],
      bestFor: ["Nature", "Wellness"],
    },
    Ella: {
      city: "Ella",
      title: "Hill country, waterfalls, and viewpoints",
      activities: ["Nine Arches Bridge", "Little Adam's Peak", "Ravana Falls"],
      bestFor: ["Nature", "Adventure"],
    },
    Galle: {
      city: "Galle",
      title: "Fort city, beaches, and cafes",
      activities: ["Galle Fort", "Unawatuna Beach", "Jungle Beach"],
      bestFor: ["Beach", "Culture", "Food"],
    },
    Mirissa: {
      city: "Mirissa",
      title: "Beach relaxation and whale watching",
      activities: ["Whale watching", "Coconut Tree Hill", "Secret Beach"],
      bestFor: ["Beach", "Nature"],
    },
    Bentota: {
      city: "Bentota",
      title: "Beach stay and water activities",
      activities: ["Bentota Beach", "Boat safari", "Water sports"],
      bestFor: ["Beach", "Adventure"],
    },
    Hikkaduwa: {
      city: "Hikkaduwa",
      title: "Coral beach and snorkeling",
      activities: ["Coral reef", "Snorkeling", "Beach cafes"],
      bestFor: ["Beach", "Adventure"],
    },
    Yala: {
      city: "Yala",
      title: "Leopard safari and wildlife stay",
      activities: ["Yala National Park", "Evening safari", "Nature photography"],
      bestFor: ["Wildlife", "Nature"],
    },
    Udawalawe: {
      city: "Udawalawe",
      title: "Elephants and national park safari",
      activities: ["Udawalawe National Park", "Elephant Transit Home"],
      bestFor: ["Wildlife", "Nature"],
    },
    Kitulgala: {
      city: "Kitulgala",
      title: "Rafting and rainforest adventure",
      activities: ["White water rafting", "Rainforest walk", "River bathing"],
      bestFor: ["Adventure", "Nature"],
    },
    "Arugam Bay": {
      city: "Arugam Bay",
      title: "Surfing and beach lifestyle",
      activities: ["Surf lesson", "Lagoon tour", "Beach sunset"],
      bestFor: ["Beach", "Adventure"],
    },
    Trincomalee: {
      city: "Trincomalee",
      title: "Eastern beaches and marine activities",
      activities: ["Nilaveli Beach", "Pigeon Island", "Koneswaram Temple"],
      bestFor: ["Beach", "Culture", "Nature"],
    },
  };

  const [customPlan, setCustomPlan] = useState([]);

  function handleChange(event) {
    const { name, value } = event.target;

    setPlannerData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function handleInterestChange(interest) {
    setPlannerData((currentData) => {
      const alreadySelected = currentData.interests.includes(interest);

      return {
        ...currentData,
        interests: alreadySelected
          ? currentData.interests.filter((item) => item !== interest)
          : [...currentData.interests, interest],
      };
    });
  }

  function getGuideText(city) {
    if (plannerData.guidePreference === "No guide") {
      return "No guide selected";
    }

    if (plannerData.guidePreference === "City guide") {
      return `City guide recommended in ${city}`;
    }

    if (plannerData.guidePreference === "Wildlife guide") {
      return "Wildlife guide recommended where safari activities are included";
    }

    if (plannerData.guidePreference === "Adventure guide") {
      return "Adventure guide recommended for hiking or activity days";
    }

    return `Cultural guide recommended in ${city}`;
  }

  function chooseDestinations() {
    const selectedInterests = plannerData.interests;

    let matchedDestinations = Object.values(destinationData).filter(
      (destination) =>
        destination.bestFor.some((interest) =>
          selectedInterests.includes(interest)
        )
    );

    if (matchedDestinations.length === 0) {
      matchedDestinations = Object.values(destinationData);
    }

    const stylePriority = {
      Cultural: [
        "Colombo",
        "Sigiriya",
        "Dambulla",
        "Kandy",
        "Nuwara Eliya",
        "Ella",
      ],
      Beach: [
        "Colombo",
        "Bentota",
        "Galle",
        "Mirissa",
        "Hikkaduwa",
        "Trincomalee",
      ],
      Wildlife: ["Colombo", "Udawalawe", "Yala", "Ella", "Kandy", "Sigiriya"],
      Adventure: [
        "Colombo",
        "Kitulgala",
        "Ella",
        "Nuwara Eliya",
        "Arugam Bay",
        "Hikkaduwa",
      ],
      Family: ["Colombo", "Kandy", "Nuwara Eliya", "Ella", "Galle", "Bentota"],
    };

    const orderedCities =
      stylePriority[plannerData.style] || stylePriority.Cultural;

    const orderedMatched = orderedCities
      .map((city) =>
        matchedDestinations.find((destination) => destination.city === city)
      )
      .filter(Boolean);

    const remaining = matchedDestinations.filter(
      (destination) =>
        !orderedMatched.some((item) => item.city === destination.city)
    );

    return [...orderedMatched, ...remaining];
  }

  function generatePlan() {
    const requestedDays = Math.max(1, Number(plannerData.days) || 1);
    const selectedDestinations = chooseDestinations();

    const plan = [];

    for (let index = 0; index < requestedDays; index += 1) {
      const destination =
        selectedDestinations[index % selectedDestinations.length] ||
        destinationData[plannerData.startCity] ||
        destinationData.Colombo;

      const dayNumber = index + 1;

      plan.push({
        id: `${dayNumber}-${destination.city}-${Date.now()}`,
        day: dayNumber,
        city: destination.city,
        title: destination.title,
        activities: [...destination.activities],
        guide: getGuideText(destination.city),
        notes: "",
      });
    }

    setCustomPlan(plan);
  }

  const groupedPlan = useMemo(() => {
    const groups = [];

    customPlan.forEach((day) => {
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.city === day.city) {
        lastGroup.days.push(day);
        lastGroup.endDay = day.day;
      } else {
        groups.push({
          id: `${day.city}-${day.day}`,
          city: day.city,
          startDay: day.day,
          endDay: day.day,
          days: [day],
        });
      }
    });

    return groups;
  }, [customPlan]);

  const generatedSummary = useMemo(() => {
    const titleMap = {
      Cultural: "Cultural Heritage Journey",
      Beach: "Beach Holiday Escape",
      Wildlife: "Wildlife Safari Adventure",
      Adventure: "Adventure and Nature Route",
      Family: "Family Friendly Sri Lanka Trip",
    };

    return {
      title: titleMap[plannerData.style] || "Custom Sri Lanka Trip",
      description: `${plannerData.days}-day ${plannerData.style.toLowerCase()} trip with ${plannerData.pace.toLowerCase()} pace, ${plannerData.budget.toLowerCase()} budget, ${plannerData.transport.toLowerCase()} transport, and ${plannerData.accommodationType.toLowerCase()} accommodation preference.`,
    };
  }, [plannerData]);

  function formatDayRange(group) {
    if (group.startDay === group.endDay) {
      return `Day ${group.startDay}`;
    }

    return `Day ${group.startDay} - Day ${group.endDay}`;
  }

  function handleGroupCityChange(group, newCity) {
    const destination = destinationData[newCity];

    setCustomPlan((currentPlan) =>
      currentPlan.map((day) => {
        const belongsToGroup = group.days.some((groupDay) => groupDay.id === day.id);

        if (!belongsToGroup) {
          return day;
        }

        return {
          ...day,
          city: destination.city,
          title: destination.title,
          activities: [...destination.activities],
          guide: getGuideText(destination.city),
        };
      })
    );
  }

  function removeGroup(group) {
    setCustomPlan((currentPlan) =>
      currentPlan
        .filter(
          (day) => !group.days.some((groupDay) => groupDay.id === day.id)
        )
        .map((day, index) => ({
          ...day,
          day: index + 1,
        }))
    );
  }

  function removeDay(dayId) {
    setCustomPlan((currentPlan) =>
      currentPlan
        .filter((day) => day.id !== dayId)
        .map((day, index) => ({
          ...day,
          day: index + 1,
        }))
    );
  }

  function addFlexibleDay() {
    const dayNumber = customPlan.length + 1;
    const destination =
      destinationData[plannerData.startCity] || destinationData.Colombo;

    setCustomPlan((currentPlan) => [
      ...currentPlan,
      {
        id: `${dayNumber}-custom-${Date.now()}`,
        day: dayNumber,
        city: destination.city,
        title: "Flexible custom day",
        activities: [
          "Relax at hotel",
          "Explore nearby attractions",
          "Add event or guide activity",
        ],
        guide: getGuideText(destination.city),
        notes: "",
      },
    ]);
  }

  function addActivity(dayId) {
    const activity = window.prompt("Enter new activity for this day:");

    if (!activity || !activity.trim()) {
      return;
    }

    setCustomPlan((currentPlan) =>
      currentPlan.map((day) =>
        day.id === dayId
          ? {
              ...day,
              activities: [...day.activities, activity.trim()],
            }
          : day
      )
    );
  }

  function removeActivity(dayId, activityName) {
    setCustomPlan((currentPlan) =>
      currentPlan.map((day) =>
        day.id === dayId
          ? {
              ...day,
              activities: day.activities.filter(
                (activity) => activity !== activityName
              ),
            }
          : day
      )
    );
  }

  function updateNotes(dayId, notes) {
    setCustomPlan((currentPlan) =>
      currentPlan.map((day) =>
        day.id === dayId
          ? {
              ...day,
              notes,
            }
          : day
      )
    );
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
    if (customPlan.length === 0) {
      alert("Please generate a trip plan first.");
      return;
    }

    const savedTrip = {
      plannerData,
      generatedSummary,
      days: customPlan,
      groupedPlan,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("tourismhub_saved_trip_plan", JSON.stringify(savedTrip));

    alert(
      "Custom trip plan saved successfully. Later we can show it inside My Trips."
    );
  }

  return (
    <div className="trip-planner-page">
      <section className="trip-planner-hero">
        <div className="trip-planner-hero-content">
          <p className="trip-eyebrow">Smart Trip Planner</p>
          <h1>Create a custom Sri Lanka tour plan</h1>
          <p>
            Select your days, interests, pace, budget, accommodation type,
            transport preference, and guide option. Then customize destinations.
            Consecutive days in the same place are automatically grouped.
          </p>
        </div>
      </section>

      <section className="planner-layout custom-planner-layout">
        <aside className="planner-control-card">
          <h2>Plan settings</h2>
          <p>Change preferences and generate a more personal route.</p>

          <label>
            Number of days
            <input
              type="number"
              name="days"
              min="1"
              max="30"
              value={plannerData.days}
              onChange={handleChange}
              placeholder="Enter number of days"
            />
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
              {destinationOptions.map((city) => (
                <option value={city} key={city}>
                  {city}
                </option>
              ))}
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

          <label>
            Travel pace
            <select name="pace" value={plannerData.pace} onChange={handleChange}>
              <option value="Relaxed">Relaxed</option>
              <option value="Balanced">Balanced</option>
              <option value="Fast">Fast</option>
            </select>
          </label>

          <label>
            Accommodation type
            <select
              name="accommodationType"
              value={plannerData.accommodationType}
              onChange={handleChange}
            >
              <option value="Guest House">Guest House</option>
              <option value="Hotel">Hotel</option>
              <option value="Resort">Resort</option>
              <option value="Villa">Villa</option>
              <option value="Luxury Hotel">Luxury Hotel</option>
            </select>
          </label>

          <label>
            Transport preference
            <select
              name="transport"
              value={plannerData.transport}
              onChange={handleChange}
            >
              <option value="Mixed">Mixed</option>
              <option value="Train">Train</option>
              <option value="Private car">Private car</option>
              <option value="Tuk tuk">Tuk tuk</option>
            </select>
          </label>

          <label>
            Guide preference
            <select
              name="guidePreference"
              value={plannerData.guidePreference}
              onChange={handleChange}
            >
              <option value="No guide">No guide</option>
              <option value="City guide">City guide</option>
              <option value="Cultural guide">Cultural guide</option>
              <option value="Wildlife guide">Wildlife guide</option>
              <option value="Adventure guide">Adventure guide</option>
            </select>
          </label>

          <div className="planner-interest-box">
            <strong>Interests</strong>

            <div className="planner-interest-grid">
              {interestOptions.map((interest) => (
                <label key={interest} className="planner-checkbox-label">
                  <input
                    type="checkbox"
                    checked={plannerData.interests.includes(interest)}
                    onChange={() => handleInterestChange(interest)}
                  />
                  {interest}
                </label>
              ))}
            </div>
          </div>

          <button type="button" onClick={generatePlan}>
            Generate Custom Plan
          </button>

          <button
            type="button"
            className="planner-save-outline"
            onClick={saveTripPlan}
          >
            Save Trip Plan
          </button>
        </aside>

        <div className="planner-result-area">
          <div className="planner-result-header">
            <div>
              <p className="trip-eyebrow">Suggested custom route</p>
              <h2>{generatedSummary.title}</h2>
              <p>{generatedSummary.description}</p>
            </div>

            <div className="planner-summary-box">
              <strong>{plannerData.days || 1} days</strong>
              <span>{plannerData.style}</span>
              <span>{plannerData.budget}</span>
              <span>{plannerData.pace}</span>
            </div>
          </div>

          {customPlan.length === 0 ? (
            <div className="empty-trip-plan-card">
              <h3>No trip generated yet</h3>
              <p>
                Choose your preferences on the left and click Generate Custom
                Plan. Then you can change cities, add activities, remove days,
                and find accommodation.
              </p>
            </div>
          ) : (
            <>
              <div className="trip-custom-actions">
                <button type="button" onClick={addFlexibleDay}>
                  + Add flexible day
                </button>
                <button type="button" onClick={saveTripPlan}>
                  Save final plan
                </button>
              </div>

              <div className="trip-day-list">
                {groupedPlan.map((group) => (
                  <article className="trip-day-card grouped-trip-card" key={group.id}>
                    <div className="trip-day-number">
                      <span>{group.startDay === group.endDay ? "Day" : "Days"}</span>
                      <strong>
                        {group.startDay === group.endDay
                          ? group.startDay
                          : `${group.startDay}-${group.endDay}`}
                      </strong>
                    </div>

                    <div className="trip-day-content">
                      <div className="trip-day-title-row">
                        <div>
                          <select
                            className="trip-city-select"
                            value={group.city}
                            onChange={(event) =>
                              handleGroupCityChange(group, event.target.value)
                            }
                          >
                            {destinationOptions.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>

                          <p className="grouped-day-range">
                            {formatDayRange(group)} in {group.city}
                          </p>
                        </div>

                        <div className="trip-day-button-group">
                          <button
                            type="button"
                            onClick={() => findAccommodation(group.city)}
                          >
                            Find accommodation
                          </button>

                          <button
                            type="button"
                            className="trip-remove-button"
                            onClick={() => removeGroup(group)}
                          >
                            Remove stay
                          </button>
                        </div>
                      </div>

                      {group.days.map((day) => (
                        <div className="grouped-day-detail" key={day.id}>
                          <div className="grouped-day-detail-header">
                            <h4>Day {day.day}</h4>
                            <button
                              type="button"
                              onClick={() => removeDay(day.id)}
                            >
                              Remove day
                            </button>
                          </div>

                          <p>{day.title}</p>

                          <div className="trip-activity-list">
                            {day.activities.map((activity) => (
                              <span key={activity}>
                                {activity}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeActivity(day.id, activity)
                                  }
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>

                          <button
                            type="button"
                            className="add-activity-button"
                            onClick={() => addActivity(day.id)}
                          >
                            + Add activity
                          </button>

                          <div className="trip-guide-note">
                            <strong>Guide:</strong> {day.guide}
                          </div>

                          <textarea
                            className="trip-notes-box"
                            placeholder="Add your own notes for this day..."
                            value={day.notes}
                            onChange={(event) =>
                              updateNotes(day.id, event.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default TripPlannerPage;