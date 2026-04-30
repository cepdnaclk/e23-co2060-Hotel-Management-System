import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppSettingsProvider } from "./context/AppSettingsContext";
import Home from './pages/Home';
import Results from './pages/Results';
import HotelDetails from './pages/HotelDetails';
import Register from './pages/Register';
import Login from './pages/Login';
import PartnerDashboard from './pages/PartnerDashboard';

function App() {
  return (
    <AppSettingsProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/results" element={<Results />} />
        <Route path="/hotel/:id" element={<HotelDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/partner-dashboard" element={<PartnerDashboard />} />
      </Routes>
    </Router>
    </AppSettingsProvider>
  );
}
export default App;
