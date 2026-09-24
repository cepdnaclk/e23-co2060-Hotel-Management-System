import ContentImage from "../components/ContentImage";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Lock,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Save,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";

import {
  jsPDF,
} from "jspdf";

import {
  SAVED_TRIP_EVENT,
  getTripItemCategoryKey,
  getTripItemImage,
  getTripItemKey,
  getTripItemLink,
  getTripItemTypeLabel,
  readTripItems,
  writeTripItems,
} from "../utils/tripBasket";

import {
  analyzeTripRoute,
  applyTripRoute,
  createTripPlan,
  deleteTripPlan,
  getMyTripPlans,
  getTripPlanById,
  getTripPlannerBootstrap,
  updateTripPlan,
} from "../api/tripPlanner.api";

import TripPlannerMap from "../components/tripPlanner/TripPlannerMap";
import TripBasketWidget from "../components/TripBasketWidget";
import {
  assetUrl,
  getTouristEvents,
} from "../services/exploreService";

import "../styles/tripPlanner.css";




const TRIP_PLANNER_DRAFT_KEY =
  "tourismhub_trip_planner_draft_v2";

const TRIP_PLANNER_RETURN_KEY =
  "tourismhub_trip_planner_return_v1";


const readPlannerDraft =
  () => {
    try {
      const parsed =
        JSON.parse(
          localStorage.getItem(
            TRIP_PLANNER_DRAFT_KEY
          ) ||
            "null"
        );

      if (
        !parsed ||
        typeof parsed !==
          "object"
      ) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  };


const writePlannerDraft =
  (
    draft
  ) => {
    try {
      localStorage.setItem(
        TRIP_PLANNER_DRAFT_KEY,
        JSON.stringify(
          draft
        )
      );
    } catch {
      // Keep planning usable even if browser storage is unavailable.
    }
  };


const rememberPlannerReturn =
  () => {
    try {
      sessionStorage.setItem(
        TRIP_PLANNER_RETURN_KEY,
        JSON.stringify({
          restore: true,
          scrollY:
            window.scrollY ||
            0,
        })
      );
    } catch {
      // Navigation still works without scroll restoration.
    }
  };


const getDatabaseEventId =
  (
    event
  ) => {
    const candidates = [
      event?.touristEventId,
      event?.tourist_event_id,
      event?.databaseId,
      event?.event_id,
      event?.eventId,
      event?.sourceId,
      event?.source_id,
      event?.id,
    ];

    for (
      const value of
      candidates
    ) {
      const numeric =
        Number(
          value
        );

      if (
        Number.isInteger(
          numeric
        ) &&
        numeric > 0
      ) {
        return numeric;
      }
    }

    return null;
  };


const cleanEventMatchText =
  (
    value
  ) =>
    String(
      value || ""
    )
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        " "
      );


const reconcileSavedEventsWithDatabase =
  (
    savedItems,
    databaseEvents
  ) => {
    const rows =
      Array.isArray(
        databaseEvents
      )
        ? databaseEvents
        : [];

    const validEvents =
      rows
        .map(
          (
            event
          ) => ({
            raw:
              event,
            id:
              getDatabaseEventId(
                event
              ),
            name:
              cleanEventMatchText(
                event?.title ||
                  event?.name
              ),
            city:
              cleanEventMatchText(
                event?.city
              ),
            district:
              cleanEventMatchText(
                event?.district
              ),
            slug:
              cleanEventMatchText(
                event?.slug
              ),
          })
        )
        .filter(
          (
            event
          ) =>
            Boolean(
              event.id
            )
        );

    const validIds =
      new Set(
        validEvents.map(
          (
            event
          ) =>
            event.id
        )
      );

    let changed =
      false;

    const nextItems =
      (
        Array.isArray(
          savedItems
        )
          ? savedItems
          : []
      ).flatMap(
        (
          item
        ) => {
          if (
            getTripItemCategoryKey(
              item
            ) !==
            "events"
          ) {
            return [item];
          }

          const existingId =
            getDatabaseEventId(
              item
            );

          if (
            existingId &&
            validIds.has(
              existingId
            )
          ) {
            if (
              item.touristEventId ===
                existingId &&
              item.sourceId ===
                existingId
            ) {
              return [item];
            }

            changed =
              true;

            return [{
              ...item,
              sourceId:
                existingId,
              touristEventId:
                existingId,
            }];
          }

          const itemName =
            cleanEventMatchText(
              item?.name
            );

          const itemCity =
            cleanEventMatchText(
              item?.city
            );

          const itemDistrict =
            cleanEventMatchText(
              item?.district
            );

          const itemLink =
            cleanEventMatchText(
              item?.link
            );

          const match =
            validEvents.find(
              (
                event
              ) => {
                const linkMatches =
                  event.slug &&
                  itemLink.includes(
                    event.slug
                  );

                const nameMatches =
                  itemName &&
                  event.name &&
                  itemName ===
                    event.name;

                const cityMatches =
                  !itemCity ||
                  !event.city ||
                  itemCity ===
                    event.city;

                const districtMatches =
                  !itemDistrict ||
                  !event.district ||
                  itemDistrict ===
                    event.district;

                return (
                  linkMatches ||
                  (
                    nameMatches &&
                    cityMatches &&
                    districtMatches
                  )
                );
              }
            );

          if (
            match
          ) {
            changed =
              true;

            return [{
              ...item,
              sourceId:
                match.id,
              touristEventId:
                match.id,
            }];
          }

          // Remove old/demo basket events that no longer exist
          // in the approved database event list.
          changed =
            true;

          return [];
        }
      );

    return {
      items:
        nextItems,
      changed,
    };
  };


const CATEGORY_CONFIG = [
  {
    key: "hotels",
    label: "Hotels",
  },
  {
    key: "events",
    label: "Events",
  },
  {
    key: "guides",
    label: "Guides",
  },
];


const normalizeLocationValue =
  (value) =>
    String(
      value || ""
    )
      .trim()
      .toLowerCase();


const getDayLocationContext =
  (day) => {
    const destinations =
      Array.isArray(
        day?.destinations
      )
        ? day.destinations
        : [];

    const cities =
      destinations
        .map(
          (
            destination
          ) =>
            normalizeLocationValue(
              destination.city
            )
        )
        .filter(Boolean);

    const districts =
      destinations
        .map(
          (
            destination
          ) =>
            normalizeLocationValue(
              destination.district
            )
        )
        .filter(Boolean);

    const labels =
      destinations
        .map(
          (
            destination
          ) =>
            destination.city ||
            destination.district ||
            destination.name
        )
        .filter(Boolean);

    return {
      cities:
        new Set(cities),

      districts:
        new Set(
          districts
        ),

      labels: [
        ...new Set(
          labels
        ),
      ],

      primaryLocation:
        destinations.find(
          (
            destination
          ) =>
            destination.city ||
            destination.district
        ) ||
        destinations[0] ||
        null,
    };
  };


const getLocationMatchRank =
  (
    item,
    day
  ) => {
    const context =
      getDayLocationContext(
        day
      );

    const city =
      normalizeLocationValue(
        item?.city
      );

    const district =
      normalizeLocationValue(
        item?.district
      );

    if (
      city &&
      context.cities.has(
        city
      )
    ) {
      return 0;
    }

    if (
      district &&
      context.districts.has(
        district
      )
    ) {
      return 1;
    }

    return 2;
  };


const itemMatchesDayLocation =
  (
    item,
    day
  ) =>
    getLocationMatchRank(
      item,
      day
    ) < 2;


const getBrowseLinkForCategory =
  (
    categoryKey,
    day
  ) => {
    const context =
      getDayLocationContext(
        day
      );

    const location =
      context.primaryLocation;

    const city =
      String(
        location?.city ||
        ""
      ).trim();

    const district =
      String(
        location?.district ||
        ""
      ).trim();

    if (
      categoryKey ===
      "hotels"
    ) {
      if (city) {
        return `/hotels?city=${encodeURIComponent(
          city
        )}`;
      }

      if (district) {
        return `/hotels?search=${encodeURIComponent(
          district
        )}`;
      }

      return "/hotels";
    }

    if (
      categoryKey ===
      "events"
    ) {
      if (city) {
        return `/events?city=${encodeURIComponent(
          city
        )}`;
      }

      if (district) {
        return `/events?search=${encodeURIComponent(
          district
        )}`;
      }

      return "/events";
    }

    return "/tourist-guides";
  };


const getBrowseLabelForCategory =
  (
    categoryKey,
    day
  ) => {
    const context =
      getDayLocationContext(
        day
      );

    const locationLabel =
      context.primaryLocation
        ?.city ||
      context.primaryLocation
        ?.district ||
      "";

    if (
      categoryKey ===
      "hotels"
    ) {
      return locationLabel
        ? `More hotels near ${locationLabel}`
        : "Explore hotels";
    }

    if (
      categoryKey ===
      "events"
    ) {
      return locationLabel
        ? `More events near ${locationLabel}`
        : "Explore events";
    }

    return "Explore all guides";
  };


const getItemLocationLabel =
  (item) =>
    [
      item?.city,
      item?.district,
    ]
      .filter(Boolean)
      .filter(
        (
          value,
          index,
          array
        ) =>
          array.indexOf(
            value
          ) === index
      )
      .join(" • ") ||
    item?.region ||
    "Sri Lanka";


const todayInputValue =
  () => {
    const now =
      new Date();

    const local =
      new Date(
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

  const date =
    new Date(
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


const formatDate = (
  value
) => {
  if (!value) {
    return "Date not set";
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};


const formatMoney = (
  value
) =>
  new Intl.NumberFormat(
    "en-LK",
    {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(value || 0)
  );


const formatDistance = (
  meters
) => {
  const value =
    Number(meters || 0);

  if (value < 1000) {
    return `${Math.round(
      value
    )} m`;
  }

  return `${(
    value / 1000
  ).toFixed(1)} km`;
};


const formatDurationSeconds =
  (seconds) => {
    const value =
      Math.max(
        0,
        Number(seconds || 0)
      );

    const totalMinutes =
      Math.round(
        value / 60
      );

    const hours =
      Math.floor(
        totalMinutes / 60
      );

    const minutes =
      totalMinutes % 60;

    if (
      hours &&
      minutes
    ) {
      return `${hours}h ${minutes}m`;
    }

    if (hours) {
      return `${hours}h`;
    }

    return `${minutes}m`;
  };


const createDays = (
  startDate,
  count
) =>
  Array.from(
    {
      length:
        Math.max(
          1,
          Number(count) || 1
        ),
    },
    (_, index) => ({
      dayNumber:
        index + 1,

      date:
        addDays(
          startDate,
          index
        ),

      destinations: [],
      hotels: [],
      events: [],
      guides: [],

      notes: "",

      isLocked: false,
      lockReason: "",
    })
  );



const numericId = (
  value
) => {
    if (
      Number.isInteger(
        Number(value)
      )
    ) {
      return Number(value);
    }

    const match =
      String(value || "")
        .match(
          /(\d+)$/
        );

    if (!match) {
      return null;
    }

    return Number(
      match[1]
    );
  };


const getCanonicalType = (
  item
) => {
    const explicit =
      String(
        item?.item_type ||
        item?.itemType ||
        item?.tripItemType ||
        ""
      )
        .trim()
        .toLowerCase();

    if (
      explicit ===
        "destination" ||
      explicit === "place"
    ) {
      return "destination";
    }

    if (
      explicit ===
        "hotel" ||
      explicit === "property"
    ) {
      return "hotel";
    }

    if (
      explicit === "event"
    ) {
      return "event";
    }

    if (
      explicit === "guide"
    ) {
      return "guide";
    }

    const category =
      getTripItemCategoryKey(
        item
      );

    if (
      category ===
      "destinations"
    ) {
      return "destination";
    }

    if (
      category ===
      "hotels"
    ) {
      return "hotel";
    }

    if (
      category ===
      "events"
    ) {
      return "event";
    }

    if (
      category ===
      "guides"
    ) {
      return "guide";
    }

    return null;
  };


const getSourceId = (
  item,
  type
) => {
    if (!item) {
      return null;
    }

    if (
      type ===
      "destination"
    ) {
      return numericId(
        item.explorePlaceId ??
        item.explore_place_id ??
        item.sourceId ??
        item.id
      );
    }

    if (type === "hotel") {
      return numericId(
        item.propertyId ??
        item.property_id ??
        item.sourceId ??
        item.id
      );
    }

    if (type === "event") {
      return numericId(
        item.touristEventId ??
        item.tourist_event_id ??
        item.sourceId ??
        item.id
      );
    }

    if (type === "guide") {
      return numericId(
        item.partnerGuideId ??
        item.partner_guide_id ??
        item.sourceId ??
        item.id
      );
    }

    return null;
  };


const destinationFromBootstrap =
  (place) => ({
    ...place,

    id:
      Number(place.id),

    sourceId:
      Number(place.id),

    tripItemType:
      "destination",

    image:
      place.imageUrl ||
      place.image_url ||
      "",

    estimatedCost:
      Number(
        place.estimatedCost ||
        place.estimated_cost ||
        0
      ),

    lat:
      place.lat === null
        ? null
        : Number(
            place.lat
          ),

    lng:
      place.lng === null
        ? null
        : Number(
            place.lng
          ),
  });


const toApiItem = (
  item
) => {
    const type =
      getCanonicalType(
        item
      );

    const sourceId =
      getSourceId(
        item,
        type
      );


    if (
      !type ||
      !sourceId
    ) {
      throw new Error(
        `Cannot save ${
          item?.name ||
          "trip item"
        } because its database ID is missing.`
      );
    }


    const common = {
      itemType:
        type,

      isFixed:
        Boolean(
          item.isFixed ??
          item.is_fixed
        ),

      fixedStartAt:
        item.fixedStartAt ??
        item.fixed_start_at ??
        null,

      fixedEndAt:
        item.fixedEndAt ??
        item.fixed_end_at ??
        null,

      notes:
        item.notes ||
        null,
    };


    if (
      type ===
      "destination"
    ) {
      return {
        ...common,

        explorePlaceId:
          sourceId,
      };
    }


    if (
      type ===
      "hotel"
    ) {
      return {
        ...common,

        propertyId:
          sourceId,
      };
    }


    if (
      type ===
      "event"
    ) {
      return {
        ...common,

        touristEventId:
          sourceId,
      };
    }


    return {
      ...common,

      partnerGuideId:
        sourceId,
    };
  };


const serverItemToLocal = (
  item,
  destinationMap,
  savedItems
) => {
    const type =
      getCanonicalType(
        item
      );

    const sourceId =
      getSourceId(
        item,
        type
      );


    if (
      type ===
        "destination" &&
      destinationMap.has(
        sourceId
      )
    ) {
      return {
        ...destinationMap.get(
          sourceId
        ),

        serverItemId:
          item.id,
      };
    }


    const existing =
      savedItems.find(
        (savedItem) =>
          getCanonicalType(
            savedItem
          ) === type &&
          getSourceId(
            savedItem,
            type
          ) === sourceId
      );


    if (existing) {
      return {
        ...existing,

        serverItemId:
          item.id,
      };
    }


    return {
      id:
        `${type}-${sourceId}`,

      sourceId,

      tripItemType:
        type,

      name:
        item.source_name_snapshot ||
        `${type} ${sourceId}`,

      city:
        item.source_city_snapshot ||
        "",

      district:
        item.source_district_snapshot ||
        "",

      estimatedCost:
        Number(
          item.estimated_cost_snapshot ||
          0
        ),

      isFixed:
        Boolean(
          item.is_fixed
        ),

      fixedStartAt:
        item.fixed_start_at,

      fixedEndAt:
        item.fixed_end_at,

      notes:
        item.notes ||
        "",
    };
  };


const routeText = (
  route
) => {
    if (
      !Array.isArray(route)
    ) {
      return "";
    }

    return route
      .flatMap(
        (day) =>
          (
            day.destinations ||
            []
          ).map(
            (destination) =>
              destination.city ||
              destination.name
          )
      )
      .filter(Boolean)
      .join(" → ");
  };


const PDF_THEME = {
  ink: [24, 38, 35],
  muted: [101, 116, 111],
  teal: [15, 118, 110],
  tealDark: [15, 78, 70],
  tealSoft: [237, 248, 245],
  amber: [245, 181, 49],
  line: [220, 230, 226],
  soft: [248, 251, 250],
  white: [255, 255, 255],
  danger: [158, 69, 59],
};


const PDF_IMAGE_CACHE =
  new Map();


const cleanPdfText =
  (value) =>
    String(
      value ?? ""
    )
      .replace(
        /[•·]/g,
        "-"
      )
      .replace(
        /[→➜]/g,
        "->"
      )
      .replace(
        /[–—]/g,
        "-"
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();


const getPdfAbsoluteLink =
  (item) => {
    const link =
      getTripItemLink(
        item
      );

    if (!link) {
      return "";
    }

    if (
      /^https?:\/\//i.test(
        link
      )
    ) {
      return link;
    }

    if (
      typeof window ===
      "undefined"
    ) {
      return link;
    }

    try {
      return new URL(
        link,
        window.location.origin
      ).toString();
    } catch {
      return "";
    }
  };


const getPdfItemLocation =
  (item) =>
    [
      item?.city,
      item?.district,
      item?.region,
    ]
      .map(
        cleanPdfText
      )
      .filter(Boolean)
      .filter(
        (
          value,
          index,
          array
        ) =>
          array.indexOf(
            value
          ) === index
      )
      .join(" - ");


const getPdfItemCost =
  (item) =>
    Number(
      item?.estimatedCost ??
        item?.estimated_cost ??
        0
    ) || 0;


const getPdfItemDescription =
  (item) =>
    cleanPdfText(
      item?.description ||
        item?.shortDescription ||
        item?.short_description ||
        item?.summary ||
        item?.bio ||
        item?.specialty ||
        item?.speciality ||
        ""
    );


const getPdfItemExtraLines =
  (item) => {
    const lines = [];

    const rating =
      Number(
        item?.rating
      );

    if (
      Number.isFinite(
        rating
      ) &&
      rating > 0
    ) {
      lines.push(
        `Rating: ${rating.toFixed(
          1
        )}`
      );
    }

    const languages =
      Array.isArray(
        item?.languages
      )
        ? item.languages
        : [];

    if (
      languages.length
    ) {
      lines.push(
        `Languages: ${languages
          .map(
            cleanPdfText
          )
          .filter(Boolean)
          .slice(0, 4)
          .join(", ")}`
      );
    }

    const dateText =
      cleanPdfText(
        item?.eventDate ||
          item?.event_date ||
          item?.startDate ||
          item?.start_date ||
          ""
      );

    if (dateText) {
      lines.push(
        `Date: ${dateText}`
      );
    }

    const timeText =
      cleanPdfText(
        item?.startTime ||
          item?.start_time ||
          item?.fixedStartAt ||
          item?.fixed_start_at ||
          ""
      );

    if (timeText) {
      lines.push(
        `Time: ${timeText}`
      );
    }

    return lines.slice(
      0,
      2
    );
  };


const loadPdfImage =
  async (
    item
  ) => {
    const rawValue =
      getTripItemImage(
        item
      );

    const raw =
      String(
        rawValue || ""
      ).trim();

    if (!raw) {
      return null;
    }

    let sourceUrl = "";

    try {
      sourceUrl =
        raw.startsWith(
          "data:"
        ) ||
        raw.startsWith(
          "blob:"
        )
          ? raw
          : assetUrl(
              raw
            );
    } catch {
      return null;
    }

    if (!sourceUrl) {
      return null;
    }

    if (
      PDF_IMAGE_CACHE.has(
        sourceUrl
      )
    ) {
      return PDF_IMAGE_CACHE.get(
        sourceUrl
      );
    }

    const imagePromise =
      (async () => {
        let objectUrl = "";

        const loadImage =
          (
            imageSource,
            useCors = false
          ) =>
            new Promise(
              (
                resolve,
                reject
              ) => {
                const img =
                  new Image();

                if (useCors) {
                  img.crossOrigin =
                    "anonymous";
                }

                const timeout =
                  window.setTimeout(
                    () =>
                      reject(
                        new Error(
                          "Image timeout"
                        )
                      ),
                    8000
                  );

                img.onload =
                  () => {
                    window.clearTimeout(
                      timeout
                    );

                    resolve(
                      img
                    );
                  };

                img.onerror =
                  () => {
                    window.clearTimeout(
                      timeout
                    );

                    reject(
                      new Error(
                        "Image failed"
                      )
                    );
                  };

                img.src =
                  imageSource;
              }
            );

        try {
          let image = null;

          if (
            sourceUrl.startsWith(
              "data:"
            ) ||
            sourceUrl.startsWith(
              "blob:"
            )
          ) {
            image =
              await loadImage(
                sourceUrl
              );
          } else {
            try {
              const controller =
                new AbortController();

              const timer =
                window.setTimeout(
                  () =>
                    controller.abort(),
                  8000
                );

              const response =
                await fetch(
                  sourceUrl,
                  {
                    mode:
                      "cors",
                    credentials:
                      "omit",
                    cache:
                      "force-cache",
                    signal:
                      controller.signal,
                  }
                );

              window.clearTimeout(
                timer
              );

              if (
                !response.ok
              ) {
                throw new Error(
                  `Image request failed: ${response.status}`
                );
              }

              const blob =
                await response.blob();

              objectUrl =
                URL.createObjectURL(
                  blob
                );

              image =
                await loadImage(
                  objectUrl
                );
            } catch {
              image =
                await loadImage(
                  sourceUrl,
                  true
                );
            }
          }

          if (
            !image ||
            !image.width ||
            !image.height
          ) {
            return null;
          }

          const canvas =
            document.createElement(
              "canvas"
            );

          const targetWidth =
            900;

          const targetHeight =
            600;

          canvas.width =
            targetWidth;

          canvas.height =
            targetHeight;

          const context =
            canvas.getContext(
              "2d"
            );

          if (!context) {
            return null;
          }

          const sourceRatio =
            image.width /
            image.height;

          const targetRatio =
            targetWidth /
            targetHeight;

          let sx = 0;
          let sy = 0;
          let sw =
            image.width;
          let sh =
            image.height;

          if (
            sourceRatio >
            targetRatio
          ) {
            sw =
              image.height *
              targetRatio;

            sx =
              (
                image.width -
                sw
              ) /
              2;
          } else {
            sh =
              image.width /
              targetRatio;

            sy =
              (
                image.height -
                sh
              ) /
              2;
          }

          context.drawImage(
            image,
            sx,
            sy,
            sw,
            sh,
            0,
            0,
            targetWidth,
            targetHeight
          );

          return canvas.toDataURL(
            "image/jpeg",
            0.82
          );
        } catch {
          return null;
        } finally {
          if (objectUrl) {
            URL.revokeObjectURL(
              objectUrl
            );
          }
        }
      })();

    PDF_IMAGE_CACHE.set(
      sourceUrl,
      imagePromise
    );

    return imagePromise;
  };


const drawPdfSectionTitle =
  (
    doc,
    title,
    subtitle,
    x,
    y
  ) => {
    doc.setTextColor(
      ...PDF_THEME.teal
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(9);

    doc.text(
      cleanPdfText(
        subtitle
      ).toUpperCase(),
      x,
      y
    );

    doc.setTextColor(
      ...PDF_THEME.ink
    );

    doc.setFontSize(17);

    doc.text(
      cleanPdfText(
        title
      ),
      x,
      y + 7
    );

    return y + 13;
  };


const drawPdfFooter =
  (
    doc,
    pageNumber,
    pageCount
  ) => {
    const width =
      doc.internal.pageSize.getWidth();

    const height =
      doc.internal.pageSize.getHeight();

    doc.setDrawColor(
      ...PDF_THEME.line
    );

    doc.line(
      15,
      height - 13,
      width - 15,
      height - 13
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);

    doc.setTextColor(
      ...PDF_THEME.muted
    );

    doc.text(
      "TripLanka",
      15,
      height - 8
    );

    doc.text(
      `${pageNumber} / ${pageCount}`,
      width - 15,
      height - 8,
      {
        align:
          "right",
      }
    );
  };


function TripPlannerPage() {
  const today =
    useMemo(
      () =>
        todayInputValue(),
      []
    );


  const initialDraft =
    useMemo(
      () =>
        readPlannerDraft(),
      []
    );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);


  const [
    pdfLoading,
    setPdfLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    notice,
    setNotice,
  ] = useState("");


  const [
    settings,
    setSettings,
  ] = useState({});


  const [
    destinations,
    setDestinations,
  ] = useState([]);


  const [
    starterItineraries,
    setStarterItineraries,
  ] = useState([]);


  const [
    savedTrips,
    setSavedTrips,
  ] = useState([]);


  const [
    savedPlansOpen,
    setSavedPlansOpen,
  ] = useState(false);


  const [
    savedItems,
    setSavedItems,
  ] = useState(
    readTripItems
  );


  const [
    savedPlanId,
    setSavedPlanId,
  ] = useState(
    initialDraft
      ?.savedPlanId ??
      null
  );


  const [
    tripName,
    setTripName,
  ] = useState(
    initialDraft
      ?.tripName ||
      "Sri Lanka Trip"
  );


  const [
    startDate,
    setStartDate,
  ] = useState(
    initialDraft
      ?.startDate ||
      today
  );


  const [
    daysCount,
    setDaysCount,
  ] = useState(
    initialDraft
      ?.daysCount ||
      String(
        initialDraft
          ?.days
          ?.length ||
          3
      )
  );


  const [
    travellerCount,
    setTravellerCount,
  ] = useState(
    initialDraft
      ?.travellerCount ||
      "2"
  );


  const [
    travelStyle,
    setTravelStyle,
  ] = useState(
    initialDraft
      ?.travelStyle ||
      ""
  );


  const [
    budgetLevel,
    setBudgetLevel,
  ] = useState(
    initialDraft
      ?.budgetLevel ||
      ""
  );


  const [
    transportProfile,
    setTransportProfile,
  ] = useState(
    initialDraft
      ?.transportProfile ||
      ""
  );


  const [
    optimizationMode,
    setOptimizationMode,
  ] = useState(
    initialDraft
      ?.optimizationMode ||
      ""
  );


  const [
    days,
    setDays,
  ] = useState(
    () =>
      Array.isArray(
        initialDraft
          ?.days
      ) &&
      initialDraft.days.length >
        0
        ? initialDraft.days
        : createDays(
            initialDraft
              ?.startDate ||
              today,
            Number(
              initialDraft
                ?.daysCount ||
                3
            )
          )
  );


  const [
    routeAnalysis,
    setRouteAnalysis,
  ] = useState(
    () =>
      initialDraft
        ?.routeAnalysis ||
      null
  );


  const [
    routeError,
    setRouteError,
  ] = useState("");


  const [
    dirty,
    setDirty,
  ] = useState(
    Boolean(
      initialDraft
        ?.dirty
    )
  );


  const destinationMap =
    useMemo(
      () =>
        new Map(
          destinations.map(
            (destination) => [
              Number(
                destination.id
              ),
              destination,
            ]
          )
        ),
      [destinations]
    );


  const travelStyles =
    Array.isArray(
      settings.travel_styles
    )
      ? settings.travel_styles
      : [];


  const budgetTargets =
    settings
      .budget_daily_targets &&
    typeof settings
      .budget_daily_targets ===
      "object"
      ? settings
          .budget_daily_targets
      : {};


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


  const plannerConfig =
    settings
      .trip_planner_config ||
    {};


  const mapConfig =
    settings
      .trip_planner_map ||
    null;


  const endDate =
    addDays(
      startDate,
      Math.max(
        0,
        days.length - 1
      )
    );


  const totalDestinations =
    days.reduce(
      (
        total,
        day
      ) =>
        total +
        day.destinations
          .length,
      0
    );


  const routableDayCount =
    days.filter(
      (day) =>
        Array.isArray(
          day.destinations
        ) &&
        day.destinations.some(
          (destination) =>
            Number.isFinite(
              Number(
                destination?.lat
              )
            ) &&
            Number.isFinite(
              Number(
                destination?.lng
              )
            )
        )
    ).length;


  const totalItems =
    days.reduce(
      (
        total,
        day
      ) =>
        total +
        day.destinations
          .length +
        day.hotels.length +
        day.events.length +
        day.guides.length,
      0
    );


  const estimatedItemCost =
    days.reduce(
      (
        total,
        day
      ) => {
        const items = [
          ...day.destinations,
          ...day.hotels,
          ...day.events,
          ...day.guides,
        ];

        return (
          total +
          items.reduce(
            (
              subtotal,
              item
            ) =>
              subtotal +
              Number(
                item.estimatedCost ||
                0
              ),
            0
          )
        );
      },
      0
    );


  const showMessage =
    (
      message,
      isError = false
    ) => {
      if (isError) {
        setError(
          message
        );

        setNotice("");
      } else {
        setNotice(
          message
        );

        setError("");
      }
    };


  const markChanged =
    (
      affectsRoute = false
    ) => {
      setDirty(true);

      if (affectsRoute) {
        setRouteAnalysis(
          null
        );

        setRouteError(
          ""
        );
      }
    };


  const refreshSavedTrips =
    useCallback(
      async () => {
        try {
          const response =
            await getMyTripPlans();

          setSavedTrips(
            response.data ||
            []
          );
        } catch (loadError) {
          console.error(
            "Failed to load saved trips",
            loadError
          );
        }
      },
      []
    );


  useEffect(() => {
    let active = true;


    const load =
      async () => {
        try {
          setLoading(true);


          const [
            bootstrapResponse,
            plansResponse,
            databaseEvents,
          ] =
            await Promise.all([
              getTripPlannerBootstrap(),
              getMyTripPlans(),
              getTouristEvents(),
            ]);


          if (!active) {
            return;
          }


          const data =
            bootstrapResponse.data ||
            {};


          const loadedSettings =
            data.settings ||
            {};


          const loadedDestinations =
            (
              data.destinations ||
              []
            ).map(
              destinationFromBootstrap
            );


          setSettings(
            loadedSettings
          );


          setDestinations(
            loadedDestinations
          );


          setStarterItineraries(
            data.starterItineraries ||
            []
          );


          setSavedTrips(
            plansResponse.data ||
            []
          );


          const reconciledEvents =
            reconcileSavedEventsWithDatabase(
              readTripItems(),
              databaseEvents
            );


          if (
            reconciledEvents.changed
          ) {
            const updatedItems =
              writeTripItems(
                reconciledEvents.items
              );

            setSavedItems(
              updatedItems
            );
          } else {
            setSavedItems(
              reconciledEvents.items
            );
          }


          const styles =
            loadedSettings
              .travel_styles ||
            [];


          const budgets =
            Object.keys(
              loadedSettings
                .budget_daily_targets ||
              {}
            );


          const profiles =
            loadedSettings
              .trip_planner_transport_profiles ||
            [];


          const modes =
            loadedSettings
              .trip_planner_optimization_modes ||
            [];


          setTravelStyle(
            (
              current
            ) =>
              current ||
              styles[0] ||
              ""
          );


          setBudgetLevel(
            (
              current
            ) =>
              current ||
              budgets[0] ||
              ""
          );


          setTransportProfile(
            (
              current
            ) =>
              current ||
              profiles[0]
                ?.key ||
              ""
          );


          setOptimizationMode(
            (
              current
            ) =>
              current ||
              modes[0]
                ?.key ||
              ""
          );
        } catch (loadError) {
          console.error(
            loadError
          );

          setError(
            loadError
              ?.response
              ?.data
              ?.message ||
            "Failed to load the Trip Planner."
          );
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };


    load();


    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    const refresh =
      () => {
        setSavedItems(
          readTripItems()
        );
      };


    window.addEventListener(
      "storage",
      refresh
    );


    window.addEventListener(
      SAVED_TRIP_EVENT,
      refresh
    );


    return () => {
      window.removeEventListener(
        "storage",
        refresh
      );

      window.removeEventListener(
        SAVED_TRIP_EVENT,
        refresh
      );
    };
  }, []);


  useEffect(() => {
    if (
      loading
    ) {
      return;
    }

    writePlannerDraft({
      savedPlanId,
      tripName,
      startDate,
      daysCount,
      travellerCount,
      travelStyle,
      budgetLevel,
      transportProfile,
      optimizationMode,
      days,
      routeAnalysis,
      dirty,
      updatedAt:
        Date.now(),
    });
  }, [
    loading,
    savedPlanId,
    tripName,
    startDate,
    daysCount,
    travellerCount,
    travelStyle,
    budgetLevel,
    transportProfile,
    optimizationMode,
    days,
    routeAnalysis,
    dirty,
  ]);


  useEffect(() => {
    if (
      loading
    ) {
      return;
    }

    let stored;

    try {
      stored =
        JSON.parse(
          sessionStorage.getItem(
            TRIP_PLANNER_RETURN_KEY
          ) ||
            "null"
        );
    } catch {
      return;
    }

    if (
      !stored?.restore
    ) {
      return;
    }

    sessionStorage.removeItem(
      TRIP_PLANNER_RETURN_KEY
    );

    const targetY =
      Math.max(
        0,
        Number(
          stored.scrollY ||
            0
        )
      );

    window.requestAnimationFrame(
      () => {
        window.requestAnimationFrame(
          () => {
            window.scrollTo({
              top:
                targetY,
              left: 0,
              behavior:
                "auto",
            });
          }
        );
      }
    );
  }, [
    loading,
  ]);


  const persistDraftBeforeNavigation =
    () => {
      writePlannerDraft({
        savedPlanId,
        tripName,
        startDate,
        daysCount,
        travellerCount,
        travelStyle,
        budgetLevel,
        transportProfile,
        optimizationMode,
        days,
        routeAnalysis,
        dirty,
        updatedAt:
          Date.now(),
      });

      rememberPlannerReturn();
    };


  const rebuildDays =
    () => {
      const maxDays =
        Number(
          plannerConfig
            .maxDays ||
          30
        );


      const count =
        Math.min(
          Math.max(
            1,
            Number(
              daysCount
            ) || 1
          ),
          maxDays
        );


      setDaysCount(
        String(count)
      );


      setDays(
        (current) =>
          Array.from(
            {
              length:
                count,
            },
            (
              _,
              index
            ) => {
              const existing =
                current[
                  index
                ];


              if (existing) {
                return {
                  ...existing,

                  dayNumber:
                    index +
                    1,

                  date:
                    addDays(
                      startDate,
                      index
                    ),
                };
              }


              return {
                ...createDays(
                  startDate,
                  count
                )[index],
              };
            }
          )
      );


      markChanged(
        true
      );

      showMessage(
        "Trip dates updated."
      );
    };


  const updateDay =
    (
      dayIndex,
      updater,
      {
        affectsRoute = false,
      } = {}
    ) => {
      setDays(
        (current) =>
          current.map(
            (
              day,
              index
            ) =>
              index ===
              dayIndex
                ? updater(
                    day
                  )
                : day
          )
      );

      markChanged(
        affectsRoute
      );
    };


  const addDestination =
    (
      dayIndex,
      destinationId
    ) => {
      const id =
        Number(
          destinationId
        );


      const destination =
        destinationMap.get(
          id
        );


      if (!destination) {
        return;
      }


      updateDay(
        dayIndex,
        (day) => {
          if (
            day.destinations.some(
              (item) =>
                Number(
                  item.id
                ) === id
            )
          ) {
            showMessage(
              `${destination.name} is already on this day.`,
              true
            );

            return day;
          }


          const max =
            Number(
              plannerConfig
                .maxDestinationsPerDay ||
              10
            );


          if (
            day.destinations
              .length >= max
          ) {
            showMessage(
              `Maximum ${max} destinations are allowed per day.`,
              true
            );

            return day;
          }


          return {
            ...day,

            destinations: [
              ...day.destinations,
              destination,
            ],
          };
        },
        {
          affectsRoute: true,
        }
      );
    };


  const removeDayItem =
    (
      dayIndex,
      category,
      itemIndex
    ) => {
      const removedItem =
        days?.[dayIndex]
          ?.[category]
          ?.[itemIndex];


      const affectsRoute =
        category ===
          "destinations" ||
        Boolean(
          removedItem?.isFixed ??
          removedItem?.is_fixed
        );


      updateDay(
        dayIndex,
        (day) => ({
          ...day,

          [category]:
            day[
              category
            ].filter(
              (
                _,
                index
              ) =>
                index !==
                itemIndex
            ),
        }),
        {
          affectsRoute,
        }
      );
    };


  const addSavedItem =
    (
      dayIndex,
      item
    ) => {
      const category =
        getTripItemCategoryKey(
          item
        );


      if (
        ![
          "destinations",
          "hotels",
          "events",
          "guides",
        ].includes(
          category
        )
      ) {
        showMessage(
          "Unsupported trip item.",
          true
        );

        return;
      }


      /* =====================================================
         DESTINATION
      ===================================================== */

      if (
        category ===
        "destinations"
      ) {
        const sourceId =
          getSourceId(
            item,
            "destination"
          );


        if (
          !destinationMap.has(
            sourceId
          )
        ) {
          showMessage(
            `${item.name} is not available as a published database destination.`,
            true
          );

          return;
        }


        addDestination(
          dayIndex,
          sourceId
        );

        return;
      }


      /* =====================================================
         DAY CHECK
      ===================================================== */

      const targetDay =
        days[
          dayIndex
        ];


      if (!targetDay) {
        showMessage(
          "Selected trip day is not available.",
          true
        );

        return;
      }


      if (
        !Array.isArray(
          targetDay.destinations
        ) ||
        targetDay.destinations
          .length === 0
      ) {
        showMessage(
          `Add a destination to Day ${
            dayIndex + 1
          } before adding ${getTripItemTypeLabel(
            item
          ).toLowerCase()}.`,
          true
        );

        return;
      }


      /* =====================================================
         DATABASE ID CHECK
      ===================================================== */

      const itemType =
        getCanonicalType(
          item
        );


      const sourceId =
        getSourceId(
          item,
          itemType
        );


      if (!sourceId) {
        showMessage(
          category ===
          "events"
            ? `${item.name || "This event"} is no longer available in the approved event database. Use More events to choose an available event.`
            : `${item.name || "Trip item"} does not have a valid database ID.`,
          true
        );

        return;
      }


      /* =====================================================
         DUPLICATE CHECK
      ===================================================== */

      const alreadyAdded =
        targetDay[
          category
        ].some(
          (current) =>
            getSourceId(
              current,
              getCanonicalType(
                current
              )
            ) === sourceId
        );


      if (alreadyAdded) {
        showMessage(
          `${item.name} is already added to Day ${
            dayIndex + 1
          }.`,
          true
        );

        return;
      }


      /* =====================================================
         LOCATION COMPATIBILITY

         Hotels and events are matched to the selected
         day's destination city or district.

         Guides are not restricted. They can travel, so the
         planner shows every saved guide and ranks nearby
         guides first.
      ===================================================== */

      const requiresLocationMatch =
        category ===
          "hotels" ||
        category ===
          "events";


      if (
        requiresLocationMatch &&
        !itemMatchesDayLocation(
          item,
          targetDay
        )
      ) {
        const destinationNames =
          targetDay.destinations
            .map(
              (
                destination
              ) =>
                destination.name
            )
            .filter(
              Boolean
            )
            .join(", ");


        showMessage(
          `${item.name} is not near the selected destination area for Day ${
            dayIndex + 1
          } (${destinationNames}).`,
          true
        );

        return;
      }


      /* =====================================================
         ADD ITEM
      ===================================================== */

      updateDay(
        dayIndex,
        (
          day
        ) => ({
          ...day,

          [category]: [
            ...day[
              category
            ],

            item,
          ],
        }),
        {
          affectsRoute:
            Boolean(
              item.isFixed ??
              item.is_fixed
            ),
        }
      );


      showMessage(
        `${item.name} added to Day ${
          dayIndex + 1
        }.`
      );
    };


  const buildPayload =
    () => {
      if (
        !tripName.trim()
      ) {
        throw new Error(
          "Trip name is required."
        );
      }


      const apiDays =
        days.map(
          (day) => {
            const allItems = [
              ...day.destinations,
              ...day.hotels,
              ...day.events,
              ...day.guides,
            ];


            return {
              date:
                day.date,

              notes:
                day.notes ||
                null,

              isLocked:
                Boolean(
                  day.isLocked
                ),

              lockReason:
                day.isLocked
                  ? day.lockReason ||
                    "Locked by traveller"
                  : null,

              items:
                allItems.map(
                  toApiItem
                ),
            };
          }
        );


      return {
        title:
          tripName.trim(),

        startDate,

        endDate,

        travelStyle:
          travelStyle ||
          null,

        budgetLevel:
          budgetLevel ||
          null,

        travellerCount:
          Number(
            travellerCount
          ) || 1,

        optimizationMode,

        transportProfile,

        status:
          "saved",

        days:
          apiDays,
      };
    };


  const saveTrip =
    async ({
      silent = false,
    } = {}) => {
      const payload =
        buildPayload();


      let response;


      if (savedPlanId) {
        response =
          await updateTripPlan(
            savedPlanId,
            payload
          );
      } else {
        response =
          await createTripPlan(
            payload
          );
      }


      const id =
        Number(
          response
            ?.data?.id ||
          savedPlanId
        );


      setSavedPlanId(
        id
      );


      setDirty(false);


      await refreshSavedTrips();


      if (!silent) {
        showMessage(
          "Plan saved."
        );
      }


      return id;
    };


  const handleSave =
    async () => {
      try {
        setActionLoading(
          true
        );

        await saveTrip();
      } catch (saveError) {
        console.error(
          saveError
        );

        showMessage(
          saveError
            ?.response
            ?.data
            ?.message ||
          saveError.message ||
          "Failed to save trip.",
          true
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };


  const hydrateTrip =
    useCallback(
      (
        plan,
        planId
      ) => {
        const localDays =
          (
            plan.days ||
            []
          ).map(
            (
              day,
              index
            ) => {
              const groups = {
                destinations:
                  [],
                hotels: [],
                events: [],
                guides: [],
              };


              (
                day.items ||
                []
              ).forEach(
                (item) => {
                  const local =
                    serverItemToLocal(
                      item,
                      destinationMap,
                      savedItems
                    );


                  const category =
                    getTripItemCategoryKey(
                      local
                    );


                  if (
                    groups[
                      category
                    ]
                  ) {
                    groups[
                      category
                    ].push(
                      local
                    );
                  }
                }
              );


              return {
                dayNumber:
                  index + 1,

                date:
                  day.trip_date,

                notes:
                  day.notes ||
                  "",

                isLocked:
                  Boolean(
                    day.is_locked
                  ),

                lockReason:
                  day.lock_reason ||
                  "",

                ...groups,
              };
            }
          );


        setSavedPlanId(
          Number(
            planId ||
            plan.id
          )
        );


        setTripName(
          plan.title ||
          "Sri Lanka Trip"
        );


        setStartDate(
          plan.start_date
        );


        setDaysCount(
          String(
            localDays.length
          )
        );


        setTravellerCount(
          String(
            plan.traveller_count ||
            1
          )
        );


        setTravelStyle(
          plan.travel_style ||
          ""
        );


        setBudgetLevel(
          plan.budget_level ||
          ""
        );


        setTransportProfile(
          plan.transport_profile ||
          ""
        );


        setOptimizationMode(
          plan.optimization_mode ||
          ""
        );


        setDays(
          localDays
        );


        setRouteAnalysis(
          null
        );


        setRouteError(
          ""
        );


        setDirty(false);
      },
      [
        destinationMap,
        savedItems,
      ]
    );


  const loadSavedTrip =
    async (
      tripPlanId
    ) => {
      try {
        setActionLoading(
          true
        );


        const response =
          await getTripPlanById(
            tripPlanId
          );


        const plan =
          response.data;


        hydrateTrip(
          plan,
          tripPlanId
        );


        const savedRoutableDayCount =
          (
            plan?.days ||
            []
          ).filter(
            (day) =>
              (
                day?.items ||
                []
              ).some(
                (item) =>
                  getCanonicalType(
                    item
                  ) ===
                  "destination"
              )
          ).length;


        if (
          savedRoutableDayCount >=
          2
        ) {
          try {
            const routeResponse =
              await analyzeTripRoute(
                tripPlanId
              );

            setRouteAnalysis(
              routeResponse.data
            );

            setRouteError(
              ""
            );
          } catch (routeLoadError) {
            console.error(
              "Failed to restore saved route",
              routeLoadError
            );

            setRouteAnalysis(
              null
            );

            setRouteError(
              routeLoadError
                ?.response
                ?.data
                ?.message ||
              "Road route could not be restored."
            );
          }
        }


        showMessage(
          "Saved plan loaded."
        );

        return true;
      } catch (loadError) {
        console.error(
          loadError
        );

        showMessage(
          loadError
            ?.response
            ?.data
            ?.message ||
          "Failed to load trip.",
          true
        );

        return false;
      } finally {
        setActionLoading(
          false
        );
      }
    };


  const openSavedPlans =
    async () => {
      setSavedPlansOpen(
        true
      );

      await refreshSavedTrips();
    };


  const openSavedPlanFromLibrary =
    async (
      tripPlanId
    ) => {
      const id =
        Number(
          tripPlanId
        );

      if (!id) {
        return;
      }

      if (
        dirty &&
        Number(
          savedPlanId || 0
        ) !== id &&
        !window.confirm(
          "Open this saved plan and discard the current unsaved changes?"
        )
      ) {
        return;
      }

      const loaded =
        await loadSavedTrip(
          id
        );

      if (loaded) {
        setSavedPlansOpen(
          false
        );

        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });
      }
    };


  const deleteSavedPlanFromLibrary =
    async (
      trip
    ) => {
      const id =
        Number(
          trip?.id
        );

      if (!id) {
        return;
      }

      if (
        !window.confirm(
          `Delete ${trip?.title || "this saved trip"}?`
        )
      ) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        await deleteTripPlan(
          id
        );

        if (
          Number(
            savedPlanId || 0
          ) === id
        ) {
          newTrip();
        }

        await refreshSavedTrips();

        showMessage(
          "Saved trip deleted."
        );
      } catch (deleteError) {
        showMessage(
          deleteError
            ?.response
            ?.data
            ?.message ||
          "Failed to delete trip.",
          true
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };


  const handleAnalyze =
    async () => {
      try {
        setActionLoading(
          true
        );

        setRouteError(
          ""
        );


        const tripPlanId =
          await saveTrip({
            silent: true,
          });


        const response =
          await analyzeTripRoute(
            tripPlanId
          );


        setRouteAnalysis(
          response.data
        );

        setRouteError(
          ""
        );


        if (
          response.data
            ?.improved
        ) {
          showMessage(
            "A more practical road route is available."
          );
        } else {
          showMessage(
            "Your current route is already practical for the selected optimization mode."
          );
        }
      } catch (analysisError) {
        console.error(
          analysisError
        );

        const message =
          analysisError
            ?.response
            ?.data
            ?.message ||
          analysisError.message ||
          "Route analysis failed.";


        setRouteError(
          message
        );

        showMessage(
          message,
          true
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };


  const handleApplyRoute =
    async () => {
      if (
        !savedPlanId ||
        !routeAnalysis
          ?.analysisId
      ) {
        return;
      }


      try {
        setActionLoading(
          true
        );


        const previousSaving =
          routeAnalysis
            .saving;


        await applyTripRoute({
          tripPlanId:
            savedPlanId,

          analysisId:
            routeAnalysis
              .analysisId,
        });


        const updated =
          await getTripPlanById(
            savedPlanId
          );


        hydrateTrip(
          updated.data,
          savedPlanId
        );


        const freshAnalysis =
          await analyzeTripRoute(
            savedPlanId
          );


        setRouteAnalysis(
          freshAnalysis.data
        );

        setRouteError(
          ""
        );


        showMessage(
          `Better route applied. Saved approximately ${formatDurationSeconds(
            previousSaving
              ?.durationSeconds
          )} and ${formatDistance(
            previousSaving
              ?.distanceMeters
          )}.`
        );


        await refreshSavedTrips();
      } catch (applyError) {
        console.error(
          applyError
        );

        showMessage(
          applyError
            ?.response
            ?.data
            ?.message ||
          "Failed to apply recommended route.",
          true
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };


  const handleUseStarterItinerary =
    (itinerary) => {
      const places =
        (
          itinerary.places ||
          []
        )
          .map(
            (place) =>
              destinationMap.get(
                Number(
                  place.id
                )
              )
          )
          .filter(
            Boolean
          );


      if (!places.length) {
        return;
      }


      const maxDays =
        Number(
          plannerConfig
            .maxDays ||
          30
        );


      const count =
        Math.min(
          places.length,
          maxDays
        );


      const nextDays =
        createDays(
          startDate,
          count
        );


      places
        .slice(
          0,
          count
        )
        .forEach(
          (
            place,
            index
          ) => {
            nextDays[
              index
            ].destinations.push(
              place
            );
          }
        );


      setDays(
        nextDays
      );

      setDaysCount(
        String(count)
      );

      setTripName(
        itinerary.title ||
        tripName
      );

      setSavedPlanId(
        null
      );

      markChanged(
        true
      );

      showMessage(
        "Database itinerary loaded. You can edit every day."
      );
    };


  const newTrip =
    () => {
      const count = 3;

      try {
        sessionStorage.removeItem(
          TRIP_PLANNER_RETURN_KEY
        );
      } catch {
        // No action needed.
      }


      setSavedPlanId(
        null
      );

      setTripName(
        "Sri Lanka Trip"
      );

      setStartDate(
        today
      );

      setDaysCount(
        String(count)
      );

      setTravellerCount(
        "2"
      );

      setDays(
        createDays(
          today,
          count
        )
      );

      setRouteAnalysis(
        null
      );

      setRouteError(
        ""
      );

      setDirty(false);

      showMessage(
        "New trip started."
      );
    };


  const handleDelete =
    async () => {
      if (!savedPlanId) {
        newTrip();

        return;
      }


      if (
        !window.confirm(
          "Delete this saved trip?"
        )
      ) {
        return;
      }


      try {
        setActionLoading(
          true
        );


        await deleteTripPlan(
          savedPlanId
        );


        await refreshSavedTrips();

        newTrip();

        showMessage(
          "Trip deleted."
        );
      } catch (deleteError) {
        showMessage(
          deleteError
            ?.response
            ?.data
            ?.message ||
          "Failed to delete trip.",
          true
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };


  const downloadPdf =
    async () => {
      if (
        pdfLoading
      ) {
        return;
      }

      try {
        setPdfLoading(
          true
        );

        const doc =
          new jsPDF({
            orientation:
              "portrait",
            unit:
              "mm",
            format:
              "a4",
            compress:
              true,
          });

        const pageWidth =
          doc.internal.pageSize.getWidth();

        const pageHeight =
          doc.internal.pageSize.getHeight();

        const margin = 15;

        const contentWidth =
          pageWidth -
          margin * 2;

        const allItems =
          days.flatMap(
            (day) => [
              ...(
                day.destinations ||
                []
              ),
              ...(
                day.hotels ||
                []
              ),
              ...(
                day.events ||
                []
              ),
              ...(
                day.guides ||
                []
              ),
            ]
          );

        const totalEstimatedCost =
          allItems.reduce(
            (
              total,
              item
            ) =>
              total +
              getPdfItemCost(
                item
              ),
            0
          );

        const transportLabel =
          transportProfiles.find(
            (profile) =>
              profile.key ===
              transportProfile
          )?.label ||
          transportProfile ||
          "Not set";

        const optimizationLabel =
          optimizationModes.find(
            (mode) =>
              mode.key ===
              optimizationMode
          )?.label ||
          optimizationMode ||
          "Not set";

        const heroItem =
          allItems.find(
            (item) =>
              getTripItemImage(
                item
              )
          );

        const heroImage =
          heroItem
            ? await loadPdfImage(
                heroItem
              )
            : null;


        // Cover
        doc.setFillColor(
          ...PDF_THEME.tealDark
        );

        doc.rect(
          0,
          0,
          pageWidth,
          67,
          "F"
        );

        doc.setFillColor(
          ...PDF_THEME.amber
        );

        doc.rect(
          0,
          0,
          pageWidth,
          3,
          "F"
        );

        doc.setTextColor(
          ...PDF_THEME.white
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(10);

        doc.text(
          "TRIPLANKA - TRIP ITINERARY",
          margin,
          17
        );

        doc.setFontSize(27);

        const titleLines =
          doc.splitTextToSize(
            cleanPdfText(
              tripName ||
              "Sri Lanka Trip"
            ),
            heroImage
              ? 102
              : contentWidth
          );

        doc.text(
          titleLines.slice(
            0,
            3
          ),
          margin,
          31
        );

        const titleHeight =
          titleLines
            .slice(0, 3)
            .length *
          9;

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(10);

        doc.setTextColor(
          218,
          239,
          234
        );

        doc.text(
          `${cleanPdfText(
            formatDate(
              startDate
            )
          )} - ${cleanPdfText(
            formatDate(
              endDate
            )
          )}`,
          margin,
          Math.min(
            58,
            34 +
              titleHeight
          )
        );

        if (
          heroImage
        ) {
          doc.setFillColor(
            255,
            255,
            255
          );

          doc.roundedRect(
            136,
            13,
            59,
            42,
            3,
            3,
            "F"
          );

          doc.addImage(
            heroImage,
            "JPEG",
            138,
            15,
            55,
            38,
            undefined,
            "FAST"
          );
        }


        let y = 79;

        y =
          drawPdfSectionTitle(
            doc,
            "Trip overview",
            "At a glance",
            margin,
            y
          );


        const statCards = [
          {
            label:
              "Days",
            value:
              String(
                days.length
              ),
          },
          {
            label:
              "Travellers",
            value:
              String(
                travellerCount
              ),
          },
          {
            label:
              "Planned items",
            value:
              String(
                allItems.length
              ),
          },
          {
            label:
              "Item estimate",
            value:
              totalEstimatedCost >
              0
                ? formatMoney(
                    totalEstimatedCost
                  )
                : "Not set",
          },
        ];

        const statGap = 3;

        const statWidth =
          (
            contentWidth -
            statGap * 3
          ) /
          4;

        statCards.forEach(
          (
            card,
            index
          ) => {
            const x =
              margin +
              index *
                (
                  statWidth +
                  statGap
                );

            doc.setFillColor(
              ...PDF_THEME.soft
            );

            doc.setDrawColor(
              ...PDF_THEME.line
            );

            doc.roundedRect(
              x,
              y,
              statWidth,
              24,
              2.5,
              2.5,
              "FD"
            );

            doc.setTextColor(
              ...PDF_THEME.muted
            );

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setFontSize(7.5);

            doc.text(
              card.label,
              x + 3,
              y + 7
            );

            doc.setTextColor(
              ...PDF_THEME.ink
            );

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.setFontSize(
              card.value.length >
              15
                ? 9
                : 11
            );

            const lines =
              doc.splitTextToSize(
                cleanPdfText(
                  card.value
                ),
                statWidth - 6
              );

            doc.text(
              lines.slice(
                0,
                2
              ),
              x + 3,
              y + 15
            );
          }
        );

        y += 33;


        const detailRows = [
          [
            "Travel style",
            travelStyle ||
              "Not set",
          ],
          [
            "Budget",
            budgetLevel ||
              "Not set",
          ],
          [
            "Transport",
            transportLabel,
          ],
          [
            "Route priority",
            optimizationLabel,
          ],
        ];

        detailRows.forEach(
          (
            [
              label,
              value,
            ],
            index
          ) => {
            const rowY =
              y +
              index *
                8;

            doc.setTextColor(
              ...PDF_THEME.muted
            );

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setFontSize(8);

            doc.text(
              label,
              margin,
              rowY
            );

            doc.setTextColor(
              ...PDF_THEME.ink
            );

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.text(
              cleanPdfText(
                value
              ),
              53,
              rowY
            );
          }
        );

        y += 39;


        if (
          routeAnalysis
        ) {
          y =
            drawPdfSectionTitle(
              doc,
              "Road route",
              "Route summary",
              margin,
              y
            );

          doc.setFillColor(
            ...PDF_THEME.tealSoft
          );

          doc.setDrawColor(
            188,
            220,
            211
          );

          doc.roundedRect(
            margin,
            y,
            contentWidth,
            routeAnalysis
              .improved
              ? 48
              : 36,
            3,
            3,
            "FD"
          );

          doc.setTextColor(
            ...PDF_THEME.ink
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(10);

          doc.text(
            `${formatDistance(
              routeAnalysis
                .current
                ?.distanceMeters
            )} road distance`,
            margin + 5,
            y + 9
          );

          doc.text(
            `${formatDurationSeconds(
              routeAnalysis
                .current
                ?.durationSeconds
            )} travel time`,
            margin + 72,
            y + 9
          );

          doc.setFont(
            "helvetica",
            "normal"
          );

          doc.setFontSize(8);

          doc.setTextColor(
            ...PDF_THEME.muted
          );

          const currentOrder =
            routeText(
              routeAnalysis
                .current
                ?.order
            );

          if (
            currentOrder
          ) {
            doc.text(
              doc
                .splitTextToSize(
                  `Current: ${cleanPdfText(
                    currentOrder
                  )}`,
                  contentWidth -
                    10
                )
                .slice(
                  0,
                  2
                ),
              margin + 5,
              y + 18
            );
          }

          if (
            routeAnalysis
              .improved
          ) {
            doc.setTextColor(
              ...PDF_THEME.tealDark
            );

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.text(
              `Recommended saving: ${formatDurationSeconds(
                routeAnalysis
                  .saving
                  ?.durationSeconds
              )} / ${formatDistance(
                routeAnalysis
                  .saving
                  ?.distanceMeters
              )}`,
              margin + 5,
              y + 31
            );

            const recommendedOrder =
              routeText(
                routeAnalysis
                  .recommended
                  ?.order
              );

            if (
              recommendedOrder
            ) {
              doc.setFont(
                "helvetica",
                "normal"
              );

              doc.setTextColor(
                ...PDF_THEME.muted
              );

              doc.text(
                doc
                  .splitTextToSize(
                    `Recommended: ${cleanPdfText(
                      recommendedOrder
                    )}`,
                    contentWidth -
                      10
                  )
                  .slice(
                    0,
                    2
                  ),
                margin + 5,
                y + 39
              );
            }
          }

          y +=
            routeAnalysis
              .improved
              ? 57
              : 45;
        }


        y =
          drawPdfSectionTitle(
            doc,
            "Day-by-day plan",
            "Itinerary preview",
            margin,
            y
          );

        const previewDays =
          days.slice(
            0,
            5
          );

        previewDays.forEach(
          (
            day,
            index
          ) => {
            const names =
              (
                day.destinations ||
                []
              )
                .map(
                  (item) =>
                    cleanPdfText(
                      item.name
                    )
                )
                .filter(Boolean)
                .join(" - ");

            doc.setFillColor(
              index % 2 ===
                0
                ? 249
                : 255,
              index % 2 ===
                0
                ? 251
                : 255,
              index % 2 ===
                0
                ? 250
                : 255
            );

            doc.roundedRect(
              margin,
              y,
              contentWidth,
              11,
              2,
              2,
              "F"
            );

            doc.setTextColor(
              ...PDF_THEME.tealDark
            );

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.setFontSize(8.5);

            doc.text(
              `Day ${day.dayNumber}`,
              margin + 4,
              y + 7
            );

            doc.setTextColor(
              ...PDF_THEME.ink
            );

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.text(
              cleanPdfText(
                formatDate(
                  day.date
                )
              ),
              margin + 25,
              y + 7
            );

            doc.setTextColor(
              ...PDF_THEME.muted
            );

            doc.text(
              doc
                .splitTextToSize(
                  names ||
                    "No destination selected",
                  78
                )
                .slice(
                  0,
                  1
                ),
              112,
              y + 7
            );

            y += 12;
          }
        );

        if (
          days.length >
          previewDays.length
        ) {
          doc.setTextColor(
            ...PDF_THEME.muted
          );

          doc.setFont(
            "helvetica",
            "italic"
          );

          doc.setFontSize(8);

          doc.text(
            `+ ${
              days.length -
              previewDays.length
            } more day(s) in the detailed itinerary`,
            margin,
            y + 3
          );
        }


        // Detailed itinerary
        for (
          let dayIndex = 0;
          dayIndex <
          days.length;
          dayIndex += 1
        ) {
          const day =
            days[
              dayIndex
            ];

          doc.addPage();

          let pageY = 20;

          const drawDayHeader =
            (
              continued =
                false
            ) => {
              doc.setFillColor(
                ...PDF_THEME.tealDark
              );

              doc.roundedRect(
                margin,
                pageY,
                contentWidth,
                28,
                3,
                3,
                "F"
              );

              doc.setTextColor(
                ...PDF_THEME.white
              );

              doc.setFont(
                "helvetica",
                "bold"
              );

              doc.setFontSize(10);

              doc.text(
                continued
                  ? `DAY ${day.dayNumber} - CONTINUED`
                  : `DAY ${day.dayNumber}`,
                margin + 6,
                pageY + 8
              );

              doc.setFontSize(17);

              doc.text(
                cleanPdfText(
                  formatDate(
                    day.date
                  )
                ),
                margin + 6,
                pageY + 18
              );

              const destinationNames =
                (
                  day.destinations ||
                  []
                )
                  .map(
                    (item) =>
                      cleanPdfText(
                        item.city ||
                          item.name
                      )
                  )
                  .filter(Boolean)
                  .join(" - ");

              doc.setFont(
                "helvetica",
                "normal"
              );

              doc.setFontSize(8);

              doc.setTextColor(
                218,
                239,
                234
              );

              doc.text(
                doc
                  .splitTextToSize(
                    destinationNames ||
                      "Open day",
                    72
                  )
                  .slice(
                    0,
                    2
                  ),
                pageWidth - 21,
                pageY + 9,
                {
                  align:
                    "right",
                }
              );

              pageY += 36;
            };


          drawDayHeader();


          const dayItems = [
            ...(
              day.destinations ||
              []
            ),
            ...(
              day.hotels ||
              []
            ),
            ...(
              day.events ||
              []
            ),
            ...(
              day.guides ||
              []
            ),
          ];


          if (
            !dayItems.length
          ) {
            doc.setTextColor(
              ...PDF_THEME.muted
            );

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setFontSize(10);

            doc.text(
              "No items planned for this day.",
              margin,
              pageY
            );

            pageY += 10;
          }


          for (
            let itemIndex = 0;
            itemIndex <
            dayItems.length;
            itemIndex += 1
          ) {
            const item =
              dayItems[
                itemIndex
              ];

            const typeLabel =
              cleanPdfText(
                getTripItemTypeLabel(
                  item
                )
              ).toUpperCase();

            const location =
              getPdfItemLocation(
                item
              );

            const cost =
              getPdfItemCost(
                item
              );

            const description =
              getPdfItemDescription(
                item
              );

            const extraLines =
              getPdfItemExtraLines(
                item
              );

            const descriptionLines =
              description
                ? doc
                    .splitTextToSize(
                      description,
                      115
                    )
                    .slice(
                      0,
                      3
                    )
                : [];

            const itemHeight =
              Math.max(
                31,
                24 +
                  descriptionLines.length *
                    4 +
                  extraLines.length *
                    4
              );

            if (
              pageY +
                itemHeight >
              pageHeight -
                24
            ) {
              doc.addPage();

              pageY = 20;

              drawDayHeader(
                true
              );
            }


            doc.setFillColor(
              ...PDF_THEME.white
            );

            doc.setDrawColor(
              ...PDF_THEME.line
            );

            doc.roundedRect(
              margin,
              pageY,
              contentWidth,
              itemHeight,
              3,
              3,
              "FD"
            );


            const itemImage =
              await loadPdfImage(
                item
              );

            const imageX =
              margin + 4;

            const imageY =
              pageY + 4;

            const imageWidth =
              32;

            const imageHeight =
              Math.min(
                24,
                itemHeight - 8
              );

            if (
              itemImage
            ) {
              doc.addImage(
                itemImage,
                "JPEG",
                imageX,
                imageY,
                imageWidth,
                imageHeight,
                undefined,
                "FAST"
              );
            } else {
              doc.setFillColor(
                ...PDF_THEME.tealSoft
              );

              doc.roundedRect(
                imageX,
                imageY,
                imageWidth,
                imageHeight,
                2,
                2,
                "F"
              );

              doc.setTextColor(
                ...PDF_THEME.tealDark
              );

              doc.setFont(
                "helvetica",
                "bold"
              );

              doc.setFontSize(7);

              doc.text(
                typeLabel,
                imageX +
                  imageWidth /
                    2,
                imageY +
                  imageHeight /
                    2,
                {
                  align:
                    "center",
                }
              );
            }


            const textX =
              margin + 40;

            const textWidth =
              contentWidth - 45;

            doc.setTextColor(
              ...PDF_THEME.teal
            );

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.setFontSize(7.5);

            doc.text(
              typeLabel,
              textX,
              pageY + 7
            );


            if (
              cost > 0
            ) {
              doc.setTextColor(
                ...PDF_THEME.muted
              );

              doc.setFont(
                "helvetica",
                "normal"
              );

              doc.text(
                cleanPdfText(
                  formatMoney(
                    cost
                  )
                ),
                pageWidth -
                  margin -
                  4,
                pageY + 7,
                {
                  align:
                    "right",
                }
              );
            }


            doc.setTextColor(
              ...PDF_THEME.ink
            );

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.setFontSize(11.5);

            const nameLines =
              doc.splitTextToSize(
                cleanPdfText(
                  item.name ||
                  "Trip item"
                ),
                textWidth -
                  15
              );

            doc.text(
              nameLines.slice(
                0,
                2
              ),
              textX,
              pageY + 13
            );


            let detailY =
              pageY +
              13 +
              Math.min(
                nameLines.length,
                2
              ) *
                4.2;


            if (
              location
            ) {
              doc.setTextColor(
                ...PDF_THEME.muted
              );

              doc.setFont(
                "helvetica",
                "normal"
              );

              doc.setFontSize(8);

              doc.text(
                cleanPdfText(
                  location
                ),
                textX,
                detailY
              );

              detailY += 4;
            }


            extraLines.forEach(
              (
                line
              ) => {
                doc.setTextColor(
                  ...PDF_THEME.muted
                );

                doc.setFontSize(7.5);

                doc.text(
                  cleanPdfText(
                    line
                  ),
                  textX,
                  detailY
                );

                detailY += 4;
              }
            );


            if (
              descriptionLines
                .length
            ) {
              doc.setTextColor(
                69,
                84,
                79
              );

              doc.setFont(
                "helvetica",
                "normal"
              );

              doc.setFontSize(7.5);

              doc.text(
                descriptionLines,
                textX,
                detailY
              );
            }


            const itemLink =
              getPdfAbsoluteLink(
                item
              );

            if (
              itemLink
            ) {
              const linkY =
                pageY +
                itemHeight -
                5;

              doc.setTextColor(
                ...PDF_THEME.teal
              );

              doc.setFont(
                "helvetica",
                "bold"
              );

              doc.setFontSize(7.5);

              doc.textWithLink(
                "View in TripLanka",
                textX,
                linkY,
                {
                  url:
                    itemLink,
                }
              );
            }


            pageY +=
              itemHeight +
              5;
          }


          if (
            day.notes
          ) {
            const noteLines =
              doc.splitTextToSize(
                cleanPdfText(
                  day.notes
                ),
                contentWidth -
                  10
              );

            const noteHeight =
              Math.max(
                22,
                13 +
                  noteLines.length *
                    4
              );

            if (
              pageY +
                noteHeight >
              pageHeight -
                24
            ) {
              doc.addPage();

              pageY = 20;

              drawDayHeader(
                true
              );
            }

            doc.setFillColor(
              255,
              249,
              235
            );

            doc.setDrawColor(
              239,
              215,
              163
            );

            doc.roundedRect(
              margin,
              pageY,
              contentWidth,
              noteHeight,
              3,
              3,
              "FD"
            );

            doc.setTextColor(
              128,
              88,
              25
            );

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.setFontSize(8);

            doc.text(
              "DAY NOTES",
              margin + 5,
              pageY + 7
            );

            doc.setTextColor(
              86,
              74,
              52
            );

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setFontSize(8.5);

            doc.text(
              noteLines,
              margin + 5,
              pageY + 13
            );
          }
        }


        const pageCount =
          doc.getNumberOfPages();

        for (
          let pageNumber = 1;
          pageNumber <=
          pageCount;
          pageNumber += 1
        ) {
          doc.setPage(
            pageNumber
          );

          drawPdfFooter(
            doc,
            pageNumber,
            pageCount
          );
        }


        const safeName =
          (
            tripName ||
            "Sri Lanka Trip"
          )
            .replace(
              /[^a-z0-9]+/gi,
              "_"
            )
            .replace(
              /^_+|_+$/g,
              ""
            ) ||
          "Sri_Lanka_Trip";

        doc.save(
          `${safeName}.pdf`
        );

        showMessage(
          "PDF exported."
        );
      } catch (
        pdfError
      ) {
        console.error(
          pdfError
        );

        showMessage(
          "Could not create the PDF.",
          true
        );
      } finally {
        setPdfLoading(
          false
        );
      }
    };


  const availableSavedItems =
    savedItems.filter(
      (item) =>
        getCanonicalType(
          item
        ) !==
        "destination"
    );


  if (loading) {
    return (
      <main className="trip-planner-page">
        <div className="trip-loading">
          <RefreshCw
            size={26}
            className="spin"
          />

          <strong>
            Loading Trip Planner…
          </strong>

          <span>
            Fetching live destinations
            and planner settings.
          </span>
        </div>
      </main>
    );
  }


  return (
    <main className="trip-planner-page">
      <section className="trip-planner-hero">
        <div
          className="trip-hero-visual"
          aria-hidden="true"
        >
          <span className="trip-hero-glow trip-hero-glow-left" />
          <span className="trip-hero-glow trip-hero-glow-right" />

          <svg
            className="trip-hero-route-art"
            viewBox="0 0 280 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 103C48 59 82 112 121 74C155 40 180 72 207 45C229 23 249 31 266 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="5 8"
            />

            <circle
              cx="14"
              cy="103"
              r="5"
              fill="currentColor"
            />

            <circle
              cx="121"
              cy="74"
              r="5"
              fill="currentColor"
            />

            <circle
              cx="207"
              cy="45"
              r="5"
              fill="currentColor"
            />

            <circle
              cx="266"
              cy="18"
              r="7"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="trip-hero-copy">
          <span className="trip-kicker">
            TRIPLANKA · TRIP PLANNER
          </span>

          <div className="trip-hero-title-wrap">
            <h1 className="trip-modern-hero-title">
              Shape your{" "}
              <span className="trip-title-sri-lanka">
                Sri Lanka
              </span>{" "}
              <span className="trip-title-journey">
                journey.
              </span>
            </h1>

            <p className="trip-modern-hero-subtitle">
              Plan each day. Travel with confidence.
            </p>
          </div>

          <div className="trip-hero-actions">
            <a
              href="#trip-setup"
              className="trip-hero-primary"
            >
              Start planning
            </a>

            <a
              href="#trip-basket"
              className="trip-hero-secondary"
            >
              Build itinerary
            </a>
          </div>

          <div className="trip-hero-capabilities">
            <span>
              Day-by-day planning
            </span>

            <span>
              Real road routing
            </span>

            <span>
              Save and return
            </span>

            <span>
              PDF export
            </span>
          </div>
        </div>


        <div className="trip-hero-guide">
          <div className="trip-hero-guide-heading">
            <span>
              Simple planning flow
            </span>

            <strong>
              From idea to itinerary
            </strong>
          </div>

          <div className="trip-hero-steps">
            <a
              href="#trip-setup"
              className="trip-hero-step"
            >
              <span className="trip-hero-step-icon">
                <CalendarDays
                  size={18}
                />
              </span>

              <span className="trip-hero-step-copy">
                <b>
                  1. Set trip details
                </b>

                <small>
                  Dates, travellers and preferences
                </small>
              </span>
            </a>

            <a
              href="#trip-basket"
              className="trip-hero-step"
            >
              <span className="trip-hero-step-icon">
                <MapPin
                  size={18}
                />
              </span>

              <span className="trip-hero-step-copy">
                <b>
                  2. Build each day
                </b>

                <small>
                  Add destinations and trip items
                </small>
              </span>
            </a>

            <a
              href="#trip-route"
              className="trip-hero-step"
            >
              <span className="trip-hero-step-icon">
                <Route
                  size={18}
                />
              </span>

              <span className="trip-hero-step-copy">
                <b>
                  3. Check the route
                </b>

                <small>
                  Compare distance and travel time
                </small>
              </span>
            </a>

            <a
              href="#trip-save"
              className="trip-hero-step"
            >
              <span className="trip-hero-step-icon">
                <Save
                  size={18}
                />
              </span>

              <span className="trip-hero-step-copy">
                <b>
                  4. Save your plan
                </b>

                <small>
                  Keep it or export a PDF
                </small>
              </span>
            </a>
          </div>
        </div>
      </section>


      <section className="trip-planner-toolbar">
        <div className="trip-toolbar-summary">
          <span>
            Current trip
          </span>

          <strong>
            {tripName ||
              "Sri Lanka Trip"}
          </strong>

          <small>
            {days.length}{" "}
            {days.length === 1
              ? "day"
              : "days"}
            {" · "}
            {totalDestinations}{" "}
            {totalDestinations === 1
              ? "destination"
              : "destinations"}
            {" · "}
            {dirty
              ? "Unsaved changes"
              : savedPlanId
              ? "Saved"
              : "New trip"}
          </small>
        </div>


        <div className="trip-header-actions">
          <button
            type="button"
            className="trip-secondary-button trip-saved-plans-button"
            onClick={
              openSavedPlans
            }
          >
            <Save
              size={17}
            />

            Saved plans

            <span>
              {savedTrips.length}
            </span>
          </button>


          <button
            type="button"
            className="trip-secondary-button"
            onClick={
              newTrip
            }
          >
            <Plus
              size={17}
            />

            New trip
          </button>
        </div>
      </section>


      {savedPlansOpen && (
        <div
          className="trip-saved-plans-backdrop"
          role="presentation"
          onMouseDown={
            (event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSavedPlansOpen(
                  false
                );
              }
            }
          }
        >
          <section
            className="trip-saved-plans-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Saved trip plans"
          >
            <div className="trip-saved-plans-head">
              <div>
                <span>
                  Your trips
                </span>

                <h2>
                  Saved plans
                </h2>
              </div>

              <button
                type="button"
                className="trip-saved-plans-close"
                onClick={() =>
                  setSavedPlansOpen(
                    false
                  )
                }
                aria-label="Close saved plans"
              >
                ×
              </button>
            </div>


            {savedTrips.length ? (
              <div className="trip-saved-plans-list">
                {savedTrips.map(
                  (trip) => {
                    const active =
                      Number(
                        trip.id
                      ) ===
                      Number(
                        savedPlanId ||
                        0
                      );

                    return (
                      <article
                        key={
                          trip.id
                        }
                        className={`trip-saved-plan-card ${
                          active
                            ? "active"
                            : ""
                        }`}
                      >
                        <div className="trip-saved-plan-main">
                          <div className="trip-saved-plan-title-row">
                            <strong>
                              {trip.title ||
                                "Sri Lanka Trip"}
                            </strong>

                            {active && (
                              <span>
                                Open
                              </span>
                            )}
                          </div>

                          <p>
                            {formatDate(
                              trip.start_date
                            )}
                            {trip.end_date
                              ? ` - ${formatDate(
                                  trip.end_date
                                )}`
                              : ""}
                          </p>

                          <div className="trip-saved-plan-meta">
                            <span>
                              {Number(
                                trip.day_count ||
                                  0
                              )} days
                            </span>

                            <span>
                              {Number(
                                trip.item_count ||
                                  0
                              )} items
                            </span>

                            <span>
                              {Number(
                                trip.traveller_count ||
                                  1
                              )} travellers
                            </span>
                          </div>
                        </div>


                        <div className="trip-saved-plan-actions">
                          <button
                            type="button"
                            className="open"
                            disabled={
                              actionLoading
                            }
                            onClick={() =>
                              openSavedPlanFromLibrary(
                                trip.id
                              )
                            }
                          >
                            Open
                          </button>

                          <button
                            type="button"
                            className="delete"
                            disabled={
                              actionLoading
                            }
                            onClick={() =>
                              deleteSavedPlanFromLibrary(
                                trip
                              )
                            }
                            aria-label={`Delete ${trip.title || "saved trip"}`}
                          >
                            <Trash2
                              size={15}
                            />
                          </button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="trip-saved-plans-empty">
                <Save
                  size={24}
                />

                <strong>
                  No saved plans yet
                </strong>
              </div>
            )}
          </section>
        </div>
      )}


      {(error ||
        notice) && (
        <div
          className={`trip-message ${
            error
              ? "error"
              : ""
          }`}
        >
          <span>
            {error ||
              notice}
          </span>

          <button
            type="button"
            onClick={() => {
              setError("");
              setNotice("");
            }}
          >
            ×
          </button>
        </div>
      )}


      <div className="trip-planner-layout">
        <div className="trip-planner-content">
          <section
            id="trip-setup"
            className="trip-section trip-settings-card"
          >
            <div className="trip-section-heading">
              <div>
                <span>
                  Step 1 · Trip setup
                </span>

                <h2>
                  Travel details
                </h2>
              </div>

              {dirty && (
                <small className="trip-unsaved">
                  Unsaved changes
                </small>
              )}
            </div>


            <div className="trip-settings-grid">
              <label>
                <span>
                  Trip name
                </span>

                <input
                  value={
                    tripName
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setTripName(
                        event
                          .target
                          .value
                      );

                      markChanged();
                    }
                  }
                />
              </label>


              <label>
                <span>
                  Start date
                </span>

                <input
                  type="date"
                  value={
                    startDate
                  }
                  min={
                    today
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setStartDate(
                        event
                          .target
                          .value
                      );

                      markChanged();
                    }
                  }
                />
              </label>


              <label>
                <span>
                  Days
                </span>

                <input
                  type="number"
                  min="1"
                  max={
                    plannerConfig
                      .maxDays ||
                    30
                  }
                  value={
                    daysCount
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setDaysCount(
                        event
                          .target
                          .value
                      );
                    }
                  }
                />
              </label>


              <label>
                <span>
                  Travellers
                </span>

                <div className="trip-input-icon">
                  <Users
                    size={17}
                  />

                  <input
                    type="number"
                    min="1"
                    value={
                      travellerCount
                    }
                    onChange={
                      (
                        event
                      ) => {
                        setTravellerCount(
                          event
                            .target
                            .value
                        );

                        markChanged();
                      }
                    }
                  />
                </div>
              </label>


              <label>
                <span>
                  Travel style
                </span>

                <select
                  value={
                    travelStyle
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setTravelStyle(
                        event
                          .target
                          .value
                      );

                      markChanged();
                    }
                  }
                >
                  {travelStyles.map(
                    (
                      style
                    ) => (
                      <option
                        key={
                          style
                        }
                      >
                        {
                          style
                        }
                      </option>
                    )
                  )}
                </select>
              </label>


              <label>
                <span>
                  Budget
                </span>

                <select
                  value={
                    budgetLevel
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setBudgetLevel(
                        event
                          .target
                          .value
                      );

                      markChanged();
                    }
                  }
                >
                  {Object.keys(
                    budgetTargets
                  ).map(
                    (
                      level
                    ) => (
                      <option
                        key={
                          level
                        }
                      >
                        {
                          level
                        }
                      </option>
                    )
                  )}
                </select>
              </label>


              <label>
                <span>
                  Transport
                </span>

                <select
                  value={
                    transportProfile
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setTransportProfile(
                        event
                          .target
                          .value
                      );

                      markChanged(
                        true
                      );
                    }
                  }
                >
                  {transportProfiles.map(
                    (
                      profile
                    ) => (
                      <option
                        key={
                          profile.key
                        }
                        value={
                          profile.key
                        }
                      >
                        {
                          profile.label
                        }
                      </option>
                    )
                  )}
                </select>
              </label>


              <label>
                <span>
                  Route priority
                </span>

                <select
                  value={
                    optimizationMode
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setOptimizationMode(
                        event
                          .target
                          .value
                      );

                      markChanged(
                        true
                      );
                    }
                  }
                >
                  {optimizationModes.map(
                    (
                      mode
                    ) => (
                      <option
                        key={
                          mode.key
                        }
                        value={
                          mode.key
                        }
                      >
                        {
                          mode.label
                        }
                      </option>
                    )
                  )}
                </select>

                <small className="trip-field-help">
                  {optimizationMode ===
                  "fastest"
                    ? "Reduces estimated road travel time."
                    : optimizationMode ===
                      "shortest"
                    ? "Reduces total road distance. Travel time may not always decrease."
                    : "Choose how the route should be optimized."}
                </small>
              </label>
            </div>


            <div className="trip-settings-footer">
              <span>
                <CalendarDays
                  size={17}
                />

                {startDate}
                {" — "}
                {endDate}
              </span>

              <button
                type="button"
                className="trip-secondary-button"
                onClick={
                  rebuildDays
                }
              >
                Apply dates
              </button>
            </div>
          </section>


          {starterItineraries.length >
            0 && (
            <section className="trip-section">
              <div className="trip-section-heading">
                <div>
                  <span>
                    Optional starting ideas
                  </span>

                  <h2>
                    Suggested routes
                  </h2>
                </div>

                <small>
                  Starting ideas only — you can edit everything.
                </small>
              </div>


              <div className="trip-starter-grid">
                {starterItineraries.map(
                  (
                    itinerary
                  ) => (
                    <article
                      key={
                        itinerary.id
                      }
                      className="trip-starter-card"
                    >
                      <div>
                        <strong>
                          {
                            itinerary.title
                          }
                        </strong>

                        <span>
                          {
                            itinerary.days
                          }
                        </span>
                      </div>

                      <p>
                        {
                          itinerary.tone
                        }
                      </p>

                      <small>
                        {(
                          itinerary.places ||
                          []
                        )
                          .map(
                            (
                              place
                            ) =>
                              place.city ||
                              place.name
                          )
                          .join(
                            " → "
                          )}
                      </small>

                      <button
                        type="button"
                        onClick={() =>
                          handleUseStarterItinerary(
                            itinerary
                          )
                        }
                      >
                        Use route
                      </button>
                    </article>
                  )
                )}
              </div>
            </section>
          )}


          <section
            id="trip-basket"
            className="trip-section trip-basket-section"
          >
            <div className="trip-section-heading">
              <div>
                <span>
                  Saved for this trip
                </span>

                <h2>
                  Trip basket
                </h2>
              </div>

              <small>
                Choose a day and add saved places, stays, events or guides.
              </small>
            </div>

            <TripBasketWidget
              embedded
              sourceLabel="Trip basket"
              assetUrl={
                assetUrl
              }
              days={
                days
              }
              onAddToDay={
                addSavedItem
              }
              onNavigateAway={
                persistDraftBeforeNavigation
              }
            />
          </section>


          <section
            id="trip-itinerary"
            className="trip-section"
          >
            <div className="trip-section-heading">
              <div>
                <span>
                  Step 2 · Build itinerary
                </span>

                <h2>
                  Your itinerary
                </h2>
              </div>

            </div>


            <div className="trip-days-list">
              {days.map(
                (
                  day,
                  dayIndex
                ) => (
                  <article
                    className="trip-day-card"
                    key={
                      day.dayNumber
                    }
                  >
                    <header className="trip-day-header">
                      <div className="trip-day-number">
                        {
                          day.dayNumber
                        }
                      </div>

                      <div className="trip-day-title">
                        <span>
                          Day{" "}
                          {
                            day.dayNumber
                          }
                        </span>

                        <h3>
                          {
                            formatDate(
                              day.date
                            )
                          }
                        </h3>
                      </div>

                      {dayIndex === 0 ? (
                        <div
                          className="trip-anchor-badge"
                          title="The first travel day stays as the starting point when the route is optimized."
                        >
                          <MapPin
                            size={15}
                          />

                          Start anchor
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={`trip-lock-button ${
                            day.isLocked
                              ? "locked"
                              : ""
                          }`}
                          onClick={() =>
                            updateDay(
                              dayIndex,
                              (
                                current
                              ) => ({
                                ...current,

                                isLocked:
                                  !current.isLocked,

                                lockReason:
                                  !current.isLocked
                                    ? "Locked by traveller"
                                    : "",
                              }),
                              {
                                affectsRoute: true,
                              }
                            )
                          }
                        >
                          {day.isLocked
                            ? (
                              <Lock
                                size={16}
                              />
                            )
                            : (
                              <Unlock
                                size={16}
                              />
                            )}

                          {day.isLocked
                            ? "Locked"
                            : "Lock day"}
                        </button>
                      )}
                    </header>


                    <div className="trip-destination-add">
                      <MapPin
                        size={18}
                      />

                      <select
                        value=""
                        onChange={
                          (
                            event
                          ) => {
                            if (
                              event
                                .target
                                .value
                            ) {
                              addDestination(
                                dayIndex,
                                event
                                  .target
                                  .value
                              );
                            }
                          }
                        }
                      >
                        <option value="">
                          Add destination…
                        </option>

                        {destinations.map(
                          (
                            destination
                          ) => (
                            <option
                              key={
                                destination.id
                              }
                              value={
                                destination.id
                              }
                            >
                              {
                                destination.name
                              }
                              {" — "}
                              {
                                destination.city
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>


                    {day.destinations.length ===
                    0 ? (
                      <div className="trip-empty-day">
                        <MapPin
                          size={21}
                        />

                        <strong>
                          Add a destination
                        </strong>
                      </div>
                    ) : (
                      <div className="trip-place-list">
                        {day.destinations.map(
                          (
                            destination,
                            destinationIndex
                          ) => (
                            <div
                              className="trip-place-row"
                              key={`${destination.id}-${destinationIndex}`}
                            >
                              <span className="trip-place-sequence">
                                {day.dayNumber}
                                .
                                {destinationIndex +
                                  1}
                              </span>

                              {destination.image && (
                                <ContentImage
                                  src={
                                    destination.image
                                  }
                                  alt={
                                    destination.name
                                  }
                                />
                              )}

                              <div>
                                <strong>
                                  {
                                    destination.name
                                  }
                                </strong>

                                <span>
                                  {[
                                    destination.city,
                                    destination.district,
                                    destination.region,
                                  ]
                                    .filter(
                                      Boolean
                                    )
                                    .join(
                                      " • "
                                    )}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeDayItem(
                                    dayIndex,
                                    "destinations",
                                    destinationIndex
                                  )
                                }
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}


                    {CATEGORY_CONFIG.map(
                      (
                        category
                      ) => {
                        const items =
                          day[
                            category.key
                          ];


                        const baseCandidates =
                          availableSavedItems.filter(
                            (
                              item
                            ) =>
                              getTripItemCategoryKey(
                                item
                              ) ===
                                category.key &&
                              (
                                category.key !==
                                  "events" ||
                                Boolean(
                                  getSourceId(
                                    item,
                                    "event"
                                  )
                                )
                              ) &&
                              !items.some(
                                (
                                  existing
                                ) =>
                                  getSourceId(
                                    existing,
                                    getCanonicalType(
                                      existing
                                    )
                                  ) ===
                                  getSourceId(
                                    item,
                                    getCanonicalType(
                                      item
                                    )
                                  )
                              )
                          );


                        const candidates =
                          category.key ===
                          "guides"
                            ? [
                                ...baseCandidates,
                              ].sort(
                                (
                                  first,
                                  second
                                ) =>
                                  getLocationMatchRank(
                                    first,
                                    day
                                  ) -
                                    getLocationMatchRank(
                                      second,
                                      day
                                    ) ||
                                  String(
                                    first.name ||
                                      ""
                                  ).localeCompare(
                                    String(
                                      second.name ||
                                        ""
                                    )
                                  )
                              )
                            : baseCandidates
                                .filter(
                                  (
                                    item
                                  ) =>
                                    itemMatchesDayLocation(
                                      item,
                                      day
                                    )
                                )
                                .sort(
                                  (
                                    first,
                                    second
                                  ) =>
                                    getLocationMatchRank(
                                      first,
                                      day
                                    ) -
                                      getLocationMatchRank(
                                        second,
                                        day
                                      ) ||
                                    String(
                                      first.name ||
                                        ""
                                    ).localeCompare(
                                      String(
                                        second.name ||
                                          ""
                                      )
                                    )
                                );


                        const hasDestination =
                          Array.isArray(
                            day.destinations
                          ) &&
                          day.destinations
                            .length > 0;


                        const browseLink =
                          getBrowseLinkForCategory(
                            category.key,
                            day
                          );


                        const browseLabel =
                          getBrowseLabelForCategory(
                            category.key,
                            day
                          );


                        return (
                          <div
                            className="trip-day-subsection"
                            key={
                              category.key
                            }
                          >
                            <div className="trip-day-subheading trip-day-subheading-smart">
                              <div>
                                <strong>
                                  {
                                    category.label
                                  }
                                </strong>

                              </div>


                              <div className="trip-day-subheading-actions">
                                {candidates.length >
                                  0 && (
                                  <select
                                    value=""
                                    onChange={
                                      (
                                        event
                                      ) => {
                                        const selected =
                                          candidates.find(
                                            (
                                              item
                                            ) =>
                                              getTripItemKey(
                                                item
                                              ) ===
                                              event
                                                .target
                                                .value
                                          );


                                        if (
                                          selected
                                        ) {
                                          addSavedItem(
                                            dayIndex,
                                            selected
                                          );
                                        }
                                      }
                                    }
                                  >
                                    <option value="">
                                      Add saved{" "}
                                      {
                                        category.label
                                      }
                                      …
                                    </option>

                                    {candidates.map(
                                      (
                                        item
                                      ) => (
                                        <option
                                          key={
                                            getTripItemKey(
                                              item
                                            )
                                          }
                                          value={
                                            getTripItemKey(
                                              item
                                            )
                                          }
                                        >
                                          {
                                            item.name
                                          }
                                          {" — "}
                                          {getItemLocationLabel(
                                            item
                                          )}
                                        </option>
                                      )
                                    )}
                                  </select>
                                )}


                                <Link
                                  className="trip-more-link"
                                  to={
                                    browseLink
                                  }
                                  onClick={
                                    persistDraftBeforeNavigation
                                  }
                                >
                                  {
                                    browseLabel
                                  }
                                </Link>
                              </div>
                            </div>


                            {items.length >
                            0 ? (
                              <div className="trip-extra-items trip-extra-items-detailed">
                                {items.map(
                                  (
                                    item,
                                    itemIndex
                                  ) => {
                                    const itemLink =
                                      getTripItemLink(
                                        item
                                      );


                                    const sourceId =
                                      getSourceId(
                                        item,
                                        getCanonicalType(
                                          item
                                        )
                                      );


                                    const bookingLink =
                                      category.key ===
                                        "hotels" &&
                                      sourceId
                                        ? `/hotels/${sourceId}/rooms`
                                        : "";


                                    const itemImage =
                                      assetUrl(
                                        getTripItemImage(
                                          item
                                        )
                                      );


                                    return (
                                      <article
                                        className="trip-extra-item-card"
                                        key={`${getTripItemKey(
                                          item
                                        )}-${itemIndex}`}
                                      >
                                        <div className="trip-extra-item-info">
                                          {itemLink ? (
                                            <Link
                                              className="trip-extra-item-media"
                                              to={
                                                itemLink
                                              }
                                              onClick={
                                                persistDraftBeforeNavigation
                                              }
                                            >
                                              {itemImage ? (
                                                <ContentImage
                                                  src={
                                                    itemImage
                                                  }
                                                  alt={
                                                    item.name
                                                  }
                                                />
                                              ) : (
                                                <span>
                                                  {
                                                    getTripItemTypeLabel(
                                                      item
                                                    )
                                                  }
                                                </span>
                                              )}
                                            </Link>
                                          ) : (
                                            <div className="trip-extra-item-media">
                                              {itemImage ? (
                                                <ContentImage
                                                  src={
                                                    itemImage
                                                  }
                                                  alt={
                                                    item.name
                                                  }
                                                />
                                              ) : (
                                                <span>
                                                  {
                                                    getTripItemTypeLabel(
                                                      item
                                                    )
                                                  }
                                                </span>
                                              )}
                                            </div>
                                          )}


                                          <div className="trip-extra-item-copy">
                                            {itemLink ? (
                                              <Link
                                                to={
                                                  itemLink
                                                }
                                                onClick={
                                                  persistDraftBeforeNavigation
                                                }
                                              >
                                                {
                                                  item.name
                                                }
                                              </Link>
                                            ) : (
                                              <strong>
                                                {
                                                  item.name
                                                }
                                              </strong>
                                            )}

                                            <span>
                                              {getItemLocationLabel(
                                                item
                                              )}
                                            </span>

                                            <small>
                                              {
                                                getTripItemTypeLabel(
                                                  item
                                                )
                                              }
                                            </small>
                                          </div>
                                        </div>


                                        <div className="trip-extra-item-actions">
                                          {itemLink && (
                                            <Link
                                              to={
                                                itemLink
                                              }
                                              onClick={
                                                persistDraftBeforeNavigation
                                              }
                                            >
                                              View
                                            </Link>
                                          )}

                                          {bookingLink && (
                                            <Link
                                              className="book"
                                              to={
                                                bookingLink
                                              }
                                              onClick={
                                                persistDraftBeforeNavigation
                                              }
                                            >
                                              Book
                                            </Link>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeDayItem(
                                                dayIndex,
                                                category.key,
                                                itemIndex
                                              )
                                            }
                                            aria-label={`Remove ${item.name}`}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      </article>
                                    );
                                  }
                                )}
                              </div>
                            ) : (
                              <small className="trip-no-extra">
                                {category.key ===
                                "guides"
                                  ? "No guides added."
                                  : !hasDestination
                                  ? `Choose a destination before adding ${category.label.toLowerCase()}.`
                                  : `No ${category.label.toLowerCase()} added yet.`}
                              </small>
                            )}
                          </div>
                        );
                      }
                    )}


                    <label className="trip-day-notes">
                      <span>
                        Notes
                      </span>

                      <textarea
                        rows="2"
                        value={
                          day.notes
                        }
                        placeholder="Optional notes for this day…"
                        onChange={
                          (
                            event
                          ) =>
                            updateDay(
                              dayIndex,
                              (
                                current
                              ) => ({
                                ...current,

                                notes:
                                  event
                                    .target
                                    .value,
                              })
                            )
                        }
                      />
                    </label>
                  </article>
                )
              )}
            </div>
          </section>


          <section
            id="trip-save"
            className="trip-section trip-save-section"
          >
            <div>
              <span>
                Step 4 · Save and export
              </span>

              <h2>
                Save before you travel
              </h2>

            </div>


            <div className="trip-save-actions">
              <button
                type="button"
                className="trip-secondary-button"
                disabled={
                  pdfLoading
                }
                onClick={
                  downloadPdf
                }
              >
                {pdfLoading ? (
                  <RefreshCw
                    size={17}
                    className="spin"
                  />
                ) : (
                  <Download
                    size={17}
                  />
                )}

                {pdfLoading
                  ? "Preparing..."
                  : "PDF"}
              </button>


              <button
                type="button"
                className="trip-secondary-button danger"
                onClick={
                  handleDelete
                }
              >
                <Trash2
                  size={17}
                />

                {savedPlanId
                  ? "Delete"
                  : "Clear"}
              </button>


              {!savedPlanId ||
              dirty ? (
                <button
                  type="button"
                  className="trip-primary-button"
                  disabled={
                    actionLoading
                  }
                  onClick={
                    handleSave
                  }
                >
                  <Save
                    size={17}
                  />

                  {savedPlanId
                    ? "Save changes"
                    : "Save trip"}
                </button>
              ) : (
                <div
                  className="trip-save-state"
                  role="status"
                >
                  <CheckCircle2
                    size={17}
                  />

                  Saved
                </div>
              )}
            </div>
          </section>
        </div>


        <aside className="trip-planner-side">
          <section
            id="trip-map"
            className="trip-map-card"
          >
            <div className="trip-map-heading">
              <div>
                <span>
                  Step 3 · Review map
                </span>

                <h2>
                  Sri Lanka journey
                </h2>
              </div>

              <b>
                {
                  totalDestinations
                }{" "}
                stops
              </b>
            </div>


            <TripPlannerMap
              days={
                days
              }
              mapConfig={
                mapConfig
              }
              routeAnalysis={
                routeAnalysis
              }
            />
          </section>


          <section
            id="trip-route"
            className="trip-route-card"
          >
            <div className="trip-route-card-header">
              <Route
                size={20}
              />

              <div>
                <span>
                  Step 3 · Optimize route
                </span>

                <h2>
                  Route check
                </h2>
              </div>
            </div>


            {!routeAnalysis ? (
              <div className="trip-route-empty">
                <p>
                  {routableDayCount < 2
                    ? "Add destinations to at least two different days to analyze the road route."
                    : routeError ||
                      "Analyze the trip to draw the real road route and calculate travel time."}
                </p>

                <button
                  type="button"
                  className="trip-primary-button full"
                  disabled={
                    actionLoading ||
                    routableDayCount <
                      2
                  }
                  onClick={
                    handleAnalyze
                  }
                >
                  {actionLoading
                    ? (
                      <RefreshCw
                        size={17}
                        className="spin"
                      />
                    )
                    : (
                      <Route
                        size={17}
                      />
                    )}

                  {routeError
                    ? "Retry road route"
                    : "Analyze road route"}
                </button>
              </div>
            ) : (
              <>
                <div className="trip-route-metrics">
                  <article>
                    <Clock3
                      size={18}
                    />

                    <span>
                      Travel time
                    </span>

                    <strong>
                      {formatDurationSeconds(
                        routeAnalysis
                          .current
                          ?.durationSeconds
                      )}
                    </strong>
                  </article>


                  <article>
                    <MapPin
                      size={18}
                    />

                    <span>
                      Distance
                    </span>

                    <strong>
                      {formatDistance(
                        routeAnalysis
                          .current
                          ?.distanceMeters
                      )}
                    </strong>
                  </article>
                </div>


                {Array.isArray(
                  routeAnalysis.warnings
                ) &&
                routeAnalysis.warnings
                  .length > 0 ? (
                  <div className="trip-route-warnings">
                    {routeAnalysis.warnings.map(
                      (
                        warning,
                        warningIndex
                      ) => (
                        <div
                          className="trip-route-warning"
                          key={`${warning}-${warningIndex}`}
                        >
                          <AlertTriangle
                            size={16}
                          />

                          <span>
                            {warning}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : null}


                <div className="trip-current-route">
                  <span>
                    Current order
                  </span>

                  <p>
                    {routeText(
                      routeAnalysis
                        .current
                        ?.order
                    ) ||
                      "Current trip order"}
                  </p>
                </div>


                {routeAnalysis.improved ? (
                  <div className="trip-recommendation">
                    <div className="trip-recommendation-title">
                      <CheckCircle2
                        size={20}
                      />

                      <div>
                        <strong>
                          Better route found
                        </strong>

                        <span>
                          Based on real road routing
                        </span>
                      </div>
                    </div>


                    <p className="trip-recommended-order">
                      {routeText(
                        routeAnalysis
                          .recommended
                          ?.order
                      )}
                    </p>


                    <div className="trip-saving-grid">
                      <div
                        className={
                          routeAnalysis.metric ===
                          "duration"
                            ? "primary"
                            : ""
                        }
                      >
                        <Clock3
                          size={16}
                        />

                        <span>
                          {routeAnalysis.metric ===
                          "duration"
                            ? "Primary saving"
                            : Number(
                                routeAnalysis
                                  .saving
                                  ?.durationSeconds ||
                                0
                              ) > 0
                            ? "Time saved"
                            : "Time saving"}
                        </span>

                        <strong>
                          {formatDurationSeconds(
                            routeAnalysis
                              .saving
                              ?.durationSeconds
                          )}
                        </strong>
                      </div>


                      <div
                        className={
                          routeAnalysis.metric ===
                          "distance"
                            ? "primary"
                            : ""
                        }
                      >
                        <MapPin
                          size={16}
                        />

                        <span>
                          {routeAnalysis.metric ===
                          "distance"
                            ? "Primary saving"
                            : "Distance saved"}
                        </span>

                        <strong>
                          {formatDistance(
                            routeAnalysis
                              .saving
                              ?.distanceMeters
                          )}
                        </strong>
                      </div>
                    </div>


                    <p className="trip-route-priority-note">
                      Optimized for{" "}
                      <strong>
                        {routeAnalysis.metric ===
                        "duration"
                          ? "less travel time"
                          : "less road distance"}
                      </strong>
                      .

                      {routeAnalysis.metric ===
                        "distance" &&
                      Number(
                        routeAnalysis
                          .saving
                          ?.durationSeconds ||
                        0
                      ) === 0
                        ? " Travel time is not the primary target for this mode."
                        : ""}
                    </p>


                    <button
                      type="button"
                      className="trip-primary-button full"
                      disabled={
                        actionLoading
                      }
                      onClick={
                        handleApplyRoute
                      }
                    >
                      Apply recommended route
                    </button>
                  </div>
                ) : (
                  <div className="trip-route-good">
                    <CheckCircle2
                      size={20}
                    />

                    <div>
                      <strong>
                        Route looks practical
                      </strong>

                      <span>
                        No better order was found for the selected route priority.
                      </span>
                    </div>
                  </div>
                )}


                <button
                  type="button"
                  className="trip-text-button"
                  disabled={
                    actionLoading
                  }
                  onClick={
                    handleAnalyze
                  }
                >
                  <RefreshCw
                    size={15}
                  />

                  Re-analyze
                </button>
              </>
            )}
          </section>


          <section className="trip-summary-card">
            <span>
              Trip summary
            </span>

            <div>
              <strong>
                {
                  days.length
                }
              </strong>

              <small>
                days
              </small>
            </div>

            <div>
              <strong>
                {
                  totalItems
                }
              </strong>

              <small>
                planned items
              </small>
            </div>

            <div>
              <strong>
                {
                  travellerCount
                }
              </strong>

              <small>
                travellers
              </small>
            </div>

            <div>
              <strong>
                {formatMoney(
                  estimatedItemCost
                )}
              </strong>

              <small>
                item estimate
              </small>
            </div>
          </section>


          <Link
            className="trip-explore-link"
            to="/explore"
          >
            <MapPin
              size={17}
            />

            Explore more destinations
          </Link>
        </aside>
      </div>
    </main>
  );
}


export default TripPlannerPage;