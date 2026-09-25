import ContentImage from "../components/ContentImage";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  CalendarDays,
  Check,
  Clock3,
  Compass,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
} from "lucide-react";

import {
  buildEventSearchText,
  eventCategories,
  eventMonths,
  eventPriceFilters,
  normaliseEvent,
} from "../data/eventData";

import {
  assetUrl,
  getTouristEvents,
} from "../services/exploreService";

import {
  getTripItemKey,
  readTripItems,
  SAVED_TRIP_EVENT,
  toggleTripItem,
  writeTripItems,
} from "../utils/tripBasket";

import "../styles/events.css";


const getEventImage = (event) =>
  event?.imageUrl ||
  event?.image_url ||
  event?.image ||
  "";


const getNumericEventId = (event) => {
  const candidates = [
    event?.databaseId,
    event?.touristEventId,
    event?.tourist_event_id,
    event?.event_id,
    event?.eventId,
    event?.sourceId,
    event?.source_id,
  ];

  for (const value of candidates) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    const numeric = Number(value);

    if (
      Number.isInteger(numeric) &&
      numeric > 0
    ) {
      return numeric;
    }
  }

  return null;
};


const normaliseDatabaseEvent = (row) => {
  if (!row) {
    return null;
  }

  const databaseId =
    getNumericEventId(row) ||
    (() => {
      const numeric =
        Number(row?.id);

      return Number.isInteger(numeric) &&
        numeric > 0
        ? numeric
        : null;
    })();

  if (!databaseId) {
    return null;
  }

  const event =
    normaliseEvent(row);

  return {
    ...event,

    databaseId,

    eventId:
      databaseId,

    event_id:
      databaseId,

    touristEventId:
      databaseId,

    tourist_event_id:
      databaseId,

    sourceId:
      databaseId,
  };
};


const getEventKey = (event) =>
  event?.databaseId ||
  event?.slug ||
  event?.event_id ||
  event?.title;


const getEventLink = (event) =>
  event?.slug
    ? `/events/${encodeURIComponent(
        event.slug
      )}`
    : "/events";


const uniqueClean = (items) =>
  [
    ...new Set(
      items
        .filter(Boolean)
        .map((item) =>
          String(item).trim()
        )
        .filter(Boolean)
    ),
  ];


const buildEventTripItem = (event) => {
  const databaseId =
    getNumericEventId(event);

  if (!databaseId) {
    return null;
  }

  return {
    id:
      `event-${databaseId}`,

    sourceId:
      databaseId,

    touristEventId:
      databaseId,

    tourist_event_id:
      databaseId,

    eventId:
      databaseId,

    event_id:
      databaseId,

    databaseId,

    slug:
      event.slug || "",

    tripItemType:
      "event",

    name:
      event.title,

    city:
      event.city || "",

    district:
      event.district || "",

    venue:
      event.venue || "",

    region:
      event.category ||
      "Event",

    image:
      assetUrl(
        getEventImage(event)
      ),

    duration:
      event.duration ||
      event.timeLabel ||
      "Event",

    bestTime:
      event.dateLabel ||
      event.monthName ||
      "Check event date",

    budget:
      event.priceType ||
      "Event",

    estimatedCost:
      Number(
        event.price || 0
      ),

    shortDescription:
      event.shortDescription ||
      "Selected event for this Sri Lanka trip.",

    link:
      getEventLink(event),

    eventDate:
      event.dateLabel ||
      "",

    eventMonth:
      event.monthName ||
      "",
  };
};


const reconcileSavedEvents = (
  savedItems,
  databaseEvents
) => {
  const eventsById =
    new Map();

  const eventsBySlug =
    new Map();

  const eventsByNameAndCity =
    new Map();

  databaseEvents.forEach(
    (event) => {
      const id =
        getNumericEventId(event);

      if (id) {
        eventsById.set(
          String(id),
          event
        );
      }

      if (event.slug) {
        eventsBySlug.set(
          String(
            event.slug
          ).toLowerCase(),
          event
        );
      }

      const nameKey =
        `${String(
          event.title || ""
        )
          .trim()
          .toLowerCase()}|${String(
          event.city || ""
        )
          .trim()
          .toLowerCase()}`;

      if (nameKey !== "|") {
        eventsByNameAndCity.set(
          nameKey,
          event
        );
      }
    }
  );

  let changed = false;

  const nextItems = [];

  savedItems.forEach(
    (item) => {
      if (
        String(
          item?.tripItemType ||
            item?.type ||
            ""
        ).toLowerCase() !==
        "event"
      ) {
        nextItems.push(item);

        return;
      }

      const existingId =
        getNumericEventId(
          item
        );

      let match =
        existingId
          ? eventsById.get(
              String(
                existingId
              )
            )
          : null;

      if (!match) {
        const slug =
          String(
            item?.slug ||
              item?.eventSlug ||
              ""
          )
            .trim()
            .toLowerCase();

        const linkMatch =
          String(
            item?.link || ""
          ).match(
            /\/events\/([^?#/]+)/i
          );

        const linkSlug =
          linkMatch?.[1]
            ? decodeURIComponent(
                linkMatch[1]
              ).toLowerCase()
            : "";

        match =
          eventsBySlug.get(
            slug
          ) ||
          eventsBySlug.get(
            linkSlug
          ) ||
          null;
      }

      if (!match) {
        const nameKey =
          `${String(
            item?.name || ""
          )
            .trim()
            .toLowerCase()}|${String(
            item?.city || ""
          )
            .trim()
            .toLowerCase()}`;

        match =
          eventsByNameAndCity.get(
            nameKey
          ) ||
          null;
      }

      if (!match) {
        changed = true;

        return;
      }

      const corrected =
        buildEventTripItem(
          match
        );

      if (!corrected) {
        changed = true;

        return;
      }

      if (
        JSON.stringify(
          item
        ) !==
        JSON.stringify(
          corrected
        )
      ) {
        changed = true;
      }

      nextItems.push(
        corrected
      );
    }
  );

  return {
    changed,
    items:
      nextItems,
  };
};


const monthOrder =
  eventMonths.slice(1);


function EventCard({
  event,
  saved,
  onToggleSave,
}) {
  const highlights =
    Array.isArray(
      event.highlights
    )
      ? event.highlights.slice(
          0,
          2
        )
      : [];

  return (
    <article className="tl-event-card">
      <Link
        to={getEventLink(
          event
        )}
        className="tl-event-card-media"
      >
        <ContentImage
          src={assetUrl(
            getEventImage(
              event
            )
          )}
          alt={event.title}
        />

        <div className="tl-event-card-badges">
          <span className="tl-event-category">
            {event.category ||
              "Event"}
          </span>

          {event.featured ? (
            <span className="tl-event-featured">
              <Sparkles
                size={12}
              />

              Featured
            </span>
          ) : null}
        </div>
      </Link>

      <div className="tl-event-card-body">
        <div className="tl-event-date-row">
          <span>
            <CalendarDays
              size={14}
            />

            {event.dateLabel ||
              event.monthName ||
              "Check date"}
          </span>

          <span>
            {event.priceLabel ||
              event.priceType ||
              "Check price"}
          </span>
        </div>

        <Link
          to={getEventLink(
            event
          )}
          className="tl-event-title-link"
        >
          <h3>
            {event.title}
          </h3>
        </Link>

        <p className="tl-event-location">
          <MapPin
            size={14}
          />

          <span>
            {[
              event.venue,
              event.city,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </p>

        {event.shortDescription ? (
          <p className="tl-event-description">
            {
              event.shortDescription
            }
          </p>
        ) : null}

        <div className="tl-event-meta">
          {event.timeLabel ? (
            <span>
              <Clock3
                size={13}
              />

              {
                event.timeLabel
              }
            </span>
          ) : null}

          {event.priceType ? (
            <span>
              <WalletCards
                size={13}
              />

              {
                event.priceType
              }
            </span>
          ) : null}

          {event.guideRecommended ? (
            <span>
              <Compass
                size={13}
              />

              Guide pick
            </span>
          ) : null}
        </div>

        {highlights.length ? (
          <div className="tl-event-tags">
            {highlights.map(
              (item) => (
                <span
                  key={`${getEventKey(
                    event
                  )}-${item}`}
                >
                  {item}
                </span>
              )
            )}
          </div>
        ) : null}

        <div className="tl-event-actions">
          <Link
            to={getEventLink(
              event
            )}
            className="tl-event-primary-action"
          >
            View details
          </Link>

          <button
            type="button"
            className={
              saved
                ? "tl-event-save-action is-saved"
                : "tl-event-save-action"
            }
            onClick={() =>
              onToggleSave(
                event
              )
            }
          >
            <Heart
              size={15}
              fill={
                saved
                  ? "currentColor"
                  : "none"
              }
            />

            {saved
              ? "Saved"
              : "Save"}
          </button>

          <Link
            to={`/hotels?city=${encodeURIComponent(
              event.city ||
                ""
            )}`}
            className="tl-event-hotel-action"
          >
            Hotels
          </Link>
        </div>
      </div>
    </article>
  );
}


export default function EventsPage() {
  const [
    searchParams,
    setSearchParams,
  ] =
    useSearchParams();

  const [
    events,
    setEvents,
  ] =
    useState([]);

  const [
    savedTripItems,
    setSavedTripItems,
  ] =
    useState(
      readTripItems
    );

  const [
    notice,
    setNotice,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    retry,
    setRetry,
  ] =
    useState(0);

  const [
    filtersOpen,
    setFiltersOpen,
  ] =
    useState(false);

  const [
    search,
    setSearch,
  ] =
    useState(
      searchParams.get(
        "search"
      ) || ""
    );

  const [
    category,
    setCategory,
  ] =
    useState(
      searchParams.get(
        "category"
      ) || "All"
    );

  const [
    city,
    setCity,
  ] =
    useState(
      searchParams.get(
        "city"
      ) ||
        "All Destinations"
    );

  const [
    month,
    setMonth,
  ] =
    useState(
      searchParams.get(
        "month"
      ) ||
        "All Months"
    );

  const [
    price,
    setPrice,
  ] =
    useState(
      searchParams.get(
        "price"
      ) ||
        "Any Price"
    );

  const [
    sort,
    setSort,
  ] =
    useState(
      searchParams.get(
        "sort"
      ) ||
        "Recommended"
    );

  const [
    featuredOnly,
    setFeaturedOnly,
  ] =
    useState(
      searchParams.get(
        "featured"
      ) === "true"
    );

  const [
    guideOnly,
    setGuideOnly,
  ] =
    useState(
      searchParams.get(
        "guide"
      ) === "true"
    );

  const [
    heroIndex,
    setHeroIndex,
  ] =
    useState(0);


  useEffect(() => {
    let active = true;

    const loadEvents =
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const rows =
            await getTouristEvents();

          const nextEvents =
            (
              Array.isArray(
                rows
              )
                ? rows
                : []
            )
              .map(
                normaliseDatabaseEvent
              )
              .filter(
                Boolean
              );

          if (!active) {
            return;
          }

          setEvents(
            nextEvents
          );

          const savedItems =
            readTripItems();

          if (
            nextEvents.length >
            0
          ) {
            const reconciled =
              reconcileSavedEvents(
                savedItems,
                nextEvents
              );

            if (
              reconciled.changed
            ) {
              const written =
                writeTripItems(
                  reconciled.items
                );

              setSavedTripItems(
                written
              );
            } else {
              setSavedTripItems(
                savedItems
              );
            }
          } else {
            setSavedTripItems(
              savedItems
            );
          }
        } catch (
          loadError
        ) {
          if (!active) {
            return;
          }

          console.error(
            "Failed to load tourist events:",
            loadError
          );

          setEvents([]);

          setError(
            loadError?.response
              ?.data
              ?.message ||
              "Events could not be loaded. Please try again."
          );
        } finally {
          if (active) {
            setLoading(
              false
            );
          }
        }
      };

    loadEvents();

    return () => {
      active = false;
    };
  }, [retry]);


  useEffect(() => {
    const refreshSavedItems =
      () =>
        setSavedTripItems(
          readTripItems()
        );

    window.addEventListener(
      "storage",
      refreshSavedItems
    );

    window.addEventListener(
      SAVED_TRIP_EVENT,
      refreshSavedItems
    );

    return () => {
      window.removeEventListener(
        "storage",
        refreshSavedItems
      );

      window.removeEventListener(
        SAVED_TRIP_EVENT,
        refreshSavedItems
      );
    };
  }, []);


  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        () =>
          setNotice(""),
        2500
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [notice]);


  useEffect(() => {
    setSearch(
      searchParams.get(
        "search"
      ) || ""
    );

    setCategory(
      searchParams.get(
        "category"
      ) || "All"
    );

    setCity(
      searchParams.get(
        "city"
      ) ||
        "All Destinations"
    );

    setMonth(
      searchParams.get(
        "month"
      ) ||
        "All Months"
    );

    setPrice(
      searchParams.get(
        "price"
      ) ||
        "Any Price"
    );

    setSort(
      searchParams.get(
        "sort"
      ) ||
        "Recommended"
    );

    setFeaturedOnly(
      searchParams.get(
        "featured"
      ) === "true"
    );

    setGuideOnly(
      searchParams.get(
        "guide"
      ) === "true"
    );
  }, [searchParams]);


  const safeEvents =
    useMemo(
      () => events,
      [events]
    );


  const cityOptions =
    useMemo(
      () => [
        "All Destinations",

        ...uniqueClean(
          safeEvents.map(
            (event) =>
              event.city
          )
        ),
      ],
      [safeEvents]
    );


  const categoryCounts =
    useMemo(() => {
      const counts = {
        All:
          safeEvents.length,
      };

      safeEvents.forEach(
        (event) => {
          counts[
            event.category
          ] =
            (
              counts[
                event.category
              ] || 0
            ) + 1;
        }
      );

      return counts;
    }, [safeEvents]);


  const heroSlides =
    useMemo(() => {
      const featured =
        safeEvents.filter(
          (event) =>
            event.featured &&
            getEventImage(
              event
            )
        );

      const normal =
        safeEvents.filter(
          (event) =>
            !event.featured &&
            getEventImage(
              event
            )
        );

      return [
        ...featured,
        ...normal,
      ].slice(0, 8);
    }, [safeEvents]);


  useEffect(() => {
    if (
      heroSlides.length <=
      1
    ) {
      return undefined;
    }

    const timer =
      window.setInterval(
        () => {
          setHeroIndex(
            (current) =>
              (
                current +
                1
              ) %
              heroSlides.length
          );
        },
        5000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    heroSlides.length,
  ]);


  const syncParams =
    (next = {}) => {
      const nextSearch =
        next.search ??
        search;

      const nextCategory =
        next.category ??
        category;

      const nextCity =
        next.city ??
        city;

      const nextMonth =
        next.month ??
        month;

      const nextPrice =
        next.price ??
        price;

      const nextSort =
        next.sort ??
        sort;

      const nextFeatured =
        next.featuredOnly ??
        featuredOnly;

      const nextGuide =
        next.guideOnly ??
        guideOnly;

      const params =
        new URLSearchParams();

      if (
        nextSearch.trim()
      ) {
        params.set(
          "search",
          nextSearch.trim()
        );
      }

      if (
        nextCategory !==
        "All"
      ) {
        params.set(
          "category",
          nextCategory
        );
      }

      if (
        nextCity !==
        "All Destinations"
      ) {
        params.set(
          "city",
          nextCity
        );
      }

      if (
        nextMonth !==
        "All Months"
      ) {
        params.set(
          "month",
          nextMonth
        );
      }

      if (
        nextPrice !==
        "Any Price"
      ) {
        params.set(
          "price",
          nextPrice
        );
      }

      if (
        nextSort !==
        "Recommended"
      ) {
        params.set(
          "sort",
          nextSort
        );
      }

      if (
        nextFeatured
      ) {
        params.set(
          "featured",
          "true"
        );
      }

      if (
        nextGuide
      ) {
        params.set(
          "guide",
          "true"
        );
      }

      setSearchParams(
        params
      );
    };


  const filteredEvents =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return safeEvents
        .filter(
          (event) => {
            const matchesSearch =
              !query ||
              buildEventSearchText(
                event
              ).includes(
                query
              );

            const matchesCategory =
              category ===
                "All" ||
              event.category ===
                category;

            const matchesCity =
              city ===
                "All Destinations" ||
              event.city ===
                city;

            const matchesMonth =
              month ===
                "All Months" ||
              event.monthName ===
                month;

            const matchesPrice =
              price ===
                "Any Price" ||
              event.priceType ===
                price;

            const matchesFeatured =
              !featuredOnly ||
              event.featured;

            const matchesGuide =
              !guideOnly ||
              event.guideRecommended;

            return (
              matchesSearch &&
              matchesCategory &&
              matchesCity &&
              matchesMonth &&
              matchesPrice &&
              matchesFeatured &&
              matchesGuide
            );
          }
        )
        .sort(
          (a, b) => {
            if (
              sort ===
              "Lowest price"
            ) {
              return (
                Number(
                  a.price || 0
                ) -
                Number(
                  b.price || 0
                )
              );
            }

            if (
              sort ===
              "Highest price"
            ) {
              return (
                Number(
                  b.price || 0
                ) -
                Number(
                  a.price || 0
                )
              );
            }

            if (
              sort ===
              "Month order"
            ) {
              return (
                monthOrder.indexOf(
                  a.monthName
                ) -
                monthOrder.indexOf(
                  b.monthName
                )
              );
            }

            if (
              sort ===
              "Name A-Z"
            ) {
              return String(
                a.title || ""
              ).localeCompare(
                String(
                  b.title || ""
                )
              );
            }

            return (
              Number(
                b.featured
              ) -
                Number(
                  a.featured
                ) ||
              Number(
                b.guideRecommended
              ) -
                Number(
                  a.guideRecommended
                )
            );
          }
        );
    }, [
      category,
      city,
      featuredOnly,
      guideOnly,
      month,
      price,
      safeEvents,
      search,
      sort,
    ]);


  const currentHeroEvent =
    heroSlides[
      heroIndex
    ] ||
    safeEvents[0] ||
    null;


  const currentMonthName =
    new Intl.DateTimeFormat(
      "en-US",
      {
        month:
          "long",

        timeZone:
          "Asia/Colombo",
      }
    ).format(
      new Date()
    );


  const thisMonthCount =
    safeEvents.filter(
      (event) =>
        event.monthName ===
        currentMonthName
    ).length;


  const savedTripKeys =
    useMemo(
      () =>
        new Set(
          savedTripItems.map(
            getTripItemKey
          )
        ),
      [savedTripItems]
    );


  const isEventSaved =
    (event) => {
      const item =
        buildEventTripItem(
          event
        );

      return item
        ? savedTripKeys.has(
            getTripItemKey(
              item
            )
          )
        : false;
    };


  const handleToggleEventTrip =
    (event) => {
      const item =
        buildEventTripItem(
          event
        );

      if (!item) {
        setNotice(
          "This event is not available for trip planning yet."
        );

        return;
      }

      const result =
        toggleTripItem(
          item
        );

      setSavedTripItems(
        result.items
      );

      setNotice(
        result.saved
          ? `${event.title} added to your trip basket.`
          : `${event.title} removed from your trip basket.`
      );
    };


  const clearFilters =
    () => {
      setSearch("");

      setCategory(
        "All"
      );

      setCity(
        "All Destinations"
      );

      setMonth(
        "All Months"
      );

      setPrice(
        "Any Price"
      );

      setSort(
        "Recommended"
      );

      setFeaturedOnly(
        false
      );

      setGuideOnly(
        false
      );

      setSearchParams(
        {}
      );
    };


  const updateFilter =
    (
      key,
      value
    ) => {
      const next = {
        [key]:
          value,
      };

      switch (key) {
        case "category":
          setCategory(
            value
          );
          break;

        case "city":
          setCity(
            value
          );
          break;

        case "month":
          setMonth(
            value
          );
          break;

        case "price":
          setPrice(
            value
          );
          break;

        case "sort":
          setSort(
            value
          );
          break;

        case "featuredOnly":
          setFeaturedOnly(
            value
          );
          break;

        case "guideOnly":
          setGuideOnly(
            value
          );
          break;

        default:
          break;
      }

      syncParams(next);
    };


  const handleSearchSubmit =
    (event) => {
      event.preventDefault();

      syncParams();
    };


  const activeFilterCount =
    Number(
      category !==
        "All"
    ) +
    Number(
      city !==
        "All Destinations"
    ) +
    Number(
      month !==
        "All Months"
    ) +
    Number(
      price !==
        "Any Price"
    ) +
    Number(
      featuredOnly
    ) +
    Number(
      guideOnly
    );


  return (
    <main className="tl-events-page">
      {notice ? (
        <div className="tl-events-toast">
          {notice}
        </div>
      ) : null}


      <section className="tl-events-hero">
        {currentHeroEvent ? (
          <ContentImage
            className="tl-events-hero-image"
            src={assetUrl(
              getEventImage(
                currentHeroEvent
              )
            )}
            alt=""
          />
        ) : null}

        <div className="tl-events-hero-overlay" />

        <div className="tl-events-hero-inner">
          <div className="tl-events-hero-copy">
            <span className="tl-events-kicker">
              TRIPLANKA · EVENTS
            </span>

            <h1>
              Find events for your{" "}
              <span>
                Sri Lanka trip.
              </span>
            </h1>

            <p>
              Search events by destination, date or experience.
            </p>

            <form
              className="tl-events-search"
              onSubmit={
                handleSearchSubmit
              }
            >
              <Search
                size={19}
              />

              <input
                type="search"
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search events, cities or venues"
              />

              {search ? (
                <button
                  type="button"
                  className="tl-events-search-clear"
                  onClick={() => {
                    setSearch("");

                    syncParams({
                      search:
                        "",
                    });
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}

              <button
                type="submit"
                className="tl-events-search-button"
              >
                Search
              </button>
            </form>

            <div className="tl-events-hero-summary">
              <span>
                <strong>
                  {
                    safeEvents.length
                  }
                </strong>

                events
              </span>

              <span>
                <strong>
                  {
                    cityOptions.length -
                    1
                  }
                </strong>

                destinations
              </span>

              <span>
                <strong>
                  {
                    thisMonthCount
                  }
                </strong>

                in{" "}
                {
                  currentMonthName
                }
              </span>
            </div>
          </div>

          {currentHeroEvent ? (
            <Link
              to={getEventLink(
                currentHeroEvent
              )}
              className="tl-events-hero-feature"
            >
              <span>
                {currentHeroEvent.featured
                  ? "Featured event"
                  : "Event highlight"}
              </span>

              <strong>
                {
                  currentHeroEvent.title
                }
              </strong>

              <small>
                <MapPin
                  size={13}
                />

                {[
                  currentHeroEvent.city,
                  currentHeroEvent.dateLabel,
                ]
                  .filter(
                    Boolean
                  )
                  .join(
                    " · "
                  )}
              </small>

              <em>
                View details →
              </em>
            </Link>
          ) : null}
        </div>
      </section>


      <section className="tl-events-browser">
        <div className="tl-events-heading">
          <div>
            <span>
              EXPLORE EVENTS
            </span>

            <h2>
              Find something worth adding to your trip.
            </h2>
          </div>

          <button
            type="button"
            className="tl-events-mobile-filter-button"
            onClick={() =>
              setFiltersOpen(
                (
                  current
                ) =>
                  !current
              )
            }
          >
            <SlidersHorizontal
              size={16}
            />

            Filters

            {activeFilterCount >
            0 ? (
              <b>
                {
                  activeFilterCount
                }
              </b>
            ) : null}
          </button>
        </div>


        <div className="tl-events-layout">
          <aside
            className={
              filtersOpen
                ? "tl-events-filters is-open"
                : "tl-events-filters"
            }
          >
            <div className="tl-events-filter-panel">
              <div className="tl-events-filter-header">
                <div>
                  <span>
                    FILTERS
                  </span>

                  <h3>
                    Refine events
                  </h3>
                </div>

                <button
                  type="button"
                  className="tl-events-filter-close"
                  onClick={() =>
                    setFiltersOpen(
                      false
                    )
                  }
                  aria-label="Close filters"
                >
                  ×
                </button>
              </div>


              <div className="tl-events-filter-group">
                <span className="tl-events-filter-label">
                  Event type
                </span>

                <div className="tl-events-category-list">
                  {eventCategories.map(
                    (item) => (
                      <button
                        type="button"
                        key={
                          item
                        }
                        className={
                          category ===
                          item
                            ? "is-active"
                            : ""
                        }
                        onClick={() =>
                          updateFilter(
                            "category",
                            item
                          )
                        }
                      >
                        <span>
                          {
                            item
                          }
                        </span>

                        <small>
                          {categoryCounts[
                            item
                          ] ||
                            0}
                        </small>
                      </button>
                    )
                  )}
                </div>
              </div>


              <div className="tl-events-filter-divider" />


              <label className="tl-events-select-field">
                <span>
                  Destination
                </span>

                <select
                  value={
                    city
                  }
                  onChange={(
                    event
                  ) =>
                    updateFilter(
                      "city",
                      event.target
                        .value
                    )
                  }
                >
                  {cityOptions.map(
                    (item) => (
                      <option
                        key={
                          item
                        }
                        value={
                          item
                        }
                      >
                        {
                          item
                        }
                      </option>
                    )
                  )}
                </select>
              </label>


              <label className="tl-events-select-field">
                <span>
                  Month
                </span>

                <select
                  value={
                    month
                  }
                  onChange={(
                    event
                  ) =>
                    updateFilter(
                      "month",
                      event.target
                        .value
                    )
                  }
                >
                  {eventMonths.map(
                    (item) => (
                      <option
                        key={
                          item
                        }
                        value={
                          item
                        }
                      >
                        {
                          item
                        }
                      </option>
                    )
                  )}
                </select>
              </label>


              <label className="tl-events-select-field">
                <span>
                  Price
                </span>

                <select
                  value={
                    price
                  }
                  onChange={(
                    event
                  ) =>
                    updateFilter(
                      "price",
                      event.target
                        .value
                    )
                  }
                >
                  {eventPriceFilters.map(
                    (item) => (
                      <option
                        key={
                          item
                        }
                        value={
                          item
                        }
                      >
                        {
                          item
                        }
                      </option>
                    )
                  )}
                </select>
              </label>


              <div className="tl-events-filter-divider" />


              <div className="tl-events-quick-filters">
                <button
                  type="button"
                  className={
                    featuredOnly
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    updateFilter(
                      "featuredOnly",
                      !featuredOnly
                    )
                  }
                >
                  <Sparkles
                    size={14}
                  />

                  Featured

                  {featuredOnly ? (
                    <Check
                      size={14}
                    />
                  ) : null}
                </button>

                <button
                  type="button"
                  className={
                    guideOnly
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    updateFilter(
                      "guideOnly",
                      !guideOnly
                    )
                  }
                >
                  <Compass
                    size={14}
                  />

                  Guide picks

                  {guideOnly ? (
                    <Check
                      size={14}
                    />
                  ) : null}
                </button>
              </div>


              {activeFilterCount >
                0 ||
              search.trim() ||
              sort !==
                "Recommended" ? (
                <button
                  type="button"
                  className="tl-events-clear-filters"
                  onClick={
                    clearFilters
                  }
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </aside>


          <section className="tl-events-results">
            <div className="tl-events-toolbar">
              <div>
                <strong>
                  {
                    filteredEvents.length
                  }
                </strong>

                <span>
                  {filteredEvents.length ===
                  1
                    ? "event"
                    : "events"}
                </span>
              </div>

              <label>
                <span>
                  Sort by
                </span>

                <select
                  value={
                    sort
                  }
                  onChange={(
                    event
                  ) =>
                    updateFilter(
                      "sort",
                      event.target
                        .value
                    )
                  }
                >
                  <option>
                    Recommended
                  </option>

                  <option>
                    Month order
                  </option>

                  <option>
                    Lowest price
                  </option>

                  <option>
                    Highest price
                  </option>

                  <option>
                    Name A-Z
                  </option>
                </select>
              </label>
            </div>


            {error ? (
              <div className="tl-events-state tl-events-error">
                <strong>
                  Could not load events
                </strong>

                <span>
                  {error}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setRetry(
                      (
                        current
                      ) =>
                        current +
                        1
                    )
                  }
                >
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="tl-event-grid">
                {Array.from({
                  length: 6,
                }).map(
                  (
                    _,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="tl-event-skeleton"
                    />
                  )
                )}
              </div>
            ) : filteredEvents.length ? (
              <div className="tl-event-grid">
                {filteredEvents.map(
                  (event) => (
                    <EventCard
                      key={getEventKey(
                        event
                      )}
                      event={
                        event
                      }
                      saved={isEventSaved(
                        event
                      )}
                      onToggleSave={
                        handleToggleEventTrip
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div className="tl-events-state">
                <CalendarDays
                  size={28}
                />

                <strong>
                  No matching events
                </strong>

                <span>
                  Try another search or filter.
                </span>

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                >
                  Show all events
                </button>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}