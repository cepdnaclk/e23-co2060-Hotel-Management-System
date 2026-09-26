import { exploreReturn } from "../utils/exploreReturn";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useLocation,
  useOutletContext,
} from "react-router-dom";

import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  Heart,
  MapPin,
  Route,
  Search,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
} from "lucide-react";

import ContentImage from "../components/ContentImage";

import {
  assetUrl,
  formatLkr,
  getExploreCategories,
  getExploreFeed,
  getExploreItineraries,
  getExploreSettings,
  getSeasonalPlaces,
} from "../services/exploreService";

import {
  getTripItemCategoryKey,
  getTripItemSourceId,
  readTripItems,
  SAVED_TRIP_EVENT,
  toggleTripItem,
} from "../utils/tripBasket";

import {
  sendItineraryToPlanner,
} from "../utils/itineraryPlannerTransfer";

import "../styles/explorePage.css";
import "../styles/exploreItinerary.css";


/* =========================================================
   DATE
========================================================= */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];


const getSriLankaMonthInfo =
  () => {
    const formatter =
      new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone:
            "Asia/Colombo",
          month:
            "numeric",
        }
      );

    const monthNumber =
      Number(
        formatter.format(
          new Date()
        )
      );

    const safeMonth =
      monthNumber >= 1 &&
      monthNumber <= 12
        ? monthNumber
        : new Date().getMonth() +
          1;

    return {
      number:
        safeMonth,

      name:
        MONTH_NAMES[
          safeMonth - 1
        ] ||
        MONTH_NAMES[
          new Date().getMonth()
        ],
    };
  };


/* =========================================================
   HELPERS
========================================================= */

const getPlaceImage =
  (place) =>
    place?.image ||
    place?.imageUrl ||
    place?.image_url ||
    place?.images?.[0] ||
    "";


const hasText =
  (value) =>
    String(
      value || ""
    ).trim().length > 0;


const normalizeText =
  (value) =>
    String(
      value || ""
    )
      .trim()
      .toLowerCase();


const getSuggestionScore =
  (
    place,
    query
  ) => {
    const q =
      normalizeText(query);

    if (!q) {
      return 999;
    }

    const name =
      normalizeText(
        place?.name
      );

    const city =
      normalizeText(
        place?.city
      );

    const district =
      normalizeText(
        place?.district
      );

    const region =
      normalizeText(
        place?.region
      );

    if (name === q) return 0;

    if (
      name.startsWith(q)
    ) {
      return 1;
    }

    if (city === q) return 2;

    if (
      city.startsWith(q)
    ) {
      return 3;
    }

    if (
      district === q
    ) {
      return 4;
    }

    if (
      district.startsWith(q)
    ) {
      return 5;
    }

    if (region === q) {
      return 6;
    }

    if (
      region.startsWith(q)
    ) {
      return 7;
    }

    if (
      name.includes(q)
    ) {
      return 8;
    }

    if (
      city.includes(q)
    ) {
      return 9;
    }

    if (
      district.includes(q)
    ) {
      return 10;
    }

    if (
      region.includes(q)
    ) {
      return 11;
    }

    return 20;
  };


const getPlaceLocation =
  (place) =>
    [
      place?.city,
      place?.district,
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
      .join(" · ") ||
    place?.region ||
    "Sri Lanka";


/* =========================================================
   PLACE CARD
========================================================= */

function PlaceCard({
  place,
  saved,
  onToggleSave,
  onOpenDetails,
}) {
  const tags =
    Array.isArray(
      place.tags
    )
      ? place.tags.slice(
          0,
          3
        )
      : [];

  const hasCost =
    Number(
      place.estimatedCost ||
        0
    ) > 0;

  return (
    <article className="explore-place-card">
      <Link
        to={`/explore/${place.id}`}
        className="explore-place-media"
        onClick={
          onOpenDetails
        }
      >
        <ContentImage
          src={assetUrl(
            getPlaceImage(
              place
            )
          )}
          alt={place.name}
          className="explore-place-image"
        />

        <div className="explore-place-badges">
          <span className="explore-place-category">
            {place.categoryIcon ? (
              <span>
                {
                  place.categoryIcon
                }
              </span>
            ) : null}

            {place.categoryLabel ||
              place.region ||
              "Sri Lanka"}
          </span>

          {place.featured ? (
            <span className="explore-featured-badge">
              <Sparkles
                size={13}
              />

              Featured
            </span>
          ) : null}
        </div>
      </Link>

      <div className="explore-place-body">
        <div className="explore-place-heading-row">
          <div>
            <h3>
              {place.name}
            </h3>

            <p className="explore-place-location">
              <MapPin
                size={14}
              />

              <span>
                {getPlaceLocation(
                  place
                )}
              </span>
            </p>
          </div>

          {place.budget ? (
            <span
              className={`explore-budget-badge explore-budget-${String(
                place.budget
              ).toLowerCase()}`}
            >
              {
                place.budget
              }
            </span>
          ) : null}
        </div>

        {hasText(
          place.shortDescription
        ) ? (
          <p className="explore-place-description">
            {
              place.shortDescription
            }
          </p>
        ) : null}

        <div className="explore-place-meta">
          {hasText(
            place.duration
          ) ? (
            <span>
              <Clock3
                size={13}
              />

              {
                place.duration
              }
            </span>
          ) : null}

          {hasText(
            place.bestTime
          ) ? (
            <span>
              <CalendarDays
                size={13}
              />

              {
                place.bestTime
              }
            </span>
          ) : null}

          {hasCost ? (
            <span>
              <WalletCards
                size={13}
              />

              {formatLkr(
                place.estimatedCost
              )}
            </span>
          ) : null}
        </div>

        {tags.length ? (
          <div className="explore-place-tags">
            {tags.map(
              (tag) => (
                <span
                  key={`${place.id}-${tag}`}
                >
                  {tag}
                </span>
              )
            )}
          </div>
        ) : null}

        <div className="explore-place-actions">
          <Link
            to={`/explore/${place.id}`}
            className="explore-primary-action"
            onClick={
              onOpenDetails
            }
          >
            View details

            <ArrowRight
              size={15}
            />
          </Link>

          <button
            type="button"
            className={
              saved
                ? "explore-save-action is-saved"
                : "explore-save-action"
            }
            onClick={() =>
              onToggleSave(
                place
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
              place.city || ""
            )}`}
            className="explore-secondary-action"
          >
            Hotels
          </Link>
        </div>
      </div>
    </article>
  );
}


/* =========================================================
   MONTHLY DISCOVERY
========================================================= */

function MonthlyDiscovery({
  places,
  monthName,
  onOpenDetails,
}) {
  const monthlyPlaces =
    Array.isArray(places)
      ? places.slice(
          0,
          4
        )
      : [];

  if (
    !monthlyPlaces.length
  ) {
    return null;
  }

  const leadPlace =
    monthlyPlaces[0];

  const secondaryPlaces =
    monthlyPlaces.slice(1);

  return (
    <section className="explore-monthly-section">
      <div className="explore-monthly-heading">
        <div className="explore-monthly-heading-copy">
          <span className="explore-monthly-eyebrow">
            GOOD IN{" "}
            {String(
              monthName
            ).toUpperCase()}
          </span>

          <h2>
            Places that suit this month.
          </h2>

          <p>
            Seasonal places to consider for your Sri Lanka trip.
          </p>
        </div>

        <div className="explore-monthly-current">
          <CalendarDays
            size={16}
          />

          <div>
            <small>
              Current month
            </small>

            <strong>
              {monthName}
            </strong>
          </div>
        </div>
      </div>

      <div
        className={`explore-monthly-layout ${
          secondaryPlaces.length
            ? ""
            : "is-single"
        }`}
      >
        <Link
          to={`/explore/${leadPlace.id}`}
          className="explore-monthly-feature"
          onClick={
            onOpenDetails
          }
        >
          <ContentImage
            src={assetUrl(
              getPlaceImage(
                leadPlace
              )
            )}
            alt={
              leadPlace.name
            }
          />

          <div className="explore-monthly-feature-overlay" />

          <div className="explore-monthly-feature-top">
            <span className="explore-monthly-recommendation">
              Seasonal recommendation
            </span>

            {leadPlace.categoryLabel ? (
              <span className="explore-monthly-category">
                {
                  leadPlace.categoryLabel
                }
              </span>
            ) : null}
          </div>

          <div className="explore-monthly-feature-content">
            <p className="explore-monthly-location">
              <MapPin
                size={14}
              />

              <span>
                {getPlaceLocation(
                  leadPlace
                )}
              </span>
            </p>

            <h3>
              {
                leadPlace.name
              }
            </h3>

            {hasText(
              leadPlace.shortDescription
            ) ? (
              <p className="explore-monthly-description">
                {
                  leadPlace.shortDescription
                }
              </p>
            ) : null}

            <span className="explore-monthly-view">
              Explore this place

              <ArrowRight
                size={15}
              />
            </span>
          </div>
        </Link>

        {secondaryPlaces.length ? (
          <div className="explore-monthly-side">
            {secondaryPlaces.map(
              (place) => (
                <Link
                  key={`monthly-${place.id}`}
                  to={`/explore/${place.id}`}
                  className="explore-monthly-small-card"
                  onClick={
                    onOpenDetails
                  }
                >
                  <ContentImage
                    src={assetUrl(
                      getPlaceImage(
                        place
                      )
                    )}
                    alt={
                      place.name
                    }
                  />

                  <div className="explore-monthly-small-copy">
                    <span>
                      {place.categoryLabel ||
                        place.region ||
                        "Seasonal pick"}
                    </span>

                    <strong>
                      {
                        place.name
                      }
                    </strong>

                    <small>
                      <MapPin
                        size={12}
                      />

                      {getPlaceLocation(
                        place
                      )}
                    </small>
                  </div>

                  <span className="explore-monthly-arrow">
                    <ArrowRight
                      size={15}
                    />
                  </span>
                </Link>
              )
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}


/* =========================================================
   ITINERARY CARD — SET 9.6
========================================================= */

function ItineraryCard({
  itinerary,
  onOpenDetails,
  onPlanItinerary,
}) {
  const places =
    Array.isArray(
      itinerary.places
    )
      ? itinerary.places
      : [];

  const cover =
    places.find(
      (place) =>
        getPlaceImage(
          place
        )
    ) || null;

  const visiblePlaces =
    places.slice(
      0,
      4
    );

  const remainingPlaces =
    Math.max(
      0,
      places.length -
        visiblePlaces.length
    );

  return (
    <article className="explore-itinerary-card">
      <div className="explore-itinerary-cover">
        {cover ? (
          <ContentImage
            src={assetUrl(
              getPlaceImage(
                cover
              )
            )}
            alt={
              itinerary.title
            }
          />
        ) : (
          <div className="explore-itinerary-cover-empty">
            <Compass
              size={30}
            />
          </div>
        )}

        <div className="explore-itinerary-cover-meta">
          <span>
            <CalendarDays
              size={12}
            />

            {itinerary.days ||
              "Trip idea"}
          </span>

          <span>
            <MapPin
              size={12}
            />

            {places.length}{" "}
            {places.length ===
            1
              ? "stop"
              : "stops"}
          </span>
        </div>

        <div className="explore-itinerary-cover-title">
          <small>
            TRIPLANKA ROUTE
          </small>

          <strong>
            {
              itinerary.title
            }
          </strong>
        </div>
      </div>

      <div className="explore-itinerary-body">
        {hasText(
          itinerary.tone
        ) ? (
          <p>
            {
              itinerary.tone
            }
          </p>
        ) : (
          <p>
            A ready-made route using published TripLanka destinations.
          </p>
        )}

        <div className="explore-itinerary-route-heading">
          <span>
            <Route
              size={14}
            />

            Route
          </span>

          <small>
            {
              places.length
            }{" "}
            destinations
          </small>
        </div>

        <div className="explore-itinerary-route">
          {visiblePlaces.map(
            (
              place,
              index
            ) => (
              <Link
                key={`${itinerary.id}-${place.id}`}
                to={`/explore/${place.id}`}
                className="explore-itinerary-stop"
                onClick={
                  onOpenDetails
                }
              >
                <span className="explore-itinerary-stop-number">
                  {
                    index +
                    1
                  }
                </span>

                <span className="explore-itinerary-stop-copy">
                  <strong>
                    {
                      place.name
                    }
                  </strong>

                  <small>
                    <MapPin
                      size={10}
                    />

                    {getPlaceLocation(
                      place
                    )}
                  </small>
                </span>

                <ArrowRight
                  size={14}
                />
              </Link>
            )
          )}
        </div>

        {remainingPlaces >
        0 ? (
          <p className="explore-itinerary-more">
            +{remainingPlaces}{" "}
            more{" "}
            {remainingPlaces ===
            1
              ? "stop"
              : "stops"}
          </p>
        ) : null}

        <div className="explore-itinerary-actions">
          <button
            type="button"
            className="explore-itinerary-plan-button"
            disabled={
              !places.length
            }
            onClick={() =>
              onPlanItinerary(
                itinerary
              )
            }
          >
            <Route
              size={15}
            />

            Plan this trip
          </button>

          {places[0] ? (
            <Link
              to={`/explore/${places[0].id}`}
              className="explore-itinerary-secondary-action"
              onClick={
                onOpenDetails
              }
            >
              First stop

              <ArrowRight
                size={14}
              />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function ExplorePage() {
  const navigate =
    useNavigate();

  const location = useLocation();
  const { exploreReturnSnapshot } = useOutletContext();

  const resultsSectionRef =
    useRef(null);

  const requestSequence =
    useRef(0);

  const restoreCompletedRef =
    useRef(false);

  const [initialSnapshot] = useState(exploreReturnSnapshot);

  const [currentMonth] =
    useState(
      getSriLankaMonthInfo
    );

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    settings,
    setSettings,
  ] = useState({});

  const [
    seasonalPlaces,
    setSeasonalPlaces,
  ] = useState([]);

  const [
    seasonalMonthName,
    setSeasonalMonthName,
  ] = useState(
    currentMonth.name
  );

  const [
    itineraries,
    setItineraries,
  ] = useState([]);

  const [
    places,
    setPlaces,
  ] = useState([]);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const [
    currentPage,
    setCurrentPage,
  ] = useState(
    Math.max(
      1,
      Number(
        initialSnapshot?.page ||
          1
      )
    )
  );

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    initialSnapshot?.activeTab ||
      "places"
  );

  const [
    search,
    setSearch,
  ] = useState(
    initialSnapshot?.search ||
      ""
  );

  const [
    searchFocused,
    setSearchFocused,
  ] = useState(false);

  const [
    filterSearchFocused,
    setFilterSearchFocused,
  ] = useState(false);

  const [
    category,
    setCategory,
  ] = useState(
    initialSnapshot?.category ||
      "all"
  );

  const [
    region,
    setRegion,
  ] = useState(
    initialSnapshot?.region ||
      "All Regions"
  );

  const [
    budget,
    setBudget,
  ] = useState(
    initialSnapshot?.budget ||
      "All Budgets"
  );

  const [
    sort,
    setSort,
  ] = useState(
    initialSnapshot?.sort ||
      "recommended"
  );

  const [
    mobileFiltersOpen,
    setMobileFiltersOpen,
  ] = useState(false);

  const [
    savedPlaces,
    setSavedPlaces,
  ] = useState(
    readTripItems
  );

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const [
    placesLoading,
    setPlacesLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    notice,
    setNotice,
  ] = useState("");


  /* =========================================================
     SETTINGS
  ========================================================= */

  const regions =
    useMemo(() => {
      const values =
        Array.isArray(
          settings?.sri_lanka_regions
        )
          ? settings.sri_lanka_regions.filter(
              Boolean
            )
          : [];

      if (!values.length) {
        return [
          "All Regions",
        ];
      }

      return values.includes(
        "All Regions"
      )
        ? values
        : [
            "All Regions",
            ...values,
          ];
    }, [settings]);


  const budgets =
    useMemo(() => {
      const targets =
        settings?.budget_daily_targets;

      const values =
        targets &&
        typeof targets ===
          "object"
          ? Object.keys(
              targets
            )
          : [];

      return [
        "All Budgets",

        ...values.filter(
          (item) =>
            item !==
            "All Budgets"
        ),
      ];
    }, [settings]);


  const categoryOptions =
    useMemo(() => {
      const source =
        Array.isArray(
          categories
        )
          ? categories
          : [];

      const hasAll =
        source.some(
          (item) =>
            String(
              item.slug ||
                item.id
            ).toLowerCase() ===
            "all"
        );

      if (hasAll) {
        return source;
      }

      return [
        {
          slug: "all",
          label:
            "All places",
          icon: null,
        },

        ...source,
      ];
    }, [categories]);


  const activeCategoryLabel =
    useMemo(() => {
      if (
        category === "all"
      ) {
        return "";
      }

      const selected =
        categoryOptions.find(
          (item) =>
            String(
              item.slug ||
                item.id
            ) ===
            String(
              category
            )
        );

      return (
        selected?.label ||
        String(
          category
        )
      );
    }, [
      category,
      categoryOptions,
    ]);


  const savedIds =
    useMemo(
      () =>
        new Set(
          savedPlaces
            .filter(
              (item) =>
                getTripItemCategoryKey(
                  item
                ) ===
                "destinations"
            )
            .map(
              (item) =>
                String(
                  getTripItemSourceId(
                    item
                  )
                )
            )
        ),
      [savedPlaces]
    );


  const activeFilterCount =
    Number(
      category !== "all"
    ) +
    Number(
      region !==
        "All Regions"
    ) +
    Number(
      budget !==
        "All Budgets"
    );


  const hasDiscoveryFilters =
    Boolean(
      search.trim() ||
        activeFilterCount >
          0
    );


  const hasResettableState =
    Boolean(
      hasDiscoveryFilters ||
        sort !==
          "recommended"
    );


  /* =========================================================
     RESULT RANGE
  ========================================================= */

  const resultStart =
    pagination.total > 0
      ? (
          pagination.page -
          1
        ) *
          pagination.limit +
        1
      : 0;


  const resultEnd =
    pagination.total > 0
      ? Math.min(
          pagination.page *
            pagination.limit,

          pagination.total
        )
      : 0;


  /* =========================================================
     FILTER CHIPS
  ========================================================= */

  const activeFilterChips =
    useMemo(() => {
      const chips = [];

      if (
        search.trim()
      ) {
        chips.push({
          key: "search",

          label:
            `Search: ${search.trim()}`,
        });
      }

      if (
        category !== "all" &&
        activeCategoryLabel
      ) {
        chips.push({
          key:
            "category",

          label:
            activeCategoryLabel,
        });
      }

      if (
        region !==
        "All Regions"
      ) {
        chips.push({
          key:
            "region",

          label:
            region,
        });
      }

      if (
        budget !==
        "All Budgets"
      ) {
        chips.push({
          key:
            "budget",

          label:
            `${budget} budget`,
        });
      }

      return chips;
    }, [
      search,
      category,
      activeCategoryLabel,
      region,
      budget,
    ]);


  /* =========================================================
     SEARCH SUGGESTIONS
  ========================================================= */

  const searchSuggestions =
    useMemo(() => {
      const query =
        search.trim();

      if (
        query.length < 2
      ) {
        return [];
      }

      return [
        ...places,
      ]
        .sort(
          (
            a,
            b
          ) => {
            const scoreDifference =
              getSuggestionScore(
                a,
                query
              ) -
              getSuggestionScore(
                b,
                query
              );

            if (
              scoreDifference !==
              0
            ) {
              return scoreDifference;
            }

            if (
              Boolean(
                a.featured
              ) !==
              Boolean(
                b.featured
              )
            ) {
              return a.featured
                ? -1
                : 1;
            }

            return String(
              a.name || ""
            ).localeCompare(
              String(
                b.name || ""
              )
            );
          }
        )
        .slice(
          0,
          6
        );
    }, [
      places,
      search,
    ]);


  const showSuggestions =
    searchFocused &&
    search.trim().length >=
      2;


  const showFilterSuggestions =
    filterSearchFocused &&
    search.trim().length >=
      2;


  /* =========================================================
     SAVE RETURN POSITION
  ========================================================= */

  const rememberExplorePosition =
    (eventOrPath) => {
      // Modified clicks open another browsing context and must not create a ticket.
      if (typeof eventOrPath !== "string" && (eventOrPath?.button > 0 ||
          eventOrPath?.metaKey || eventOrPath?.ctrlKey || eventOrPath?.shiftKey || eventOrPath?.altKey)) return;
      const detailPath = typeof eventOrPath === "string" ? eventOrPath :
        new URL(eventOrPath.currentTarget.href).pathname;
      exploreReturn.save(location.key, detailPath, {
        restore: true,
        scrollY:
          window.scrollY,

        page:
          currentPage,

        activeTab,

        search,

        category,

        region,

        budget,

        sort,
      });
    };


  /* =========================================================
     RESULTS SCROLL
  ========================================================= */

  const scrollToResults =
    (
      behavior =
        "smooth"
    ) => {
      window.setTimeout(
        () => {
          if (
            !resultsSectionRef.current
          ) {
            return;
          }

          const navbarOffset =
            90;

          const top =
            resultsSectionRef.current
              .getBoundingClientRect()
              .top +
            window.scrollY -
            navbarOffset;

          window.scrollTo({
            top:
              Math.max(
                0,
                top
              ),

            left: 0,

            behavior,
          });
        },
        70
      );
    };


  /* =========================================================
     LOAD BASE DATA
  ========================================================= */

  useEffect(() => {
    const loadBaseData =
      async () => {
        try {
          setInitialLoading(
            true
          );

          setError("");

          const [
            categoryData,
            settingsData,
            seasonalData,
            itineraryData,
          ] =
            await Promise.all([
              getExploreCategories(),

              getExploreSettings(),

              getSeasonalPlaces(
                currentMonth.number
              ),

              getExploreItineraries(),
            ]);

          setCategories(
            categoryData ||
              []
          );

          setSettings(
            settingsData ||
              {}
          );

          setSeasonalPlaces(
            seasonalData
              ?.places ||
              []
          );

          setSeasonalMonthName(
            seasonalData
              ?.monthName ||
              currentMonth.name
          );

          setItineraries(
            itineraryData ||
              []
          );
        } catch (
          loadError
        ) {
          setError(
            loadError.response
              ?.data
              ?.message ||
              "Failed to load Explore data"
          );
        } finally {
          setInitialLoading(
            false
          );
        }
      };

    loadBaseData();
  }, [
    currentMonth.name,
    currentMonth.number,
  ]);


  /* =========================================================
     LOAD CURRENT PAGE
  ========================================================= */

  useEffect(() => {
    const requestId =
      requestSequence.current +
      1;

    requestSequence.current =
      requestId;

    const timer =
      window.setTimeout(
        async () => {
          try {
            setPlacesLoading(
              true
            );

            setError("");

            const result =
              await getExploreFeed({
                q:
                  search.trim() ||
                  undefined,

                category,

                region,

                budget,

                sort,

                page:
                  currentPage,

                limit: 12,
              });

            if (
              requestSequence.current !==
              requestId
            ) {
              return;
            }

            if (
              result.pagination
                ?.totalPages >
                0 &&
              currentPage >
                result.pagination
                  .totalPages
            ) {
              setCurrentPage(
                result.pagination
                  .totalPages
              );

              return;
            }

            setPlaces(
              result.places ||
                []
            );

            setPagination(
              result.pagination ||
                {
                  page:
                    currentPage,

                  limit: 12,

                  total:
                    result.places
                      ?.length ||
                    0,

                  totalPages:
                    1,

                  hasMore:
                    false,
                }
            );
          } catch (
            loadError
          ) {
            if (
              requestSequence.current !==
              requestId
            ) {
              return;
            }

            setError(
              loadError.response
                ?.data
                ?.message ||
                "Failed to load places"
            );
          } finally {
            if (
              requestSequence.current ===
              requestId
            ) {
              setPlacesLoading(
                false
              );
            }
          }
        },
        260
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    search,
    category,
    region,
    budget,
    sort,
    currentPage,
  ]);


  /* =========================================================
     RESTORE DETAIL RETURN POSITION
  ========================================================= */

  useEffect(() => {
    const snapshot =
      initialSnapshot;

    if (
      !snapshot?.restore ||
      restoreCompletedRef.current ||
      initialLoading ||
      placesLoading
    ) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: Math.max(0, Number(snapshot.scrollY) || 0), left: 0, behavior: "instant" });
      restoreCompletedRef.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialSnapshot, initialLoading, placesLoading, places.length]);


  /* =========================================================
     SAVED ITEMS
  ========================================================= */

  useEffect(() => {
    const refreshSavedPlaces =
      () =>
        setSavedPlaces(
          readTripItems()
        );

    window.addEventListener(
      "storage",
      refreshSavedPlaces
    );

    window.addEventListener(
      SAVED_TRIP_EVENT,
      refreshSavedPlaces
    );

    return () => {
      window.removeEventListener(
        "storage",
        refreshSavedPlaces
      );

      window.removeEventListener(
        SAVED_TRIP_EVENT,
        refreshSavedPlaces
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
        2400
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [notice]);


  /* =========================================================
     ACTIONS
  ========================================================= */

  const toggleSavePlace =
    (place) => {
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

      setSavedPlaces(
        result.items
      );

      setNotice(
        result.saved
          ? `${place.name} saved to your trip.`
          : `${place.name} removed.`
      );
    };


  const handleSearchChange =
    (value) => {
      setCurrentPage(1);

      setActiveTab(
        "places"
      );

      setSearch(value);
    };


  const handleCategoryChange =
    (value) => {
      setCurrentPage(1);

      setCategory(
        value
      );
    };


  const handleRegionChange =
    (value) => {
      setCurrentPage(1);

      setRegion(
        value
      );
    };


  const handleBudgetChange =
    (value) => {
      setCurrentPage(1);

      setBudget(
        value
      );
    };


  const handleSortChange =
    (value) => {
      setCurrentPage(1);

      setSort(
        value
      );
    };


  const clearFilters =
    () => {
      setCurrentPage(1);

      setSearch("");

      setCategory(
        "all"
      );

      setRegion(
        "All Regions"
      );

      setBudget(
        "All Budgets"
      );

      setSort(
        "recommended"
      );
    };


  const removeFilterChip =
    (key) => {
      setCurrentPage(1);

      switch (key) {
        case "search":
          setSearch("");
          break;

        case "category":
          setCategory(
            "all"
          );
          break;

        case "region":
          setRegion(
            "All Regions"
          );
          break;

        case "budget":
          setBudget(
            "All Budgets"
          );
          break;

        default:
          break;
      }
    };


  const handlePageChange =
    (nextPage) => {
      if (
        placesLoading ||
        nextPage < 1 ||
        nextPage >
          pagination.totalPages ||
        nextPage ===
          currentPage
      ) {
        return;
      }

      setCurrentPage(
        nextPage
      );

      scrollToResults(
        "smooth"
      );
    };


  const openSuggestion =
    (place) => {
      rememberExplorePosition(`/explore/${place.id}`);

      setSearchFocused(
        false
      );

      navigate(
        `/explore/${place.id}`
      );
    };


  const selectFilterSuggestion =
    (place) => {
      setCurrentPage(1);

      setSearch(
        place.name
      );

      setFilterSearchFocused(
        false
      );

      setActiveTab(
        "places"
      );
    };


  /* =========================================================
     PLAN ITINERARY
  ========================================================= */

  const handlePlanItinerary =
    (itinerary) => {
      const result =
        sendItineraryToPlanner(
          itinerary
        );

      if (!result.ok) {
        setError(
          result.message
        );

        return;
      }

      setError("");

      navigate(
        "/trip-planner"
      );
    };


  /* =========================================================
     FILTER PANEL
  ========================================================= */

  const filterPanel = (
    <aside
      className={`explore-filter-sidebar ${
        mobileFiltersOpen
          ? "is-open"
          : ""
      }`}
    >
      <div className="explore-filter-panel">
        <div className="explore-filter-panel-header">
          <div>
            <span>
              FILTERS
            </span>

            <h3>
              Refine places
            </h3>
          </div>

          <button
            type="button"
            className="explore-mobile-filter-close"
            onClick={() =>
              setMobileFiltersOpen(
                false
              )
            }
            aria-label="Close filters"
          >
            ×
          </button>
        </div>

        <div className="explore-filter-group explore-filter-search-group">
          <span className="explore-filter-label">
            Search
          </span>

          <div className="explore-filter-search-wrapper">
            <div className="explore-filter-search-box">
              <Search
                size={16}
              />

              <input
                type="text"
                value={
                  search
                }
                autoComplete="off"
                placeholder="Place, city or district"
                onFocus={() =>
                  setFilterSearchFocused(
                    true
                  )
                }
                onBlur={() => {
                  window.setTimeout(
                    () =>
                      setFilterSearchFocused(
                        false
                      ),
                    140
                  );
                }}
                onChange={
                  (
                    event
                  ) =>
                    handleSearchChange(
                      event.target
                        .value
                    )
                }
              />

              {search ? (
                <button
                  type="button"
                  className="explore-filter-search-clear"
                  onMouseDown={
                    (
                      event
                    ) =>
                      event.preventDefault()
                  }
                  onClick={() =>
                    handleSearchChange(
                      ""
                    )
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>

            {showFilterSuggestions ? (
              <div className="explore-filter-suggestions">
                {placesLoading ? (
                  <div className="explore-filter-suggestion-status">
                    Searching...
                  </div>
                ) : searchSuggestions.length ? (
                  searchSuggestions.map(
                    (
                      place
                    ) => (
                      <button
                        key={`filter-suggestion-${place.id}`}
                        type="button"
                        className="explore-filter-suggestion-item"
                        onMouseDown={
                          (
                            event
                          ) =>
                            event.preventDefault()
                        }
                        onClick={() =>
                          selectFilterSuggestion(
                            place
                          )
                        }
                      >
                        <ContentImage
                          src={assetUrl(
                            getPlaceImage(
                              place
                            )
                          )}
                          alt=""
                        />

                        <span className="explore-filter-suggestion-copy">
                          <strong>
                            {
                              place.name
                            }
                          </strong>

                          <small>
                            <MapPin
                              size={
                                11
                              }
                            />

                            {getPlaceLocation(
                              place
                            )}
                          </small>
                        </span>

                        <ArrowRight
                          size={14}
                        />
                      </button>
                    )
                  )
                ) : (
                  <div className="explore-filter-suggestion-status">
                    No matching places
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="explore-filter-divider" />

        <div className="explore-filter-group">
          <span className="explore-filter-label">
            Category
          </span>

          <div className="explore-category-list">
            {categoryOptions.map(
              (item) => {
                const key =
                  item.slug ||
                  item.id;

                return (
                  <button
                    key={
                      key
                    }
                    type="button"
                    className={
                      String(
                        category
                      ) ===
                      String(
                        key
                      )
                        ? "is-active"
                        : ""
                    }
                    onClick={() =>
                      handleCategoryChange(
                        String(
                          key
                        )
                      )
                    }
                  >
                    <span className="explore-category-button-copy">
                      {item.icon ? (
                        <span className="explore-category-icon">
                          {
                            item.icon
                          }
                        </span>
                      ) : null}

                      <span>
                        {
                          item.label
                        }
                      </span>
                    </span>

                    <span className="explore-category-indicator" />
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="explore-filter-divider" />

        <div className="explore-filter-group">
          <label className="explore-select-field">
            <span className="explore-filter-label">
              Region
            </span>

            <select
              value={
                region
              }
              onChange={
                (
                  event
                ) =>
                  handleRegionChange(
                    event.target
                      .value
                  )
              }
            >
              {regions.map(
                (item) => (
                  <option
                    key={
                      item
                    }
                    value={
                      item
                    }
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <div className="explore-filter-group">
          <label className="explore-select-field">
            <span className="explore-filter-label">
              Budget
            </span>

            <select
              value={
                budget
              }
              onChange={
                (
                  event
                ) =>
                  handleBudgetChange(
                    event.target
                      .value
                  )
              }
            >
              {budgets.map(
                (item) => (
                  <option
                    key={
                      item
                    }
                    value={
                      item
                    }
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        {hasResettableState ? (
          <button
            type="button"
            className="explore-filter-reset"
            onClick={
              clearFilters
            }
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </aside>
  );


  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="explore-page-final">
      {notice ? (
        <div className="explore-toast">
          {notice}
        </div>
      ) : null}


      {/* =====================================================
          LANDING
      ====================================================== */}

      <section className="explore-landing-final">
        <div className="explore-landing-glow explore-landing-glow-one" />

        <div className="explore-landing-glow explore-landing-glow-two" />

        <div className="explore-landing-content">
          <span className="explore-kicker">
            TRIPLANKA · EXPLORE
          </span>

          <h1>
            Find your next stop in{" "}
            <span>
              Sri Lanka.
            </span>
          </h1>

          <p className="explore-landing-description">
            Search by place, city or district, then save the destinations that fit your trip.
          </p>

          <div className="explore-search-wrapper">
            <div className="explore-search-box">
              <Search
                size={19}
              />

              <input
                value={
                  search
                }
                autoComplete="off"
                placeholder="Search a place, city or district"
                onFocus={() =>
                  setSearchFocused(
                    true
                  )
                }
                onBlur={() => {
                  window.setTimeout(
                    () =>
                      setSearchFocused(
                        false
                      ),
                    140
                  );
                }}
                onChange={
                  (
                    event
                  ) =>
                    handleSearchChange(
                      event.target
                        .value
                    )
                }
              />

              {search ? (
                <button
                  type="button"
                  className="explore-search-clear"
                  onMouseDown={
                    (
                      event
                    ) =>
                      event.preventDefault()
                  }
                  onClick={() =>
                    handleSearchChange(
                      ""
                    )
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>

            {showSuggestions ? (
              <div className="explore-search-suggestions">
                {placesLoading ? (
                  <div className="explore-suggestion-status">
                    Searching destinations...
                  </div>
                ) : searchSuggestions.length ? (
                  <>
                    {searchSuggestions.map(
                      (
                        place
                      ) => (
                        <button
                          key={`suggestion-${place.id}`}
                          type="button"
                          className="explore-suggestion-item"
                          onMouseDown={
                            (
                              event
                            ) =>
                              event.preventDefault()
                          }
                          onClick={() =>
                            openSuggestion(
                              place
                            )
                          }
                        >
                          <ContentImage
                            src={assetUrl(
                              getPlaceImage(
                                place
                              )
                            )}
                            alt=""
                          />

                          <span className="explore-suggestion-copy">
                            <strong>
                              {
                                place.name
                              }
                            </strong>

                            <small>
                              <MapPin
                                size={
                                  12
                                }
                              />

                              {getPlaceLocation(
                                place
                              )}
                            </small>
                          </span>

                          <ArrowRight
                            size={
                              16
                            }
                          />
                        </button>
                      )
                    )}

                    {pagination.total >
                    searchSuggestions.length ? (
                      <button
                        type="button"
                        className="explore-suggestion-all"
                        onMouseDown={
                          (
                            event
                          ) =>
                            event.preventDefault()
                        }
                        onClick={() => {
                          setSearchFocused(
                            false
                          );

                          scrollToResults(
                            "smooth"
                          );
                        }}
                      >
                        View all{" "}
                        {
                          pagination.total
                        }{" "}
                        matching places

                        <ArrowRight
                          size={
                            15
                          }
                        />
                      </button>
                    ) : null}
                  </>
                ) : (
                  <div className="explore-suggestion-status">
                    No matching places found.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="explore-hero-capabilities">
            <span>
              Smart search
            </span>

            <span>
              Seasonal picks
            </span>

            <span>
              Save to trip
            </span>
          </div>
        </div>

        <div
          className="explore-route-decoration"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>


      {/* =====================================================
          BROWSER
      ====================================================== */}

      <section className="explore-browser">
        <div className="explore-mode-switch">
          <button
            type="button"
            className={
              activeTab ===
              "places"
                ? "is-active"
                : ""
            }
            onClick={() => {
              setCurrentPage(
                1
              );

              setActiveTab(
                "places"
              );
            }}
          >
            <MapPin
              size={17}
            />

            Places
          </button>

          <button
            type="button"
            className={
              activeTab ===
              "itineraries"
                ? "is-active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "itineraries"
              )
            }
          >
            <Compass
              size={17}
            />

            Itineraries
          </button>
        </div>


        {activeTab ===
        "places" ? (
          <>
            <MonthlyDiscovery
              places={
                seasonalPlaces
              }
              monthName={
                seasonalMonthName
              }
              onOpenDetails={
                rememberExplorePosition
              }
            />


            {/* =================================================
                RESULTS
            ================================================= */}

            <section
              className="explore-results-section"
              ref={
                resultsSectionRef
              }
            >
              <div className="explore-results-intro">
                <div>
                  <span className="explore-results-eyebrow">
                    EXPLORE ALL PLACES
                  </span>

                  <h2>
                    Find places that fit your trip.
                  </h2>
                </div>

                <button
                  type="button"
                  className="explore-mobile-filter-button"
                  onClick={() =>
                    setMobileFiltersOpen(
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
                    <span>
                      {
                        activeFilterCount
                      }
                    </span>
                  ) : null}
                </button>
              </div>

              <div className="explore-results-layout">
                {
                  filterPanel
                }

                <div className="explore-results-main">
                  <div className="explore-results-toolbar">
                    <div className="explore-results-count">
                      <strong>
                        {pagination.total.toLocaleString()}
                      </strong>

                      <span>
                        {pagination.total ===
                        1
                          ? "place"
                          : "places"}
                      </span>
                    </div>

                    <label className="explore-sort-control">
                      <span>
                        Sort by
                      </span>

                      <select
                        value={
                          sort
                        }
                        onChange={
                          (
                            event
                          ) =>
                            handleSortChange(
                              event.target
                                .value
                            )
                        }
                      >
                        <option value="recommended">
                          Recommended
                        </option>

                        <option value="name">
                          Name A-Z
                        </option>

                        <option value="cost">
                          Lowest estimated cost
                        </option>

                        <option value="budgetLow">
                          Budget: low first
                        </option>

                        <option value="budgetHigh">
                          Budget: high first
                        </option>
                      </select>
                    </label>
                  </div>


                  {activeFilterChips.length ? (
                    <div className="explore-active-filters">
                      {activeFilterChips.map(
                        (
                          chip
                        ) => (
                          <button
                            key={
                              chip.key
                            }
                            type="button"
                            onClick={() =>
                              removeFilterChip(
                                chip.key
                              )
                            }
                          >
                            <span>
                              {
                                chip.label
                              }
                            </span>

                            <span
                              className="explore-filter-chip-close"
                              aria-hidden="true"
                            >
                              ×
                            </span>
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        className="explore-active-clear"
                        onClick={
                          clearFilters
                        }
                      >
                        Clear all
                      </button>
                    </div>
                  ) : null}


                  {error ? (
                    <div className="explore-state explore-state-error">
                      {error}
                    </div>
                  ) : null}


                  {initialLoading ||
                  placesLoading ? (
                    <div className="explore-card-grid">
                      {Array.from({
                        length:
                          6,
                      }).map(
                        (
                          _,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                            className="explore-card-skeleton"
                          />
                        )
                      )}
                    </div>
                  ) : places.length ? (
                    <>
                      <div className="explore-card-grid">
                        {places.map(
                          (
                            place
                          ) => (
                            <PlaceCard
                              key={
                                place.id
                              }
                              place={
                                place
                              }
                              saved={savedIds.has(
                                String(
                                  place.id
                                )
                              )}
                              onToggleSave={
                                toggleSavePlace
                              }
                              onOpenDetails={
                                rememberExplorePosition
                              }
                            />
                          )
                        )}
                      </div>


                      {/* =======================================
                          PAGINATION
                      ======================================== */}

                      <div className="explore-pagination-area">
                        <p className="explore-pagination-summary">
                          Showing{" "}

                          <strong>
                            {
                              resultStart
                            }
                          </strong>

                          –

                          <strong>
                            {
                              resultEnd
                            }
                          </strong>{" "}

                          of{" "}

                          <strong>
                            {pagination.total.toLocaleString()}
                          </strong>{" "}

                          places
                        </p>

                        {pagination.totalPages >
                        1 ? (
                          <div className="explore-pagination">
                            <button
                              type="button"
                              className="explore-page-arrow"
                              disabled={
                                pagination.page <=
                                  1 ||
                                placesLoading
                              }
                              onClick={() =>
                                handlePageChange(
                                  pagination.page -
                                    1
                                )
                              }
                              aria-label="Previous page"
                              title="Previous page"
                            >
                              <ChevronLeft
                                size={
                                  20
                                }
                              />
                            </button>

                            <div className="explore-page-position">
                              <span>
                                Page
                              </span>

                              <strong>
                                {
                                  pagination.page
                                }
                              </strong>

                              <span>
                                of{" "}
                                {
                                  pagination.totalPages
                                }
                              </span>
                            </div>

                            <button
                              type="button"
                              className="explore-page-arrow"
                              disabled={
                                !pagination.hasMore ||
                                placesLoading
                              }
                              onClick={() =>
                                handlePageChange(
                                  pagination.page +
                                    1
                                )
                              }
                              aria-label="Next page"
                              title="Next page"
                            >
                              <ChevronRight
                                size={
                                  20
                                }
                              />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="explore-state explore-empty-results">
                      <Compass
                        size={28}
                      />

                      <strong>
                        No places match these filters.
                      </strong>

                      <span>
                        Try another search or filter.
                      </span>

                      {hasResettableState ? (
                        <button
                          type="button"
                          onClick={
                            clearFilters
                          }
                        >
                          Clear filters
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          /* ===================================================
             ITINERARIES — SET 9.6
          =================================================== */

          <section className="explore-content-section explore-itinerary-section">
            <div className="explore-section-heading">
              <div>
                <span>
                  TRIP IDEAS
                </span>

                <h2>
                  Start with a ready-made route.
                </h2>
              </div>

              <p>
                {itineraries.length
                  ? `${itineraries.length} published itineraries`
                  : "Published itineraries"}
              </p>
            </div>


            {error ? (
              <div className="explore-state explore-state-error">
                {error}
              </div>
            ) : null}


            {initialLoading ? (
              <div className="explore-itinerary-grid">
                {Array.from({
                  length: 3,
                }).map(
                  (
                    _,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="explore-card-skeleton explore-itinerary-skeleton"
                    />
                  )
                )}
              </div>
            ) : itineraries.length ? (
              <div className="explore-itinerary-grid">
                {itineraries.map(
                  (
                    itinerary
                  ) => (
                    <ItineraryCard
                      key={
                        itinerary.id
                      }
                      itinerary={
                        itinerary
                      }
                      onOpenDetails={
                        rememberExplorePosition
                      }
                      onPlanItinerary={
                        handlePlanItinerary
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div className="explore-state">
                <Compass
                  size={27}
                />

                <strong>
                  No itineraries are published yet.
                </strong>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}