import { exploreReturn } from "../utils/exploreReturn";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Compass,
  ExternalLink,
  Heart,
  Lightbulb,
  MapPin,
  Navigation,
  Sparkles,
  Ticket,
  WalletCards,
} from "lucide-react";

import ContentImage from "../components/ContentImage";

import {
  assetUrl,
  formatLkr,
  getExplorePlace,
  getTouristEventsByPlace,
} from "../services/exploreService";

import { normaliseEvent } from "../data/eventData";

import {
  getTripItemCategoryKey,
  getTripItemSourceId,
  readTripItems,
  SAVED_TRIP_EVENT,
  toggleTripItem,
} from "../utils/tripBasket";

import "../styles/placeDetailsPage.css";

const getEventImage = (event) =>
  event?.imageUrl ||
  event?.image_url ||
  event?.image ||
  "";

const getPlaceImage = (place) =>
  place?.image ||
  place?.imageUrl ||
  place?.image_url ||
  place?.images?.[0] ||
  "";

const hasText = (value) =>
  String(value || "").trim().length > 0;

const toCoordinateNumber = (value) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
};

const hasMapCoordinates = (place) =>
  toCoordinateNumber(place?.lat) !== null &&
  toCoordinateNumber(place?.lng) !== null;

const getOpenStreetMapEmbedUrl = (lat, lng) => {
  const latitude =
    toCoordinateNumber(lat);

  const longitude =
    toCoordinateNumber(lng);

  if (
    latitude === null ||
    longitude === null
  ) {
    return "";
  }

  const zoomSize = 0.018;

  const left =
    longitude - zoomSize;

  const right =
    longitude + zoomSize;

  const bottom =
    latitude - zoomSize;

  const top =
    latitude + zoomSize;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
};

const getDirectionsUrl = (lat, lng) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lat},${lng}`
  )}`;

const getGalleryImages = (place) => {
  const rawImages = [
    getPlaceImage(place),
    ...(Array.isArray(place?.images)
      ? place.images
      : []),
  ].filter(Boolean);

  return [
    ...new Set(rawImages),
  ];
};

export default function PlaceDetailsPage() {
  const { id } = useParams();

  const location =
    useLocation();

  const thingsToDoRef =
    useRef(null);

  const focusedEventSlug =
    new URLSearchParams(
      location.search
    ).get("focusEvent");

  const [
    place,
    setPlace,
  ] = useState(null);

  const [
    events,
    setEvents,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    eventsLoading,
    setEventsLoading,
  ] = useState(true);

  const [
    eventsError,
    setEventsError,
  ] = useState("");

  const [
    eventsRetry,
    setEventsRetry,
  ] = useState(0);

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");

  const [
    mainImage,
    setMainImage,
  ] = useState("");

  const [
    savedTripItems,
    setSavedTripItems,
  ] = useState(
    readTripItems
  );

  useEffect(() => {
    const loadPlace =
      async () => {
        try {
          setLoading(true);

          setError("");

          const data =
            await getExplorePlace(
              id
            );

          setPlace(data);

          setMainImage(
            getPlaceImage(data)
          );
        } catch (err) {
          setError(
            err.response?.data
              ?.message ||
              "Place not found"
          );
        } finally {
          setLoading(false);
        }
      };

    loadPlace();
  }, [id]);

  useEffect(() => {
    let active = true;

    setEventsLoading(true);

    setEventsError("");

    setEvents([]);

    getTouristEventsByPlace(id)
      .then((rows) => {
        if (active) {
          setEvents(
            (rows || []).map(
              normaliseEvent
            )
          );
        }
      })
      .catch(() => {
        if (active) {
          setEventsError(
            "Events could not be loaded."
          );
        }
      })
      .finally(() => {
        if (active) {
          setEventsLoading(
            false
          );
        }
      });

    return () => {
      active = false;
    };
  }, [
    id,
    eventsRetry,
  ]);

  const sortedEvents =
    useMemo(() => {
      const mapped =
        events.map(
          normaliseEvent
        );

      if (!focusedEventSlug) {
        return mapped;
      }

      return [
        ...mapped,
      ].sort(
        (a, b) => {
          if (
            a.slug ===
            focusedEventSlug
          ) {
            return -1;
          }

          if (
            b.slug ===
            focusedEventSlug
          ) {
            return 1;
          }

          return 0;
        }
      );
    }, [
      events,
      focusedEventSlug,
    ]);

  useEffect(() => {
    if (
      focusedEventSlug &&
      !eventsLoading &&
      thingsToDoRef.current
    ) {
      window.setTimeout(
        () => {
          thingsToDoRef.current?.scrollIntoView(
            {
              behavior:
                "smooth",
              block: "start",
            }
          );
        },
        150
      );
    }
  }, [
    eventsLoading,
    focusedEventSlug,
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
  }, [notice]);

  const galleryImages =
    useMemo(
      () =>
        getGalleryImages(
          place
        ),
      [place]
    );

  const isPlaceSaved =
    useMemo(() => {
      if (!place) {
        return false;
      }

      return savedTripItems.some(
        (item) =>
          getTripItemCategoryKey(
            item
          ) ===
            "destinations" &&
          String(
            getTripItemSourceId(
              item
            )
          ) ===
            String(place.id)
      );
    }, [
      savedTripItems,
      place,
    ]);

  const handleToggleSaveTrip =
    () => {
      if (!place) {
        return;
      }

      const tripItem = {
        ...place,

        id:
          `place-${place.id}`,

        sourceId:
          place.id,

        tripItemType:
          "destination",

        image:
          assetUrl(
            getPlaceImage(
              place
            )
          ),

        link:
          `/explore/${place.id}`,
      };

      const result =
        toggleTripItem(
          tripItem
        );

      setSavedTripItems(
        result.items
      );

      setNotice(
        result.saved
          ? `${place.name} saved to your trip.`
          : `${place.name} removed from your trip.`
      );
    };

  if (loading) {
    return (
      <main className="place-detail-page">
        <div className="place-detail-state">
          <span className="place-detail-loading-dot" />

          <strong>
            Loading place details
          </strong>
        </div>
      </main>
    );
  }

  if (
    error ||
    !place
  ) {
    return (
      <main className="place-detail-page">
        <div className="place-detail-state place-detail-state-error">
          <Compass size={30} />

          <strong>
            {error ||
              "Place not found"}
          </strong>

          <Link to="/explore" state={exploreReturn.stateForDetail(location)}>
            Back to Explore
          </Link>
        </div>
      </main>
    );
  }

  const placeHasMap =
    hasMapCoordinates(
      place
    );

  const hasCost =
    Number(
      place.estimatedCost ||
        0
    ) > 0;

  const tags =
    Array.isArray(place.tags)
      ? place.tags
      : [];

  const highlights =
    Array.isArray(
      place.highlights
    )
      ? place.highlights
      : [];

  const experiences =
    Array.isArray(
      place.experiences
    )
      ? place.experiences
      : [];

  const nearbyPlaces =
    Array.isArray(
      place.nearbyPlaces
    )
      ? place.nearbyPlaces
      : [];

  const tips =
    Array.isArray(
      place.tips
    )
      ? place.tips
      : [];

  const facilities =
    Array.isArray(
      place.facilities
    )
      ? place.facilities
      : [];

  return (
    <main className="place-detail-page">
      {notice ? (
        <div className="place-detail-toast">
          {notice}
        </div>
      ) : null}

      <div className="place-detail-shell">
        <div className="place-detail-topbar">
          <Link
            to="/explore" state={exploreReturn.stateForDetail(location)}
            className="place-detail-back"
          >
            <ArrowLeft size={16} />
            Explore
          </Link>
        </div>

        <section className="place-detail-hero">
          <ContentImage
            src={assetUrl(
              mainImage
            )}
            alt={place.name}
            className="place-detail-hero-image"
          />

          <div className="place-detail-hero-overlay" />

          <button
            type="button"
            className={
              isPlaceSaved
                ? "place-detail-hero-save is-saved"
                : "place-detail-hero-save"
            }
            onClick={
              handleToggleSaveTrip
            }
            aria-label={
              isPlaceSaved
                ? "Remove from trip"
                : "Save to trip"
            }
          >
            <Heart
              size={18}
              fill={
                isPlaceSaved
                  ? "currentColor"
                  : "none"
              }
            />

            <span>
              {isPlaceSaved
                ? "Saved"
                : "Save"}
            </span>
          </button>

          <div className="place-detail-hero-content">
            <div className="place-detail-hero-badges">
              {place.categoryLabel ||
              place.category ? (
                <span>
                  {place.categoryIcon ? (
                    <>
                      {
                        place.categoryIcon
                      }{" "}
                    </>
                  ) : null}

                  {place.categoryLabel ||
                    place.category}
                </span>
              ) : null}

              {place.featured ? (
                <span className="place-detail-featured-badge">
                  <Sparkles
                    size={12}
                  />
                  Featured
                </span>
              ) : null}
            </div>

            <h1>
              {place.name}
            </h1>

            <div className="place-detail-location">
              <MapPin
                size={17}
              />

              <span>
                {[
                  place.city,
                  place.district !==
                  place.city
                    ? place.district
                    : null,
                  place.region,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>

            {hasText(
              place.shortDescription
            ) ? (
              <p>
                {
                  place.shortDescription
                }
              </p>
            ) : null}
          </div>
        </section>

        {galleryImages.length >
        1 ? (
          <section className="place-detail-gallery-strip">
            <div className="place-detail-gallery-heading">
              <Camera
                size={15}
              />

              <span>
                Photos
              </span>
            </div>

            <div className="place-detail-gallery-list">
              {galleryImages.map(
                (
                  image,
                  index
                ) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={
                      image ===
                      mainImage
                        ? "is-active"
                        : ""
                    }
                    onClick={() =>
                      setMainImage(
                        image
                      )
                    }
                  >
                    <ContentImage
                      src={assetUrl(
                        image
                      )}
                      alt={`${place.name} ${index + 1}`}
                    />
                  </button>
                )
              )}
            </div>
          </section>
        ) : null}

        <section className="place-detail-layout">
          <div className="place-detail-main">
            <section className="place-detail-card place-detail-overview-card">
              <div className="place-detail-section-heading">
                <span>
                  OVERVIEW
                </span>

                <h2>
                  About {place.name}
                </h2>
              </div>

              <p className="place-detail-description">
                {place.fullDescription ||
                  place.shortDescription}
              </p>

              {tags.length ? (
                <div className="place-detail-tags">
                  {tags.map(
                    (
                      tag,
                      index
                    ) => (
                      <span
                        key={`${tag}-${index}`}
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
              ) : null}
            </section>

            {highlights.length ? (
              <section className="place-detail-card">
                <div className="place-detail-section-heading">
                  <span>
                    HIGHLIGHTS
                  </span>

                  <h2>
                    What stands out
                  </h2>
                </div>

                <div className="place-detail-highlight-grid">
                  {highlights.map(
                    (
                      item,
                      index
                    ) => (
                      <article
                        key={`${item.title || "highlight"}-${index}`}
                      >
                        <div className="place-detail-highlight-icon">
                          {item.icon ||
                            "✨"}
                        </div>

                        <div>
                          <h3>
                            {item.title}
                          </h3>

                          {hasText(
                            item.description
                          ) ? (
                            <p>
                              {
                                item.description
                              }
                            </p>
                          ) : null}
                        </div>
                      </article>
                    )
                  )}
                </div>
              </section>
            ) : null}

            {experiences.length ? (
              <section
                className="place-detail-card"
                ref={
                  thingsToDoRef
                }
              >
                <div className="place-detail-section-heading">
                  <span>
                    EXPERIENCES
                  </span>

                  <h2>
                    Things to do
                  </h2>
                </div>

                <div className="place-detail-experience-grid">
                  {experiences.map(
                    (
                      item,
                      index
                    ) => (
                      <article
                        key={`${item.title || "experience"}-${index}`}
                      >
                        <Compass
                          size={18}
                        />

                        <div>
                          <h3>
                            {item.title}
                          </h3>

                          {hasText(
                            item.description
                          ) ? (
                            <p>
                              {
                                item.description
                              }
                            </p>
                          ) : null}

                          {(item.duration ||
                            item.time ||
                            item.cost !==
                              undefined) && (
                            <div className="place-detail-experience-meta">
                              {item.duration ||
                              item.time ? (
                                <span>
                                  <Clock3
                                    size={
                                      12
                                    }
                                  />
                                  {item.duration ||
                                    item.time}
                                </span>
                              ) : null}

                              {item.cost !==
                              undefined ? (
                                <span>
                                  <WalletCards
                                    size={
                                      12
                                    }
                                  />
                                  {formatLkr(
                                    item.cost
                                  )}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  )}
                </div>
              </section>
            ) : null}

            <section
              className="place-detail-card"
              id="things-to-do"
              ref={
                experiences.length
                  ? undefined
                  : thingsToDoRef
              }
            >
              <div className="place-detail-section-heading place-detail-heading-row">
                <div>
                  <span>
                    EVENTS
                  </span>

                  <h2>
                    Events nearby
                  </h2>
                </div>

                <Link
                  to={`/events?city=${encodeURIComponent(
                    place.city ||
                      ""
                  )}`}
                >
                  All events
                  <ArrowRight
                    size={14}
                  />
                </Link>
              </div>

              {eventsError ? (
                <div className="place-detail-event-state">
                  <strong>
                    {
                      eventsError
                    }
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      setEventsRetry(
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
              ) : eventsLoading ? (
                <div className="place-detail-event-state">
                  Loading events...
                </div>
              ) : sortedEvents.length ? (
                <div className="place-detail-event-grid">
                  {sortedEvents.map(
                    (event) => {
                      const isFocused =
                        event.slug ===
                        focusedEventSlug;

                      return (
                        <article
                          key={
                            event.slug
                          }
                          className={
                            isFocused
                              ? "place-detail-event-card is-focused"
                              : "place-detail-event-card"
                          }
                        >
                          <ContentImage
                            src={assetUrl(
                              getEventImage(
                                event
                              )
                            )}
                            alt={
                              event.title
                            }
                          />

                          <div className="place-detail-event-body">
                            <div className="place-detail-event-badges">
                              {event.category ? (
                                <span>
                                  {
                                    event.category
                                  }
                                </span>
                              ) : null}

                              {isFocused ? (
                                <strong>
                                  Selected
                                </strong>
                              ) : null}
                            </div>

                            <h3>
                              {
                                event.title
                              }
                            </h3>

                            {hasText(
                              event.shortDescription
                            ) ? (
                              <p>
                                {
                                  event.shortDescription
                                }
                              </p>
                            ) : null}

                            <div className="place-detail-event-meta">
                              {event.venue ? (
                                <span>
                                  <MapPin
                                    size={
                                      13
                                    }
                                  />
                                  {
                                    event.venue
                                  }
                                </span>
                              ) : null}

                              {event.dateLabel ||
                              event.timeLabel ? (
                                <span>
                                  <CalendarDays
                                    size={
                                      13
                                    }
                                  />

                                  {[
                                    event.dateLabel,
                                    event.timeLabel,
                                  ]
                                    .filter(
                                      Boolean
                                    )
                                    .join(
                                      " · "
                                    )}
                                </span>
                              ) : null}

                              {event.priceLabel ? (
                                <span>
                                  <WalletCards
                                    size={
                                      13
                                    }
                                  />
                                  {
                                    event.priceLabel
                                  }
                                </span>
                              ) : null}
                            </div>

                            <div className="place-detail-event-actions">
                              <Link
                                to={`/events/${event.slug}`}
                              >
                                View details
                              </Link>

                              {event.mapUrl ? (
                                <a
                                  href={
                                    event.mapUrl
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Directions
                                </a>
                              ) : null}

                              <Link
                                to={`/hotels?city=${encodeURIComponent(
                                  event.city ||
                                    place.city ||
                                    ""
                                )}`}
                              >
                                Hotels
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="place-detail-event-state">
                  <Compass
                    size={23}
                  />

                  <strong>
                    No connected events yet
                  </strong>

                  <Link to="/events">
                    Browse events
                  </Link>
                </div>
              )}
            </section>

            {placeHasMap ? (
              <section className="place-detail-card">
                <div className="place-detail-section-heading place-detail-heading-row">
                  <div>
                    <span>
                      LOCATION
                    </span>

                    <h2>
                      Map
                    </h2>
                  </div>

                  <a
                    href={getDirectionsUrl(
                      place.lat,
                      place.lng
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Directions
                    <ExternalLink
                      size={13}
                    />
                  </a>
                </div>

                <div className="place-detail-map">
                  <iframe
                    title={`${place.name} location map`}
                    src={getOpenStreetMapEmbedUrl(
                      place.lat,
                      place.lng
                    )}
                    loading="lazy"
                  />
                </div>
              </section>
            ) : null}

            {(nearbyPlaces.length ||
              tips.length) && (
              <section className="place-detail-split-section">
                {nearbyPlaces.length ? (
                  <div className="place-detail-card">
                    <div className="place-detail-section-heading">
                      <span>
                        NEARBY
                      </span>

                      <h2>
                        Nearby places
                      </h2>
                    </div>

                    <div className="place-detail-list">
                      {nearbyPlaces.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={`${item.name || "nearby"}-${index}`}
                          >
                            <MapPin
                              size={
                                15
                              }
                            />

                            <div>
                              <strong>
                                {
                                  item.name
                                }
                              </strong>

                              <span>
                                {[
                                  item.distance,
                                  item.type,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " · "
                                  )}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : null}

                {tips.length ? (
                  <div className="place-detail-card">
                    <div className="place-detail-section-heading">
                      <span>
                        GOOD TO KNOW
                      </span>

                      <h2>
                        Travel tips
                      </h2>
                    </div>

                    <div className="place-detail-list">
                      {tips.map(
                        (
                          tip,
                          index
                        ) => (
                          <div
                            key={`${tip}-${index}`}
                          >
                            <Lightbulb
                              size={
                                15
                              }
                            />

                            <div>
                              <p>
                                {tip}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : null}
              </section>
            )}

            {facilities.length ? (
              <section className="place-detail-card">
                <div className="place-detail-section-heading">
                  <span>
                    FACILITIES
                  </span>

                  <h2>
                    Available here
                  </h2>
                </div>

                <div className="place-detail-facilities">
                  {facilities.map(
                    (
                      item,
                      index
                    ) => (
                      <span
                        key={`${item}-${index}`}
                      >
                        <CheckCircle2
                          size={14}
                        />

                        {item}
                      </span>
                    )
                  )}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="place-detail-sidebar">
            <div className="place-detail-travel-card">
              <div className="place-detail-travel-heading">
                <span>
                  TRAVEL INFO
                </span>

                <h2>
                  Plan your visit
                </h2>
              </div>

              <div className="place-detail-travel-list">
                {hasText(
                  place.duration
                ) ? (
                  <div>
                    <span className="place-detail-info-icon">
                      <Clock3
                        size={16}
                      />
                    </span>

                    <div>
                      <small>
                        Duration
                      </small>

                      <strong>
                        {
                          place.duration
                        }
                      </strong>
                    </div>
                  </div>
                ) : null}

                {hasText(
                  place.bestTime
                ) ? (
                  <div>
                    <span className="place-detail-info-icon">
                      <CalendarDays
                        size={16}
                      />
                    </span>

                    <div>
                      <small>
                        Best time
                      </small>

                      <strong>
                        {
                          place.bestTime
                        }
                      </strong>
                    </div>
                  </div>
                ) : null}

                {hasCost ? (
                  <div>
                    <span className="place-detail-info-icon">
                      <WalletCards
                        size={16}
                      />
                    </span>

                    <div>
                      <small>
                        Estimated cost
                      </small>

                      <strong>
                        {formatLkr(
                          place.estimatedCost
                        )}
                      </strong>
                    </div>
                  </div>
                ) : null}

                {hasText(
                  place.budget
                ) ? (
                  <div>
                    <span className="place-detail-info-icon">
                      <WalletCards
                        size={16}
                      />
                    </span>

                    <div>
                      <small>
                        Budget
                      </small>

                      <strong>
                        {
                          place.budget
                        }
                      </strong>
                    </div>
                  </div>
                ) : null}

                {hasText(
                  place.openingHours
                ) ? (
                  <div>
                    <span className="place-detail-info-icon">
                      <Clock3
                        size={16}
                      />
                    </span>

                    <div>
                      <small>
                        Opening
                      </small>

                      <strong>
                        {
                          place.openingHours
                        }
                      </strong>
                    </div>
                  </div>
                ) : null}

                {hasText(
                  place.entryFee
                ) ? (
                  <div>
                    <span className="place-detail-info-icon">
                      <Ticket
                        size={16}
                      />
                    </span>

                    <div>
                      <small>
                        Entry
                      </small>

                      <strong>
                        {
                          place.entryFee
                        }
                      </strong>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="place-detail-primary-actions">
                <button
                  type="button"
                  className={
                    isPlaceSaved
                      ? "place-detail-save-button is-saved"
                      : "place-detail-save-button"
                  }
                  onClick={
                    handleToggleSaveTrip
                  }
                >
                  <Heart
                    size={16}
                    fill={
                      isPlaceSaved
                        ? "currentColor"
                        : "none"
                    }
                  />

                  {isPlaceSaved
                    ? "Saved to trip"
                    : "Save to trip"}
                </button>

                <Link
                  to={`/hotels?city=${encodeURIComponent(
                    place.city ||
                      ""
                  )}`}
                  className="place-detail-hotel-button"
                >
                  <Building2
                    size={16}
                  />

                  Find hotels
                </Link>
              </div>

              <div className="place-detail-secondary-actions">
                <Link
                  to={`/events?city=${encodeURIComponent(
                    place.city ||
                      ""
                  )}`}
                >
                  <CalendarDays
                    size={14}
                  />
                  Events
                </Link>

                {placeHasMap ? (
                  <a
                    href={getDirectionsUrl(
                      place.lat,
                      place.lng
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation
                      size={14}
                    />
                    Directions
                  </a>
                ) : null}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}