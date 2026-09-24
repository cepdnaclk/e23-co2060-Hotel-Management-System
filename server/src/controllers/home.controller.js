const pool = require("../config/db");

/* =========================================================
   HELPERS
   ========================================================= */

const parseJson = (value, fallback = []) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (Array.isArray(value) || typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};


/* =========================================================
   DATA MAPPERS
   ========================================================= */

const mapSection = (row) => ({
  id: row.id,
  key: row.section_key,

  eyebrow: row.eyebrow || "",
  title: row.title || "",
  description: row.description || "",

  primaryAction:
    row.primary_button_label && row.primary_button_url
      ? {
          label: row.primary_button_label,
          url: row.primary_button_url,
        }
      : null,

  secondaryAction:
    row.secondary_button_label && row.secondary_button_url
      ? {
          label: row.secondary_button_label,
          url: row.secondary_button_url,
        }
      : null,

  media: {
    type: row.media_type || "none",
    path: row.media_path || "",
    poster: row.poster_path || "",
    alt: row.alt_text || "",
  },

  sortOrder: Number(row.sort_order || 0),
});


const mapQuickAction = (row) => ({
  id: row.id,
  key: row.action_key,

  label: row.label || "",
  title: row.title || "",
  description: row.description || "",

  buttonLabel: row.button_label || "",
  targetUrl: row.target_url || "",

  icon: row.icon || "",

  mediaPath: row.media_path || "",
  altText: row.alt_text || "",

  sortOrder: Number(row.sort_order || 0),
});


const mapPlace = (row) => ({
  id: row.id,
  slug: row.slug,

  name: row.name,
  city: row.city || "",
  district: row.district || "",
  region: row.region || "",

  category: row.category_label || "",

  imageUrl: row.image_url || "",

  shortDescription: row.short_description || "",

  vibe: row.vibe || "",

  estimatedCost: Number(row.estimated_cost || 0),

  featured: Boolean(row.featured),
});


const mapHotel = (row) => ({
  id: row.id,

  name: row.name,

  city: row.city || "",
  district: row.district || "",

  propertyType: row.property_type || "Hotel",

  description: row.description || "",
  quote: row.quote || "",

  imageUrl: row.image_url || "",

  verified: Boolean(row.is_verified),

  bookingCount: Number(row.booking_count || 0),
});


const mapEvent = (row) => {
  const price = Number(row.price || 0);

  return {
    id: row.id,
    eventId: row.id,

    slug: row.slug,

    title: row.title,

    category: row.category || "",

    city: row.city || "",
    district: row.district || "",
    venue: row.venue || "",

    eventDate: row.event_date,

    dateLabel: row.date_label || "",
    timeLabel: row.time_label || "",

    shortDescription: row.short_description || "",

    imageUrl: row.image_url || "",

    featured: Boolean(row.featured),

    price,

    priceLabel:
      price === 0
        ? "Free entry"
        : `LKR ${price.toLocaleString()}`,
  };
};


const mapGuide = (row) => ({
  id: row.id,

  slug: row.slug,

  name:
    row.display_name ||
    row.full_name ||
    "Local guide",

  fullName: row.full_name || "",

  guideType: row.guide_type || "",

  city: row.city || "",
  district: row.district || "",

  languages: parseJson(
    row.languages,
    []
  ),

  experienceYears: Number(
    row.experience_years || 0
  ),

  shortDescription:
    row.short_description || "",

  imageUrl: row.image_url || "",

  rating: Number(
    row.rating || 0
  ),

  totalReviews: Number(
    row.total_reviews || 0
  ),

  pricePerDay: Number(
    row.price_per_day || 0
  ),

  promoted: Boolean(
    row.is_promoted
  ),
});


/* =========================================================
   PUBLIC HOME PAGE
   ========================================================= */

const getHomePage = async (req, res) => {
  try {
    const [
      [sectionRows],
      [quickActionRows],
      [placeRows],
      [hotelRows],
      [eventRows],
      [guideRows],
    ] = await Promise.all([
      /* =====================================================
         HOME SECTION CONTENT
         ===================================================== */

      pool.query(`
        SELECT
          id,
          section_key,
          eyebrow,
          title,
          description,

          primary_button_label,
          primary_button_url,

          secondary_button_label,
          secondary_button_url,

          media_type,
          media_path,
          poster_path,
          alt_text,

          sort_order

        FROM home_sections

        WHERE is_active = TRUE

        ORDER BY
          sort_order ASC,
          id ASC
      `),


      /* =====================================================
         HOME QUICK ACTION CONFIG

         Still returned because the Trip Planner home preview
         uses this data even though the old quick-card section
         was removed from the UI.
         ===================================================== */

      pool.query(`
        SELECT
          id,
          action_key,
          label,
          title,
          description,
          button_label,
          target_url,
          icon,
          media_path,
          alt_text,
          sort_order

        FROM home_quick_actions

        WHERE is_active = TRUE

        ORDER BY
          sort_order ASC,
          id ASC
      `),


      /* =====================================================
         FEATURED PLACES

         Rules:
         - published only
         - featured places first
         - configured sort order next
         - only 6 records sent to Home

         This stays scalable even if thousands of places exist.
         ===================================================== */

      pool.query(`
        SELECT
          p.id,
          p.slug,
          p.name,
          p.city,
          p.district,
          p.region,

          p.short_description,
          p.vibe,
          p.estimated_cost,

          p.featured,

          c.label AS category_label,

          COALESCE(
            (
              SELECT
                pi.image_url

              FROM explore_place_images pi

              WHERE
                pi.place_id = p.id

              ORDER BY
                pi.is_main DESC,
                pi.sort_order ASC,
                pi.id ASC

              LIMIT 1
            ),
            p.image_url
          ) AS image_url

        FROM explore_places p

        LEFT JOIN explore_categories c
          ON c.id = p.category_id

        WHERE
          p.status = 'published'

        ORDER BY
          p.featured DESC,
          p.sort_order ASC,
          p.updated_at DESC,
          p.id DESC

        LIMIT 6
      `),


      /* =====================================================
         VERIFIED HOTELS

         Current properties table does not contain a hotel
         review/rating field.

         Therefore:
         - approved + verified only
         - registration payment valid
         - active payment status
         - properties with more real bookings rank higher
         - maximum 4 records for Home
         ===================================================== */

      pool.query(`
        SELECT
          p.id,
          p.name,
          p.city,
          p.district,

          p.property_type,

          p.description,
          p.quote,

          p.is_verified,

          COALESCE(
            (
              SELECT
                pp.image_url

              FROM property_photos pp

              WHERE
                pp.property_id = p.id

              ORDER BY
                pp.is_main DESC,
                pp.id ASC

              LIMIT 1
            ),
            p.logo_url
          ) AS image_url,

          COALESCE(
            booking_stats.booking_count,
            0
          ) AS booking_count

        FROM properties p

        LEFT JOIN (
          SELECT
            b.property_id,
            COUNT(*) AS booking_count

          FROM bookings b

          WHERE
            LOWER(
              COALESCE(
                b.booking_status,
                ''
              )
            ) NOT LIKE '%cancel%'

            AND LOWER(
              COALESCE(
                b.booking_status,
                ''
              )
            ) NOT LIKE '%reject%'

          GROUP BY
            b.property_id
        ) booking_stats
          ON booking_stats.property_id = p.id

        WHERE
          p.status = 'approved'

          AND p.is_verified = TRUE

          AND p.registration_payment_status = 'Paid'

          AND (
            p.monthly_payment_status IN (
              'Free Trial',
              'Paid'
            )

            OR p.next_monthly_due_date >= NOW()
          )

        ORDER BY
          COALESCE(
            booking_stats.booking_count,
            0
          ) DESC,

          p.updated_at DESC,
          p.id DESC

        LIMIT 4
      `),


      /* =====================================================
         UPCOMING EVENTS

         Rules:
         - approved only
         - current/future events
         - hidden/moderated events excluded
         - featured events first
         - closest upcoming date next
         - maximum 4 records
         ===================================================== */

      pool.query(`
        SELECT
          e.id,
          e.slug,
          e.title,

          e.category,

          e.city,
          e.district,
          e.venue,

          e.event_date,

          e.date_label,
          e.time_label,

          e.short_description,

          e.image_url,

          e.price,

          e.featured

        FROM tourist_events e

        WHERE
          e.status = 'approved'

          AND (
            e.event_date IS NULL
            OR e.event_date >= CURDATE()
          )

          AND NOT EXISTS (
            SELECT 1

            FROM event_moderation m

            WHERE
              m.event_id = e.id
              AND m.is_hidden = TRUE
          )

        ORDER BY
          e.featured DESC,

          CASE
            WHEN e.event_date IS NULL
            THEN 1
            ELSE 0
          END ASC,

          e.event_date ASC,

          e.approved_at DESC,
          e.id DESC

        LIMIT 4
      `),


      /* =====================================================
         BEST-RATED GUIDES

         Ranking:
         1. Guides with actual reviews first
         2. Highest real average review rating
         3. Most reviews
         4. Stored rating as fallback
         5. Active promotion as secondary priority
         6. Maximum 4 guides

         No fake rating is generated.
         ===================================================== */

      pool.query(`
        SELECT
          g.id,
          g.slug,

          g.full_name,
          g.display_name,

          g.guide_type,

          g.city,
          g.district,

          g.languages,

          g.experience_years,

          g.short_description,

          g.image_url,

          COALESCE(
            review_stats.average_rating,
            g.rating,
            0
          ) AS rating,

          COALESCE(
            review_stats.review_count,
            g.total_reviews,
            0
          ) AS total_reviews,

          g.price_per_day,

          g.is_promoted,
          g.promotion_expires_at,
          g.promotion_sort_order

        FROM partner_guides g

        LEFT JOIN (
          SELECT
            gr.guide_id,

            ROUND(
              AVG(gr.rating),
              2
            ) AS average_rating,

            COUNT(*) AS review_count

          FROM guide_reviews gr

          GROUP BY
            gr.guide_id
        ) review_stats
          ON review_stats.guide_id = g.id

        WHERE
          g.status = 'approved'

          AND g.registration_payment_status = 'Paid'

        ORDER BY

          CASE
            WHEN COALESCE(
              review_stats.review_count,
              0
            ) > 0

            THEN 0

            ELSE 1
          END ASC,

          COALESCE(
            review_stats.average_rating,
            g.rating,
            0
          ) DESC,

          COALESCE(
            review_stats.review_count,
            g.total_reviews,
            0
          ) DESC,

          CASE
            WHEN
              g.is_promoted = TRUE

              AND (
                g.promotion_expires_at IS NULL

                OR g.promotion_expires_at >= NOW()
              )

            THEN 0

            ELSE 1
          END ASC,

          g.promotion_sort_order ASC,

          g.id DESC

        LIMIT 4
      `),

    ]);


    /* =====================================================
       CONVERT HOME SECTIONS INTO KEYED OBJECT
       ===================================================== */

    const sections = {};

    sectionRows.forEach((row) => {
      const section =
        mapSection(row);

      sections[section.key] =
        section;
    });


    /* =====================================================
       RESPONSE
       ===================================================== */

    return res.json({
      success: true,

      data: {
        sections,

        quickActions:
          quickActionRows.map(
            mapQuickAction
          ),

        featuredPlaces:
          placeRows.map(
            mapPlace
          ),

        featuredHotels:
          hotelRows.map(
            mapHotel
          ),

        upcomingEvents:
          eventRows.map(
            mapEvent
          ),

        featuredGuides:
          guideRows.map(
            mapGuide
          ),
      },
    });
  } catch (error) {
    console.error(
      "Get home page error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          "Home page data could not be loaded.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
  }
};


module.exports = {
  getHomePage,
};