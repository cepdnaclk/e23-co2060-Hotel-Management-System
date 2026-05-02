import { Route, Routes } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";

import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import HotelsPage from "./pages/HotelsPage";
import HotelDetailsPage from "./pages/HotelDetailsPage";
import RoomAvailabilityPage from "./pages/RoomAvailabilityPage";

import TouristRegisterPage from "./pages/TouristRegisterPage";
import TouristLoginPage from "./pages/TouristLoginPage";

import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";

import ListYourPropertyPage from "./pages/partner/ListYourPropertyPage";
import PartnerRegisterPage from "./pages/partner/PartnerRegisterPage";
import PartnerLoginPage from "./pages/partner/PartnerLoginPage";
import PartnerDashboardPage from "./pages/partner/PartnerDashboardPage";
import PropertyManagementPage from "./pages/partner/PropertyManagementPage";
import PropertyLoginPage from "./pages/partner/PropertyLoginPage";
import RegisterPropertyPage from "./pages/partner/RegisterPropertyPage";

import PartnerBookingsPage from "./pages/partner/PartnerBookingsPage";
import OnlinePaymentFuturePage from "./pages/OnlinePaymentFuturePage";

function SimplePage({ title, message }) {
  return (
    <div className="page">
      <div className="card" style={{ padding: "30px" }}>
        <h1>{title}</h1>
        <p>{message || "This page will be built in the next steps."}</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        {/* Tourist/Public pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/hotels/:id" element={<HotelDetailsPage />} />
        <Route path="/hotels/:id/rooms" element={<RoomAvailabilityPage />} />

        <Route path="/login" element={<TouristLoginPage />} />
        <Route path="/register" element={<TouristRegisterPage />} />

        <Route path="/booking" element={<BookingPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route
          path="/online-payment-future"
          element={<OnlinePaymentFuturePage />}
        />

        {/* Navbar future pages */}
<Route path="/explore" element={<ExplorePage />} />

        <Route
          path="/trip-planner"
          element={
            <SimplePage
              title="Trip Planner"
              message="This page will help tourists plan their Sri Lankan travel journey in a future update."
            />
          }
        />

        <Route
          path="/travel-essentials"
          element={
            <SimplePage
              title="Travel Essentials"
              message="This page will include travel tips, emergency contacts, transport guidance, and tourist support information."
            />
          }
        />

        <Route
          path="/events"
          element={<SimplePage title="Events Page" />}
        />

        <Route
          path="/transport"
          element={<SimplePage title="Transport Page" />}
        />

        {/* Partner pages */}
        <Route path="/list-your-property" element={<ListYourPropertyPage />} />
        <Route path="/partner/register" element={<PartnerRegisterPage />} />
        <Route path="/partner/login" element={<PartnerLoginPage />} />
        <Route path="/partner/dashboard" element={<PartnerDashboardPage />} />
        <Route path="/partner/bookings" element={<PartnerBookingsPage />} />

        {/* Register property routes - both links work */}
        <Route
          path="/partner/register-property"
          element={<RegisterPropertyPage />}
        />

        <Route
          path="/partner/properties/new"
          element={<RegisterPropertyPage />}
        />

        {/* Property password verification */}
        <Route
          path="/partner/property-login/:id"
          element={<PropertyLoginPage />}
        />

        {/* Property management */}
        <Route
          path="/partner/properties/:id"
          element={<PropertyManagementPage />}
        />

        <Route
          path="*"
          element={
            <SimplePage
              title="Page Not Found"
              message="The page you are looking for does not exist."
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;

