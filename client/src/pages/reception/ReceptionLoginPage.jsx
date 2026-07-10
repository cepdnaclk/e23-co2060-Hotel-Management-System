import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../../api/api";

function ReceptionLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    property_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.property_password) {
      setError("Enter partner email and property management password.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post("/reception/login", {
        email: form.email.trim(),
        property_password: form.property_password,
      });

      localStorage.setItem("tourismhub_reception_token", response.data.token);
      localStorage.setItem("tourismhub_reception_user", JSON.stringify(response.data.user));
      localStorage.setItem("tourismhub_reception_property", JSON.stringify(response.data.data));
      navigate("/reception");
    } catch (err) {
      setError(err.response?.data?.message || "Reception login failed. Please check credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="reception-login-page">
      <style>{styles}</style>
      <section className="reception-login-shell">
        <div className="reception-login-brand">
          <span>TourismHub LK</span>
          <h1>Hotel Reception Desk</h1>
          <p>
            A focused console for walk-in guests. Sign in with the partner email
            and the property management password created for the hotel.
          </p>
          <div className="reception-login-points">
            <strong>Room type view</strong>
            <strong>Live availability</strong>
            <strong>Walk-in desk mode</strong>
          </div>
        </div>

        <form className="reception-login-card" onSubmit={handleSubmit}>
          <Link to="/" className="reception-back-link">Back to main site</Link>
          <span className="reception-card-kicker">Reception access</span>
          <h2>Sign in to your hotel desk</h2>

          {error ? <div className="reception-error">{error}</div> : null}

          <label>
            Partner email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="partner@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            Property management password
            <div className="reception-password-row">
              <input
                name="property_password"
                type={showPassword ? "text" : "password"}
                value={form.property_password}
                onChange={handleChange}
                placeholder="Enter hotel property password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button className="reception-submit" type="submit" disabled={submitting}>
            {submitting ? "Checking access..." : "Open reception desk"}
          </button>

          <p className="reception-help">
            If a partner owns multiple hotels, this opens the property whose
            management password matches the password entered.
          </p>
        </form>
      </section>
    </main>
  );
}

const styles = `
.reception-login-page{min-height:100vh;background:linear-gradient(135deg,#062f2d 0%,#087969 54%,#f6f1df 54%,#ffffff 100%);font-family:Inter,system-ui,Arial,sans-serif;color:#102033;display:grid;place-items:center;padding:34px}
.reception-login-shell{width:min(1120px,100%);display:grid;grid-template-columns:1fr 480px;gap:34px;align-items:center}
.reception-login-brand{color:#fff;padding:28px}
.reception-login-brand span{display:inline-flex;border:1px solid rgba(255,255,255,.34);border-radius:999px;padding:10px 16px;font-weight:1000;letter-spacing:.12em;text-transform:uppercase;font-size:12px;color:#fff4bd}
.reception-login-brand h1{font-size:clamp(52px,6vw,86px);line-height:.94;letter-spacing:-.06em;margin:26px 0 18px}
.reception-login-brand p{max-width:650px;color:#ecfffb;font-size:20px;line-height:1.7;font-weight:750}
.reception-login-points{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
.reception-login-points strong{border:1px solid rgba(255,255,255,.26);background:rgba(255,255,255,.12);border-radius:999px;padding:12px 16px;color:#fff;font-size:13px}
.reception-login-card{background:rgba(255,255,255,.96);border:1px solid #d9e8e3;border-radius:30px;padding:30px;box-shadow:0 34px 90px rgba(3,50,46,.22);display:grid;gap:18px}
.reception-back-link{color:#087969;text-decoration:none;font-weight:950}
.reception-card-kicker{width:max-content;background:#e8fff7;color:#087060;border:1px solid #a8ead8;border-radius:999px;padding:8px 13px;font-size:12px;font-weight:1000;text-transform:uppercase;letter-spacing:.12em}
.reception-login-card h2{font-size:34px;line-height:1.05;margin:0;color:#082f2b;letter-spacing:-.04em}
.reception-login-card label{display:grid;gap:8px;font-weight:950;color:#233044}
.reception-login-card input{width:100%;box-sizing:border-box;border:1px solid #cddbd8;border-radius:16px;padding:15px 16px;font-size:15px;font-weight:750;outline:none;background:#fff}
.reception-login-card input:focus{border-color:#078272;box-shadow:0 0 0 4px rgba(7,130,114,.11)}
.reception-password-row{display:grid;grid-template-columns:1fr auto;gap:10px}
.reception-password-row button{display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:14px;background:#e7f6f2;color:#07584e;font-weight:950;padding:0 16px;cursor:pointer}
.reception-submit{border:none;border-radius:17px;background:#087969;color:#fff;padding:16px 18px;font-size:16px;font-weight:1000;cursor:pointer;box-shadow:0 16px 34px rgba(8,121,105,.22)}
.reception-submit:disabled{opacity:.65;cursor:not-allowed}
.reception-error{background:#fee2e2;color:#991b1b;border-radius:15px;padding:13px 14px;font-weight:850}
.reception-help{margin:0;color:#667085;line-height:1.55;font-weight:720}
@media(max-width:900px){.reception-login-page{padding:18px}.reception-login-shell{grid-template-columns:1fr}.reception-login-brand{padding:10px}.reception-login-card{padding:22px}.reception-login-brand h1{font-size:48px}}
`;

export default ReceptionLoginPage;
