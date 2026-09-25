USE tourismhub_lk;

START TRANSACTION;

-- =========================================================
-- TRIPLANKA
-- EXTRA EXPLORE DESTINATIONS
--
-- Safe existing-database migration.
-- Can be executed more than once.
-- Existing records are matched by unique slug; ONLY image_url is updated.
-- All existing descriptions, categories, publishing and sorting are preserved.
-- Missing places use the seed below, resolving categories by slug.
-- Run once at a time; repeated runs do not add duplicate places or gallery paths.
--
-- Images are stored in the Git repository.
-- MySQL stores only the public image path.
-- =========================================================


-- =========================================================
-- 1. POLONNARUWA ANCIENT CITY
-- =========================================================

INSERT INTO explore_places
(
    slug,
    name,
    city,
    district,
    region,
    category_id,
    image_url,
    short_description,
    full_description,
    duration,
    best_time,
    best_months,
    budget,
    budget_score,
    estimated_cost,
    lat,
    lng,
    featured,
    vibe,
    tags,
    experiences,
    highlights,
    nearby_places,
    tips,
    opening_hours,
    entry_fee,
    facilities,
    status,
    sort_order
)
VALUES
(
    'polonnaruwa-ancient-city',
    'Polonnaruwa Ancient City',
    'Polonnaruwa',
    'Polonnaruwa',
    'Cultural Triangle',

    (
        SELECT id
        FROM explore_categories
        WHERE slug = 'heritage'
        LIMIT 1
    ),

    '/images/destinations/polonnaruwa-ancient-city/main.jpg',

    'Explore the ruins, monuments and ancient reservoirs of Sri Lanka''s historic medieval capital.',

    'Polonnaruwa Ancient City contains an extensive collection of archaeological monuments, royal structures, religious sites and reservoirs from one of Sri Lanka''s most important historic capitals.',

    '4-5 hours',

    'Early morning',

    JSON_ARRAY(
        0,
        1,
        2,
        5,
        6,
        7
    ),

    'Medium',
    2,
    6500.00,

    7.940300,
    81.018800,

    FALSE,

    'Culture',

    JSON_ARRAY(
        'Heritage',
        'Ruins',
        'History',
        'Photography'
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'title',
            'Ancient City Tour',

            'description',
            'Explore the main archaeological monuments and historic structures.',

            'duration',
            '3-4 hours',

            'cost',
            0
        ),

        JSON_OBJECT(
            'title',
            'Cycling Around the Ruins',

            'description',
            'Travel between the main archaeological areas by bicycle.',

            'duration',
            '2-3 hours',

            'cost',
            1500
        )
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'icon',
            '🏛️',

            'title',
            'Gal Vihara',

            'description',
            'A celebrated group of rock-cut Buddha statues.'
        ),

        JSON_OBJECT(
            'icon',
            '👑',

            'title',
            'Royal Palace Area',

            'description',
            'Explore the remains of the historic royal complex.'
        )
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'name',
            'Minneriya National Park',

            'type',
            'National Park'
        ),

        JSON_OBJECT(
            'name',
            'Sigiriya',

            'type',
            'Heritage'
        )
    ),

    JSON_ARRAY(
        'Start early to avoid the strongest midday heat.',
        'Carry drinking water.',
        'Allow enough time to explore the large archaeological area.'
    ),

    NULL,
    NULL,

    JSON_ARRAY(
        'Parking nearby',
        'Visitor facilities nearby'
    ),

    'published',
    11
)

ON DUPLICATE KEY UPDATE
    image_url = VALUES(image_url);


-- =========================================================
-- 2. ANURADHAPURA SACRED CITY
-- =========================================================

INSERT INTO explore_places
(
    slug,
    name,
    city,
    district,
    region,
    category_id,
    image_url,
    short_description,
    full_description,
    duration,
    best_time,
    best_months,
    budget,
    budget_score,
    estimated_cost,
    lat,
    lng,
    featured,
    vibe,
    tags,
    experiences,
    highlights,
    nearby_places,
    tips,
    opening_hours,
    entry_fee,
    facilities,
    status,
    sort_order
)
VALUES
(
    'anuradhapura-sacred-city',
    'Anuradhapura Sacred City',
    'Anuradhapura',
    'Anuradhapura',
    'Cultural Triangle',

    (
        SELECT id
        FROM explore_categories
        WHERE slug = 'heritage'
        LIMIT 1
    ),

    '/images/destinations/anuradhapura-sacred-city/main.jpg',

    'Discover ancient stupas, monasteries and sacred sites in one of Sri Lanka''s oldest historic capitals.',

    'Anuradhapura is one of Sri Lanka''s most significant ancient cities, known for large stupas, monastery complexes, historic reservoirs and important Buddhist heritage sites.',

    '5-6 hours',

    'Early morning or late afternoon',

    JSON_ARRAY(
        0,
        1,
        2,
        5,
        6,
        7
    ),

    'Medium',
    2,
    7000.00,

    8.311400,
    80.403700,

    TRUE,

    'History',

    JSON_ARRAY(
        'Ancient',
        'Heritage',
        'Sacred',
        'Architecture'
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'title',
            'Sacred City Tour',

            'description',
            'Explore major religious and archaeological landmarks across the ancient city.',

            'duration',
            '4-5 hours',

            'cost',
            0
        ),

        JSON_OBJECT(
            'title',
            'Ancient Reservoir Visit',

            'description',
            'Explore historic reservoirs and surrounding heritage areas.',

            'duration',
            '1-2 hours',

            'cost',
            0
        )
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'icon',
            '🛕',

            'title',
            'Ruwanwelisaya',

            'description',
            'One of the best-known ancient stupas in Anuradhapura.'
        ),

        JSON_OBJECT(
            'icon',
            '🌳',

            'title',
            'Sri Maha Bodhi',

            'description',
            'One of the most important sacred locations in the ancient city.'
        )
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'name',
            'Mihintale',

            'type',
            'Sacred Site'
        ),

        JSON_OBJECT(
            'name',
            'Wilpattu National Park',

            'type',
            'National Park'
        )
    ),

    JSON_ARRAY(
        'Dress respectfully when visiting sacred areas.',
        'Remove footwear where required.',
        'Allow several hours because the main attractions are spread over a large area.'
    ),

    NULL,
    NULL,

    JSON_ARRAY(
        'Parking nearby',
        'Visitor facilities nearby'
    ),

    'published',
    12
)

ON DUPLICATE KEY UPDATE
    image_url = VALUES(image_url);


-- =========================================================
-- 3. HORTON PLAINS NATIONAL PARK
-- =========================================================

INSERT INTO explore_places
(
    slug,
    name,
    city,
    district,
    region,
    category_id,
    image_url,
    short_description,
    full_description,
    duration,
    best_time,
    best_months,
    budget,
    budget_score,
    estimated_cost,
    lat,
    lng,
    featured,
    vibe,
    tags,
    experiences,
    highlights,
    nearby_places,
    tips,
    opening_hours,
    entry_fee,
    facilities,
    status,
    sort_order
)
VALUES
(
    'horton-plains-national-park',
    'Horton Plains National Park',
    'Nuwara Eliya',
    'Nuwara Eliya',
    'Hill Country',

    (
        SELECT id
        FROM explore_categories
        WHERE slug = 'nature'
        LIMIT 1
    ),

    '/images/destinations/horton-plains-national-park/main.jpg',

    'Walk through Sri Lanka''s highland grasslands and cloud forest to dramatic viewpoints and waterfalls.',

    'Horton Plains National Park is a high-altitude protected landscape known for montane grasslands, cloud forest, walking trails, wildlife and dramatic viewpoints including World''s End.',

    '4-5 hours',

    'Early morning',

    JSON_ARRAY(
        0,
        1,
        2
    ),

    'Medium',
    2,
    6000.00,

    6.802800,
    80.807200,

    TRUE,

    'Nature',

    JSON_ARRAY(
        'Nature',
        'Hiking',
        'Wildlife',
        'Photography'
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'title',
            'World''s End Trail',

            'description',
            'Follow the main walking route through the highlands to the famous viewpoint.',

            'duration',
            '3-4 hours',

            'cost',
            0
        ),

        JSON_OBJECT(
            'title',
            'Baker''s Falls',

            'description',
            'Visit one of the best-known waterfalls inside the park.',

            'duration',
            '1 hour',

            'cost',
            0
        )
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'icon',
            '⛰️',

            'title',
            'World''s End',

            'description',
            'A dramatic escarpment viewpoint in Sri Lanka''s central highlands.'
        ),

        JSON_OBJECT(
            'icon',
            '🌿',

            'title',
            'Cloud Forest',

            'description',
            'Distinctive high-altitude vegetation and mountain scenery.'
        )
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'name',
            'Nuwara Eliya',

            'type',
            'Hill Town'
        ),

        JSON_OBJECT(
            'name',
            'Ohiya',

            'type',
            'Hill Country'
        ),

        JSON_OBJECT(
            'name',
            'Ambewela',

            'type',
            'Scenic Area'
        )
    ),

    JSON_ARRAY(
        'Arrive early before cloud cover reduces the main views.',
        'Carry a light jacket because temperatures can be cool.',
        'Stay on the marked walking trails.'
    ),

    NULL,
    NULL,

    JSON_ARRAY(
        'Parking',
        'Visitor centre',
        'Walking trails'
    ),

    'published',
    13
)

ON DUPLICATE KEY UPDATE
    image_url = VALUES(image_url);


-- =========================================================
-- 4. ARUGAM BAY
-- =========================================================

INSERT INTO explore_places
(
    slug,
    name,
    city,
    district,
    region,
    category_id,
    image_url,
    short_description,
    full_description,
    duration,
    best_time,
    best_months,
    budget,
    budget_score,
    estimated_cost,
    lat,
    lng,
    featured,
    vibe,
    tags,
    experiences,
    highlights,
    nearby_places,
    tips,
    opening_hours,
    entry_fee,
    facilities,
    status,
    sort_order
)
VALUES
(
    'arugam-bay',
    'Arugam Bay',
    'Arugam Bay',
    'Ampara',
    'East Coast',

    (
        SELECT id
        FROM explore_categories
        WHERE slug = 'beach'
        LIMIT 1
    ),

    '/images/destinations/arugam-bay/main.jpg',

    'A relaxed east-coast beach destination known for surfing, coastal scenery and laid-back travel.',

    'Arugam Bay is a popular destination on Sri Lanka''s east coast, combining sandy beaches, surfing, coastal scenery and access to nearby natural attractions.',

    '1-2 days',

    'Morning and late afternoon',

    JSON_ARRAY(
        4,
        5,
        6,
        7,
        8
    ),

    'Medium',
    2,
    5000.00,

    6.840400,
    81.836800,

    TRUE,

    'Adventure',

    JSON_ARRAY(
        'Beach',
        'Surfing',
        'Relaxation',
        'Sunrise'
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'title',
            'Surfing',

            'description',
            'Enjoy surfing at one of Sri Lanka''s well-known east-coast destinations.',

            'duration',
            '2-3 hours',

            'cost',
            3000
        ),

        JSON_OBJECT(
            'title',
            'Beach Walk',

            'description',
            'Enjoy the coastline during the cooler morning or evening hours.',

            'duration',
            '1-2 hours',

            'cost',
            0
        )
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'icon',
            '🏖️',

            'title',
            'Arugam Bay Beach',

            'description',
            'A broad sandy coastline popular with local and international travellers.'
        ),

        JSON_OBJECT(
            'icon',
            '🏄',

            'title',
            'Surf Coast',

            'description',
            'A coastal area known for seasonal surfing conditions.'
        )
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'name',
            'Pottuvil',

            'type',
            'Town'
        ),

        JSON_OBJECT(
            'name',
            'Kumana National Park',

            'type',
            'National Park'
        )
    ),

    JSON_ARRAY(
        'Check local sea conditions before swimming or surfing.',
        'Use sun protection during midday hours.',
        'Beginners should use an experienced local surf instructor.'
    ),

    NULL,
    NULL,

    JSON_ARRAY(
        'Restaurants nearby',
        'Accommodation nearby',
        'Surf services'
    ),

    'published',
    14
)

ON DUPLICATE KEY UPDATE
    image_url = VALUES(image_url);


-- =========================================================
-- 5. JAFFNA FORT
-- =========================================================

INSERT INTO explore_places
(
    slug,
    name,
    city,
    district,
    region,
    category_id,
    image_url,
    short_description,
    full_description,
    duration,
    best_time,
    best_months,
    budget,
    budget_score,
    estimated_cost,
    lat,
    lng,
    featured,
    vibe,
    tags,
    experiences,
    highlights,
    nearby_places,
    tips,
    opening_hours,
    entry_fee,
    facilities,
    status,
    sort_order
)
VALUES
(
    'jaffna-fort',
    'Jaffna Fort',
    'Jaffna',
    'Jaffna',
    'Northern Region',

    (
        SELECT id
        FROM explore_categories
        WHERE slug = 'heritage'
        LIMIT 1
    ),

    '/images/destinations/jaffna-fort/main.jpg',

    'Explore a historic coastal fort and its ramparts in the heart of Jaffna.',

    'Jaffna Fort is a major historic landmark in northern Sri Lanka. Its walls, bastions and coastal setting provide visitors with a strong sense of the region''s layered history.',

    '1-2 hours',

    'Late afternoon',

    JSON_ARRAY(
        0,
        1,
        2,
        5,
        6,
        7
    ),

    'Low',
    1,
    2500.00,

    9.662800,
    80.008900,

    FALSE,

    'Culture',

    JSON_ARRAY(
        'Fort',
        'History',
        'Architecture',
        'Photography'
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'title',
            'Fort Walk',

            'description',
            'Walk through the historic fort area and explore its architecture.',

            'duration',
            '1-2 hours',

            'cost',
            0
        )
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'icon',
            '🏰',

            'title',
            'Historic Ramparts',

            'description',
            'Explore the defensive walls and bastions of the fort.'
        ),

        JSON_OBJECT(
            'icon',
            '🌊',

            'title',
            'Coastal Setting',

            'description',
            'Enjoy the fort''s location beside the Jaffna coastline.'
        )
    ),

    JSON_ARRAY(
        JSON_OBJECT(
            'name',
            'Jaffna Public Library',

            'type',
            'Landmark'
        ),

        JSON_OBJECT(
            'name',
            'Nallur Kandaswamy Temple',

            'type',
            'Temple'
        )
    ),

    JSON_ARRAY(
        'Visit later in the day when temperatures are cooler.',
        'Carry drinking water.',
        'Combine the visit with nearby attractions in Jaffna city.'
    ),

    NULL,
    NULL,

    JSON_ARRAY(
        'Parking nearby',
        'City facilities nearby'
    ),

    'published',
    15
)

ON DUPLICATE KEY UPDATE
    image_url = VALUES(image_url);


-- =========================================================
-- MAIN IMAGE RECORDS
-- =========================================================

-- Make sure the selected local image becomes the main image
-- while keeping any future gallery images.

UPDATE explore_place_images epi

INNER JOIN explore_places p
    ON p.id = epi.place_id

SET epi.is_main = FALSE

WHERE p.slug IN
(
    'polonnaruwa-ancient-city',
    'anuradhapura-sacred-city',
    'horton-plains-national-park',
    'arugam-bay',
    'jaffna-fort'
);


-- ---------------------------------------------------------
-- POLONNARUWA IMAGE
-- ---------------------------------------------------------

INSERT INTO explore_place_images
(
    place_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)

SELECT
    p.id,
    '/images/destinations/polonnaruwa-ancient-city/main.jpg',
    'Polonnaruwa Ancient City',
    TRUE,
    1

FROM explore_places p

WHERE p.slug =
    'polonnaruwa-ancient-city'

AND NOT EXISTS
(
    SELECT 1

    FROM explore_place_images epi

    WHERE epi.place_id =
        p.id

    AND epi.image_url =
        '/images/destinations/polonnaruwa-ancient-city/main.jpg'
);


UPDATE explore_place_images epi

INNER JOIN explore_places p
    ON p.id = epi.place_id

SET
    epi.is_main = TRUE,
    epi.sort_order = 1,
    epi.alt_text =
        'Polonnaruwa Ancient City'

WHERE p.slug =
    'polonnaruwa-ancient-city'

AND epi.image_url =
    '/images/destinations/polonnaruwa-ancient-city/main.jpg';


-- ---------------------------------------------------------
-- ANURADHAPURA IMAGE
-- ---------------------------------------------------------

INSERT INTO explore_place_images
(
    place_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)

SELECT
    p.id,
    '/images/destinations/anuradhapura-sacred-city/main.jpg',
    'Anuradhapura Sacred City',
    TRUE,
    1

FROM explore_places p

WHERE p.slug =
    'anuradhapura-sacred-city'

AND NOT EXISTS
(
    SELECT 1

    FROM explore_place_images epi

    WHERE epi.place_id =
        p.id

    AND epi.image_url =
        '/images/destinations/anuradhapura-sacred-city/main.jpg'
);


UPDATE explore_place_images epi

INNER JOIN explore_places p
    ON p.id = epi.place_id

SET
    epi.is_main = TRUE,
    epi.sort_order = 1,
    epi.alt_text =
        'Anuradhapura Sacred City'

WHERE p.slug =
    'anuradhapura-sacred-city'

AND epi.image_url =
    '/images/destinations/anuradhapura-sacred-city/main.jpg';


-- ---------------------------------------------------------
-- HORTON PLAINS IMAGE
-- ---------------------------------------------------------

INSERT INTO explore_place_images
(
    place_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)

SELECT
    p.id,
    '/images/destinations/horton-plains-national-park/main.jpg',
    'Horton Plains National Park',
    TRUE,
    1

FROM explore_places p

WHERE p.slug =
    'horton-plains-national-park'

AND NOT EXISTS
(
    SELECT 1

    FROM explore_place_images epi

    WHERE epi.place_id =
        p.id

    AND epi.image_url =
        '/images/destinations/horton-plains-national-park/main.jpg'
);


UPDATE explore_place_images epi

INNER JOIN explore_places p
    ON p.id = epi.place_id

SET
    epi.is_main = TRUE,
    epi.sort_order = 1,
    epi.alt_text =
        'Horton Plains National Park'

WHERE p.slug =
    'horton-plains-national-park'

AND epi.image_url =
    '/images/destinations/horton-plains-national-park/main.jpg';


-- ---------------------------------------------------------
-- ARUGAM BAY IMAGE
-- ---------------------------------------------------------

INSERT INTO explore_place_images
(
    place_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)

SELECT
    p.id,
    '/images/destinations/arugam-bay/main.jpg',
    'Arugam Bay',
    TRUE,
    1

FROM explore_places p

WHERE p.slug =
    'arugam-bay'

AND NOT EXISTS
(
    SELECT 1

    FROM explore_place_images epi

    WHERE epi.place_id =
        p.id

    AND epi.image_url =
        '/images/destinations/arugam-bay/main.jpg'
);


UPDATE explore_place_images epi

INNER JOIN explore_places p
    ON p.id = epi.place_id

SET
    epi.is_main = TRUE,
    epi.sort_order = 1,
    epi.alt_text =
        'Arugam Bay'

WHERE p.slug =
    'arugam-bay'

AND epi.image_url =
    '/images/destinations/arugam-bay/main.jpg';


-- ---------------------------------------------------------
-- JAFFNA FORT IMAGE
-- ---------------------------------------------------------

INSERT INTO explore_place_images
(
    place_id,
    image_url,
    alt_text,
    is_main,
    sort_order
)

SELECT
    p.id,
    '/images/destinations/jaffna-fort/main.jpg',
    'Jaffna Fort',
    TRUE,
    1

FROM explore_places p

WHERE p.slug =
    'jaffna-fort'

AND NOT EXISTS
(
    SELECT 1

    FROM explore_place_images epi

    WHERE epi.place_id =
        p.id

    AND epi.image_url =
        '/images/destinations/jaffna-fort/main.jpg'
);


UPDATE explore_place_images epi

INNER JOIN explore_places p
    ON p.id = epi.place_id

SET
    epi.is_main = TRUE,
    epi.sort_order = 1,
    epi.alt_text =
        'Jaffna Fort'

WHERE p.slug =
    'jaffna-fort'

AND epi.image_url =
    '/images/destinations/jaffna-fort/main.jpg';


COMMIT;


-- =========================================================
-- VERIFY
-- =========================================================

SELECT
    p.id,
    p.slug,
    p.name,
    p.city,
    p.region,
    c.label AS category,
    p.image_url,
    p.featured,
    p.status,
    p.sort_order

FROM explore_places p

LEFT JOIN explore_categories c
    ON c.id =
       p.category_id

WHERE p.slug IN
(
    'polonnaruwa-ancient-city',
    'anuradhapura-sacred-city',
    'horton-plains-national-park',
    'arugam-bay',
    'jaffna-fort'
)

ORDER BY
    p.sort_order ASC;


SELECT
    p.name,
    epi.image_url,
    epi.is_main,
    epi.sort_order

FROM explore_place_images epi

INNER JOIN explore_places p
    ON p.id =
       epi.place_id

WHERE p.slug IN
(
    'polonnaruwa-ancient-city',
    'anuradhapura-sacred-city',
    'horton-plains-national-park',
    'arugam-bay',
    'jaffna-fort'
)

ORDER BY
    p.sort_order ASC,
    epi.sort_order ASC;


SELECT
    COUNT(*) AS total_published_places

FROM explore_places

WHERE status =
    'published';