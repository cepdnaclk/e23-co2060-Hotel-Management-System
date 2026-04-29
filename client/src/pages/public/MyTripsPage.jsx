import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function MyTripsPage() {
  const navigate = useNavigate();

  const [savedTrip, setSavedTrip] = useState(() => {
    const storedTrip = localStorage.getItem("tourismhub_saved_trip_plan");
    return storedTrip ? JSON.parse(storedTrip) : null;
  });

  const groupedPlan = useMemo(() => {
    if (!savedTrip?.days) {
      return [];
    }

    const groups = [];

    savedTrip.days.forEach((day) => {
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
  }, [savedTrip]);

  function formatDayRange(group) {
    if (group.startDay === group.endDay) {
      return `Day ${group.startDay}`;
    }

    return `Day ${group.startDay} - Day ${group.endDay}`;
  }

  function findAccommodation(city) {
    const travelers = savedTrip?.plannerData?.travelers || "2";

    const searchData = {
      destination: city,
      checkIn: localStorage.getItem("tourismhub_check_in") || "2026-05-18",
      checkOut: localStorage.getItem("tourismhub_check_out") || "2026-05-19",
      guests: travelers,
      guestText: `${travelers} adult${Number(travelers) > 1 ? "s" : ""} · 1 room`,
    };

    localStorage.setItem("tourismhub_search_data", JSON.stringify(searchData));
    localStorage.setItem("tourismhub_check_in", searchData.checkIn);
    localStorage.setItem("tourismhub_check_out", searchData.checkOut);
    localStorage.setItem("tourismhub_guests", searchData.guests);
    localStorage.setItem("tourismhub_guest_text", searchData.guestText);

    navigate("/hotels");
  }

  function deleteSavedTrip() {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your saved trip plan?"
    );

    if (!confirmDelete) {
      return;
    }

    localStorage.removeItem("tourismhub_saved_trip_plan");
    setSavedTrip(null);
  }

  if (!savedTrip) {
    return (
      <div className="my-trips-page">
        <section className="my-trips-empty-hero">
          <div>
            <p className="my-trips-eyebrow">My Trips</p>
            <h1>No saved trip plan yet</h1>
            <p>
              Create a custom Sri Lanka tour plan using the Smart Trip Planner,
              then save it here to continue your booking journey.
            </p>

            <Link to="/trip-planner">Create My Trip Plan</Link>
          </div>
        </section>
      </div>
    );
  }

  const plannerData = savedTrip.plannerData || {};
  const summary = savedTrip.generatedSummary || {};
  const savedDate = savedTrip.savedAt
    ? new Date(savedTrip.savedAt).toLocaleString()
    : "Recently saved";

  return (
    <div className="my-trips-page">
      <section className="my-trips-hero">
        <div className="my-trips-hero-content">
          <p className="my-trips-eyebrow">My Trips</p>
          <h1>{summary.title || "Saved Sri Lanka Trip"}</h1>
          <p>
            View your saved route, check grouped stays, find accommodation for
            each destination, and continue planning your Sri Lanka journey.
          </p>

          <div className="my-trips-hero-actions">
            <Link to="/trip-planner">Edit in Trip Planner</Link>
            <button type="button" onClick={deleteSavedTrip}>
              Delete Trip
            </button>
          </div>
        </div>
      </section>

      <section className="my-trips-summary-grid">
        <article>
          <span>Duration</span>
          <strong>{plannerData.days || savedTrip.days?.length || 0} days</strong>
        </article>

        <article>
          <span>Style</span>
          <strong>{plannerData.style || "Custom"}</strong>
        </article>

        <article>
          <span>Budget</span>
          <strong>{plannerData.budget || "Not selected"}</strong>
        </article>

        <article>
          <span>Travelers</span>
          <strong>{plannerData.travelers || "Not selected"}</strong>
        </article>

        <article>
          <span>Transport</span>
          <strong>{plannerData.transport || "Not selected"}</strong>
        </article>

        <article>
          <span>Saved</span>
          <strong>{savedDate}</strong>
        </article>
      </section>

      <section className="my-trips-route-section">
        <div className="my-trips-section-header">
          <div>
            <p className="my-trips-eyebrow">Saved route</p>
            <h2>Your grouped destination plan</h2>
          </div>

          <p>
            Consecutive days in the same destination are grouped together for a
            clearer travel plan.
          </p>
        </div>

        <div className="my-trips-route-list">
          {groupedPlan.map((group) => (
            <article className="my-trip-card" key={group.id}>
              <div className="my-trip-day-badge">
                <span>{group.startDay === group.endDay ? "Day" : "Days"}</span>
                <strong>
                  {group.startDay === group.endDay
                    ? group.startDay
                    : `${group.startDay}-${group.endDay}`}
                </strong>
              </div>

              <div className="my-trip-card-content">
                <div className="my-trip-card-header">
                  <div>
                    <h3>{group.city}</h3>
                    <p>{formatDayRange(group)} in {group.city}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => findAccommodation(group.city)}
                  >
                    Find accommodation
                  </button>
                </div>

                {group.days.map((day) => (
                  <div className="my-trip-day-detail" key={day.id}>
                    <h4>Day {day.day}</h4>
                    <p>{day.title}</p>

                    <div className="my-trip-activity-list">
                      {day.activities?.map((activity) => (
                        <span key={activity}>{activity}</span>
                      ))}
                    </div>

                    <div className="my-trip-guide-note">
                      <strong>Guide:</strong> {day.guide || "Guide optional"}
                    </div>

                    {day.notes && (
                      <div className="my-trip-notes">
                        <strong>Notes:</strong> {day.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default MyTripsPage;