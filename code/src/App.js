import React from 'react';

function App() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      
      {/* 1. Navigation Bar (Your Existing Code) */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 50px', background: '#2c3e50', color: 'white' }}>
        <h2 style={{ margin: 0 }}>SmartHotel</h2>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <span style={{ cursor: 'pointer' }}>Home</span>
          <span style={{ cursor: 'pointer' }}>Rooms</span>
          <span style={{ cursor: 'pointer' }}>Events</span>
          <button style={{ padding: '8px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Login
          </button>
        </div>
      </nav>

      {/* 2. Hero Section (The Search Bar Area) */}
      {/* This helps tourists find rooms and activities quickly */}
      <header style={{ 
        padding: '100px 20px', 
        background: 'linear-gradient(rgba(44, 62, 80, 0.7), rgba(44, 62, 80, 0.7)), url("https://images.unsplash.com/photo-1551918120-9739cb430c6d")', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        textAlign: 'center',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>Discover Sri Lanka</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>Plan your perfect stay with integrated hotel and tour bookings.</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Search destination or hotel..." 
            style={{ padding: '15px', width: '400px', borderRadius: '8px', border: 'none', fontSize: '1rem' }} 
          />
          <button style={{ padding: '15px 30px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Search Now
          </button>
        </div>
      </header>

      {/* 3. Service Categories Section */}
      {/* Displays the core services: Stays, Events, and Transport */}
      <section style={{ padding: '80px 50px', display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* Hotel Category */}
        <div style={cardStyle}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🏨</div>
          <h3>Luxury Stays</h3>
          <p>Find real-time room availability across top-rated hotels.</p>
        </div>

        {/* Tourism/Events Category */}
        <div style={cardStyle}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🎭</div>
          <h3>Cultural Events</h3>
          <p>Discover local festivals and traditional ceremonies nearby.</p>
        </div>

        {/* Transport Category */}
        <div style={cardStyle}>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>🚗</div>
          <h3>Easy Transport</h3>
          <p>Integrated transport packages for a seamless travel experience.</p>
        </div>

      </section>

      {/* 4. Footer */}
      <footer style={{ padding: '30px', background: '#2c3e50', color: '#bdc3c7', textAlign: 'center' }}>
        <p>© 2026 Smart Hotel & Tourism Management System | University of Peradeniya</p>
      </footer>

    </div>
  );
}

// Styling rule for cards to keep them consistent
const cardStyle = {
  background: 'white',
  padding: '40px 30px',
  borderRadius: '15px',
  width: '300px',
  textAlign: 'center',
  boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
  border: '1px solid #eee'
};

export default App;