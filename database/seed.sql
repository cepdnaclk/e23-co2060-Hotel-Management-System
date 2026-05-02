USE tourismhub_lk;

-- Demo user password for all users: Admin@123
-- Demo property-management password in these sample records is stored as bcrypt hash.

INSERT INTO users 
(full_name, email, phone, nationality, national_id, password_hash, role, is_active)
VALUES
('System Admin', 'admin@tourismhub.lk', '+94 70 00 00 000', 'Sri Lankan', NULL, '$2a$10$UzpnY3RU/AA5CSifoo8tZ.h2wGvzvaA3MjmFj7kPd7z6/.O79DXvG', 'admin', TRUE),
('Sun Lanka Travels', 'partner@demo.lk', '+94 71 11 11 111', 'Sri Lankan', NULL, '$2a$10$UzpnY3RU/AA5CSifoo8tZ.h2wGvzvaA3MjmFj7kPd7z6/.O79DXvG', 'partner', TRUE),
('Demo Tourist', 'tourist@demo.lk', '+94 72 22 22 222', 'Sri Lankan', '200012345678', '$2a$10$UzpnY3RU/AA5CSifoo8tZ.h2wGvzvaA3MjmFj7kPd7z6/.O79DXvG', 'tourist', TRUE);

INSERT INTO property_plans
(plan_key, plan_name, room_limit, registration_fee, monthly_fee, description, is_active)
VALUES
('standard', 'Normal Version', 50, 5000.00, 2500.00, 'Normal version allows maximum 50 rooms.', TRUE),
('premium', 'Premium Version', 100, 8500.00, 4000.00, 'Premium version allows maximum 100 rooms.', TRUE);

INSERT INTO payment_methods
(method_name, method_type, account_details, instructions, is_active)
VALUES
('Commercial Bank Transfer', 'bank_transfer', 'Account Name: TourismHub LK\nAccount No: 1234567890\nBranch: Colombo', 'Use property name as payment reference and keep receipt.', TRUE),
('Online Card Payment', 'card', 'Demo card gateway', 'For semester demo, clicking Pay will mark payment as paid.', TRUE),
('Cash Deposit', 'cash', 'TourismHub LK Office, Colombo', 'Submit receipt after deposit.', TRUE);

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
  'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=500&q=80',
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
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=500&q=80',
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
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80',
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
(1, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', TRUE),
(1, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', FALSE),
(2, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80', TRUE),
(3, 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', TRUE);

INSERT INTO room_photos (room_id, image_url, is_main)
VALUES
(1, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80', TRUE),
(2, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80', TRUE),
(3, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80', TRUE),
(4, 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80', TRUE),
(5, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80', TRUE),
(6, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80', TRUE),
(7, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=80', TRUE);

INSERT INTO property_policies
(property_id, check_in_time, check_out_time, cancellation_policy, day_package_available, night_package_available)
VALUES
(1, '14:00:00', '11:00:00', 'Free cancellation up to 2 days before check-in.', TRUE, TRUE),
(2, '14:00:00', '11:00:00', 'Free cancellation up to 1 day before check-in.', TRUE, TRUE),
(3, '13:00:00', '10:30:00', 'Free cancellation up to 3 days before check-in.', TRUE, TRUE);

INSERT INTO bookings
(booking_reference, tourist_id, user_id, guest_session_id, property_id, room_id, full_name, email, nationality, country_code, phone, check_in, check_out, check_in_package, check_out_package, guests, nights, day_units, night_units, adults, children, total_amount, notes, partner_note, payment_status, booking_status)
VALUES
('THLK-DEMO-1001', 3, 3, NULL, 1, 2, 'Demo Tourist', 'tourist@demo.lk', 'Sri Lankan', '+94', '+94 72 22 22 222', DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 8 DAY), 'night', 'day', 4, 1, 1, 1, 4, 0, 39000.00, 'Need a quiet family room if available.', NULL, 'Pending Payment', 'Pending Partner Approval'),
('THLK-DEMO-1002', 3, 3, NULL, 3, 6, 'Demo Tourist', 'tourist@demo.lk', 'Sri Lankan', '+94', '+94 72 22 22 222', DATE_ADD(CURDATE(), INTERVAL 14 DAY), DATE_ADD(CURDATE(), INTERVAL 16 DAY), 'night', 'day', 2, 2, 1, 2, 2, 0, 46000.00, 'Mountain view preferred.', NULL, 'Paid', 'Approved');

UPDATE rooms SET available_rooms = available_rooms - 1 WHERE id = 6 AND available_rooms > 0;

INSERT INTO payment_transactions
(property_id, partner_id, payment_type, plan_type, amount, status, paid_at, notes)
VALUES
(1, 2, 'registration', 'standard', 5000.00, 'Paid', NOW(), 'Seed registration payment for Kandy Lake Hotel'),
(3, 2, 'registration', 'premium', 8500.00, 'Paid', NOW(), 'Seed registration payment for Ella Mountain View Resort'),
(3, 2, 'monthly', 'premium', 4000.00, 'Paid', NOW(), 'Seed monthly payment for Ella Mountain View Resort');

INSERT INTO notifications (user_id, title, message, type, is_read)
VALUES
(2, 'Partner account created', 'Your partner demo account is ready. You can manage your properties.', 'success', FALSE),
(2, 'Booking request received', 'A tourist requested a Family Room at Kandy Lake Hotel.', 'booking', FALSE),
(1, 'New property request', 'Colombo City Stay is waiting for admin approval.', 'approval', FALSE),
(3, 'Booking submitted', 'Your booking request THLK-DEMO-1001 is waiting for partner approval.', 'booking', FALSE),
(3, 'Booking approved', 'Your booking THLK-DEMO-1002 has been approved.', 'success', FALSE);
