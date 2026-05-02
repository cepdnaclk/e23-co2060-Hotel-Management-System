import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAdminAuth } from "../context/AdminAuthContext";

function AdminLoginPage() {
  const navigate = useNavigate();
  const { loginAdmin } = useAdminAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/auth/admin/login", {
        email: form.email,
        password: form.password,
      });

      const user = response.data.user;
      const token = response.data.token;

      if (user?.role !== "admin") {
        setError("This account is not an admin account.");
        return;
      }

      loginAdmin(user, token);
      navigate("/dashboard");
    } catch (error) {
      console.error("Admin login error:", error);
      setError(error.response?.data?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-badge">ADMIN PANEL</div>

        <h1>TourismHub LK Admin</h1>

        <p>
          Login separately to review property registrations and manage
          approvals.
        </p>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Admin Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="admin@tourismhub.lk"
            required
          />

          <label>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>

        <p className="auth-bottom-text">
          Need to create an admin? <Link to="/register">Register admin</Link>
        </p>
      </section>
    </main>
  );
}

export default AdminLoginPage;