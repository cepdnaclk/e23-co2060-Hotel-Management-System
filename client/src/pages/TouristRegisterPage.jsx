import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  countries,
  getDefaultCountry,
  getCountryByNationality,
  onlyDigits,
  formatCountryPhone,
  validateCountryPhone,
} from "../utils/countryPhone";
import api from "../api/api";

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

  if (!strength.hasMinLength) {
    return "Password must have at least 8 characters";
  }

  if (!strength.hasCapital) {
    return "Password must include at least one capital letter";
  }

  if (!strength.hasSimple) {
    return "Password must include at least one simple letter";
  }

  if (!strength.hasNumber) {
    return "Password must include at least one number";
  }

  if (!strength.hasSymbol) {
    return "Password must include at least one symbol";
  }

  return "";
};

function TouristRegisterPage() {
  const navigate = useNavigate();

  const defaultCountry = getDefaultCountry();

  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_local: "",
    nationality: defaultCountry.nationality,
    national_id: "",
    password: "",
    confirm_password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordStrength = checkPasswordStrength(form.password);

  const handleCountryChange = (event) => {
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

  const validatePhoneNumber = () => {
    return validateCountryPhone(selectedCountry, form.phone_local).message;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const phoneError = validatePhoneNumber();

    if (phoneError) {
      setError(phoneError);
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

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: finalPhoneNumber,
      nationality: form.nationality,
      national_id: form.national_id,
      password: form.password,
      confirm_password: form.confirm_password,
    };

    try {
      setLoading(true);

      const response = await api.post("/auth/tourist/register", payload);

      setMessage(response.data.message || "Registration successful");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setError(
        error.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div className="card" style={styles.wrapper}>
        <div style={styles.formSide}>
          <h1 style={styles.title}>Create Your Account</h1>

          <p style={styles.subtitle}>
            Register as a tourist and start planning your Sri Lanka journey.
          </p>

          {message && <div style={styles.successBox}>{message}</div>}
          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.twoColumns}>
              <div>
                <label style={styles.label}>Full Name</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your full name"
                  required
                />
              </div>

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
            </div>

            <div style={styles.twoColumns}>
              <div>
                <label style={styles.label}>Nationality</label>
                <select
                  name="nationality"
                  value={form.nationality}
                  onChange={handleCountryChange}
                  style={styles.input}
                  required
                >
                  {countries.map((item) => (
                    <option key={item.nationality} value={item.nationality}>
                      {item.nationality} ({item.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>WhatsApp Number</label>

                <div style={styles.phoneGroup}>
                  <div style={styles.codeBox}>{selectedCountry.code}</div>

                  <input
                    name="phone_local"
                    value={form.phone_local}
                    onChange={handleChange}
                    style={styles.phoneInput}
                    placeholder={selectedCountry.placeholder}
                    maxLength={selectedCountry.maxLength}
                    required
                  />
                </div>

                <p style={styles.phoneHint}>
                  WhatsApp format:{" "}
                  <strong>
                    {formatCountryPhone(
                      selectedCountry,
                      form.phone_local || selectedCountry.placeholder
                    )}
                  </strong>
                </p>
              </div>
            </div>

            <div>
              <label style={styles.label}>National ID / Passport</label>
              <input
                name="national_id"
                value={form.national_id}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter your ID or passport number"
              />
            </div>

            <div style={styles.twoColumns}>
              <div>
                <label style={styles.label}>Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Create password"
                  required
                />

                <div style={styles.passwordRules}>
                  <p
                    style={
                      passwordStrength.hasMinLength
                        ? styles.ruleOk
                        : styles.ruleBad
                    }
                  >
                    {passwordStrength.hasMinLength ? "✓" : "•"} At least 8
                    characters
                  </p>

                  <p
                    style={
                      passwordStrength.hasCapital
                        ? styles.ruleOk
                        : styles.ruleBad
                    }
                  >
                    {passwordStrength.hasCapital ? "✓" : "•"} Capital letter
                  </p>

                  <p
                    style={
                      passwordStrength.hasSimple
                        ? styles.ruleOk
                        : styles.ruleBad
                    }
                  >
                    {passwordStrength.hasSimple ? "✓" : "•"} Simple letter
                  </p>

                  <p
                    style={
                      passwordStrength.hasNumber
                        ? styles.ruleOk
                        : styles.ruleBad
                    }
                  >
                    {passwordStrength.hasNumber ? "✓" : "•"} Number
                  </p>

                  <p
                    style={
                      passwordStrength.hasSymbol
                        ? styles.ruleOk
                        : styles.ruleBad
                    }
                  >
                    {passwordStrength.hasSymbol ? "✓" : "•"} Symbol
                  </p>
                </div>
              </div>

              <div>
                <label style={styles.label}>Confirm Password</label>
                <input
                  name="confirm_password"
                  type="password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    background: passwordStrength.isStrong ? "white" : "#f3f4f6",
                    cursor: passwordStrength.isStrong ? "text" : "not-allowed",
                  }}
                  placeholder={
                    passwordStrength.isStrong
                      ? "Re-enter the same password"
                      : "Enter strong password first"
                  }
                  disabled={!passwordStrength.isStrong}
                  required
                />

                {!passwordStrength.isStrong && (
                  <p style={styles.confirmHint}>
                    Confirm password unlocks after password becomes strong.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={styles.fullBtn}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p style={styles.bottomText}>
            Already have an account?{" "}
            <Link to="/login" style={styles.link}>
              Login
            </Link>
          </p>
        </div>

        <div style={styles.imageSide}>
          <div style={styles.imageOverlay}>
            <h2>Explore. Plan. Book.</h2>
            <p>
              TourismHub LK helps tourists discover approved hotels and travel
              experiences around Sri Lanka.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 76px)",
    padding: "50px 20px",
    background:
      "linear-gradient(135deg, rgba(11,99,206,0.08), rgba(22,163,74,0.08))",
  },

  wrapper: {
    maxWidth: "1120px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    overflow: "hidden",
    borderRadius: "26px",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.12)",
    border: "1px solid #e5e7eb",
  },

  formSide: {
    padding: "38px",
    background: "white",
  },

  title: {
    margin: 0,
    fontSize: "36px",
    color: "#061b36",
  },

  subtitle: {
    color: "#6b7280",
    marginBottom: "22px",
    fontWeight: "600",
  },

  form: {
    display: "grid",
    gap: "16px",
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "800",
    color: "#1f2937",
  },

  input: {
    width: "100%",
    padding: "13px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    fontSize: "14px",
    background: "white",
    outline: "none",
  },

  phoneGroup: {
    display: "grid",
    gridTemplateColumns: "82px 1fr",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    overflow: "hidden",
    background: "white",
  },

  codeBox: {
    background: "#f5f8fc",
    borderRight: "1px solid #d1d5db",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    color: "#0b63ce",
  },

  phoneInput: {
    width: "100%",
    padding: "13px",
    border: "none",
    outline: "none",
    fontSize: "14px",
  },

  phoneHint: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "7px 0 0",
  },

  passwordRules: {
    marginTop: "8px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px 10px",
    fontSize: "12px",
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

  confirmHint: {
    fontSize: "12px",
    color: "#991b1b",
    margin: "8px 0 0",
    fontWeight: "700",
  },

  fullBtn: {
    width: "100%",
    marginTop: "8px",
    border: "none",
    borderRadius: "14px",
    padding: "14px 18px",
    background: "#0b63ce",
    color: "#ffffff",
    fontWeight: "900",
    cursor: "pointer",
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

  imageSide: {
    minHeight: "560px",
    backgroundImage:
      "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
  },

  imageOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.15))",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "32px",
  },

  successBox: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "16px",
    fontWeight: "800",
  },

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "16px",
    fontWeight: "800",
  },
};

export default TouristRegisterPage;