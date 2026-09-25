import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, CalendarDays, Compass, ShieldCheck } from "lucide-react";
import api from "../../api/api";
import {
  countries,
  getDefaultCountry,
  getCountryByCountryName,
  onlyDigits,
  formatCountryPhone,
  validateCountryPhone,
} from "../../utils/countryPhone";
import PasswordInput from "../../components/PasswordInput";
import "../../styles/partnerAuth.css";

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
    <main className="partner-auth-page partner-register-page">
      <div className="partner-auth-bg-art" aria-hidden="true">
        <Building2 className="partner-auth-bg-icon partner-auth-bg-building" />
        <CalendarDays className="partner-auth-bg-icon partner-auth-bg-calendar" />
        <Compass className="partner-auth-bg-icon partner-auth-bg-compass" />
      </div>

      <section className="partner-register-card">
        <header className="partner-auth-header">
          <span className="partner-auth-kicker">TRIPLANKA · PARTNER REGISTER</span>
          <h1>Register as Partner</h1>
          <p>
            Create a partner account to manage hotels, events and tourist guide
            services.
          </p>
        </header>

        {error ? <div className="partner-auth-alert error">{error}</div> : null}
        {success ? (
          <div className="partner-auth-alert success">{success}</div>
        ) : null}

        <form onSubmit={handleSubmit} className="partner-auth-form">
          <div className="partner-auth-field">
            <label htmlFor="partner-full-name">Partner / Company Name</label>
            <input
              id="partner-full-name"
              className="partner-auth-input"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Sun Lanka Travels"
              required
            />
          </div>

          <div className="partner-auth-field">
            <label htmlFor="partner-email">Email</label>
            <input
              id="partner-email"
              className="partner-auth-input"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="partner@example.com"
              required
            />
          </div>

          <div className="partner-auth-field">
            <label htmlFor="partner-country">Business Country</label>
            <select
              id="partner-country"
              className="partner-auth-input partner-auth-select"
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
          </div>

          <div className="partner-auth-field">
            <label htmlFor="partner-phone">WhatsApp / Phone Number</label>
            <div className="partner-phone-group">
              <div className="partner-phone-code">{selectedCountry.code}</div>
              <input
                id="partner-phone"
                className="partner-auth-input"
                name="phone_local"
                value={form.phone_local}
                onChange={handleChange}
                placeholder={selectedCountry.placeholder}
                maxLength={selectedCountry.maxLength}
                required
              />
            </div>
            <p className="partner-auth-hint">
              Format: <strong>{formatCountryPhone(
                selectedCountry,
                form.phone_local || selectedCountry.placeholder
              )}</strong>
            </p>
          </div>

          <div className="partner-auth-field">
            <label htmlFor="partner-password">Password</label>
            <PasswordInput
              id="partner-password"
              className="partner-auth-input"
              wrapperClassName="partner-password-wrapper"
              buttonClassName="partner-password-toggle"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>

          <div className="partner-password-rules">
            <p className={passwordStrength.hasMinLength ? "valid" : "invalid"}>
              {passwordStrength.hasMinLength ? "✓" : "•"} At least 8 characters
            </p>
            <p className={passwordStrength.hasCapital ? "valid" : "invalid"}>
              {passwordStrength.hasCapital ? "✓" : "•"} Capital letter
            </p>
            <p className={passwordStrength.hasSimple ? "valid" : "invalid"}>
              {passwordStrength.hasSimple ? "✓" : "•"} Simple letter
            </p>
            <p className={passwordStrength.hasNumber ? "valid" : "invalid"}>
              {passwordStrength.hasNumber ? "✓" : "•"} Number
            </p>
            <p className={passwordStrength.hasSymbol ? "valid" : "invalid"}>
              {passwordStrength.hasSymbol ? "✓" : "•"} Symbol
            </p>
          </div>

          <div className="partner-auth-field">
            <label htmlFor="partner-confirm-password">Confirm Password</label>
            <PasswordInput
              id="partner-confirm-password"
              className={`partner-auth-input ${
                passwordStrength.isStrong ? "" : "disabled-input"
              }`}
              wrapperClassName="partner-password-wrapper"
              buttonClassName="partner-password-toggle"
              name="confirm_password"
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
          </div>

          <button
            className="partner-auth-primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating Partner..." : "Register Partner"}
          </button>
        </form>

        <div className="partner-auth-trust-note">
          <ShieldCheck size={16} />
          <span>Your partner profile will follow the TripLanka approval process.</span>
        </div>

        <p className="partner-auth-bottom-text">
          Already have a partner account?{" "}
          <Link to="/partner/login">Partner Login</Link>
        </p>
      </section>
    </main>
  );
}

export default PartnerRegisterPage;
