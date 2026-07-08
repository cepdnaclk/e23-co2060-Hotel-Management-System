import { Route, Routes } from "react-router-dom";
import AIAssistant from "./components/AIAssistant/AIAssistant";

import PublicLayout from "./layouts/PublicLayout";

import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import PlaceDetailsPage from "./pages/PlaceDetailsPage";
import HotelsPage from "./pages/HotelsPage";
import HotelDetailsPage from "./pages/HotelDetailsPage";
import RoomAvailabilityPage from "./pages/RoomAvailabilityPage";

import TouristRegisterPage from "./pages/TouristRegisterPage";
import TouristLoginPage from "./pages/TouristLoginPage";

import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import TripPlannerPage from "./pages/TripPlannerPage";

import ListYourPropertyPage from "./pages/partner/ListYourPropertyPage";
import PartnerRegisterPage from "./pages/partner/PartnerRegisterPage";
import PartnerLoginPage from "./pages/partner/PartnerLoginPage";
import PartnerDashboardPage from "./pages/partner/PartnerDashboardPage";
import PartnerEventRegistrationPage from "./pages/partner/PartnerEventRegistrationPage";
import PartnerGuideRegistrationPage from "./pages/partner/PartnerGuideRegistrationPage";
import PropertyManagementPage from "./pages/partner/PropertyManagementPage";
import PropertyLoginPage from "./pages/partner/PropertyLoginPage";
import RegisterPropertyPage from "./pages/partner/RegisterPropertyPage";

import PartnerBookingsPage from "./pages/partner/PartnerBookingsPage";
import OnlinePaymentFuturePage from "./pages/OnlinePaymentFuturePage";
import EventsPage from "./pages/EventsPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import TouristGuidePage from "./pages/TouristGuidePage";
import GuideProfilePage from "./pages/GuideProfilePage";
import AboutUsPage from "./pages/AboutUsPage";

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
    <>
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

          {/* Navbar pages */}
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/explore/:id" element={<PlaceDetailsPage />} />

          <Route path="/trip-planner" element={<TripPlannerPage />} />

          <Route
            path="/travel-essentials"
            element={
              <SimplePage
                title="Travel Essentials"
                message="This page will include travel tips, emergency contacts, transport guidance, and tourist support information."
              />
            }
          />

          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/tourist-guides" element={<TouristGuidePage />} />
          <Route path="/tourist-guides/:slug" element={<GuideProfilePage />} />
          <Route path="/about" element={<AboutUsPage />} />

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

          <Route
            path="/partner/event-registration"
            element={<PartnerEventRegistrationPage />}
          />

          <Route
            path="/partner/events"
            element={<PartnerEventRegistrationPage />}
          />

          <Route
            path="/partner/events/new"
            element={<PartnerEventRegistrationPage />}
          />

          <Route
            path="/partner/guides"
            element={<PartnerGuideRegistrationPage />}
          />

          <Route
            path="/partner/guides/new"
            element={<PartnerGuideRegistrationPage />}
          />

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

      <AIAssistant />
    </>
  );
}

export default App;
