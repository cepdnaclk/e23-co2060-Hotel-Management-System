const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // To handle JSON data in requests 

// 1. Database Connection 
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to TourismHub LK Database.');
});



app.post('/api/register', async (req, res) => {
    const { name, email, phone, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const sql = "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, email, phone, hashedPassword, role || 'tourist'], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Return the role so the frontend can redirect immediately after registration
        res.status(201).json({ 
            message: "User registered successfully!",
            role: role || 'tourist' 
        });
    });
});

// UC1: User Login (FR-U2, FR-C2)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ error: "Invalid credentials" });
        
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (isMatch) {
            // Role-based authorization using JWT
            const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token, role: user.role, name: user.name });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    });
});

// 3. Hotel Search API (UC2) [cite: 247, 459, 524, 525, 572, 581]
app.get('/api/hotels', (req, res) => {
    const city = req.query.city; // Search by destination [cite: 248]
    
    // Only show APPROVED hotels in public search [cite: 364, 431, 454, 587]
    const sql = "SELECT * FROM hotels WHERE city = ? AND status = 'approved'";
    db.query(sql, [city], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results); // Returns the list of hotels to UI-2 [cite: 583]
    });
});



// GET /api/hotels/:id - Fetch details for a specific hotel
app.get('/api/hotels/:id', (req, res) => {
    const hotelId = req.params.id;
    const sql = "SELECT * FROM hotels WHERE hotel_id = ?"; // [cite: 1504]

    db.query(sql, [hotelId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database query failed" });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "Hotel not found" });
        }
        res.json(result[0]); // Send only the single hotel object [cite: 1499]
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});