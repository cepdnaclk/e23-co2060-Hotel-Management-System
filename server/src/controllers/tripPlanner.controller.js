const crypto = require("crypto");
const pool = require("../config/db");
const {
  getDirections,
} = require(
  "../utils/routingClient"
);

const GUEST_COOKIE_NAME = "tourismhub_guest_id";

/* =========================================================
   BASIC HELPERS
========================================================= */

const parseJson = (value, fallback = null) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (
    Array.isArray(value) ||
    typeof value === "object"
  ) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseCookies = (req) => {
  const cookieHeader = req.headers.cookie || "";

  return cookieHeader
    .split(";")
    .reduce((cookies, cookie) => {
      const [key, ...valueParts] =
        cookie.trim().split("=");

      if (!key) return cookies;

      cookies[key] = decodeURIComponent(
        valueParts.join("=")
      );

      return cookies;
    }, {});
};

const createGuestSessionId = () =>
  crypto.randomBytes(32).toString("hex");

const getGuestSessionIdFromRequest = (
  req
) => {
  const cookies = parseCookies(req);

  return (
    cookies[GUEST_COOKIE_NAME] ||
    null
  );
};

const setGuestCookie = (
  res,
  guestSessionId
) => {
  const isProduction =
    process.env.NODE_ENV ===
    "production";

  res.setHeader(
    "Set-Cookie",
    `${GUEST_COOKIE_NAME}=${encodeURIComponent(
      guestSessionId
    )}; Max-Age=${
      60 * 60 * 24 * 30
    }; Path=/; HttpOnly; SameSite=Lax${
      isProduction
        ? "; Secure"
        : ""
    }`
  );
};

const isValidDate = (value) => {
  if (!value) return false;

  const date = new Date(
    `${value}T00:00:00`
  );

  return !Number.isNaN(
    date.getTime()
  );
};

const getDateDifference = (
  startDate,
  endDate
) => {
  const start = new Date(
    `${startDate}T00:00:00`
  );

  const end = new Date(
    `${endDate}T00:00:00`
  );

  return Math.floor(
    (end.getTime() -
      start.getTime()) /
      (1000 * 60 * 60 * 24)
  );
};


/* =========================================================
   SETTINGS
========================================================= */

const getPlannerSettings = async (
  connection = pool
) => {
  const [rows] =
    await connection.query(
      `
      SELECT
        setting_key,
        setting_value
      FROM explore_settings
      WHERE setting_key IN (
        'sri_lanka_regions',
        'travel_styles',
        'budget_daily_targets',
        'trip_planner_config',
        'trip_planner_transport_profiles',
        'trip_planner_optimization_modes',
        'trip_planner_map',
        'trip_planner_routing_provider'
    )
      `
    );

  const settings = {};

  rows.forEach((row) => {
    settings[row.setting_key] =
      parseJson(
        row.setting_value,
        null
      );
  });

  return settings;
};


/* =========================================================
   OWNER HELPERS
========================================================= */

const getRequestOwner = async (
  req,
  res,
  createGuest = false
) => {
  if (req.user) {
    if (
      req.user.role !== "tourist"
    ) {
      return {
        error: {
          status: 403,
          message:
            "Only tourists or guest users can manage trip plans.",
        },
      };
    }

    return {
      userId: req.user.id,
      guestSessionId: null,
    };
  }

  let guestSessionId =
    getGuestSessionIdFromRequest(
      req
    );

  if (
    !guestSessionId &&
    createGuest
  ) {
    guestSessionId =
      createGuestSessionId();

    setGuestCookie(
      res,
      guestSessionId
    );
  }

  return {
    userId: null,
    guestSessionId,
  };
};

const getTripOwnershipWhere = (
  owner
) => {
  if (owner.userId) {
    return {
      sql: "tp.user_id = ?",
      params: [owner.userId],
    };
  }

  if (owner.guestSessionId) {
    return {
      sql:
        "tp.guest_session_id = ?",
      params: [
        owner.guestSessionId,
      ],
    };
  }

  return null;
};


/* =========================================================
   DESTINATION / ITEM SOURCE VALIDATION
========================================================= */

const loadItemSource = async (
  connection,
  item
) => {
  const itemType =
    item.itemType;

  if (
    itemType === "destination"
  ) {
    if (!item.explorePlaceId) {
      throw new Error(
        "Destination item requires explorePlaceId."
      );
    }

    const [rows] =
      await connection.query(
        `
        SELECT
          id,
          name,
          city,
          district,
          estimated_cost,
          lat,
          lng
        FROM explore_places
        WHERE id = ?
          AND status = 'published'
        LIMIT 1
        `,
        [item.explorePlaceId]
      );

    if (!rows.length) {
      throw new Error(
        "Selected destination is not available."
      );
    }

    const place = rows[0];

    return {
      explorePlaceId: place.id,
      propertyId: null,
      touristEventId: null,
      partnerGuideId: null,

      name: place.name,
      city: place.city,
      district: place.district,

      estimatedCost:
        place.estimated_cost,

      lat:
        place.lat === null
          ? null
          : Number(place.lat),

      lng:
        place.lng === null
          ? null
          : Number(place.lng),
    };
  }

  if (itemType === "hotel") {
    if (!item.propertyId) {
      throw new Error(
        "Hotel item requires propertyId."
      );
    }

    const [rows] =
      await connection.query(
        `
        SELECT
          p.id,
          p.name,
          p.city,
          p.district,
          MIN(r.price_per_night)
            AS estimated_cost
        FROM properties p
        LEFT JOIN rooms r
          ON r.property_id = p.id
        WHERE p.id = ?
          AND p.status = 'approved'
        GROUP BY
          p.id,
          p.name,
          p.city,
          p.district
        LIMIT 1
        `,
        [item.propertyId]
      );

    if (!rows.length) {
      throw new Error(
        "Selected hotel is not available."
      );
    }

    const property = rows[0];

    return {
      explorePlaceId: null,
      propertyId: property.id,
      touristEventId: null,
      partnerGuideId: null,

      name: property.name,
      city: property.city,
      district:
        property.district,

      estimatedCost:
        property.estimated_cost,
    };
  }

  if (itemType === "event") {
    if (!item.touristEventId) {
      throw new Error(
        "Event item requires touristEventId."
      );
    }

    const [rows] =
      await connection.query(
        `
        SELECT
          id,
          title,
          city,
          district,
          price
        FROM tourist_events
        WHERE id = ?
          AND status = 'approved'
        LIMIT 1
        `,
        [item.touristEventId]
      );

    if (!rows.length) {
      throw new Error(
        "Selected event is not available."
      );
    }

    const event = rows[0];

    return {
      explorePlaceId: null,
      propertyId: null,
      touristEventId:
        event.id,
      partnerGuideId: null,

      name: event.title,
      city: event.city,
      district: event.district,

      estimatedCost:
        event.price,
    };
  }

  if (itemType === "guide") {
    if (!item.partnerGuideId) {
      throw new Error(
        "Guide item requires partnerGuideId."
      );
    }

    const [rows] =
      await connection.query(
        `
        SELECT
          id,
          display_name,
          full_name,
          city,
          district,
          price_per_day
        FROM partner_guides
        WHERE id = ?
          AND status = 'approved'
        LIMIT 1
        `,
        [item.partnerGuideId]
      );

    if (!rows.length) {
      throw new Error(
        "Selected guide is not available."
      );
    }

    const guide = rows[0];

    return {
      explorePlaceId: null,
      propertyId: null,
      touristEventId: null,
      partnerGuideId:
        guide.id,

      name:
        guide.display_name ||
        guide.full_name,

      city: guide.city,
      district: guide.district,

      estimatedCost:
        guide.price_per_day,
    };
  }

  throw new Error(
    "Invalid trip item type."
  );
};


/* =========================================================
   PAYLOAD VALIDATION
========================================================= */

const validateTripPayload = async (
  connection,
  body
) => {
  const settings =
    await getPlannerSettings(
      connection
    );

  const plannerConfig =
    settings.trip_planner_config ||
    {};

  const travelStyles =
    Array.isArray(
      settings.travel_styles
    )
      ? settings.travel_styles
      : [];

  const budgetTargets =
    settings.budget_daily_targets ||
    {};

  const transportProfiles =
    Array.isArray(
      settings.trip_planner_transport_profiles
    )
      ? settings.trip_planner_transport_profiles
      : [];

  const optimizationModes =
    Array.isArray(
      settings.trip_planner_optimization_modes
    )
      ? settings.trip_planner_optimization_modes
      : [];

  const {
    title,
    startDate,
    endDate,
    travelStyle,
    budgetLevel,
    travellerCount,
    optimizationMode,
    transportProfile,
    days,
  } = body;

  if (
    !title ||
    !String(title).trim()
  ) {
    throw new Error(
      "Trip title is required."
    );
  }

  if (
    !isValidDate(startDate) ||
    !isValidDate(endDate)
  ) {
    throw new Error(
      "Valid start and end dates are required."
    );
  }

  if (
    getDateDifference(
      startDate,
      endDate
    ) < 0
  ) {
    throw new Error(
      "End date cannot be before start date."
    );
  }

  const totalCalendarDays =
    getDateDifference(
      startDate,
      endDate
    ) + 1;

  if (
    plannerConfig.maxDays &&
    totalCalendarDays >
      Number(
        plannerConfig.maxDays
      )
  ) {
    throw new Error(
      `Trip exceeds the configured maximum of ${plannerConfig.maxDays} days.`
    );
  }

  if (
    travelStyle &&
    travelStyles.length &&
    !travelStyles.includes(
      travelStyle
    )
  ) {
    throw new Error(
      "Selected travel style is not available."
    );
  }

  if (
    budgetLevel &&
    Object.keys(
      budgetTargets
    ).length &&
    !Object.prototype.hasOwnProperty.call(
      budgetTargets,
      budgetLevel
    )
  ) {
    throw new Error(
      "Selected budget level is not available."
    );
  }

  if (transportProfile) {
    const valid =
      transportProfiles.some(
        (profile) =>
          profile.key ===
          transportProfile
      );

    if (!valid) {
      throw new Error(
        "Selected transport profile is not available."
      );
    }
  }

  if (optimizationMode) {
    const valid =
      optimizationModes.some(
        (mode) =>
          mode.key ===
          optimizationMode
      );

    if (!valid) {
      throw new Error(
        "Selected optimization mode is not available."
      );
    }
  }

  const numericTravellerCount =
    Number(travellerCount);

  if (
    !Number.isInteger(
      numericTravellerCount
    ) ||
    numericTravellerCount < 1
  ) {
    throw new Error(
      "Traveller count must be at least 1."
    );
  }

  if (!Array.isArray(days)) {
    throw new Error(
      "Trip days must be provided."
    );
  }

  if (
    plannerConfig.maxDays &&
    days.length >
      Number(
        plannerConfig.maxDays
      )
  ) {
    throw new Error(
      `Trip contains more than the configured maximum of ${plannerConfig.maxDays} days.`
    );
  }

  const usedDates =
    new Set();

  for (
    let index = 0;
    index < days.length;
    index += 1
  ) {
    const day = days[index];

    if (
      !isValidDate(day.date)
    ) {
      throw new Error(
        `Day ${
          index + 1
        } has an invalid date.`
      );
    }

    if (
      day.date < startDate ||
      day.date > endDate
    ) {
      throw new Error(
        `Day ${
          index + 1
        } is outside the trip date range.`
      );
    }

    if (
      usedDates.has(day.date)
    ) {
      throw new Error(
        "A trip cannot contain the same date twice."
      );
    }

    usedDates.add(day.date);

    const items =
      Array.isArray(day.items)
        ? day.items
        : [];

    const destinationCount =
      items.filter(
        (item) =>
          item.itemType ===
          "destination"
      ).length;

    if (
      plannerConfig.maxDestinationsPerDay &&
      destinationCount >
        Number(
          plannerConfig.maxDestinationsPerDay
        )
    ) {
      throw new Error(
        `Day ${
          index + 1
        } exceeds the configured destination limit.`
      );
    }
  }

  const dailyBudgetTarget =
    budgetLevel &&
    Object.prototype.hasOwnProperty.call(
      budgetTargets,
      budgetLevel
    )
      ? Number(
          budgetTargets[
            budgetLevel
          ]
        )
      : null;

  return {
    settings,

    normalized: {
      title:
        String(title).trim(),

      startDate,
      endDate,

      travelStyle:
        travelStyle || null,

      budgetLevel:
        budgetLevel || null,

      dailyBudgetTarget,

      travellerCount:
        numericTravellerCount,

      optimizationMode:
        optimizationMode || null,

      transportProfile:
        transportProfile || null,

      status:
        body.status === "saved"
          ? "saved"
          : "draft",

      days,
    },
  };
};


/* =========================================================
   INSERT DAYS AND ITEMS
========================================================= */

const insertTripDaysAndItems =
  async (
    connection,
    tripPlanId,
    days
  ) => {
    for (
      let dayIndex = 0;
      dayIndex <
      days.length;
      dayIndex += 1
    ) {
      const day =
        days[dayIndex];

      const [dayResult] =
        await connection.query(
          `
          INSERT INTO trip_plan_days
          (
            trip_plan_id,
            day_number,
            trip_date,
            notes,
            is_locked,
            lock_reason
          )
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            tripPlanId,

            dayIndex + 1,

            day.date,

            day.notes || null,

            Boolean(
              day.isLocked
            ),

            day.lockReason ||
              null,
          ]
        );

      const tripDayId =
        dayResult.insertId;

      const items =
        Array.isArray(
          day.items
        )
          ? day.items
          : [];

      for (
        let itemIndex = 0;
        itemIndex <
        items.length;
        itemIndex += 1
      ) {
        const item =
          items[itemIndex];

        const source =
          await loadItemSource(
            connection,
            item
          );

        await connection.query(
          `
          INSERT INTO trip_plan_items
          (
            trip_day_id,

            item_type,

            explore_place_id,
            property_id,
            tourist_event_id,
            partner_guide_id,

            sort_order,

            is_fixed,

            fixed_start_at,
            fixed_end_at,

            notes,

            source_name_snapshot,
            source_city_snapshot,
            source_district_snapshot,
            estimated_cost_snapshot
          )
          VALUES
          (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?
          )
          `,
          [
            tripDayId,

            item.itemType,

            source.explorePlaceId,

            source.propertyId,

            source.touristEventId,

            source.partnerGuideId,

            itemIndex + 1,

            Boolean(
              item.isFixed
            ),

            item.fixedStartAt ||
              null,

            item.fixedEndAt ||
              null,

            item.notes || null,

            source.name,

            source.city || null,

            source.district ||
              null,

            source.estimatedCost ??
              null,
          ]
        );
      }
    }
  };


/* =========================================================
   BOOTSTRAP
========================================================= */

const mapDestination = (row) => {
  const lat =
    row.lat === null ||
    row.lat === undefined
      ? null
      : Number(row.lat);

  const lng =
    row.lng === null ||
    row.lng === undefined
      ? null
      : Number(row.lng);

  return {
    id: row.id,

    slug: row.slug,

    name: row.name,
    city: row.city,
    district: row.district,
    region: row.region,

    categoryId:
      row.category_id,

    categorySlug:
      row.category_slug,

    categoryLabel:
      row.category_label,

    categoryIcon:
      row.category_icon,

    imageUrl:
      row.image_url || "",

    shortDescription:
      row.short_description || "",

    duration:
      row.duration || "",

    bestTime:
      row.best_time || "",

    bestMonths:
      parseJson(
        row.best_months,
        []
      ),

    budget:
      row.budget,

    budgetScore:
      Number(
        row.budget_score || 0
      ),

    estimatedCost:
      Number(
        row.estimated_cost || 0
      ),

    lat,
    lng,

    hasCoordinates:
      Number.isFinite(lat) &&
      Number.isFinite(lng),

    featured:
      Boolean(row.featured),

    vibe:
      row.vibe || "",

    tags:
      parseJson(
        row.tags,
        []
      ),

    sortOrder:
      Number(
        row.sort_order || 0
      ),
  };
};

const getTripPlannerBootstrap =
  async (req, res) => {
    try {
      const settings =
        await getPlannerSettings();

      const [placeRows] =
        await pool.query(
          `
          SELECT
            p.id,
            p.slug,
            p.name,
            p.city,
            p.district,
            p.region,

            p.category_id,

            c.slug AS category_slug,
            c.label AS category_label,
            c.icon AS category_icon,

            p.image_url,
            p.short_description,

            p.duration,
            p.best_time,
            p.best_months,

            p.budget,
            p.budget_score,
            p.estimated_cost,

            p.lat,
            p.lng,

            p.featured,
            p.vibe,
            p.tags,

            p.sort_order

          FROM explore_places p

          LEFT JOIN explore_categories c
            ON c.id =
               p.category_id

          WHERE
            p.status =
            'published'

          ORDER BY
            p.sort_order ASC,
            p.name ASC
          `
        );

      const destinations =
        placeRows.map(
          mapDestination
        );

      const [itineraryRows] =
        await pool.query(
          `
          SELECT
            i.id AS itinerary_id,
            i.title,
            i.days,
            i.tone,
            i.link_city,

            i.sort_order
              AS itinerary_sort_order,

            ip.sort_order
              AS place_sort_order,

            p.id,
            p.slug,
            p.name,
            p.city,
            p.district,
            p.region,

            p.category_id,

            c.slug
              AS category_slug,

            c.label
              AS category_label,

            c.icon
              AS category_icon,

            p.image_url,
            p.short_description,

            p.duration,
            p.best_time,
            p.best_months,

            p.budget,
            p.budget_score,
            p.estimated_cost,

            p.lat,
            p.lng,

            p.featured,
            p.vibe,
            p.tags,

            p.sort_order

          FROM
            explore_itineraries i

          LEFT JOIN
            explore_itinerary_places ip
            ON ip.itinerary_id =
               i.id

          LEFT JOIN
            explore_places p
            ON p.id =
               ip.place_id
            AND p.status =
               'published'

          LEFT JOIN
            explore_categories c
            ON c.id =
               p.category_id

          WHERE
            i.status =
            'published'

          ORDER BY
            i.sort_order ASC,
            i.id ASC,
            ip.sort_order ASC
          `
        );

      const itineraryMap =
        new Map();

      itineraryRows.forEach(
        (row) => {
          if (
            !itineraryMap.has(
              row.itinerary_id
            )
          ) {
            itineraryMap.set(
              row.itinerary_id,
              {
                id:
                  row.itinerary_id,

                title:
                  row.title,

                days:
                  row.days,

                tone:
                  row.tone,

                linkCity:
                  row.link_city,

                sortOrder:
                  Number(
                    row.itinerary_sort_order ||
                      0
                  ),

                places: [],
              }
            );
          }

          if (row.id) {
            itineraryMap
              .get(
                row.itinerary_id
              )
              .places.push({
                ...mapDestination(
                  row
                ),

                itineraryPlaceOrder:
                  Number(
                    row.place_sort_order ||
                      0
                  ),
              });
          }
        }
      );

      const starterItineraries =
        Array.from(
          itineraryMap.values()
        );

      const destinationsWithoutCoordinates =
        destinations
          .filter(
            (place) =>
              !place.hasCoordinates
          )
          .map((place) => ({
            id: place.id,
            name: place.name,
            city: place.city,
          }));

      return res.json({
        success: true,

        data: {
          settings,

          destinations,

          starterItineraries,

          meta: {
            destinationCount:
              destinations.length,

            itineraryCount:
              starterItineraries.length,

            destinationsWithoutCoordinates,
          },
        },
      });
    } catch (error) {
      console.error(
        "Trip planner bootstrap error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to load trip planner data",
        });
    }
  };


/* =========================================================
   CREATE PLAN
========================================================= */

const createTripPlan =
  async (req, res) => {
    const connection =
      await pool.getConnection();

    try {
      const owner =
        await getRequestOwner(
          req,
          res,
          true
        );

      if (owner.error) {
        return res
          .status(
            owner.error.status
          )
          .json({
            success: false,
            message:
              owner.error.message,
          });
      }

      await connection.beginTransaction();

      const {
        normalized,
      } =
        await validateTripPayload(
          connection,
          req.body
        );

      const [result] =
        await connection.query(
          `
          INSERT INTO trip_plans
          (
            user_id,
            guest_session_id,

            title,

            start_date,
            end_date,

            travel_style,
            budget_level,
            daily_budget_target,

            traveller_count,

            optimization_mode,
            transport_profile,

            status
          )
          VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            owner.userId,

            owner.guestSessionId,

            normalized.title,

            normalized.startDate,

            normalized.endDate,

            normalized.travelStyle,

            normalized.budgetLevel,

            normalized.dailyBudgetTarget,

            normalized.travellerCount,

            normalized.optimizationMode,

            normalized.transportProfile,

            normalized.status,
          ]
        );

      const tripPlanId =
        result.insertId;

      await insertTripDaysAndItems(
        connection,
        tripPlanId,
        normalized.days
      );

      await connection.commit();

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Trip plan saved successfully.",

          data: {
            id: tripPlanId,
          },
        });
    } catch (error) {
      await connection.rollback();

      console.error(
        "Create trip plan error:",
        error
      );

      return res
        .status(400)
        .json({
          success: false,

          message:
            error.message ||
            "Failed to save trip plan.",
        });
    } finally {
      connection.release();
    }
  };


/* =========================================================
   LIST MY PLANS
========================================================= */

const getMyTripPlans =
  async (req, res) => {
    try {
      const owner =
        await getRequestOwner(
          req,
          res,
          false
        );

      if (owner.error) {
        return res
          .status(
            owner.error.status
          )
          .json({
            success: false,
            message:
              owner.error.message,
          });
      }

      const ownership =
        getTripOwnershipWhere(
          owner
        );

      if (!ownership) {
        return res.json({
          success: true,
          count: 0,
          data: [],
        });
      }

      const [rows] =
        await pool.query(
          `
          SELECT
            tp.id,
            tp.title,

            DATE_FORMAT(
              tp.start_date,
              '%Y-%m-%d'
            ) AS start_date,

            DATE_FORMAT(
              tp.end_date,
              '%Y-%m-%d'
            ) AS end_date,

            tp.travel_style,
            tp.budget_level,
            tp.daily_budget_target,

            tp.traveller_count,

            tp.optimization_mode,
            tp.transport_profile,

            tp.status,

            tp.created_at,
            tp.updated_at,

            COUNT(
              DISTINCT tpd.id
            ) AS day_count,

            COUNT(
              DISTINCT tpi.id
            ) AS item_count

          FROM trip_plans tp

          LEFT JOIN
            trip_plan_days tpd
            ON tpd.trip_plan_id =
               tp.id

          LEFT JOIN
            trip_plan_items tpi
            ON tpi.trip_day_id =
               tpd.id

          WHERE
            ${ownership.sql}

          GROUP BY
            tp.id

          ORDER BY
            tp.updated_at DESC,
            tp.id DESC
          `,
          ownership.params
        );

      return res.json({
        success: true,

        count: rows.length,

        data: rows,
      });
    } catch (error) {
      console.error(
        "Get trip plans error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to load trip plans.",
        });
    }
  };


/* =========================================================
   GET ONE PLAN
========================================================= */

const getTripPlanById =
  async (req, res) => {
    try {
      const owner =
        await getRequestOwner(
          req,
          res,
          false
        );

      if (owner.error) {
        return res
          .status(
            owner.error.status
          )
          .json({
            success: false,
            message:
              owner.error.message,
          });
      }

      const ownership =
        getTripOwnershipWhere(
          owner
        );

      if (!ownership) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Trip plan not found.",
          });
      }

      const tripPlanId =
        Number(req.params.id);

      const [plans] =
        await pool.query(
          `
          SELECT
            tp.id,
            tp.user_id,
            tp.guest_session_id,

            tp.title,

            DATE_FORMAT(
              tp.start_date,
              '%Y-%m-%d'
            ) AS start_date,

            DATE_FORMAT(
              tp.end_date,
              '%Y-%m-%d'
            ) AS end_date,

            tp.travel_style,
            tp.budget_level,
            tp.daily_budget_target,

            tp.traveller_count,

            tp.optimization_mode,
            tp.transport_profile,

            tp.status,
            tp.created_at,
            tp.updated_at

          FROM trip_plans tp
          WHERE
            tp.id = ?
            AND ${ownership.sql}
          LIMIT 1
          `,
          [
            tripPlanId,
            ...ownership.params,
          ]
        );

      if (!plans.length) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Trip plan not found.",
          });
      }

      const [days] =
        await pool.query(
          `
          SELECT
            id,
            day_number,

            DATE_FORMAT(
              trip_date,
              '%Y-%m-%d'
            ) AS trip_date,

            notes,
            is_locked,
            lock_reason
          FROM trip_plan_days
          WHERE trip_plan_id = ?
          ORDER BY
            day_number ASC,
            id ASC
          `,
          [tripPlanId]
        );

      const [items] =
        await pool.query(
          `
          SELECT
            tpi.id,
            tpi.trip_day_id,

            tpi.item_type,

            tpi.explore_place_id,
            tpi.property_id,
            tpi.tourist_event_id,
            tpi.partner_guide_id,

            tpi.sort_order,

            tpi.is_fixed,

            tpi.fixed_start_at,
            tpi.fixed_end_at,

            tpi.notes,

            tpi.source_name_snapshot,
            tpi.source_city_snapshot,
            tpi.source_district_snapshot,
            tpi.estimated_cost_snapshot

          FROM trip_plan_items tpi

          INNER JOIN
            trip_plan_days tpd
            ON tpd.id =
               tpi.trip_day_id

          WHERE
            tpd.trip_plan_id = ?

          ORDER BY
            tpd.day_number ASC,
            tpi.sort_order ASC,
            tpi.id ASC
          `,
          [tripPlanId]
        );

      const itemsByDay =
        new Map();

      items.forEach((item) => {
        if (
          !itemsByDay.has(
            item.trip_day_id
          )
        ) {
          itemsByDay.set(
            item.trip_day_id,
            []
          );
        }

        itemsByDay
          .get(
            item.trip_day_id
          )
          .push(item);
      });

      const nestedDays =
        days.map((day) => ({
          ...day,

          items:
            itemsByDay.get(
              day.id
            ) || [],
        }));

      return res.json({
        success: true,

        data: {
          ...plans[0],
          days: nestedDays,
        },
      });
    } catch (error) {
      console.error(
        "Get trip plan error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to load trip plan.",
        });
    }
  };


/* =========================================================
   UPDATE PLAN
========================================================= */

const updateTripPlan =
  async (req, res) => {
    const connection =
      await pool.getConnection();

    try {
      const owner =
        await getRequestOwner(
          req,
          res,
          false
        );

      if (owner.error) {
        return res
          .status(
            owner.error.status
          )
          .json({
            success: false,
            message:
              owner.error.message,
          });
      }

      const ownership =
        getTripOwnershipWhere(
          owner
        );

      if (!ownership) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Trip plan not found.",
          });
      }

      const tripPlanId =
        Number(req.params.id);

      await connection.beginTransaction();

      const [existing] =
        await connection.query(
          `
          SELECT
            tp.id
          FROM trip_plans tp
          WHERE
            tp.id = ?
            AND ${ownership.sql}
          FOR UPDATE
          `,
          [
            tripPlanId,
            ...ownership.params,
          ]
        );

      if (!existing.length) {
        await connection.rollback();

        return res
          .status(404)
          .json({
            success: false,
            message:
              "Trip plan not found.",
          });
      }

      const {
        normalized,
      } =
        await validateTripPayload(
          connection,
          req.body
        );

      await connection.query(
        `
        UPDATE trip_plans
        SET
          title = ?,
          start_date = ?,
          end_date = ?,

          travel_style = ?,
          budget_level = ?,
          daily_budget_target = ?,

          traveller_count = ?,

          optimization_mode = ?,
          transport_profile = ?,

          status = ?
        WHERE id = ?
        `,
        [
          normalized.title,

          normalized.startDate,

          normalized.endDate,

          normalized.travelStyle,

          normalized.budgetLevel,

          normalized.dailyBudgetTarget,

          normalized.travellerCount,

          normalized.optimizationMode,

          normalized.transportProfile,

          normalized.status,

          tripPlanId,
        ]
      );

      /*
        trip_plan_items are deleted
        automatically because
        trip_plan_days uses ON DELETE CASCADE.
      */
      await connection.query(
        `
        DELETE FROM trip_plan_days
        WHERE trip_plan_id = ?
        `,
        [tripPlanId]
      );

      await insertTripDaysAndItems(
        connection,
        tripPlanId,
        normalized.days
      );

      /*
        Old optimization analysis is now stale.
      */
      await connection.query(
        `
        DELETE FROM
          trip_route_analyses
        WHERE trip_plan_id = ?
        `,
        [tripPlanId]
      );

      await connection.commit();

      return res.json({
        success: true,

        message:
          "Trip plan updated successfully.",

        data: {
          id: tripPlanId,
        },
      });
    } catch (error) {
      await connection.rollback();

      console.error(
        "Update trip plan error:",
        error
      );

      return res
        .status(400)
        .json({
          success: false,

          message:
            error.message ||
            "Failed to update trip plan.",
        });
    } finally {
      connection.release();
    }
  };


/* =========================================================
   DELETE PLAN
========================================================= */

const deleteTripPlan =
  async (req, res) => {
    try {
      const owner =
        await getRequestOwner(
          req,
          res,
          false
        );

      if (owner.error) {
        return res
          .status(
            owner.error.status
          )
          .json({
            success: false,
            message:
              owner.error.message,
          });
      }

      const ownership =
        getTripOwnershipWhere(
          owner
        );

      if (!ownership) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Trip plan not found.",
          });
      }

      const tripPlanId =
        Number(req.params.id);

      const [result] =
        await pool.query(
          `
          DELETE tp
          FROM trip_plans tp
          WHERE
            tp.id = ?
            AND ${ownership.sql}
          `,
          [
            tripPlanId,
            ...ownership.params,
          ]
        );

      if (
        result.affectedRows === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Trip plan not found.",
          });
      }

      return res.json({
        success: true,

        message:
          "Trip plan deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete trip plan error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to delete trip plan.",
        });
    }
  };

/* =========================================================
   DEVELOPMENT ROAD ROUTING TEST

   This endpoint verifies:

   Database place
        ↓
   Database coordinates
        ↓
   Database transport profile
        ↓
   Database routing configuration
        ↓
   OpenRouteService
========================================================= */

const testTripPlannerRouting =
  async (req, res) => {
    try {
      const originPlaceId =
        Number(
          req.body.originPlaceId
        );

      const destinationPlaceId =
        Number(
          req.body.destinationPlaceId
        );

      const transportProfileKey =
        String(
          req.body
            .transportProfile ||
            ""
        ).trim();

      const optimizationModeKey =
        String(
          req.body
            .optimizationMode ||
            ""
        ).trim();


      /* =====================================================
         BASIC INPUT VALIDATION
      ===================================================== */

      if (
        !Number.isInteger(
          originPlaceId
        ) ||
        originPlaceId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "A valid originPlaceId is required.",
          });
      }


      if (
        !Number.isInteger(
          destinationPlaceId
        ) ||
        destinationPlaceId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "A valid destinationPlaceId is required.",
          });
      }


      if (
        originPlaceId ===
        destinationPlaceId
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Origin and destination must be different places.",
          });
      }


      /* =====================================================
         LOAD CONFIGURATION FROM DATABASE
      ===================================================== */

      const settings =
        await getPlannerSettings();


      const routingProvider =
        settings
          .trip_planner_routing_provider;


      const transportProfiles =
        Array.isArray(
          settings
            .trip_planner_transport_profiles
        )
          ? settings
              .trip_planner_transport_profiles
          : [];


      const optimizationModes =
        Array.isArray(
          settings
            .trip_planner_optimization_modes
        )
          ? settings
              .trip_planner_optimization_modes
          : [];


      if (
        !routingProvider ||
        routingProvider.enabled !==
          true
      ) {
        return res
          .status(503)
          .json({
            success: false,

            message:
              "Trip routing is currently disabled.",
          });
      }


      if (
        !routingProvider.baseUrl
      ) {
        return res
          .status(500)
          .json({
            success: false,

            message:
              "Routing provider base URL is missing from database configuration.",
          });
      }


      /* =====================================================
         TRANSPORT PROFILE FROM DATABASE
      ===================================================== */

      const transportProfile =
        transportProfiles.find(
          (profile) =>
            profile.key ===
            transportProfileKey
        );


      if (!transportProfile) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Selected transport profile is not available.",
          });
      }


      if (
        !transportProfile
          .providerProfile
      ) {
        return res
          .status(500)
          .json({
            success: false,

            message:
              "The selected transport profile has no routing-provider profile.",
          });
      }


      /* =====================================================
         OPTIMIZATION MODE FROM DATABASE
      ===================================================== */

      const optimizationMode =
        optimizationModes.find(
          (mode) =>
            mode.key ===
            optimizationModeKey
        );


      if (!optimizationMode) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Selected optimization mode is not available.",
          });
      }


      /* =====================================================
         LOAD DESTINATIONS FROM DATABASE
      ===================================================== */

      const [placeRows] =
        await pool.query(
          `
          SELECT
            id,
            name,
            city,
            district,
            lat,
            lng

          FROM explore_places

          WHERE
            id IN (?, ?)

            AND status =
              'published'
          `,
          [
            originPlaceId,
            destinationPlaceId,
          ]
        );


      const origin =
        placeRows.find(
          (place) =>
            Number(place.id) ===
            originPlaceId
        );


      const destination =
        placeRows.find(
          (place) =>
            Number(place.id) ===
            destinationPlaceId
        );


      if (!origin) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Origin destination is not available.",
          });
      }


      if (!destination) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Destination is not available.",
          });
      }


      /* =====================================================
         COORDINATES FROM DATABASE
      ===================================================== */

      const originLat =
        Number(origin.lat);

      const originLng =
        Number(origin.lng);

      const destinationLat =
        Number(
          destination.lat
        );

      const destinationLng =
        Number(
          destination.lng
        );


      if (
        !Number.isFinite(
          originLat
        ) ||
        !Number.isFinite(
          originLng
        )
      ) {
        return res
          .status(422)
          .json({
            success: false,

            message:
              "Origin destination has invalid coordinates.",
          });
      }


      if (
        !Number.isFinite(
          destinationLat
        ) ||
        !Number.isFinite(
          destinationLng
        )
      ) {
        return res
          .status(422)
          .json({
            success: false,

            message:
              "Destination has invalid coordinates.",
          });
      }


      /*
        OpenRouteService coordinate format:

        [longitude, latitude]

        Important:
        NOT [latitude, longitude]
      */

      const coordinates = [
        [
          originLng,
          originLat,
        ],

        [
          destinationLng,
          destinationLat,
        ],
      ];


      /* =====================================================
         REAL ROAD ROUTING REQUEST
      ===================================================== */

      const route =
        await getDirections({
          baseUrl:
            routingProvider
              .baseUrl,

          profile:
            transportProfile
              .providerProfile,

          coordinates,

          preference:
            optimizationMode
              .providerPreference ||
            undefined,

          timeoutMs:
            routingProvider
              .requestTimeoutMs,
        });


      const feature =
        route?.features?.[0];


      const summary =
        feature?.properties
          ?.summary;


      if (
        !feature ||
        !feature.geometry ||
        !summary
      ) {
        throw new Error(
          "Routing provider returned incomplete route data."
        );
      }


      /* =====================================================
         RESPONSE
      ===================================================== */

      return res.json({
        success: true,

        data: {
          provider:
            routingProvider.key,

          transportProfile:
            transportProfile.key,

          optimizationMode:
            optimizationMode.key,


          origin: {
            id:
              origin.id,

            name:
              origin.name,

            city:
              origin.city,

            district:
              origin.district,

            lat:
              originLat,

            lng:
              originLng,
          },


          destination: {
            id:
              destination.id,

            name:
              destination.name,

            city:
              destination.city,

            district:
              destination.district,

            lat:
              destinationLat,

            lng:
              destinationLng,
          },


          route: {
            distanceMeters:
              Number(
                summary.distance
              ),

            durationSeconds:
              Number(
                summary.duration
              ),

            geometry:
              feature.geometry,
          },
        },
      });
    } catch (error) {
      console.error(
        "Trip routing test error:",
        error
      );


      return res
        .status(502)
        .json({
          success: false,

          message:
            error.message ||
            "Road routing request failed.",
        });
    }
  };


module.exports = {
  getTripPlannerBootstrap,

  createTripPlan,

  getMyTripPlans,

  getTripPlanById,

  updateTripPlan,

  deleteTripPlan,

  testTripPlannerRouting,
};