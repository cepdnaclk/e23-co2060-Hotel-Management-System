const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const parseJson = (value, fallback = []) => {
  if (value === null || value === undefined) return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toJson = (value, fallback = []) => {
  if (value === null || value === undefined || value === "") {
    return JSON.stringify(fallback);
  }

  if (typeof value === "string") {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify(
        value
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
      );
    }
  }

  return JSON.stringify(value);
};

const slugify = (value) => {
  return String(value || "place")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const uniqueSlug = async (name, currentId = null) => {
  const base = slugify(name);
  let slug = base;
  let count = 1;

  while (true) {
    const params = [slug];
    let sql = "SELECT id FROM explore_places WHERE slug = ?";

    if (currentId) {
      sql += " AND id <> ?";
      params.push(currentId);
    }

    const [rows] = await pool.query(sql, params);
    if (rows.length === 0) return slug;

    count += 1;
    slug = `${base}-${count}`;
  }
};

const normaliseImageRows = (images = [], row = {}) => {
  const imageRows = Array.isArray(images) ? images : [];

  if (imageRows.length > 0) {
    return imageRows.map((img, index) => ({
      id: img.id,
      place_id: img.place_id,
      image_url: img.image_url,
      image: img.image_url,
      url: img.image_url,
      alt_text: img.alt_text || `${row.name || "Place"} photo ${index + 1}`,
      is_main: Boolean(img.is_main),
      sort_order: Number(img.sort_order || index + 1),
      created_at: img.created_at,
    }));
  }

  if (row.image_url) {
    return [
      {
        id: null,
        place_id: row.id,
        image_url: row.image_url,
        image: row.image_url,
        url: row.image_url,
        alt_text: `${row.name || "Place"} main photo`,
        is_main: true,
        sort_order: 1,
      },
    ];
  }

  return [];
};

const mapPlace = (row, images = []) => {
  const photoRecords = normaliseImageRows(images, row);
  const imageList = photoRecords.map((img) => img.image_url).filter(Boolean);
  const mainImageRecord = photoRecords.find((img) => img.is_main) || photoRecords[0] || null;
  const mainImage = row.image_url || mainImageRecord?.image_url || "";

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
    images: imageList,
    photos: photoRecords,
    imageRecords: photoRecords,
    shortDescription: row.short_description || "",
    short_description: row.short_description || "",
    fullDescription: row.full_description || "",
    full_description: row.full_description || "",
    duration: row.duration || "",
    bestTime: row.best_time || "",
    best_time: row.best_time || "",
    bestMonths: parseJson(row.best_months, []),
    best_months: parseJson(row.best_months, []),
    budget: row.budget,
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
    sortOrder: row.sort_order,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const getImagesForPlaces = async (placeIds) => {
  if (!placeIds.length) return {};

  const [rows] = await pool.query(
    `SELECT * FROM explore_place_images
     WHERE place_id IN (?)
     ORDER BY is_main DESC, sort_order ASC, id ASC`,
    [placeIds]
  );

  return rows.reduce((acc, img) => {
    if (!acc[img.place_id]) acc[img.place_id] = [];
    acc[img.place_id].push(img);
    return acc;
  }, {});
};

const deleteLocalUploadFile = (imageUrl) => {
  if (!imageUrl || !String(imageUrl).startsWith("/uploads/")) return;

  const safeFileName = path.basename(imageUrl);
  const filePath = path.join(__dirname, "../../uploads", safeFileName);

  fs.unlink(filePath, (error) => {
    if (error && error.code !== "ENOENT") {
      console.warn("Could not delete uploaded image file:", error.message);
    }
  });
};

const refreshPlaceMainImage = async (connection, placeId) => {
  const [images] = await connection.query(
    `SELECT * FROM explore_place_images
     WHERE place_id = ?
     ORDER BY is_main DESC, sort_order ASC, id ASC`,
    [placeId]
  );

  if (!images.length) {
    await connection.query("UPDATE explore_places SET image_url = NULL WHERE id = ?", [placeId]);
    return null;
  }

  let mainImage = images.find((img) => Boolean(img.is_main)) || images[0];

  const hasMain = images.some((img) => Boolean(img.is_main));
  if (!hasMain) {
    await connection.query("UPDATE explore_place_images SET is_main = FALSE WHERE place_id = ?", [placeId]);
    await connection.query("UPDATE explore_place_images SET is_main = TRUE WHERE id = ?", [mainImage.id]);
    mainImage = { ...mainImage, is_main: true };
  }

  await connection.query("UPDATE explore_places SET image_url = ? WHERE id = ?", [mainImage.image_url, placeId]);
  return mainImage.image_url;
};

const basePlaceSelect = `
  SELECT
    p.*,
    c.slug AS category_slug,
    c.label AS category_label,
    c.icon AS category_icon
  FROM explore_places p
  LEFT JOIN explore_categories c ON c.id = p.category_id
`;

const getExploreCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, slug, label, icon, color, sort_order, is_active
       FROM explore_categories
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, label ASC`
    );

    return res.json({
      success: true,
      categories: [
        { id: "all", slug: "all", label: "All Places", icon: "🌏" },
        ...rows.map((row) => ({ ...row, id: row.slug })),
      ],
    });
  } catch (error) {
    console.error("Get explore categories error:", error);
    return res.status(500).json({ success: false, message: "Failed to load categories" });
  }
};

const getExploreSettings = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT setting_key, setting_value FROM explore_settings");
    const settings = {};

    rows.forEach((row) => {
      settings[row.setting_key] = parseJson(row.setting_value, null);
    });

    return res.json({ success: true, settings });
  } catch (error) {
    console.error("Get explore settings error:", error);
    return res.status(500).json({ success: false, message: "Failed to load settings" });
  }
};

const getExplorePlaces = async (req, res) => {
  try {
    const { q, category, region, budget, sort, featured, status } = req.query;
    const conditions = [];
    const params = [];

    if (req.user?.role === "admin" && status && status !== "all") {
      conditions.push("p.status = ?");
      params.push(status);
    } else if (!req.user || req.user.role !== "admin") {
      conditions.push("p.status = 'published'");
    }

    if (category && category !== "all") {
      conditions.push("c.slug = ?");
      params.push(category);
    }

    if (region && region !== "All Regions") {
      conditions.push("p.region = ?");
      params.push(region);
    }

    if (budget && budget !== "All Budgets") {
      conditions.push("p.budget = ?");
      params.push(budget);
    }

    if (featured === "true") {
      conditions.push("p.featured = TRUE");
    }

    if (q && q.trim()) {
      const like = `%${q.trim().toLowerCase()}%`;
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

    let orderBy = "p.featured DESC, p.sort_order ASC, p.id ASC";
    if (sort === "budgetLow") orderBy = "p.budget_score ASC, p.estimated_cost ASC";
    if (sort === "budgetHigh") orderBy = "p.budget_score DESC, p.estimated_cost DESC";
    if (sort === "name") orderBy = "p.name ASC";
    if (sort === "cost") orderBy = "p.estimated_cost ASC";

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `${basePlaceSelect} ${whereSql} ORDER BY ${orderBy}`,
      params
    );

    const imageMap = await getImagesForPlaces(rows.map((row) => row.id));
    const places = rows.map((row) => mapPlace(row, imageMap[row.id] || []));

    return res.json({ success: true, count: places.length, places });
  } catch (error) {
    console.error("Get explore places error:", error);
    return res.status(500).json({ success: false, message: "Failed to load places" });
  }
};

const getExplorePlaceById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `${basePlaceSelect}
       WHERE (p.id = ? OR p.slug = ?)
       ${req.user?.role === "admin" ? "" : "AND p.status = 'published'"}
       LIMIT 1`,
      [id, id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Place not found" });
    }

    const imageMap = await getImagesForPlaces([rows[0].id]);
    const place = mapPlace(rows[0], imageMap[rows[0].id] || []);

    return res.json({ success: true, place });
  } catch (error) {
    console.error("Get explore place error:", error);
    return res.status(500).json({ success: false, message: "Failed to load place" });
  }
};

const getSeasonalPlaces = async (req, res) => {
  try {
    const rawMonth = req.query.month;
    const month = rawMonth === undefined ? new Date().getMonth() : Number(rawMonth);
    const safeMonth = Number.isInteger(month) && month >= 0 && month <= 11 ? month : new Date().getMonth();

    const [allRows] = await pool.query(
      `${basePlaceSelect}
       WHERE p.status = 'published'
       ORDER BY p.featured DESC, p.sort_order ASC, p.id ASC`
    );

    const rows = allRows
      .filter((row) => parseJson(row.best_months, []).includes(safeMonth))
      .slice(0, 8);

    const imageMap = await getImagesForPlaces(rows.map((row) => row.id));
    const places = rows.map((row) => mapPlace(row, imageMap[row.id] || []));

    return res.json({
      success: true,
      month: safeMonth,
      monthName: monthNames[safeMonth],
      places,
    });
  } catch (error) {
    console.error("Get seasonal places error:", error);
    return res.status(500).json({ success: false, message: "Failed to load seasonal places" });
  }
};

const getExploreItineraries = async (req, res) => {
  try {
    const [itineraries] = await pool.query(
      `SELECT * FROM explore_itineraries
       WHERE status = 'published'
       ORDER BY sort_order ASC, id ASC`
    );

    if (!itineraries.length) {
      return res.json({ success: true, itineraries: [] });
    }

    const [rows] = await pool.query(
      `${basePlaceSelect.replace("SELECT", "SELECT ip.itinerary_id,")}
       INNER JOIN explore_itinerary_places ip ON ip.place_id = p.id
       WHERE ip.itinerary_id IN (?) AND p.status = 'published'
       ORDER BY ip.itinerary_id ASC, ip.sort_order ASC`,
      [itineraries.map((item) => item.id)]
    );

    const imageMap = await getImagesForPlaces(rows.map((row) => row.id));

    const placesByItinerary = rows.reduce((acc, row) => {
      if (!acc[row.itinerary_id]) acc[row.itinerary_id] = [];
      acc[row.itinerary_id].push(mapPlace(row, imageMap[row.id] || []));
      return acc;
    }, {});

    return res.json({
      success: true,
      itineraries: itineraries.map((item) => ({
        ...item,
        places: placesByItinerary[item.id] || [],
      })),
    });
  } catch (error) {
    console.error("Get itineraries error:", error);
    return res.status(500).json({ success: false, message: "Failed to load itineraries" });
  }
};

const getAdminExploreCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM explore_categories ORDER BY sort_order ASC, label ASC`
    );
    return res.json({ success: true, categories: rows });
  } catch (error) {
    console.error("Admin get explore categories error:", error);
    return res.status(500).json({ success: false, message: "Failed to load categories" });
  }
};

const createAdminExploreCategory = async (req, res) => {
  try {
    const { label, slug, icon, color, sort_order, is_active } = req.body;

    if (!label) {
      return res.status(400).json({ success: false, message: "Category label is required" });
    }

    const finalSlug = slugify(slug || label);

    await pool.query(
      `INSERT INTO explore_categories (slug, label, icon, color, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        finalSlug,
        String(label).trim(),
        icon || "📍",
        color || null,
        Number(sort_order || 0),
        is_active === false || is_active === "false" ? false : true,
      ]
    );

    return res.status(201).json({ success: true, message: "Category created successfully" });
  } catch (error) {
    console.error("Create explore category error:", error);
    return res.status(500).json({ success: false, message: "Failed to create category" });
  }
};

const updateAdminExploreCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, slug, icon, color, sort_order, is_active } = req.body;

    if (!label) {
      return res.status(400).json({ success: false, message: "Category label is required" });
    }

    await pool.query(
      `UPDATE explore_categories
       SET slug = ?, label = ?, icon = ?, color = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [
        slugify(slug || label),
        String(label).trim(),
        icon || "📍",
        color || null,
        Number(sort_order || 0),
        is_active === false || is_active === "false" ? false : true,
        id,
      ]
    );

    return res.json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    console.error("Update explore category error:", error);
    return res.status(500).json({ success: false, message: "Failed to update category" });
  }
};

const deleteAdminExploreCategory = async (req, res) => {
  try {
    await pool.query("DELETE FROM explore_categories WHERE id = ?", [req.params.id]);
    return res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete explore category error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete category" });
  }
};

const placeValuesFromBody = async (body, currentId = null, uploadedFiles = []) => {
  const slug = await uniqueSlug(body.name, currentId);
  let categoryId = body.category_id || null;

  if (!categoryId && body.category) {
    const [catRows] = await pool.query("SELECT id FROM explore_categories WHERE slug = ? LIMIT 1", [body.category]);
    categoryId = catRows[0]?.id || null;
  }

  const uploadedMain = uploadedFiles[0] ? `/uploads/${uploadedFiles[0].filename}` : null;
  const imageUrl = body.image_url || uploadedMain || null;

  return {
    slug,
    values: [
      slug,
      body.name,
      body.city,
      body.district || null,
      body.region || null,
      categoryId,
      imageUrl,
      body.short_description || body.shortDescription || "",
      body.full_description || body.fullDescription || "",
      body.duration || "",
      body.best_time || body.bestTime || "",
      toJson(body.best_months || body.bestMonths, []),
      body.budget || "Medium",
      Number(body.budget_score || body.budgetScore || 2),
      Number(body.estimated_cost || body.estimatedCost || 0),
      body.lat === "" || body.lat === undefined ? null : Number(body.lat),
      body.lng === "" || body.lng === undefined ? null : Number(body.lng),
      body.featured === true || body.featured === "true" || body.featured === "1",
      body.vibe || "",
      toJson(body.tags, []),
      toJson(body.experiences, []),
      toJson(body.highlights, []),
      toJson(body.nearby_places || body.nearbyPlaces, []),
      toJson(body.tips, []),
      body.opening_hours || body.openingHours || "",
      body.entry_fee || body.entryFee || "",
      toJson(body.facilities, []),
      body.status || "published",
      Number(body.sort_order || body.sortOrder || 0),
    ],
  };
};

const adminCreateExplorePlace = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const files = req.files || [];

    if (!req.body.name || !req.body.city) {
      return res.status(400).json({ success: false, message: "Place name and city are required" });
    }

    const { values } = await placeValuesFromBody(req.body, null, files);

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO explore_places
       (slug, name, city, district, region, category_id, image_url, short_description, full_description,
        duration, best_time, best_months, budget, budget_score, estimated_cost, lat, lng, featured, vibe,
        tags, experiences, highlights, nearby_places, tips, opening_hours, entry_fee, facilities, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values
    );

    const placeId = result.insertId;

    for (let i = 0; i < files.length; i += 1) {
      await connection.query(
        `INSERT INTO explore_place_images (place_id, image_url, alt_text, is_main, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [placeId, `/uploads/${files[i].filename}`, `${req.body.name} photo ${i + 1}`, i === 0, i + 1]
      );
    }

    if (!files.length && req.body.image_url) {
      await connection.query(
        `INSERT INTO explore_place_images (place_id, image_url, alt_text, is_main, sort_order)
         VALUES (?, ?, ?, TRUE, 1)`,
        [placeId, req.body.image_url, `${req.body.name} main photo`]
      );
    }

    await connection.commit();

    return res.status(201).json({ success: true, message: "Place created successfully", id: placeId });
  } catch (error) {
    await connection.rollback();
    console.error("Create explore place error:", error);
    return res.status(500).json({ success: false, message: "Failed to create place" });
  } finally {
    connection.release();
  }
};

const adminUpdateExplorePlace = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const files = req.files || [];

    if (!req.body.name || !req.body.city) {
      return res.status(400).json({ success: false, message: "Place name and city are required" });
    }

    const { values } = await placeValuesFromBody(req.body, id, files);

    await connection.beginTransaction();

    await connection.query(
      `UPDATE explore_places SET
        slug = ?, name = ?, city = ?, district = ?, region = ?, category_id = ?, image_url = COALESCE(?, image_url),
        short_description = ?, full_description = ?, duration = ?, best_time = ?, best_months = ?,
        budget = ?, budget_score = ?, estimated_cost = ?, lat = ?, lng = ?, featured = ?, vibe = ?,
        tags = ?, experiences = ?, highlights = ?, nearby_places = ?, tips = ?, opening_hours = ?, entry_fee = ?,
        facilities = ?, status = ?, sort_order = ?
       WHERE id = ?`,
      [...values, id]
    );

    for (let i = 0; i < files.length; i += 1) {
      await connection.query(
        `INSERT INTO explore_place_images (place_id, image_url, alt_text, is_main, sort_order)
         VALUES (?, ?, ?, FALSE, ?)`,
        [id, `/uploads/${files[i].filename}`, `${req.body.name} photo ${i + 1}`, i + 1]
      );
    }

    if (files.length) {
      await refreshPlaceMainImage(connection, id);
    }

    await connection.commit();

    return res.json({ success: true, message: "Place updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Update explore place error:", error);
    return res.status(500).json({ success: false, message: "Failed to update place" });
  } finally {
    connection.release();
  }
};

const adminUploadExploreImages = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ success: false, message: "Please choose at least one photo" });
    }

    await connection.beginTransaction();

    const [placeRows] = await connection.query("SELECT id, name, image_url FROM explore_places WHERE id = ? LIMIT 1", [id]);
    if (!placeRows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Place not found" });
    }

    const place = placeRows[0];
    const [existingImages] = await connection.query(
      "SELECT id, is_main FROM explore_place_images WHERE place_id = ? ORDER BY sort_order ASC, id ASC",
      [id]
    );

    const alreadyHasMain = existingImages.some((img) => Boolean(img.is_main));
    const startOrder = existingImages.length + 1;

    for (let i = 0; i < files.length; i += 1) {
      const shouldBeMain = existingImages.length === 0 && !alreadyHasMain && i === 0;
      await connection.query(
        `INSERT INTO explore_place_images (place_id, image_url, alt_text, is_main, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [id, `/uploads/${files[i].filename}`, `${place.name} photo ${startOrder + i}`, shouldBeMain, startOrder + i]
      );
    }

    await refreshPlaceMainImage(connection, id);
    await connection.commit();

    return res.status(201).json({ success: true, message: "Photos uploaded successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Upload explore images error:", error);
    return res.status(500).json({ success: false, message: "Failed to upload photos" });
  } finally {
    connection.release();
  }
};

const adminDeleteExplorePlace = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [images] = await connection.query("SELECT image_url FROM explore_place_images WHERE place_id = ?", [id]);
    await connection.query("DELETE FROM explore_places WHERE id = ?", [id]);

    await connection.commit();

    images.forEach((image) => deleteLocalUploadFile(image.image_url));

    return res.json({ success: true, message: "Place deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Delete explore place error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete place" });
  } finally {
    connection.release();
  }
};

const adminDeleteExploreImage = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { imageId } = req.params;

    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT id, place_id, image_url, is_main FROM explore_place_images WHERE id = ? LIMIT 1",
      [imageId]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    const image = rows[0];

    await connection.query("DELETE FROM explore_place_images WHERE id = ?", [imageId]);
    await refreshPlaceMainImage(connection, image.place_id);

    await connection.commit();

    deleteLocalUploadFile(image.image_url);

    return res.json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Delete explore image error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete image" });
  } finally {
    connection.release();
  }
};

module.exports = {
  getExploreCategories,
  getExploreSettings,
  getExplorePlaces,
  getExplorePlaceById,
  getSeasonalPlaces,
  getExploreItineraries,
  getAdminExploreCategories,
  createAdminExploreCategory,
  updateAdminExploreCategory,
  deleteAdminExploreCategory,
  adminCreateExplorePlace,
  adminUpdateExplorePlace,
  adminUploadExploreImages,
  adminDeleteExplorePlace,
  adminDeleteExploreImage,
};
