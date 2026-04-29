-- TourismHub LK Seed Data
-- Run this after schema.sql

USE tourismhub_lk;

-- =========================
-- USERS
-- Password note:
-- These are demo password hashes.
-- For real login testing, create users from Register page or Postman.
-- =========================

INSERT INTO users (name, email, phone, password_hash, role)
VALUES
('John Partner', 'partner@example.com', '+94771234567', '$2a$10$demo_hash_partner', 'partner'),
('Test Tourist', 'tourist@example.com', '+94779876543', '$2a$10$demo_hash_tourist', 'tourist'),
('Admin User', 'admin@example.com', '+94770000000', '$2a$10$demo_hash_admin', 'admin');

-- =========================
-- HOTELS
-- partner_id = 1 means John Partner owns these hotels
-- =========================

INSERT INTO hotels 
(partner_id, name, description, address, city, district, status, is_verified)
VALUES
(
    1,
    'Kandy Myst by Cinnamon',
    'A modern hotel in Kandy with beautiful views, comfortable rooms, pool, free Wi-Fi, and easy access to cultural attractions.',
    'No. 12, Peradeniya Road, Kandy',
    'Kandy',
    'Kandy',
    'approved',
    TRUE
),
(
    1,
    'Heeran Gardens House',
    'A peaceful boutique hotel in Kandy with mountain views, breakfast, pool, and comfortable rooms for local and foreign tourists.',
    'No. 25, Lake Road, Kandy',
    'Kandy',
    'Kandy',
    'approved',
    TRUE
),
(
    1,
    'Ocean View Colombo Hotel',
    'A modern city hotel in Colombo with sea views, free Wi-Fi, restaurant service, and easy access to Galle Face and shopping areas.',
    'No. 18, Marine Drive, Colombo',
    'Colombo',
    'Colombo',
    'approved',
    TRUE
);

-- =========================
-- ROOM TYPES
-- =========================

INSERT INTO room_types
(hotel_id, type_name, capacity, base_price_per_night, total_rooms)
VALUES
-- Kandy Myst by Cinnamon
(1, 'Deluxe Room', 2, 27750.00, 10),
(1, 'Family Suite', 4, 38500.00, 5),

-- Heeran Gardens House
(2, 'Standard Room', 2, 17950.00, 8),
(2, 'Deluxe Room', 2, 24450.00, 5),
(2, 'Junior Suite', 3, 32950.00, 3),

-- Ocean View Colombo Hotel
(3, 'City View Room', 2, 18900.00, 10),
(3, 'Sea View Deluxe Room', 2, 28500.00, 6),
(3, 'Executive Suite', 3, 42000.00, 4);

-- =========================
-- EVENTS
-- =========================

INSERT INTO events
(title, description, category, location, city, event_date, price, image_url, status)
VALUES
(
    'Kandy Esala Perahera',
    'A famous cultural festival in Kandy with traditional dancers, elephants, and fire performers.',
    'Festival',
    'Kandy City',
    'Kandy',
    '2026-08-10',
    0.00,
    'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=900&q=80',
    'active'
),
(
    'Royal Botanic Gardens Visit',
    'Explore beautiful gardens, plants, and peaceful walking paths in Peradeniya.',
    'Nature',
    'Peradeniya',
    'Kandy',
    '2026-05-20',
    1500.00,
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    'active'
),
(
    'Colombo City Night Tour',
    'Discover Colombo city, Galle Face, shopping areas, and food places at night.',
    'City Tour',
    'Colombo',
    'Colombo',
    '2026-06-15',
    2500.00,
    'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=900&q=80',
    'active'
);

-- =========================
-- SAMPLE BOOKING
-- =========================

INSERT INTO bookings
(
    booking_reference,
    user_id,
    hotel_id,
    room_type_id,
    guest_name,
    guest_email,
    guest_phone,
    check_in,
    check_out,
    guests,
    total_amount,
    booking_status,
    payment_status,
    special_requests
)
VALUES
(
    'TH25861473',
    2,
    1,
    1,
    'Test Tourist',
    'tourist@example.com',
    '+94779876543',
    '2026-05-18',
    '2026-05-19',
    2,
    27750.00,
    'confirmed',
    'pending_payment',
    'Please provide a room with a nice view.'
);

-- =========================
-- SAMPLE REVIEWS
-- =========================

INSERT INTO reviews (user_id, hotel_id, rating, comment)
VALUES
(2, 1, 5, 'Excellent stay with beautiful views and friendly staff.'),
(2, 2, 4, 'Peaceful hotel and very comfortable rooms.'),
(2, 3, 5, 'Great Colombo location and clean rooms.');

-- =========================
-- SAMPLE COMPLAINT
-- =========================

INSERT INTO complaints (user_id, hotel_id, complaint_type, description, status)
VALUES
(2, 1, 'Wrong Information', 'Hotel check-in time was different from the website.', 'open');