const pool = require("../config/db");

const GUEST_COOKIE_NAME = "tourismhub_guest_id";


/* =========================================================
   BASIC HELPERS
========================================================= */

const parseJson = (value, fallback = null) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  if (
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
  const header =
    req.headers.cookie || "";

  return header
    .split(";")
    .reduce(
      (result, cookie) => {
        const [
          key,
          ...parts
        ] =
          cookie
            .trim()
            .split("=");

        if (key) {
          result[key] =
            decodeURIComponent(
              parts.join("=")
            );
        }

        return result;
      },
      {}
    );
};


const getOwner = (req) => {
  if (req.user) {
    if (
      req.user.role !==
      "tourist"
    ) {
      return {
        error:
          "Only tourists or guest users can apply trip routes.",
      };
    }

    return {
      userId:
        req.user.id,

      guestSessionId:
        null,
    };
  }

  const cookies =
    parseCookies(req);

  return {
    userId:
      null,

    guestSessionId:
      cookies[
        GUEST_COOKIE_NAME
      ] || null,
  };
};


const getOwnership = (
  owner
) => {
  if (owner.userId) {
    return {
      sql:
        "tp.user_id = ?",

      params: [
        owner.userId,
      ],
    };
  }

  if (
    owner.guestSessionId
  ) {
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


const normalizeIdArray = (
  value
) => {
  const parsed =
    parseJson(
      value,
      []
    );

  if (
    !Array.isArray(
      parsed
    )
  ) {
    return [];
  }

  return parsed
    .map(Number)
    .filter(
      Number.isInteger
    );
};


const arraysEqual = (
  left,
  right
) => {
  if (
    left.length !==
    right.length
  ) {
    return false;
  }

  return left.every(
    (value, index) =>
      value ===
      right[index]
  );
};


const sameUniqueMembers = (
  left,
  right
) => {
  if (
    left.length !==
    right.length
  ) {
    return false;
  }

  const leftSet =
    new Set(left);

  const rightSet =
    new Set(right);

  if (
    leftSet.size !==
      left.length ||
    rightSet.size !==
      right.length
  ) {
    return false;
  }

  if (
    leftSet.size !==
    rightSet.size
  ) {
    return false;
  }

  return [
    ...leftSet,
  ].every(
    (value) =>
      rightSet.has(
        value
      )
  );
};


const isAfter = (
  left,
  right
) => {
  if (!left || !right) {
    return false;
  }

  return (
    new Date(left).getTime() >
    new Date(right).getTime()
  );
};


/* =========================================================
   LOAD UPDATED TRIP SNAPSHOT

   Returns complete day blocks after apply.

   Items stay attached to their day row, so:
   - destinations
   - hotels
   - events
   - guides
   - notes

   all move together.
========================================================= */

const loadTripSnapshot =
  async (
    connection,
    tripPlanId
  ) => {
    const [dayRows] =
      await connection.query(
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

        WHERE
          trip_plan_id = ?

        ORDER BY
          day_number ASC,
          id ASC
        `,
        [
          tripPlanId,
        ]
      );


    const [itemRows] =
      await connection.query(
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
        [
          tripPlanId,
        ]
      );


    const itemsByDay =
      new Map();


    itemRows.forEach(
      (item) => {
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
      }
    );


    return dayRows.map(
      (day) => ({
        ...day,

        items:
          itemsByDay.get(
            day.id
          ) || [],
      })
    );
  };


/* =========================================================
   APPLY RECOMMENDED ROUTE
========================================================= */

const applyRecommendedRoute =
  async (req, res) => {
    const tripPlanId =
      Number(
        req.body.tripPlanId
      );

    const analysisId =
      Number(
        req.body.analysisId
      );


    /* =====================================================
       INPUT VALIDATION
    ===================================================== */

    if (
      !Number.isInteger(
        tripPlanId
      ) ||
      tripPlanId <= 0
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "A valid tripPlanId is required.",
        });
    }


    if (
      !Number.isInteger(
        analysisId
      ) ||
      analysisId <= 0
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "A valid analysisId is required.",
        });
    }


    /* =====================================================
       OWNER
    ===================================================== */

    const owner =
      getOwner(req);


    if (owner.error) {
      return res
        .status(403)
        .json({
          success: false,

          message:
            owner.error,
        });
    }


    const ownership =
      getOwnership(
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


    const connection =
      await pool.getConnection();


    try {
      /* ===================================================
         TRANSACTION START
      =================================================== */

      await connection
        .beginTransaction();


      /* ===================================================
         LOCK TRIP + VERIFY OWNERSHIP
      =================================================== */

      const [planRows] =
        await connection.query(
          `
          SELECT
            tp.id,
            tp.title,

            tp.transport_profile,
            tp.optimization_mode,

            tp.updated_at

          FROM trip_plans tp

          WHERE
            tp.id = ?

            AND
            ${ownership.sql}

          LIMIT 1

          FOR UPDATE
          `,
          [
            tripPlanId,
            ...ownership.params,
          ]
        );


      if (!planRows.length) {
        await connection
          .rollback();

        return res
          .status(404)
          .json({
            success: false,

            message:
              "Trip plan not found.",
          });
      }


      const plan =
        planRows[0];


      /* ===================================================
         LOCK EXACT ANALYSIS USER CHOSE
      =================================================== */

      const [analysisRows] =
        await connection.query(
          `
          SELECT
            id,

            trip_plan_id,

            provider_name,
            transport_profile,
            optimization_mode,

            current_order,
            optimized_order,

            created_at

          FROM trip_route_analyses

          WHERE
            id = ?

            AND trip_plan_id = ?

          LIMIT 1

          FOR UPDATE
          `,
          [
            analysisId,
            tripPlanId,
          ]
        );


      if (
        !analysisRows.length
      ) {
        await connection
          .rollback();

        return res
          .status(404)
          .json({
            success: false,

            message:
              "Route analysis not found for this trip.",
          });
      }


      const analysis =
        analysisRows[0];


      /* ===================================================
         ROUTING SETTINGS MUST STILL MATCH
      =================================================== */

      if (
        String(
          plan.transport_profile ||
            ""
        ) !==
          String(
            analysis.transport_profile ||
              ""
          ) ||

        String(
          plan.optimization_mode ||
            ""
        ) !==
          String(
            analysis.optimization_mode ||
              ""
          )
      ) {
        await connection
          .rollback();

        return res
          .status(409)
          .json({
            success: false,

            message:
              "This route analysis is stale because the trip routing settings changed. Analyze the trip again before applying.",
          });
      }


      /* ===================================================
         READ SAVED ORDERS
      =================================================== */

      const currentOrder =
        normalizeIdArray(
          analysis.current_order
        );


      const optimizedOrder =
        normalizeIdArray(
          analysis.optimized_order
        );


      if (
        !currentOrder.length ||
        !optimizedOrder.length ||
        !sameUniqueMembers(
          currentOrder,
          optimizedOrder
        )
      ) {
        await connection
          .rollback();

        return res
          .status(409)
          .json({
            success: false,

            message:
              "The saved route analysis contains an invalid day order. Analyze the trip again.",
          });
      }


      /* ===================================================
         LOCK ALL DAYS
      =================================================== */

      const [dayRows] =
        await connection.query(
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
            lock_reason,

            updated_at

          FROM trip_plan_days

          WHERE
            trip_plan_id = ?

          ORDER BY
            day_number ASC,
            id ASC

          FOR UPDATE
          `,
          [
            tripPlanId,
          ]
        );


      /* ===================================================
         LOCK ALL ITEMS

         Fixed / datetime-bound items make
         their whole day protected.
      =================================================== */

      const [itemRows] =
        await connection.query(
          `
          SELECT
            tpi.id,

            tpi.trip_day_id,

            tpi.item_type,

            tpi.is_fixed,

            tpi.fixed_start_at,
            tpi.fixed_end_at,

            tpi.updated_at

          FROM trip_plan_items tpi

          INNER JOIN
            trip_plan_days tpd
            ON tpd.id =
               tpi.trip_day_id

          WHERE
            tpd.trip_plan_id = ?

          FOR UPDATE
          `,
          [
            tripPlanId,
          ]
        );


      /* ===================================================
         STALE ANALYSIS PROTECTION
      =================================================== */

      const databaseOrder =
        dayRows.map(
          (day) =>
            Number(
              day.id
            )
        );


      /*
        Current DB order MUST exactly
        match what existed when analysis
        was created.
      */

      if (
        !arraysEqual(
          databaseOrder,
          currentOrder
        )
      ) {
        await connection
          .rollback();

        return res
          .status(409)
          .json({
            success: false,

            message:
              "The trip changed after this route analysis was created. Analyze the trip again before applying.",
          });
      }


      if (
        dayRows.length !==
        optimizedOrder.length
      ) {
        await connection
          .rollback();

        return res
          .status(409)
          .json({
            success: false,

            message:
              "The trip day count changed after this route analysis was created. Analyze the trip again.",
          });
      }


      /*
        Timestamp-based additional
        stale protection.
      */

      if (
        isAfter(
          plan.updated_at,
          analysis.created_at
        )
      ) {
        await connection
          .rollback();

        return res
          .status(409)
          .json({
            success: false,

            message:
              "The trip was updated after this route analysis was created. Analyze the trip again.",
          });
      }


      const dayChangedAfterAnalysis =
        dayRows.some(
          (day) =>
            isAfter(
              day.updated_at,
              analysis.created_at
            )
        );


      const itemChangedAfterAnalysis =
        itemRows.some(
          (item) =>
            isAfter(
              item.updated_at,
              analysis.created_at
            )
        );


      if (
        dayChangedAfterAnalysis ||
        itemChangedAfterAnalysis
      ) {
        await connection
          .rollback();

        return res
          .status(409)
          .json({
            success: false,

            message:
              "Trip days or activities changed after this route analysis was created. Analyze the trip again.",
          });
      }


      /* ===================================================
         LOCKED / FIXED DAY SAFETY
      =================================================== */

      const protectedDayIds =
        new Set();


      /*
        Day 1 is always kept as
        trip starting anchor.
      */

      if (
        dayRows.length
      ) {
        protectedDayIds.add(
          Number(
            dayRows[0].id
          )
        );
      }


      /*
        Explicitly locked days.
      */

      dayRows.forEach(
        (day) => {
          if (
            Boolean(
              day.is_locked
            )
          ) {
            protectedDayIds.add(
              Number(
                day.id
              )
            );
          }
        }
      );


      /*
        Fixed activity / booking / event.

        Even if is_fixed was accidentally
        not set, having a fixed datetime
        protects the whole day.
      */

      itemRows.forEach(
        (item) => {
          if (
            Boolean(
              item.is_fixed
            ) ||

            item.fixed_start_at !==
              null ||

            item.fixed_end_at !==
              null
          ) {
            protectedDayIds.add(
              Number(
                item.trip_day_id
              )
            );
          }
        }
      );


      /*
        Every protected day must remain
        in exactly its existing slot.
      */

      for (
        let index = 0;
        index <
        databaseOrder.length;
        index += 1
      ) {
        const dayId =
          databaseOrder[
            index
          ];


        if (
          protectedDayIds.has(
            dayId
          ) &&

          optimizedOrder[
            index
          ] !==
            dayId
        ) {
          await connection
            .rollback();

          return res
            .status(409)
            .json({
              success: false,

              message:
                "The recommended route would move a locked or fixed day. Analyze the trip again.",
            });
        }
      }


      /* ===================================================
         NOTHING TO APPLY
      =================================================== */

      if (
        arraysEqual(
          databaseOrder,
          optimizedOrder
        )
      ) {
        const days =
          await loadTripSnapshot(
            connection,
            tripPlanId
          );


        await connection
          .commit();


        return res.json({
          success: true,

          message:
            "The trip already uses the recommended route order.",

          data: {
            applied:
              false,

            reason:
              "no_changes",

            tripPlanId,

            sourceAnalysisId:
              analysisId,

            dayOrder:
              databaseOrder,

            days,
          },
        });
      }


      /* ===================================================
         SAVE ORIGINAL CALENDAR SLOTS
      =================================================== */

      /*
        Example:

        SLOT 1
        Day 1 / Oct 10

        SLOT 2
        Day 2 / Oct 11

        SLOT 3
        Day 3 / Oct 12

        We preserve those slots.

        Only day CONTENT moves between
        the slots.
      */

      const slots =
        dayRows.map(
          (day) => ({
            dayNumber:
              Number(
                day.day_number
              ),

            tripDate:
              day.trip_date,
          })
        );


      /* ===================================================
         TEMPORARY MOVE

         trip_plan_days has UNIQUE:

         trip_plan_id + day_number

         and

         trip_plan_id + trip_date

         Therefore direct swapping can
         cause duplicate-key errors.

         First move all rows to temporary
         unique values.
      =================================================== */

      await connection.query(
        `
        UPDATE
          trip_plan_days

        SET
          day_number =
            day_number + 1000000,

          trip_date =
            DATE_ADD(
              trip_date,
              INTERVAL 100 YEAR
            )

        WHERE
          trip_plan_id = ?
        `,
        [
          tripPlanId,
        ]
      );


      /* ===================================================
         APPLY RECOMMENDED ORDER

         IMPORTANT:

         We update the DAY row itself.

         Therefore everything attached to
         that day ID moves automatically:

         - destinations
         - property/hotel
         - event
         - guide
         - notes
         - costs
      =================================================== */

      for (
        let index = 0;
        index <
        optimizedOrder.length;
        index += 1
      ) {
        const contentDayId =
          optimizedOrder[
            index
          ];


        const slot =
          slots[
            index
          ];


        const [
          updateResult,
        ] =
          await connection.query(
            `
            UPDATE
              trip_plan_days

            SET
              day_number = ?,
              trip_date = ?

            WHERE
              id = ?

              AND trip_plan_id = ?
            `,
            [
              slot.dayNumber,

              slot.tripDate,

              contentDayId,

              tripPlanId,
            ]
          );


        if (
          updateResult
            .affectedRows !==
          1
        ) {
          throw new Error(
            "Failed to apply the complete recommended day order."
          );
        }
      }


      /* ===================================================
         UPDATE PARENT TRIP TIMESTAMP
      =================================================== */

      await connection.query(
        `
        UPDATE trip_plans

        SET
          updated_at =
            CURRENT_TIMESTAMP

        WHERE
          id = ?
        `,
        [
          tripPlanId,
        ]
      );


      /* ===================================================
         OLD ANALYSES ARE NOW STALE

         DO NOT DELETE trip_route_cache.

         Pair routing cache is still useful
         because it is based on coordinates
         and routing profile.
      =================================================== */

      const [
        deleteResult,
      ] =
        await connection.query(
          `
          DELETE FROM
            trip_route_analyses

          WHERE
            trip_plan_id = ?
          `,
          [
            tripPlanId,
          ]
        );


      /* ===================================================
         VERIFY FINAL DATABASE ORDER
      =================================================== */

      const days =
        await loadTripSnapshot(
          connection,
          tripPlanId
        );


      const appliedOrder =
        days.map(
          (day) =>
            Number(
              day.id
            )
        );


      if (
        !arraysEqual(
          appliedOrder,
          optimizedOrder
        )
      ) {
        throw new Error(
          "Applied day order verification failed."
        );
      }


      /* ===================================================
         COMMIT
      =================================================== */

      await connection
        .commit();


      return res.json({
        success: true,

        message:
          "Recommended route applied successfully.",

        data: {
          applied:
            true,

          tripPlanId,

          sourceAnalysisId:
            analysisId,

          previousOrder:
            databaseOrder,

          appliedOrder,

          invalidatedAnalysisCount:
            deleteResult
              .affectedRows,

          days,
        },
      });
    } catch (error) {
      await connection
        .rollback();


      console.error(
        "Apply recommended route error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,

          message:
            error.message ||
            "Failed to apply the recommended route.",
        });
    } finally {
      connection.release();
    }
  };


module.exports = {
  applyRecommendedRoute,
};