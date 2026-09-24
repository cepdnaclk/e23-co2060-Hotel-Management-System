USE tourismhub_lk;

CREATE TABLE IF NOT EXISTS home_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,

    section_key VARCHAR(80) NOT NULL UNIQUE,

    eyebrow VARCHAR(120) NULL,
    title VARCHAR(220) NOT NULL,
    description TEXT NULL,

    primary_button_label VARCHAR(100) NULL,
    primary_button_url VARCHAR(255) NULL,

    secondary_button_label VARCHAR(100) NULL,
    secondary_button_url VARCHAR(255) NULL,

    media_type ENUM('none', 'image', 'video')
        NOT NULL DEFAULT 'none',

    media_path TEXT NULL,
    poster_path TEXT NULL,
    alt_text VARCHAR(220) NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_home_sections_active_sort (
        is_active,
        sort_order
    )
);


CREATE TABLE IF NOT EXISTS home_quick_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    action_key VARCHAR(80) NOT NULL UNIQUE,

    label VARCHAR(120) NULL,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(320) NULL,

    button_label VARCHAR(100) NOT NULL,
    target_url VARCHAR(255) NOT NULL,

    icon VARCHAR(30) NULL,

    media_path TEXT NULL,
    alt_text VARCHAR(220) NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_home_quick_actions_active_sort (
        is_active,
        sort_order
    )
);

-- Remove the old statistics section because it is no longer rendered on Home.
DELETE FROM home_sections WHERE section_key = 'stats';

-- =========================================================
-- HOME PAGE CONTENT
-- =========================================================

INSERT INTO home_sections
(
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
    is_active,
    sort_order
)
VALUES
(
    'hero',
    'DISCOVER • PLAN • TRAVEL',
    'Your Sri Lanka journey, planned your way.',
    'Explore places, find stays and build your route with confidence.',
    'Explore Sri Lanka', '/explore',
    'Plan a trip', '/trip-planner',
    'video', '/videos/sri-lanka-real-hero.mp4', '/videos/sri-lanka-real-hero-poster.jpg',
    'Sri Lanka travel scenery', TRUE, 1
),
(
    'featured_places', 'EXPLORE SRI LANKA', 'Places worth adding to your journey.',
    'Discover destinations across the island.', 'Explore more', '/explore',
    NULL, NULL, 'none', NULL, NULL, NULL, TRUE, 2
),
(
    'trip_planner', 'PLAN YOUR JOURNEY', 'Build each day with confidence.',
    'Add destinations, compare routes and save your plan.', 'Start planning', '/trip-planner',
    NULL, NULL, 'none', NULL, NULL, NULL, TRUE, 3
),
(
    'featured_hotels', 'VERIFIED STAYS', 'Stay close to your journey.',
    'Browse approved stays around Sri Lanka.', 'Browse hotels', '/hotels',
    NULL, NULL, 'none', NULL, NULL, NULL, TRUE, 4
),
(
    'events', 'UPCOMING EVENTS', 'See what is happening around the island.',
    'Find approved events for your journey.', 'View events', '/events',
    NULL, NULL, 'none', NULL, NULL, NULL, TRUE, 5
),
(
    'guides', 'LOCAL GUIDES', 'Travel with local knowledge.',
    'Meet approved guides across Sri Lanka.', 'Find guides', '/tourist-guides',
    NULL, NULL, 'none', NULL, NULL, NULL, TRUE, 6
),
(
    'partner', 'TOURISM PARTNERS', 'Bring your service to TripLanka travellers.',
    NULL, 'Become a Partner', '/list-your-property',
    NULL, NULL, 'none', NULL, NULL, NULL, TRUE, 7
)
ON DUPLICATE KEY UPDATE
    eyebrow = VALUES(eyebrow),
    title = VALUES(title),
    description = VALUES(description),
    primary_button_label = VALUES(primary_button_label),
    primary_button_url = VALUES(primary_button_url),
    secondary_button_label = VALUES(secondary_button_label),
    secondary_button_url = VALUES(secondary_button_url),
    media_type = VALUES(media_type),
    media_path = VALUES(media_path),
    poster_path = VALUES(poster_path),
    alt_text = VALUES(alt_text),
    is_active = VALUES(is_active),
    sort_order = VALUES(sort_order);

INSERT INTO home_quick_actions
(
    action_key, label, title, description, button_label, target_url,
    icon, media_path, alt_text, is_active, sort_order
)
VALUES
('explore', 'Discover', 'Explore Sri Lanka', 'Find places and experiences.', 'Start exploring', '/explore', '🧭', NULL, NULL, TRUE, 1),
('hotels', 'Stay', 'Find verified stays', 'Browse approved properties.', 'Browse hotels', '/hotels', '🏨', NULL, NULL, TRUE, 2),
('planner', 'Plan', 'Build your trip', 'Create a clear day-by-day journey.', 'Plan my trip', '/trip-planner', '🗺️', NULL, NULL, TRUE, 3)
ON DUPLICATE KEY UPDATE
    label = VALUES(label),
    title = VALUES(title),
    description = VALUES(description),
    button_label = VALUES(button_label),
    target_url = VALUES(target_url),
    icon = VALUES(icon),
    media_path = VALUES(media_path),
    alt_text = VALUES(alt_text),
    is_active = VALUES(is_active),
    sort_order = VALUES(sort_order);
