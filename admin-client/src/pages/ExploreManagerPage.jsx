import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

const emptyPlace = {
  id: null,
  name: "",
  city: "",
  district: "",
  region: "Cultural Triangle",
  category_id: "",
  image_url: "",
  short_description: "",
  full_description: "",
  duration: "",
  best_time: "",
  best_months: [],
  budget: "Medium",
  budget_score: 2,
  estimated_cost: 0,
  lat: "",
  lng: "",
  featured: false,
  vibe: "",
  tags: [],
  experiences: [],
  highlights: [],
  nearby_places: [],
  tips: [],
  opening_hours: "",
  entry_fee: "",
  facilities: [],
  status: "published",
  sort_order: 0,
};

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const regionOptions = ["Cultural Triangle", "Hill Country", "South Coast", "West Coast", "East Coast", "Northern Region"];
const budgetOptions = ["Low", "Medium", "High"];
const serverBaseUrl = api.defaults.baseURL.replace(/\/api\/?$/, "");
const assetUrl = (url) => {
  if (!url) return "";
  if (String(url).startsWith("http")) return url;
  return `${serverBaseUrl}${url}`;
};

const toLines = (value) => {
  if (!value) return "";
  if (Array.isArray(value)) {
    if (value.length && typeof value[0] === "object") {
      return JSON.stringify(value, null, 2);
    }
    return value.join("\n");
  }
  return String(value);
};

const fromLines = (value) => {
  const text = String(value || "").trim();
  if (!text) return [];

  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  }

  return text.split("\n").map((line) => line.trim()).filter(Boolean);
};

const placeForForm = (place, categories) => ({
  ...emptyPlace,
  ...place,
  category_id: place.categoryId || place.category_id || categories.find((c) => c.slug === place.category)?.id || "",
  image_url: place.image || place.image_url || "",
  short_description: place.shortDescription || place.short_description || "",
  full_description: place.fullDescription || place.full_description || "",
  best_time: place.bestTime || place.best_time || "",
  best_months: place.bestMonths || place.best_months || [],
  budget_score: place.budgetScore || place.budget_score || 2,
  estimated_cost: place.estimatedCost || place.estimated_cost || 0,
  nearby_places: place.nearbyPlaces || place.nearby_places || [],
  opening_hours: place.openingHours || place.opening_hours || "",
  entry_fee: place.entryFee || place.entry_fee || "",
});

function Field({ label, children }) {
  return (
    <label className="explore-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function ExploreManagerPage() {
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyPlace);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [activePanel, setActivePanel] = useState("places");
  const [newCategory, setNewCategory] = useState({ label: "", slug: "", icon: "📍", sort_order: 0 });

  const loadData = async () => {
    try {
      setLoading(true);
      const [placeRes, categoryRes] = await Promise.all([
        api.get("/admin/explore/places", { params: { status: "all" } }),
        api.get("/admin/explore/categories"),
      ]);
      setPlaces(placeRes.data.places || []);
      setCategories(categoryRes.data.categories || []);
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to load Explore manager data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPlaces = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return places;
    return places.filter((place) =>
      [place.name, place.city, place.district, place.region, place.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [places, search]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const editPlace = (place) => {
    setForm(placeForForm(place, categories));
    setFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setForm(emptyPlace);
    setFiles([]);
  };

  const toggleMonth = (monthIndex) => {
    const selected = new Set(form.best_months || []);
    if (selected.has(monthIndex)) selected.delete(monthIndex);
    else selected.add(monthIndex);
    update("best_months", Array.from(selected).sort((a, b) => a - b));
  };

  const buildFormData = () => {
    const fd = new FormData();
    const jsonFields = ["best_months", "tags", "experiences", "highlights", "nearby_places", "tips", "facilities"];

    Object.entries(form).forEach(([key, value]) => {
      if (key === "id" || key === "images") return;
      if (jsonFields.includes(key)) {
        fd.append(key, JSON.stringify(value || []));
      } else {
        fd.append(key, value ?? "");
      }
    });

    files.forEach((file) => fd.append("photos", file));
    return fd;
  };

  const savePlace = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");

    try {
      const fd = buildFormData();

      if (form.id) {
        await api.put(`/admin/explore/places/${form.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setNotice("Place updated successfully ✅");
      } else {
        await api.post("/admin/explore/places", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setNotice("New place added successfully ✅");
      }

      resetForm();
      await loadData();
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to save place");
    } finally {
      setSaving(false);
    }
  };

  const deletePlace = async (id) => {
    if (!window.confirm("Delete this place? This cannot be undone.")) return;

    try {
      await api.delete(`/admin/explore/places/${id}`);
      setNotice("Place deleted successfully");
      await loadData();
      if (form.id === id) resetForm();
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to delete place");
    }
  };

  const createCategory = async (event) => {
    event.preventDefault();
    try {
      await api.post("/admin/explore/categories", newCategory);
      setNewCategory({ label: "", slug: "", icon: "📍", sort_order: 0 });
      setNotice("Category added successfully ✅");
      await loadData();
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to add category");
    }
  };

  return (
    <main className="admin-page explore-admin-page">
      <style>{css}</style>

      <section className="explore-admin-hero">
        <div>
          <p>EXPLORE CONTENT</p>
          <h1>Places Manager</h1>
          <span>Add places, update details, set best months and upload photos without touching code.</span>
        </div>
        <div className="hero-stat"><strong>{places.length}</strong><small>Total Places</small></div>
        <div className="hero-stat"><strong>{places.filter((p) => p.status === "published").length}</strong><small>Published</small></div>
        <div className="hero-stat"><strong>{places.filter((p) => p.featured).length}</strong><small>Featured</small></div>
      </section>

      {notice ? <div className="admin-notice">{notice}</div> : null}

      <div className="explore-admin-tabs">
        <button type="button" className={activePanel === "places" ? "on" : ""} onClick={() => setActivePanel("places")}>Places</button>
        <button type="button" className={activePanel === "categories" ? "on" : ""} onClick={() => setActivePanel("categories")}>Categories</button>
      </div>

      {activePanel === "categories" ? (
        <section className="manager-grid single">
          <div className="manager-card">
            <h2>Add Category</h2>
            <form className="mini-form" onSubmit={createCategory}>
              <Field label="Category name"><input value={newCategory.label} onChange={(e) => setNewCategory((c) => ({ ...c, label: e.target.value }))} placeholder="Example: Wellness" /></Field>
              <Field label="Slug"><input value={newCategory.slug} onChange={(e) => setNewCategory((c) => ({ ...c, slug: e.target.value }))} placeholder="wellness" /></Field>
              <Field label="Icon"><input value={newCategory.icon} onChange={(e) => setNewCategory((c) => ({ ...c, icon: e.target.value }))} /></Field>
              <Field label="Sort order"><input type="number" value={newCategory.sort_order} onChange={(e) => setNewCategory((c) => ({ ...c, sort_order: e.target.value }))} /></Field>
              <button type="submit">Add Category</button>
            </form>
          </div>

          <div className="manager-card">
            <h2>Current Categories</h2>
            <div className="cat-list">
              {categories.map((cat) => <span key={cat.id}>{cat.icon} {cat.label} <small>{cat.slug}</small></span>)}
            </div>
          </div>
        </section>
      ) : (
        <section className="manager-grid">
          <form className="manager-card place-form" onSubmit={savePlace}>
            <div className="form-title-row">
              <div>
                <h2>{form.id ? "Edit Place" : "Add New Place"}</h2>
                <p>Keep it simple. Fill main fields first, then add extra tips and photos.</p>
              </div>
              {form.id ? <button type="button" className="soft-btn" onClick={resetForm}>New Place</button> : null}
            </div>

            <h3>1. Basic Details</h3>
            <div className="form-grid">
              <Field label="Place name"><input value={form.name} onChange={(e) => update("name", e.target.value)} required /></Field>
              <Field label="City"><input value={form.city} onChange={(e) => update("city", e.target.value)} required /></Field>
              <Field label="District"><input value={form.district || ""} onChange={(e) => update("district", e.target.value)} /></Field>
              <Field label="Region"><select value={form.region || ""} onChange={(e) => update("region", e.target.value)}>{regionOptions.map((item) => <option key={item}>{item}</option>)}</select></Field>
              <Field label="Category"><select value={form.category_id || ""} onChange={(e) => update("category_id", e.target.value)}><option value="">Select category</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>)}</select></Field>
              <Field label="Budget"><select value={form.budget} onChange={(e) => update("budget", e.target.value)}>{budgetOptions.map((item) => <option key={item}>{item}</option>)}</select></Field>
              <Field label="Budget score"><input type="number" value={form.budget_score} onChange={(e) => update("budget_score", e.target.value)} min="1" max="3" /></Field>
              <Field label="Estimated cost"><input type="number" value={form.estimated_cost} onChange={(e) => update("estimated_cost", e.target.value)} /></Field>
              <Field label="Latitude"><input value={form.lat || ""} onChange={(e) => update("lat", e.target.value)} /></Field>
              <Field label="Longitude"><input value={form.lng || ""} onChange={(e) => update("lng", e.target.value)} /></Field>
            </div>

            <h3>2. Page Content</h3>
            <Field label="Short description"><textarea value={form.short_description} onChange={(e) => update("short_description", e.target.value)} rows="3" /></Field>
            <Field label="Full description"><textarea value={form.full_description} onChange={(e) => update("full_description", e.target.value)} rows="7" /></Field>

            <div className="form-grid">
              <Field label="Duration"><input value={form.duration} onChange={(e) => update("duration", e.target.value)} placeholder="3-4 hours" /></Field>
              <Field label="Best time text"><input value={form.best_time} onChange={(e) => update("best_time", e.target.value)} placeholder="Dec - Apr" /></Field>
              <Field label="Opening hours"><input value={form.opening_hours} onChange={(e) => update("opening_hours", e.target.value)} /></Field>
              <Field label="Entry fee"><input value={form.entry_fee} onChange={(e) => update("entry_fee", e.target.value)} /></Field>
              <Field label="Vibe"><input value={form.vibe || ""} onChange={(e) => update("vibe", e.target.value)} placeholder="Culture" /></Field>
              <Field label="Main image URL"><input value={form.image_url || ""} onChange={(e) => update("image_url", e.target.value)} placeholder="https://... or upload below" /></Field>
            </div>

            <h3>3. Best Months</h3>
            <div className="month-grid">
              {monthLabels.map((label, index) => (
                <button key={label} type="button" className={(form.best_months || []).includes(index) ? "on" : ""} onClick={() => toggleMonth(index)}>{label}</button>
              ))}
            </div>

            <h3>4. Simple List Fields</h3>
            <div className="form-grid two">
              <Field label="Tags - one per line"><textarea value={toLines(form.tags)} onChange={(e) => update("tags", fromLines(e.target.value))} rows="5" /></Field>
              <Field label="Tips - one per line"><textarea value={toLines(form.tips)} onChange={(e) => update("tips", fromLines(e.target.value))} rows="5" /></Field>
              <Field label="Facilities - one per line"><textarea value={toLines(form.facilities)} onChange={(e) => update("facilities", fromLines(e.target.value))} rows="5" /></Field>
              <Field label="Nearby places JSON"><textarea value={toLines(form.nearby_places)} onChange={(e) => update("nearby_places", fromLines(e.target.value))} rows="5" /></Field>
            </div>

            <h3>5. Detailed JSON Fields</h3>
            <div className="form-grid two">
              <Field label="Experiences JSON"><textarea value={toLines(form.experiences)} onChange={(e) => update("experiences", fromLines(e.target.value))} rows="8" /></Field>
              <Field label="Highlights JSON"><textarea value={toLines(form.highlights)} onChange={(e) => update("highlights", fromLines(e.target.value))} rows="8" /></Field>
            </div>

            <h3>6. Photos and Publishing</h3>
            <div
              className="drop-box"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setFiles(Array.from(e.dataTransfer.files || []));
              }}
            >
              <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <strong>Drag and drop photos here</strong>
              <span>{files.length ? `${files.length} photo(s) selected` : "or click to choose images"}</span>
            </div>

            <div className="publish-row">
              <label><input type="checkbox" checked={!!form.featured} onChange={(e) => update("featured", e.target.checked)} /> Featured</label>
              <label>Status <select value={form.status} onChange={(e) => update("status", e.target.value)}><option value="published">Published</option><option value="draft">Draft</option></select></label>
              <label>Sort order <input type="number" value={form.sort_order} onChange={(e) => update("sort_order", e.target.value)} /></label>
            </div>

            <button className="save-btn" type="submit" disabled={saving}>{saving ? "Saving..." : form.id ? "Update Place" : "Add Place"}</button>
          </form>

          <aside className="manager-card place-list-card">
            <div className="list-head">
              <h2>Existing Places</h2>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search places..." />
            </div>
            {loading ? <p>Loading...</p> : null}
            <div className="admin-place-list">
              {filteredPlaces.map((place) => (
                <article key={place.id} className="admin-place-item">
                  <img src={assetUrl(place.image)} alt={place.name} />
                  <div>
                    <strong>{place.name}</strong>
                    <span>{place.city} · {place.categoryLabel || place.category} · {place.status}</span>
                    <small>{place.featured ? "★ Featured" : "Normal"}</small>
                  </div>
                  <button type="button" onClick={() => editPlace(place)}>Edit</button>
                  <button type="button" className="danger" onClick={() => deletePlace(place.id)}>Delete</button>
                </article>
              ))}
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}

const css = `
.explore-admin-page{color:#0b2530}.explore-admin-hero{display:grid;grid-template-columns:1fr 150px 150px 150px;gap:18px;align-items:stretch;background:linear-gradient(135deg,#064e45,#0f766e);border-radius:28px;padding:28px;color:#fff;margin-bottom:20px}.explore-admin-hero p{margin:0 0 10px;color:#ffe68b;font-weight:900;letter-spacing:.25em;font-size:12px}.explore-admin-hero h1{margin:0;font-size:42px}.explore-admin-hero span{display:block;margin-top:8px;color:#d6fff8}.hero-stat{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center}.hero-stat strong{font-size:36px}.hero-stat small{color:#d6fff8;font-weight:800}.admin-notice{background:#fff7d1;border:1px solid #f4d97b;color:#5a3c00;padding:14px 18px;border-radius:16px;margin:14px 0;font-weight:800}.explore-admin-tabs{display:flex;gap:10px;margin:16px 0}.explore-admin-tabs button{border:1px solid #dbe7e2;background:#fff;border-radius:999px;padding:12px 22px;font-weight:900;cursor:pointer}.explore-admin-tabs button.on{background:#064e45;color:#fff}.manager-grid{display:grid;grid-template-columns:minmax(0,1fr) 420px;gap:22px;align-items:start}.manager-grid.single{grid-template-columns:1fr 1fr}.manager-card{background:#fff;border:1px solid #e2ebe5;border-radius:26px;box-shadow:0 18px 45px rgba(0,0,0,.06);padding:22px}.form-title-row,.list-head{display:flex;justify-content:space-between;gap:16px;align-items:start}.manager-card h2{margin:0 0 8px;color:#064e45}.manager-card h3{margin:26px 0 14px;color:#0f766e;border-top:1px solid #edf4ef;padding-top:18px}.manager-card p{margin:0;color:#64748b}.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.form-grid.two{grid-template-columns:1fr 1fr}.explore-field{display:flex;flex-direction:column;gap:7px;font-weight:800;color:#334155}.explore-field input,.explore-field select,.explore-field textarea,.list-head input{border:1px solid #dbe7e2;border-radius:14px;padding:12px 14px;font:inherit;font-weight:650;outline:none;background:#fff}.explore-field textarea{resize:vertical}.month-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}.month-grid button{border:1px solid #dbe7e2;background:#fff;border-radius:12px;padding:10px;font-weight:900;cursor:pointer}.month-grid button.on{background:#ffc22b;color:#063c38;border-color:#ffc22b}.drop-box{position:relative;border:2px dashed #b9d8ce;background:#f4fbf7;border-radius:20px;min-height:130px;display:grid;place-items:center;text-align:center;color:#064e45;overflow:hidden}.drop-box input{position:absolute;inset:0;opacity:0;cursor:pointer}.drop-box strong{font-size:18px}.drop-box span{color:#64748b;font-weight:800}.publish-row{display:flex;gap:18px;flex-wrap:wrap;margin-top:16px;align-items:center}.publish-row label{font-weight:900;display:flex;gap:8px;align-items:center}.publish-row input,.publish-row select{border:1px solid #dbe7e2;border-radius:10px;padding:8px}.save-btn,.mini-form button,.soft-btn{border:none;background:#064e45;color:#fff;border-radius:16px;padding:14px 20px;font-weight:900;cursor:pointer;margin-top:20px}.soft-btn{background:#e8f5ef;color:#064e45;margin:0}.place-list-card{position:sticky;top:18px}.admin-place-list{display:flex;flex-direction:column;gap:12px;max-height:72vh;overflow:auto;padding-right:4px}.admin-place-item{display:grid;grid-template-columns:70px 1fr auto auto;gap:10px;align-items:center;border:1px solid #edf3ef;border-radius:18px;padding:10px}.admin-place-item img{width:70px;height:64px;object-fit:cover;border-radius:14px;background:#e5e7eb}.admin-place-item strong{display:block;color:#064e45}.admin-place-item span,.admin-place-item small{display:block;color:#64748b;font-size:12px;font-weight:800}.admin-place-item button{border:none;background:#e8f5ef;color:#064e45;border-radius:12px;padding:10px;font-weight:900;cursor:pointer}.admin-place-item button.danger{background:#fee2e2;color:#991b1b}.mini-form{display:grid;grid-template-columns:repeat(4,1fr) auto;gap:12px;align-items:end}.cat-list{display:flex;gap:10px;flex-wrap:wrap}.cat-list span{background:#f0faf6;border:1px solid #dbe7e2;border-radius:999px;padding:10px 14px;font-weight:900}.cat-list small{color:#64748b;margin-left:4px}@media(max-width:1100px){.explore-admin-hero,.manager-grid,.manager-grid.single{grid-template-columns:1fr}.place-list-card{position:static}.mini-form{grid-template-columns:1fr 1fr}}@media(max-width:700px){.form-grid,.form-grid.two,.month-grid,.mini-form{grid-template-columns:1fr}.admin-place-item{grid-template-columns:60px 1fr}.admin-place-item button{grid-column:span 1}.explore-admin-hero{padding:20px}.explore-admin-hero h1{font-size:34px}}
`;
