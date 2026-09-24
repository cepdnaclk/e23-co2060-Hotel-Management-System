import ContentImage from "../components/ContentImage";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  assetUrl,
  getHomePageData,
} from "../services/exploreService";


const EMPTY_HOME_DATA = {
  sections: {},
  quickActions: [],
  featuredPlaces: [],
  featuredHotels: [],
  upcomingEvents: [],
  featuredGuides: [],
};


const resolveMediaUrl = assetUrl;


const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });
};


const formatEventDate = (event) => {
  if (event?.dateLabel) {
    return event.dateLabel;
  }

  if (!event?.eventDate) {
    return "";
  }

  const date = new Date(event.eventDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};


function Media({
  src,
  alt,
  className = "",
}) {
  const [failedUrl, setFailedUrl] = useState(null);

  const resolved = resolveMediaUrl(src);

  if (!resolved || failedUrl === resolved) {
    return (
      <div
        className={`home-image-placeholder ${className}`}
        aria-label={alt || "TripLanka"}
      >
        <div className="home-placeholder-mark">
          <span>✦</span>

          <strong>
            {alt || "TripLanka"}
          </strong>
        </div>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt || ""}
      className={className}
      loading="lazy"
      onError={() => setFailedUrl(resolved)}
    />
  );
}


function SectionHeading({ section }) {
  if (!section) {
    return null;
  }

  return (
    <div className="home-section-heading">
      <div className="home-section-heading-copy">
        {section.eyebrow && (
          <span className="home-kicker">
            {section.eyebrow}
          </span>
        )}

        <h2>{section.title}</h2>

        {section.description && (
          <p>{section.description}</p>
        )}
      </div>

      {section.primaryAction && (
        <Link
          to={section.primaryAction.url}
          className="home-section-action"
          onClick={scrollToTop}
        >
          {section.primaryAction.label}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}


function HomePage() {
  const [home, setHome] =
    useState(EMPTY_HOME_DATA);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");


  const loadHome =
    useCallback(async () => {
      try {
        setLoading(true);
        setLoadError("");

        const data =
          await getHomePageData();

        setHome({
          ...EMPTY_HOME_DATA,
          ...data,

          sections:
            data?.sections || {},

          quickActions:
            data?.quickActions || [],

          featuredPlaces:
            data?.featuredPlaces || [],

          featuredHotels:
            data?.featuredHotels || [],

          upcomingEvents:
            data?.upcomingEvents || [],

          featuredGuides:
            data?.featuredGuides || [],
        });
      } catch (error) {
        console.error(
          "Load TripLanka home error:",
          error
        );

        setLoadError(
          error?.response?.data?.message ||
            "Home page could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadHome();
  }, [loadHome]);


  const {
    sections,
    quickActions,
    featuredPlaces,
    featuredHotels,
    upcomingEvents,
    featuredGuides,
  } = home;


  const hero =
    sections.hero;

  const placesSection =
    sections.featured_places;

  const hotelsSection =
    sections.featured_hotels;

  const plannerSection =
    sections.trip_planner;

  const eventsSection =
    sections.events;

  const guidesSection =
    sections.guides;

  const partnerSection =
    sections.partner;


  const hotelQuickAction =
    useMemo(
      () =>
        quickActions.find(
          (item) =>
            item.key === "hotels"
        ),
      [quickActions]
    );


  const heroMedia =
    resolveMediaUrl(
      hero?.media?.path
    );

  const heroPoster =
    resolveMediaUrl(
      hero?.media?.poster
    );

  const heroFallback =
    resolveMediaUrl(
      featuredPlaces[0]?.imageUrl
    );


  if (loading) {
    return (
      <main className="triplanka-home">
        <style>{homeCss}</style>

        <section className="home-state">
          <div className="home-loader" />

          <h1>
            Loading TripLanka
          </h1>

          <p>
            Preparing your journey.
          </p>
        </section>
      </main>
    );
  }


  if (loadError) {
    return (
      <main className="triplanka-home">
        <style>{homeCss}</style>

        <section className="home-state">
          <span className="home-error-icon">
            !
          </span>

          <h1>
            Home page unavailable
          </h1>

          <p>
            {loadError}
          </p>

          <button
            type="button"
            className="home-primary-button"
            onClick={loadHome}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }


  return (
    <main
      className="triplanka-home"
      id="top"
    >
      <style>{homeCss}</style>


      {/* HERO */}

      {hero && (
        <section
          className="home-cinematic-hero"
          aria-label="TripLanka introduction"
        >
          {hero.media?.type ===
            "video" && heroMedia ? (
            <video
              className="home-hero-background"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={
                heroPoster ||
                undefined
              }
              aria-hidden="true"
            >
              <source
                src={heroMedia}
                type="video/mp4"
              />
            </video>
          ) : heroMedia ? (
            <ContentImage className="home-hero-background"
              src={heroMedia}
              alt=""
              aria-hidden="true"
            />
          ) : heroFallback ? (
            <ContentImage className="home-hero-background"
              src={heroFallback}
              alt=""
              aria-hidden="true"
            />
          ) : (
            <div className="home-hero-background home-hero-fallback" />
          )}

          <div className="home-hero-overlay" />

          <div className="home-hero-center">
            {hero.eyebrow && (
              <span className="home-hero-kicker">
                {hero.eyebrow}
              </span>
            )}

            <h1>
              {hero.title}
            </h1>

            <div className="home-hero-accent" />

            {hero.description && (
              <p>
                {hero.description}
              </p>
            )}

            <div className="home-hero-actions">
              {hero.primaryAction && (
                <Link
                  to={
                    hero.primaryAction.url
                  }
                  className="home-hero-primary"
                  onClick={scrollToTop}
                >
                  {
                    hero.primaryAction.label
                  }
                </Link>
              )}

              {hero.secondaryAction && (
                <Link
                  to={
                    hero.secondaryAction.url
                  }
                  className="home-hero-secondary"
                  onClick={scrollToTop}
                >
                  {
                    hero.secondaryAction.label
                  }
                </Link>
              )}

              {hotelQuickAction && (
                <Link
                  to={
                    hotelQuickAction.targetUrl
                  }
                  className="home-hero-ghost"
                  onClick={scrollToTop}
                >
                  {
                    hotelQuickAction.buttonLabel
                  }
                </Link>
              )}
            </div>
          </div>

          <a
            href="#home-content"
            className="home-scroll-cue"
            aria-label="Explore TripLanka"
          >
            <span>
              Discover more
            </span>

            <b>↓</b>
          </a>
        </section>
      )}


      <div id="home-content" />


      {/* DESTINATIONS */}

      {placesSection && (
        <section className="home-width home-section home-first-section">
          <SectionHeading
            section={
              placesSection
            }
          />

          {featuredPlaces.length >
          0 ? (
            <div className="home-place-grid">
              {featuredPlaces.map(
                (
                  place,
                  index
                ) => (
                  <Link
                    key={place.id}
                    to={`/explore?place=${place.id}`}
                    className={`home-place-card ${
                      index === 0
                        ? "home-place-featured"
                        : ""
                    }`}
                    onClick={
                      scrollToTop
                    }
                  >
                    <Media
                      src={
                        place.imageUrl
                      }
                      alt={
                        place.name
                      }
                    />

                    <div className="home-card-overlay" />

                    <div className="home-place-content">
                      <span className="home-light-label">
                        {place.region ||
                          place.category ||
                          place.city}
                      </span>

                      <h3>
                        {
                          place.name
                        }
                      </h3>

                      <p>
                        {[
                          place.city,
                          place.district,
                        ]
                          .filter(
                            (
                              value,
                              indexValue,
                              array
                            ) =>
                              value &&
                              array.indexOf(
                                value
                              ) ===
                                indexValue
                          )
                          .join(
                            " • "
                          )}
                      </p>

                      <strong>
                        Explore

                        <b aria-hidden="true">
                          →
                        </b>
                      </strong>
                    </div>
                  </Link>
                )
              )}
            </div>
          ) : (
            <div className="home-empty">
              No destinations
              available.
            </div>
          )}
        </section>
      )}


      {/* TRIP PLANNER */}

      {plannerSection && (
        <section className="home-width home-planner-panel">
          <div className="home-planner-copy">
            {plannerSection.eyebrow && (
              <span className="home-kicker">
                {
                  plannerSection.eyebrow
                }
              </span>
            )}

            <h2>
              {
                plannerSection.title
              }
            </h2>

            {plannerSection.description && (
              <p>
                {
                  plannerSection.description
                }
              </p>
            )}

            {plannerSection.primaryAction && (
              <Link
                to={
                  plannerSection
                    .primaryAction.url
                }
                className="home-primary-button"
                onClick={scrollToTop}
              >
                {
                  plannerSection
                    .primaryAction.label
                }
              </Link>
            )}
          </div>

          <div className="home-planner-preview">
            <div className="home-preview-header">
              <span>
                SIMPLE PLANNING FLOW
              </span>

              <h3>
                From idea to itinerary
              </h3>
            </div>

            <div className="home-preview-steps">
              {quickActions.map(
                (
                  action,
                  index
                ) => (
                  <div
                    className="home-preview-step"
                    key={
                      action.id ||
                      action.key
                    }
                  >
                    <span className="home-preview-number">
                      {index + 1}
                    </span>

                    <div>
                      <strong>
                        {
                          action.title
                        }
                      </strong>

                      <small>
                        {
                          action.description
                        }
                      </small>
                    </div>
                  </div>
                )
              )}

              <div className="home-preview-step">
                <span className="home-preview-number">
                  {quickActions.length + 1}
                </span>

                <div>
                  <strong>
                    Save your plan
                  </strong>

                  <small>
                    Return to your
                    journey anytime.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}


      {/* HOTELS */}

      {hotelsSection && (
        <section className="home-soft-section">
          <div className="home-width">
            <SectionHeading
              section={
                hotelsSection
              }
            />

            {featuredHotels.length >
            0 ? (
              <div className="home-adaptive-grid">
                {featuredHotels.map(
                  (hotel) => (
                    <Link
                      key={
                        hotel.id
                      }
                      to={`/hotels/${hotel.id}`}
                      className="home-info-card"
                      onClick={scrollToTop}
                    >
                      <div className="home-info-media">
                        <Media
                          src={
                            hotel.imageUrl
                          }
                          alt={
                            hotel.name
                          }
                        />

                        {hotel.verified && (
                          <span className="home-card-badge">
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="home-info-body">
                        <span className="home-card-type">
                          {
                            hotel.propertyType
                          }
                        </span>

                        <h3>
                          {
                            hotel.name
                          }
                        </h3>

                        <p>
                          {[
                            hotel.city,
                            hotel.district,
                          ]
                            .filter(
                              (
                                value,
                                indexValue,
                                array
                              ) =>
                                value &&
                                array.indexOf(
                                  value
                                ) ===
                                  indexValue
                            )
                            .join(
                              " • "
                            )}
                        </p>

                        <strong className="home-card-action">
                          View stay

                          <b aria-hidden="true">
                            →
                          </b>
                        </strong>
                      </div>
                    </Link>
                  )
                )}
              </div>
            ) : (
              <div className="home-empty">
                No verified stays
                available.
              </div>
            )}
          </div>
        </section>
      )}


      {/* EVENTS */}

      {eventsSection && (
        <section className="home-width home-section">
          <SectionHeading
            section={
              eventsSection
            }
          />

          {upcomingEvents.length >
          0 ? (
            <div className="home-adaptive-grid">
              {upcomingEvents.map(
                (event) => {
                  const date =
                    formatEventDate(
                      event
                    );

                  return (
                    <Link
                      key={
                        event.id ||
                        event.slug
                      }
                      to={
                        event.slug
                          ? `/events/${encodeURIComponent(
                              event.slug
                            )}`
                          : "/events"
                      }
                      className="home-info-card"
                      onClick={scrollToTop}
                    >
                      <div className="home-info-media">
                        <Media
                          src={
                            event.imageUrl
                          }
                          alt={
                            event.title
                          }
                        />

                        {date && (
                          <span className="home-card-badge">
                            {date}
                          </span>
                        )}
                      </div>

                      <div className="home-info-body">
                        <span className="home-card-type">
                          {
                            event.category
                          }
                        </span>

                        <h3>
                          {
                            event.title
                          }
                        </h3>

                        <p>
                          {[
                            event.city,
                            event.venue,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " • "
                            )}
                        </p>

                        <div className="home-info-footer">
                          <span>
                            {
                              event.priceLabel
                            }
                          </span>

                          <strong>
                            View event

                            <b aria-hidden="true">
                              →
                            </b>
                          </strong>
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          ) : (
            <div className="home-empty">
              No upcoming events
              available.
            </div>
          )}
        </section>
      )}


      {/* GUIDES */}

      {guidesSection && (
        <section className="home-soft-section">
          <div className="home-width">
            <SectionHeading
              section={
                guidesSection
              }
            />

            {featuredGuides.length >
            0 ? (
              <div className="home-adaptive-grid">
                {featuredGuides.map(
                  (guide) => (
                    <Link
                      key={
                        guide.id
                      }
                      to={
                        guide.slug
                          ? `/tourist-guides/${guide.slug}`
                          : "/tourist-guides"
                      }
                      className="home-info-card"
                      onClick={scrollToTop}
                    >
                      <div className="home-info-media">
                        <Media
                          src={
                            guide.imageUrl
                          }
                          alt={
                            guide.name
                          }
                        />

                        {guide.promoted && (
                          <span className="home-card-badge home-featured-badge">
                            Featured
                          </span>
                        )}
                      </div>

                      <div className="home-info-body">
                        <span className="home-card-type">
                          {
                            guide.guideType
                          }
                        </span>

                        <h3>
                          {
                            guide.name
                          }
                        </h3>

                        <p>
                          {[
                            guide.city,
                            guide.experienceYears
                              ? `${guide.experienceYears} years`
                              : "",
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " • "
                            )}
                        </p>

                        {guide.languages
                          ?.length >
                          0 && (
                          <div className="home-language-row">
                            {guide.languages
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  language
                                ) => (
                                  <span
                                    key={
                                      language
                                    }
                                  >
                                    {
                                      language
                                    }
                                  </span>
                                )
                              )}
                          </div>
                        )}

                        <div className="home-info-footer">
                          <span>
                            ★{" "}
                            {Number(
                              guide.rating ||
                                0
                            ).toFixed(
                              1
                            )}
                          </span>

                          <strong>
                            View guide

                            <b aria-hidden="true">
                              →
                            </b>
                          </strong>
                        </div>
                      </div>
                    </Link>
                  )
                )}
              </div>
            ) : (
              <div className="home-empty">
                No approved guides
                available.
              </div>
            )}
          </div>
        </section>
      )}


      {/* PARTNER */}

      {partnerSection && (
        <section className="home-width home-partner-section">
          <div>
            {partnerSection.eyebrow && (
              <span className="home-kicker">
                {
                  partnerSection.eyebrow
                }
              </span>
            )}

            <h2>
              {
                partnerSection.title
              }
            </h2>
          </div>

          {partnerSection.primaryAction && (
            <Link
              to={
                partnerSection
                  .primaryAction.url
              }
              className="home-partner-button"
              onClick={scrollToTop}
            >
              {
                partnerSection
                  .primaryAction.label
              }

              <span aria-hidden="true">
                →
              </span>
            </Link>
          )}
        </section>
      )}
    </main>
  );
}


const homeCss = `
.triplanka-home {
  --home-teal: #087568;
  --home-teal-dark: #034943;
  --home-teal-deep: #063f3a;
  --home-gold: #e3ab2b;
  --home-gold-bright: #ffc22b;
  --home-text: #172724;
  --home-muted: #667572;
  --home-border: #dde8e5;

  min-height: 100vh;
  padding-bottom: 30px;

  background: #ffffff;

  color: var(--home-text);

  font-family:
    "Manrope",
    "Segoe UI",
    Arial,
    sans-serif;
}


.triplanka-home * {
  box-sizing: border-box;
}


.triplanka-home a {
  text-decoration: none;
}


.home-width {
  width:
    min(
      1460px,
      calc(100% - 84px)
    );

  margin-left: auto;
  margin-right: auto;
}


/* =========================================
   HERO
   ========================================= */

.home-cinematic-hero {
  position: relative;

  width: 100%;

  min-height:
    calc(100svh - 79px);

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;

  background: #063f3a;
}


.home-hero-background {
  position: absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  object-fit: cover;

  filter:
    saturate(1.03)
    contrast(1.04)
    brightness(0.9);
}


.home-hero-fallback {
  background:
    linear-gradient(
      135deg,
      #063f3a,
      #087568
    );
}


.home-hero-overlay {
  position: absolute;

  inset: 0;

  background:
    radial-gradient(
      circle at center,
      rgba(
        8,
        65,
        60,
        0.15
      ),
      rgba(
        3,
        30,
        28,
        0.36
      )
      55%,
      rgba(
        2,
        24,
        22,
        0.58
      )
    ),
    linear-gradient(
      180deg,
      rgba(
        0,
        0,
        0,
        0.09
      ),
      rgba(
        0,
        0,
        0,
        0.34
      )
    );
}


.home-hero-center {
  position: relative;

  z-index: 3;

  width:
    min(
      960px,
      calc(100% - 48px)
    );

  margin: 0 auto;

  padding:
    70px 20px 96px;

  display: flex;

  flex-direction: column;

  align-items: center;
  justify-content: center;

  text-align: center;
}


.home-hero-kicker {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  padding:
    8px 15px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.27
    );

  border-radius: 999px;

  background:
    rgba(
      255,
      255,
      255,
      0.1
    );

  backdrop-filter:
    blur(12px);

  color: #eafff9;

  font-size:
    11px !important;

  font-weight:
    650 !important;
}


.home-hero-center h1 {
  max-width: 900px;

  margin:
    22px auto 0;

  color: #ffffff;

  font-size:
    clamp(
      42px,
      5vw,
      68px
    ) !important;

  line-height:
    1.06 !important;

  font-weight:
    750 !important;

  letter-spacing:
    -0.015em !important;

  text-wrap: balance;

  text-shadow:
    0 18px 46px
    rgba(
      0,
      0,
      0,
      0.3
    );
}


.home-hero-accent {
  width: 64px;
  height: 4px;

  margin:
    22px auto 18px;

  border-radius: 999px;

  background:
    linear-gradient(
      90deg,
      #12a594,
      #ffc22b
    );
}


.home-hero-center > p {
  max-width: 650px;

  margin: 0 auto;

  color:
    rgba(
      244,
      255,
      252,
      0.88
    );

  font-size:
    clamp(
      15px,
      1.2vw,
      18px
    ) !important;

  line-height:
    1.65 !important;

  font-weight:
    500 !important;

  text-wrap: balance;
}


.home-hero-actions {
  display: flex;
  flex-wrap: wrap;

  align-items: center;
  justify-content: center;

  gap: 11px;

  margin-top: 28px;
}


.home-hero-actions a {
  min-height: 45px;

  display: inline-flex;

  align-items: center;
  justify-content: center;

  padding:
    0 20px;

  border-radius: 12px;

  font-size:
    13px !important;

  font-weight: 650;

  transition:
    transform 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}


.home-hero-actions a:hover {
  transform:
    translateY(-2px);
}


.home-hero-primary {
  color: #15312d;

  background: #ffc22b;

  box-shadow:
    0 13px 30px
    rgba(
      0,
      0,
      0,
      0.16
    );
}


.home-hero-primary:hover {
  background: #ffca42;
}


.home-hero-secondary {
  color: #075f56;

  background: #ffffff;

  box-shadow:
    0 12px 28px
    rgba(
      0,
      0,
      0,
      0.14
    );
}


.home-hero-ghost {
  color: #ffffff;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.3
    );

  background:
    rgba(
      255,
      255,
      255,
      0.1
    );

  backdrop-filter:
    blur(10px);
}


.home-scroll-cue {
  position: absolute;

  z-index: 4;

  left: 50%;
  bottom: 22px;

  transform:
    translateX(-50%);

  display: flex;

  align-items: center;

  gap: 8px;

  color:
    rgba(
      255,
      255,
      255,
      0.7
    );

  font-size: 10px;

  font-weight: 600;
}


.home-scroll-cue b {
  width: 27px;
  height: 27px;

  display: grid;

  place-items: center;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.22
    );

  border-radius: 50%;

  background:
    rgba(
      255,
      255,
      255,
      0.08
    );

  color: #ffffff;
}


/* =========================================
   SECTION HEADERS
   ========================================= */

.home-section {
  padding-top: 66px;
}


.home-first-section {
  padding-top: 78px;
}


.home-section-heading {
  display: flex;

  align-items: flex-end;
  justify-content:
    space-between;

  gap: 30px;

  margin-bottom: 26px;
}


.home-section-heading-copy {
  max-width: 760px;
}


.home-kicker {
  display: inline-flex;

  padding:
    7px 11px;

  border:
    1px solid
    rgba(
      8,
      117,
      104,
      0.15
    );

  border-radius: 999px;

  background: #edf8f5;

  color:
    var(--home-teal);

  font-size:
    11px !important;

  font-weight:
    500 !important;
}


.home-section-heading h2,
.home-partner-section h2 {
  margin:
    13px 0 8px;

  color: #152a27;

  font-size:
    clamp(
      28px,
      2.5vw,
      40px
    ) !important;

  line-height:
    1.1 !important;

  font-weight:
    700 !important;

  letter-spacing:
    -0.01em !important;
}


.home-section-heading p {
  max-width: 680px;

  margin: 0;

  color:
    var(--home-muted);

  font-size:
    13px !important;

  line-height:
    1.6 !important;

  font-weight:
    450 !important;
}


.home-section-action {
  min-height: 43px;

  flex: 0 0 auto;

  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 8px;

  padding:
    0 17px;

  border:
    1px solid
    rgba(
      8,
      117,
      104,
      0.22
    );

  border-radius: 12px;

  background: #ffffff;

  color:
    var(--home-teal);

  font-size: 12px;

  font-weight: 650;

  box-shadow:
    0 7px 18px
    rgba(
      15,
      23,
      42,
      0.035
    );

  transition:
    transform 180ms ease,
    background 180ms ease;
}


.home-section-action:hover {
  transform:
    translateY(-2px);

  background: #f2faf8;
}


/* =========================================
   DESTINATIONS
   ========================================= */

.home-place-grid {
  display: grid;

  grid-template-columns:
    repeat(
      3,
      minmax(
        0,
        1fr
      )
    );

  grid-auto-rows: 285px;

  gap: 17px;
}


.home-place-card {
  position: relative;

  min-width: 0;

  overflow: hidden;

  border-radius: 20px;

  background:
    var(--home-teal-deep);

  box-shadow:
    0 12px 30px
    rgba(
      15,
      23,
      42,
      0.08
    );

  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}


.home-place-card:hover {
  transform:
    translateY(-3px);

  box-shadow:
    0 18px 38px
    rgba(
      15,
      23,
      42,
      0.12
    );
}


.home-place-featured {
  grid-column:
    span 2;
}


.home-place-card > img,
.home-place-card >
.home-image-placeholder {
  position: absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  object-fit: cover;

  transition:
    transform 320ms ease;
}


.home-place-card:hover > img {
  transform:
    scale(1.035);
}


.home-card-overlay {
  position: absolute;

  inset: 0;

  background:
    linear-gradient(
      180deg,
      transparent
      18%,
      rgba(
        3,
        39,
        36,
        0.9
      )
    );
}


.home-place-content {
  position: absolute;

  z-index: 2;

  left: 20px;
  right: 20px;
  bottom: 18px;

  color: #ffffff;
}


.home-light-label {
  color: #ffe397;

  font-size:
    10px !important;

  font-weight: 600;
}


.home-place-content h3 {
  margin:
    6px 0 5px;

  color: #ffffff;

  font-size:
    20px !important;

  line-height:
    1.16 !important;

  font-weight:
    700 !important;
}


.home-place-featured
.home-place-content h3 {
  font-size:
    24px !important;
}


.home-place-content p {
  margin: 0;

  color:
    rgba(
      255,
      255,
      255,
      0.76
    );

  font-size:
    12px !important;

  font-weight:
    450 !important;
}


.home-place-content strong {
  display: inline-flex;

  align-items: center;

  gap: 7px;

  margin-top: 10px;

  color: #ffffff;

  font-size: 11px;

  font-weight: 650;
}


/* =========================================
   TRIP PLANNER HOME CTA
   ========================================= */

.home-planner-panel {
  position: relative;

  margin-top: 66px;

  padding: 0;

  display: grid;

  grid-template-columns:
    minmax(
      0,
      0.78fr
    )
    minmax(
      480px,
      1fr
    );

  gap: 0;

  align-items: stretch;

  overflow: hidden;

  border:
    1px solid
    rgba(
      8,
      117,
      104,
      0.28
    );

  border-radius: 26px;

  background: #ffffff;

  box-shadow:
    0 20px 48px
    rgba(
      6,
      63,
      58,
      0.12
    );
}


.home-planner-copy {
  position: relative;

  min-height: 470px;

  display: flex;

  flex-direction: column;

  justify-content: center;
  align-items: flex-start;

  padding:
    52px 48px;

  overflow: hidden;

  background:
    radial-gradient(
      circle at 15% 10%,
      rgba(
        255,
        194,
        43,
        0.2
      ),
      transparent
      230px
    ),
    linear-gradient(
      145deg,
      #075f56
      0%,
      #087568
      54%,
      #0b8f80
      100%
    );
}


.home-planner-copy::before {
  content: "";

  position: absolute;

  width: 290px;
  height: 290px;

  right: -120px;
  bottom: -130px;

  border-radius: 50%;

  border:
    58px solid
    rgba(
      255,
      255,
      255,
      0.055
    );
}


.home-planner-copy::after {
  content: "";

  position: absolute;

  width: 110px;
  height: 5px;

  left: 48px;
  bottom: 38px;

  border-radius: 999px;

  background:
    linear-gradient(
      90deg,
      #19b6a4,
      #ffc22b
    );
}


.home-planner-copy > * {
  position: relative;

  z-index: 2;
}


.home-planner-copy
.home-kicker {
  padding:
    8px 13px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.24
    );

  background:
    rgba(
      255,
      255,
      255,
      0.1
    );

  color: #eafff9;

  backdrop-filter:
    blur(8px);
}


.home-planner-copy h2 {
  max-width: 560px;

  margin:
    20px 0 12px;

  color: #ffffff;

  font-size:
    clamp(
      32px,
      3vw,
      46px
    ) !important;

  line-height:
    1.08 !important;

  font-weight:
    700 !important;

  letter-spacing:
    -0.015em !important;
}


.home-planner-copy p {
  max-width: 520px;

  margin: 0;

  color:
    rgba(
      240,
      255,
      251,
      0.82
    );

  font-size:
    14px !important;

  line-height:
    1.65 !important;

  font-weight:
    450 !important;
}


.home-primary-button {
  min-height: 48px;

  display: inline-flex;

  align-items: center;
  justify-content: center;

  margin-top: 28px;

  padding:
    0 22px;

  border: none;

  border-radius: 12px;

  background: #ffc22b;

  color: #123b35;

  font-size:
    13px !important;

  font-weight:
    650 !important;

  box-shadow:
    0 14px 28px
    rgba(
      0,
      0,
      0,
      0.16
    );

  transition:
    transform 180ms ease,
    background 180ms ease;
}


.home-primary-button:hover {
  transform:
    translateY(-2px);

  background: #ffcc48;
}


.home-planner-preview {
  min-height: 470px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  padding:
    38px;

  background:
    linear-gradient(
      145deg,
      #f4fbf9,
      #ffffff
      58%,
      #fff9e9
    );
}


.home-preview-header {
  padding-bottom: 17px;

  border-bottom:
    1px solid
    rgba(
      8,
      117,
      104,
      0.13
    );
}


.home-preview-header span {
  color:
    var(--home-teal);

  font-size:
    10px !important;

  font-weight:
    650 !important;
}


.home-preview-header h3 {
  margin:
    6px 0 0;

  color: #172724;

  font-size:
    21px !important;

  line-height:
    1.2 !important;

  font-weight:
    700 !important;
}


.home-preview-steps {
  display: grid;

  gap: 10px;

  margin-top: 18px;
}


.home-preview-step {
  min-height: 64px;

  display: grid;

  grid-template-columns:
    42px
    minmax(
      0,
      1fr
    );

  gap: 12px;

  align-items: center;

  padding:
    11px 13px;

  border:
    1px solid
    rgba(
      8,
      117,
      104,
      0.12
    );

  border-radius: 14px;

  background:
    rgba(
      255,
      255,
      255,
      0.88
    );

  box-shadow:
    0 6px 14px
    rgba(
      15,
      23,
      42,
      0.035
    );
}


.home-preview-number {
  width: 38px;
  height: 38px;

  display: grid;

  place-items: center;

  border-radius: 11px;

  background:
    linear-gradient(
      145deg,
      #087568,
      #0b8f80
    );

  color: #ffffff;

  font-size:
    12px !important;

  font-weight:
    700 !important;
}


.home-preview-step strong,
.home-preview-step small {
  display: block;
}


.home-preview-step strong {
  color: #243a36;

  font-size:
    13px !important;

  line-height:
    1.3;

  font-weight:
    650 !important;
}


.home-preview-step small {
  margin-top: 3px;

  color: #74837f;

  font-size:
    11px !important;

  line-height:
    1.4;

  font-weight:
    450 !important;
}


/* =========================================
   HOTEL / EVENT / GUIDE SECTIONS
   ========================================= */

.home-soft-section {
  margin-top: 66px;

  padding:
    58px 0;

  border-top:
    1px solid
    #edf1ef;

  border-bottom:
    1px solid
    #edf1ef;

  background:
    linear-gradient(
      135deg,
      #f8faf9,
      #fffdf8
    );
}


.home-adaptive-grid {
  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(
        280px,
        1fr
      )
    );

  gap: 18px;
}


.home-info-card {
  min-width: 0;

  overflow: hidden;

  border:
    1px solid
    var(--home-border);

  border-radius: 19px;

  background: #ffffff;

  color:
    var(--home-text);

  box-shadow:
    0 10px 28px
    rgba(
      15,
      23,
      42,
      0.05
    );

  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}


.home-info-card:hover {
  transform:
    translateY(-3px);

  box-shadow:
    0 18px 38px
    rgba(
      15,
      23,
      42,
      0.09
    );
}


.home-info-media {
  position: relative;

  height: 205px;

  overflow: hidden;

  background: #eef6f4;
}


.home-info-media img,
.home-info-media
.home-image-placeholder {
  width: 100%;
  height: 100%;

  object-fit: cover;

  transition:
    transform 320ms ease;
}


.home-info-card:hover
.home-info-media img {
  transform:
    scale(1.035);
}


.home-image-placeholder {
  display: grid;

  place-items: center;

  background:
    linear-gradient(
      135deg,
      #e9f7f4,
      #fff4d5
    );
}


.home-placeholder-mark {
  display: grid;

  justify-items: center;

  gap: 7px;

  color:
    var(--home-teal);
}


.home-placeholder-mark span {
  font-size: 24px;
}


.home-placeholder-mark strong {
  max-width: 220px;

  text-align: center;

  font-size: 12px;

  font-weight: 650;
}


.home-card-badge {
  position: absolute;

  top: 13px;
  left: 13px;

  padding:
    7px 10px;

  border-radius: 999px;

  background:
    rgba(
      255,
      255,
      255,
      0.93
    );

  color:
    var(--home-teal-dark);

  font-size: 10px;

  font-weight: 650;
}


.home-featured-badge {
  background: #ffe69a;

  color: #654800;
}


.home-info-body {
  padding: 18px;
}


.home-card-type {
  color:
    var(--home-teal);

  font-size: 10px;

  font-weight: 650;
}


.home-info-body h3 {
  margin:
    6px 0 6px;

  color: #172724;

  font-size:
    18px !important;

  line-height:
    1.23 !important;

  font-weight:
    700 !important;
}


.home-info-body > p {
  margin: 0;

  color:
    var(--home-muted);

  font-size:
    12px !important;

  line-height:
    1.45 !important;

  font-weight:
    450 !important;
}


.home-card-action {
  display: inline-flex;

  align-items: center;

  gap: 7px;

  margin-top: 15px;

  color:
    var(--home-teal);

  font-size: 11px;

  font-weight: 650;
}


.home-info-footer {
  display: flex;

  align-items: center;
  justify-content:
    space-between;

  gap: 12px;

  margin-top: 15px;

  padding-top: 13px;

  border-top:
    1px solid
    #edf1ef;
}


.home-info-footer span {
  color: #60706d;

  font-size: 11px;
}


.home-info-footer strong {
  display: inline-flex;

  gap: 7px;

  color:
    var(--home-teal);

  font-size: 11px;

  font-weight: 650;
}


.home-language-row {
  display: flex;

  flex-wrap: wrap;

  gap: 6px;

  margin-top: 11px;
}


.home-language-row span {
  padding:
    5px 8px;

  border-radius: 999px;

  background: #eef8f6;

  color:
    var(--home-teal);

  font-size: 10px;

  font-weight: 500;
}


/* =========================================
   PARTNER CTA
   ========================================= */

.home-partner-section {
  margin-top: 24px;

  padding:
    30px 34px;

  display: flex;

  align-items: center;
  justify-content:
    space-between;

  gap: 28px;

  border:
    1px solid
    rgba(
      227,
      171,
      43,
      0.24
    );

  border-radius: 20px;

  background:
    linear-gradient(
      110deg,
      #fff8dc,
      #ffffff,
      #eef9f6
    );
}


.home-partner-section h2 {
  max-width: 850px;

  margin-bottom: 0;
}


.home-partner-button {
  min-height: 46px;

  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 9px;

  flex: 0 0 auto;

  padding:
    0 20px;

  border-radius: 11px;

  background:
    var(--home-gold-bright);

  color: #3f3000;

  font-size: 12px;

  font-weight: 650;

  transition:
    transform 180ms ease;
}


.home-partner-button:hover {
  transform:
    translateY(-2px);
}


/* =========================================
   STATES
   ========================================= */

.home-empty {
  min-height: 125px;

  display: grid;

  place-items: center;

  padding: 24px;

  border:
    1px dashed
    rgba(
      8,
      117,
      104,
      0.22
    );

  border-radius: 16px;

  background: #fbfdfc;

  color:
    var(--home-muted);

  font-size: 12px;
}


.home-state {
  width:
    min(
      680px,
      calc(
        100% - 36px
      )
    );

  min-height: 420px;

  margin:
    70px auto;

  display: flex;

  flex-direction: column;

  align-items: center;
  justify-content: center;

  text-align: center;
}


.home-loader {
  width: 44px;
  height: 44px;

  border:
    4px solid
    rgba(
      8,
      117,
      104,
      0.12
    );

  border-top-color:
    var(--home-teal);

  border-radius: 50%;

  animation:
    homeSpin
    0.8s
    linear
    infinite;
}


.home-error-icon {
  width: 46px;
  height: 46px;

  display: grid;

  place-items: center;

  border-radius: 50%;

  background: #fff3cd;
}


@keyframes homeSpin {
  to {
    transform:
      rotate(
        360deg
      );
  }
}


/* =========================================
   TABLET
   ========================================= */

@media (
  max-width: 920px
) {

  .home-width {
    width:
      calc(
        100% - 30px
      );
  }

  .home-hero-center {
    width:
      min(
        820px,
        calc(
          100% - 34px
        )
      );
  }

  .home-hero-center h1 {
    font-size:
      clamp(
        40px,
        7vw,
        58px
      ) !important;
  }

  .home-section-heading {
    align-items:
      flex-start;
  }

  .home-place-grid {
    grid-template-columns:
      1fr 1fr;
  }

  .home-place-featured {
    grid-column:
      span 2;
  }

  .home-planner-panel {
    grid-template-columns:
      1fr;
  }

  .home-planner-copy {
    min-height: 360px;

    padding:
      42px 36px;
  }

  .home-planner-copy::after {
    left: 36px;

    bottom: 30px;
  }

  .home-planner-preview {
    min-height: auto;

    padding:
      34px 36px;
  }
}


/* =========================================
   MOBILE
   ========================================= */

@media (
  max-width: 650px
) {

  .home-width {
    width:
      calc(
        100% - 22px
      );
  }

  .home-cinematic-hero {
    min-height:
      calc(
        100svh - 66px
      );
  }

  .home-hero-center {
    width:
      calc(
        100% - 24px
      );

    padding:
      46px 12px 64px;
  }

  .home-hero-center h1 {
    font-size:
      clamp(
        36px,
        11vw,
        50px
      ) !important;
  }

  .home-hero-center > p {
    font-size:
      14px !important;
  }

  .home-hero-actions {
    width: 100%;
  }

  .home-hero-actions a {
    width: 100%;
  }

  .home-scroll-cue {
    display: none;
  }

  .home-first-section {
    padding-top: 52px;
  }

  .home-section {
    padding-top: 52px;
  }

  .home-section-heading {
    flex-direction:
      column;

    align-items:
      stretch;

    gap: 17px;
  }

  .home-section-action {
    width: 100%;
  }

  .home-place-grid {
    grid-template-columns:
      1fr;

    grid-auto-rows:
      320px;
  }

  .home-place-featured {
    grid-column: auto;
  }

  .home-place-featured
  .home-place-content h3 {
    font-size:
      20px !important;
  }

  .home-planner-panel {
    margin-top: 52px;

    border-radius: 21px;
  }

  .home-planner-copy {
    min-height: 340px;

    padding:
      34px 22px;
  }

  .home-planner-copy h2 {
    font-size:
      32px !important;
  }

  .home-planner-copy p {
    font-size:
      13px !important;
  }

  .home-primary-button {
    width: 100%;
  }

  .home-planner-copy::after {
    left: 22px;

    bottom: 24px;
  }

  .home-planner-preview {
    padding:
      28px 20px;
  }

  .home-preview-step {
    grid-template-columns:
      39px
      minmax(
        0,
        1fr
      );
  }

  .home-soft-section {
    margin-top: 52px;

    padding:
      46px 0;
  }

  .home-adaptive-grid {
    grid-template-columns:
      1fr;
  }

  .home-info-media {
    height: 220px;
  }

  .home-info-footer {
    align-items:
      flex-start;

    flex-direction:
      column;
  }

  .home-partner-section {
    margin-top: 18px;

    padding:
      26px 20px;

    flex-direction:
      column;

    align-items:
      flex-start;
  }

  .home-partner-button {
    width: 100%;
  }
}
`;


export default HomePage;