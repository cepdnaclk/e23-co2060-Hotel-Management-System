import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

function TouristLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

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

    setError("");

    try {
      setLoading(true);

      const response = await api.post("/auth/tourist/login", form);

      login(response.data.user, response.data.token);

      navigate("/hotels");
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div className="card" style={styles.wrapper}>
        <div style={styles.imageSide}>
          <div style={styles.imageOverlay}>
            <h2>Welcome Back</h2>
            <p>
              Login to continue your hotel search, room booking, and travel
              planning.
            </p>
          </div>
        </div>

        <div style={styles.formSide}>
          <h1 style={styles.title}>Tourist Login</h1>
          <p style={styles.subtitle}>Login to your tourist account.</p>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div>
              <label style={styles.label}>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label style={styles.label}>Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={styles.fullBtn}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div style={styles.demoBox}>
            <strong>Demo Tourist Login</strong>
            <p>Email: tourist@demo.lk</p>
            <p>Password: Admin@123</p>
          </div>

          <p style={styles.bottomText}>
            Don&apos;t have an account?{" "}
            <Link to="/register" style={styles.link}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 76px)",
    padding: "60px 20px",
    background:
      "linear-gradient(135deg, rgba(11,99,206,0.08), rgba(22,163,74,0.08))",
  },
  wrapper: {
    maxWidth: "980px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "0.9fr 1.1fr",
    overflow: "hidden",
  },
  imageSide: {
    minHeight: "520px",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1000&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
  },
  imageOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.1))",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "32px",
  },
  formSide: {
    padding: "42px",
    background: "white",
  },
  title: {
    margin: 0,
    fontSize: "38px",
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: "24px",
  },
  form: {
    display: "grid",
    gap: "18px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "800",
  },
  input: {
    width: "100%",
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    fontSize: "14px",
  },
  fullBtn: {
    width: "100%",
    marginTop: "6px",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "16px",
    fontWeight: "800",
  },
  bottomText: {
    textAlign: "center",
    marginTop: "18px",
    color: "#6b7280",
  },
  link: {
    color: "#0b63ce",
    fontWeight: "800",
  },
  demoBox: {
    background: "#f5f8fc",
    padding: "14px",
    borderRadius: "14px",
    marginTop: "18px",
    color: "#374151",
    fontSize: "14px",
  },
};

export default TouristLoginPage;