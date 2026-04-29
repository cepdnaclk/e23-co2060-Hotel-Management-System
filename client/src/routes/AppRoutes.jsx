import { Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import PartnerLayout from "../layouts/PartnerLayout";
import AdminLayout from "../layouts/AdminLayout";

import HomePage from "../pages/public/HomePage";
import ExploreSriLankaPage from "../pages/public/ExploreSriLankaPage";
import TripPlannerPage from "../pages/public/TripPlannerPage";
import AccommodationPage from "../pages/public/AccommodationPage";
import SearchResultsPage from "../pages/public/SearchResultsPage";
import HotelDetailsPage from "../pages/public/HotelDetailsPage";
import RoomsAvailabilityPage from "../pages/public/RoomsAvailabilityPage";
import BookingDetailsPage from "../pages/public/BookingDetailsPage";
import PaymentChoicePage from "../pages/public/PaymentChoicePage";
import BookingConfirmationPage from "../pages/public/BookingConfirmationPage";
import MyBookingsPage from "../pages/public/MyBookingsPage";
import LoginPage from "../pages/public/LoginPage";
import RegisterPage from "../pages/public/RegisterPage";
import EventsPage from "../pages/public/EventsPage";
import TransportPage from "../pages/public/TransportPage";

import PartnerLandingPage from "../pages/partner/PartnerLandingPage";
import PartnerRegisterPage from "../pages/partner/PartnerRegisterPage";
import PartnerDashboardPage from "../pages/partner/PartnerDashboardPage";
import PartnerBookingsPage from "../pages/partner/PartnerBookingsPage";
import RoomsPricingPage from "../pages/partner/RoomsPricingPage";
import HotelContentPage from "../pages/partner/HotelContentPage";
import DiningManagementPage from "../pages/partner/DiningManagementPage";
import HotelEventsPage from "../pages/partner/HotelEventsPage";

import AdminLoginPage from "../pages/admin/AdminLoginPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import HotelApprovalPage from "../pages/admin/HotelApprovalPage";
import ManageListingsPage from "../pages/admin/ManageListingsPage";
import ComplaintsPage from "../pages/admin/ComplaintsPage";

function AppRoutes() {
  return (
    <Routes>
      {/* Public tourist website */}
      <Route element={<PublicLayout />}>
        {/* Main tourism platform pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExploreSriLankaPage />} />
        <Route path="/trip-planner" element={<TripPlannerPage />} />

        {/* Accommodation / hotel booking module */}
        <Route path="/accommodation" element={<AccommodationPage />} />
        <Route path="/hotels" element={<SearchResultsPage />} />
        <Route path="/hotels/:hotelId" element={<HotelDetailsPage />} />
        <Route
          path="/hotels/:hotelId/rooms"
          element={<RoomsAvailabilityPage />}
        />

        {/* Tourist auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Tourist booking flow */}
        <Route path="/booking/details" element={<BookingDetailsPage />} />
        <Route path="/booking/payment" element={<PaymentChoicePage />} />
        <Route
          path="/booking/confirmation/:bookingRef"
          element={<BookingConfirmationPage />}
        />

        {/* Tourist account */}
        <Route path="/account/bookings" element={<MyBookingsPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />

        {/* Tourism modules */}
        <Route path="/events" element={<EventsPage />} />
        <Route path="/transport" element={<TransportPage />} />

        {/* Partner public pages */}
        <Route path="/partner" element={<PartnerLandingPage />} />
        <Route path="/partner/register" element={<PartnerRegisterPage />} />
      </Route>

      {/* Partner dashboard */}
      <Route element={<PartnerLayout />}>
        <Route path="/partner/dashboard" element={<PartnerDashboardPage />} />
        <Route path="/partner/bookings" element={<PartnerBookingsPage />} />
        <Route path="/partner/rooms" element={<RoomsPricingPage />} />
        <Route path="/partner/content" element={<HotelContentPage />} />
        <Route path="/partner/dining" element={<DiningManagementPage />} />
        <Route path="/partner/events" element={<HotelEventsPage />} />
      </Route>

      {/* Admin login without sidebar */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Admin dashboard */}
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route
          path="/admin/hotels/:hotelId/approval"
          element={<HotelApprovalPage />}
        />
        <Route path="/admin/listings" element={<ManageListingsPage />} />
        <Route path="/admin/complaints" element={<ComplaintsPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;