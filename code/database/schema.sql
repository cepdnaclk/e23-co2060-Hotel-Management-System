-- TourismHub LK Database Schema
-- Smart Hotel and Tourism Management System

DROP DATABASE IF EXISTS tourismhub_lk;
CREATE DATABASE tourismhub_lk;
USE tourismhub_lk;

-- =========================
-- USERS TABLE
-- =========================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('tourist', 'partner', 'admin') NOT NULL DEFAULT 'tourist',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- HOTELS TABLE
-- =========================
CREATE TABLE hotels (
    hotel_id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (partner_id) REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- ROOM TYPES TABLE
-- =========================
CREATE TABLE room_types (
    room_type_id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    base_price_per_night DECIMAL(10, 2) NOT NULL,
    total_rooms INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- BOOKINGS TABLE
-- =========================
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    hotel_id INT NOT NULL,
    room_type_id INT NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INT NOT NULL DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending_payment', 'paid') DEFAULT 'pending_payment',
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- EVENTS TABLE
-- =========================
CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    location VARCHAR(255),
    city VARCHAR(100),
    event_date DATE,
    price DECIMAL(10, 2) DEFAULT 0.00,
    image_url TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- REVIEWS TABLE
-- =========================
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hotel_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CHECK (rating >= 1 AND rating <= 5)
);

-- =========================
-- COMPLAINTS TABLE
-- =========================
CREATE TABLE complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hotel_id INT,
    complaint_type VARCHAR(100),
    description TEXT NOT NULL,
    status ENUM('open', 'in_review', 'resolved') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);