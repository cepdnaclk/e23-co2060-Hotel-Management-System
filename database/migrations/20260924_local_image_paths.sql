SET SQL_SAFE_UPDATES = 0;
USE tourismhub_lk;

-- TripLanka SET 6 — convert existing database image URLs to permanent local paths.
-- Safe: only rows still containing the original external URL are changed.

UPDATE properties SET logo_url = '/images/hotels/kandy-lake-hotel/logo.jpg' WHERE logo_url = 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=500&q=80';
UPDATE properties SET logo_url = '/images/hotels/colombo-city-stay/logo.jpg' WHERE logo_url = 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=500&q=80';
UPDATE properties SET logo_url = '/images/hotels/ella-mountain-view-resort/logo.jpg' WHERE logo_url = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80';
UPDATE property_photos SET image_url = '/images/hotels/kandy-lake-hotel/property-01.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
UPDATE property_photos SET image_url = '/images/hotels/kandy-lake-hotel/property-02.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80';
UPDATE property_photos SET image_url = '/images/hotels/colombo-city-stay/property-01.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80';
UPDATE property_photos SET image_url = '/images/hotels/ella-mountain-view-resort/property-01.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80';
UPDATE room_photos SET image_url = '/images/rooms/kandy-lake-hotel/deluxe-room.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80';
UPDATE room_photos SET image_url = '/images/rooms/kandy-lake-hotel/family-room.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80';
UPDATE room_photos SET image_url = '/images/rooms/kandy-lake-hotel/lake-view-suite.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80';
UPDATE room_photos SET image_url = '/images/rooms/colombo-city-stay/standard-room.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80';
UPDATE room_photos SET image_url = '/images/rooms/colombo-city-stay/business-room.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80';
UPDATE room_photos SET image_url = '/images/rooms/ella-mountain-view-resort/mountain-cabin.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80';
UPDATE room_photos SET image_url = '/images/rooms/ella-mountain-view-resort/family-mountain-villa.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=80';
UPDATE explore_places SET image_url = '/images/destinations/sigiriya-rock-fortress/main.jpg' WHERE image_url = 'https://images.pexels.com/photos/34128244/pexels-photo-34128244.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_places SET image_url = '/images/destinations/temple-of-the-sacred-tooth-relic/main.jpg' WHERE image_url = 'https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_places SET image_url = '/images/destinations/nine-arch-bridge/main.jpg' WHERE image_url = 'https://images.pexels.com/photos/4769075/pexels-photo-4769075.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_places SET image_url = '/images/destinations/mirissa-beach-and-whale-watching/main.jpg' WHERE image_url = 'https://images.pexels.com/photos/32574422/pexels-photo-32574422.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_places SET image_url = '/images/destinations/galle-fort/main.jpg' WHERE image_url = 'https://images.pexels.com/photos/27669342/pexels-photo-27669342.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_places SET image_url = '/images/destinations/yala-national-park/main.jpg' WHERE image_url = 'https://images.pexels.com/photos/10607669/pexels-photo-10607669.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_places SET image_url = '/images/destinations/nuwara-eliya-tea-plantations/main.jpg' WHERE image_url = 'https://images.pexels.com/photos/321570/pexels-photo-321570.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_places SET image_url = '/images/destinations/dambulla-cave-temple/main.jpg' WHERE image_url = 'https://images.pexels.com/photos/35598970/pexels-photo-35598970.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_places SET image_url = '/images/destinations/trincomalee-beaches/main.jpg' WHERE image_url = 'https://images.pexels.com/photos/10850861/pexels-photo-10850861.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_places SET image_url = '/images/destinations/adams-peak/main.jpg' WHERE image_url = 'https://images.pexels.com/photos/19287633/pexels-photo-19287633.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/sigiriya-rock-fortress/gallery-01.jpg' WHERE image_url = 'https://images.pexels.com/photos/34128244/pexels-photo-34128244.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/sigiriya-rock-fortress/gallery-02.jpg' WHERE image_url = 'https://images.pexels.com/photos/34128249/pexels-photo-34128249.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/sigiriya-rock-fortress/gallery-03.jpg' WHERE image_url = 'https://images.pexels.com/photos/12205267/pexels-photo-12205267.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/temple-of-the-sacred-tooth-relic/gallery-01.jpg' WHERE image_url = 'https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/temple-of-the-sacred-tooth-relic/gallery-02.jpg' WHERE image_url = 'https://images.pexels.com/photos/739409/pexels-photo-739409.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/temple-of-the-sacred-tooth-relic/gallery-03.png' WHERE image_url = 'https://images.pexels.com/photos/27907342/pexels-photo-27907342.png?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/nine-arch-bridge/gallery-01.jpg' WHERE image_url = 'https://images.pexels.com/photos/4769075/pexels-photo-4769075.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/nine-arch-bridge/gallery-02.jpg' WHERE image_url = 'https://images.pexels.com/photos/2403209/pexels-photo-2403209.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/nine-arch-bridge/gallery-03.jpg' WHERE image_url = 'https://images.pexels.com/photos/18498686/pexels-photo-18498686.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/mirissa-beach-and-whale-watching/gallery-01.jpg' WHERE image_url = 'https://images.pexels.com/photos/32574422/pexels-photo-32574422.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/mirissa-beach-and-whale-watching/gallery-02.jpg' WHERE image_url = 'https://images.pexels.com/photos/5675024/pexels-photo-5675024.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/mirissa-beach-and-whale-watching/gallery-03.jpg' WHERE image_url = 'https://images.pexels.com/photos/4351425/pexels-photo-4351425.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/galle-fort/gallery-01.jpg' WHERE image_url = 'https://images.pexels.com/photos/27669342/pexels-photo-27669342.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/galle-fort/gallery-02.jpg' WHERE image_url = 'https://images.pexels.com/photos/27669335/pexels-photo-27669335.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/galle-fort/gallery-03.jpg' WHERE image_url = 'https://images.pexels.com/photos/27669334/pexels-photo-27669334.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/yala-national-park/gallery-01.jpg' WHERE image_url = 'https://images.pexels.com/photos/10607669/pexels-photo-10607669.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/yala-national-park/gallery-02.jpg' WHERE image_url = 'https://images.pexels.com/photos/17281950/pexels-photo-17281950.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/yala-national-park/gallery-03.jpg' WHERE image_url = 'https://images.pexels.com/photos/15232521/pexels-photo-15232521.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/nuwara-eliya-tea-plantations/gallery-01.jpg' WHERE image_url = 'https://images.pexels.com/photos/321570/pexels-photo-321570.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/nuwara-eliya-tea-plantations/gallery-02.jpg' WHERE image_url = 'https://images.pexels.com/photos/19287633/pexels-photo-19287633.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/nuwara-eliya-tea-plantations/gallery-03.jpg' WHERE image_url = 'https://images.pexels.com/photos/36847090/pexels-photo-36847090.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/dambulla-cave-temple/gallery-01.jpg' WHERE image_url = 'https://images.pexels.com/photos/35598970/pexels-photo-35598970.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/dambulla-cave-temple/gallery-02.jpg' WHERE image_url = 'https://images.pexels.com/photos/32547985/pexels-photo-32547985.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/dambulla-cave-temple/gallery-03.jpg' WHERE image_url = 'https://images.pexels.com/photos/32547976/pexels-photo-32547976.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/trincomalee-beaches/gallery-01.jpg' WHERE image_url = 'https://images.pexels.com/photos/10850861/pexels-photo-10850861.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/trincomalee-beaches/gallery-02.jpg' WHERE image_url = 'https://images.pexels.com/photos/10850860/pexels-photo-10850860.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/trincomalee-beaches/gallery-03.jpg' WHERE image_url = 'https://images.pexels.com/photos/10850855/pexels-photo-10850855.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/adams-peak/gallery-01.jpg' WHERE image_url = 'https://images.pexels.com/photos/19287633/pexels-photo-19287633.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/adams-peak/gallery-02.jpg' WHERE image_url = 'https://images.pexels.com/photos/321570/pexels-photo-321570.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE explore_place_images SET image_url = '/images/destinations/adams-peak/gallery-03.jpg' WHERE image_url = 'https://images.pexels.com/photos/36847090/pexels-photo-36847090.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200';
UPDATE tourist_events SET image_url = '/images/events/kandy-cultural-dance-night.jpg' WHERE image_url = 'https://images.pexels.com/photos/38253196/pexels-photo-38253196.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1400&q=85';
UPDATE tourist_events SET image_url = '/images/events/colombo-street-food-walk.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=85';
UPDATE tourist_events SET image_url = '/images/events/mirissa-sunset-beach-music.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85';
UPDATE tourist_events SET image_url = '/images/events/ella-tea-estate-experience.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1567515275959-4421b83c7056?auto=format&fit=crop&w=1400&q=85';
UPDATE tourist_events SET image_url = '/images/events/galle-fort-heritage-evening.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1586611292717-f828b167408c?auto=format&fit=crop&w=1400&q=85';
UPDATE tourist_events SET image_url = '/images/events/sigiriya-village-food-experience.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1400&q=85';
UPDATE tourist_events SET image_url = '/images/events/bentota-water-sports-day.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85';
UPDATE tourist_events SET image_url = '/images/events/yala-wildlife-evening-talk.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1549366021-9f761d040a94?auto=format&fit=crop&w=1400&q=85';
UPDATE properties SET logo_url = '/images/hotels/galle-fort-boutique-villa/logo.jpg' WHERE logo_url = 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=500&q=80';
UPDATE properties SET logo_url = '/images/hotels/jaffna-heritage-guesthouse/logo.jpg' WHERE logo_url = 'https://images.unsplash.com/photo-1495365200479-c4ed1d35e1aa?auto=format&fit=crop&w=500&q=80';
UPDATE properties SET logo_url = '/images/hotels/bentota-river-resort/logo.jpg' WHERE logo_url = 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=500&q=80';
UPDATE property_photos SET image_url = '/images/hotels/galle-fort-boutique-villa/property-01.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80';
UPDATE property_photos SET image_url = '/images/hotels/galle-fort-boutique-villa/property-02.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80';
UPDATE property_photos SET image_url = '/images/hotels/jaffna-heritage-guesthouse/property-01.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80';
UPDATE property_photos SET image_url = '/images/hotels/bentota-river-resort/property-01.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80';
UPDATE room_photos SET image_url = '/images/rooms/galle-fort-boutique-villa/heritage-deluxe-room.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80';
UPDATE room_photos SET image_url = '/images/rooms/galle-fort-boutique-villa/fort-family-suite.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1000&q=80';
UPDATE room_photos SET image_url = '/images/rooms/jaffna-heritage-guesthouse/northern-comfort-room.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80';
UPDATE room_photos SET image_url = '/images/rooms/bentota-river-resort/river-view-room.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1000&q=80';
UPDATE partner_guides SET image_url = '/images/guides/nimal-kandy-heritage-guide.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=800&q=80';
UPDATE partner_guides SET image_url = '/images/guides/sachini-galle-fort-guide.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80';
UPDATE partner_guides SET image_url = '/images/guides/arun-jaffna-culture-guide.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80';
UPDATE tourist_events SET image_url = '/images/events/galle-fort-sunset-photo-walk.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=85';
UPDATE tourist_events SET image_url = '/images/events/jaffna-market-food-morning.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1400&q=85';
UPDATE tourist_events SET image_url = '/images/events/bentota-river-lagoon-safari.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=85';
UPDATE tourist_events SET image_url = '/images/events/colombo-night-party-demo-rejected.jpg' WHERE image_url = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=85';

-- Verification: this should return 0 after the migration.
SELECT (
  (SELECT COUNT(*) FROM properties WHERE logo_url LIKE 'https://images.%') +
  (SELECT COUNT(*) FROM property_photos WHERE image_url LIKE 'https://images.%') +
  (SELECT COUNT(*) FROM room_photos WHERE image_url LIKE 'https://images.%') +
  (SELECT COUNT(*) FROM explore_places WHERE image_url LIKE 'https://images.%') +
  (SELECT COUNT(*) FROM explore_place_images WHERE image_url LIKE 'https://images.%') +
  (SELECT COUNT(*) FROM tourist_events WHERE image_url LIKE 'https://images.%') +
  (SELECT COUNT(*) FROM partner_guides WHERE image_url LIKE 'https://images.%')
) AS remaining_external_image_urls;
SET SQL_SAFE_UPDATES = 1;