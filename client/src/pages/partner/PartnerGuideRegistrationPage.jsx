import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const guideTypes = [
  "Heritage",
  "Food",
  "Nature",
  "Adventure",
  "City",
  "Wellness",
  "Wildlife",
  "Religious",
  "Photography",
];

const languageOptions = ["English", "Sinhala", "Tamil", "Hindi", "French", "German", "Chinese", "Japanese"];
const serviceOptions = [
  "City walking tours",
  "Cultural site guiding",
  "Hotel pickup support",
  "Airport assistance",
  "Food tours",
  "Hiking support",
  "Safari coordination",
  "Photography spots",
  "Family-friendly tours",
  "Shopping assistance",
];
const specialityOptions = [
  "Sri Lankan history",
  "Temple and heritage routes",
  "Tea country experiences",
  "Wildlife and safari safety",
  "Street food and local markets",
  "Beach and coastal trips",
  "Adventure trails",
  "First-time traveller support",
];

const initialForm = {
  full_name: "",
  display_name: "",
  guide_type: "Heritage",
  city: "",
  district: "",
  base_location: "",
  languages: ["English"],
  experience_years: "1",
  license_number: "",
  nic_or_passport: "",
  phone: "",
  email: "",
  whatsapp_number: "",
  price_per_day: "",
  price_per_hour: "",
  availability: "Weekdays and weekends with prior booking",
  services: ["City walking tours"],
  specialities: ["First-time traveller support"],
  short_description: "",
  bio: "",
  image_url: "",
};

const listToText = (items) => (Array.isArray(items) ? items.join("\n") : "");

function PartnerGuideRegistrationPage() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [form, setForm] = useState(initialForm);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isEditing = Boolean(editId);

  const loadGuides = async () => {
    try {
      const response = await api.get("/partner/guides");
      setGuides(response.data.guides || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your guide profiles");
    }
  };

  const loadEditGuide = async () => {
    if (!editId) return;

    try {
      setLoading(true);
      const response = await api.get(`/partner/guides/${editId}`);
      const guide = response.data.guide;
      setForm({
        full_name: guide.full_name || "",
        display_name: guide.display_name || "",
        guide_type: guide.guide_type || "Heritage",
        city: guide.city || "",
        district: guide.district || "",
        base_location: guide.base_location || "",
        languages: guide.languages?.length ? guide.languages : ["English"],
        experience_years: String(guide.experience_years || 0),
        license_number: guide.license_number || "",
        nic_or_passport: guide.nic_or_passport || "",
        phone: guide.phone || "",
        email: guide.email || "",
        whatsapp_number: guide.whatsapp_number || "",
        price_per_day: String(guide.price_per_day || ""),
        price_per_hour: String(guide.price_per_hour || ""),
        availability: guide.availability || "",
        services: guide.services?.length ? guide.services : [],
        specialities: guide.specialities?.length ? guide.specialities : [],
        short_description: guide.short_description || "",
        bio: guide.bio || "",
        image_url: guide.image_url || "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load guide details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.role === "partner") {
      loadGuides();
      loadEditGuide();
    }
  }, [isLoggedIn, user, editId]);

  const stats = useMemo(() => {
    return {
      total: guides.length,
      pending: guides.filter((guide) => guide.status === "pending").length,
      approved: guides.filter((guide) => guide.status === "approved").length,
      rejected: guides.filter((guide) => guide.status === "rejected").length,
    };
  }, [guides]);

  if (!isLoggedIn) return <Navigate to="/partner/login" />;

  if (user?.role !== "partner") {
    return (
      <main className="partner-guide-page">
        <style>{guideFormCss}</style>
        <div className="guide-alert error">This page is only for partners.</div>
      </main>
    );
  }

  const updateField = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const toggleListValue = (name, value) => {
    setForm((previous) => {
      const current = previous[name] || [];
      return {
        ...previous,
        [name]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const uploadImage = async (file) => {
    if (!file) return;

    const data = new FormData();
    data.append("image", file);

    try {
      setUploading(true);
      setError("");
      const response = await api.post("/partner/guides/upload-image", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateField("image_url", response.data.image_url);
      setMessage("Guide profile photo uploaded successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const buildPayload = () => ({
    ...form,
    languages: listToText(form.languages),
    services: listToText(form.services),
    specialities: listToText(form.specialities),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (isEditing) {
        await api.put(`/partner/guides/${editId}`, buildPayload());
        setMessage("Guide profile updated and resubmitted for admin approval.");
      } else {
        await api.post("/partner/guides", buildPayload());
        setMessage("Guide profile submitted successfully. It is pending admin approval.");
        setForm(initialForm);
      }

      await loadGuides();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save guide profile");
    } finally {
      setSaving(false);
    }
  };

  const hideGuide = async (guideId) => {
    const confirmHide = window.confirm("Hide this approved guide from the public Tourist Guides page?");
    if (!confirmHide) return;

    try {
      await api.patch(`/partner/guides/${guideId}/status`, { status: "hidden" });
      setMessage("Guide profile hidden successfully.");
      await loadGuides();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to hide guide profile");
    }
  };

  const deleteGuide = async (guideId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this guide profile?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/partner/guides/${guideId}`);
      setMessage("Guide profile deleted successfully.");
      await loadGuides();
      if (String(editId) === String(guideId)) navigate("/partner/guides");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete guide profile");
    }
  };

  return (
    <main className="partner-guide-page">
      <style>{guideFormCss}</style>

      <section className="guide-form-hero">
        <div>
          <span className="guide-pill">Partner Guide Portal</span>
          <h1>Become a verified tourist guider.</h1>
          <p>
            Add your guide profile, languages, services, pricing, and travel expertise. After admin approval,
            tourists can discover you from the Tourist Guides page.
          </p>
          <div className="guide-hero-actions">
            <Link to="/partner/dashboard">← Back to Dashboard</Link>
            <Link to="/tourist-guides">View Public Guides</Link>
          </div>
        </div>

        <div className="guide-stat-card-wrap">
          <div className="guide-stat-card"><span>Total</span><strong>{stats.total}</strong></div>
          <div className="guide-stat-card"><span>Pending</span><strong>{stats.pending}</strong></div>
          <div className="guide-stat-card"><span>Approved</span><strong>{stats.approved}</strong></div>
          <div className="guide-stat-card"><span>Rejected</span><strong>{stats.rejected}</strong></div>
        </div>
      </section>

      {message && <div className="guide-alert success">{message}</div>}
      {error && <div className="guide-alert error">{error}</div>}

      <section className="guide-main-grid">
        <form className="guide-form-card" onSubmit={handleSubmit}>
          <div className="guide-form-head">
            <div>
              <span>{isEditing ? "Edit Guide" : "New Guide Profile"}</span>
              <h2>{isEditing ? "Update guider details" : "Register as a guider"}</h2>
            </div>
            {isEditing && <Link to="/partner/guides" className="new-guide-link">+ New Guide</Link>}
          </div>

          {loading ? (
            <div className="guide-empty">Loading guide details...</div>
          ) : (
            <>
              <div className="guide-photo-panel">
                <div className="guide-photo-preview">
                  {form.image_url ? <img src={form.image_url} alt="Guide preview" /> : <span>👤</span>}
                </div>
                <div>
                  <h3>Profile Photo</h3>
                  <p>Upload a clear friendly photo. This will appear on the public tourist guide page after approval.</p>
                  <input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} />
                  {uploading && <small>Uploading image...</small>}
                </div>
              </div>

              <div className="form-grid two">
                <label>
                  <span>Legal full name *</span>
                  <input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} />
                </label>
                <label>
                  <span>Display name *</span>
                  <input value={form.display_name} onChange={(e) => updateField("display_name", e.target.value)} placeholder="Example: Kandy Heritage Guide" />
                </label>
                <label>
                  <span>Guide type *</span>
                  <select value={form.guide_type} onChange={(e) => updateField("guide_type", e.target.value)}>
                    {guideTypes.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span>Experience years</span>
                  <input type="number" min="0" value={form.experience_years} onChange={(e) => updateField("experience_years", e.target.value)} />
                </label>
                <label>
                  <span>City *</span>
                  <input value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Example: Kandy" />
                </label>
                <label>
                  <span>District</span>
                  <input value={form.district} onChange={(e) => updateField("district", e.target.value)} />
                </label>
                <label className="full">
                  <span>Base location / meeting point</span>
                  <input value={form.base_location} onChange={(e) => updateField("base_location", e.target.value)} placeholder="Example: Near Kandy railway station" />
                </label>
              </div>

              <div className="check-section">
                <h3>Languages *</h3>
                <div className="check-grid">
                  {languageOptions.map((item) => (
                    <label key={item} className="check-card">
                      <input type="checkbox" checked={form.languages.includes(item)} onChange={() => toggleListValue("languages", item)} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-grid two">
                <label>
                  <span>Contact phone *</span>
                  <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                </label>
                <label>
                  <span>Email *</span>
                  <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                </label>
                <label>
                  <span>WhatsApp number</span>
                  <input value={form.whatsapp_number} onChange={(e) => updateField("whatsapp_number", e.target.value)} />
                </label>
                <label>
                  <span>License number</span>
                  <input value={form.license_number} onChange={(e) => updateField("license_number", e.target.value)} />
                </label>
                <label>
                  <span>NIC / Passport</span>
                  <input value={form.nic_or_passport} onChange={(e) => updateField("nic_or_passport", e.target.value)} />
                </label>
                <label>
                  <span>Availability</span>
                  <input value={form.availability} onChange={(e) => updateField("availability", e.target.value)} />
                </label>
                <label>
                  <span>Price per day LKR</span>
                  <input type="number" min="0" value={form.price_per_day} onChange={(e) => updateField("price_per_day", e.target.value)} />
                </label>
                <label>
                  <span>Price per hour LKR</span>
                  <input type="number" min="0" value={form.price_per_hour} onChange={(e) => updateField("price_per_hour", e.target.value)} />
                </label>
              </div>

              <div className="check-section">
                <h3>Services offered</h3>
                <div className="check-grid">
                  {serviceOptions.map((item) => (
                    <label key={item} className="check-card">
                      <input type="checkbox" checked={form.services.includes(item)} onChange={() => toggleListValue("services", item)} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="check-section">
                <h3>Specialities</h3>
                <div className="check-grid">
                  {specialityOptions.map((item) => (
                    <label key={item} className="check-card">
                      <input type="checkbox" checked={form.specialities.includes(item)} onChange={() => toggleListValue("specialities", item)} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <label>
                  <span>Short description *</span>
                  <input value={form.short_description} onChange={(e) => updateField("short_description", e.target.value)} maxLength="255" placeholder="A short public summary for tourists" />
                </label>
                <label>
                  <span>Full guide bio *</span>
                  <textarea value={form.bio} onChange={(e) => updateField("bio", e.target.value)} rows="6" placeholder="Explain your experience, tour style, safety support, and why tourists should choose you." />
                </label>
              </div>

              <button className="submit-guide-btn" type="submit" disabled={saving || uploading}>
                {saving ? "Saving..." : isEditing ? "Update and Submit for Approval" : "Submit Guide Profile"}
              </button>
            </>
          )}
        </form>

        <aside className="my-guides-panel">
          <div className="my-guides-head">
            <span>My Guide Profiles</span>
            <h2>Approval status</h2>
          </div>

          {!guides.length ? (
            <div className="guide-empty">
              <h3>No guide profiles yet</h3>
              <p>Fill the form and submit your first guide profile.</p>
            </div>
          ) : (
            <div className="my-guides-list">
              {guides.map((guide) => (
                <article key={guide.id} className="my-guide-card">
                  <div className="mini-guide-img">
                    {guide.image_url ? <img src={guide.image_url} alt={guide.display_name} /> : <span>🧭</span>}
                  </div>
                  <div>
                    <div className="mini-guide-top">
                      <h3>{guide.display_name}</h3>
                      <span className={`guide-status ${guide.status}`}>{guide.status}</span>
                    </div>
                    <p>{guide.city} • {guide.guide_type}</p>
                    <small>{guide.short_description}</small>
                    {guide.rejection_reason && <em>Reason: {guide.rejection_reason}</em>}
                    <div className="mini-guide-actions">
                      <Link to={`/partner/guides?edit=${guide.id}`}>Edit</Link>
                      {guide.status === "approved" && <button type="button" onClick={() => hideGuide(guide.id)}>Hide</button>}
                      <button type="button" className="delete-mini" onClick={() => deleteGuide(guide.id)}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

const guideFormCss = `
.partner-guide-page{min-height:100vh;background:linear-gradient(135deg,#eff6ff 0%,#ffffff 44%,#ecfdf5 100%);padding:34px 20px 70px;color:#0f172a;font-family:Inter,system-ui,Arial,sans-serif}.guide-form-hero{width:min(1180px,100%);margin:0 auto 22px;background:linear-gradient(135deg,#083344 0%,#0b63ce 50%,#0f7a43 100%);border-radius:32px;padding:38px;color:#fff;box-shadow:0 28px 70px rgba(8,51,68,.24);display:grid;grid-template-columns:1fr 380px;gap:28px;align-items:end;overflow:hidden;position:relative}.guide-form-hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 12% 15%,rgba(255,255,255,.22),transparent 28%),radial-gradient(circle at 90% 5%,rgba(255,255,255,.18),transparent 24%)}.guide-form-hero>*{position:relative;z-index:1}.guide-pill{display:inline-flex;padding:8px 13px;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.24);font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.guide-form-hero h1{margin:16px 0 12px;font-size:clamp(38px,5vw,64px);line-height:.98;letter-spacing:-.055em}.guide-form-hero p{max-width:720px;color:rgba(255,255,255,.88);font-weight:650;line-height:1.7;font-size:17px}.guide-hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}.guide-hero-actions a{color:#083344;background:#fff;text-decoration:none;border-radius:14px;padding:12px 15px;font-weight:950}.guide-hero-actions a+ a{background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.35)}.guide-stat-card-wrap{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.guide-stat-card{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.23);border-radius:22px;padding:18px}.guide-stat-card span{display:block;color:rgba(255,255,255,.75);font-weight:850}.guide-stat-card strong{font-size:34px}.guide-alert{width:min(1180px,100%);margin:0 auto 18px;padding:14px 16px;border-radius:16px;font-weight:900}.guide-alert.success{background:#dcfce7;color:#166534}.guide-alert.error{background:#fee2e2;color:#991b1b}.guide-main-grid{width:min(1180px,100%);margin:0 auto;display:grid;grid-template-columns:1fr 360px;gap:22px;align-items:start}.guide-form-card,.my-guides-panel{background:#fff;border:1px solid #dbeafe;border-radius:28px;box-shadow:0 22px 60px rgba(15,23,42,.08)}.guide-form-card{padding:26px}.guide-form-head,.my-guides-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:22px}.guide-form-head span,.my-guides-head span{color:#0b63ce;font-weight:950;text-transform:uppercase;letter-spacing:.08em;font-size:12px}.guide-form-head h2,.my-guides-head h2{margin:6px 0 0;font-size:30px;letter-spacing:-.04em}.new-guide-link{color:#0b63ce;text-decoration:none;font-weight:950}.guide-photo-panel{display:grid;grid-template-columns:150px 1fr;gap:18px;align-items:center;background:#f8fafc;border:1px dashed #93c5fd;border-radius:24px;padding:18px;margin-bottom:22px}.guide-photo-preview{width:150px;height:150px;border-radius:26px;overflow:hidden;background:#dbeafe;display:grid;place-items:center;font-size:48px}.guide-photo-preview img{width:100%;height:100%;object-fit:cover}.guide-photo-panel h3{margin:0 0 6px}.guide-photo-panel p{margin:0 0 12px;color:#64748b;line-height:1.55;font-weight:650}.guide-photo-panel input{width:100%}.form-grid{display:grid;gap:16px;margin-bottom:18px}.form-grid.two{grid-template-columns:repeat(2,1fr)}.form-grid .full{grid-column:1/-1}.form-grid label{display:grid;gap:7px}.form-grid span{font-size:12px;color:#334155;font-weight:950;text-transform:uppercase;letter-spacing:.06em}.form-grid input,.form-grid select,.form-grid textarea{width:100%;border:1px solid #cbd5e1;border-radius:15px;padding:13px 14px;font-size:15px;outline:none;background:#fff}.form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus{border-color:#0b63ce;box-shadow:0 0 0 4px rgba(11,99,206,.12)}.check-section{border:1px solid #e2e8f0;border-radius:22px;padding:18px;margin-bottom:18px;background:#fbfdff}.check-section h3{margin:0 0 12px;font-size:18px}.check-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}.check-card{display:flex;align-items:center;gap:9px;border:1px solid #dbeafe;background:#fff;border-radius:14px;padding:10px 12px;font-weight:800;color:#334155}.check-card input{accent-color:#0b63ce}.submit-guide-btn{width:100%;border:none;border-radius:18px;background:linear-gradient(135deg,#0b63ce,#0f7a43);color:#fff;padding:16px;font-size:16px;font-weight:1000;cursor:pointer;box-shadow:0 14px 32px rgba(11,99,206,.18)}.submit-guide-btn:disabled{opacity:.65;cursor:not-allowed}.my-guides-panel{padding:22px;position:sticky;top:90px}.guide-empty{padding:24px;border-radius:20px;background:#f8fafc;color:#64748b;text-align:center}.my-guides-list{display:grid;gap:14px}.my-guide-card{display:grid;grid-template-columns:74px 1fr;gap:12px;padding:13px;border:1px solid #e2e8f0;border-radius:20px}.mini-guide-img{width:74px;height:74px;border-radius:18px;background:#eff6ff;display:grid;place-items:center;overflow:hidden;font-size:30px}.mini-guide-img img{width:100%;height:100%;object-fit:cover}.mini-guide-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.mini-guide-top h3{font-size:16px;margin:0}.my-guide-card p{margin:4px 0;color:#64748b;font-weight:800;font-size:13px}.my-guide-card small{display:block;color:#475569;line-height:1.5}.my-guide-card em{display:block;margin-top:8px;color:#991b1b;font-size:12px;font-weight:800}.guide-status{border-radius:999px;padding:6px 8px;font-size:11px;font-weight:950;text-transform:capitalize}.guide-status.approved{background:#dcfce7;color:#166534}.guide-status.pending{background:#fef3c7;color:#92400e}.guide-status.rejected,.guide-status.hidden{background:#fee2e2;color:#991b1b}.mini-guide-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.mini-guide-actions a,.mini-guide-actions button{border:none;text-decoration:none;border-radius:11px;background:#0b63ce;color:#fff;padding:8px 10px;font-weight:950;font-size:12px;cursor:pointer}.mini-guide-actions button{background:#111827}.mini-guide-actions .delete-mini{background:#fee2e2;color:#991b1b}@media(max-width:980px){.guide-form-hero,.guide-main-grid{grid-template-columns:1fr}.my-guides-panel{position:static}.guide-stat-card-wrap{grid-template-columns:repeat(4,1fr)}}@media(max-width:680px){.partner-guide-page{padding:22px 12px 60px}.guide-form-hero{padding:28px 22px}.guide-stat-card-wrap,.form-grid.two{grid-template-columns:1fr}.guide-photo-panel{grid-template-columns:1fr}.guide-photo-preview{width:100%;height:230px}.guide-form-card{padding:18px}}
`;

export default PartnerGuideRegistrationPage;
