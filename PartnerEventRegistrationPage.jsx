import ContentImage from "../../components/ContentImage";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { eventCategories, eventMonths } from "../../data/eventData";

const categories = eventCategories.filter((item) => item !== "All");
const months = eventMonths.filter((item) => item !== "All Months");
const priceTypes = ["Free", "Budget", "Paid", "Premium"];
const emptyForm = {
  id: null,
  property_id: "",
  explore_place_id: "",
  title: "",
  category: categories[0] || "Hotel Experience",
  city: "",
  district: "",
  venue: "",
  month_name: "January",
  event_date: "",
  date_label: "Upcoming",
  time_label: "",
  price_type: "Budget",
  price: "",
  duration: "",
  short_description: "",
  description: "",
  image_url: "",
  map_url: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  near_hotels: "",
  highlights: "",
  guide_recommended: false,
  featured: false,
  status: "pending",
};

const getArrayText = (value) => {
  if (Array.isArray(value)) return value.join("\n");
  if (!value) return "";
  return String(value);
};

const formatDate = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const buildDirectionsUrl = ({ venue, city, district }) => {
  const query = [venue, city, district, "Sri Lanka"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || "Sri Lanka")}`;
};

function PartnerEventRegistrationPage() {
  const { user, isLoggedIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const imageInputRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadedEditId, setLoadedEditId] = useState("");

  const isEditing = Boolean(form.id);

  const stats = useMemo(
    () => ({
      total: events.length,
      pending: events.filter((event) => event.status === "pending").length,
      approved: events.filter((event) => event.status === "approved" || event.status === "published").length,
      rejected: events.filter((event) => event.status === "rejected").length,
    }),
    [events]
  );

  const fillFormFromEvent = (event) => {
    setForm({
      ...emptyForm,
      ...event,
      property_id: event.property_id || "",
      explore_place_id: event.explore_place_id || "",
      event_date: formatDate(event.event_date),
      price: event.price || "",
      near_hotels: getArrayText(event.near_hotels),
      highlights: getArrayText(event.highlights),
      guide_recommended: Boolean(event.guide_recommended),
      featured: Boolean(event.featured),
    });

    setImageFile(null);
    setImagePreview(event.image_url || "");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [eventsResponse, propertiesResponse] = await Promise.all([
        api.get("/partner/events"),
        api.get("/partner/properties"),
      ]);

      setEvents(eventsResponse.data.events || []);
      setProperties(propertiesResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load partner event details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.role === "partner") {
      loadData();
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    const editId = searchParams.get("edit");

    if (!editId || loading || loadedEditId === editId) return;

    const selectedEvent = events.find((event) => String(event.id) === String(editId));

    if (!selectedEvent) {
      setError("Selected event could not be found. Please choose an event from the dashboard again.");
      setSearchParams({});
      return;
    }

    fillFormFromEvent(selectedEvent);
    setLoadedEditId(editId);
    setMessage("Edit mode enabled. Update the details and click Update Event.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [events, loading, loadedEditId, searchParams, setSearchParams]);

  if (!isLoggedIn) {
    return <Navigate to="/partner/login" />;
  }

  if (user?.role !== "partner") {
    return (
      <div className="page">
        <div className="card" style={styles.noticeCard}>
          <h2>Access denied</h2>
          <p>This page is only for partners.</p>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setLoadedEditId("");
    setError("");
    setMessage("");
    setSearchParams({});

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePropertyChange = (e) => {
    const propertyId = e.target.value;
    const selectedProperty = properties.find((property) => String(property.id) === String(propertyId));

    setForm((prev) => {
      const nextVenue = selectedProperty?.name || prev.venue;
      const nextCity = selectedProperty?.city || prev.city;
      const nextDistrict = selectedProperty?.district || prev.district;

      return {
        ...prev,
        property_id: propertyId,
        city: nextCity,
        district: nextDistrict,
        venue: nextVenue,
        map_url: prev.map_url || buildDirectionsUrl({ venue: nextVenue, city: nextCity, district: nextDistrict }),
        contact_email: user?.email || prev.contact_email,
        contact_phone: user?.phone || prev.contact_phone,
      };
    });
  };

  const validateImageFile = (file) => {
    if (!file) return "";

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, JPEG, PNG, and WEBP images are allowed.";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "Image must be smaller than 5MB.";
    }

    return "";
  };

  const selectImageFile = (file) => {
    const imageError = validateImageFile(file);

    if (imageError) {
      setError(imageError);
      return;
    }

    setError("");
    setImageFile(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : form.image_url || "");
  };

  const uploadImageIfNeeded = async () => {
    if (!imageFile) return form.image_url || "";

    const data = new FormData();
    data.append("image", imageFile);

    const response = await api.post("/partner/events/upload-image", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data.image_url;
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Event title is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.venue.trim()) return "Venue is required.";
    if (!form.time_label.trim()) return "Time label is required.";
    if (!form.short_description.trim()) return "Short description is required.";
    if (!form.description.trim()) return "Full description is required.";
    if (Number(form.price || 0) < 0) return "Price cannot be negative.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formError = validateForm();

    if (formError) {
      setError(formError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const imageUrl = await uploadImageIfNeeded();
      const payload = {
        ...form,
        image_url: imageUrl,
        map_url: form.map_url?.trim() || buildDirectionsUrl(form),
        property_id: form.property_id || null,
        explore_place_id: form.explore_place_id || null,
        price: Number(form.price || 0),
      };

      if (isEditing) {
        await api.put(`/partner/events/${form.id}`, payload);
        setMessage("Event updated successfully and sent back to admin approval. You can check the approval status from the partner dashboard.");
      } else {
        await api.post("/partner/events", payload);
        setMessage("Event created successfully. It is now pending admin approval.");
      }

      await loadData();
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview("");
      setLoadedEditId("");
      setSearchParams({});

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page" style={styles.pageWrap}>
      <style>{css}</style>

      <div style={styles.header}>
        <div>
          <Link to="/partner/dashboard" style={styles.backLink}>
            ← Back to Partner Dashboard
          </Link>
          <span style={styles.heroPill}>Partner Event Portal</span>
          <h1 style={styles.title}>Create tourist events</h1>
          <p style={styles.subtitle}>
            Publish hotel experiences, cultural activities, food events, and destination programs with professional details, photos, and Google Maps directions.
          </p>
        </div>

        <button type="button" onClick={resetForm} style={styles.primaryButton}>
          + New Event Form
        </button>
      </div>

      {message && <div style={styles.successBox}>{message}</div>}
      {error && <div style={styles.errorBox}>{error}</div>}
      {form.status === "rejected" && form.rejection_reason && (
        <div style={styles.rejectBox}>
          <strong>Admin rejected this event.</strong> Reason: {form.rejection_reason}
        </div>
      )}

      <div style={styles.statsGrid}>
        <div className="partner-event-stat-card">
          <span>Total Events</span>
          <strong>{loading ? "..." : stats.total}</strong>
        </div>
        <div className="partner-event-stat-card">
          <span>Pending Approval</span>
          <strong>{loading ? "..." : stats.pending}</strong>
        </div>
        <div className="partner-event-stat-card">
          <span>Approved</span>
          <strong>{loading ? "..." : stats.approved}</strong>
        </div>
        <div className="partner-event-stat-card">
          <span>Rejected</span>
          <strong>{loading ? "..." : stats.rejected}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.formCard}>
        <div style={styles.formHero}>
          <div>
            <span style={styles.formBadge}>{isEditing ? "Edit Existing Event" : "New Event Details"}</span>
            <h2 style={styles.formTitle}>{isEditing ? "Update Event Information" : "Register a Tourism Event"}</h2>
            <p style={styles.formHint}>
              Fill the details clearly. The event will be submitted as Pending and will appear to tourists only after admin approval.
            </p>
          </div>

          <div style={styles.formStatusBox}>
            <span>Approval Status</span>
            <strong>{isEditing ? form.status : "pending"}</strong>
          </div>
        </div>

        <div className="partner-event-section-title" style={styles.sectionTitleRow}>
          <span>01</span>
          <h3>Basic Event Information</h3>
        </div>

        <div style={styles.formGrid}>
          <label style={styles.label}>
            <span>Connect Hotel / Property</span>
            <select name="property_id" value={form.property_id} onChange={handlePropertyChange} style={styles.input}>
              <option value="">No property selected</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name} - {property.city}
                </option>
              ))}
            </select>
          </label>

          <div style={styles.infoPanel}>
            <span style={styles.infoLabel}>Admin Approval Required</span>
            <strong style={styles.infoStrong}>Status: {isEditing ? form.status : "pending"}</strong>
            <small style={styles.infoSmall}>When you create or update an event, it is sent to admin as pending. Approved events only are visible to tourists.</small>
          </div>

          <label style={styles.label}>
            <span>Event Title *</span>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              style={styles.input}
              placeholder="Example: Rooftop Sri Lankan Dinner Night"
            />
          </label>

          <label style={styles.label}>
            <span>Category *</span>
            <select name="category" value={form.category} onChange={handleChange} style={styles.input}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="partner-event-section-title" style={styles.sectionTitleRow}>
          <span>02</span>
          <h3>Location, Date & Time</h3>
        </div>

        <div style={styles.formGrid}>
          <label style={styles.label}>
            <span>City *</span>
            <input name="city" value={form.city} onChange={handleChange} style={styles.input} placeholder="Kandy" />
          </label>

          <label style={styles.label}>
            <span>District</span>
            <input name="district" value={form.district || ""} onChange={handleChange} style={styles.input} placeholder="Kandy" />
          </label>

          <label style={styles.label}>
            <span>Venue *</span>
            <input
              name="venue"
              value={form.venue}
              onChange={handleChange}
              style={styles.input}
              placeholder="Hotel rooftop / beach garden / banquet hall"
            />
          </label>

          <label style={styles.label}>
            <span>Google Map URL / Directions</span>
            <input
              name="map_url"
              value={form.map_url || ""}
              onChange={handleChange}
              style={styles.input}
              placeholder="Paste Google Maps link or leave empty to auto-create directions"
            />
            <small style={styles.fieldHint}>
              Empty field will automatically use venue + city.
              {(form.map_url || form.venue || form.city) && (
                <a
                  href={form.map_url || buildDirectionsUrl(form)}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.inlineMapLink}
                >
                  Test directions
                </a>
              )}
            </small>
          </label>

          <label style={styles.label}>
            <span>Month *</span>
            <select name="month_name" value={form.month_name} onChange={handleChange} style={styles.input}>
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            <span>Exact Date</span>
            <input type="date" name="event_date" value={form.event_date || ""} onChange={handleChange} style={styles.input} />
          </label>

          <label style={styles.label}>
            <span>Date Label</span>
            <input name="date_label" value={form.date_label || ""} onChange={handleChange} style={styles.input} placeholder="Every Saturday / 25 July" />
          </label>

          <label style={styles.label}>
            <span>Time *</span>
            <input name="time_label" value={form.time_label} onChange={handleChange} style={styles.input} placeholder="6:30 PM - 9:30 PM" />
          </label>
        </div>

        <div className="partner-event-section-title" style={styles.sectionTitleRow}>
          <span>03</span>
          <h3>Pricing, Contact & Description</h3>
        </div>

        <div style={styles.formGrid}>
          <label style={styles.label}>
            <span>Duration</span>
            <input name="duration" value={form.duration || ""} onChange={handleChange} style={styles.input} placeholder="3 hr" />
          </label>

          <label style={styles.label}>
            <span>Price Type</span>
            <select name="price_type" value={form.price_type} onChange={handleChange} style={styles.input}>
              {priceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            <span>Price LKR</span>
            <input type="number" min="0" name="price" value={form.price} onChange={handleChange} style={styles.input} placeholder="0" />
          </label>

          <label style={styles.label}>
            <span>Contact Name</span>
            <input name="contact_name" value={form.contact_name || ""} onChange={handleChange} style={styles.input} placeholder="Event coordinator" />
          </label>

          <label style={styles.label}>
            <span>Contact Phone</span>
            <input name="contact_phone" value={form.contact_phone || ""} onChange={handleChange} style={styles.input} placeholder="+94..." />
          </label>

          <label style={styles.label}>
            <span>Contact Email</span>
            <input type="email" name="contact_email" value={form.contact_email || ""} onChange={handleChange} style={styles.input} placeholder="events@hotel.com" />
          </label>
        </div>

        <label style={styles.labelFull}>
          <span>Short Description *</span>
          <textarea
            name="short_description"
            value={form.short_description || ""}
            onChange={handleChange}
            style={styles.textarea}
            rows="3"
            placeholder="Small attractive description for event cards."
          />
        </label>

        <label style={styles.labelFull}>
          <span>Full Description *</span>
          <textarea
            name="description"
            value={form.description || ""}
            onChange={handleChange}
            style={styles.textarea}
            rows="5"
            placeholder="Explain what tourists can experience, what is included, and why they should join."
          />
        </label>

        <div style={styles.formGrid}>
          <label style={styles.label}>
            <span>Nearby Hotels</span>
            <textarea
              name="near_hotels"
              value={form.near_hotels || ""}
              onChange={handleChange}
              style={styles.textarea}
              rows="5"
              placeholder={"One hotel per line\nExample Hotel\nBeach View Hotel"}
            />
          </label>

          <label style={styles.label}>
            <span>Highlights</span>
            <textarea
              name="highlights"
              value={form.highlights || ""}
              onChange={handleChange}
              style={styles.textarea}
              rows="5"
              placeholder={"One highlight per line\nLive music\nBuffet dinner\nPhoto spot"}
            />
          </label>
        </div>

        <div style={styles.uploadBox}>
          <div>
            <h3 style={styles.uploadTitle}>Event Image</h3>
            <p style={styles.formHint}>Upload JPG, PNG, or WEBP image. Maximum size is 5MB.</p>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => selectImageFile(event.target.files?.[0])}
            />
          </div>

          {imagePreview ? (
            <ContentImage src={imagePreview} alt="Event preview" style={styles.previewImage} />
          ) : (
            <div style={styles.previewPlaceholder}>No image selected</div>
          )}
        </div>

        <div style={styles.checkboxRow}>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" name="guide_recommended" checked={form.guide_recommended} onChange={handleChange} />
            Guide recommended
          </label>

          <label style={styles.checkboxLabel}>
            <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
            Featured event
          </label>
        </div>

        <div style={styles.actionRow}>
          <button type="submit" disabled={saving} style={styles.primaryButton}>
            {saving ? "Submitting..." : isEditing ? "Update & Submit for Approval" : "Create Event"}
          </button>
          <button type="button" onClick={resetForm} style={styles.secondaryButton}>
            Clear Form
          </button>
          <Link to="/partner/dashboard" style={styles.dashboardButton}>
            View My Events in Dashboard
          </Link>
        </div>

        {error && <div style={styles.formBottomError}>{error}</div>}
        {message && <div style={styles.formBottomSuccess}>{message}</div>}
      </form>
    </div>
  );
}

const styles = {
  pageWrap: {
    background:
      "radial-gradient(circle at 5% 4%, rgba(55,190,174,0.12), transparent 28%), radial-gradient(circle at 95% 2%, rgba(229,180,56,0.12), transparent 30%), #f6f8f6",
    padding: "30px 20px 70px",
    minHeight: "calc(100vh - 76px)",
    fontFamily: '"Manrope","Segoe UI",Arial,sans-serif',
    color: "#17211f",
  },
  noticeCard: {
    padding: "30px",
    textAlign: "center",
  },
  header: {
    maxWidth: "1180px",
    margin: "0 auto 22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "22px",
    padding: "34px 36px",
    borderRadius: "18px",
    background:
      "radial-gradient(circle at 7% 17%, rgba(10,150,136,0.18) 0%, transparent 42%), radial-gradient(circle at 93% 5%, rgba(232,179,47,0.22) 0%, transparent 38%), linear-gradient(118deg,#e9f8f4 0%,#f5fbf8 38%,#fcfdfb 62%,#fff4d9 100%)",
    border: "1px solid rgba(126,188,172,0.62)",
    boxShadow: "0 18px 50px rgba(21,69,58,0.08)",
  },
  backLink: {
    color: "#0f766e",
    fontWeight: "800",
    textDecoration: "none",
    display: "inline-flex",
    marginBottom: "14px",
    fontSize: "15px",
  },
  heroPill: {
    display: "inline-flex",
    padding: "7px 11px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.82)",
    color: "#0f766e",
    border: "1px solid rgba(15,118,110,0.16)",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  title: {
    margin: "14px 0 10px",
    fontSize: "clamp(36px,5vw,58px)",
    lineHeight: 1.04,
    letterSpacing: "-0.045em",
    color: "#15231f",
    fontWeight: "800",
  },
  subtitle: {
    color: "#536a63",
    fontWeight: "500",
    fontSize: "16px",
    lineHeight: 1.65,
    margin: 0,
    maxWidth: "760px",
  },
  primaryButton: {
    border: "1px solid #0d6f66",
    borderRadius: "10px",
    background: "#0f8276",
    color: "#ffffff",
    padding: "13px 18px",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15,130,118,0.16)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    border: "1px solid #cfdcd7",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#42534e",
    padding: "12px 16px",
    fontWeight: "750",
    fontSize: "14px",
    cursor: "pointer",
  },
  dashboardButton: {
    border: "1px solid #b9d9d2",
    borderRadius: "10px",
    background: "#f1f9f7",
    color: "#0f766e",
    padding: "12px 16px",
    fontWeight: "750",
    fontSize: "14px",
    textDecoration: "none",
  },
  formBottomError: {
    marginTop: "18px",
    padding: "14px 16px",
    borderRadius: "10px",
    background: "#fff4f4",
    border: "1px solid #efc1c1",
    color: "#a43737",
    fontWeight: "700",
  },
  formBottomSuccess: {
    marginTop: "18px",
    padding: "14px 16px",
    borderRadius: "10px",
    background: "#edf8f5",
    border: "1px solid #a9d8cc",
    color: "#0f766e",
    fontWeight: "700",
  },

  infoPanel: {
    border: "1px solid #eadca9",
    borderRadius: "12px",
    background: "#fffaf0",
    padding: "15px",
    display: "grid",
    gap: "6px",
  },
  infoLabel: {
    color: "#8d6b19",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  infoStrong: {
    color: "#6c5418",
    textTransform: "capitalize",
  },
  infoSmall: {
    color: "#7f6a35",
    lineHeight: 1.5,
  },
  fieldHint: {
    color: "#6f7e79",
    fontWeight: "600",
    lineHeight: 1.5,
  },
  inlineMapLink: {
    marginLeft: "8px",
    color: "#0f766e",
    fontWeight: "800",
    textDecoration: "none",
  },
  rejectBox: {
    background: "#fff4f4",
    color: "#a43737",
    padding: "14px 18px",
    borderRadius: "10px",
    marginBottom: "18px",
    border: "1px solid #efc1c1",
    fontWeight: "700",
  },
  successBox: {
    background: "#edf8f5",
    color: "#0f766e",
    padding: "14px 18px",
    borderRadius: "10px",
    marginBottom: "18px",
    border: "1px solid #a9d8cc",
    fontWeight: "700",
  },
  errorBox: {
    background: "#fff4f4",
    color: "#a43737",
    padding: "14px 18px",
    borderRadius: "10px",
    marginBottom: "18px",
    border: "1px solid #efc1c1",
    fontWeight: "700",
  },
  statsGrid: {
    maxWidth: "1180px",
    margin: "0 auto 22px",
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "14px",
  },
  formCard: {
    maxWidth: "1180px",
    margin: "0 auto",
    background: "#ffffff",
    border: "1px solid #dde7e3",
    borderRadius: "16px",
    padding: "26px",
    boxShadow: "0 12px 34px rgba(22,53,46,0.055)",
  },
  formHero: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "18px",
    padding: "22px",
    borderRadius: "13px",
    marginBottom: "24px",
    background:
      "linear-gradient(118deg,#e7f7f3 0%,#f6fbf9 60%,#fff6dc 100%)",
    border: "1px solid #c8e0da",
    color: "#183029",
  },
  formBadge: {
    display: "inline-flex",
    border: "1px solid #b9d9d2",
    background: "#ffffff",
    color: "#0f766e",
    borderRadius: "999px",
    padding: "7px 11px",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  formTitle: {
    margin: "14px 0 6px",
    color: "#183029",
    letterSpacing: "-0.025em",
    fontSize: "30px",
    fontWeight: "750",
  },
  formHint: {
    margin: "6px 0 0",
    color: "#65756f",
    fontWeight: "500",
    fontSize: "14px",
    lineHeight: 1.55,
  },
  formStatusBox: {
    minWidth: "150px",
    padding: "16px",
    borderRadius: "11px",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid #c8e0da",
    color: "#42534e",
    display: "grid",
    gap: "6px",
  },
  sectionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "24px 0 14px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: "16px",
  },
  label: {
    display: "grid",
    gap: "8px",
    fontWeight: "700",
    color: "#3e4d48",
    fontSize: "14px",
  },
  labelFull: {
    display: "grid",
    gap: "8px",
    fontWeight: "700",
    color: "#3e4d48",
    fontSize: "14px",
    marginTop: "16px",
  },
  input: {
    width: "100%",
    border: "1px solid #cfdcd7",
    borderRadius: "10px",
    padding: "13px 14px",
    fontWeight: "500",
    fontSize: "15px",
    color: "#26332f",
    outline: "none",
    background: "#ffffff",
  },
  textarea: {
    width: "100%",
    border: "1px solid #cfdcd7",
    borderRadius: "10px",
    padding: "13px 14px",
    fontWeight: "500",
    fontSize: "15px",
    color: "#26332f",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    background: "#ffffff",
  },
  uploadBox: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "center",
    border: "1px dashed #8fc9bd",
    background: "#f4faf8",
    borderRadius: "12px",
    padding: "18px",
    marginTop: "18px",
  },
  uploadTitle: {
    margin: "0 0 6px",
    color: "#0f766e",
  },
  previewImage: {
    width: "240px",
    height: "150px",
    objectFit: "cover",
    borderRadius: "10px",
    border: "1px solid #c8ddd7",
  },
  previewPlaceholder: {
    width: "240px",
    height: "150px",
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #c8ddd7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "750",
    color: "#6f7e79",
  },
  checkboxRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f8faf9",
    border: "1px solid #dfe7e3",
    borderRadius: "999px",
    padding: "10px 14px",
    fontWeight: "700",
    color: "#42534e",
  },
  actionRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "22px",
  },
};

const css = `
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");

.page,
.page input,
.page textarea,
.page select,
.page button {
  font-family: "Manrope","Segoe UI",Arial,sans-serif;
}

.partner-event-stat-card {
  background: #ffffff;
  border: 1px solid #dde7e3;
  border-radius: 13px;
  padding: 20px;
  box-shadow: 0 9px 26px rgba(22,53,46,.04);
}

.partner-event-stat-card span {
  display: block;
  color: #6f7e79;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 8px;
}

.partner-event-stat-card strong {
  font-size: 34px;
  color: #0f766e;
  letter-spacing: -.035em;
  font-weight: 800;
}

.partner-event-section-title span {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #e9f8f5;
  color: #0f766e;
  font-weight: 800;
  border: 1px solid #bcded6;
}

.partner-event-section-title h3 {
  margin: 0;
  color: #183029;
  font-size: 23px;
  font-weight: 750;
  letter-spacing: -.025em;
}

.page input::placeholder,
.page textarea::placeholder {
  color: #87948f;
  opacity: 1;
}

.page input:focus,
.page select:focus,
.page textarea:focus {
  border-color: #0f8276 !important;
  box-shadow: 0 0 0 3px rgba(15,130,118,.10);
}

.page input[type="checkbox"] {
  accent-color: #0f8276;
}

@media(max-width:900px){
  .page [style*="grid-template-columns: repeat(4,1fr)"] {
    grid-template-columns: repeat(2,1fr) !important;
  }
  .page [style*="grid-template-columns: repeat(2,1fr)"] {
    grid-template-columns: 1fr !important;
  }
  .page [style*="justify-content: space-between"] {
    align-items: flex-start !important;
    flex-direction: column !important;
  }
}

@media(max-width:760px){
  .page {
    padding-left: 14px;
    padding-right: 14px;
  }
  .partner-event-stat-card {
    padding: 16px;
  }
}
`;

export default PartnerEventRegistrationPage;
