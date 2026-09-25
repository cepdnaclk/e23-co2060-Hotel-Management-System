import { useEffect, useMemo, useRef, useState } from "react";

import { Link, useSearchParams } from "react-router-dom";

import {
  BedDouble,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import api from "../api/api";

import ContentImage from "../components/ContentImage";

import { assetUrl as toImageUrl } from "../utils/assetUrl";

import {
  readTripItems,
  SAVED_TRIP_EVENT,
  toggleTripItem,
} from "../utils/tripBasket";

import "../styles/hotels.css";

const HOTELS_PER_PAGE = 10;

const parseMoney = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "")
    .trim();

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const formatPrice = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  return Math.round(Math.max(0, numericValue)).toLocaleString("en-LK");
};

const getPropertyPrice = (property) => {
  return parseMoney(property?.starting_price);
};

const getPriceCeiling = (items) => {
  return items.reduce(
    (highest, property) => Math.max(highest, getPropertyPrice(property)),
    0
  );
};

const getDistrictForCity = (items, city) => {
  const normalizedCity = String(city || "").trim().toLowerCase();

  if (!normalizedCity) return "";

  const matchingProperty = items.find(
    (property) =>
      String(property.city || "").trim().toLowerCase() === normalizedCity &&
      property.district
  );

  return matchingProperty?.district || "";
};

function HotelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);

  const [savedTripItems, setSavedTripItems] = useState(readTripItems);

  const [notice, setNotice] = useState("");

  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("list");

  const [currentPage, setCurrentPage] = useState(1);

  const resultsTopRef = useRef(null);

  const [filters, setFilters] = useState({
    city: searchParams.get("city") || "",
    district: "",
    type: "",
    search: searchParams.get("search") || "",
    minPrice: 0,
    maxPrice: 0,
    hasRoomsOnly: false,
    sort: "recommended",
  });

  useEffect(() => {
    let cancelled = false;

    const loadHotels = async () => {
      try {
        setLoading(true);

        const response = await api.get("/properties");

        const rows = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        const approvedHotels = rows
          .filter(
            (property) =>
              !property.status ||
              String(property.status).toLowerCase() === "approved"
          )
          .map((property) => ({
            ...property,
            starting_price: getPropertyPrice(property),
            total_rooms_count: Number(property.total_rooms_count || 0),
          }));

        const initialPriceCeiling = getPriceCeiling(approvedHotels);

        if (cancelled) return;

        setProperties(approvedHotels);

        setFilters((previous) => ({
          ...previous,
          minPrice: 0,
          maxPrice: initialPriceCeiling,
        }));
      } catch (error) {
        console.error("Load hotels error:", error);

        if (!cancelled) {
          setProperties([]);

          setFilters((previous) => ({
            ...previous,
            minPrice: 0,
            maxPrice: 0,
          }));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadHotels();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const refreshSavedItems = () => {
      setSavedTripItems(readTripItems());
    };

    window.addEventListener("storage", refreshSavedItems);
    window.addEventListener(SAVED_TRIP_EVENT, refreshSavedItems);

    return () => {
      window.removeEventListener("storage", refreshSavedItems);
      window.removeEventListener(SAVED_TRIP_EVENT, refreshSavedItems);
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => setNotice(""), 2500);

    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    setCurrentPage(1);

    const city = searchParams.get("city") || "";
    const cityDistrict = getDistrictForCity(properties, city);

    setFilters((previous) => ({
      ...previous,
      city,
      district: city ? cityDistrict : previous.district,
      search: searchParams.get("search") || "",
    }));
  }, [searchParams, properties]);

  const destinationProperties = useMemo(() => {
    if (!filters.district) return properties;

    const selectedDistrict = filters.district.toLowerCase();

    return properties.filter(
      (property) =>
        String(property.district || "").toLowerCase() === selectedDistrict
    );
  }, [properties, filters.district]);

  const destinationOptions = useMemo(() => {
    const countMap = destinationProperties.reduce((accumulator, property) => {
      if (!property.city) return accumulator;

      accumulator[property.city] = (accumulator[property.city] || 0) + 1;

      return accumulator;
    }, {});

    return Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [destinationProperties]);

  const districtOptions = useMemo(() => {
    const countMap = properties.reduce((accumulator, property) => {
      if (!property.district) return accumulator;

      accumulator[property.district] =
        (accumulator[property.district] || 0) + 1;

      return accumulator;
    }, {});

    return Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [properties]);

  const typeOptions = useMemo(() => {
    const countMap = properties.reduce((accumulator, property) => {
      const type = property.property_type || "Hotel";

      accumulator[type] = (accumulator[type] || 0) + 1;

      return accumulator;
    }, {});

    return Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [properties]);

  const priceCeiling = useMemo(
    () => getPriceCeiling(properties),
    [properties]
  );

  const priceContextProperties = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return properties.filter((property) => {
      const searchMatches =
        !query ||
        [
          property.name,
          property.city,
          property.district,
          property.address,
          property.description,
          property.property_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const cityMatches =
        !filters.city ||
        property.city?.toLowerCase() === filters.city.toLowerCase();

      const districtMatches =
        !filters.district ||
        property.district?.toLowerCase() === filters.district.toLowerCase();

      const propertyType = property.property_type || "Hotel";

      const typeMatches =
        !filters.type ||
        propertyType.toLowerCase() === filters.type.toLowerCase();

      const roomMatches =
        !filters.hasRoomsOnly || Number(property.total_rooms_count || 0) > 0;

      return (
        searchMatches &&
        cityMatches &&
        districtMatches &&
        typeMatches &&
        roomMatches
      );
    });
  }, [
    properties,
    filters.search,
    filters.city,
    filters.district,
    filters.type,
    filters.hasRoomsOnly,
  ]);

  const selectedMinPrice = filters.minPrice;
  const selectedMaxPrice = filters.maxPrice;

  const budgetPresets = useMemo(() => {
    if (priceCeiling <= 0) {
      return [
        {
          id: "all",
          label: "All budgets",
          min: 0,
          max: 0,
        },
      ];
    }

    const presets = [
      {
        id: "all",
        label: "All budgets",
        min: 0,
        max: priceCeiling,
      },
    ];

    if (priceCeiling > 0) {
      presets.push({
        id: "budget",
        label: "Budget",
        min: 0,
        max: Math.min(15000, priceCeiling),
      });
    }

    if (priceCeiling > 15000) {
      presets.push({
        id: "comfort",
        label: "Comfort",
        min: 15000,
        max: Math.min(30000, priceCeiling),
      });
    }

    if (priceCeiling > 30000) {
      presets.push({
        id: "premium",
        label: "Premium",
        min: 30000,
        max: priceCeiling,
      });
    }

    return presets.filter((preset) => preset.min <= preset.max);
  }, [priceCeiling]);

  const filteredProperties = useMemo(() => {
    const matched = priceContextProperties.filter((property) => {
      const price = getPropertyPrice(property);

      return price >= selectedMinPrice && price <= selectedMaxPrice;
    });

    return [...matched].sort((a, b) => {
      const priceA = getPropertyPrice(a);
      const priceB = getPropertyPrice(b);
      const roomsA = Number(a.total_rooms_count || 0);
      const roomsB = Number(b.total_rooms_count || 0);

      if (filters.sort === "priceLow") return priceA - priceB;
      if (filters.sort === "priceHigh") return priceB - priceA;
      if (filters.sort === "rooms") return roomsB - roomsA;

      if (filters.sort === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }

      if (filters.sort === "name") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }

      return roomsB - roomsA || priceA - priceB;
    });
  }, [
    priceContextProperties,
    filters.sort,
    selectedMinPrice,
    selectedMaxPrice,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProperties.length / HOTELS_PER_PAGE)
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * HOTELS_PER_PAGE;

    return filteredProperties.slice(startIndex, startIndex + HOTELS_PER_PAGE);
  }, [filteredProperties, currentPage]);

  const visibleStart =
    filteredProperties.length === 0
      ? 0
      : (currentPage - 1) * HOTELS_PER_PAGE + 1;

  const visibleEnd = Math.min(
    currentPage * HOTELS_PER_PAGE,
    filteredProperties.length
  );

  const updateFilters = (updates) => {
    setCurrentPage(1);

    setFilters((previous) => {
      const next = {
        ...previous,
        ...updates,
      };

      if (updates.city !== undefined || updates.search !== undefined) {
        const params = new URLSearchParams(searchParams);

        if (updates.city !== undefined) {
          if (next.city) params.set("city", next.city);
          else params.delete("city");
        }

        if (updates.search !== undefined) {
          if (next.search.trim()) params.set("search", next.search.trim());
          else params.delete("search");
        }

        setSearchParams(params);
      }

      return next;
    });
  };

  const handleDestinationSelect = (city) => {
    if (!city) {
      updateFilters({ city: "" });
      return;
    }

    updateFilters({
      city,
      district: getDistrictForCity(properties, city),
    });
  };

  const handleDistrictChange = (event) => {
    const district = event.target.value;

    if (!district) {
      updateFilters({ district: "", city: "" });
      return;
    }

    const cityBelongsToDistrict = properties.some(
      (property) =>
        String(property.city || "").toLowerCase() ===
          filters.city.toLowerCase() &&
        String(property.district || "").toLowerCase() ===
          district.toLowerCase()
    );

    updateFilters({
      district,
      city: cityBelongsToDistrict ? filters.city : "",
    });
  };

  const handleMinPriceChange = (event) => {
    const requested = Number(event.target.value);

    setCurrentPage(1);
    setFilters((previous) => {
      const safeValue = Math.min(
        Math.max(Number.isFinite(requested) ? requested : 0, 0),
        previous.maxPrice
      );

      return {
        ...previous,
        minPrice: safeValue,
      };
    });
  };

  const handleMaxPriceChange = (event) => {
    const requested = Number(event.target.value);

    setCurrentPage(1);
    setFilters((previous) => {
      const safeValue = Math.max(
        previous.minPrice,
        Math.min(
          Number.isFinite(requested) ? requested : priceCeiling,
          priceCeiling
        )
      );

      return {
        ...previous,
        maxPrice: safeValue,
      };
    });
  };

  const handleClearFilters = () => {
    setFilters({
      city: "",
      district: "",
      type: "",
      search: "",
      minPrice: 0,
      maxPrice: priceCeiling,
      hasRoomsOnly: false,
      sort: "recommended",
    });

    setSearchParams({});
    setCurrentPage(1);
  };

  const applyBudgetPreset = (preset) => {
    updateFilters({
      minPrice: Math.max(0, Math.min(preset.min, priceCeiling)),
      maxPrice: Math.max(0, Math.min(preset.max, priceCeiling)),
    });
  };

  const activeChips = [
    filters.search && `Search: ${filters.search}`,
    filters.city && `City: ${filters.city}`,
    filters.district && `District: ${filters.district}`,
    filters.type && `Type: ${filters.type}`,
    filters.hasRoomsOnly && "Rooms listed",
  ].filter(Boolean);

  const savedTripIds = useMemo(
    () => new Set(savedTripItems.map((item) => String(item.id))),
    [savedTripItems]
  );

  const buildHotelTripItem = (property) => {
    const image = toImageUrl(
      property.main_image || property.logo_url || property.hero_image
    );

    const price = getPropertyPrice(property);

    return {
      id: `hotel-${property.id}`,
      sourceId: property.id,
      tripItemType: "hotel",
      name: property.name,
      city: property.city || "",
      district: property.district || "",
      region: property.property_type || "Hotel",
      image,
      duration: "Stay",
      bestTime: "Check-in day",
      budget:
        price >= 30000 ? "High" : price >= 15000 ? "Medium" : "Low",
      estimatedCost: price,
      shortDescription:
        property.description || "Selected hotel stay for this Sri Lanka trip.",
      link: `/hotels/${property.id}`,
    };
  };

  const handleToggleHotelTrip = (property) => {
    const result = toggleTripItem(buildHotelTripItem(property));

    setSavedTripItems(result.items);

    setNotice(
      result.saved
        ? `${property.name} added to your trip.`
        : `${property.name} removed from your trip.`
    );
  };

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);

    if (safePage === currentPage) return;

    setCurrentPage(safePage);

    window.requestAnimationFrame(() => {
      resultsTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <main className="hotels-page">
      {notice ? <div className="hotels-toast">{notice}</div> : null}

      <header className="hotels-modern-hero">
        <div className="hotels-hero-visual" aria-hidden="true">
          <span className="hotels-hero-glow hotels-hero-glow-left" />
          <span className="hotels-hero-glow hotels-hero-glow-right" />

          <div className="hotels-hero-watermark">
            <svg
              className="hotels-hero-resort-illustration"
              viewBox="0 0 360 240"
              role="presentation"
            >
              <circle className="hotels-resort-sun" cx="306" cy="38" r="22" />

              <path
                className="hotels-resort-palm-trunk"
                d="M62 158 C65 125 63 102 55 80"
              />
              <path
                className="hotels-resort-palm-leaf"
                d="M55 81 C38 66 23 69 16 76 C31 76 43 82 52 91"
              />
              <path
                className="hotels-resort-palm-leaf"
                d="M55 81 C67 61 84 59 95 65 C78 68 67 76 59 90"
              />
              <path
                className="hotels-resort-palm-leaf"
                d="M55 81 C49 61 55 49 65 43 C66 59 63 70 58 84"
              />

              <path
                className="hotels-resort-palm-trunk"
                d="M298 160 C295 130 297 110 305 91"
              />
              <path
                className="hotels-resort-palm-leaf"
                d="M305 92 C290 77 276 80 269 87 C283 86 295 92 302 101"
              />
              <path
                className="hotels-resort-palm-leaf"
                d="M305 92 C318 75 332 75 342 81 C328 83 317 90 308 101"
              />

              <rect
                className="hotels-resort-sign"
                x="136"
                y="27"
                width="88"
                height="34"
                rx="5"
              />
              <text className="hotels-resort-sign-text" x="180" y="49">
                HOTEL
              </text>

              <path
                className="hotels-resort-building"
                d="M97 64 H263 V157 H97 Z"
              />

              <g className="hotels-resort-windows">
                <rect x="113" y="79" width="27" height="24" rx="4" />
                <rect x="151" y="79" width="27" height="24" rx="4" />
                <rect x="189" y="79" width="27" height="24" rx="4" />
                <rect x="227" y="79" width="20" height="24" rx="4" />
                <rect x="113" y="114" width="27" height="24" rx="4" />
                <rect x="151" y="114" width="27" height="24" rx="4" />
                <rect x="189" y="114" width="27" height="24" rx="4" />
                <rect x="227" y="114" width="20" height="24" rx="4" />
              </g>

              <path
                className="hotels-resort-ground-floor"
                d="M82 143 H278 V180 H82 Z"
              />
              <path
                className="hotels-resort-arch"
                d="M101 178 V165 C101 154 110 148 121 148 C132 148 141 154 141 165 V178"
              />
              <path
                className="hotels-resort-arch"
                d="M159 178 V162 C159 150 168 143 180 143 C192 143 201 150 201 162 V178"
              />
              <path
                className="hotels-resort-arch"
                d="M219 178 V165 C219 154 228 148 239 148 C250 148 259 154 259 165 V178"
              />

              <path
                className="hotels-resort-pool"
                d="M67 221 H293 L270 180 H90 Z"
              />
              <path
                className="hotels-resort-pool-highlight"
                d="M91 207 H269 L260 191 H100 Z"
              />
            </svg>
          </div>
        </div>

        <div className="hotels-hero-copy">
          <span className="hotels-hero-kicker">TRIPLANKA · HOTELS</span>

          <h1>
            Find your <span className="hotels-title-sri-lanka">Sri Lanka</span>{" "}
            <span className="hotels-title-stay">stay.</span>
          </h1>

          <p>Choose a stay that fits your route and budget.</p>

          <div className="hotels-hero-search">
            <Search size={18} aria-hidden="true" />

            <input
              type="search"
              value={filters.search}
              onChange={(event) =>
                updateFilters({ search: event.target.value })
              }
              placeholder="Search hotels, cities or districts"
              aria-label="Search hotels"
            />

            {filters.search ? (
              <button
                type="button"
                onClick={() => updateFilters({ search: "" })}
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="hotels-hero-capabilities">
            <span>Search by destination</span>
            <span>Compare prices</span>
            <span>Add to trip</span>
          </div>
        </div>
      </header>

      <section className="hotels-main-layout">
        <aside className="hotels-filter-card">
          <div className="hotels-filter-heading">
            <div>
              <span className="hotels-section-label">
                <SlidersHorizontal size={14} />
                Filters
              </span>

              <h2>Refine results</h2>
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              className="hotels-reset-button"
            >
              <RotateCcw size={14} />
              Clear
            </button>
          </div>

          <div className="hotels-filter-group">
            <label>Destination</label>

            <div className="hotels-destination-list">
              <button
                type="button"
                onClick={() => handleDestinationSelect("")}
                className={!filters.city ? "active" : ""}
              >
                <span>All destinations</span>
                <small>{destinationProperties.length}</small>
              </button>

              {destinationOptions.map((city) => (
                <button
                  type="button"
                  key={city.name}
                  onClick={() => handleDestinationSelect(city.name)}
                  className={filters.city === city.name ? "active" : ""}
                >
                  <span>{city.name}</span>
                  <small>{city.count}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="hotels-filter-group">
            <label htmlFor="hotel-district">District</label>

            <select
              id="hotel-district"
              value={filters.district}
              onChange={handleDistrictChange}
            >
              <option value="">All districts</option>

              {districtOptions.map((district) => (
                <option value={district.name} key={district.name}>
                  {district.name} ({district.count})
                </option>
              ))}
            </select>
          </div>

          <div className="hotels-filter-group">
            <label>Stay type</label>

            <div className="hotels-choice-grid">
              <button
                type="button"
                onClick={() => updateFilters({ type: "" })}
                className={!filters.type ? "active" : ""}
              >
                All
              </button>

              {typeOptions.map((type) => (
                <button
                  type="button"
                  key={type.name}
                  onClick={() => updateFilters({ type: type.name })}
                  className={filters.type === type.name ? "active" : ""}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          <div className="hotels-filter-group">
            <label>Price range</label>

            <div className="hotels-price-box">
              <div className="hotels-price-control">
                <div className="hotels-price-control-heading">
                  <span>Minimum</span>
                </div>

                <input
                  className="hotels-range-input"
                  type="range"
                  min={0}
                  max={priceCeiling}
                  step="1"
                  value={selectedMinPrice}
                  onInput={handleMinPriceChange}
                  onChange={handleMinPriceChange}
                  disabled={loading || priceCeiling <= 0}
                  aria-label="Minimum hotel price"
                  aria-valuetext={`Rs. ${formatPrice(selectedMinPrice)}`}
                />
              </div>

              <div className="hotels-price-control">
                <div className="hotels-price-control-heading">
                  <span>Maximum</span>
                </div>

                <input
                  className="hotels-range-input"
                  type="range"
                  min={0}
                  max={priceCeiling}
                  step="1"
                  value={selectedMaxPrice}
                  onInput={handleMaxPriceChange}
                  onChange={handleMaxPriceChange}
                  disabled={loading || priceCeiling <= 0}
                  aria-label="Maximum hotel price"
                  aria-valuetext={`Rs. ${formatPrice(selectedMaxPrice)}`}
                />
              </div>
            </div>
          </div>

          <div className="hotels-filter-group">
            <label>Budget</label>

            <div className="hotels-budget-list">
              {budgetPresets.map((preset) => {
                const isActive =
                  selectedMinPrice === preset.min &&
                  selectedMaxPrice === preset.max;

                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => applyBudgetPreset(preset)}
                    className={isActive ? "active" : ""}
                  >
                    {isActive ? <Check size={14} /> : null}
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hotels-filter-group">
            <label>Rooms</label>

            <button
              type="button"
              onClick={() =>
                updateFilters({ hasRoomsOnly: !filters.hasRoomsOnly })
              }
              className={`hotels-availability-toggle ${
                filters.hasRoomsOnly ? "active" : ""
              }`}
              aria-pressed={filters.hasRoomsOnly}
            >
              <span>
                <BedDouble size={16} />
                Rooms listed
              </span>

              <strong>{filters.hasRoomsOnly ? "On" : "Off"}</strong>
            </button>
          </div>
        </aside>

        <div className="hotels-results-column" ref={resultsTopRef}>
          <div className="hotels-results-toolbar">
            <div>
              <span className="hotels-section-label">Hotels</span>
              <h2>{filteredProperties.length} stays found</h2>
            </div>

            <div className="hotels-toolbar-controls">
              <label className="hotels-sort-control">
                <span>Sort by</span>

                <select
                  value={filters.sort}
                  onChange={(event) =>
                    updateFilters({ sort: event.target.value })
                  }
                >
                  <option value="recommended">Recommended</option>
                  <option value="priceLow">Lowest price</option>
                  <option value="priceHigh">Highest price</option>
                  <option value="rooms">Most rooms</option>
                  <option value="newest">Newest</option>
                  <option value="name">Name A-Z</option>
                </select>
              </label>

              <div className="hotels-view-toggle" aria-label="Hotel view style">
                <button
                  type="button"
                  className={viewMode === "list" ? "active" : ""}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  title="List view"
                >
                  <List size={17} />
                </button>

                <button
                  type="button"
                  className={viewMode === "grid" ? "active" : ""}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid2X2 size={17} />
                </button>
              </div>
            </div>
          </div>

          {activeChips.length > 0 ? (
            <div className="hotels-active-filters">
              {activeChips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
          ) : null}

          {loading ? (
            <EmptyState title="Loading hotels..." />
          ) : filteredProperties.length === 0 ? (
            <EmptyState
              title="No hotels found"
              description="Try changing your filters or search."
              actionLabel="Reset filters"
              onAction={handleClearFilters}
            />
          ) : (
            <>
              <div
                className={
                  viewMode === "grid" ? "hotels-grid-view" : "hotels-list-view"
                }
              >
                {paginatedProperties.map((property) => (
                  <HotelCard
                    key={property.id}
                    property={property}
                    saved={savedTripIds.has(`hotel-${property.id}`)}
                    onToggleTrip={handleToggleHotelTrip}
                  />
                ))}
              </div>

              <div className="hotels-pagination">
                <p className="hotels-pagination-summary">
                  Showing <strong>{visibleStart}</strong>–
                  <strong>{visibleEnd}</strong> of{" "}
                  <strong>{filteredProperties.length}</strong> hotels
                </p>

                <div className="hotels-pagination-control">
                  <button
                    type="button"
                    className="hotels-pagination-arrow"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous hotel page"
                  >
                    <ChevronLeft size={21} />
                  </button>

                  <div className="hotels-pagination-page">
                    Page <strong>{currentPage}</strong> of{" "}
                    <strong>{totalPages}</strong>
                  </div>

                  <button
                    type="button"
                    className="hotels-pagination-arrow"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next hotel page"
                  >
                    <ChevronRight size={21} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function HotelCard({ property, saved, onToggleTrip }) {
  const imageUrl = toImageUrl(
    property.main_image || property.logo_url || property.hero_image
  );

  const price = getPropertyPrice(property);

  const totalRooms = Number(property.total_rooms_count || 0);

  const location = [property.city, property.district]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="hotels-result-card">
      <Link
        to={`/hotels/${property.id}`}
        className="hotels-card-media"
        aria-label={`View ${property.name}`}
      >
        {imageUrl ? (
          <ContentImage
            src={imageUrl}
            alt={property.name}
            className="hotels-card-image"
          />
        ) : (
          <div className="hotels-image-placeholder">
            <Building2 size={36} />
            <strong>{property.name}</strong>
          </div>
        )}
      </Link>

      <div className="hotels-card-body">
        <div className="hotels-card-main">
          <div className="hotels-card-meta">
            {property.property_type ? (
              <span>{property.property_type}</span>
            ) : null}

            {totalRooms > 0 ? <span>{totalRooms} rooms</span> : null}
          </div>

          <Link
            to={`/hotels/${property.id}`}
            className="hotels-card-title-link"
          >
            <h3>{property.name}</h3>
          </Link>

          {location ? (
            <p className="hotels-card-location">
              <MapPin size={15} />
              {location}
            </p>
          ) : null}

          {property.description ? (
            <p className="hotels-card-description">{property.description}</p>
          ) : null}
        </div>

        <div className="hotels-card-side">
          <div className="hotels-price-copy">
            <span>From</span>

            <strong>
              {price > 0 ? `Rs. ${formatPrice(price)}` : "Contact hotel"}
            </strong>

            {price > 0 ? <small>per night</small> : null}
          </div>

          <div className="hotels-card-actions">
            <button
              type="button"
              className={`hotels-save-button ${saved ? "saved" : ""}`}
              onClick={() => onToggleTrip(property)}
            >
              {saved ? <Check size={16} /> : <Plus size={16} />}
              {saved ? "Saved" : "Add to trip"}
            </button>

            <Link
              className="hotels-details-button"
              to={`/hotels/${property.id}`}
            >
              View details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="hotels-empty-state">
      <Building2 size={32} />

      <h3>{title}</h3>

      {description ? <p>{description}</p> : null}

      {actionLabel && onAction ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default HotelsPage;
