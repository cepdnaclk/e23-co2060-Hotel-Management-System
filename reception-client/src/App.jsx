import { Navigate, Route, Routes } from "react-router-dom";
import ReceptionLoginPage from "./pages/ReceptionLoginPage";
import ReceptionDashboardPage from "./pages/ReceptionDashboardPage";

const hasReceptionSession = () =>
  Boolean(localStorage.getItem("tourismhub_reception_token"));

function ReceptionEntry() {
  return <Navigate to={hasReceptionSession() ? "/dashboard" : "/login"} replace />;
}

function ProtectedReceptionRoute({ children }) {
  if (!hasReceptionSession()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<ReceptionEntry />} />
      <Route path="/login" element={<ReceptionLoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedReceptionRoute>
            <ReceptionDashboardPage />
          </ProtectedReceptionRoute>
        }
      />
      <Route path="*" element={<ReceptionEntry />} />
    </Routes>
  );
}

export default App;
