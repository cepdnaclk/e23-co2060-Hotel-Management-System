USE tourismhub_lk;

CREATE TABLE IF NOT EXISTS tourist_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  explore_place_id INT NULL,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  venue VARCHAR(180),
  month_name VARCHAR(40),
  month_number INT DEFAULT 1,
  date_label VARCHAR(100),
  time_label VARCHAR(100),
  price_type ENUM('Free','Budget','Paid','Premium') DEFAULT 'Budget',
  price DECIMAL(10,2) DEFAULT 0.00,
  duration VARCHAR(100),
  short_description TEXT,
  description TEXT,
  image_url TEXT,
  map_url TEXT,
  near_hotels JSON,
  highlights JSON,
  guide_recommended BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  status ENUM('draft','published','hidden') DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tourist_events_place
    FOREIGN KEY (explore_place_id) REFERENCES explore_places(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_tourist_events_status ON tourist_events(status);
CREATE INDEX idx_tourist_events_filters ON tourist_events(status, category, city, month_name, price_type);
CREATE INDEX idx_tourist_events_place ON tourist_events(explore_place_id, status);

DELETE FROM tourist_events
WHERE slug IN (
  'kandy-cultural-dance-night',
  'colombo-street-food-walk',
  'mirissa-sunset-beach-music',
  'ella-tea-estate-experience',
  'galle-fort-heritage-evening',
  'sigiriya-village-food-experience',
  'bentota-water-sports-day',
  'yala-wildlife-evening-talk'
);

INSERT INTO tourist_events
(slug, explore_place_id, title, category, city, district, venue, month_name, month_number, date_label, time_label, price_type, price, duration, short_description, description, image_url, map_url, near_hotels, highlights, guide_recommended, featured, status)
VALUES
(
  'kandy-cultural-dance-night',
  (SELECT id FROM explore_places WHERE slug = 'temple-of-the-sacred-tooth-relic' LIMIT 1),
  'Kandy Cultural Dance Night', 'Cultural & Religious', 'Kandy', 'Kandy', 'Kandy Lake Club Cultural Theatre', 'July', 7, 'Every evening', '6:30 PM - 8:15 PM', 'Budget', 1500, '1 hr 45 min',
  'Traditional Kandyan dance, drumming, masks, and fire performance close to Kandy Lake and the Temple of the Tooth.',
  'A colourful evening experience for tourists who want to understand Sri Lankan culture in a short time. The performance includes Kandyan dance, traditional drums, mask dances, and a fire walking finale.',
  'https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1400&q=85',
  'https://www.google.com/maps/search/?api=1&query=Kandy+Lake+Club+Cultural+Dance',
  JSON_ARRAY('Kandy Lake Hotel', 'Queen''s Hotel', 'Temple View Hotel', 'Lake View Resort'),
  JSON_ARRAY('Kandyan dance and drumming', 'Easy evening plan', 'Family friendly', 'Near Kandy hotels'),
  TRUE, TRUE, 'published'
),
(
  'colombo-street-food-walk',
  NULL,
  'Colombo Street Food Walk', 'Food & Culinary', 'Colombo', 'Colombo', 'Galle Face and Pettah Market', 'August', 8, 'Weekends', '5:00 PM - 8:30 PM', 'Paid', 3500, '3 hr 30 min',
  'Taste kottu, hoppers, isso wade, tropical juices, and Sri Lankan sweets while exploring Colombo''s evening food streets.',
  'A city food route designed for tourists staying in Colombo before travelling around the island. It combines local snacks, market stops, city stories, and safe walking guidance.',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=85',
  'https://www.google.com/maps/search/?api=1&query=Galle+Face+Colombo+street+food',
  JSON_ARRAY('Cinnamon Grand', 'Galle Face Hotel', 'Marino Beach Colombo', 'Colombo City Stay'),
  JSON_ARRAY('Sri Lankan street food', 'Pettah market walk', 'Vegetarian options', 'City evening photos'),
  TRUE, TRUE, 'published'
),
(
  'mirissa-sunset-beach-music',
  (SELECT id FROM explore_places WHERE slug = 'mirissa-beach-and-whale-watching' LIMIT 1),
  'Mirissa Sunset Beach Music', 'Beach & Coastal', 'Mirissa', 'Matara', 'Mirissa Beach', 'December', 12, 'Friday - Sunday', '5:30 PM - 10:00 PM', 'Free', 0, '4 hr 30 min',
  'A relaxed beach evening with sunset views, soft music, seafood stalls, mocktails, and coastal atmosphere.',
  'A casual event for backpackers, couples, and beach lovers. Tourists can enjoy the sunset after whale watching or surfing and then return easily to nearby stays.',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
  'https://www.google.com/maps/search/?api=1&query=Mirissa+Beach+Sri+Lanka',
  JSON_ARRAY('Mirissa Beach Resort', 'Coconut Tree Hill Stay', 'South Coast Villa'),
  JSON_ARRAY('Sunset beach atmosphere', 'Live acoustic music', 'Food stalls', 'Walking distance from beach hotels'),
  FALSE, TRUE, 'published'
),
(
  'ella-tea-estate-experience',
  (SELECT id FROM explore_places WHERE slug = 'nine-arch-bridge' LIMIT 1),
  'Ella Tea Estate Experience', 'Adventure & Nature', 'Ella', 'Badulla', 'Halpewatte Tea Factory', 'March', 3, 'Daily', '9:00 AM - 12:00 PM', 'Budget', 2200, '3 hr',
  'Walk through tea gardens, learn how Ceylon tea is produced, and enjoy a tasting session with hill-country views.',
  'This morning experience fits well with Ella sightseeing. It is ideal before Nine Arch Bridge or Little Adam''s Peak and connects nature, photography, and local tea culture.',
  'https://images.unsplash.com/photo-1567515275959-4421b83c7056?auto=format&fit=crop&w=1400&q=85',
  'https://www.google.com/maps/search/?api=1&query=Halpewatte+Tea+Factory+Ella',
  JSON_ARRAY('Ella Mountain Resort', 'Morning Dew Hotel', 'Zion View Ella', 'Tea Garden View'),
  JSON_ARRAY('Tea garden walk', 'Factory tour', 'Tea tasting', 'Hill-country views'),
  TRUE, TRUE, 'published'
),
(
  'galle-fort-heritage-evening',
  (SELECT id FROM explore_places WHERE slug = 'galle-fort' LIMIT 1),
  'Galle Fort Heritage Evening', 'Cultural & Religious', 'Galle', 'Galle', 'Galle Dutch Fort', 'January', 1, 'This month', '4:00 PM - 7:00 PM', 'Budget', 2800, '3 hr',
  'Explore colonial streets, lighthouse views, boutique cafes, and sunset stories inside the UNESCO-listed Galle Fort.',
  'A heritage evening walk designed for tourists who want a calm cultural experience near boutique hotels and restaurants in Galle Fort.',
  'https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1400&q=85',
  'https://www.google.com/maps/search/?api=1&query=Galle+Fort+Sri+Lanka',
  JSON_ARRAY('Fort Bazaar', 'Galle Fort Hotel', 'Heritage Villa', 'Rampart View Stay'),
  JSON_ARRAY('UNESCO fort walk', 'Sunset ramparts', 'Colonial architecture', 'Cafe stops'),
  TRUE, FALSE, 'published'
),
(
  'sigiriya-village-food-experience',
  (SELECT id FROM explore_places WHERE slug = 'sigiriya-rock-fortress' LIMIT 1),
  'Sigiriya Village Food Experience', 'Food & Culinary', 'Sigiriya', 'Matale', 'Sigiriya Village Area', 'February', 2, 'Daily', '11:00 AM - 2:00 PM', 'Paid', 4200, '3 hr',
  'Cook and taste rice and curry, coconut sambol, herbal drinks, and village-style sweets after a Sigiriya morning visit.',
  'A local food experience for tourists visiting Sigiriya or Dambulla. It is suitable as a lunch stop after the rock fortress climb.',
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1400&q=85',
  'https://www.google.com/maps/search/?api=1&query=Sigiriya+village+tour+Sri+Lanka',
  JSON_ARRAY('Sigiriya Village Hotel', 'Aliya Resort', 'Water Garden Sigiriya'),
  JSON_ARRAY('Village cooking', 'Traditional lunch', 'Local host family', 'Great after Sigiriya climb'),
  TRUE, FALSE, 'published'
),
(
  'bentota-water-sports-day',
  NULL,
  'Bentota Water Sports Day', 'Adventure & Nature', 'Bentota', 'Galle', 'Bentota River', 'April', 4, 'Daily', '10:00 AM - 4:00 PM', 'Premium', 9500, 'Half day',
  'Jet ski, banana boat, river safari, and beginner-friendly water activities near Bentota beach hotels.',
  'A high-energy coastal activity day for tourists who want more than beach relaxation. Activity choices can be selected based on comfort and weather.',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85',
  'https://www.google.com/maps/search/?api=1&query=Bentota+water+sports',
  JSON_ARRAY('Taj Bentota', 'Avani Bentota', 'Bentota Beach Resort'),
  JSON_ARRAY('Water sports', 'River safari', 'Beach hotels nearby', 'Instructor support'),
  FALSE, FALSE, 'published'
),
(
  'yala-wildlife-evening-talk',
  (SELECT id FROM explore_places WHERE slug = 'yala-national-park' LIMIT 1),
  'Yala Wildlife Evening Talk', 'Adventure & Nature', 'Yala', 'Hambantota', 'Tissamaharama Safari Camp Area', 'June', 6, 'Selected evenings', '6:30 PM - 8:00 PM', 'Free', 0, '1 hr 30 min',
  'Learn safari safety, leopard behaviour, birdlife, and responsible wildlife tourism before a Yala safari day.',
  'A useful evening session for tourists planning a safari. It improves safety awareness and helps visitors understand Yala without disturbing wildlife.',
  'https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=1400&q=85',
  'https://www.google.com/maps/search/?api=1&query=Yala+National+Park+Sri+Lanka',
  JSON_ARRAY('Yala Safari Camp', 'Cinnamon Wild Yala', 'Tissa Lake Resort'),
  JSON_ARRAY('Safari safety', 'Wildlife awareness', 'Leopard and birdlife facts', 'Responsible travel'),
  TRUE, FALSE, 'published'
);
