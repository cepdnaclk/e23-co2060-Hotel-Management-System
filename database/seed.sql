USE tourismhub_lk;

-- Seed accounts use the shared development password hash already used by the project.
-- Change credentials before any real deployment.

INSERT INTO users
(full_name, email, phone, nationality, national_id, password_hash, role, is_active)
VALUES
('System Admin', 'admin@triplanka.lk', '+94 70 00 00 000', 'Sri Lankan', NULL, '$2a$10$UzpnY3RU/AA5CSifoo8tZ.h2wGvzvaA3MjmFj7kPd7z6/.O79DXvG', 'admin', TRUE),
('Sun Lanka Travels', 'partner@triplanka.lk', '+94 71 11 11 111', 'Sri Lankan', NULL, '$2a$10$UzpnY3RU/AA5CSifoo8tZ.h2wGvzvaA3MjmFj7kPd7z6/.O79DXvG', 'partner', TRUE);

INSERT INTO property_plans
(plan_key, plan_name, room_limit, registration_fee, monthly_fee, description, is_active)
VALUES
('standard', 'Normal Version', 50, 5000.00, 2500.00, 'Normal version allows maximum 50 rooms.', TRUE),
('premium', 'Premium Version', 100, 8500.00, 4000.00, 'Premium version allows maximum 100 rooms.', TRUE);

INSERT INTO payment_methods
(method_name, method_type, account_details, instructions, is_active)
VALUES
('Commercial Bank Transfer', 'bank_transfer', 'Account Name: TripLanka\nAccount No: 1234567890\nBranch: Colombo', 'Use property name as payment reference and keep receipt.', TRUE),
('Online Card Payment', 'card', 'Configured card payment gateway', 'Card payments are processed through the configured payment gateway.', TRUE),
('Cash Deposit', 'cash', 'TripLanka Office, Colombo', 'Submit receipt after deposit.', TRUE);

INSERT INTO properties
(
  partner_id, name, city, district, address, description, quote, logo_url, hero_title,
  theme_color, property_password_hash, property_type,
  plan_type, room_limit,
  registration_fee, registration_payment_status, registration_payment_method_id, registration_paid_at,
  monthly_charge, monthly_payment_status, monthly_payment_method_id, monthly_paid_at,
  monthly_cycle_start, monthly_cycle_end, next_monthly_due_date,
  platform_registration_fee, fee_payment_status,
  status, is_verified, rejection_reason
)
VALUES
(
  2, 'Kandy Lake Hotel', 'Kandy', 'Kandy', 'No 123, Lake Road, Kandy',
  'A beautiful hotel near Kandy Lake with mountain views, cultural attractions, comfortable rooms, and Sri Lankan hospitality.',
  'Relax near the cultural heart of Sri Lanka.',
  '/images/hotels/kandy-lake-hotel/logo.jpg',
  'Kandy Lake Hotel', '#0f766e', '$2b$10$Irpq9a/MJ7m.aN.mH4jR6Ot0kVh.DaJzVjkPUS8m9LJ4kkX3V/ZGa', 'Hotel',
  'standard', 50,
  5000.00, 'Paid', 1, NOW(),
  2500.00, 'Free Trial', NULL, NULL,
  NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 1 MONTH),
  5000.00, 'Paid',
  'approved', TRUE, NULL
),
(
  2, 'Colombo City Stay', 'Colombo', 'Colombo', 'No 45, Galle Road, Colombo',
  'A modern city hotel close to shopping areas, restaurants, business centers, and transport facilities.',
  'Stay close to Colombo city life.',
  '/images/hotels/colombo-city-stay/logo.jpg',
  'Colombo City Stay', '#5b1235', '$2b$10$Irpq9a/MJ7m.aN.mH4jR6Ot0kVh.DaJzVjkPUS8m9LJ4kkX3V/ZGa', 'Hotel',
  'premium', 100,
  8500.00, 'Unpaid', NULL, NULL,
  4000.00, 'Free Trial', NULL, NULL,
  NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 1 MONTH),
  8500.00, 'Unpaid',
  'pending', FALSE, NULL
),
(
  2, 'Ella Mountain View Resort', 'Ella', 'Badulla', 'Passara Road, Ella',
  'A peaceful resort surrounded by tea estates, mountain views, waterfalls, and nature trails.',
  'Wake up above the clouds in Ella.',
  '/images/hotels/ella-mountain-view-resort/logo.jpg',
  'Ella Mountain View Resort', '#166534', '$2b$10$Irpq9a/MJ7m.aN.mH4jR6Ot0kVh.DaJzVjkPUS8m9LJ4kkX3V/ZGa', 'Resort',
  'premium', 100,
  8500.00, 'Paid', 2, NOW(),
  4000.00, 'Paid', 2, NOW(),
  NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 1 MONTH),
  8500.00, 'Paid',
  'approved', TRUE, NULL
);

INSERT INTO rooms
(property_id, room_type, capacity, base_occupancy, price_per_night, extra_person_price, price_per_day, total_rooms, available_rooms)
VALUES
(1, 'Deluxe Room', 2, 2, 15000.00, 0.00, 10000.00, 10, 10),
(1, 'Family Room', 4, 2, 22000.00, 3500.00, 16000.00, 5, 5),
(1, 'Lake View Suite', 3, 2, 28000.00, 4500.00, 20000.00, 3, 3),
(2, 'Standard Room', 2, 2, 12000.00, 0.00, 9000.00, 8, 8),
(2, 'Business Room', 3, 2, 18000.00, 3000.00, 13000.00, 6, 6),
(3, 'Mountain Cabin', 2, 2, 17000.00, 0.00, 12000.00, 6, 6),
(3, 'Family Mountain Villa', 5, 3, 32000.00, 4000.00, 24000.00, 4, 4);

INSERT INTO property_photos (property_id, image_url, is_main)
VALUES
(1, '/images/hotels/kandy-lake-hotel/property-01.jpg', TRUE),
(1, '/images/hotels/kandy-lake-hotel/property-02.jpg', FALSE),
(2, '/images/hotels/colombo-city-stay/property-01.jpg', TRUE),
(3, '/images/hotels/ella-mountain-view-resort/property-01.jpg', TRUE);

INSERT INTO room_photos (room_id, image_url, is_main)
VALUES
(1, '/images/rooms/kandy-lake-hotel/deluxe-room.jpg', TRUE),
(2, '/images/rooms/kandy-lake-hotel/family-room.jpg', TRUE),
(3, '/images/rooms/kandy-lake-hotel/lake-view-suite.jpg', TRUE),
(4, '/images/rooms/colombo-city-stay/standard-room.jpg', TRUE),
(5, '/images/rooms/colombo-city-stay/business-room.jpg', TRUE),
(6, '/images/rooms/ella-mountain-view-resort/mountain-cabin.jpg', TRUE),
(7, '/images/rooms/ella-mountain-view-resort/family-mountain-villa.jpg', TRUE);

INSERT INTO property_policies
(property_id, check_in_time, check_out_time, cancellation_policy, day_package_available, night_package_available)
VALUES
(1, '14:00:00', '11:00:00', 'Free cancellation up to 2 days before check-in.', TRUE, TRUE),
(2, '14:00:00', '11:00:00', 'Free cancellation up to 1 day before check-in.', TRUE, TRUE),
(3, '13:00:00', '10:30:00', 'Free cancellation up to 3 days before check-in.', TRUE, TRUE);


INSERT INTO payment_transactions
(property_id, partner_id, payment_type, plan_type, amount, status, paid_at, notes)
VALUES
(1, 2, 'registration', 'standard', 5000.00, 'Paid', NOW(), 'Seed registration payment for Kandy Lake Hotel'),
(3, 2, 'registration', 'premium', 8500.00, 'Paid', NOW(), 'Seed registration payment for Ella Mountain View Resort'),
(3, 2, 'monthly', 'premium', 4000.00, 'Paid', NOW(), 'Seed monthly payment for Ella Mountain View Resort');

-- =========================================================
-- EXPLORE MODULE SEED DATA
-- =========================================================
INSERT INTO explore_categories (id, slug, label, icon, sort_order, is_active) VALUES
(1, 'heritage', 'Heritage Sites', '🏛️', 1, TRUE),
(2, 'nature', 'Nature & Wildlife', '🌿', 2, TRUE),
(3, 'beach', 'Beaches', '🏖️', 3, TRUE),
(4, 'adventure', 'Adventure', '🎯', 4, TRUE),
(5, 'spiritual', 'Spiritual', '🙏', 5, TRUE),
(6, 'food', 'Food & Culture', '🍛', 6, TRUE);

INSERT INTO explore_settings
(
    setting_key,
    setting_value
)
VALUES

-- =========================================================
-- GENERAL EXPLORE SETTINGS
-- General Explore configuration.
-- Trip Planner configuration is seeded below in this same file.
-- =========================================================

(
    'sri_lanka_regions',
    CAST(
        '[
            "All Regions",
            "Cultural Triangle",
            "Hill Country",
            "South Coast",
            "West Coast",
            "East Coast",
            "Northern Region"
        ]'
        AS JSON
    )
),

(
    'travel_styles',
    CAST(
        '[
            "Culture",
            "Adventure",
            "Relaxation",
            "Wildlife",
            "Photography",
            "Food",
            "Spiritual"
        ]'
        AS JSON
    )
),

(
    'budget_daily_targets',
    CAST(
        '{
            "Low": 8000,
            "Medium": 18000,
            "High": 45000
        }'
        AS JSON
    )
)

ON DUPLICATE KEY UPDATE
    setting_value = VALUES(setting_value);


-- =========================================================
-- TRIP PLANNER DATABASE CONFIGURATION
-- =========================================================

INSERT INTO explore_settings
(
    setting_key,
    setting_value
)
VALUES

-- ---------------------------------------------------------
-- GENERAL TRIP PLANNER CONFIGURATION
-- ---------------------------------------------------------

(
    'trip_planner_config',
    CAST(
        '{
            "maxDays": 30,
            "maxDestinationsPerDay": 10,
            "routeCacheHours": 24,
            "requireCoordinatesForPublishedPlaces": true
        }'
        AS JSON
    )
),

-- ---------------------------------------------------------
-- TRANSPORT PROFILES
-- ---------------------------------------------------------

(
    'trip_planner_transport_profiles',
    CAST(
        '[
            {
                "key": "car",
                "label": "Car / Taxi",
                "providerProfile": "driving-car"
            }
        ]'
        AS JSON
    )
),

-- ---------------------------------------------------------
-- ROUTE OPTIMIZATION MODES
-- ---------------------------------------------------------

(
    'trip_planner_optimization_modes',
    CAST(
        '[
            {
                "key": "fastest",
                "label": "Less travel time",
                "metric": "duration",
                "providerPreference": "fastest"
            },
            {
                "key": "shortest",
                "label": "Less travel distance",
                "metric": "distance",
                "providerPreference": "shortest"
            }
        ]'
        AS JSON
    )
),

-- ---------------------------------------------------------
-- MAP CONFIGURATION
-- ---------------------------------------------------------

(
    'trip_planner_map',
    CAST(
        '{
            "engine": "leaflet",
            "provider": "openstreetmap",
            "tileUrl": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "attribution": "© OpenStreetMap contributors",
            "center": [80.7718, 7.8731],
            "zoom": 7,
            "minZoom": 5,
            "maxZoom": 18
        }'
        AS JSON
    )
),

-- ---------------------------------------------------------
-- ROAD ROUTING PROVIDER
-- ---------------------------------------------------------

(
    'trip_planner_routing_provider',
    CAST(
        '{
            "key": "openrouteservice",
            "enabled": true,
            "baseUrl": "https://api.heigit.org/openrouteservice/v2",
            "requestTimeoutMs": 15000,
            "routingStrategyVersion": "road-access-v2",
            "snapFallbackEnabled": true,
            "snapRadiiMeters": [500, 2000, 5000, 10000, 20000],
            "accessPointCacheHours": 720,
            "accessSearchRingKm": [1, 3, 7, 12, 20, 30, 40],
            "accessSearchBearings": 8,
            "accessCandidateSnapRadiusMeters": 2000,
            "accessWarningThresholdMeters": 100
        }'
        AS JSON
    )
)

ON DUPLICATE KEY UPDATE
    setting_value = VALUES(setting_value);

INSERT INTO explore_places (id, slug, name, city, district, region, category_id, image_url, short_description, full_description, duration, best_time, best_months, budget, budget_score, estimated_cost, lat, lng, featured, vibe, tags, experiences, highlights, nearby_places, tips, opening_hours, entry_fee, facilities, status, sort_order) VALUES
(1, 'sigiriya-rock-fortress', 'Sigiriya Rock Fortress', 'Sigiriya', 'Matale', 'Cultural Triangle', 1, '/images/destinations/sigiriya-rock-fortress/main.jpg', 'An ancient rock fortress rising 200m above the jungle, featuring stunning frescoes and the remains of a 5th-century palace.', 'Sigiriya, also known as Lion Rock, is a stunning ancient rock fortress and UNESCO World Heritage Site located in the heart of Sri Lanka''s Cultural Triangle. Rising nearly 200 meters above the surrounding jungle, this architectural marvel was built by King Kashyapa in the 5th century AD.

The fortress features the famous Sigiriya Frescoes – ancient paintings of celestial maidens that have survived for over 1,500 years. The Mirror Wall, once polished to reflect the king''s image, now bears ancient graffiti dating back to the 8th century.

At the midpoint of the climb, you''ll encounter the massive Lion''s Paws, all that remains of a giant lion structure that once guarded the entrance to the palace. The summit reveals the ruins of the royal palace, gardens, and water features that showcase the sophisticated hydraulic engineering of ancient Sri Lanka.

The surrounding gardens include some of the oldest landscaped gardens in the world, featuring water gardens, boulder gardens, and terraced gardens that demonstrate the advanced understanding of landscape architecture.', '3-4 hours', 'Dec - Apr', CAST('[11,0,1,2,3]' AS JSON), 'Medium', 2, 8500, 7.957, 80.7603, TRUE, 'Culture', CAST('["UNESCO","Ancient","Hiking","Photography","History"]' AS JSON), CAST('[{"title":"Sunrise Climb","description":"Experience the magical sunrise from the summit, watching the mist lift over the jungle canopy. Start climbing at 6:30 AM to reach the top before 8 AM.","duration":"2-3 hours","cost":8500},{"title":"Frescoes Gallery Visit","description":"Marvel at the ancient paintings of Apsaras (celestial maidens) preserved in a sheltered pocket of the rock face. These 5th-century artworks are masterpieces of Sri Lankan art.","duration":"30 minutes","cost":0},{"title":"Mirror Wall Walk","description":"Walk along the ancient polished wall that once reflected like a mirror. Read graffiti written by ancient visitors over 1,000 years ago.","duration":"20 minutes","cost":0},{"title":"Water Gardens Exploration","description":"Explore the sophisticated water gardens at the base, featuring fountains that still work during the rainy season, pools, and channels.","duration":"1 hour","cost":0},{"title":"Pidurangala Rock Alternative","description":"Climb the adjacent Pidurangala Rock for panoramic views of Sigiriya. Less crowded and offers stunning photography opportunities.","duration":"1.5 hours","cost":1000}]' AS JSON), CAST('[{"icon":"🏛️","title":"UNESCO World Heritage","description":"Recognized since 1982 as a site of outstanding universal value"},{"icon":"🎨","title":"Ancient Frescoes","description":"1,500-year-old paintings of celestial maidens"},{"icon":"🦁","title":"Lion''s Paws Entrance","description":"Massive lion paw sculptures guard the ascent to the summit"},{"icon":"💧","title":"Ancient Hydraulics","description":"Sophisticated water gardens with 5th-century engineering"}]' AS JSON), CAST('[{"name":"Pidurangala Rock","distance":"1.5 km","type":"Viewpoint"},{"name":"Dambulla Cave Temple","distance":"17 km","type":"Heritage"},{"name":"Minneriya National Park","distance":"25 km","type":"Wildlife"},{"name":"Polonnaruwa","distance":"60 km","type":"Ancient City"}]' AS JSON), CAST('["Start early (6:30 AM) to avoid crowds and heat","Bring at least 2 liters of water per person","Wear comfortable shoes with good grip for the climb","The climb has 1,200 steps – take breaks as needed","Beware of wasps during September-October","Photography of frescoes may be restricted"]' AS JSON), '7:00 AM - 5:30 PM daily', 'LKR 30 (locals) / USD 30 (foreigners)', CAST('["Parking","Washrooms","Guided Tours","Souvenir Shops","First Aid"]' AS JSON), 'published', 1),
(2, 'temple-of-the-sacred-tooth-relic', 'Temple of the Sacred Tooth Relic', 'Kandy', 'Kandy', 'Hill Country', 5, '/images/destinations/temple-of-the-sacred-tooth-relic/main.jpg', 'Sri Lanka''s most sacred Buddhist temple, housing the tooth relic of Buddha within the historic Royal Palace complex.', 'Sri Dalada Maligawa, the Temple of the Sacred Tooth Relic, is the most venerated Buddhist temple in Sri Lanka and a UNESCO World Heritage Site. Located in the heart of Kandy city, within the former Royal Palace complex, this temple houses what is believed to be the left canine tooth of Lord Buddha.

The tooth relic has immense spiritual and political significance in Sri Lankan history. According to legend, whoever holds the relic holds the governance of the country. The relic was brought to Sri Lanka in the 4th century AD, hidden in the hair of Princess Hemamali.

The temple complex showcases stunning Kandyan architecture with its golden roof, intricate wood carvings, and beautiful paintings depicting Buddhist stories. The relic is kept in a golden casket within seven concentric caskets within the inner shrine.

Three daily pujas (religious ceremonies) are held at 5:30 AM, 9:30 AM, and 6:30 PM, when the inner chamber is opened and devotees can catch a glimpse of the casket. The annual Esala Perahera festival in July/August is a spectacular 10-day celebration honoring the Sacred Tooth.', '2-3 hours', 'Year-round, Jul-Aug for Perahera', CAST('[0,1,2,3,4,5,6,7,8,9,10,11]' AS JSON), 'Low', 1, 3500, 7.2936, 80.6413, TRUE, 'Spiritual', CAST('["Buddhist","UNESCO","Sacred","Architecture","Festival"]' AS JSON), CAST('[{"title":"Witness the Evening Puja","description":"Attend the 6:30 PM ceremony when monks perform rituals and the golden casket housing the tooth relic is briefly displayed to devotees.","duration":"1 hour","cost":2000},{"title":"Explore the Museum","description":"Visit the temple museum housing gifts from world leaders, ancient manuscripts, and relics associated with the temple''s history.","duration":"45 minutes","cost":500},{"title":"Kandyan Dance Performance","description":"Watch traditional Kandyan dancers perform in the adjacent cultural center, featuring fire walking and acrobatic drumming.","duration":"1 hour","cost":1500},{"title":"Kandy Lake Walk","description":"Stroll around the scenic Kandy Lake adjacent to the temple, offering beautiful views and photo opportunities.","duration":"45 minutes","cost":0},{"title":"Esala Perahera Festival","description":"If visiting in July/August, witness the magnificent procession featuring decorated elephants, drummers, dancers, and the sacred tooth casket.","duration":"4-5 hours","cost":5000}]' AS JSON), CAST('[{"icon":"🦷","title":"Sacred Tooth Relic","description":"Buddha''s tooth, brought to Sri Lanka in the 4th century"},{"icon":"👑","title":"Royal Palace Complex","description":"Set within the last Kandyan king''s palace grounds"},{"icon":"🎭","title":"Esala Perahera","description":"Asia''s grandest Buddhist festival held annually"},{"icon":"🏛️","title":"Kandyan Architecture","description":"Finest examples of traditional Sri Lankan craftsmanship"}]' AS JSON), CAST('[{"name":"Kandy Lake","distance":"0.2 km","type":"Scenic"},{"name":"Royal Botanical Gardens","distance":"6 km","type":"Nature"},{"name":"Bahirawakanda Temple","distance":"3 km","type":"Spiritual"},{"name":"Udawattakele Forest","distance":"1 km","type":"Nature"}]' AS JSON), CAST('["Dress modestly – cover shoulders and knees","Remove shoes before entering the temple","Avoid turning your back to Buddha statues","Photography may be restricted in inner areas","Book tickets early for Esala Perahera","Visit during puja times for the full experience"]' AS JSON), '5:30 AM - 8:00 PM daily', 'LKR 500 (locals) / LKR 2000 (foreigners)', CAST('["Shoe Storage","Washrooms","Museum","Gift Shop","Guide Services"]' AS JSON), 'published', 2),
(3, 'nine-arch-bridge', 'Nine Arch Bridge', 'Ella', 'Badulla', 'Hill Country', 1, '/images/destinations/nine-arch-bridge/main.jpg', 'An iconic colonial-era railway viaduct surrounded by lush tea plantations, perfect for photography enthusiasts.', 'The Nine Arch Bridge, also known as the Bridge in the Sky, is one of the most iconic landmarks in Sri Lanka''s hill country. Built during British colonial rule in 1921, this stunning viaduct stands 24 meters high and spans 91 meters across a steep valley in Demodara.

What makes this bridge remarkable is that it was constructed entirely from stone, brick, and cement without using any steel – a necessity during World War I when steel was scarce. The bridge is a testament to the engineering prowess of P.K. Appuhamy, a local foreman who led the construction.

Surrounded by verdant tea plantations and misty mountains, the bridge creates a picture-perfect scene, especially when the blue trains of Sri Lanka Railways pass across it. The sight of a train crossing the bridge against the backdrop of lush greenery has made this one of the most photographed locations in Sri Lanka.

The area around the bridge offers easy hiking trails through tea estates, where you can interact with tea pluckers and learn about the tea-making process that has defined this region for over a century.', '2-3 hours', 'Year-round, best 6-9 AM', CAST('[0,1,2,3,11]' AS JSON), 'Low', 1, 2500, 6.8788, 81.0571, TRUE, 'Photography', CAST('["Colonial","Railway","Photography","Tea Estates","Hiking"]' AS JSON), CAST('[{"title":"Train Photography Session","description":"Capture the iconic shot of the blue train crossing the bridge. Trains typically pass at 9:05 AM, 11:00 AM, 2:00 PM, and 5:00 PM.","duration":"2 hours","cost":0},{"title":"Tea Estate Walk","description":"Walk through the surrounding tea plantations, meet local tea pluckers, and learn about Ceylon tea production.","duration":"1-2 hours","cost":500},{"title":"Sunrise Visit","description":"Arrive at dawn to experience the bridge emerging from morning mist, creating ethereal photography conditions.","duration":"1.5 hours","cost":0},{"title":"Walk on the Bridge","description":"Carefully walk across the bridge itself when no train is coming. Listen for the train whistle warning.","duration":"15 minutes","cost":0},{"title":"Viewpoint Hike","description":"Climb to the hilltop viewpoint above the bridge for panoramic views of the entire structure and valley.","duration":"45 minutes","cost":0}]' AS JSON), CAST('[{"icon":"🌉","title":"Engineering Marvel","description":"Built without steel during World War I"},{"icon":"📸","title":"Instagram Famous","description":"One of Sri Lanka''s most photographed locations"},{"icon":"🚂","title":"Active Railway","description":"Watch trains cross this century-old bridge daily"},{"icon":"🍃","title":"Tea Country Setting","description":"Surrounded by pristine tea plantations"}]' AS JSON), CAST('[{"name":"Ella Rock","distance":"4 km","type":"Hiking"},{"name":"Little Adam''s Peak","distance":"2 km","type":"Hiking"},{"name":"Ravana Falls","distance":"5 km","type":"Waterfall"},{"name":"Demodara Loop","distance":"1 km","type":"Railway"}]' AS JSON), CAST('["Check train times beforehand for the best photo opportunities","Arrive early to secure a good viewing spot","Be extremely careful if walking on the tracks","Always listen for train whistles","Mornings offer the best light and fewer crowds","Wear comfortable shoes for the short hike to the bridge"]' AS JSON), 'Open 24 hours (trains run 6 AM - 6 PM)', 'Free', CAST('["Small Cafes","Parking","Local Guides"]' AS JSON), 'published', 3),
(4, 'mirissa-beach-and-whale-watching', 'Mirissa Beach & Whale Watching', 'Mirissa', 'Matara', 'South Coast', 3, '/images/destinations/mirissa-beach-and-whale-watching/main.jpg', 'A crescent-shaped beach paradise and the best whale watching destination in Sri Lanka, home to blue whales and dolphins.', 'Mirissa is a picturesque beach town on Sri Lanka''s southern coast, renowned for its stunning crescent-shaped beach and world-class whale watching opportunities. This laid-back destination has transformed from a quiet fishing village into one of the country''s most beloved coastal retreats.

The beach itself is a perfect blend of golden sand, swaying palm trees, and crystal-clear waters. The main beach is great for swimming, while nearby Secret Beach offers a more secluded experience. Parrot Rock, accessible at low tide, provides stunning sunset views.

From November to April, Mirissa becomes one of the best places on Earth to spot blue whales – the largest animals to have ever lived. The continental shelf drops sharply just offshore, creating ideal conditions for these magnificent creatures. Sperm whales, fin whales, and pods of dolphins are also regularly seen.

Beyond whale watching, Mirissa offers surfing (best October-March), snorkeling, and a vibrant nightlife scene with beach bars and restaurants serving fresh seafood. The famous stilt fishermen can still be spotted in the early morning and late afternoon.', '1-2 days', 'Nov - Apr', CAST('[10,11,0,1,2,3]' AS JSON), 'Medium', 2, 12000, 5.9485, 80.4589, TRUE, 'Relaxation', CAST('["Beach","Whale Watching","Surfing","Sunset","Wildlife"]' AS JSON), CAST('[{"title":"Blue Whale Watching","description":"Join a morning boat tour to spot blue whales, sperm whales, and dolphins. Season runs November to April, with peak sightings in February-March.","duration":"4-5 hours","cost":8000},{"title":"Sunset at Parrot Rock","description":"Climb the iconic Parrot Rock at low tide and watch the sun sink into the Indian Ocean. A magical end to any day.","duration":"1.5 hours","cost":0},{"title":"Surfing Lessons","description":"Learn to surf on the gentle waves of Mirissa beach with local instructors. Best conditions October to March.","duration":"2 hours","cost":3500},{"title":"Secret Beach Visit","description":"Discover the hidden Secret Beach, a short walk from the main beach, for a more peaceful swimming experience.","duration":"2-3 hours","cost":0},{"title":"Stilt Fishermen Photography","description":"Photograph the iconic stilt fishermen in the early morning or late afternoon. A small tip is expected.","duration":"1 hour","cost":500},{"title":"Fresh Seafood Dinner","description":"Enjoy a candlelit dinner on the beach with the freshest catch, grilled to perfection at one of the beachfront restaurants.","duration":"2 hours","cost":3000}]' AS JSON), CAST('[{"icon":"🐋","title":"Blue Whale Capital","description":"One of the world''s best spots for blue whale sightings"},{"icon":"🏄","title":"Surf Paradise","description":"Great waves for beginners and intermediate surfers"},{"icon":"🌅","title":"Parrot Rock Sunsets","description":"Iconic viewpoint for spectacular sunset views"},{"icon":"🎣","title":"Stilt Fishermen","description":"Witness the traditional fishing technique unique to Sri Lanka"}]' AS JSON), CAST('[{"name":"Weligama","distance":"7 km","type":"Beach/Surfing"},{"name":"Galle Fort","distance":"35 km","type":"Heritage"},{"name":"Coconut Tree Hill","distance":"1 km","type":"Viewpoint"},{"name":"Unawatuna Beach","distance":"25 km","type":"Beach"}]' AS JSON), CAST('["Book whale watching tours the evening before","Take motion sickness medication if prone to seasickness","Visit Coconut Tree Hill for Instagram-worthy photos","Swim at Secret Beach for fewer crowds","Book beachfront accommodation early in peak season","Evening jellyfish are common – check with locals before swimming"]' AS JSON), 'Beach: 24 hours | Whale tours: 6:00 AM departure', 'Free (whale watching tours: LKR 6,000-10,000)', CAST('["Restaurants","Beach Bars","Surf Schools","Hotels","Tour Operators"]' AS JSON), 'published', 4),
(5, 'galle-fort', 'Galle Fort', 'Galle', 'Galle', 'South Coast', 1, '/images/destinations/galle-fort/main.jpg', 'A UNESCO World Heritage fortress blending Portuguese, Dutch, and British colonial architecture with vibrant local life.', 'Galle Fort is a historical and archaeological masterpiece, representing the best-preserved sea fortress in South Asia. Originally built by the Portuguese in 1588, it was extensively fortified by the Dutch in the 17th century and later modified by the British.

This UNESCO World Heritage Site is a living museum where colonial architecture meets contemporary Sri Lankan life. Within the fort''s massive walls, you''ll find charming cobblestone streets lined with boutique hotels, art galleries, jewelry shops, and cafes housed in centuries-old buildings.

The Dutch Reformed Church (1640), the Groote Kerk, stands as one of the oldest Protestant churches in Sri Lanka. The iconic Galle Lighthouse, built in 1939, is one of the oldest lighthouses in the country. The Clock Tower, built by the Dutch, still keeps time today.

Walk along the ramparts at sunset for breathtaking views of the Indian Ocean, or explore the narrow lanes to discover hidden gems – from antique shops selling colonial-era artifacts to contemporary art galleries showcasing local talent. The fort is also known for its afternoon cricket matches on the main green.', 'Half day - Full day', 'Dec - Apr', CAST('[11,0,1,2,3]' AS JSON), 'Low', 1, 4000, 6.0269, 80.217, FALSE, 'Culture', CAST('["UNESCO","Colonial","Dutch","Architecture","Shopping"]' AS JSON), CAST('[{"title":"Sunset Rampart Walk","description":"Stroll along the ancient fort walls as the sun sets over the Indian Ocean. Start from Flag Rock for the best views.","duration":"1.5 hours","cost":0},{"title":"Maritime Museum Visit","description":"Explore the Dutch colonial warehouse housing artifacts from the 2004 tsunami and maritime history exhibits.","duration":"1 hour","cost":500},{"title":"Art Gallery Hopping","description":"Visit contemporary galleries showcasing Sri Lankan artists, housed in beautifully restored colonial buildings.","duration":"2 hours","cost":0},{"title":"Colonial Architecture Tour","description":"Take a guided walking tour covering the Dutch Reformed Church, Lighthouse, Clock Tower, and historic mansions.","duration":"2 hours","cost":2000},{"title":"Boutique Shopping","description":"Browse local designer boutiques for handcrafted jewelry, clothing, and souvenirs unique to Galle.","duration":"2-3 hours","cost":0},{"title":"Cricket on the Green","description":"Watch or join locals playing cricket on the fort green – a quintessentially Sri Lankan experience.","duration":"1 hour","cost":0}]' AS JSON), CAST('[{"icon":"🏰","title":"UNESCO World Heritage","description":"South Asia''s best-preserved colonial sea fortress"},{"icon":"🗼","title":"Historic Lighthouse","description":"One of Sri Lanka''s oldest lighthouses, built in 1939"},{"icon":"⛪","title":"Dutch Reformed Church","description":"One of the oldest Protestant churches in Sri Lanka"},{"icon":"🛍️","title":"Boutique Shopping","description":"Unique shops in centuries-old colonial buildings"}]' AS JSON), CAST('[{"name":"Unawatuna Beach","distance":"5 km","type":"Beach"},{"name":"Japanese Peace Pagoda","distance":"4 km","type":"Spiritual"},{"name":"Jungle Beach","distance":"6 km","type":"Beach"},{"name":"Koggala Lake","distance":"12 km","type":"Nature"}]' AS JSON), CAST('["Visit early morning or late afternoon to avoid heat","Sunset from the ramparts is unmissable","Wear comfortable walking shoes on cobblestones","Bargain politely at antique shops","Try local ice cream at the famous ice cream shops","Book boutique hotel accommodation for an authentic experience"]' AS JSON), 'Fort accessible 24 hours | Shops: 9 AM - 8 PM', 'Free', CAST('["Restaurants","Hotels","ATMs","Parking","Tour Guides","Museums"]' AS JSON), 'published', 5),
(6, 'yala-national-park', 'Yala National Park', 'Tissamaharama', 'Hambantota', 'South Coast', 2, '/images/destinations/yala-national-park/main.jpg', 'Sri Lanka''s most famous national park, home to the highest density of leopards in the world and diverse wildlife.', 'Yala National Park is Sri Lanka''s premier wildlife destination and the country''s most visited national park. Established in 1938, it covers nearly 1,000 square kilometers of scrubland, forests, lagoons, and pristine beaches along the southeastern coast.

Yala holds the distinction of having the highest density of leopards in the world, making it one of the best places globally to spot these elusive big cats. The park is home to approximately 70-80 leopards in the most frequently visited Block 1 alone.

Beyond leopards, Yala boasts an incredible diversity of wildlife: Asian elephants (over 400 individuals), sloth bears, spotted deer, sambar deer, wild boar, crocodiles, and water buffaloes. The park is also a birdwatcher''s paradise with over 215 species, including flamingos that gather at the coastal lagoons.

The landscape varies from dense monsoon forests to open grasslands and rocky outcrops that provide perfect vantage points for predators. The beaches within the park are also nesting grounds for sea turtles. Ancient Buddhist sites within the park add a cultural dimension to the wildlife experience.', 'Half day - Full day', 'Feb - Jul', CAST('[1,2,3,4,5,6]' AS JSON), 'High', 3, 25000, 6.3711, 81.5159, FALSE, 'Wildlife', CAST('["Wildlife","Safari","Leopards","Elephants","Photography"]' AS JSON), CAST('[{"title":"Morning Leopard Safari","description":"Join a dawn safari starting at 5:30 AM when leopards are most active. The early hours offer the best chances of sighting these elusive cats.","duration":"4-5 hours","cost":18000},{"title":"Full Day Safari","description":"Maximize your wildlife encounters with a full-day safari, including picnic breakfast and lunch in the park.","duration":"8-10 hours","cost":25000},{"title":"Elephant Watching","description":"Visit the waterholes where elephant herds gather, especially during the dry season. Witness family groups bathing and socializing.","duration":"2-3 hours","cost":0},{"title":"Bird Photography","description":"Focus on the 215+ bird species including painted storks, eagles, and colorful kingfishers along the lagoons.","duration":"3-4 hours","cost":0},{"title":"Sunset Safari","description":"An afternoon safari that ends at sunset, when predators become active and the golden light creates magical photography conditions.","duration":"4 hours","cost":15000}]' AS JSON), CAST('[{"icon":"🐆","title":"Leopard Capital","description":"Highest density of leopards in the world"},{"icon":"🐘","title":"Elephant Herds","description":"Over 400 wild elephants in natural habitat"},{"icon":"🐻","title":"Sloth Bears","description":"Rare sightings of Sri Lanka''s native bears"},{"icon":"🦅","title":"Birding Paradise","description":"Over 215 bird species including endemics"}]' AS JSON), CAST('[{"name":"Kataragama Temple","distance":"15 km","type":"Spiritual"},{"name":"Tissamaharama","distance":"10 km","type":"Town"},{"name":"Bundala National Park","distance":"40 km","type":"Wildlife"},{"name":"Kirinda Beach","distance":"12 km","type":"Beach"}]' AS JSON), CAST('["Book safaris through reputable operators with experienced trackers","Start at dawn (5:30 AM) for best leopard sightings","Bring binoculars and a telephoto lens","Wear neutral colors to blend in","Park closes September 1 - October 15 annually","Avoid overcrowded vehicles – smaller groups are better"]' AS JSON), '6:00 AM - 6:00 PM (closed Sep 1 - Oct 15)', 'USD 25 (foreigners) + vehicle charges', CAST('["Safari Jeeps","Guides","Camping Sites","Rest Areas","First Aid"]' AS JSON), 'published', 6),
(7, 'nuwara-eliya-tea-plantations', 'Nuwara Eliya Tea Plantations', 'Nuwara Eliya', 'Nuwara Eliya', 'Hill Country', 2, '/images/destinations/nuwara-eliya-tea-plantations/main.jpg', 'Experience Ceylon tea at its source in the misty hills of Sri Lanka''s ''Little England'', surrounded by emerald tea estates.', 'Nuwara Eliya, often called ''Little England'' due to its colonial heritage and cool climate, is the heart of Sri Lanka''s world-renowned tea industry. Situated at 1,868 meters above sea level, this picturesque town is surrounded by rolling hills carpeted with emerald-green tea bushes.

The town retains its British colonial charm with Tudor-style bungalows, a historic golf course (one of the oldest in Asia), and the English-style Victoria Park. The cool climate (average 16°C) makes it a refreshing escape from the tropical lowlands.

The tea estates surrounding Nuwara Eliya produce some of the finest Ceylon tea in the world. The high altitude, cool temperatures, and misty conditions create perfect growing conditions for tea with distinctive light, bright, and fragrant characteristics.

Visitors can tour working tea factories like Pedro, Bluefield, or Mackwoods to see the entire tea production process – from freshly plucked leaves to the finished product. Walking through the verdant tea estates, you''ll encounter colorful Tamil tea pluckers who have maintained this tradition for generations.', '1-2 days', 'Year-round, Dec - Apr best', CAST('[11,0,1,2,3]' AS JSON), 'Low', 1, 5500, 6.9497, 80.7891, FALSE, 'Relaxation', CAST('["Tea","Colonial","Scenic","Cool Climate","Factory Tour"]' AS JSON), CAST('[{"title":"Tea Factory Tour","description":"Visit Pedro, Bluefield, or Mackwoods estate to see tea production from withering to packaging, ending with a fresh cup of Ceylon tea.","duration":"2 hours","cost":1000},{"title":"Tea Estate Walk","description":"Stroll through the rolling tea plantations, photograph the stunning landscapes, and meet the Tamil tea pluckers at work.","duration":"2-3 hours","cost":0},{"title":"Victoria Park Visit","description":"Explore this beautiful English-style park with its flower gardens, walking trails, and bird watching opportunities.","duration":"1.5 hours","cost":350},{"title":"Scenic Train Journey","description":"Take the famous scenic train from Kandy to Nuwara Eliya, considered one of the most beautiful train rides in the world.","duration":"4-5 hours","cost":2000},{"title":"Horton Plains Excursion","description":"Day trip to nearby Horton Plains National Park to see World''s End cliff and Baker''s Falls.","duration":"Half day","cost":3500},{"title":"Colonial Heritage Walk","description":"Explore the town''s colonial buildings including the Grand Hotel, Post Office, and Hill Club.","duration":"2 hours","cost":0}]' AS JSON), CAST('[{"icon":"🍵","title":"Ceylon Tea Origin","description":"Visit working factories producing world-class tea"},{"icon":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","title":"Little England","description":"Colonial architecture and cool English climate"},{"icon":"🚂","title":"Scenic Railways","description":"One of the world''s most beautiful train journeys"},{"icon":"⛰️","title":"Highland Scenery","description":"Misty mountains and emerald tea estates"}]' AS JSON), CAST('[{"name":"Horton Plains","distance":"32 km","type":"National Park"},{"name":"Gregory Lake","distance":"1 km","type":"Lake"},{"name":"Lover''s Leap Falls","distance":"5 km","type":"Waterfall"},{"name":"Hakgala Gardens","distance":"10 km","type":"Botanical"}]' AS JSON), CAST('["Pack warm clothing – temperatures drop to 10°C at night","Book the train from Kandy in advance (Second class)","Visit tea factories early morning for the best experience","April brings the Sinhala New Year celebrations","Strawberry season runs from April to August","Golf at Nuwara Eliya Golf Club – one of Asia''s oldest"]' AS JSON), 'Tea factories: 8 AM - 5 PM | Town: 24 hours', 'Factory tours: LKR 500-1000 per person', CAST('["Hotels","Restaurants","Tea Shops","Golf Course","Markets"]' AS JSON), 'published', 7),
(8, 'dambulla-cave-temple', 'Dambulla Cave Temple', 'Dambulla', 'Matale', 'Cultural Triangle', 5, '/images/destinations/dambulla-cave-temple/main.jpg', 'A stunning UNESCO-listed cave temple complex with over 150 Buddha statues and intricate ancient murals.', 'The Dambulla Cave Temple, also known as the Golden Temple of Dambulla, is Sri Lanka''s largest and best-preserved cave temple complex. Dating back to the 1st century BC, this UNESCO World Heritage Site features five caves adorned with over 150 Buddha statues and 2,100 square meters of stunning murals.

King Valagamba sought refuge in these caves during his 14-year exile and, upon returning to power, converted them into a magnificent temple in gratitude. Over the centuries, various kings have added to the temple, creating the remarkable complex we see today.

The five caves vary in size and grandeur. The largest, the Cave of the Great Kings (Maharaja Viharaya), stretches 52 meters and contains 56 Buddha statues. The ceiling paintings depicting scenes from Buddha''s life are among the finest examples of Sri Lankan Buddhist art.

The temple sits atop a 160-meter rock, offering panoramic views of the surrounding countryside, including Sigiriya Rock in the distance. The climb involves 300 steps but the cool caves and stunning art make it worthwhile.', '2-3 hours', 'Year-round', CAST('[0,1,2,3,4,5,6,7,8,9,10,11]' AS JSON), 'Low', 1, 4000, 7.8567, 80.6517, FALSE, 'Spiritual', CAST('["UNESCO","Buddhist","Cave Art","Ancient","Murals"]' AS JSON), CAST('[{"title":"Cave Temple Exploration","description":"Explore all five caves, each with unique Buddha statues, murals, and architectural features spanning 22 centuries.","duration":"1.5-2 hours","cost":2000},{"title":"Sunrise Photography","description":"Climb to the temple at dawn for stunning sunrise views over the Cultural Triangle and perfect photography light.","duration":"2 hours","cost":0},{"title":"Mural Study","description":"Take time to study the 2,100 square meters of ancient paintings depicting Buddha''s life, Jataka tales, and Sri Lankan history.","duration":"1 hour","cost":0},{"title":"Golden Buddha Visit","description":"See the massive modern Golden Buddha statue and temple at the base of the rock before ascending to the caves.","duration":"30 minutes","cost":0},{"title":"Sunset Viewpoint","description":"Stay until evening for spectacular sunset views with Sigiriya Rock visible in the distance.","duration":"1 hour","cost":0}]' AS JSON), CAST('[{"icon":"🏛️","title":"UNESCO Heritage","description":"Sri Lanka''s largest and best-preserved cave temple"},{"icon":"🎨","title":"Ancient Murals","description":"2,100 sq meters of paintings spanning 22 centuries"},{"icon":"🧘","title":"150+ Buddha Statues","description":"Including a 14-meter reclining Buddha"},{"icon":"⛰️","title":"Rock Formation","description":"160-meter rock with panoramic views"}]' AS JSON), CAST('[{"name":"Sigiriya Rock","distance":"17 km","type":"Heritage"},{"name":"Pidurangala Temple","distance":"22 km","type":"Spiritual"},{"name":"Kandalama Lake","distance":"10 km","type":"Nature"},{"name":"Minneriya Park","distance":"30 km","type":"Wildlife"}]' AS JSON), CAST('["Remove shoes and cover shoulders before entering caves","Photography is allowed but no flash","Beware of monkeys near the entrance – don''t carry food","Visit early morning or late afternoon to avoid heat","The climb has 300 steps – take it slowly","Don''t turn your back to Buddha statues for photos"]' AS JSON), '7:00 AM - 7:00 PM daily', 'LKR 300 (locals) / LKR 2000 (foreigners)', CAST('["Shoe Storage","Washrooms","Guides","Parking","Refreshments"]' AS JSON), 'published', 8),
(9, 'trincomalee-beaches', 'Trincomalee Beaches', 'Trincomalee', 'Trincomalee', 'East Coast', 3, '/images/destinations/trincomalee-beaches/main.jpg', 'Sri Lanka''s eastern coast gem featuring pristine beaches, whale watching, and one of the world''s finest natural harbors.', 'Trincomalee, affectionately called ''Trinco'', is a port city on Sri Lanka''s northeastern coast, blessed with some of the country''s most beautiful beaches and one of the world''s finest natural harbors. While the south coast draws visitors during the northeast monsoon, Trincomalee shines from May to September.

Nilaveli Beach, stretching 4 kilometers of powdery white sand and turquoise waters, is consistently ranked among the world''s most beautiful beaches. Uppuveli Beach, closer to town, offers a more accessible experience with beachfront restaurants and hotels.

Pigeon Island, a short boat ride from Nilaveli, is a marine national park famous for coral reefs teeming with tropical fish, reef sharks, and hawksbill turtles. It''s one of the best snorkeling and diving spots in Sri Lanka.

The area is also known for whale watching (blue whales from March to August) and hot springs at Kanniya. The historic Koneswaram Temple, perched dramatically on Swami Rock overlooking the ocean, offers stunning views and spiritual significance.', '2-3 days', 'May - Sep', CAST('[4,5,6,7,8]' AS JSON), 'Medium', 2, 10000, 8.5874, 81.2152, FALSE, 'Adventure', CAST('["Beach","Snorkeling","Diving","Whales","Temple"]' AS JSON), CAST('[{"title":"Pigeon Island Snorkeling","description":"Take a boat to Pigeon Island National Park and snorkel among colorful coral gardens with tropical fish, reef sharks, and sea turtles.","duration":"Half day","cost":4500},{"title":"Whale Watching","description":"Join a morning expedition to spot blue whales and sperm whales off the coast. Season runs March to August.","duration":"4-5 hours","cost":8000},{"title":"Koneswaram Temple Visit","description":"Explore this ancient Hindu temple dramatically perched on Swami Rock, offering panoramic ocean views.","duration":"1.5 hours","cost":0},{"title":"Nilaveli Beach Day","description":"Spend a relaxing day on one of Sri Lanka''s most beautiful beaches with pristine sand and calm waters.","duration":"Full day","cost":0},{"title":"Kanniya Hot Springs","description":"Visit the seven hot water wells fed by natural hot springs, a unique geological phenomenon.","duration":"1 hour","cost":500},{"title":"Scuba Diving","description":"Explore coral reefs and World War II shipwrecks with certified diving operators.","duration":"3-4 hours","cost":12000}]' AS JSON), CAST('[{"icon":"🏝️","title":"Pigeon Island","description":"Marine park with pristine coral reefs and sea turtles"},{"icon":"🐋","title":"Whale Watching","description":"Blue whales and sperm whales from March to August"},{"icon":"🛕","title":"Koneswaram Temple","description":"Ancient Hindu temple on dramatic clifftop"},{"icon":"🌊","title":"Natural Harbor","description":"One of the world''s finest natural deep-water harbors"}]' AS JSON), CAST('[{"name":"Pigeon Island","distance":"1 km offshore","type":"Marine Park"},{"name":"Kanniya Hot Springs","distance":"8 km","type":"Nature"},{"name":"Fort Frederick","distance":"2 km","type":"Heritage"},{"name":"Marble Beach","distance":"7 km","type":"Beach"}]' AS JSON), CAST('["Visit May to September – opposite season from south coast","Book Pigeon Island trips early – visitor limits apply","Koneswaram Temple requires modest dress","Nilaveli is quieter than Uppuveli","Bring reef-safe sunscreen for snorkeling","The drive from Colombo takes 6-7 hours"]' AS JSON), 'Beaches: 24 hours | Pigeon Island: 8 AM - 5 PM', 'Pigeon Island: LKR 3,500 (foreigners)', CAST('["Hotels","Restaurants","Dive Centers","Boat Operators","Tour Guides"]' AS JSON), 'published', 9),
(10, 'adams-peak', 'Adam''s Peak', 'Dalhousie', 'Ratnapura', 'Hill Country', 4, '/images/destinations/adams-peak/main.jpg', 'A sacred mountain pilgrimage featuring a legendary footprint at the summit and spectacular sunrise views.', 'Adam''s Peak (Sri Pada) is a 2,243-meter conical mountain that has been a pilgrimage site for over 1,000 years. At its summit lies the ''Sri Pada'' – a footprint-shaped depression in rock that holds significance for Buddhists, Hindus, Christians, and Muslims alike.

Buddhists believe it''s Buddha''s footprint, Hindus attribute it to Shiva, Christians and Muslims consider it Adam''s first footprint upon leaving the Garden of Eden. This multi-faith significance makes it a uniquely unifying pilgrimage.

The climb consists of 5,500 steps from Dalhousie village to the summit. Pilgrims typically begin at 2:00 AM to reach the top for sunrise – a truly magical experience as the sun rises over the mountains and casts the peak''s perfect triangular shadow across the clouds.

The pilgrimage season runs from December to May (full moon of Vesak), when the trail is lit and tea shops along the route offer refreshments. The climb is challenging but achievable for anyone with reasonable fitness.', '5-7 hours (climb)', 'Dec - May', CAST('[11,0,1,2,3,4]' AS JSON), 'Low', 1, 3500, 6.8096, 80.4994, FALSE, 'Adventure', CAST('["Pilgrimage","Hiking","Sunrise","Sacred","Adventure"]' AS JSON), CAST('[{"title":"Sunrise Summit Climb","description":"Begin climbing at 2:00 AM from Dalhousie to reach the 2,243m summit for a spectacular sunrise over the mountains.","duration":"5-7 hours round trip","cost":0},{"title":"Footprint Worship","description":"Pay respects at the Sri Pada – the sacred footprint that draws pilgrims of multiple faiths to this peak.","duration":"30 minutes","cost":0},{"title":"Shadow of the Peak","description":"Witness the incredible phenomenon of the peak''s perfect triangular shadow projected onto the clouds at sunrise.","duration":"15 minutes","cost":0},{"title":"Bell Ringing","description":"Ring the sacred bell at the summit – tradition holds you ring it once for each time you''ve completed the climb.","duration":"5 minutes","cost":0},{"title":"Tea Stop Experience","description":"Enjoy hot tea and snacks at the wayside stalls that line the illuminated trail during pilgrimage season.","duration":"Variable","cost":500}]' AS JSON), CAST('[{"icon":"👣","title":"Sacred Footprint","description":"Venerated by four religions for over 1,000 years"},{"icon":"🌅","title":"Epic Sunrise","description":"Possibly the most spectacular sunrise in Sri Lanka"},{"icon":"🔼","title":"Perfect Shadow","description":"Triangular shadow phenomenon at dawn"},{"icon":"⛩️","title":"5,500 Steps","description":"A challenging but rewarding pilgrimage climb"}]' AS JSON), CAST('[{"name":"Ratnapura Gem Mines","distance":"45 km","type":"Industry"},{"name":"Sinharaja Rainforest","distance":"50 km","type":"Nature"},{"name":"Horton Plains","distance":"70 km","type":"National Park"},{"name":"Nuwara Eliya","distance":"60 km","type":"Hill Town"}]' AS JSON), CAST('["Start climbing at 2:00 AM from Dalhousie","Bring warm layers – it''s cold at the summit","Carry a flashlight and water","Wear comfortable shoes with good grip","Full moon (Poya) nights are especially crowded","Season ends after Vesak Poya in May","The descent can be harder on the knees"]' AS JSON), '24 hours during pilgrimage season (Dec-May)', 'Free (donations welcome)', CAST('["Tea Shops","Rest Areas","Toilets","First Aid Posts"]' AS JSON), 'published', 10);

INSERT INTO explore_place_images (place_id, image_url, alt_text, is_main, sort_order) VALUES
(1, '/images/destinations/sigiriya-rock-fortress/gallery-01.jpg', 'Sigiriya Rock Fortress photo 1', TRUE, 1),
(1, '/images/destinations/sigiriya-rock-fortress/gallery-02.jpg', 'Sigiriya Rock Fortress photo 2', FALSE, 2),
(1, '/images/destinations/sigiriya-rock-fortress/gallery-03.jpg', 'Sigiriya Rock Fortress photo 3', FALSE, 3),
(2, '/images/destinations/temple-of-the-sacred-tooth-relic/gallery-01.jpg', 'Temple of the Sacred Tooth Relic photo 1', TRUE, 1),
(2, '/images/destinations/temple-of-the-sacred-tooth-relic/gallery-02.jpg', 'Temple of the Sacred Tooth Relic photo 2', FALSE, 2),
(2, '/images/destinations/temple-of-the-sacred-tooth-relic/gallery-03.png', 'Temple of the Sacred Tooth Relic photo 3', FALSE, 3),
(3, '/images/destinations/nine-arch-bridge/gallery-01.jpg', 'Nine Arch Bridge photo 1', TRUE, 1),
(3, '/images/destinations/nine-arch-bridge/gallery-02.jpg', 'Nine Arch Bridge photo 2', FALSE, 2),
(3, '/images/destinations/nine-arch-bridge/gallery-03.jpg', 'Nine Arch Bridge photo 3', FALSE, 3),
(4, '/images/destinations/mirissa-beach-and-whale-watching/gallery-01.jpg', 'Mirissa Beach & Whale Watching photo 1', TRUE, 1),
(4, '/images/destinations/mirissa-beach-and-whale-watching/gallery-02.jpg', 'Mirissa Beach & Whale Watching photo 2', FALSE, 2),
(4, '/images/destinations/mirissa-beach-and-whale-watching/gallery-03.jpg', 'Mirissa Beach & Whale Watching photo 3', FALSE, 3),
(5, '/images/destinations/galle-fort/gallery-01.jpg', 'Galle Fort photo 1', TRUE, 1),
(5, '/images/destinations/galle-fort/gallery-02.jpg', 'Galle Fort photo 2', FALSE, 2),
(5, '/images/destinations/galle-fort/gallery-03.jpg', 'Galle Fort photo 3', FALSE, 3),
(6, '/images/destinations/yala-national-park/gallery-01.jpg', 'Yala National Park photo 1', TRUE, 1),
(6, '/images/destinations/yala-national-park/gallery-02.jpg', 'Yala National Park photo 2', FALSE, 2),
(6, '/images/destinations/yala-national-park/gallery-03.jpg', 'Yala National Park photo 3', FALSE, 3),
(7, '/images/destinations/nuwara-eliya-tea-plantations/gallery-01.jpg', 'Nuwara Eliya Tea Plantations photo 1', TRUE, 1),
(7, '/images/destinations/nuwara-eliya-tea-plantations/gallery-02.jpg', 'Nuwara Eliya Tea Plantations photo 2', FALSE, 2),
(7, '/images/destinations/nuwara-eliya-tea-plantations/gallery-03.jpg', 'Nuwara Eliya Tea Plantations photo 3', FALSE, 3),
(8, '/images/destinations/dambulla-cave-temple/gallery-01.jpg', 'Dambulla Cave Temple photo 1', TRUE, 1),
(8, '/images/destinations/dambulla-cave-temple/gallery-02.jpg', 'Dambulla Cave Temple photo 2', FALSE, 2),
(8, '/images/destinations/dambulla-cave-temple/gallery-03.jpg', 'Dambulla Cave Temple photo 3', FALSE, 3),
(9, '/images/destinations/trincomalee-beaches/gallery-01.jpg', 'Trincomalee Beaches photo 1', TRUE, 1),
(9, '/images/destinations/trincomalee-beaches/gallery-02.jpg', 'Trincomalee Beaches photo 2', FALSE, 2),
(9, '/images/destinations/trincomalee-beaches/gallery-03.jpg', 'Trincomalee Beaches photo 3', FALSE, 3),
(10, '/images/destinations/adams-peak/gallery-01.jpg', 'Adam''s Peak photo 1', TRUE, 1),
(10, '/images/destinations/adams-peak/gallery-02.jpg', 'Adam''s Peak photo 2', FALSE, 2),
(10, '/images/destinations/adams-peak/gallery-03.jpg', 'Adam''s Peak photo 3', FALSE, 3);

INSERT INTO explore_itineraries (id, title, days, tone, link_city, status, sort_order) VALUES
(1, 'Cultural Triangle Route', '3-4 days', 'Heritage, temples, ancient kingdoms', 'Sigiriya', 'published', 1),
(2, 'Hill Country Slow Route', '4-5 days', 'Tea fields, train views, waterfalls', 'Ella', 'published', 2),
(3, 'South Coast + Safari', '5-6 days', 'Beach, fort, whales, wildlife', 'Mirissa', 'published', 3);

INSERT INTO explore_itinerary_places (itinerary_id, place_id, sort_order) VALUES
(1, 1, 1),
(1, 8, 2),
(2, 3, 1),
(2, 7, 2),
(3, 4, 1),
(3, 5, 2),
(3, 6, 3);

-- =========================================================
-- TOURIST EVENT SEED DATA FROM MERGED EVENT FILE
-- =========================================================
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
  '/images/events/kandy-cultural-dance-night.jpg',
  'https://www.google.com/maps/search/?api=1&query=Kandy+Lake+Club+Cultural+Dance',
  JSON_ARRAY('Kandy Lake Hotel', 'Queen''s Hotel', 'Temple View Hotel', 'Lake View Resort'),
  JSON_ARRAY('Kandyan dance and drumming', 'Easy evening plan', 'Family friendly', 'Near Kandy hotels'),
  TRUE, TRUE, 'approved'
),
(
  'colombo-street-food-walk',
  NULL,
  'Colombo Street Food Walk', 'Food & Culinary', 'Colombo', 'Colombo', 'Galle Face and Pettah Market', 'August', 8, 'Weekends', '5:00 PM - 8:30 PM', 'Paid', 3500, '3 hr 30 min',
  'Taste kottu, hoppers, isso wade, tropical juices, and Sri Lankan sweets while exploring Colombo''s evening food streets.',
  'A city food route designed for tourists staying in Colombo before travelling around the island. It combines local snacks, market stops, city stories, and safe walking guidance.',
  '/images/events/colombo-street-food-walk.jpg',
  'https://www.google.com/maps/search/?api=1&query=Galle+Face+Colombo+street+food',
  JSON_ARRAY('Cinnamon Grand', 'Galle Face Hotel', 'Marino Beach Colombo', 'Colombo City Stay'),
  JSON_ARRAY('Sri Lankan street food', 'Pettah market walk', 'Vegetarian options', 'City evening photos'),
  TRUE, TRUE, 'approved'
),
(
  'mirissa-sunset-beach-music',
  (SELECT id FROM explore_places WHERE slug = 'mirissa-beach-and-whale-watching' LIMIT 1),
  'Mirissa Sunset Beach Music', 'Beach & Coastal', 'Mirissa', 'Matara', 'Mirissa Beach', 'December', 12, 'Friday - Sunday', '5:30 PM - 10:00 PM', 'Free', 0, '4 hr 30 min',
  'A relaxed beach evening with sunset views, soft music, seafood stalls, mocktails, and coastal atmosphere.',
  'A casual event for backpackers, couples, and beach lovers. Tourists can enjoy the sunset after whale watching or surfing and then return easily to nearby stays.',
  '/images/events/mirissa-sunset-beach-music.jpg',
  'https://www.google.com/maps/search/?api=1&query=Mirissa+Beach+Sri+Lanka',
  JSON_ARRAY('Mirissa Beach Resort', 'Coconut Tree Hill Stay', 'South Coast Villa'),
  JSON_ARRAY('Sunset beach atmosphere', 'Live acoustic music', 'Food stalls', 'Walking distance from beach hotels'),
  FALSE, TRUE, 'approved'
),
(
  'ella-tea-estate-experience',
  (SELECT id FROM explore_places WHERE slug = 'nine-arch-bridge' LIMIT 1),
  'Ella Tea Estate Experience', 'Adventure & Nature', 'Ella', 'Badulla', 'Halpewatte Tea Factory', 'March', 3, 'Daily', '9:00 AM - 12:00 PM', 'Budget', 2200, '3 hr',
  'Walk through tea gardens, learn how Ceylon tea is produced, and enjoy a tasting session with hill-country views.',
  'This morning experience fits well with Ella sightseeing. It is ideal before Nine Arch Bridge or Little Adam''s Peak and connects nature, photography, and local tea culture.',
  '/images/events/ella-tea-estate-experience.jpg',
  'https://www.google.com/maps/search/?api=1&query=Halpewatte+Tea+Factory+Ella',
  JSON_ARRAY('Ella Mountain Resort', 'Morning Dew Hotel', 'Zion View Ella', 'Tea Garden View'),
  JSON_ARRAY('Tea garden walk', 'Factory tour', 'Tea tasting', 'Hill-country views'),
  TRUE, TRUE, 'approved'
),
(
  'galle-fort-heritage-evening',
  (SELECT id FROM explore_places WHERE slug = 'galle-fort' LIMIT 1),
  'Galle Fort Heritage Evening', 'Cultural & Religious', 'Galle', 'Galle', 'Galle Dutch Fort', 'January', 1, 'This month', '4:00 PM - 7:00 PM', 'Budget', 2800, '3 hr',
  'Explore colonial streets, lighthouse views, boutique cafes, and sunset stories inside the UNESCO-listed Galle Fort.',
  'A heritage evening walk designed for tourists who want a calm cultural experience near boutique hotels and restaurants in Galle Fort.',
  '/images/events/galle-fort-heritage-evening.jpg',
  'https://www.google.com/maps/search/?api=1&query=Galle+Fort+Sri+Lanka',
  JSON_ARRAY('Fort Bazaar', 'Galle Fort Hotel', 'Heritage Villa', 'Rampart View Stay'),
  JSON_ARRAY('UNESCO fort walk', 'Sunset ramparts', 'Colonial architecture', 'Cafe stops'),
  TRUE, FALSE, 'approved'
),
(
  'sigiriya-village-food-experience',
  (SELECT id FROM explore_places WHERE slug = 'sigiriya-rock-fortress' LIMIT 1),
  'Sigiriya Village Food Experience', 'Food & Culinary', 'Sigiriya', 'Matale', 'Sigiriya Village Area', 'February', 2, 'Daily', '11:00 AM - 2:00 PM', 'Paid', 4200, '3 hr',
  'Cook and taste rice and curry, coconut sambol, herbal drinks, and village-style sweets after a Sigiriya morning visit.',
  'A local food experience for tourists visiting Sigiriya or Dambulla. It is suitable as a lunch stop after the rock fortress climb.',
  '/images/events/sigiriya-village-food-experience.jpg',
  'https://www.google.com/maps/search/?api=1&query=Sigiriya+village+tour+Sri+Lanka',
  JSON_ARRAY('Sigiriya Village Hotel', 'Aliya Resort', 'Water Garden Sigiriya'),
  JSON_ARRAY('Village cooking', 'Traditional lunch', 'Local host family', 'Great after Sigiriya climb'),
  TRUE, FALSE, 'approved'
),
(
  'bentota-water-sports-day',
  NULL,
  'Bentota Water Sports Day', 'Adventure & Nature', 'Bentota', 'Galle', 'Bentota River', 'April', 4, 'Daily', '10:00 AM - 4:00 PM', 'Premium', 9500, 'Half day',
  'Jet ski, banana boat, river safari, and beginner-friendly water activities near Bentota beach hotels.',
  'A high-energy coastal activity day for tourists who want more than beach relaxation. Activity choices can be selected based on comfort and weather.',
  '/images/events/bentota-water-sports-day.jpg',
  'https://www.google.com/maps/search/?api=1&query=Bentota+water+sports',
  JSON_ARRAY('Taj Bentota', 'Avani Bentota', 'Bentota Beach Resort'),
  JSON_ARRAY('Water sports', 'River safari', 'Beach hotels nearby', 'Instructor support'),
  FALSE, FALSE, 'approved'
),
(
  'yala-wildlife-evening-talk',
  (SELECT id FROM explore_places WHERE slug = 'yala-national-park' LIMIT 1),
  'Yala Wildlife Evening Talk', 'Adventure & Nature', 'Yala', 'Hambantota', 'Tissamaharama Safari Camp Area', 'June', 6, 'Selected evenings', '6:30 PM - 8:00 PM', 'Free', 0, '1 hr 30 min',
  'Learn safari safety, leopard behaviour, birdlife, and responsible wildlife tourism before a Yala safari day.',
  'A useful evening session for tourists planning a safari. It improves safety awareness and helps visitors understand Yala without disturbing wildlife.',
  '/images/events/yala-wildlife-evening-talk.jpg',
  'https://www.google.com/maps/search/?api=1&query=Yala+National+Park+Sri+Lanka',
  JSON_ARRAY('Yala Safari Camp', 'Cinnamon Wild Yala', 'Tissa Lake Resort'),
  JSON_ARRAY('Safari safety', 'Wildlife awareness', 'Leopard and birdlife facts', 'Responsible travel'),
  TRUE, FALSE, 'approved'
);

UPDATE tourist_events
SET submitted_at = COALESCE(submitted_at, created_at, NOW()),
    approved_at = COALESCE(approved_at, NOW()),
    approved_by = (SELECT id FROM users WHERE email = 'admin@triplanka.lk' LIMIT 1)
WHERE status = 'approved';


-- =========================================================
-- ADDITIONAL PARTNER REFERENCE DATA
-- =========================================================

INSERT INTO users
(full_name, email, phone, nationality, national_id, password_hash, role, is_active)
VALUES
('Galle Heritage Hotels', 'galle.partner@triplanka.lk', '+94 76 33 33 333', 'Sri Lankan', NULL, '$2a$10$UzpnY3RU/AA5CSifoo8tZ.h2wGvzvaA3MjmFj7kPd7z6/.O79DXvG', 'partner', TRUE),
('North Coast Tourism', 'north.partner@triplanka.lk', '+94 77 44 44 444', 'Sri Lankan', NULL, '$2a$10$UzpnY3RU/AA5CSifoo8tZ.h2wGvzvaA3MjmFj7kPd7z6/.O79DXvG', 'partner', TRUE);

INSERT INTO properties
(
  partner_id, name, city, district, address, description, quote, logo_url, hero_title,
  theme_color, property_password_hash, property_type,
  plan_type, room_limit,
  registration_fee, registration_payment_status, registration_payment_method_id, registration_paid_at,
  monthly_charge, monthly_payment_status, monthly_payment_method_id, monthly_paid_at,
  monthly_cycle_start, monthly_cycle_end, next_monthly_due_date,
  platform_registration_fee, fee_payment_status,
  status, is_verified, rejection_reason
)
VALUES
(
  (SELECT id FROM users WHERE email = 'galle.partner@triplanka.lk' LIMIT 1),
  'Galle Fort Boutique Villa', 'Galle', 'Galle', 'Church Street, Galle Fort',
  'A calm boutique villa inside Galle Fort with heritage design, walking access to cafes, lighthouse views, and sunset ramparts.',
  'Sleep inside the old fort walls.',
  '/images/hotels/galle-fort-boutique-villa/logo.jpg',
  'Galle Fort Boutique Villa', '#7c2d12', '$2b$10$Irpq9a/MJ7m.aN.mH4jR6Ot0kVh.DaJzVjkPUS8m9LJ4kkX3V/ZGa', 'Villa',
  'premium', 100,
  8500.00, 'Paid', 1, NOW(),
  4000.00, 'Paid', 2, NOW(),
  NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 1 MONTH),
  8500.00, 'Paid',
  'approved', TRUE, NULL
),
(
  (SELECT id FROM users WHERE email = 'north.partner@triplanka.lk' LIMIT 1),
  'Jaffna Heritage Guesthouse', 'Jaffna', 'Jaffna', 'Temple Road, Nallur, Jaffna',
  'A friendly northern guesthouse near Nallur with local food, bicycle support, and easy access to Jaffna town and islands.',
  'Feel the northern culture with comfort.',
  '/images/hotels/jaffna-heritage-guesthouse/logo.jpg',
  'Jaffna Heritage Guesthouse', '#9333ea', '$2b$10$Irpq9a/MJ7m.aN.mH4jR6Ot0kVh.DaJzVjkPUS8m9LJ4kkX3V/ZGa', 'Guesthouse',
  'standard', 50,
  5000.00, 'Paid', 1, NOW(),
  2500.00, 'Free Trial', NULL, NULL,
  NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 1 MONTH),
  5000.00, 'Paid',
  'approved', TRUE, NULL
),
(
  (SELECT id FROM users WHERE email = 'galle.partner@triplanka.lk' LIMIT 1),
  'Bentota River Resort', 'Bentota', 'Galle', 'River Side Road, Bentota',
  'A river-side resort with boat rides, water sports support, family rooms, and beach access within a short drive.',
  'River breeze and beach days together.',
  '/images/hotels/bentota-river-resort/logo.jpg',
  'Bentota River Resort', '#0369a1', '$2b$10$Irpq9a/MJ7m.aN.mH4jR6Ot0kVh.DaJzVjkPUS8m9LJ4kkX3V/ZGa', 'Resort',
  'premium', 100,
  8500.00, 'Unpaid', NULL, NULL,
  4000.00, 'Free Trial', NULL, NULL,
  NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 1 MONTH),
  8500.00, 'Unpaid',
  'pending', FALSE, NULL
);

INSERT INTO rooms
(property_id, room_type, capacity, base_occupancy, price_per_night, extra_person_price, price_per_day, total_rooms, available_rooms)
VALUES
((SELECT id FROM properties WHERE name = 'Galle Fort Boutique Villa' LIMIT 1), 'Heritage Deluxe Room', 2, 2, 26000.00, 0.00, 18000.00, 6, 6),
((SELECT id FROM properties WHERE name = 'Galle Fort Boutique Villa' LIMIT 1), 'Fort Family Suite', 4, 2, 38000.00, 4500.00, 26000.00, 3, 3),
((SELECT id FROM properties WHERE name = 'Jaffna Heritage Guesthouse' LIMIT 1), 'Northern Comfort Room', 2, 2, 9500.00, 0.00, 6500.00, 8, 8),
((SELECT id FROM properties WHERE name = 'Jaffna Heritage Guesthouse' LIMIT 1), 'Family Guest Room', 4, 2, 14500.00, 2500.00, 9500.00, 4, 4),
((SELECT id FROM properties WHERE name = 'Bentota River Resort' LIMIT 1), 'River View Room', 2, 2, 21000.00, 0.00, 14500.00, 10, 10),
((SELECT id FROM properties WHERE name = 'Bentota River Resort' LIMIT 1), 'Water Sports Family Suite', 5, 3, 42000.00, 5000.00, 30000.00, 4, 4);

INSERT INTO property_photos (property_id, image_url, is_main)
VALUES
((SELECT id FROM properties WHERE name = 'Galle Fort Boutique Villa' LIMIT 1), '/images/hotels/galle-fort-boutique-villa/property-01.jpg', TRUE),
((SELECT id FROM properties WHERE name = 'Galle Fort Boutique Villa' LIMIT 1), '/images/hotels/galle-fort-boutique-villa/property-02.jpg', FALSE),
((SELECT id FROM properties WHERE name = 'Jaffna Heritage Guesthouse' LIMIT 1), '/images/hotels/jaffna-heritage-guesthouse/property-01.jpg', TRUE),
((SELECT id FROM properties WHERE name = 'Bentota River Resort' LIMIT 1), '/images/hotels/bentota-river-resort/property-01.jpg', TRUE);

INSERT INTO room_photos (room_id, image_url, is_main)
VALUES
((SELECT r.id FROM rooms r JOIN properties p ON p.id = r.property_id WHERE p.name = 'Galle Fort Boutique Villa' AND r.room_type = 'Heritage Deluxe Room' LIMIT 1), '/images/rooms/galle-fort-boutique-villa/heritage-deluxe-room.jpg', TRUE),
((SELECT r.id FROM rooms r JOIN properties p ON p.id = r.property_id WHERE p.name = 'Galle Fort Boutique Villa' AND r.room_type = 'Fort Family Suite' LIMIT 1), '/images/rooms/galle-fort-boutique-villa/fort-family-suite.jpg', TRUE),
((SELECT r.id FROM rooms r JOIN properties p ON p.id = r.property_id WHERE p.name = 'Jaffna Heritage Guesthouse' AND r.room_type = 'Northern Comfort Room' LIMIT 1), '/images/rooms/jaffna-heritage-guesthouse/northern-comfort-room.jpg', TRUE),
((SELECT r.id FROM rooms r JOIN properties p ON p.id = r.property_id WHERE p.name = 'Bentota River Resort' AND r.room_type = 'River View Room' LIMIT 1), '/images/rooms/bentota-river-resort/river-view-room.jpg', TRUE);

INSERT INTO property_policies
(property_id, check_in_time, check_out_time, cancellation_policy, day_package_available, night_package_available)
VALUES
((SELECT id FROM properties WHERE name = 'Galle Fort Boutique Villa' LIMIT 1), '14:00:00', '11:00:00', 'Free cancellation up to 5 days before check-in.', TRUE, TRUE),
((SELECT id FROM properties WHERE name = 'Jaffna Heritage Guesthouse' LIMIT 1), '13:00:00', '10:30:00', 'Free cancellation up to 2 days before check-in.', TRUE, TRUE),
((SELECT id FROM properties WHERE name = 'Bentota River Resort' LIMIT 1), '14:00:00', '11:00:00', 'Free cancellation up to 3 days before check-in.', TRUE, TRUE);


INSERT INTO payment_transactions
(property_id, partner_id, payment_type, plan_type, amount, status, paid_at, notes)
VALUES
((SELECT id FROM properties WHERE name = 'Galle Fort Boutique Villa' LIMIT 1), (SELECT id FROM users WHERE email = 'galle.partner@triplanka.lk' LIMIT 1), 'registration', 'premium', 8500.00, 'Paid', NOW(), 'Seed registration payment for Galle Fort Boutique Villa'),
((SELECT id FROM properties WHERE name = 'Galle Fort Boutique Villa' LIMIT 1), (SELECT id FROM users WHERE email = 'galle.partner@triplanka.lk' LIMIT 1), 'monthly', 'premium', 4000.00, 'Paid', NOW(), 'Seed monthly payment for Galle Fort Boutique Villa'),
((SELECT id FROM properties WHERE name = 'Jaffna Heritage Guesthouse' LIMIT 1), (SELECT id FROM users WHERE email = 'north.partner@triplanka.lk' LIMIT 1), 'registration', 'standard', 5000.00, 'Paid', NOW(), 'Seed registration payment for Jaffna Heritage Guesthouse');

-- =========================================================
-- PARTNER GUIDE SEED DATA
-- =========================================================
INSERT INTO partner_guides
(partner_id, slug, full_name, display_name, guide_type, city, district, base_location, languages, experience_years, license_number, nic_or_passport, phone, email, whatsapp_number, price_per_day, price_per_hour, availability, services, specialities, short_description, bio, image_url, rating, total_reviews, status, rejection_reason, submitted_at, approved_at, approved_by, registration_fee, registration_payment_status, registration_paid_at, promotion_fee, promotion_payment_status, promotion_paid_at, promotion_expires_at, is_promoted, promotion_sort_order)
VALUES
(
  (SELECT id FROM users WHERE email = 'partner@triplanka.lk' LIMIT 1),
  'nimal-kandy-heritage-guide', 'Nimal Perera', 'Nimal Heritage Guide', 'Heritage', 'Kandy', 'Kandy', 'Kandy City',
  JSON_ARRAY('English', 'Sinhala'), 9, 'SLTG-KDY-1021', '881234567V', '+94 77 101 2020', 'nimal.guide@triplanka.lk', '+94 77 101 2020',
  8500.00, 1800.00, 'Daily 8 AM - 6 PM', JSON_ARRAY('Temple tours', 'Cultural walks', 'Family tours'), JSON_ARRAY('Kandyan culture', 'Temple of the Tooth', 'Village stories'),
  'Friendly Kandy guide for heritage walks and cultural trips.',
  'Nimal has guided local and foreign tourists around Kandy, Peradeniya, and nearby cultural locations for many years.',
  '/images/guides/nimal-kandy-heritage-guide.jpg', 4.90, 46, 'approved', NULL, NOW(), NOW(),
  (SELECT id FROM users WHERE email = 'admin@triplanka.lk' LIMIT 1), 3000.00, 'Paid', NOW(), 1500.00, 'Paid', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE, 1
),
(
  (SELECT id FROM users WHERE email = 'galle.partner@triplanka.lk' LIMIT 1),
  'sachini-galle-fort-guide', 'Sachini Jayawardena', 'Sachini Fort Walks', 'Heritage', 'Galle', 'Galle', 'Galle Fort',
  JSON_ARRAY('English', 'Sinhala'), 6, 'SLTG-GLE-2044', '945551234V', '+94 76 404 5050', 'sachini.guide@triplanka.lk', '+94 76 404 5050',
  9500.00, 2200.00, 'Weekdays and weekends by booking', JSON_ARRAY('Fort walks', 'Photography routes', 'Food stops'), JSON_ARRAY('Galle Fort', 'Dutch history', 'Sunset viewpoints'),
  'Galle Fort specialist guide with photography-friendly routes.',
  'Sachini focuses on slow heritage walks, local stories, cafe stops, and sunset viewpoints inside Galle Fort.',
  '/images/guides/sachini-galle-fort-guide.jpg', 4.85, 31, 'approved', NULL, NOW(), NOW(),
  (SELECT id FROM users WHERE email = 'admin@triplanka.lk' LIMIT 1), 3000.00, 'Paid', NOW(), 1500.00, 'Unpaid', NULL, NULL, FALSE, 0
),
(
  (SELECT id FROM users WHERE email = 'north.partner@triplanka.lk' LIMIT 1),
  'arun-jaffna-culture-guide', 'Arun Rajan', 'Arun Northern Trails', 'Culture', 'Jaffna', 'Jaffna', 'Nallur',
  JSON_ARRAY('English', 'Tamil', 'Sinhala'), 5, 'SLTG-JFN-3055', '900112233V', '+94 77 909 3030', 'arun.guide@triplanka.lk', '+94 77 909 3030',
  7800.00, 1600.00, 'Daily except Monday', JSON_ARRAY('Nallur temple routes', 'Island trips', 'Local food visits'), JSON_ARRAY('Northern culture', 'Jaffna food', 'Island temples'),
  'Northern guide for Jaffna culture, food, and island routes.',
  'Arun can support guests who want to understand Jaffna culture, food, and island routes.',
  '/images/guides/arun-jaffna-culture-guide.jpg', 4.70, 18, 'approved', NULL, NOW(), NOW(),
  (SELECT id FROM users WHERE email = 'admin@triplanka.lk' LIMIT 1), 3000.00, 'Paid', NOW(), 1500.00, 'Unpaid', NULL, NULL, FALSE, 0
);

INSERT INTO guide_payment_transactions
(guide_id, partner_id, payment_type, amount, status, paid_at, notes)
VALUES
((SELECT id FROM partner_guides WHERE slug = 'nimal-kandy-heritage-guide' LIMIT 1), (SELECT id FROM users WHERE email = 'partner@triplanka.lk' LIMIT 1), 'registration', 3000.00, 'Paid', NOW(), 'Seed registration payment for Nimal guide'),
((SELECT id FROM partner_guides WHERE slug = 'nimal-kandy-heritage-guide' LIMIT 1), (SELECT id FROM users WHERE email = 'partner@triplanka.lk' LIMIT 1), 'promotion', 1500.00, 'Paid', NOW(), 'Seed promotion payment for Nimal guide'),
((SELECT id FROM partner_guides WHERE slug = 'sachini-galle-fort-guide' LIMIT 1), (SELECT id FROM users WHERE email = 'galle.partner@triplanka.lk' LIMIT 1), 'registration', 3000.00, 'Paid', NOW(), 'Seed registration payment for Sachini guide'),
((SELECT id FROM partner_guides WHERE slug = 'arun-jaffna-culture-guide' LIMIT 1), (SELECT id FROM users WHERE email = 'north.partner@triplanka.lk' LIMIT 1), 'registration', 3000.00, 'Paid', NOW(), 'Seed registration payment for Arun guide');

-- =========================================================
-- ADDITIONAL APPROVED TOURIST EVENTS
-- =========================================================
INSERT INTO tourist_events
(slug, partner_id, property_id, explore_place_id, title, category, city, district, venue, month_name, month_number, event_date, date_label, time_label, price_type, price, duration, short_description, description, image_url, map_url, contact_name, contact_phone, contact_email, near_hotels, highlights, guide_recommended, featured, status, rejection_reason, submitted_at, approved_at, approved_by)
VALUES
(
  'galle-fort-sunset-photo-walk',
  (SELECT id FROM users WHERE email = 'galle.partner@triplanka.lk' LIMIT 1),
  (SELECT id FROM properties WHERE name = 'Galle Fort Boutique Villa' LIMIT 1),
  (SELECT id FROM explore_places WHERE slug = 'galle-fort' LIMIT 1),
  'Galle Fort Sunset Photo Walk', 'Cultural & Religious', 'Galle', 'Galle', 'Galle Lighthouse and Ramparts', 'February', 2, DATE_ADD(CURDATE(), INTERVAL 18 DAY), 'Next available evening', '4:30 PM - 6:45 PM', 'Budget', 2500.00, '2 hr 15 min',
  'A slow evening photo walk through Galle Fort ending near the ramparts at sunset.',
  'A relaxed heritage walk through the fort with local stories, architectural details, and sunset viewpoints.',
  '/images/events/galle-fort-sunset-photo-walk.jpg',
  'https://www.google.com/maps/search/?api=1&query=Galle+Fort+Lighthouse',
  'Sachini Fort Walks', '+94 76 404 5050', 'sachini.guide@triplanka.lk',
  JSON_ARRAY('Galle Fort Boutique Villa', 'Galle Fort Hotel', 'Rampart View Stay'),
  JSON_ARRAY('Sunset photos', 'Lighthouse stop', 'Heritage stories', 'Easy walk'),
  TRUE, TRUE, 'approved', NULL, NOW(), NOW(), (SELECT id FROM users WHERE email = 'admin@triplanka.lk' LIMIT 1)
),
(
  'jaffna-market-food-morning',
  (SELECT id FROM users WHERE email = 'north.partner@triplanka.lk' LIMIT 1),
  (SELECT id FROM properties WHERE name = 'Jaffna Heritage Guesthouse' LIMIT 1),
  NULL,
  'Jaffna Market Food Morning', 'Food & Culinary', 'Jaffna', 'Jaffna', 'Jaffna Market and Nallur Area', 'March', 3, DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'Upcoming morning', '8:00 AM - 11:00 AM', 'Paid', 3200.00, '3 hr',
  'Morning food route covering Jaffna snacks, market fruits, tea stops, and local breakfast items.',
  'A guided morning route through Jaffna market with local breakfast, fruit, tea, and regional food stories.',
  '/images/events/jaffna-market-food-morning.jpg',
  'https://www.google.com/maps/search/?api=1&query=Jaffna+Market',
  'Arun Northern Trails', '+94 77 909 3030', 'arun.guide@triplanka.lk',
  JSON_ARRAY('Jaffna Heritage Guesthouse', 'Nallur City Stay'),
  JSON_ARRAY('Local breakfast', 'Market walk', 'Tamil food culture', 'Morning route'),
  TRUE, FALSE, 'approved', NULL, NOW(), NOW(), (SELECT id FROM users WHERE email = 'admin@triplanka.lk' LIMIT 1)
),
(
  'bentota-river-lagoon-safari',
  (SELECT id FROM users WHERE email = 'galle.partner@triplanka.lk' LIMIT 1),
  (SELECT id FROM properties WHERE name = 'Bentota River Resort' LIMIT 1),
  NULL,
  'Bentota River Lagoon Safari', 'Adventure & Nature', 'Bentota', 'Galle', 'Bentota River Jetty', 'April', 4, DATE_ADD(CURDATE(), INTERVAL 35 DAY), 'Weekends', '9:00 AM - 12:30 PM', 'Premium', 8500.00, '3 hr 30 min',
  'Boat safari through river islands, mangroves, and bird-watching areas near Bentota.',
  'A guided river safari through mangroves and bird-watching areas near Bentota, suitable for families and nature travellers.',
  '/images/events/bentota-river-lagoon-safari.jpg',
  'https://www.google.com/maps/search/?api=1&query=Bentota+River',
  'Bentota River Resort Team', '+94 76 333 3333', 'galle.partner@triplanka.lk',
  JSON_ARRAY('Bentota River Resort', 'Taj Bentota', 'Avani Bentota'),
  JSON_ARRAY('Boat safari', 'Mangroves', 'Bird watching', 'Family friendly'),
  FALSE, FALSE, 'approved', NULL, NOW(), NOW(), (SELECT id FROM users WHERE email = 'admin@triplanka.lk' LIMIT 1)
);

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

