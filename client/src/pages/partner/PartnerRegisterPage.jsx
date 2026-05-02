import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import {
  countries,
  getDefaultCountry,
  getCountryByCountryName,
  onlyDigits,
  formatCountryPhone,
  validateCountryPhone,
} from "../../utils/countryPhone";

const checkPasswordStrength = (password) => {
  const hasMinLength = password.length >= 8;
  const hasCapital = /[A-Z]/.test(password);
  const hasSimple = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

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

  if (!strength.hasMinLength) return "Password must have at least 8 characters";
  if (!strength.hasCapital) return "Password must include at least one capital letter";
  if (!strength.hasSimple) return "Password must include at least one simple letter";
  if (!strength.hasNumber) return "Password must include at least one number";
  if (!strength.hasSymbol) return "Password must include at least one symbol";

  return "";
};

function PartnerRegisterPage() {
  const navigate = useNavigate();
  const defaultCountry = getDefaultCountry();

  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    business_country: defaultCountry.country,
    phone_local: "",
    password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordStrength = checkPasswordStrength(form.password);

  const handleCountryChange = (event) => {
    const selectedCountryName = event.target.value;
    const countryData = getCountryByCountryName(selectedCountryName);

    setSelectedCountry(countryData);

    setForm({
      ...form,
      business_country: countryData.country,
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

      const phoneValidation = validateCountryPhone(
        selectedCountry,
        form.phone_local
      );

      if (!phoneValidation.valid) {
        setError(phoneValidation.message);
        return;
      }

      const passwordError = getPasswordError(form.password);

      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (form.password !== form.confirm_password) {
        setError("Confirm password must match the password");
        return;
      }

      const finalPhoneNumber = formatCountryPhone(
        selectedCountry,
        form.phone_local
      );

      await api.post("/auth/partner/register", {
        full_name: form.full_name,
        email: form.email,
        nationality: selectedCountry.nationality,
        phone: finalPhoneNumber,
        password: form.password,
        confirm_password: form.confirm_password,
      });

      setSuccess("Partner registered successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/partner/login");
      }, 1200);
    } catch (error) {
      console.error("Partner register error:", error);
      setError(error.response?.data?.message || "Partner registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.badge}>PARTNER REGISTER</div>

        <h1 style={styles.title}>Register as Partner</h1>

        <p style={styles.subtitle}>
          Create a partner account to register and manage your properties.
        </p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Partner / Company Name</label>
          <input
            style={styles.input}
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Sun Lanka Travels"
            required
          />

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="partner@example.com"
            required
          />

          <label style={styles.label}>Business Country</label>
          <select
            style={styles.input}
            name="business_country"
            value={form.business_country}
            onChange={handleCountryChange}
            required
          >
            {countries.map((item) => (
              <option key={item.country} value={item.country}>
                {item.country} ({item.nationality})
              </option>
            ))}
          </select>

          <label style={styles.label}>WhatsApp / Phone Number</label>
          <div style={styles.phoneGroup}>
            <div style={styles.codeBox}>{selectedCountry.code}</div>

            <input
              style={styles.input}
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

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />

          <div style={styles.passwordRules}>
            <p
              style={
                passwordStrength.hasMinLength ? styles.ruleOk : styles.ruleBad
              }
            >
              {passwordStrength.hasMinLength ? "✓" : "•"} At least 8 characters
            </p>

            <p
              style={
                passwordStrength.hasCapital ? styles.ruleOk : styles.ruleBad
              }
            >
              {passwordStrength.hasCapital ? "✓" : "•"} Capital letter
            </p>

            <p
              style={
                passwordStrength.hasSimple ? styles.ruleOk : styles.ruleBad
              }
            >
              {passwordStrength.hasSimple ? "✓" : "•"} Simple letter
            </p>

            <p
              style={
                passwordStrength.hasNumber ? styles.ruleOk : styles.ruleBad
              }
            >
              {passwordStrength.hasNumber ? "✓" : "•"} Number
            </p>

            <p
              style={
                passwordStrength.hasSymbol ? styles.ruleOk : styles.ruleBad
              }
            >
              {passwordStrength.hasSymbol ? "✓" : "•"} Symbol
            </p>
          </div>

          <label style={styles.label}>Confirm Password</label>
          <input
            style={{
              ...styles.input,
              background: passwordStrength.isStrong ? "white" : "#f3f4f6",
              cursor: passwordStrength.isStrong ? "text" : "not-allowed",
            }}
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

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Creating Partner..." : "Register Partner"}
          </button>
        </form>

        <p style={styles.bottomText}>
          Already have a partner account?{" "}
          <Link to="/partner/login">Login here</Link>
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0fdfa, #f8fafc)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
  },

  card: {
    width: "100%",
    maxWidth: "560px",
    background: "#ffffff",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
    border: "1px solid #e2e8f0",
  },

  badge: {
    display: "inline-block",
    background: "#ccfbf1",
    color: "#0f766e",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "12px",
  },

  title: {
    margin: "0 0 8px",
    fontSize: "32px",
    color: "#0f172a",
  },

  subtitle: {
    margin: "0 0 22px",
    color: "#64748b",
    fontWeight: "600",
  },

  form: {
    display: "grid",
    gap: "10px",
  },

  label: {
    fontSize: "14px",
    fontWeight: "900",
    color: "#334155",
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    outline: "none",
    fontWeight: "700",
  },

  phoneGroup: {
    display: "grid",
    gridTemplateColumns: "86px 1fr",
    gap: "10px",
  },

  codeBox: {
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "13px 10px",
    textAlign: "center",
    fontWeight: "900",
  },

  phoneHint: {
    margin: "0 0 8px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
  },

  passwordRules: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px 10px",
    fontSize: "12px",
    marginTop: "-4px",
    marginBottom: "6px",
  },

  ruleOk: {
    margin: 0,
    color: "#166534",
    fontWeight: "700",
  },

  ruleBad: {
    margin: 0,
    color: "#991b1b",
    fontWeight: "700",
  },

  button: {
    marginTop: "10px",
    background: "#0f766e",
    color: "#ffffff",
    padding: "14px 18px",
    border: "none",
    borderRadius: "14px",
    fontWeight: "900",
    cursor: "pointer",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: "14px",
    fontWeight: "800",
    marginBottom: "14px",
  },

  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px 14px",
    borderRadius: "14px",
    fontWeight: "800",
    marginBottom: "14px",
  },

  bottomText: {
    textAlign: "center",
    color: "#64748b",
    fontWeight: "700",
    marginTop: "18px",
  },
};

export default PartnerRegisterPage;