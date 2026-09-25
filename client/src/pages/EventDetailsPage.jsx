import ContentImage from "../components/ContentImage";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Compass,
  ExternalLink,
  Heart,
  Hotel,
  MapPin,
  Navigation,
  Sparkles,
  WalletCards,
} from "lucide-react";

import {
  buildEventDirectionsUrl,
  buildEventMapEmbedUrl,
  normaliseEvent,
} from "../data/eventData";

import {
  assetUrl,
  getTouristEvent,
  getTouristEvents,
} from "../services/exploreService";

import {
  getTripItemKey,
  readTripItems,
  SAVED_TRIP_EVENT,
  toggleTripItem,
} from "../utils/tripBasket";

import EventReportForm from "../components/EventReportForm";

import "../styles/eventDetails.css";


const getImage = (event) =>
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

    const numeric =
      Number(value);

    if (
      Number.isInteger(
        numeric
      ) &&
      numeric > 0
    ) {
      return numeric;
    }
  }

  const numericId =
    Number(
      event?.id
    );

  return Number.isInteger(
    numericId
  ) &&
    numericId > 0
    ? numericId
    : null;
};


const normaliseDatabaseEvent = (row) => {
  if (!row) {
    return null;
  }

  const databaseId =
    getNumericEventId(
      row
    );

  if (!databaseId) {
    return null;
  }

  const event =
    normaliseEvent(
      row
    );

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


const getDirectionsUrl =
  (event) =>
    event?.mapUrl ||
    event?.map_url ||
    buildEventDirectionsUrl(
      event
    );


const getMapEmbedUrl =
  (event) =>
    event?.mapEmbedUrl ||
    event?.map_embed_url ||
    buildEventMapEmbedUrl(
      event
    );


const buildEventTripItem =
  (event) => {
    const databaseId =
      getNumericEventId(
        event
      );

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
          getImage(
            event
          )
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
        `/events/${encodeURIComponent(
          event.slug
        )}`,

      eventDate:
        event.dateLabel ||
        "",

      eventMonth:
        event.monthName ||
        "",
    };
  };


function SimilarEventCard({
  event,
}) {
  return (
    <Link
      to={`/events/${encodeURIComponent(
        event.slug
      )}`}
      className="tl-event-detail-similar-card"
    >
      <ContentImage
        src={assetUrl(
          getImage(
            event
          )
        )}
        alt={
          event.title
        }
      />

      <div className="tl-event-detail-similar-body">
        <span>
          {event.category ||
            "Event"}
        </span>

        <strong>
          {
            event.title
          }
        </strong>

        <small>
          <MapPin
            size={12}
          />

          {[
            event.city,
            event.priceLabel,
          ]
            .filter(
              Boolean
            )
            .join(
              " · "
            )}
        </small>
      </div>

      <ArrowRight
        size={16}
      />
    </Link>
  );
}


export default function EventDetailsPage() {
  const { id } =
    useParams();

  const [
    events,
    setEvents,
  ] =
    useState([]);

  const [
    event,
    setEvent,
  ] =
    useState(null);

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


  useEffect(() => {
    let active =
      true;

    const loadEvent =
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          setEvent(
            null
          );

          const row =
            await getTouristEvent(
              id
            );

          if (!active) {
            return;
          }

          setEvent(
            normaliseDatabaseEvent(
              row
            ) ||
              normaliseEvent(
                row
              )
          );
        } catch (
          loadError
        ) {
          if (!active) {
            return;
          }

          setError(
            loadError?.response
              ?.status ===
              404
              ? "This event is no longer available."
              : "Could not load this event. Please try again."
          );
        } finally {
          if (active) {
            setLoading(
              false
            );
          }
        }
      };


    const loadSimilarEvents =
      async () => {
        try {
          const rows =
            await getTouristEvents();

          if (!active) {
            return;
          }

          setEvents(
            (
              Array.isArray(
                rows
              )
                ? rows
                : []
            )
              .map(
                normaliseEvent
              )
              .filter(
                Boolean
              )
          );
        } catch {
          if (active) {
            setEvents(
              []
            );
          }
        }
      };


    loadEvent();

    loadSimilarEvents();


    return () => {
      active =
        false;
    };
  }, [
    id,
    retry,
  ]);


  const similar =
    useMemo(() => {
      if (!event) {
        return [];
      }

      return events
        .filter(
          (item) =>
            item.slug !==
              event.slug &&
            (
              item.city ===
                event.city ||
              item.category ===
                event.category
            )
        )
        .slice(
          0,
          3
        );
    }, [
      event,
      events,
    ]);


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
  }, [
    notice,
  ]);


  const eventTripItem =
    useMemo(
      () =>
        event
          ? buildEventTripItem(
              event
            )
          : null,
      [event]
    );


  const isEventSaved =
    useMemo(() => {
      if (
        !eventTripItem
      ) {
        return false;
      }

      const targetKey =
        getTripItemKey(
          eventTripItem
        );

      return savedTripItems.some(
        (item) =>
          getTripItemKey(
            item
          ) ===
          targetKey
      );
    }, [
      savedTripItems,
      eventTripItem,
    ]);


  const handleToggleEventTrip =
    () => {
      if (
        !eventTripItem
      ) {
        setNotice(
          "This event is not available for trip planning yet."
        );

        return;
      }

      const result =
        toggleTripItem(
          eventTripItem
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


  if (
    loading ||
    error ||
    !event ||
    event.slug !== id
  ) {
    return (
      <main className="tl-event-detail-page">
        <section className="tl-event-detail-state">
          <CalendarDays
            size={34}
          />

          <h1>
            {loading
              ? "Loading event"
              : "Event unavailable"}
          </h1>

          <p
            role={
              error
                ? "alert"
                : "status"
            }
          >
            {error ||
              "Getting the latest event information."}
          </p>

          <div>
            {error ? (
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
            ) : null}

            <Link to="/events">
              Back to Events
            </Link>
          </div>
        </section>
      </main>
    );
  }


  const highlights =
    Array.isArray(
      event.highlights
    )
      ? event.highlights
      : [];


  const nearbyHotels =
    Array.isArray(
      event.nearHotels
    )
      ? event.nearHotels
      : [];


  return (
    <main className="tl-event-detail-page">
      {notice ? (
        <div className="tl-event-detail-toast">
          {notice}
        </div>
      ) : null}


      <section className="tl-event-detail-hero">
        <ContentImage
          src={assetUrl(
            getImage(
              event
            )
          )}
          alt={
            event.title
          }
        />

        <div className="tl-event-detail-hero-overlay" />

        <div className="tl-event-detail-hero-content">
          <Link
            to="/events"
            className="tl-event-detail-back"
          >
            <ArrowLeft
              size={15}
            />

            Events
          </Link>

          <span className="tl-event-detail-category">
            {
              event.category
            }
          </span>

          <h1>
            {
              event.title
            }
          </h1>

          <div className="tl-event-detail-hero-meta">
            <span>
              <MapPin
                size={15}
              />

              {[
                event.venue,
                event.city,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " · "
                )}
            </span>

            {event.dateLabel ? (
              <span>
                <CalendarDays
                  size={15}
                />

                {
                  event.dateLabel
                }
              </span>
            ) : null}

            {event.priceLabel ? (
              <span>
                <WalletCards
                  size={15}
                />

                {
                  event.priceLabel
                }
              </span>
            ) : null}
          </div>

          <div className="tl-event-detail-actions">
            <button
              type="button"
              className={
                isEventSaved
                  ? "tl-event-detail-save is-saved"
                  : "tl-event-detail-save"
              }
              onClick={
                handleToggleEventTrip
              }
            >
              <Heart
                size={16}
                fill={
                  isEventSaved
                    ? "currentColor"
                    : "none"
                }
              />

              {isEventSaved
                ? "Saved to trip"
                : "Save to trip"}
            </button>

            <a
              href={getDirectionsUrl(
                event
              )}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation
                size={16}
              />

              Directions
            </a>

            <Link
              to={`/hotels?city=${encodeURIComponent(
                event.city ||
                  ""
              )}`}
            >
              <Hotel
                size={16}
              />

              Nearby hotels
            </Link>
          </div>
        </div>
      </section>


      <section className="tl-event-detail-layout">
        <aside className="tl-event-detail-summary">
          <div className="tl-event-detail-summary-heading">
            <span>
              EVENT DETAILS
            </span>

            <h2>
              At a glance
            </h2>
          </div>

          <div className="tl-event-detail-summary-list">
            <div>
              <span>
                <MapPin
                  size={15}
                />
              </span>

              <div>
                <small>
                  City
                </small>

                <strong>
                  {event.city ||
                    "Sri Lanka"}
                </strong>
              </div>
            </div>

            <div>
              <span>
                <CalendarDays
                  size={15}
                />
              </span>

              <div>
                <small>
                  Month
                </small>

                <strong>
                  {event.monthName ||
                    "Check date"}
                </strong>
              </div>
            </div>

            <div>
              <span>
                <Clock3
                  size={15}
                />
              </span>

              <div>
                <small>
                  Time
                </small>

                <strong>
                  {event.timeLabel ||
                    "Check time"}
                </strong>
              </div>
            </div>

            <div>
              <span>
                <Compass
                  size={15}
                />
              </span>

              <div>
                <small>
                  Duration
                </small>

                <strong>
                  {event.duration ||
                    "Event"}
                </strong>
              </div>
            </div>

            <div>
              <span>
                <WalletCards
                  size={15}
                />
              </span>

              <div>
                <small>
                  Budget
                </small>

                <strong>
                  {event.priceType ||
                    "Check price"}
                </strong>
              </div>
            </div>
          </div>

          {event.guideRecommended ? (
            <div className="tl-event-detail-guide-pick">
              <Sparkles
                size={15}
              />

              Recommended with a guide
            </div>
          ) : null}
        </aside>


        <div className="tl-event-detail-main">
          <section className="tl-event-detail-card">
            <div className="tl-event-detail-section-heading">
              <span>
                ABOUT
              </span>

              <h2>
                About this event
              </h2>
            </div>

            <p className="tl-event-detail-description">
              {event.description ||
                event.shortDescription}
            </p>
          </section>


          {highlights.length ? (
            <section className="tl-event-detail-card">
              <div className="tl-event-detail-section-heading">
                <span>
                  HIGHLIGHTS
                </span>

                <h2>
                  What to expect
                </h2>
              </div>

              <div className="tl-event-detail-highlights">
                {highlights.map(
                  (item) => (
                    <div
                      key={
                        item
                      }
                    >
                      <span>
                        ✓
                      </span>

                      {
                        item
                      }
                    </div>
                  )
                )}
              </div>
            </section>
          ) : null}


          <section className="tl-event-detail-card tl-event-detail-location">
            <div className="tl-event-detail-location-header">
              <div className="tl-event-detail-section-heading">
                <span>
                  LOCATION
                </span>

                <h2>
                  Location & directions
                </h2>

                <p>
                  {[
                    event.venue,
                    event.city,
                    event.district,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " · "
                    )}
                </p>
              </div>

              <a
                href={getDirectionsUrl(
                  event
                )}
                target="_blank"
                rel="noreferrer"
              >
                Open map

                <ExternalLink
                  size={14}
                />
              </a>
            </div>

            <iframe
              title={`${event.title} map`}
              src={getMapEmbedUrl(
                event
              )}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </section>


          {nearbyHotels.length ? (
            <section className="tl-event-detail-card">
              <div className="tl-event-detail-section-heading">
                <span>
                  STAY NEARBY
                </span>

                <h2>
                  Nearby hotels
                </h2>
              </div>

              <div className="tl-event-detail-hotels">
                {nearbyHotels.map(
                  (hotel) => (
                    <Link
                      key={
                        hotel
                      }
                      to={`/hotels?city=${encodeURIComponent(
                        event.city
                      )}&search=${encodeURIComponent(
                        hotel
                      )}`}
                    >
                      <Hotel
                        size={15}
                      />

                      <span>
                        {
                          hotel
                        }
                      </span>

                      <ArrowRight
                        size={14}
                      />
                    </Link>
                  )
                )}
              </div>
            </section>
          ) : null}


          <div className="tl-event-detail-report">
            <EventReportForm
              key={
                event.event_id
              }
              event={
                event
              }
            />
          </div>


          {similar.length ? (
            <section className="tl-event-detail-card">
              <div className="tl-event-detail-section-heading">
                <span>
                  MORE EVENTS
                </span>

                <h2>
                  Similar events
                </h2>
              </div>

              <div className="tl-event-detail-similar-grid">
                {similar.map(
                  (item) => (
                    <SimilarEventCard
                      key={
                        item.slug
                      }
                      event={
                        item
                      }
                    />
                  )
                )}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}