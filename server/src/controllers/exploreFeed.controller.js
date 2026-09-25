const pool = require("../config/db");

const parseJson = (value, fallback = []) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const clampInteger = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const baseSelect = `
  SELECT
    p.*,
    c.slug AS category_slug,
    c.label AS category_label,
    c.icon AS category_icon
  FROM explore_places p
  LEFT JOIN explore_categories c ON c.id = p.category_id
`;

const buildFilters = (query = {}) => {
  const {
    q,
    category,
    region,
    budget,
    featured,
  } = query;

  const conditions = ["p.status = 'published'"];
  const params = [];

  if (category && category !== "all") {
    conditions.push("c.slug = ?");
    params.push(String(category).trim());
  }

  if (region && region !== "All Regions") {
    conditions.push("p.region = ?");
    params.push(String(region).trim());
  }

  if (budget && budget !== "All Budgets") {
    conditions.push("p.budget = ?");
    params.push(String(budget).trim());
  }

  if (String(featured) === "true") {
    conditions.push("p.featured = TRUE");
  }

  if (q && String(q).trim()) {
    const like = `%${String(q).trim().toLowerCase()}%`;

    conditions.push(`(
      LOWER(p.name) LIKE ? OR
      LOWER(p.city) LIKE ? OR
      LOWER(p.district) LIKE ? OR
      LOWER(p.region) LIKE ? OR
      LOWER(p.vibe) LIKE ? OR
      LOWER(JSON_EXTRACT(p.tags, '$')) LIKE ?
    )`);

    params.push(like, like, like, like, like, like);
  }

  return {
    whereSql: `WHERE ${conditions.join(" AND ")}`,
    params,
  };
};

const getOrderBy = (sort) => {
  switch (sort) {
    case "budgetLow":
      return "p.budget_score ASC, p.estimated_cost ASC, p.sort_order ASC, p.id ASC";
    case "budgetHigh":
      return "p.budget_score DESC, p.estimated_cost DESC, p.sort_order ASC, p.id ASC";
    case "cost":
      return "p.estimated_cost ASC, p.sort_order ASC, p.id ASC";
    case "name":
      return "p.name ASC, p.id ASC";
    case "recommended":
    default:
      return "p.featured DESC, p.sort_order ASC, p.id ASC";
  }
};

const getImagesForPlaces = async (placeIds) => {
  if (!placeIds.length) return {};

  const [rows] = await pool.query(
    `SELECT
       id,
       place_id,
       image_url,
       alt_text,
       is_main,
       sort_order,
       created_at
     FROM explore_place_images
     WHERE place_id IN (?)
     ORDER BY place_id ASC, is_main DESC, sort_order ASC, id ASC`,
    [placeIds]
  );

  return rows.reduce((accumulator, row) => {
    if (!accumulator[row.place_id]) {
      accumulator[row.place_id] = [];
    }

    accumulator[row.place_id].push(row);
    return accumulator;
  }, {});
};

const mapPlace = (row, imageRows = []) => {
  const photoRecords = imageRows.map((image, index) => ({
    id: image.id,
    place_id: image.place_id,
    image_url: image.image_url,
    image: image.image_url,
    url: image.image_url,
    alt_text: image.alt_text || `${row.name} photo ${index + 1}`,
    is_main: Boolean(image.is_main),
    sort_order: Number(image.sort_order || index + 1),
    created_at: image.created_at,
  }));

  const gallery = photoRecords
    .map((image) => image.image_url)
    .filter(Boolean);

  const mainPhoto =
    photoRecords.find((image) => image.is_main) ||
    photoRecords[0] ||
    null;

  const mainImage = row.image_url || mainPhoto?.image_url || "";

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    district: row.district,
    region: row.region,
    categoryId: row.category_id,
    category: row.category_slug || null,
    categoryLabel: row.category_label || null,
    categoryIcon: row.category_icon || null,
    image: mainImage,
    image_url: mainImage,
    images: gallery.length ? gallery : mainImage ? [mainImage] : [],
    photos: photoRecords,
    shortDescription: row.short_description || "",
    short_description: row.short_description || "",
    fullDescription: row.full_description || "",
    full_description: row.full_description || "",
    duration: row.duration || "",
    bestTime: row.best_time || "",
    best_time: row.best_time || "",
    bestMonths: parseJson(row.best_months, []),
    best_months: parseJson(row.best_months, []),
    budget: row.budget || "Medium",
    budgetScore: Number(row.budget_score || 0),
    budget_score: Number(row.budget_score || 0),
    estimatedCost: Number(row.estimated_cost || 0),
    estimated_cost: Number(row.estimated_cost || 0),
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    featured: Boolean(row.featured),
    vibe: row.vibe || "",
    tags: parseJson(row.tags, []),
    experiences: parseJson(row.experiences, []),
    highlights: parseJson(row.highlights, []),
    nearbyPlaces: parseJson(row.nearby_places, []),
    nearby_places: parseJson(row.nearby_places, []),
    tips: parseJson(row.tips, []),
    openingHours: row.opening_hours || "",
    opening_hours: row.opening_hours || "",
    entryFee: row.entry_fee || "",
    entry_fee: row.entry_fee || "",
    facilities: parseJson(row.facilities, []),
    status: row.status,
    sortOrder: Number(row.sort_order || 0),
    sort_order: Number(row.sort_order || 0),
  };
};

const getExploreFeed = async (req, res) => {
  try {
    const page = clampInteger(req.query.page, 1, 1, 1000000);
    const limit = clampInteger(req.query.limit, 12, 1, 24);
    const offset = (page - 1) * limit;

    const { whereSql, params } = buildFilters(req.query);
    const orderBy = getOrderBy(req.query.sort);

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM explore_places p
       LEFT JOIN explore_categories c ON c.id = p.category_id
       ${whereSql}`,
      params
    );

    const total = Number(countRow?.total || 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    const [rows] = await pool.query(
      `${baseSelect}
       ${whereSql}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const imageMap = await getImagesForPlaces(rows.map((row) => row.id));
    const places = rows.map((row) => mapPlace(row, imageMap[row.id] || []));

    return res.json({
      success: true,
      places,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Get explore feed error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load Explore places",
    });
  }
};

module.exports = {
  getExploreFeed,
};
