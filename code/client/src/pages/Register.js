import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "tourist",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setMessage({ type: "", text: "" });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setMessage({
        type: "error",
        text: "Please fill all required fields.",
      });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters.",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({
        type: "error",
        text: "Passwords do not match.",
      });
      return;
    }

    if (!agreeTerms) {
      setMessage({
        type: "error",
        text: "Please agree to the Terms and Conditions.",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Registration failed. Email may already exist.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Account created successfully. Redirecting to login...",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Cannot connect to server. Please check if backend is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <header className="register-header">
        <Link to="/" className="register-brand">
          <div className="register-brand-icon">🌴</div>
          <div>
            <h2>TourismHub LK</h2>
            <span>Smart Hotel & Tourism</span>
          </div>
        </Link>

        <nav className="register-nav">
          <Link to="/">Home</Link>
          <Link to="/partner">List your property</Link>
          <Link to="/login" className="signin-link">
            Sign In
          </Link>
        </nav>
      </header>

      <main className="register-main">
        <section className="register-left">
          <div className="register-left-content">
            <span className="register-badge">Create Your Account</span>

            <h1>Join TourismHub LK and explore Sri Lanka with ease</h1>

            <p>
              Register as a tourist to book hotels and discover experiences, or
              join as a hotel partner to list and manage your property.
            </p>

            <div className="register-benefits">
              <div className="benefit-card">
                <span>🏨</span>
                <div>
                  <h3>Book Hotels Faster</h3>
                  <p>Search, compare, and reserve hotels in Sri Lanka.</p>
                </div>
              </div>

              <div className="benefit-card">
                <span>🤝</span>
                <div>
                  <h3>Partner Management</h3>
                  <p>Manage rooms, prices, bookings, and hotel content.</p>
                </div>
              </div>

              <div className="benefit-card">
                <span>🔐</span>
                <div>
                  <h3>Secure Access</h3>
                  <p>Role-based login for tourists, partners, and admins.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="register-card-section">
          <div className="register-card">
            <div className="register-card-header">
              <div className="register-icon">📝</div>
              <h2>Create Account</h2>
              <p>Fill your details to get started.</p>
            </div>

            {message.text && (
              <div className={`register-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleRegister} className="register-form">
              <div className="role-select-box">
                <button
                  type="button"
                  className={formData.role === "tourist" ? "active" : ""}
                  onClick={() =>
                    setFormData({ ...formData, role: "tourist" })
                  }
                >
                  <span>🌍</span>
                  Tourist
                </button>

                <button
                  type="button"
                  className={formData.role === "partner" ? "active" : ""}
                  onClick={() =>
                    setFormData({ ...formData, role: "partner" })
                  }
                >
                  <span>🏨</span>
                  Hotel Partner
                </button>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <div className="input-box">
                  <span>👤</span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-box">
                  <span>✉️</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-box">
                  <span>📞</span>
                  <input
                    type="text"
                    name="phone"
                    placeholder="+94 77 123 4567"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-box">
                    <span>🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="input-box">
                    <span>🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="register-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  Show password
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  I agree to Terms
                </label>
              </div>

              <button
                type="submit"
                className="register-submit-btn"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="register-help-box">
              <h4>For semester demo</h4>
              <p>
                Create a tourist account for hotel search and a partner account
                for partner dashboard testing.
              </p>
            </div>

            <p className="login-text">
              Already have an account? <Link to="/login">Sign in here</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Register;