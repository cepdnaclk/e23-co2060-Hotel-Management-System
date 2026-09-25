const TRIP_PLANNER_DRAFT_KEY =
  "tourismhub_trip_planner_draft_v2";

const TRIP_PLANNER_RETURN_KEY =
  "tourismhub_trip_planner_return_v1";

const readExistingPlannerDraft = () => {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(
        TRIP_PLANNER_DRAFT_KEY
      ) || "null"
    );

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : null;
  } catch {
    return null;
  }
};

const todayInputValue = () => {
  const now = new Date();

  const local = new Date(
    now.getTime() -
      now.getTimezoneOffset() *
        60000
  );

  return local
    .toISOString()
    .slice(0, 10);
};

const addDays = (
  dateString,
  amount
) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  date.setDate(
    date.getDate() +
      Number(amount || 0)
  );

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeDestination = (
  place
) => {
  const id =
    Number(place?.id);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return null;
  }

  const rawImage =
    place?.image ||
    place?.imageUrl ||
    place?.image_url ||
    place?.images?.[0] ||
    "";

  return {
    ...place,

    id,

    sourceId: id,

    explorePlaceId: id,

    tripItemType:
      "destination",

    image: rawImage,

    estimatedCost:
      Number(
        place?.estimatedCost ??
          place?.estimated_cost ??
          0
      ) || 0,

    lat:
      place?.lat === null ||
      place?.lat === undefined
        ? null
        : Number(
            place.lat
          ),

    lng:
      place?.lng === null ||
      place?.lng === undefined
        ? null
        : Number(
            place.lng
          ),
  };
};

export const sendItineraryToPlanner =
  (itinerary) => {
    const places =
      (
        Array.isArray(
          itinerary?.places
        )
          ? itinerary.places
          : []
      )
        .map(
          normalizeDestination
        )
        .filter(Boolean);

    if (!places.length) {
      return {
        ok: false,
        message:
          "This itinerary does not have any available destinations.",
      };
    }

    try {
      const existingDraft =
        readExistingPlannerDraft();

      const startDate =
        existingDraft?.startDate ||
        todayInputValue();

      /*
       * Keep the same behaviour as the current
       * Trip Planner starter itinerary logic:
       * one itinerary destination per trip day.
       */
      const days =
        places.map(
          (
            destination,
            index
          ) => ({
            dayNumber:
              index + 1,

            date:
              addDays(
                startDate,
                index
              ),

            destinations: [
              destination,
            ],

            hotels: [],

            events: [],

            guides: [],

            notes: "",

            isLocked: false,

            lockReason: "",
          })
        );

      const nextDraft = {
        ...(existingDraft ||
          {}),

        /*
         * Do not overwrite an already saved
         * server trip when using a new itinerary.
         */
        savedPlanId: null,

        tripName:
          itinerary?.title ||
          "Sri Lanka Trip",

        startDate,

        daysCount:
          String(
            days.length
          ),

        travellerCount:
          existingDraft
            ?.travellerCount ||
          "2",

        travelStyle:
          existingDraft
            ?.travelStyle ||
          "",

        budgetLevel:
          existingDraft
            ?.budgetLevel ||
          "",

        transportProfile:
          existingDraft
            ?.transportProfile ||
          "",

        optimizationMode:
          existingDraft
            ?.optimizationMode ||
          "",

        days,

        routeAnalysis: null,

        dirty: true,

        sourceItineraryId:
          Number(
            itinerary?.id
          ) || null,

        updatedAt:
          Date.now(),
      };

      localStorage.setItem(
        TRIP_PLANNER_DRAFT_KEY,
        JSON.stringify(
          nextDraft
        )
      );

      /*
       * Prevent an old Trip Planner
       * scroll-return snapshot from affecting
       * this new navigation.
       */
      sessionStorage.removeItem(
        TRIP_PLANNER_RETURN_KEY
      );

      return {
        ok: true,
        count:
          places.length,
      };
    } catch {
      return {
        ok: false,
        message:
          "Unable to prepare this itinerary for the Trip Planner.",
      };
    }
  };