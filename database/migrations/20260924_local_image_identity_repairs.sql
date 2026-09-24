-- Optional follow-up for the existing tourismhub_lk database. No reset or inserts.
-- The original URL-only migration reused an earlier row's mapping when two
-- different records shared a stock-image URL. The correct files already exist.
-- Primary-key + owner + old-value guards preserve custom photos and are idempotent.
-- SQL_SAFE_UPDATES can stay enabled. Review the SELECT results before executing.
USE tourismhub_lk;

SELECT i.id, p.slug, i.sort_order, i.image_url
FROM explore_place_images i JOIN explore_places p ON p.id = i.place_id
WHERE i.id IN (28, 29, 30) AND p.slug = 'adams-peak';

SELECT rp.id, p.name, r.room_type, rp.image_url
FROM room_photos rp JOIN rooms r ON r.id = rp.room_id
JOIN properties p ON p.id = r.property_id
WHERE rp.id = 10 AND p.name = 'Jaffna Heritage Guesthouse';

START TRANSACTION;

UPDATE explore_place_images
SET image_url = '/images/destinations/adams-peak/gallery-01.jpg'
WHERE id = 28 AND sort_order = 1
  AND place_id = (SELECT id FROM explore_places WHERE slug = 'adams-peak')
  AND image_url = '/images/destinations/nuwara-eliya-tea-plantations/gallery-02.jpg';

UPDATE explore_place_images
SET image_url = '/images/destinations/adams-peak/gallery-02.jpg'
WHERE id = 29 AND sort_order = 2
  AND place_id = (SELECT id FROM explore_places WHERE slug = 'adams-peak')
  AND image_url = '/images/destinations/nuwara-eliya-tea-plantations/gallery-01.jpg';

UPDATE explore_place_images
SET image_url = '/images/destinations/adams-peak/gallery-03.jpg'
WHERE id = 30 AND sort_order = 3
  AND place_id = (SELECT id FROM explore_places WHERE slug = 'adams-peak')
  AND image_url = '/images/destinations/nuwara-eliya-tea-plantations/gallery-03.jpg';

UPDATE room_photos
SET image_url = '/images/rooms/jaffna-heritage-guesthouse/northern-comfort-room.jpg'
WHERE id = 10
  AND room_id IN (
    SELECT r.id FROM rooms r JOIN properties p ON p.id = r.property_id
    WHERE p.name = 'Jaffna Heritage Guesthouse' AND r.room_type = 'Northern Comfort Room'
  )
  AND image_url = '/images/rooms/colombo-city-stay/business-room.jpg';

COMMIT;
