import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import {
  countries,
  getDefaultCountry,
  getCountryByNationality,
  onlyDigits,
  formatCountryPhone,
  validateCountryPhone,
} from "../utils/countryPhone";

const checkPasswordStrength = (password) => {
  const value = String(password || "");

  const hasMinLength = value.length >= 8;
  const hasCapital = /[A-Z]/.test(value);
  const hasSimple = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  return {
    hasMinLength,
    hasCapital,
    hasSimple,
    hasNumber,
    hasSymbol,
    isStrong: hasMinLength && hasCapital && hasSimple && hasNumber && hasSymbol,
  };
};

const getPasswordError = (password) => {
  const strength = checkPasswordStrength(password);

  if (strength.isStrong) return "";

  return "Password must be at least 8 characters and contain a capital letter, simple letter, number, and symbol.";
};

function AdminRegisterPage() {
  const navigate = useNavigate();
  const defaultCountry = getDefaultCountry();

  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    nationality: defaultCountry.nationality,
    phone_local: "",
    password: "",
    confirm_password: "",
    admin_secret: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordStrength = checkPasswordStrength(form.password);

  const handleNationalityChange = (event) => {
    const selectedNationality = event.target.value;
    const countryData = getCountryByNationality(selectedNationality);

    setSelectedCountry(countryData);

    setForm({
      ...form,
      nationality: countryData.nationality,
      phone_local: "",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "phone_local") {
      setForm({
        ...form,
        phone_local: onlyDigits(value),
      });
      return;
    }

    if (name === "password") {
      const strength = checkPasswordStrength(value);

      setForm({
        ...form,
        password: value,
        confirm_password: strength.isStrong ? form.confirm_password : "",
      });
      return;
    }

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const passwordError = getPasswordError(form.password);

      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (form.password !== form.confirm_password) {
        setError("Password and confirm password do not match");
        return;
      }

      const phoneValidation = validateCountryPhone(
        selectedCountry,
        form.phone_local
      );

      if (!phoneValidation.valid) {
        setError(phoneValidation.message);
        return;
      }

      const finalPhoneNumber = formatCountryPhone(
        selectedCountry,
        form.phone_local
      );

      await api.post("/auth/admin/register", {
        full_name: form.full_name,
        email: form.email,
        nationality: form.nationality,
        phone: finalPhoneNumber,
        password: form.password,
        confirm_password: form.confirm_password,
        admin_secret: form.admin_secret,
      });

      setSuccess("Admin registered successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error("Admin register error:", error);
      setError(error.response?.data?.message || "Admin registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-badge">ADMIN REGISTER</div>

        <h1>Create Admin Account</h1>

        <p>Register a new admin account using the admin secret key.</p>

        {error && <div className="admin-error">{error}</div>}
        {success && <div className="admin-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="System Admin"
            required
          />

          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="admin@tourismhub.lk"
            required
          />

          <label>Nationality</label>
          <select
            name="nationality"
            value={form.nationality}
            onChange={handleNationalityChange}
            required
          >
            {countries.map((item) => (
              <option key={item.nationality} value={item.nationality}>
                {item.nationality} ({item.country})
              </option>
            ))}
          </select>

          <label>WhatsApp / Phone Number</label>
          <div style={styles.phoneGroup}>
            <div style={styles.codeBox}>{selectedCountry.code}</div>

            <input
              name="phone_local"
              value={form.phone_local}
              onChange={handleChange}
              placeholder={selectedCountry.placeholder}
              maxLength={selectedCountry.maxLength}
              required
            />
          </div>

          <p style={styles.phoneHint}>
            Format:{" "}
            <strong>
              {formatCountryPhone(
                selectedCountry,
                form.phone_local || selectedCountry.placeholder
              )}
            </strong>
          </p>

          <label>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />

          <div style={styles.passwordRules}>
            <span
              style={
                passwordStrength.hasMinLength ? styles.ruleOk : styles.ruleBad
              }
            >
              {passwordStrength.hasMinLength ? "✓" : "•"} At least 8 characters
            </span>

            <span
              style={passwordStrength.hasCapital ? styles.ruleOk : styles.ruleBad}
            >
              {passwordStrength.hasCapital ? "✓" : "•"} Capital letter
            </span>

            <span
              style={passwordStrength.hasSimple ? styles.ruleOk : styles.ruleBad}
            >
              {passwordStrength.hasSimple ? "✓" : "•"} Simple letter
            </span>

            <span
              style={passwordStrength.hasNumber ? styles.ruleOk : styles.ruleBad}
            >
              {passwordStrength.hasNumber ? "✓" : "•"} Number
            </span>

            <span
              style={passwordStrength.hasSymbol ? styles.ruleOk : styles.ruleBad}
            >
              {passwordStrength.hasSymbol ? "✓" : "•"} Symbol
            </span>
          </div>

          <label>Confirm Password</label>
          <input
            name="confirm_password"
            type="password"
            value={form.confirm_password}
            onChange={handleChange}
            placeholder={
              passwordStrength.isStrong
                ? "Re-enter password"
                : "Enter strong password first"
            }
            disabled={!passwordStrength.isStrong}
            required
          />

          <label>Admin Secret Key</label>
          <input
            name="admin_secret"
            type="password"
            value={form.admin_secret}
            onChange={handleChange}
            placeholder="Enter admin secret key"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating Admin..." : "Register Admin"}
          </button>
        </form>

        <p className="auth-bottom-text">
          Already have an admin account? <Link to="/login">Login here</Link>
        </p>
      </section>
    </main>
  );
}

const styles = {
  phoneGroup: {
    display: "grid",
    gridTemplateColumns: "86px 1fr",
    gap: "10px",
    alignItems: "center",
  },

  codeBox: {
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    padding: "13px 10px",
    fontWeight: "900",
    textAlign: "center",
    color: "#0f172a",
  },

  phoneHint: {
    margin: "7px 0 12px",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "700",
  },

  passwordRules: {
    display: "grid",
    gap: "6px",
    margin: "8px 0 12px",
    fontSize: "13px",
    fontWeight: "800",
  },

  ruleOk: {
    color: "#15803d",
  },

  ruleBad: {
    color: "#b91c1c",
  },
};

export default AdminRegisterPage;