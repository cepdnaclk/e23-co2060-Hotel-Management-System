/* =========================================================
   TOURISMHUB LK
   ROUTE ORDER OPTIMIZER

   IMPORTANT
   ---------
   This module knows nothing about:

   - Colombo
   - Kandy
   - Jaffna
   - Sri Lankan coordinates
   - travel times
   - distances

   It only receives:

   - day objects
   - a cost function

   All real travel costs come from the routing provider.
========================================================= */


const normalizeCost = (value) => {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return Infinity;
  }

  return number;
};


/* =========================================================
   CALCULATE TOTAL COST OF A SEQUENCE
========================================================= */

const calculateSequenceCost = (
  sequence,
  costBetween,
  leftBoundary = null,
  rightBoundary = null
) => {
  if (
    !Array.isArray(sequence) ||
    sequence.length === 0
  ) {
    if (
      leftBoundary &&
      rightBoundary
    ) {
      return normalizeCost(
        costBetween(
          leftBoundary,
          rightBoundary
        )
      );
    }

    return 0;
  }

  let total = 0;


  if (leftBoundary) {
    const cost =
      normalizeCost(
        costBetween(
          leftBoundary,
          sequence[0]
        )
      );

    if (!Number.isFinite(cost)) {
      return Infinity;
    }

    total += cost;
  }


  for (
    let index = 1;
    index < sequence.length;
    index += 1
  ) {
    const cost =
      normalizeCost(
        costBetween(
          sequence[index - 1],
          sequence[index]
        )
      );

    if (!Number.isFinite(cost)) {
      return Infinity;
    }

    total += cost;
  }


  if (rightBoundary) {
    const cost =
      normalizeCost(
        costBetween(
          sequence[
            sequence.length - 1
          ],
          rightBoundary
        )
      );

    if (!Number.isFinite(cost)) {
      return Infinity;
    }

    total += cost;
  }


  return total;
};


/* =========================================================
   NEAREST-NEIGHBOUR STARTING SOLUTION

   Used to obtain a sensible initial order quickly.
========================================================= */

const buildNearestNeighbourOrder = (
  segment,
  costBetween,
  leftBoundary = null
) => {
  if (segment.length <= 1) {
    return [...segment];
  }


  const remaining =
    [...segment];

  const ordered = [];

  let current =
    leftBoundary;


  /*
    If there is no known previous
    destination, preserve the first
    existing day as the local starting
    point.

    This avoids arbitrary itinerary
    rotation.
  */
  if (!current) {
    const first =
      remaining.shift();

    ordered.push(first);

    current = first;
  }


  while (remaining.length) {
    let bestIndex = -1;
    let bestCost = Infinity;


    for (
      let index = 0;
      index < remaining.length;
      index += 1
    ) {
      const candidate =
        remaining[index];

      const candidateCost =
        normalizeCost(
          costBetween(
            current,
            candidate
          )
        );


      if (
        candidateCost <
        bestCost
      ) {
        bestCost =
          candidateCost;

        bestIndex = index;
      }
    }


    /*
      If the provider could not create
      any route to remaining places,
      preserve the original next day.

      Do not invent a distance.
    */
    if (bestIndex === -1) {
      bestIndex = 0;
    }


    const selected =
      remaining.splice(
        bestIndex,
        1
      )[0];


    ordered.push(
      selected
    );

    current =
      selected;
  }


  return ordered;
};


/* =========================================================
   2-OPT IMPROVEMENT

   Example:

   A -> C -> B -> D

   may become:

   A -> B -> C -> D

   when that has a lower routing cost.
========================================================= */

const improveWithTwoOpt = (
  route,
  costBetween,
  leftBoundary = null,
  rightBoundary = null
) => {
  if (route.length < 2) {
    return [...route];
  }


  let bestRoute =
    [...route];

  let bestCost =
    calculateSequenceCost(
      bestRoute,
      costBetween,
      leftBoundary,
      rightBoundary
    );


  let improved = true;

  let safetyCounter = 0;


  while (
    improved &&
    safetyCounter < 100
  ) {
    improved = false;

    safetyCounter += 1;


    for (
      let start = 0;
      start < bestRoute.length - 1;
      start += 1
    ) {
      for (
        let end = start + 1;
        end < bestRoute.length;
        end += 1
      ) {
        const candidate = [
          ...bestRoute.slice(
            0,
            start
          ),

          ...bestRoute
            .slice(
              start,
              end + 1
            )
            .reverse(),

          ...bestRoute.slice(
            end + 1
          ),
        ];


        const candidateCost =
          calculateSequenceCost(
            candidate,
            costBetween,
            leftBoundary,
            rightBoundary
          );


        if (
          candidateCost <
          bestCost
        ) {
          bestRoute =
            candidate;

          bestCost =
            candidateCost;

          improved = true;
        }
      }
    }
  }


  return bestRoute;
};


/* =========================================================
   OPTIMIZE ONE MOVABLE SEGMENT
========================================================= */

const optimizeSegment = (
  segment,
  costBetween,
  leftBoundary,
  rightBoundary
) => {
  if (segment.length <= 1) {
    return [...segment];
  }


  const initial =
    buildNearestNeighbourOrder(
      segment,
      costBetween,
      leftBoundary
    );


  return improveWithTwoOpt(
    initial,
    costBetween,
    leftBoundary,
    rightBoundary
  );
};


/* =========================================================
   OPTIMIZE WHOLE TRIP

   Locked days remain exactly in their
   original date/day positions.

   Non-routable days also act as barriers.

   Example:

   Day 1 LOCKED
   Day 2 movable
   Day 3 movable
   Day 4 LOCKED
   Day 5 movable

   We optimize:

   [2,3]

   and

   [5]

   separately.
========================================================= */

const optimizeDayOrder = (
  dayNodes,
  costBetween
) => {
  if (
    !Array.isArray(
      dayNodes
    ) ||
    dayNodes.length < 2
  ) {
    return Array.isArray(
      dayNodes
    )
      ? [...dayNodes]
      : [];
  }


  const result =
    [...dayNodes];


  let index = 0;


  while (
    index < result.length
  ) {
    const current =
      result[index];


    /*
      Locked or non-routable days
      cannot move.
    */
    if (
      current.locked ||
      !current.routable
    ) {
      index += 1;
      continue;
    }


    const segmentStart =
      index;


    while (
      index < result.length &&
      !result[index].locked &&
      result[index].routable
    ) {
      index += 1;
    }


    const segmentEnd =
      index;


    const segment =
      result.slice(
        segmentStart,
        segmentEnd
      );


    const previous =
      segmentStart > 0
        ? result[
            segmentStart - 1
          ]
        : null;


    const next =
      segmentEnd <
      result.length
        ? result[
            segmentEnd
          ]
        : null;


    const leftBoundary =
      previous?.routable
        ? previous
        : null;


    const rightBoundary =
      next?.routable
        ? next
        : null;


    const optimized =
      optimizeSegment(
        segment,
        costBetween,
        leftBoundary,
        rightBoundary
      );


    for (
      let offset = 0;
      offset <
      optimized.length;
      offset += 1
    ) {
      result[
        segmentStart +
          offset
      ] =
        optimized[offset];
    }
  }


  return result;
};


/* =========================================================
   SIMPLE ORDER COMPARISON
========================================================= */

const orderChanged = (
  current,
  optimized
) => {
  if (
    current.length !==
    optimized.length
  ) {
    return true;
  }


  return current.some(
    (item, index) =>
      item.dayId !==
      optimized[index]?.dayId
  );
};


module.exports = {
  calculateSequenceCost,
  optimizeDayOrder,
  orderChanged,
};