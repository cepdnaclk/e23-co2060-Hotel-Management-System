import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

const emptyPlace = {
  id: null,
  name: "",
  city: "",
  district: "",
  region: "Cultural Triangle",
  category_id: "",
  image_url: "",
  short_description: "",
  full_description: "",
  duration: "",
  best_time: "",
  best_months: [],
  budget: "Medium",
  budget_score: 2,
  estimated_cost: 0,
  lat: "",
  lng: "",
  featured: false,
  vibe: "",
  tags: [],
  experiences: [],
  highlights: [],
  nearby_places: [],
  tips: [],
  opening_hours: "",
  entry_fee: "",
  facilities: [],
  status: "published",
  sort_order: 0,
};

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const regionOptions = ["Cultural Triangle", "Hill Country", "South Coast", "West Coast", "East Coast", "Northern Region"];
const budgetOptions = ["Low", "Medium", "High"];
const rawBaseUrl = api.defaults.baseURL || "http://localhost:5000/api";
const serverBaseUrl = rawBaseUrl.replace(/\/api\/?$/, "");

const assetUrl = (url) => {
  if (!url) return "";
  if (String(url).startsWith("http")) return url;
  return `${serverBaseUrl}${url}`;
};

const toCoordinateNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const hasMapCoordinates = (lat, lng) => {
  return toCoordinateNumber(lat) !== null && toCoordinateNumber(lng) !== null;
};

const getOpenStreetMapEmbedUrl = (lat, lng) => {
  const latitude = toCoordinateNumber(lat) ?? 7.8731;
  const longitude = toCoordinateNumber(lng) ?? 80.7718;
  const zoomSize = hasMapCoordinates(lat, lng) ? 0.018 : 2.2;
  const left = longitude - zoomSize;
  const right = longitude + zoomSize;
  const bottom = latitude - zoomSize;
  const top = latitude + zoomSize;
  const marker = hasMapCoordinates(lat, lng) ? `&marker=${latitude}%2C${longitude}` : "";

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik${marker}`;
};

const getDirectionsUrl = (lat, lng) => {
  if (!hasMapCoordinates(lat, lng)) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
};

const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
      }
    }

    return trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
  }

  return [];
};

const cleanStringArray = (value) => {
  return ensureArray(value)
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") return String(item.title || item.name || item.label || "").trim();
      return String(item || "").trim();
    })
    .filter(Boolean);
};

const cleanObjectArray = (value, fields) => {
  return ensureArray(value)
    .map((item) => {
      const objectItem = item && typeof item === "object" ? item : { [fields[0].name]: String(item || "") };
      const cleaned = {};

      fields.forEach((field) => {
        const rawValue = objectItem[field.name];
        if (field.type === "number") {
          const numberValue = Number(rawValue || 0);
          cleaned[field.name] = Number.isNaN(numberValue) ? 0 : numberValue;
        } else {
          cleaned[field.name] = String(rawValue || "").trim();
        }
      });

      return cleaned;
    })
    .filter((item) => fields.some((field) => String(item[field.name] || "").trim() !== ""));
};

const getPhotoRecords = (place) => {
  const rawPhotos = place?.photos || place?.imageRecords || place?.image_records || [];

  if (Array.isArray(rawPhotos) && rawPhotos.length > 0) {
    return rawPhotos.map((photo, index) => {
      const imageUrl = photo.image_url || photo.image || photo.url || "";
      return {
        id: photo.id || null,
        place_id: photo.place_id || place?.id || null,
        image_url: imageUrl,
        image: imageUrl,
        alt_text: photo.alt_text || `${place?.name || "Place"} photo ${index + 1}`,
        is_main: Boolean(photo.is_main),
        sort_order: photo.sort_order || index + 1,
      };
    });
  }

  const urls = ensureArray(place?.images).length
    ? ensureArray(place.images)
    : place?.image || place?.image_url
      ? [place.image || place.image_url]
      : [];

  return urls.filter(Boolean).map((url, index) => ({
    id: null,
    place_id: place?.id || null,
    image_url: url,
    image: url,
    alt_text: `${place?.name || "Place"} photo ${index + 1}`,
    is_main: index === 0,
    sort_order: index + 1,
  }));
};

const experienceFields = [
  { name: "title", label: "Experience title", placeholder: "Sunrise Climb" },
  { name: "description", label: "Description", placeholder: "Describe what visitors can do here", textarea: true },
  { name: "duration", label: "Duration", placeholder: "2-3 hours" },
  { name: "cost", label: "Cost", placeholder: "8500", type: "number" },
];

const highlightFields = [
  { name: "icon", label: "Icon", placeholder: "🏛️" },
  { name: "title", label: "Highlight title", placeholder: "UNESCO World Heritage" },
  { name: "description", label: "Description", placeholder: "Why this place is special", textarea: true },
];

const nearbyPlaceFields = [
  { name: "name", label: "Place name", placeholder: "Pidurangala Rock" },
  { name: "distance", label: "Distance", placeholder: "1.5 km" },
  { name: "type", label: "Type", placeholder: "Viewpoint" },
];

const placeForForm = (place, categories) => ({
  ...emptyPlace,
  ...place,
  category_id: place.categoryId || place.category_id || categories.find((c) => c.slug === place.category)?.id || "",
  image_url: place.image || place.image_url || "",
  short_description: place.shortDescription || place.short_description || "",
  full_description: place.fullDescription || place.full_description || "",
  best_time: place.bestTime || place.best_time || "",
  best_months: place.bestMonths || place.best_months || [],
  budget_score: place.budgetScore || place.budget_score || 2,
  estimated_cost: place.estimatedCost || place.estimated_cost || 0,
  nearby_places: place.nearbyPlaces || place.nearby_places || [],
  opening_hours: place.openingHours || place.opening_hours || "",
  entry_fee: place.entryFee || place.entry_fee || "",
  photos: getPhotoRecords(place),
});

function Field({ label, children }) {
  return (
    <label className="explore-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

const normalizeLocationText = (value) => {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const removeGenericLocationWords = (value) => {
  return String(value || "")
    .replace(/\b(ancient city|rock fortress|fortress|temple|beach|national park|cave temple|rock|fort|bridge|whale watching|tea plantations|sacred|relic)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const knownSriLankaLocations = [
  {
    id: "local-anuradhapura",
    name: "Anuradhapura Ancient City",
    city: "Anuradhapura",
    district: "Anuradhapura",
    region: "Cultural Triangle",
    lat: "8.345185",
    lon: "80.388133",
    keywords: ["anuradhapura", "ancient city", "sacred city", "ruwanwelisaya", "jaya sri maha bodhi"],
  },
  {
    id: "local-sigiriya",
    name: "Sigiriya Rock Fortress",
    city: "Sigiriya",
    district: "Matale",
    region: "Cultural Triangle",
    lat: "7.957000",
    lon: "80.760300",
    keywords: ["sigiriya", "lion rock", "rock fortress"],
  },
  {
    id: "local-dambulla",
    name: "Dambulla Cave Temple",
    city: "Dambulla",
    district: "Matale",
    region: "Cultural Triangle",
    lat: "7.856700",
    lon: "80.649200",
    keywords: ["dambulla", "cave temple", "golden temple"],
  },
  {
    id: "local-tooth-relic",
    name: "Temple of the Sacred Tooth Relic",
    city: "Kandy",
    district: "Kandy",
    region: "Hill Country",
    lat: "7.293600",
    lon: "80.641300",
    keywords: ["temple of the sacred tooth relic", "tooth relic", "sri dalada maligawa", "dalada maligawa", "kandy"],
  },
  {
    id: "local-nine-arch",
    name: "Nine Arch Bridge",
    city: "Ella",
    district: "Badulla",
    region: "Hill Country",
    lat: "6.876800",
    lon: "81.060800",
    keywords: ["nine arch bridge", "ella", "demodara"],
  },
  {
    id: "local-mirissa",
    name: "Mirissa Beach",
    city: "Mirissa",
    district: "Matara",
    region: "South Coast",
    lat: "5.948300",
    lon: "80.471600",
    keywords: ["mirissa", "mirissa beach", "whale watching"],
  },
  {
    id: "local-galle-fort",
    name: "Galle Fort",
    city: "Galle",
    district: "Galle",
    region: "South Coast",
    lat: "6.026900",
    lon: "80.216800",
    keywords: ["galle fort", "galle", "dutch fort"],
  },
  {
    id: "local-yala",
    name: "Yala National Park",
    city: "Yala",
    district: "Hambantota",
    region: "South Coast",
    lat: "6.372500",
    lon: "81.520700",
    keywords: ["yala", "yala national park", "safari"],
  },
  {
    id: "local-nuwara-eliya",
    name: "Nuwara Eliya",
    city: "Nuwara Eliya",
    district: "Nuwara Eliya",
    region: "Hill Country",
    lat: "6.949700",
    lon: "80.789100",
    keywords: ["nuwara eliya", "tea plantations", "tea estate"],
  },
  {
    id: "local-trincomalee",
    name: "Trincomalee Beaches",
    city: "Trincomalee",
    district: "Trincomalee",
    region: "East Coast",
    lat: "8.587400",
    lon: "81.215200",
    keywords: ["trincomalee", "nilaveli", "uppuveli", "trincomalee beach"],
  },
  {
    id: "local-adams-peak",
    name: "Adam's Peak",
    city: "Nallathanniya",
    district: "Ratnapura",
    region: "Hill Country",
    lat: "6.809600",
    lon: "80.499400",
    keywords: ["adam s peak", "adams peak", "sri pada", "samanala kanda"],
  },
  {
    id: "local-colombo",
    name: "Colombo",
    city: "Colombo",
    district: "Colombo",
    region: "West Coast",
    lat: "6.927100",
    lon: "79.861200",
    keywords: ["colombo", "fort", "pettah", "galle face"],
  },
  {
    id: "local-polonnaruwa",
    name: "Polonnaruwa Ancient City",
    city: "Polonnaruwa",
    district: "Polonnaruwa",
    region: "Cultural Triangle",
    lat: "7.940300",
    lon: "81.018800",
    keywords: ["polonnaruwa", "ancient city", "gal vihara"],
  },
  {
    id: "local-udawalawe",
    name: "Udawalawe National Park",
    city: "Udawalawe",
    district: "Ratnapura",
    region: "South Coast",
    lat: "6.474600",
    lon: "80.888900",
    keywords: ["udawalawe", "udawalawa", "national park", "elephant"],
  },
  {
    id: "local-hikkaduwa",
    name: "Hikkaduwa Beach",
    city: "Hikkaduwa",
    district: "Galle",
    region: "South Coast",
    lat: "6.140700",
    lon: "80.101200",
    keywords: ["hikkaduwa", "beach", "coral reef"],
  },
];

const createLocalMapResults = ({ placeName, city, district, region }) => {
  const combinedText = normalizeLocationText([placeName, city, district, region].filter(Boolean).join(" "));
  if (!combinedText) return [];

  const words = combinedText.split(" ").filter((word) => word.length > 2);

  return knownSriLankaLocations
    .map((location) => {
      const haystack = normalizeLocationText([
        location.name,
        location.city,
        location.district,
        location.region,
        ...(location.keywords || []),
      ].join(" "));

      let score = 0;
      if (combinedText.includes(normalizeLocationText(location.name))) score += 15;
      if (normalizeLocationText(location.name).includes(combinedText)) score += 10;
      if (city && normalizeLocationText(city) === normalizeLocationText(location.city)) score += 8;
      if (district && normalizeLocationText(district) === normalizeLocationText(location.district)) score += 5;
      if (region && normalizeLocationText(region) === normalizeLocationText(location.region)) score += 2;

      words.forEach((word) => {
        if (haystack.includes(word)) score += 2;
      });

      return {
        ...location,
        place_id: location.id,
        display_name: `${location.name}, ${location.city}, ${location.district}, Sri Lanka`,
        source: "Local Sri Lanka suggestion",
        score,
      };
    })
    .filter((location) => location.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

function MapLocationPicker({ lat, lng, placeName, city, district, region, onSelect }) {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mapMessage, setMapMessage] = useState("");
  const hasSelectedLocation = hasMapCoordinates(lat, lng);

  const createSearchQueries = () => {
    const cleanPlace = String(placeName || "").trim();
    const cleanCity = String(city || "").trim();
    const cleanDistrict = String(district || "").trim();
    const simplePlace = removeGenericLocationWords(cleanPlace);

    const queryList = [
      [cleanPlace, cleanCity, cleanDistrict, "Sri Lanka"],
      [cleanPlace, cleanCity, "Sri Lanka"],
      [cleanPlace, cleanDistrict, "Sri Lanka"],
      [cleanPlace, "Sri Lanka"],
      [simplePlace, cleanCity, "Sri Lanka"],
      [simplePlace, cleanDistrict, "Sri Lanka"],
      [simplePlace, "Sri Lanka"],
      [cleanCity, cleanDistrict, "Sri Lanka"],
      [cleanCity, "Sri Lanka"],
      [cleanDistrict, "Sri Lanka"],
    ]
      .map((parts) => parts.map((part) => String(part || "").trim()).filter(Boolean).join(", "))
      .filter(Boolean);

    return [...new Set(queryList)];
  };

  const visibleSearchText = createSearchQueries()[0] || "Place name, city, district, Sri Lanka";

  const normaliseOnlineResult = (result, sourceName) => ({
    place_id: `${sourceName}-${result.place_id || result.osm_id || result.id || result.lat}-${result.lon}`,
    name: result.name || result.display_name?.split(",")[0] || "Map result",
    display_name: result.display_name || `${result.name || "Map result"}, Sri Lanka`,
    lat: String(result.lat),
    lon: String(result.lon),
    source: sourceName,
  });

  const findFromNominatim = async (query) => {
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=lk&addressdetails=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data.map((item) => normaliseOnlineResult(item, "OpenStreetMap")) : [];
  };

  const findFromPhoton = async (query) => {
    const searchUrl = `https://photon.komoot.io/api/?limit=6&lang=en&q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) return [];
    const data = await response.json();
    const features = Array.isArray(data.features) ? data.features : [];

    return features
      .filter((feature) => {
        const properties = feature.properties || {};
        const country = normalizeLocationText(properties.country || "");
        const state = normalizeLocationText(properties.state || "");
        return country.includes("sri lanka") || state.includes("sri lanka") || country.includes("lk") || !properties.country;
      })
      .map((feature, index) => {
        const properties = feature.properties || {};
        const coordinates = feature.geometry?.coordinates || [];
        return normaliseOnlineResult({
          place_id: properties.osm_id || `photon-${index}`,
          name: properties.name || properties.city || properties.county || "Map result",
          display_name: [properties.name, properties.city, properties.county, properties.state, properties.country]
            .filter(Boolean)
            .join(", "),
          lat: coordinates[1],
          lon: coordinates[0],
        }, "Photon map search");
      });
  };

  const mergeUniqueResults = (items) => {
    const seen = new Set();
    return items
      .filter((item) => hasMapCoordinates(item.lat, item.lon))
      .filter((item) => {
        const key = `${Number(item.lat).toFixed(4)}-${Number(item.lon).toFixed(4)}-${normalizeLocationText(item.name)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 10);
  };

  const findCoordinates = async () => {
    if (!String(placeName || "").trim() && !String(city || "").trim() && !String(district || "").trim()) {
      setMapMessage("Fill at least Place name, City or District first. Then click Create location.");
      setResults([]);
      return;
    }

    const localResults = createLocalMapResults({ placeName, city, district, region });
    const queries = createSearchQueries();

    try {
      setSearching(true);
      setResults(localResults);
      setMapMessage(localResults.length ? "Choose a local suggestion below. I am also checking online map results..." : "Checking online map results...");

      let onlineResults = [];

      for (const query of queries) {
        const nominatimResults = await findFromNominatim(query);
        onlineResults = mergeUniqueResults([...onlineResults, ...nominatimResults]);
        if (onlineResults.length >= 3) break;
      }

      if (onlineResults.length === 0) {
        for (const query of queries.slice(0, 4)) {
          const photonResults = await findFromPhoton(query);
          onlineResults = mergeUniqueResults([...onlineResults, ...photonResults]);
          if (onlineResults.length >= 3) break;
        }
      }

      const finalResults = mergeUniqueResults([...localResults, ...onlineResults]);
      setResults(finalResults);

      if (finalResults.length === 0) {
        setMapMessage("No result found. Type the nearest city only like Anuradhapura or enter latitude and longitude manually below.");
        return;
      }

      setMapMessage("Choose the correct result below. Only latitude and longitude will change. Your other typed details will stay safe.");
    } catch (error) {
      if (localResults.length > 0) {
        setResults(localResults);
        setMapMessage("Online map search failed but local Sri Lanka suggestions are available. Choose the correct one below.");
      } else {
        setResults([]);
        setMapMessage("Map search is temporarily unavailable. Type the nearest city only or enter latitude and longitude manually below.");
      }
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (result) => {
    onSelect({ lat: Number(result.lat).toFixed(6), lng: Number(result.lon).toFixed(6) });
    setResults([]);
    setMapMessage("Location selected ✅ Only latitude and longitude were updated. Save the place to keep this location.");
  };

  const clearLocation = () => {
    onSelect({ lat: "", lng: "" });
    setResults([]);
    setMapMessage("Location removed. Save the place to apply this change.");
  };

  return (
    <div className="location-picker-card">
      <div className="location-picker-info">
        <div>
          <strong>🗺️ Place Location Helper</strong>
          <span>Click Create location and choose the correct result. The system fills latitude and longitude automatically.</span>
          <small>Search will try: {visibleSearchText}</small>
        </div>
      </div>

      <div className="map-action-row">
        <button type="button" onClick={findCoordinates} disabled={searching}>
          {searching ? "Finding location..." : "Create location"}
        </button>
        {hasSelectedLocation ? <button type="button" className="clear-location-btn" onClick={clearLocation}>Remove location</button> : null}
      </div>

      {mapMessage ? <p className="map-message">{mapMessage}</p> : null}

      {results.length > 0 ? (
        <div className="map-result-list">
          {results.map((result) => (
            <article key={`${result.place_id}-${result.lat}-${result.lon}`}>
              <div>
                <strong>{result.name || result.display_name?.split(",")[0]}</strong>
                <span>{result.display_name}</span>
                <small>{result.source ? `${result.source} • ` : ""}Lat: {Number(result.lat).toFixed(6)} | Lng: {Number(result.lon).toFixed(6)}</small>
              </div>
              <button type="button" onClick={() => selectResult(result)}>Use this location</button>
            </article>
          ))}
        </div>
      ) : null}

      <div className="map-preview-card">
        <iframe
          title={hasSelectedLocation ? "Selected place location" : "Sri Lanka map preview"}
          src={getOpenStreetMapEmbedUrl(lat, lng)}
          loading="lazy"
        />
        <div className="map-coordinate-note">
          {hasSelectedLocation ? (
            <span>Selected coordinates: <strong>{lat}</strong>, <strong>{lng}</strong></span>
          ) : (
            <span>No location selected yet. Click Create location or type latitude and longitude manually below.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function SimpleListEditor({ label, helper, value, onChange, placeholder }) {
  const items = ensureArray(value).map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      return String(item.title || item.name || item.label || "");
    }
    return String(item || "");
  });

  const updateItem = (index, itemValue) => {
    const next = [...items];
    next[index] = itemValue;
    onChange(next);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const addItem = () => {
    onChange([...items, ""]);
  };

  return (
    <div className="explore-field list-editor-wrap">
      <span>{label}</span>
      {helper ? <small className="field-helper">{helper}</small> : null}
      <div className="simple-list-editor">
        {items.length === 0 ? <p className="empty-list-note">No items added yet.</p> : null}
        {items.map((item, index) => (
          <div className="list-editor-row" key={`${label}-${index}`}>
            <input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={placeholder || "Type here"}
            />
            <button type="button" className="remove-mini-btn" onClick={() => removeItem(index)}>Remove</button>
          </div>
        ))}
        <button type="button" className="add-mini-btn" onClick={addItem}>+ Add item</button>
      </div>
    </div>
  );
}

function ObjectListEditor({ label, helper, value, onChange, fields, emptyItem, addLabel }) {
  const items = ensureArray(value).map((item) => {
    if (item && typeof item === "object") return { ...emptyItem, ...item };
    return { ...emptyItem, [fields[0].name]: String(item || "") };
  });

  const updateItem = (index, key, itemValue) => {
    const next = [...items];
    next[index] = { ...next[index], [key]: itemValue };
    onChange(next);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const addItem = () => {
    onChange([...items, { ...emptyItem }]);
  };

  return (
    <div className="explore-field list-editor-wrap wide-editor">
      <span>{label}</span>
      {helper ? <small className="field-helper">{helper}</small> : null}
      <div className="object-list-editor">
        {items.length === 0 ? <p className="empty-list-note">No items added yet.</p> : null}
        {items.map((item, index) => (
          <div className="object-item-card" key={`${label}-${index}`}>
            <div className="object-item-head">
              <strong>{label} {index + 1}</strong>
              <button type="button" className="remove-mini-btn" onClick={() => removeItem(index)}>Remove</button>
            </div>
            <div className="object-fields-grid">
              {fields.map((field) => (
                <label key={field.name} className={field.textarea ? "full" : ""}>
                  <span>{field.label}</span>
                  {field.textarea ? (
                    <textarea
                      value={item[field.name] || ""}
                      onChange={(e) => updateItem(index, field.name, e.target.value)}
                      placeholder={field.placeholder}
                      rows="3"
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      value={item[field.name] ?? ""}
                      onChange={(e) => updateItem(index, field.name, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button type="button" className="add-mini-btn" onClick={addItem}>+ {addLabel || "Add item"}</button>
      </div>
    </div>
  );
}

function TravelGalleryModal({ place, files, saving, onClose, onFilesChange, onUpload, onDeletePhoto }) {
  const photos = getPhotoRecords(place);

  return (
    <div className="gallery-overlay" role="dialog" aria-modal="true">
      <section className="gallery-modal">
        <div className="gallery-head">
          <div>
            <p>PHOTO STUDIO</p>
            <h2>Travel Gallery</h2>
            <span>Manage photos only for <strong>{place.name}</strong>. Add new photos here and remove old ones anytime.</span>
          </div>
          <button type="button" className="close-gallery-btn" onClick={onClose}>Close ✕</button>
        </div>

        <div className="gallery-body-grid">
          <div className="gallery-panel">
            <h3>Existing Photos</h3>
            <p className="gallery-help">Delete unwanted photos from this place. The first remaining photo becomes the main photo automatically.</p>

            {photos.length === 0 ? (
              <div className="empty-gallery-note">No photos saved for this place yet.</div>
            ) : (
              <div className="existing-photo-grid">
                {photos.map((photo, index) => (
                  <article className="existing-photo-card" key={photo.id || `${photo.image_url}-${index}`}>
                    <img src={assetUrl(photo.image_url)} alt={photo.alt_text || `${place.name} photo`} />
                    <div>
                      <strong>{photo.is_main ? "Main photo" : `Photo ${index + 1}`}</strong>
                      <small>{photo.image_url?.startsWith("http") ? "Online image" : "Uploaded image"}</small>
                    </div>
                    <button
                      type="button"
                      className="delete-photo-btn"
                      disabled={!photo.id || saving}
                      onClick={() => onDeletePhoto(photo)}
                    >
                      Delete photo
                    </button>
                    {!photo.id ? <em>Save this image through gallery first to delete it safely.</em> : null}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="gallery-panel upload-panel">
            <h3>Add New Photos</h3>
            <p className="gallery-help">These selected photos will be added only to <strong>{place.name}</strong>.</p>

            <div
              className="drop-box gallery-drop-box"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFilesChange(Array.from(e.dataTransfer.files || []));
              }}
            >
              <input type="file" multiple accept="image/*" onChange={(e) => onFilesChange(Array.from(e.target.files || []))} />
              <strong>Drop new photos here</strong>
              <span>{files.length ? `${files.length} photo(s) selected for ${place.name}` : "or click to choose images"}</span>
            </div>

            {files.length > 0 ? (
              <div className="selected-files-list">
                {files.map((file, index) => <span key={`${file.name}-${index}`}>📷 {file.name}</span>)}
              </div>
            ) : null}

            <button type="button" className="upload-gallery-btn" disabled={saving || files.length === 0} onClick={onUpload}>
              {saving ? "Uploading..." : `Add photos to ${place.name}`}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ExploreManagerPage() {
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyPlace);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [activePanel, setActivePanel] = useState("places");
  const [newCategory, setNewCategory] = useState({ label: "", slug: "", icon: "📍", sort_order: 0 });
  const [galleryPlace, setGalleryPlace] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [gallerySaving, setGallerySaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [placeRes, categoryRes] = await Promise.all([
        api.get("/admin/explore/places", { params: { status: "all" } }),
        api.get("/admin/explore/categories"),
      ]);
      setPlaces(placeRes.data.places || []);
      setCategories(categoryRes.data.categories || []);
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to load Explore manager data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPlaces = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return places;
    return places.filter((place) =>
      [place.name, place.city, place.district, place.region, place.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [places, search]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const editPlace = (place) => {
    setForm(placeForForm(place, categories));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setForm(emptyPlace);
  };

  const refreshGalleryPlace = async (placeId) => {
    const res = await api.get(`/admin/explore/places/${placeId}`);
    const updatedPlace = res.data.place;
    setGalleryPlace(updatedPlace);

    if (form.id === updatedPlace.id) {
      setForm(placeForForm(updatedPlace, categories));
    }

    await loadData();
  };

  const openGallery = async (place) => {
    if (!place?.id) {
      setNotice("Save the place first. Then open Travel Gallery to add photos.");
      return;
    }

    try {
      setNotice("");
      setGalleryFiles([]);
      const res = await api.get(`/admin/explore/places/${place.id}`);
      setGalleryPlace(res.data.place);
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to open Travel Gallery");
    }
  };

  const closeGallery = () => {
    setGalleryPlace(null);
    setGalleryFiles([]);
  };

  const uploadGalleryPhotos = async () => {
    if (!galleryPlace?.id || galleryFiles.length === 0) return;

    try {
      setGallerySaving(true);
      setNotice("");
      const fd = new FormData();
      galleryFiles.forEach((file) => fd.append("photos", file));

      await api.post(`/admin/explore/places/${galleryPlace.id}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setGalleryFiles([]);
      setNotice("Photos added to Travel Gallery successfully ✅");
      await refreshGalleryPlace(galleryPlace.id);
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to upload photos");
    } finally {
      setGallerySaving(false);
    }
  };

  const deleteGalleryPhoto = async (photo) => {
    if (!photo?.id) {
      setNotice("This photo does not have a database ID, so it cannot be deleted safely.");
      return;
    }

    if (!window.confirm("Delete this photo from this place?")) return;

    try {
      setGallerySaving(true);
      setNotice("");
      await api.delete(`/admin/explore/images/${photo.id}`);
      setNotice("Photo deleted successfully ✅");
      await refreshGalleryPlace(galleryPlace.id);
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to delete photo");
    } finally {
      setGallerySaving(false);
    }
  };

  const toggleMonth = (monthIndex) => {
    const selected = new Set(form.best_months || []);
    if (selected.has(monthIndex)) selected.delete(monthIndex);
    else selected.add(monthIndex);
    update("best_months", Array.from(selected).sort((a, b) => a - b));
  };

  const buildFormData = () => {
    const fd = new FormData();
    const jsonFields = ["best_months", "tags", "experiences", "highlights", "nearby_places", "tips", "facilities"];
    const cleanForm = {
      ...form,
      tags: cleanStringArray(form.tags),
      tips: cleanStringArray(form.tips),
      facilities: cleanStringArray(form.facilities),
      experiences: cleanObjectArray(form.experiences, experienceFields),
      highlights: cleanObjectArray(form.highlights, highlightFields),
      nearby_places: cleanObjectArray(form.nearby_places, nearbyPlaceFields),
    };

    Object.entries(cleanForm).forEach(([key, value]) => {
      if (["id", "images", "photos", "imageRecords", "image_records"].includes(key)) return;
      if (jsonFields.includes(key)) {
        fd.append(key, JSON.stringify(value || []));
      } else {
        fd.append(key, value ?? "");
      }
    });

    return fd;
  };

  const savePlace = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");

    try {
      const fd = buildFormData();

      if (form.id) {
        await api.put(`/admin/explore/places/${form.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setNotice("Place updated successfully ✅ Use Travel Gallery to manage photos.");
      } else {
        await api.post("/admin/explore/places", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setNotice("New place added successfully ✅ Select it and open Travel Gallery to add photos.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to save place");
    } finally {
      setSaving(false);
    }
  };

  const deletePlace = async (id) => {
    if (!window.confirm("Delete this place? This cannot be undone.")) return;

    try {
      await api.delete(`/admin/explore/places/${id}`);
      setNotice("Place deleted successfully");
      await loadData();
      if (form.id === id) resetForm();
      if (galleryPlace?.id === id) closeGallery();
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to delete place");
    }
  };

  const createCategory = async (event) => {
    event.preventDefault();
    try {
      await api.post("/admin/explore/categories", newCategory);
      setNewCategory({ label: "", slug: "", icon: "📍", sort_order: 0 });
      setNotice("Category added successfully ✅");
      await loadData();
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to add category");
    }
  };

  return (
    <main className="admin-page explore-admin-page">
      <style>{css}</style>

      <section className="explore-admin-hero">
        <div>
          <p>EXPLORE CONTENT</p>
          <h1>Places Manager</h1>
          <span>Add places, update details, set best months and manage each place gallery without touching code.</span>
        </div>
        <div className="hero-stat"><strong>{places.length}</strong><small>Total Places</small></div>
        <div className="hero-stat"><strong>{places.filter((p) => p.status === "published").length}</strong><small>Published</small></div>
        <div className="hero-stat"><strong>{places.filter((p) => p.featured).length}</strong><small>Featured</small></div>
      </section>

      {notice ? <div className="admin-notice">{notice}</div> : null}

      <div className="explore-admin-tabs">
        <button type="button" className={activePanel === "places" ? "on" : ""} onClick={() => setActivePanel("places")}>Places</button>
        <button type="button" className={activePanel === "categories" ? "on" : ""} onClick={() => setActivePanel("categories")}>Categories</button>
      </div>

      {activePanel === "categories" ? (
        <section className="manager-grid single">
          <div className="manager-card">
            <h2>Add Category</h2>
            <form className="mini-form" onSubmit={createCategory}>
              <Field label="Category name"><input value={newCategory.label} onChange={(e) => setNewCategory((c) => ({ ...c, label: e.target.value }))} placeholder="Example: Wellness" /></Field>
              <Field label="Slug"><input value={newCategory.slug} onChange={(e) => setNewCategory((c) => ({ ...c, slug: e.target.value }))} placeholder="wellness" /></Field>
              <Field label="Icon"><input value={newCategory.icon} onChange={(e) => setNewCategory((c) => ({ ...c, icon: e.target.value }))} /></Field>
              <Field label="Sort order"><input type="number" value={newCategory.sort_order} onChange={(e) => setNewCategory((c) => ({ ...c, sort_order: e.target.value }))} /></Field>
              <button type="submit">Add Category</button>
            </form>
          </div>

          <div className="manager-card">
            <h2>Current Categories</h2>
            <div className="cat-list">
              {categories.map((cat) => <span key={cat.id}>{cat.icon} {cat.label} <small>{cat.slug}</small></span>)}
            </div>
          </div>
        </section>
      ) : (
        <section className="manager-grid">
          <form className="manager-card place-form" onSubmit={savePlace}>
            <div className="form-title-row">
              <div>
                <h2>{form.id ? "Edit Place" : "Add New Place"}</h2>
                <p>Keep it simple. Fill main fields first. Photos are managed separately in Travel Gallery.</p>
              </div>
              <div className="title-actions">
                {form.id ? <button type="button" className="gallery-soft-btn" onClick={() => openGallery(form)}>📸 Travel Gallery</button> : null}
                {form.id ? <button type="button" className="soft-btn" onClick={resetForm}>New Place</button> : null}
              </div>
            </div>

            <h3>1. Basic Details</h3>
            <div className="form-grid">
              <Field label="Place name"><input value={form.name} onChange={(e) => update("name", e.target.value)} required /></Field>
              <Field label="City"><input value={form.city} onChange={(e) => update("city", e.target.value)} required /></Field>
              <Field label="District"><input value={form.district || ""} onChange={(e) => update("district", e.target.value)} /></Field>
              <Field label="Region"><select value={form.region || ""} onChange={(e) => update("region", e.target.value)}>{regionOptions.map((item) => <option key={item}>{item}</option>)}</select></Field>
              <Field label="Category"><select value={form.category_id || ""} onChange={(e) => update("category_id", e.target.value)}><option value="">Select category</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>)}</select></Field>
              <Field label="Budget"><select value={form.budget} onChange={(e) => update("budget", e.target.value)}>{budgetOptions.map((item) => <option key={item}>{item}</option>)}</select></Field>
              <Field label="Budget score"><input type="number" value={form.budget_score} onChange={(e) => update("budget_score", e.target.value)} min="1" max="3" /></Field>
              <Field label="Estimated cost"><input type="number" value={form.estimated_cost} onChange={(e) => update("estimated_cost", e.target.value)} /></Field>
            </div>

            <h3>2. Map Location</h3>
            <MapLocationPicker
              lat={form.lat}
              lng={form.lng}
              placeName={form.name}
              city={form.city}
              district={form.district}
              region={form.region}
              onSelect={({ lat, lng }) => setForm((current) => ({ ...current, lat, lng }))}
            />
            <div className="form-grid location-manual-grid">
              <Field label="Latitude"><input value={form.lat || ""} onChange={(e) => update("lat", e.target.value)} placeholder="Example: 7.957000" /></Field>
              <Field label="Longitude"><input value={form.lng || ""} onChange={(e) => update("lng", e.target.value)} placeholder="Example: 80.760300" /></Field>
            </div>

            <h3>3. Page Content</h3>
            <Field label="Short description"><textarea value={form.short_description} onChange={(e) => update("short_description", e.target.value)} rows="3" /></Field>
            <Field label="Full description"><textarea value={form.full_description} onChange={(e) => update("full_description", e.target.value)} rows="7" /></Field>

            <div className="form-grid">
              <Field label="Duration"><input value={form.duration} onChange={(e) => update("duration", e.target.value)} placeholder="3-4 hours" /></Field>
              <Field label="Best time text"><input value={form.best_time} onChange={(e) => update("best_time", e.target.value)} placeholder="Dec - Apr" /></Field>
              <Field label="Opening hours"><input value={form.opening_hours} onChange={(e) => update("opening_hours", e.target.value)} /></Field>
              <Field label="Entry fee"><input value={form.entry_fee} onChange={(e) => update("entry_fee", e.target.value)} /></Field>
              <Field label="Vibe"><input value={form.vibe || ""} onChange={(e) => update("vibe", e.target.value)} placeholder="Culture" /></Field>
              <Field label="Main image URL"><input value={form.image_url || ""} onChange={(e) => update("image_url", e.target.value)} placeholder="https://... or manage in Travel Gallery" /></Field>
            </div>

            <h3>4. Best Months</h3>
            <div className="month-grid">
              {monthLabels.map((label, index) => (
                <button key={label} type="button" className={(form.best_months || []).includes(index) ? "on" : ""} onClick={() => toggleMonth(index)}>{label}</button>
              ))}
            </div>

            <h3>5. Simple List Fields</h3>
            <div className="form-grid two">
              <SimpleListEditor
                label="Tags"
                helper="Example: UNESCO, Hiking, Photography. Add them one by one."
                value={form.tags}
                onChange={(value) => update("tags", value)}
                placeholder="UNESCO"
              />
              <SimpleListEditor
                label="Tips"
                helper="Example: Start early to avoid crowds."
                value={form.tips}
                onChange={(value) => update("tips", value)}
                placeholder="Start early to avoid crowds"
              />
              <SimpleListEditor
                label="Facilities"
                helper="Example: Parking, Washrooms, Guided Tours."
                value={form.facilities}
                onChange={(value) => update("facilities", value)}
                placeholder="Parking"
              />
              <ObjectListEditor
                label="Nearby places"
                helper="Add nearby places without writing JSON."
                value={form.nearby_places}
                onChange={(value) => update("nearby_places", value)}
                fields={nearbyPlaceFields}
                emptyItem={{ name: "", distance: "", type: "" }}
                addLabel="Add nearby place"
              />
            </div>

            <h3>6. Experiences and Highlights</h3>
            <div className="form-grid two">
              <ObjectListEditor
                label="Experience"
                helper="Add activities visitors can do at this place."
                value={form.experiences}
                onChange={(value) => update("experiences", value)}
                fields={experienceFields}
                emptyItem={{ title: "", description: "", duration: "", cost: 0 }}
                addLabel="Add experience"
              />
              <ObjectListEditor
                label="Highlight"
                helper="Add important facts shown in the place detail page."
                value={form.highlights}
                onChange={(value) => update("highlights", value)}
                fields={highlightFields}
                emptyItem={{ icon: "", title: "", description: "" }}
                addLabel="Add highlight"
              />
            </div>

            <h3>6. Publishing and Gallery</h3>
            <div className="gallery-callout">
              <div>
                <strong>📸 Travel Gallery</strong>
                <span>Photos are managed in a separate gallery so new photos always go to the correct place.</span>
              </div>
              <button type="button" disabled={!form.id} onClick={() => openGallery(form)}>
                {form.id ? "Open Travel Gallery" : "Save place first"}
              </button>
            </div>

            <div className="publish-row">
              <label><input type="checkbox" checked={!!form.featured} onChange={(e) => update("featured", e.target.checked)} /> Featured</label>
              <label>Status <select value={form.status} onChange={(e) => update("status", e.target.value)}><option value="published">Published</option><option value="draft">Draft</option></select></label>
              <label>Sort order <input type="number" value={form.sort_order} onChange={(e) => update("sort_order", e.target.value)} /></label>
            </div>

            <button className="save-btn" type="submit" disabled={saving}>{saving ? "Saving..." : form.id ? "Update Place" : "Add Place"}</button>
          </form>

          <aside className="manager-card place-list-card">
            <div className="list-head">
              <h2>Existing Places</h2>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search places..." />
            </div>
            {loading ? <p>Loading...</p> : null}
            <div className="admin-place-list">
              {filteredPlaces.map((place) => (
                <article key={place.id} className="admin-place-item">
                  <img src={assetUrl(place.image)} alt={place.name} />
                  <div>
                    <strong>{place.name}</strong>
                    <span>{place.city} · {place.categoryLabel || place.category} · {place.status}</span>
                    <small>{place.featured ? "★ Featured" : "Normal"}</small>
                  </div>
                  <button type="button" onClick={() => editPlace(place)}>Edit</button>
                  <button type="button" className="gallery" onClick={() => openGallery(place)}>Gallery</button>
                  <button type="button" className="danger" onClick={() => deletePlace(place.id)}>Delete</button>
                </article>
              ))}
            </div>
          </aside>
        </section>
      )}

      {galleryPlace ? (
        <TravelGalleryModal
          place={galleryPlace}
          files={galleryFiles}
          saving={gallerySaving}
          onClose={closeGallery}
          onFilesChange={setGalleryFiles}
          onUpload={uploadGalleryPhotos}
          onDeletePhoto={deleteGalleryPhoto}
        />
      ) : null}
    </main>
  );
}

const css = `
.explore-admin-page{color:#0b2530}.explore-admin-hero{display:grid;grid-template-columns:1fr 150px 150px 150px;gap:18px;align-items:stretch;background:linear-gradient(135deg,#064e45,#0f766e);border-radius:28px;padding:28px;color:#fff;margin-bottom:20px}.explore-admin-hero p{margin:0 0 10px;color:#ffe68b;font-weight:900;letter-spacing:.25em;font-size:12px}.explore-admin-hero h1{margin:0;font-size:42px}.explore-admin-hero span{display:block;margin-top:8px;color:#d6fff8}.hero-stat{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center}.hero-stat strong{font-size:36px}.hero-stat small{color:#d6fff8;font-weight:800}.admin-notice{background:#fff7d1;border:1px solid #f4d97b;color:#5a3c00;padding:14px 18px;border-radius:16px;margin:14px 0;font-weight:800}.explore-admin-tabs{display:flex;gap:10px;margin:16px 0;align-items:center;flex-wrap:wrap}.explore-admin-tabs button{border:1px solid #dbe7e2;background:#fff;border-radius:999px;padding:12px 26px;min-width:110px;font-weight:900;cursor:pointer;color:#064e45!important;-webkit-text-fill-color:#064e45!important;display:inline-flex;align-items:center;justify-content:center;line-height:1.1;text-align:center;white-space:nowrap}.explore-admin-tabs button.on{background:#064e45;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#064e45}.manager-grid{display:grid;grid-template-columns:minmax(0,1fr) 420px;gap:22px;align-items:start}.manager-grid.single{grid-template-columns:1fr 1fr}.manager-card{background:#fff;border:1px solid #e2ebe5;border-radius:26px;box-shadow:0 18px 45px rgba(0,0,0,.06);padding:22px}.form-title-row,.list-head{display:flex;justify-content:space-between;gap:16px;align-items:start}.title-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}.manager-card h2{margin:0 0 8px;color:#064e45}.manager-card h3{margin:26px 0 14px;color:#0f766e;border-top:1px solid #edf4ef;padding-top:18px}.manager-card p{margin:0;color:#64748b}.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.form-grid.two{grid-template-columns:1fr 1fr}.explore-field{display:flex;flex-direction:column;gap:7px;font-weight:800;color:#334155}.explore-field input,.explore-field select,.explore-field textarea,.list-head input{border:1px solid #dbe7e2;border-radius:14px;padding:12px 14px;font:inherit;font-weight:650;outline:none;background:#fff}.explore-field textarea{resize:vertical}.month-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}.month-grid button{border:1px solid #dbe7e2;background:#fff;border-radius:12px;padding:10px;font-weight:900;cursor:pointer}.month-grid button.on{background:#ffc22b;color:#063c38;border-color:#ffc22b}.drop-box{position:relative;border:2px dashed #b9d8ce;background:#f4fbf7;border-radius:20px;min-height:130px;display:grid;place-items:center;text-align:center;color:#064e45;overflow:hidden;padding:18px}.drop-box input{position:absolute;inset:0;opacity:0;cursor:pointer}.drop-box strong{font-size:18px}.drop-box span{color:#64748b;font-weight:800}.gallery-callout{display:flex;justify-content:space-between;gap:18px;align-items:center;border:1px solid #dbe7e2;background:linear-gradient(135deg,#f4fbf7,#fffdf2);border-radius:20px;padding:18px}.gallery-callout div{display:flex;flex-direction:column;gap:6px}.gallery-callout strong{color:#064e45;font-size:18px}.gallery-callout span{color:#64748b;font-weight:800}.gallery-callout button,.gallery-soft-btn{border:none;background:#ffc22b;color:#063c38;border-radius:14px;padding:12px 16px;font-weight:900;cursor:pointer;white-space:nowrap}.gallery-callout button:disabled{opacity:.6;cursor:not-allowed}.publish-row{display:flex;gap:18px;flex-wrap:wrap;margin-top:16px;align-items:center}.publish-row label{font-weight:900;display:flex;gap:8px;align-items:center}.publish-row input,.publish-row select{border:1px solid #dbe7e2;border-radius:10px;padding:8px}.save-btn,.mini-form button,.soft-btn{border:none;background:#064e45;color:#fff;border-radius:16px;padding:14px 20px;font-weight:900;cursor:pointer;margin-top:20px}.soft-btn{background:#e8f5ef;color:#064e45;margin:0}.gallery-soft-btn{margin:0}.place-list-card{position:sticky;top:18px}.admin-place-list{display:flex;flex-direction:column;gap:12px;max-height:72vh;overflow:auto;padding-right:4px}.admin-place-item{display:grid;grid-template-columns:70px 1fr auto auto auto;gap:10px;align-items:center;border:1px solid #edf3ef;border-radius:18px;padding:10px}.admin-place-item img{width:70px;height:64px;object-fit:cover;border-radius:14px;background:#e5e7eb}.admin-place-item strong{display:block;color:#064e45}.admin-place-item span,.admin-place-item small{display:block;color:#64748b;font-size:12px;font-weight:800}.admin-place-item button{border:none;background:#e8f5ef;color:#064e45;border-radius:12px;padding:10px;font-weight:900;cursor:pointer}.admin-place-item button.gallery{background:#fff3c4;color:#5a3c00}.admin-place-item button.danger{background:#fee2e2;color:#991b1b}.mini-form{display:grid;grid-template-columns:repeat(4,1fr) auto;gap:12px;align-items:end}.cat-list{display:flex;gap:10px;flex-wrap:wrap}.cat-list span{background:#f0faf6;border:1px solid #dbe7e2;border-radius:999px;padding:10px 14px;font-weight:900}.cat-list small{color:#64748b;margin-left:4px}.field-helper{color:#64748b;font-size:12px;font-weight:800;line-height:1.45}.list-editor-wrap{background:#fbfefc;border:1px solid #edf4ef;border-radius:18px;padding:14px}.simple-list-editor,.object-list-editor{display:flex;flex-direction:column;gap:10px}.empty-list-note{margin:0!important;color:#94a3b8!important;font-size:13px;font-weight:800}.list-editor-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.list-editor-row input,.object-fields-grid input,.object-fields-grid textarea{border:1px solid #dbe7e2;border-radius:12px;padding:10px 12px;font:inherit;font-weight:650;outline:none;background:#fff}.add-mini-btn,.remove-mini-btn{border:none;border-radius:12px;padding:10px 12px;font-weight:900;cursor:pointer}.add-mini-btn{background:#064e45;color:#fff;align-self:flex-start}.remove-mini-btn{background:#fee2e2;color:#991b1b}.object-item-card{border:1px solid #e5efe9;background:#fff;border-radius:16px;padding:12px}.object-item-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px;color:#064e45}.object-fields-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.object-fields-grid label{display:flex;flex-direction:column;gap:6px;color:#334155;font-weight:800}.object-fields-grid label.full{grid-column:1/-1}.wide-editor{min-height:100%}.gallery-overlay{position:fixed;inset:0;background:rgba(6,78,69,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px}.gallery-modal{width:min(1120px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:28px;box-shadow:0 30px 90px rgba(0,0,0,.28);padding:24px}.gallery-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border-bottom:1px solid #edf4ef;padding-bottom:18px;margin-bottom:18px}.gallery-head p{margin:0 0 8px;color:#f97316;font-weight:900;letter-spacing:.22em;font-size:12px}.gallery-head h2{margin:0;color:#064e45;font-size:34px}.gallery-head span{display:block;color:#64748b;font-weight:750;margin-top:6px}.close-gallery-btn{border:none;background:#fee2e2;color:#991b1b;border-radius:14px;padding:12px 16px;font-weight:900;cursor:pointer}.gallery-body-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.gallery-panel{border:1px solid #e2ebe5;border-radius:22px;padding:18px;background:#fbfefc}.gallery-panel h3{margin:0 0 6px;color:#0f766e}.gallery-help{margin:0 0 14px!important;color:#64748b!important;font-weight:750}.empty-gallery-note{border:1px dashed #b9d8ce;border-radius:18px;padding:28px;text-align:center;color:#64748b;font-weight:900;background:#fff}.existing-photo-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.existing-photo-card{background:#fff;border:1px solid #e5efe9;border-radius:18px;padding:10px;display:grid;grid-template-columns:120px 1fr;gap:10px;align-items:center}.existing-photo-card img{width:120px;height:92px;object-fit:cover;border-radius:14px;background:#e5e7eb}.existing-photo-card strong{display:block;color:#064e45}.existing-photo-card small{display:block;color:#64748b;font-weight:800;margin-top:4px}.existing-photo-card em{grid-column:1/-1;color:#b45309;font-style:normal;font-size:12px;font-weight:800}.delete-photo-btn{grid-column:2;border:none;background:#fee2e2;color:#991b1b;border-radius:12px;padding:10px 12px;font-weight:900;cursor:pointer}.delete-photo-btn:disabled{opacity:.6;cursor:not-allowed}.gallery-drop-box{min-height:180px}.selected-files-list{display:flex;flex-direction:column;gap:8px;margin:14px 0}.selected-files-list span{background:#fff;border:1px solid #e2ebe5;border-radius:12px;padding:10px;color:#334155;font-weight:800;word-break:break-word}.upload-gallery-btn{border:none;background:#064e45;color:#fff;border-radius:14px;padding:14px 18px;font-weight:900;cursor:pointer;width:100%}.upload-gallery-btn:disabled{opacity:.6;cursor:not-allowed}.location-picker-card{border:1px solid #dbe7e2;background:linear-gradient(135deg,#f8ffff,#fbfefc);border-radius:22px;padding:18px;display:flex;flex-direction:column;gap:14px}.location-picker-info{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.location-picker-info div{display:flex;flex-direction:column;gap:5px}.location-picker-info strong{color:#064e45;font-size:18px}.location-picker-info span{color:#64748b;font-weight:800}.location-picker-info a{background:#e8f5ef;color:#064e45;border-radius:999px;padding:10px 14px;text-decoration:none;font-weight:900;white-space:nowrap}.map-action-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.map-action-row button{border:none;background:#064e45;color:#fff;border-radius:14px;padding:12px 18px;font-weight:900;cursor:pointer}.map-action-row button:disabled{opacity:.65;cursor:not-allowed}.map-action-row .clear-location-btn{background:#fee2e2;color:#991b1b}.location-picker-info small{display:block;margin-top:4px;color:#0f766e;font-weight:850}.map-message{margin:0!important;background:#fff7d1;border:1px solid #f4d97b;color:#5a3c00;border-radius:14px;padding:10px 12px;font-weight:850}.map-result-list{display:flex;flex-direction:column;gap:10px}.map-result-list article{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;background:#fff;border:1px solid #e2ebe5;border-radius:16px;padding:12px}.map-result-list strong{display:block;color:#064e45}.map-result-list span,.map-result-list small{display:block;color:#64748b;font-size:12px;font-weight:750;line-height:1.45;margin-top:4px}.map-result-list button{border:none;background:#ffc22b;color:#063c38;border-radius:12px;padding:10px 12px;font-weight:900;cursor:pointer}.map-preview-card{border:1px solid #dbe7e2;border-radius:18px;overflow:hidden;background:#fff}.map-preview-card iframe{width:100%;height:300px;border:0;display:block}.map-coordinate-note{padding:12px 14px;background:#f8fafc;color:#64748b;font-weight:850}.map-coordinate-note strong{color:#064e45}.location-manual-grid{margin-top:14px}
@media(max-width:1100px){.explore-admin-hero,.manager-grid,.manager-grid.single,.gallery-body-grid{grid-template-columns:1fr}.place-list-card{position:static}.mini-form{grid-template-columns:1fr 1fr}.admin-place-item{grid-template-columns:70px 1fr auto}.admin-place-item button.danger{grid-column:3}.existing-photo-grid{grid-template-columns:1fr}}@media(max-width:700px){.form-grid,.form-grid.two,.month-grid,.mini-form,.map-result-list article{grid-template-columns:1fr}.admin-place-item{grid-template-columns:60px 1fr}.admin-place-item button{grid-column:span 1}.explore-admin-hero{padding:20px}.explore-admin-hero h1{font-size:34px}.gallery-overlay{padding:10px}.gallery-modal{padding:16px}.gallery-head{flex-direction:column}.existing-photo-card{grid-template-columns:1fr}.existing-photo-card img{width:100%;height:180px}.delete-photo-btn{grid-column:1}.gallery-callout{flex-direction:column;align-items:stretch}.gallery-callout button{width:100%}}
`;
