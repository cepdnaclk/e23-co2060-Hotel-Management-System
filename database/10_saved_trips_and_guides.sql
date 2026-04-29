USE tourismhub_lk;

INSERT INTO users (full_name, email, phone, password_hash, role) VALUES
('Admin User', 'admin@tourismhub.lk', '+94 77 000 0000', 'demo_hash', 'admin'),
('R. Perera', 'partner@hotel.lk', '+94 77 123 4567', 'demo_hash', 'partner'),
('John Doe', 'john@example.com', '+94 71 234 5678', 'demo_hash', 'tourist');

INSERT INTO hotels (
  partner_id,
  name,
  city,
  district,
  address,
  description,
  property_type,
  status,
  is_verified
) VALUES (
  2,
  'Heeran Gardens House',
  'Kandy',
  'Kandy District',
  'Kandy Lake Area, Kandy',
  'A serene hotel experience in Sri Lanka with comfortable rooms, beautiful surroundings, helpful staff, and easy access to nearby attractions.',
  'Hotel',
  'approved',
  TRUE
);

INSERT INTO rooms (
  hotel_id,
  room_type,
  capacity,
  price_per_night,
  total_rooms,
  available_rooms
) VALUES
(1, 'Standard Room', 2, 17950.00, 10, 6),
(1, 'Deluxe Room', 2, 24450.00, 8, 4),
(1, 'Junior Suite', 3, 32900.00, 4, 2);

INSERT INTO bookings (
  tourist_id,
  hotel_id,
  room_id,
  check_in,
  check_out,
  guests,
  total_amount,
  payment_status,
  booking_status,
  booking_reference
) VALUES
(
  3,
  1,
  1,
  '2026-05-18',
  '2026-05-19',
  2,
  35900.00,
  'pending',
  'confirmed',
  'TH25861473'
),
(
  3,
  1,
  2,
  '2026-06-01',
  '2026-06-03',
  2,
  48900.00,
  'paid',
  'confirmed',
  'TH1777124785353'
);

INSERT INTO hotel_events (
  hotel_id,
  title,
  event_date,
  event_time,
  description,
  status,
  image_url
) VALUES
(
  1,
  'Traditional Sri Lankan Dinner',
  '2026-05-26',
  '18:30:00',
  'Enjoy a cultural dinner experience with authentic Sri Lankan dishes and traditional music.',
  'published',
  'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80'
),
(
  1,
  'Live Jazz Night',
  '2026-05-18',
  '20:00:00',
  'Enjoy relaxing live jazz music with dinner specials near the pool area.',
  'unpublished',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=80'
),
(
  1,
  'Beach BBQ Night',
  '2026-05-10',
  '19:00:00',
  'Join us for a BBQ evening with grilled seafood, music, and cocktails.',
  'published',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80'
);

INSERT INTO restaurants (
  hotel_id,
  name,
  cuisine,
  opening_time,
  closing_time,
  status,
  image_url
) VALUES
(
  1,
  'Ocean Breeze Restaurant',
  'Sri Lankan · Seafood',
  '07:00:00',
  '22:00:00',
  'open',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80'
),
(
  1,
  'Sunset Bar & Grill',
  'BBQ · Cocktails · Western',
  '17:00:00',
  '23:00:00',
  'open',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
);

INSERT INTO table_reservations (
  restaurant_id,
  guest_name,
  reservation_date,
  reservation_time,
  guests,
  status
) VALUES
(1, 'Alex Silva', '2026-05-18', '19:30:00', 2, 'confirmed'),
(2, 'Kumar Family', '2026-05-19', '20:00:00', 5, 'confirmed'),
(1, 'Nimal Perera', '2026-05-20', '18:30:00', 3, 'pending');

INSERT INTO complaints (
  user_id,
  hotel_id,
  subject,
  description,
  complaint_type,
  priority,
  status
) VALUES
(
  3,
  1,
  'Incorrect room information',
  'The room shown in the listing was different from the room provided at check-in.',
  'hotel_complaint',
  'high',
  'open'
),
(
  3,
  1,
  'Fake review submitted',
  'The reported review appears to be fake and may have been posted by a competitor.',
  'review_report',
  'medium',
  'in_progress'
),
(
  3,
  1,
  'Overbooking issue',
  'The guest reported that the hotel was overbooked on arrival.',
  'booking_issue',
  'high',
  'resolved'
);