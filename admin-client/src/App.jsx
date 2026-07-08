import { Navigate, Route, Routes } from "react-router-dom";
import { useAdminAuth } from "./context/AdminAuthContext";

import AdminHomePage from "./pages/AdminHomePage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminRegisterPage from "./pages/AdminRegisterPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import PropertyApprovalsPage from "./pages/PropertyApprovalsPage";
import RegistrationFeesPage from "./pages/RegistrationFeesPage";
import MonthlyFeesPage from "./pages/MonthlyFeesPage";
import PaymentVersionsPage from "./pages/PaymentVersionsPage";
import RevenuePage from "./pages/RevenuePage";
import SystemVulnerabilityPage from "./pages/SystemVulnerabilityPage";
import ExploreManagerPage from "./pages/ExploreManagerPage";
import EventApprovalsPage from "./pages/EventApprovalsPage";
import GuideApprovalsPage from "./pages/GuideApprovalsPage";
import AdminNavbar from "./pages/AdminNavbar";

function ProtectedAdminRoute({ children }) {
  const { isAdminLoggedIn, checkingAuth, admin } = useAdminAuth();

  if (checkingAuth) {
    return (
      <main className="admin-page">
        <div className="loading-card">Checking admin access...</div>
      </main>
    );
  }

  if (!isAdminLoggedIn || admin?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin-shell">
      <AdminNavbar />
      {children}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminHomePage />} />
      <Route path="/login" element={<AdminLoginPage />} />
      <Route path="/register" element={<AdminRegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminDashboardPage />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/property-approvals"
        element={
          <ProtectedAdminRoute>
            <PropertyApprovalsPage />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/registration-fees"
        element={
          <ProtectedAdminRoute>
            <RegistrationFeesPage />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/monthly-fees"
        element={
          <ProtectedAdminRoute>
            <MonthlyFeesPage />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/payment-versions"
        element={
          <ProtectedAdminRoute>
            <PaymentVersionsPage />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/revenue"
        element={
          <ProtectedAdminRoute>
            <RevenuePage />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/system-risk"
        element={
          <ProtectedAdminRoute>
            <SystemVulnerabilityPage />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/explore-manager"
        element={
          <ProtectedAdminRoute>
            <ExploreManagerPage />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/event-approvals"
        element={
          <ProtectedAdminRoute>
            <EventApprovalsPage />
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/guide-approvals"
        element={
          <ProtectedAdminRoute>
            <GuideApprovalsPage />
          </ProtectedAdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
