import ContentImage from "../components/ContentImage";

import { assetUrl } from "../utils/assetUrl";

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
  BadgeCheck,
  Clock3,
  Heart,
  Languages,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  WalletCards,
} from "lucide-react";

import api from "../api/api";

import {
  readTripItems,
  SAVED_TRIP_EVENT,
  toggleTripItem,
} from "../utils/tripBasket";

import "../styles/guides.css";


const GUIDE_TYPES = [
  "All",
  "Heritage",
  "Food",
  "Nature",
  "Adventure",
  "City",
  "Wellness",
  "Wildlife",
  "Religious",
  "Photography",
];


const SORT_OPTIONS = [
  {
    value: "recommended",
    label: "Recommended",
  },
  {
    value: "rating",
    label: "Highest rating",
  },
  {
    value: "experience",
    label: "Most experienced",
  },
  {
    value: "lowDayPrice",
    label: "Lowest day price",
  },
  {
    value: "highDayPrice",
    label: "Highest day price",
  },
  {
    value: "name",
    label: "Name A-Z",
  },
];


const MAX_DAY_PRICE = 60000;


const cleanArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};


const formatLkr = (amount) => {
  const value = Number(amount || 0);

  if (!value) {
    return "Ask price";
  }

  return `LKR ${value.toLocaleString("en-LK")}`;
};


const getGuideLocation = (guide) =>
  [guide.city, guide.district]
    .filter(Boolean)
    .join(", ") ||
  guide.base_location ||
  "Sri Lanka";


const buildHeroSlides = (places) => {
  const slides = [];

  places.forEach((place) => {
    const gallery = cleanArray(
      place.images
    )
      .map((item) => {
        if (
          typeof item ===
          "string"
        ) {
          return item;
        }

        return (
          item?.image_url ||
          item?.image ||
          ""
        );
      })
      .filter(Boolean);

    const images = gallery.length
      ? gallery
      : [
          place.image_url ||
            place.image,
        ].filter(Boolean);

    images
      .slice(0, 2)
      .forEach((image) => {
        slides.push({
          id: `${place.id}-${image}`,
          title:
            place.name ||
            "Sri Lanka",
          subtitle:
            [
              place.city,
              place.region,
            ]
              .filter(Boolean)
              .join(" · ") ||
            "Sri Lanka",
          category:
            place.categoryLabel ||
            place.category ||
            "Destination",
          image:
            assetUrl(image),
        });
      });
  });

  return slides
    .filter(
      (slide) =>
        slide.image
    )
    .slice(0, 10);
};


const buildGuideTripItem = (
  guide
) => {
  const price = Number(
    guide.price_per_day ||
      guide.price_per_hour ||
      0
  );

  return {
    id: `guide-${guide.id}`,

    sourceId: guide.id,

    partnerGuideId:
      guide.id,

    tripItemType:
      "guide",

    name:
      guide.display_name ||
      guide.full_name ||
      "Tourist guide",

    city:
      guide.city || "",

    district:
      guide.district || "",

    region:
      guide.guide_type ||
      "Guide",

    image:
      assetUrl(
        guide.image_url
      ),

    duration:
      "Guide support",

    bestTime:
      guide.availability ||
      "By booking",

    budget:
      price >= 30000
        ? "High"
        : price >= 15000
          ? "Medium"
          : "Low",

    estimatedCost:
      price,

    shortDescription:
      guide.short_description ||
      guide.bio ||
      "Selected tourist guide for this trip.",

    link:
      guide.slug
        ? `/tourist-guides/${guide.slug}`
        : "/tourist-guides",

    guideLanguages:
      cleanArray(
        guide.languages
      ),
  };
};


function GuideCard({
  guide,
  saved,
  onToggleSave,
}) {
  const image =
    assetUrl(
      guide.image_url
    );

  const languages =
    cleanArray(
      guide.languages
    );

  const rating =
    Number(
      guide.rating || 0
    );

  const experience =
    Number(
      guide.experience_years ||
        0
    );

  const displayName =
    guide.display_name ||
    guide.full_name ||
    "Tourist guide";

  return (
    <article className="tl-guide-card">
      <Link
        to={
          guide.slug
            ? `/tourist-guides/${guide.slug}`
            : "/tourist-guides"
        }
        className="tl-guide-card-media"
      >
        {image ? (
          <ContentImage
            src={image}
            alt={displayName}
          />
        ) : (
          <div className="tl-guide-card-placeholder">
            {displayName
              .slice(0, 1)
              .toUpperCase()}
          </div>
        )}

        <div className="tl-guide-card-badges">
          <span className="tl-guide-type-badge">
            {guide.guide_type ||
              "Local guide"}
          </span>

          {guide.is_promoted ? (
            <span className="tl-guide-featured-badge">
              <Sparkles
                size={12}
              />
              Featured
            </span>
          ) : null}
        </div>
      </Link>


      <div className="tl-guide-card-body">
        <div className="tl-guide-card-title-row">
          <div>
            <Link
              to={
                guide.slug
                  ? `/tourist-guides/${guide.slug}`
                  : "/tourist-guides"
              }
            >
              <h3>
                {displayName}
              </h3>
            </Link>

            <p>
              <MapPin
                size={13}
              />

              {getGuideLocation(
                guide
              )}
            </p>
          </div>

          {rating > 0 ? (
            <span className="tl-guide-rating">
              <Star
                size={13}
                fill="currentColor"
              />
              {rating.toFixed(
                1
              )}
            </span>
          ) : (
            <span className="tl-guide-new">
              New
            </span>
          )}
        </div>


        {guide.short_description ? (
          <p className="tl-guide-description">
            {
              guide.short_description
            }
          </p>
        ) : null}


        <div className="tl-guide-meta">
          {experience >
          0 ? (
            <span>
              <Clock3
                size={13}
              />

              {experience} yrs
            </span>
          ) : null}

          {languages.length ? (
            <span>
              <Languages
                size={13}
              />

              {languages
                .slice(0, 2)
                .join(", ")}
            </span>
          ) : null}

          <span>
            <BadgeCheck
              size={13}
            />
            Approved
          </span>
        </div>


        <div className="tl-guide-price-grid">
          <div>
            <span>
              Per day
            </span>

            <strong>
              {formatLkr(
                guide.price_per_day
              )}
            </strong>
          </div>

          <div>
            <span>
              Per hour
            </span>

            <strong>
              {formatLkr(
                guide.price_per_hour
              )}
            </strong>
          </div>
        </div>


        <div className="tl-guide-card-actions">
          {guide.slug ? (
            <Link
              to={`/tourist-guides/${guide.slug}`}
              className="tl-guide-view-button"
            >
              View profile
            </Link>
          ) : (
            <span className="tl-guide-view-button is-disabled">
              Profile unavailable
            </span>
          )}

          <button
            type="button"
            className={
              saved
                ? "tl-guide-save-button is-saved"
                : "tl-guide-save-button"
            }
            onClick={() =>
              onToggleSave(
                guide
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
        </div>
      </div>
    </article>
  );
}


export default function TouristGuidePage() {
  const [
    searchParams,
    setSearchParams,
  ] =
    useSearchParams();

  const [
    search,
    setSearch,
  ] =
    useState(
      searchParams.get(
        "search"
      ) ||
        searchParams.get(
          "city"
        ) ||
        ""
    );

  const [
    type,
    setType,
  ] =
    useState(
      searchParams.get(
        "type"
      ) || "All"
    );

  const [
    city,
    setCity,
  ] =
    useState(
      searchParams.get(
        "city"
      ) || ""
    );

  const [
    language,
    setLanguage,
  ] =
    useState(
      searchParams.get(
        "language"
      ) || ""
    );

  const [
    maxDayPrice,
    setMaxDayPrice,
  ] =
    useState(
      Number(
        searchParams.get(
          "maxDayPrice"
        ) ||
          MAX_DAY_PRICE
      )
    );

  const [
    minExperience,
    setMinExperience,
  ] =
    useState(
      Number(
        searchParams.get(
          "minExperience"
        ) || 0
      )
    );

  const [
    sortBy,
    setSortBy,
  ] =
    useState(
      searchParams.get(
        "sort"
      ) ||
        "recommended"
    );

  const [
    guides,
    setGuides,
  ] =
    useState([]);

  const [
    places,
    setPlaces,
  ] =
    useState([]);

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
    heroIndex,
    setHeroIndex,
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

  const [
    filtersOpen,
    setFiltersOpen,
  ] =
    useState(false);


  const queryString =
    useMemo(() => {
      const params =
        new URLSearchParams();

      if (
        search.trim()
      ) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (
        type !== "All"
      ) {
        params.set(
          "type",
          type
        );
      }

      return params.toString();
    }, [
      search,
      type,
    ]);


  useEffect(() => {
    let active = true;

    const loadGuides =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await api.get(
              `/guides${
                queryString
                  ? `?${queryString}`
                  : ""
              }`
            );

          if (!active) {
            return;
          }

          setGuides(
            response.data
              .guides || []
          );
        } catch (err) {
          if (!active) {
            return;
          }

          setError(
            err.response?.data
              ?.message ||
              "Failed to load tourist guides."
          );
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    loadGuides();

    return () => {
      active = false;
    };
  }, [queryString]);


  useEffect(() => {
    let active = true;

    const loadPlaces =
      async () => {
        try {
          const response =
            await api.get(
              "/explore/places"
            );

          if (active) {
            setPlaces(
              response.data
                .places || []
            );
          }
        } catch (err) {
          console.error(
            "Failed to load guide hero destinations:",
            err
          );
        }
      };

    loadPlaces();

    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    const params =
      new URLSearchParams();

    if (
      search.trim()
    ) {
      params.set(
        "search",
        search.trim()
      );
    }

    if (
      type !== "All"
    ) {
      params.set(
        "type",
        type
      );
    }

    if (city) {
      params.set(
        "city",
        city
      );
    }

    if (language) {
      params.set(
        "language",
        language
      );
    }

    if (
      maxDayPrice <
      MAX_DAY_PRICE
    ) {
      params.set(
        "maxDayPrice",
        String(
          maxDayPrice
        )
      );
    }

    if (
      minExperience >
      0
    ) {
      params.set(
        "minExperience",
        String(
          minExperience
        )
      );
    }

    if (
      sortBy !==
      "recommended"
    ) {
      params.set(
        "sort",
        sortBy
      );
    }

    setSearchParams(
      params,
      {
        replace: true,
      }
    );
  }, [
    search,
    type,
    city,
    language,
    maxDayPrice,
    minExperience,
    sortBy,
    setSearchParams,
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


  const availableCities =
    useMemo(() => {
      const values =
        guides
          .map(
            (guide) =>
              guide.city
          )
          .filter(Boolean)
          .map((item) =>
            item.trim()
          );

      return [
        ...new Set(
          values
        ),
      ].sort();
    }, [guides]);


  const availableLanguages =
    useMemo(() => {
      const values =
        guides.flatMap(
          (guide) =>
            cleanArray(
              guide.languages
            )
        );

      return [
        ...new Set(
          values
        ),
      ].sort();
    }, [guides]);


  const heroSlides =
    useMemo(
      () =>
        buildHeroSlides(
          places
        ),
      [places]
    );


  const activeHero =
    heroSlides[
      heroIndex %
        Math.max(
          heroSlides.length,
          1
        )
    ] || null;


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


  const filteredGuides =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      const result =
        guides.filter(
          (guide) => {
            const searchable =
              [
                guide.display_name,
                guide.full_name,
                guide.guide_type,
                guide.city,
                guide.district,
                guide.base_location,
                guide.short_description,
                guide.bio,

                ...cleanArray(
                  guide.languages
                ),

                ...cleanArray(
                  guide.services
                ),

                ...cleanArray(
                  guide.specialities
                ),
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
              !query ||
              searchable.includes(
                query
              );

            const matchesType =
              type === "All" ||
              String(
                guide.guide_type ||
                  ""
              ).toLowerCase() ===
                type.toLowerCase();

            const matchesCity =
              !city ||
              String(
                guide.city || ""
              ).toLowerCase() ===
                city.toLowerCase();

            const matchesLanguage =
              !language ||
              cleanArray(
                guide.languages
              ).some(
                (item) =>
                  item.toLowerCase() ===
                  language.toLowerCase()
              );

            const dayPrice =
              Number(
                guide.price_per_day ||
                  0
              );

            const matchesPrice =
              !dayPrice ||
              dayPrice <=
                maxDayPrice;

            const matchesExperience =
              Number(
                guide.experience_years ||
                  0
              ) >=
              minExperience;

            return (
              matchesSearch &&
              matchesType &&
              matchesCity &&
              matchesLanguage &&
              matchesPrice &&
              matchesExperience
            );
          }
        );

      return [
        ...result,
      ].sort((a, b) => {
        const promotedA =
          a.is_promoted
            ? 1
            : 0;

        const promotedB =
          b.is_promoted
            ? 1
            : 0;

        if (
          sortBy ===
            "recommended" &&
          promotedA !==
            promotedB
        ) {
          return (
            promotedB -
            promotedA
          );
        }

        if (
          sortBy ===
          "rating"
        ) {
          return (
            Number(
              b.rating || 0
            ) -
            Number(
              a.rating || 0
            )
          );
        }

        if (
          sortBy ===
          "experience"
        ) {
          return (
            Number(
              b.experience_years ||
                0
            ) -
            Number(
              a.experience_years ||
                0
            )
          );
        }

        if (
          sortBy ===
          "lowDayPrice"
        ) {
          return (
            Number(
              a.price_per_day ||
                0
            ) -
            Number(
              b.price_per_day ||
                0
            )
          );
        }

        if (
          sortBy ===
          "highDayPrice"
        ) {
          return (
            Number(
              b.price_per_day ||
                0
            ) -
            Number(
              a.price_per_day ||
                0
            )
          );
        }

        if (
          sortBy ===
          "name"
        ) {
          return String(
            a.display_name ||
              a.full_name ||
              ""
          ).localeCompare(
            String(
              b.display_name ||
                b.full_name ||
                ""
            )
          );
        }

        return (
          Number(
            b.rating || 0
          ) -
            Number(
              a.rating || 0
            ) ||
          Number(
            b.experience_years ||
              0
          ) -
            Number(
              a.experience_years ||
                0
            )
        );
      });
    }, [
      guides,
      search,
      type,
      city,
      language,
      maxDayPrice,
      minExperience,
      sortBy,
    ]);


  const stats =
    useMemo(() => {
      const languages =
        new Set(
          guides.flatMap(
            (guide) =>
              cleanArray(
                guide.languages
              )
          )
        );

      const destinations =
        new Set(
          guides
            .map(
              (guide) =>
                guide.city
            )
            .filter(Boolean)
        );

      return {
        guides:
          guides.length,

        destinations:
          destinations.size,

        languages:
          languages.size,
      };
    }, [guides]);


  const savedTripIds =
    useMemo(
      () =>
        new Set(
          savedTripItems.map(
            (item) =>
              String(
                item.id
              )
          )
        ),
      [savedTripItems]
    );


  const activeFilterCount =
    Number(
      type !== "All"
    ) +
    Number(Boolean(city)) +
    Number(
      Boolean(language)
    ) +
    Number(
      maxDayPrice <
        MAX_DAY_PRICE
    ) +
    Number(
      minExperience >
        0
    );


  const handleToggleGuideTrip =
    (guide) => {
      const item =
        buildGuideTripItem(
          guide
        );

      const result =
        toggleTripItem(
          item
        );

      setSavedTripItems(
        result.items
      );

      setNotice(
        result.saved
          ? `${item.name} added to your trip basket.`
          : `${item.name} removed from your trip basket.`
      );
    };


  const clearFilters =
    () => {
      setSearch("");
      setType("All");
      setCity("");
      setLanguage("");
      setMaxDayPrice(
        MAX_DAY_PRICE
      );
      setMinExperience(
        0
      );
      setSortBy(
        "recommended"
      );

      setSearchParams(
        {},
        {
          replace: true,
        }
      );
    };


  const handleSubmit =
    (event) => {
      event.preventDefault();
    };


  return (
    <main className="tl-guides-page">
      {notice ? (
        <div className="tl-guides-toast">
          {notice}
        </div>
      ) : null}


      <section className="tl-guides-hero">
        {activeHero ? (
          <ContentImage
            className="tl-guides-hero-image"
            src={
              activeHero.image
            }
            alt=""
          />
        ) : null}

        <div className="tl-guides-hero-overlay" />


        <div className="tl-guides-hero-inner">
          <div className="tl-guides-hero-copy">
            <span className="tl-guides-kicker">
              TRIPLANKA · GUIDES
            </span>

            <h1>
              Travel with the
              right{" "}
              <span>
                local guide.
              </span>
            </h1>

            <p>
              Find approved
              guides by
              destination,
              language and
              experience.
            </p>


            <form
              className="tl-guides-search"
              onSubmit={
                handleSubmit
              }
            >
              <Search
                size={19}
              />

              <input
                type="search"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search guide, city, language or speciality"
              />

              {search ? (
                <button
                  type="button"
                  className="tl-guides-search-clear"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}

              <button
                type="submit"
                className="tl-guides-search-button"
              >
                Search
              </button>
            </form>


            <div className="tl-guides-hero-stats">
              <span>
                <strong>
                  {stats.guides}
                </strong>
                approved guides
              </span>

              <span>
                <strong>
                  {
                    stats.destinations
                  }
                </strong>
                destinations
              </span>

              <span>
                <strong>
                  {
                    stats.languages
                  }
                </strong>
                languages
              </span>
            </div>
          </div>


          {activeHero ? (
            <div className="tl-guides-destination-card">
              <span>
                GUIDE DESTINATION
              </span>

              <strong>
                {
                  activeHero.title
                }
              </strong>

              <small>
                <MapPin
                  size={13}
                />

                {
                  activeHero.subtitle
                }
              </small>

              <em>
                {
                  activeHero.category
                }
              </em>
            </div>
          ) : null}
        </div>
      </section>


      <section className="tl-guides-browser">
        <div className="tl-guides-heading">
          <div>
            <span>
              FIND A GUIDE
            </span>

            <h2>
              Choose a guide
              for your journey.
            </h2>
          </div>

          <button
            type="button"
            className="tl-guides-mobile-filter"
            onClick={() =>
              setFiltersOpen(
                (current) =>
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


        <div className="tl-guides-layout">
          <aside
            className={
              filtersOpen
                ? "tl-guides-filter-sidebar is-open"
                : "tl-guides-filter-sidebar"
            }
          >
            <div className="tl-guides-filter-panel">
              <div className="tl-guides-filter-header">
                <div>
                  <span>
                    FILTERS
                  </span>

                  <h3>
                    Refine guides
                  </h3>
                </div>

                <button
                  type="button"
                  className="tl-guides-filter-close"
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


              <label className="tl-guides-filter-field">
                <span>
                  Guide type
                </span>

                <select
                  value={type}
                  onChange={(
                    event
                  ) =>
                    setType(
                      event.target
                        .value
                    )
                  }
                >
                  {GUIDE_TYPES.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item ===
                        "All"
                          ? "All guide types"
                          : item}
                      </option>
                    )
                  )}
                </select>
              </label>


              <label className="tl-guides-filter-field">
                <span>
                  Destination
                </span>

                <select
                  value={city}
                  onChange={(
                    event
                  ) =>
                    setCity(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="">
                    All destinations
                  </option>

                  {availableCities.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </label>


              <label className="tl-guides-filter-field">
                <span>
                  Language
                </span>

                <select
                  value={
                    language
                  }
                  onChange={(
                    event
                  ) =>
                    setLanguage(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="">
                    Any language
                  </option>

                  {availableLanguages.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </label>


              <div className="tl-guides-price-filter">
                <div>
                  <span>
                    Maximum day price
                  </span>

                  <strong>
                    {formatLkr(
                      maxDayPrice
                    )}
                  </strong>
                </div>

                <input
                  type="range"
                  min="5000"
                  max={
                    MAX_DAY_PRICE
                  }
                  step="1000"
                  value={
                    maxDayPrice
                  }
                  onChange={(
                    event
                  ) =>
                    setMaxDayPrice(
                      Number(
                        event
                          .target
                          .value
                      )
                    )
                  }
                />

                <small>
                  LKR 5,000 -
                  LKR 60,000
                </small>
              </div>


              <div className="tl-guides-experience-filter">
                <span>
                  Minimum
                  experience
                </span>

                <div>
                  {[
                    0,
                    2,
                    5,
                    8,
                  ].map(
                    (item) => (
                      <button
                        type="button"
                        key={item}
                        className={
                          minExperience ===
                          item
                            ? "is-active"
                            : ""
                        }
                        onClick={() =>
                          setMinExperience(
                            item
                          )
                        }
                      >
                        {item ===
                        0
                          ? "Any"
                          : `${item}+ yrs`}
                      </button>
                    )
                  )}
                </div>
              </div>


              {activeFilterCount >
                0 ||
              search ? (
                <button
                  type="button"
                  className="tl-guides-clear"
                  onClick={
                    clearFilters
                  }
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </aside>


          <section className="tl-guides-results">
            <div className="tl-guides-toolbar">
              <div>
                <strong>
                  {
                    filteredGuides.length
                  }
                </strong>

                <span>
                  {filteredGuides.length ===
                  1
                    ? "guide"
                    : "guides"}
                </span>
              </div>

              <label>
                <span>
                  Sort by
                </span>

                <select
                  value={sortBy}
                  onChange={(
                    event
                  ) =>
                    setSortBy(
                      event.target
                        .value
                    )
                  }
                >
                  {SORT_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>


            {error ? (
              <div className="tl-guides-state tl-guides-error">
                <strong>
                  Could not load
                  guides
                </strong>

                <span>
                  {error}
                </span>
              </div>
            ) : loading ? (
              <div className="tl-guide-grid">
                {Array.from({
                  length: 6,
                }).map(
                  (
                    _,
                    index
                  ) => (
                    <div
                      key={index}
                      className="tl-guide-skeleton"
                    />
                  )
                )}
              </div>
            ) : filteredGuides.length ? (
              <div className="tl-guide-grid">
                {filteredGuides.map(
                  (guide) => (
                    <GuideCard
                      key={guide.id}
                      guide={guide}
                      saved={savedTripIds.has(
                        `guide-${guide.id}`
                      )}
                      onToggleSave={
                        handleToggleGuideTrip
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div className="tl-guides-state">
                <BadgeCheck
                  size={28}
                />

                <strong>
                  No matching
                  guides
                </strong>

                <span>
                  Try another
                  destination,
                  language or
                  price range.
                </span>

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                >
                  Show all guides
                </button>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}