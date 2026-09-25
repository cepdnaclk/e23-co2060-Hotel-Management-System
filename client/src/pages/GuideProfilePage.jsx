import ContentImage from "../components/ContentImage";

import { assetUrl } from "../utils/assetUrl";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Copy,
  Heart,
  Hotel,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Users,
  WalletCards,
} from "lucide-react";

import api from "../api/api";

import {
  readTripItems,
  SAVED_TRIP_EVENT,
  toggleTripItem,
} from "../utils/tripBasket";

import {
  useAuth,
} from "../context/AuthContext";

import "../styles/guideProfile.css";


const cleanArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed =
        JSON.parse(value);

      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed.filter(
          Boolean
        );
      }
    } catch {
      return value
        .split(",")
        .map((item) =>
          item.trim()
        )
        .filter(Boolean);
    }
  }

  return [];
};


const formatLkr = (amount) => {
  const value = Number(
    amount || 0
  );

  if (!value) {
    return "Ask price";
  }

  return `LKR ${value.toLocaleString(
    "en-LK"
  )}`;
};


const getGuideLocation = (
  guide
) =>
  [
    guide.city,
    guide.district,
  ]
    .filter(Boolean)
    .join(", ") ||
  guide.base_location ||
  "Sri Lanka";


export default function GuideProfilePage() {
  const { slug } =
    useParams();

  const navigate =
    useNavigate();

  const {
    isLoggedIn,
    user,
  } =
    useAuth();

  const [
    guide,
    setGuide,
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
    copied,
    setCopied,
  ] =
    useState(false);

  const [
    reviewSort,
    setReviewSort,
  ] =
    useState("recent");

  const [
    reviews,
    setReviews,
  ] =
    useState([]);

  const [
    bookingMessage,
    setBookingMessage,
  ] =
    useState("");

  const [
    bookingSending,
    setBookingSending,
  ] =
    useState(false);

  const [
    savedTripItems,
    setSavedTripItems,
  ] =
    useState(
      readTripItems
    );

  const [
    tripNotice,
    setTripNotice,
  ] =
    useState("");

  const [
    inquiry,
    setInquiry,
  ] =
    useState({
      date: "",
      guests: "2",
      interest:
        "Personalized tour",
      duration_type:
        "full_day",
      hours: "3",
      start_time:
        "09:00",
      pickup_location:
        "",
      message: "",
    });


  useEffect(() => {
    let active = true;

    const loadGuide =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await api.get(
              `/guides/${slug}`
            );

          if (active) {
            setGuide(
              response.data
                .guide || null
            );
          }
        } catch (err) {
          if (active) {
            setError(
              err.response?.data
                ?.message ||
                "Guide profile not found"
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    loadGuide();

    return () => {
      active = false;
    };
  }, [slug]);


  useEffect(() => {
    let active = true;

    const loadReviews =
      async () => {
        try {
          const response =
            await api.get(
              `/guides/${slug}/reviews`,
              {
                params: {
                  sort:
                    reviewSort,
                },
              }
            );

          if (active) {
            setReviews(
              response.data
                .reviews || []
            );
          }
        } catch {
          if (active) {
            setReviews([]);
          }
        }
      };

    loadReviews();

    return () => {
      active = false;
    };
  }, [
    slug,
    reviewSort,
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
    if (!tripNotice) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        () =>
          setTripNotice(""),
        2500
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [tripNotice]);


  const guideData =
    guide || {};


  const displayName =
    guideData.display_name ||
    guideData.full_name ||
    "Tourist guide";


  const image =
    assetUrl(
      guideData.image_url
    );


  const languages =
    useMemo(
      () =>
        cleanArray(
          guideData.languages
        ),
      [guideData.languages]
    );


  const services =
    useMemo(
      () =>
        cleanArray(
          guideData.services
        ),
      [guideData.services]
    );


  const specialities =
    useMemo(
      () =>
        cleanArray(
          guideData.specialities
        ),
      [
        guideData.specialities,
      ]
    );


  const ratingValue =
    Number(
      guideData.rating || 0
    );


  const reviewCount =
    Number(
      guideData.total_reviews ||
        reviews.length ||
        0
    );


  const whatsappHref =
    guideData.whatsapp_number
      ? `https://wa.me/${String(
          guideData.whatsapp_number
        ).replace(
          /[^0-9]/g,
          ""
        )}`
      : "";


  const emailSubject =
    encodeURIComponent(
      `Guide inquiry for ${displayName}`
    );


  const emailBody =
    encodeURIComponent(
      `Hi ${displayName},\n\nI would like to request a guide experience.\nDate: ${
        inquiry.date ||
        "Not selected"
      }\nGuests: ${
        inquiry.guests
      }\nInterest: ${
        inquiry.interest
      }\n\nThank you.`
    );


  const guideBookingAmount =
    inquiry.duration_type ===
    "hourly"
      ? Number(
          guideData.price_per_hour ||
            0
        ) *
        Number(
          inquiry.hours || 1
        )
      : Number(
          guideData.price_per_day ||
            0
        );


  const isGuideSaved =
    useMemo(
      () =>
        guideData.id
          ? savedTripItems.some(
              (item) =>
                String(
                  item.id
                ) ===
                `guide-${guideData.id}`
            )
          : false,
      [
        savedTripItems,
        guideData.id,
      ]
    );


  const handleToggleGuideTrip =
    () => {
      const price =
        Number(
          guideData.price_per_day ||
            guideData.price_per_hour ||
            0
        );

      const item = {
        id:
          `guide-${guideData.id}`,

        sourceId:
          guideData.id,

        partnerGuideId:
          guideData.id,

        tripItemType:
          "guide",

        name:
          displayName,

        city:
          guideData.city ||
          "",

        district:
          guideData.district ||
          "",

        region:
          guideData.guide_type ||
          "Guide",

        image,

        duration:
          "Guide support",

        bestTime:
          guideData.availability ||
          "By booking",

        budget:
          price >= 30000
            ? "High"
            : price >=
                15000
              ? "Medium"
              : "Low",

        estimatedCost:
          price,

        shortDescription:
          guideData.short_description ||
          guideData.bio ||
          "Selected tourist guide for this trip.",

        link:
          guideData.slug
            ? `/tourist-guides/${guideData.slug}`
            : "/tourist-guides",

        guideLanguages:
          languages,
      };

      const result =
        toggleTripItem(
          item
        );

      setSavedTripItems(
        result.items
      );

      setTripNotice(
        result.saved
          ? `${item.name} added to your trip basket.`
          : `${item.name} removed from your trip basket.`
      );
    };


  const shareProfile =
    async () => {
      const url =
        window.location.href;

      try {
        if (
          navigator.share
        ) {
          await navigator.share(
            {
              title:
                `${displayName} on TripLanka`,
              url,
            }
          );
        } else {
          await navigator.clipboard.writeText(
            url
          );

          setCopied(true);

          window.setTimeout(
            () =>
              setCopied(
                false
              ),
            1800
          );
        }
      } catch {
        setCopied(false);
      }
    };


  const submitGuideBooking =
    async () => {
      setBookingMessage(
        ""
      );

      if (
        !isLoggedIn ||
        user?.role !==
          "tourist"
      ) {
        navigate(
          `/login?next=${encodeURIComponent(
            window.location
              .pathname
          )}`
        );

        return;
      }

      if (!inquiry.date) {
        setBookingMessage(
          "Please select a booking date."
        );

        return;
      }

      try {
        setBookingSending(
          true
        );

        const response =
          await api.post(
            "/guide-bookings",
            {
              guide_id:
                guideData.id,

              booking_date:
                inquiry.date,

              start_time:
                inquiry.duration_type ===
                "hourly"
                  ? inquiry.start_time
                  : null,

              duration_type:
                inquiry.duration_type,

              hours:
                inquiry.duration_type ===
                "hourly"
                  ? Number(
                      inquiry.hours
                    )
                  : null,

              guests:
                Number(
                  inquiry.guests
                ),

              tour_type:
                inquiry.interest,

              pickup_location:
                inquiry.pickup_location,

              message:
                inquiry.message,
            }
          );

        setBookingMessage(
          `${
            response.data
              .message
          } Reference: ${
            response.data
              .booking
              ?.booking_reference ||
            "created"
          }`
        );
      } catch (err) {
        setBookingMessage(
          err.response?.data
            ?.message ||
            "Could not send guide booking request."
        );
      } finally {
        setBookingSending(
          false
        );
      }
    };


  if (loading) {
    return (
      <main className="tl-guide-profile-page">
        <section className="tl-guide-profile-state">
          Loading guide
          profile...
        </section>
      </main>
    );
  }


  if (
    error ||
    !guide
  ) {
    return (
      <main className="tl-guide-profile-page">
        <section className="tl-guide-profile-state">
          <h1>
            Guide profile
            unavailable
          </h1>

          <p>
            {error ||
              "This guide profile is not available right now."}
          </p>

          <Link to="/tourist-guides">
            Back to Guides
          </Link>
        </section>
      </main>
    );
  }


  return (
    <main className="tl-guide-profile-page">
      {tripNotice ? (
        <div className="tl-guide-profile-toast">
          {tripNotice}
        </div>
      ) : null}


      <section className="tl-guide-profile-hero">
        <div className="tl-guide-profile-hero-inner">
          <div className="tl-guide-profile-photo">
            {image ? (
              <ContentImage
                src={image}
                alt={displayName}
              />
            ) : (
              <div className="tl-guide-profile-photo-empty">
                {displayName
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            )}

            {guideData.is_promoted ? (
              <span>
                <SparklesFallback />
                Featured
              </span>
            ) : null}
          </div>


          <div className="tl-guide-profile-copy">
            <Link
              to="/tourist-guides"
              className="tl-guide-profile-back"
            >
              <ArrowLeft
                size={15}
              />

              Guides
            </Link>

            <span className="tl-guide-profile-type">
              {guideData.guide_type ||
                "Local guide"}
            </span>

            <h1>
              {displayName}
            </h1>

            {guideData.short_description ? (
              <p className="tl-guide-profile-tagline">
                {
                  guideData.short_description
                }
              </p>
            ) : null}


            <div className="tl-guide-profile-facts">
              <span>
                <MapPin
                  size={15}
                />

                {getGuideLocation(
                  guideData
                )}
              </span>

              {ratingValue >
              0 ? (
                <span>
                  <Star
                    size={15}
                    fill="currentColor"
                  />

                  {ratingValue.toFixed(
                    1
                  )}

                  {reviewCount >
                  0
                    ? ` · ${reviewCount} reviews`
                    : ""}
                </span>
              ) : (
                <span>
                  <BadgeCheck
                    size={15}
                  />
                  New guide
                </span>
              )}

              {Number(
                guideData.experience_years ||
                  0
              ) > 0 ? (
                <span>
                  <Clock3
                    size={15}
                  />

                  {
                    guideData.experience_years
                  }{" "}
                  years experience
                </span>
              ) : null}

              <span>
                <BadgeCheck
                  size={15}
                />
                Approved guide
              </span>
            </div>


            <div className="tl-guide-profile-actions">
              <a
                href="#guide-booking"
                className="primary"
              >
                <CalendarDays
                  size={16}
                />

                Request booking
              </a>

              <button
                type="button"
                className={
                  isGuideSaved
                    ? "is-saved"
                    : ""
                }
                onClick={
                  handleToggleGuideTrip
                }
              >
                <Heart
                  size={16}
                  fill={
                    isGuideSaved
                      ? "currentColor"
                      : "none"
                  }
                />

                {isGuideSaved
                  ? "Saved to trip"
                  : "Save to trip"}
              </button>

              {whatsappHref ? (
                <a
                  href={
                    whatsappHref
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle
                    size={16}
                  />

                  WhatsApp
                </a>
              ) : null}

              {guideData.email ? (
                <a
                  href={`mailto:${guideData.email}?subject=${emailSubject}&body=${emailBody}`}
                >
                  <Mail
                    size={16}
                  />

                  Email
                </a>
              ) : null}

              <button
                type="button"
                onClick={
                  shareProfile
                }
              >
                <Copy
                  size={16}
                />

                {copied
                  ? "Copied"
                  : "Share"}
              </button>
            </div>
          </div>
        </div>
      </section>


      <section className="tl-guide-profile-layout">
        <div className="tl-guide-profile-main">
          <section className="tl-guide-profile-card">
            <div className="tl-guide-profile-heading">
              <span>
                ABOUT
              </span>

              <h2>
                About{" "}
                {displayName}
              </h2>
            </div>

            <p className="tl-guide-profile-about">
              {guideData.bio ||
                guideData.short_description ||
                "This guide has not added a full bio yet."}
            </p>


            <div className="tl-guide-profile-summary">
              <div>
                <MapPin
                  size={16}
                />

                <span>
                  Location
                </span>

                <strong>
                  {getGuideLocation(
                    guideData
                  )}
                </strong>
              </div>

              <div>
                <Users
                  size={16}
                />

                <span>
                  Experience
                </span>

                <strong>
                  {Number(
                    guideData.experience_years ||
                      0
                  )}{" "}
                  years
                </strong>
              </div>

              <div>
                <CalendarDays
                  size={16}
                />

                <span>
                  Availability
                </span>

                <strong>
                  {guideData.availability ||
                    "By booking"}
                </strong>
              </div>
            </div>
          </section>


          <section className="tl-guide-profile-card">
            <div className="tl-guide-profile-heading">
              <span>
                GUIDE DETAILS
              </span>

              <h2>
                Languages and
                expertise
              </h2>
            </div>


            <div className="tl-guide-profile-detail-grid">
              <div>
                <h3>
                  <Languages
                    size={17}
                  />
                  Languages
                </h3>

                <div className="tl-guide-profile-chips">
                  {languages.length ? (
                    languages.map(
                      (item) => (
                        <span
                          key={
                            item
                          }
                        >
                          {item}
                        </span>
                      )
                    )
                  ) : (
                    <span>
                      Ask guide
                    </span>
                  )}
                </div>
              </div>


              <div>
                <h3>
                  <BadgeCheck
                    size={17}
                  />
                  Services
                </h3>

                <div className="tl-guide-profile-chips">
                  {services.length ? (
                    services.map(
                      (item) => (
                        <span
                          key={
                            item
                          }
                        >
                          {item}
                        </span>
                      )
                    )
                  ) : (
                    <span>
                      Local guiding
                    </span>
                  )}
                </div>
              </div>


              <div>
                <h3>
                  <ShieldCheck
                    size={17}
                  />
                  Specialities
                </h3>

                <div className="tl-guide-profile-chips">
                  {specialities.length ? (
                    specialities.map(
                      (item) => (
                        <span
                          key={
                            item
                          }
                        >
                          {item}
                        </span>
                      )
                    )
                  ) : (
                    <span>
                      Personalized
                      tours
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>


          <section className="tl-guide-profile-card">
            <div className="tl-guide-profile-reviews-top">
              <div className="tl-guide-profile-heading">
                <span>
                  REVIEWS
                </span>

                <h2>
                  Traveller
                  feedback
                </h2>
              </div>

              <label>
                <span>
                  Sort by
                </span>

                <select
                  value={
                    reviewSort
                  }
                  onChange={(
                    event
                  ) =>
                    setReviewSort(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="recent">
                    Most recent
                  </option>

                  <option value="relevant">
                    Most relevant
                  </option>

                  <option value="rating">
                    Highest rating
                  </option>
                </select>
              </label>
            </div>


            <div className="tl-guide-profile-review-summary">
              {ratingValue >
              0 ? (
                <strong>
                  <Star
                    size={17}
                    fill="currentColor"
                  />

                  {ratingValue.toFixed(
                    1
                  )}
                </strong>
              ) : (
                <strong>
                  New guide
                </strong>
              )}

              <span>
                {reviewCount >
                0
                  ? `${reviewCount} public review${
                      reviewCount ===
                      1
                        ? ""
                        : "s"
                    }`
                  : "No public reviews yet"}
              </span>
            </div>


            {reviews.length ? (
              <div className="tl-guide-profile-review-list">
                {reviews.map(
                  (review) => (
                    <article
                      key={
                        review.id
                      }
                    >
                      <div>
                        <strong>
                          {
                            review.tourist_name
                          }
                        </strong>

                        <span>
                          {"★".repeat(
                            Number(
                              review.rating ||
                                0
                            )
                          )}
                        </span>
                      </div>

                      {review.comment ? (
                        <p>
                          {
                            review.comment
                          }
                        </p>
                      ) : null}

                      <small>
                        {review.tour_type ||
                          "Guide experience"}

                        {review.created_at
                          ? ` · ${new Date(
                              review.created_at
                            ).toLocaleDateString(
                              "en-LK"
                            )}`
                          : ""}
                      </small>
                    </article>
                  )
                )}
              </div>
            ) : (
              <div className="tl-guide-profile-review-empty">
                No reviews yet.
              </div>
            )}
          </section>
        </div>


        <aside className="tl-guide-profile-booking">
          <div
            className="tl-guide-booking-card"
            id="guide-booking"
          >
            <span className="tl-guide-booking-kicker">
              BOOK GUIDE
            </span>

            <h2>
              Request{" "}
              {displayName}
            </h2>

            <p>
              Send a booking
              request. Payment
              is handled after
              the guide accepts
              it.
            </p>


            <label>
              <span>
                Date
              </span>

              <input
                type="date"
                value={
                  inquiry.date
                }
                onChange={(
                  event
                ) =>
                  setInquiry(
                    (
                      current
                    ) => ({
                      ...current,
                      date:
                        event
                          .target
                          .value,
                    })
                  )
                }
              />
            </label>


            <label>
              <span>
                Booking type
              </span>

              <select
                value={
                  inquiry.duration_type
                }
                onChange={(
                  event
                ) =>
                  setInquiry(
                    (
                      current
                    ) => ({
                      ...current,
                      duration_type:
                        event
                          .target
                          .value,
                    })
                  )
                }
              >
                <option value="full_day">
                  Full day
                </option>

                <option value="hourly">
                  Hourly
                </option>
              </select>
            </label>


            {inquiry.duration_type ===
            "hourly" ? (
              <div className="tl-guide-booking-two-column">
                <label>
                  <span>
                    Start time
                  </span>

                  <input
                    type="time"
                    value={
                      inquiry.start_time
                    }
                    onChange={(
                      event
                    ) =>
                      setInquiry(
                        (
                          current
                        ) => ({
                          ...current,
                          start_time:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Hours
                  </span>

                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={
                      inquiry.hours
                    }
                    onChange={(
                      event
                    ) =>
                      setInquiry(
                        (
                          current
                        ) => ({
                          ...current,
                          hours:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />
                </label>
              </div>
            ) : null}


            <label>
              <span>
                Guests
              </span>

              <input
                type="number"
                min="1"
                value={
                  inquiry.guests
                }
                onChange={(
                  event
                ) =>
                  setInquiry(
                    (
                      current
                    ) => ({
                      ...current,
                      guests:
                        event
                          .target
                          .value,
                    })
                  )
                }
              />
            </label>


            <label>
              <span>
                Interest
              </span>

              <select
                value={
                  inquiry.interest
                }
                onChange={(
                  event
                ) =>
                  setInquiry(
                    (
                      current
                    ) => ({
                      ...current,
                      interest:
                        event
                          .target
                          .value,
                    })
                  )
                }
              >
                <option>
                  Personalized
                  tour
                </option>

                <option>
                  City highlights
                </option>

                <option>
                  Full day trip
                </option>

                <option>
                  Adventure or
                  nature
                </option>

                <option>
                  Airport or hotel
                  support
                </option>
              </select>
            </label>


            <label>
              <span>
                Pickup location
              </span>

              <input
                value={
                  inquiry.pickup_location
                }
                placeholder="Hotel, station or landmark"
                onChange={(
                  event
                ) =>
                  setInquiry(
                    (
                      current
                    ) => ({
                      ...current,
                      pickup_location:
                        event
                          .target
                          .value,
                    })
                  )
                }
              />
            </label>


            <label>
              <span>
                Message
              </span>

              <textarea
                rows="3"
                value={
                  inquiry.message
                }
                placeholder="Tell the guide what you would like to do"
                onChange={(
                  event
                ) =>
                  setInquiry(
                    (
                      current
                    ) => ({
                      ...current,
                      message:
                        event
                          .target
                          .value,
                    })
                  )
                }
              />
            </label>


            <div className="tl-guide-booking-prices">
              <div>
                <span>
                  Day price
                </span>

                <strong>
                  {formatLkr(
                    guideData.price_per_day
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Hour price
                </span>

                <strong>
                  {formatLkr(
                    guideData.price_per_hour
                  )}
                </strong>
              </div>
            </div>


            {bookingMessage ? (
              <div className="tl-guide-booking-message">
                {
                  bookingMessage
                }
              </div>
            ) : null}


            <button
              type="button"
              className="tl-guide-booking-primary"
              onClick={
                submitGuideBooking
              }
              disabled={
                bookingSending ||
                guideBookingAmount <=
                  0
              }
            >
              {bookingSending
                ? "Sending request..."
                : "Send booking request"}
            </button>


            <Link
              className="tl-guide-booking-secondary"
              to="/my-guide-bookings"
            >
              My guide bookings
            </Link>


            <Link
              className="tl-guide-booking-secondary"
              to={`/hotels?city=${encodeURIComponent(
                guideData.city ||
                  ""
              )}`}
            >
              <Hotel
                size={14}
              />

              Hotels nearby
            </Link>


            <div className="tl-guide-booking-note">
              <ShieldCheck
                size={16}
              />

              <span>
                This public
                guide profile
                was approved
                before listing.
              </span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}


function SparklesFallback() {
  return (
    <span
      aria-hidden="true"
      className="tl-guide-profile-featured-icon"
    >
      ✦
    </span>
  );
}