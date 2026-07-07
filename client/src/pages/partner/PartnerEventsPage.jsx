import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { eventCategories, eventMonths } from "../../data/eventData";

const categories = eventCategories.filter((item) => item !== "All");
const months = eventMonths.filter((item) => item !== "All Months");
const priceTypes = ["Free", "Budget", "Paid", "Premium"];
const statuses = ["draft", "published", "hidden"];

const emptyForm = {
  id: null,
  property_id: "",
  explore_place_id: "",
  title: "",
  category: "Hotel Experience",
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
  status: "draft",
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

const formatPrice = (event) => {
  const price = Number(event.price || 0);
  if (event.price_type === "Free" || price === 0) return "Free entry";
  return `LKR ${price.toLocaleString()}`;
};

function PartnerEventsPage() {
  const { user, isLoggedIn } = useAuth();
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
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const isEditing = Boolean(form.id);

  useEffect(() => {
    if (isLoggedIn && user?.role === "partner") {
      loadData();
    }
  }, [isLoggedIn, user]);

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
      setError(err.response?.data?.message || "Failed to load partner events.");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      const searchable = [
        event.title,
        event.category,
        event.city,
        event.venue,
        event.property_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [events, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: events.length,
      published: events.filter((event) => event.status === "published").length,
      draft: events.filter((event) => event.status === "draft").length,
      hidden: events.filter((event) => event.status === "hidden").length,
    }),
    [events]
  );

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
    setError("");
    setMessage("");
    setShowForm(true);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const editEvent = (event) => {
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
    setError("");
    setMessage("");
    setShowForm(true);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
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

    setForm((prev) => ({
      ...prev,
      property_id: propertyId,
      city: selectedProperty?.city || prev.city,
      district: selectedProperty?.district || prev.district,
      venue: selectedProperty?.name || prev.venue,
      contact_email: user?.email || prev.contact_email,
      contact_phone: user?.phone || prev.contact_phone,
    }));
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
        property_id: form.property_id || null,
        explore_place_id: form.explore_place_id || null,
        price: Number(form.price || 0),
      };

      if (isEditing) {
        await api.put(`/partner/events/${form.id}`, payload);
        setMessage("Event updated successfully.");
      } else {
        await api.post("/partner/events", payload);
        setMessage("Event created successfully.");
      }

      await loadData();
      setForm(emptyForm);
      setImageFile(null);
      setImagePreview("");
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (eventId, status) => {
    try {
      setError("");
      setMessage("");
      await api.patch(`/partner/events/${eventId}/status`, { status });
      setMessage(`Event moved to ${status}.`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update event status.");
    }
  };

  const deleteEvent = async (eventId) => {
    const confirmed = window.confirm("Are you sure you want to delete this event?");

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");
      await api.delete(`/partner/events/${eventId}`);
      setMessage("Event deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete event.");
    }
  };

  return (
    <div className="page" style={styles.pageWrap}>
      <style>{css}</style>

      <div style={styles.header}>
        <div>
          <Link to="/partner/dashboard" style={styles.backLink}>
            ← Back to Dashboard
          </Link>
          <h1 style={styles.title}>Partner Event Management</h1>
          <p style={styles.subtitle}>
            Create, edit, publish, hide, and delete events that tourists can see in the Events section.
          </p>
        </div>

        <button type="button" onClick={resetForm} style={styles.primaryButton}>
          + Add New Event
        </button>
      </div>

      {message && <div style={styles.successBox}>{message}</div>}
      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.statsGrid}>
        <div className="partner-event-stat-card">
          <span>Total Events</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="partner-event-stat-card">
          <span>Published</span>
          <strong>{stats.published}</strong>
        </div>
        <div className="partner-event-stat-card">
          <span>Draft</span>
          <strong>{stats.draft}</strong>
        </div>
        <div className="partner-event-stat-card">
          <span>Hidden</span>
          <strong>{stats.hidden}</strong>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <div style={styles.formHeader}>
            <div>
              <h2 style={styles.formTitle}>{isEditing ? "Edit Event" : "Add New Event"}</h2>
              <p style={styles.formHint}>Published events appear on the public tourist Events page.</p>
            </div>
            <button type="button" onClick={() => setShowForm(false)} style={styles.secondaryButton}>
              Close
            </button>
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

            <label style={styles.label}>
              <span>Event Status</span>
              <select name="status" value={form.status} onChange={handleChange} style={styles.input}>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              <span>Event Title *</span>
              <input name="title" value={form.title} onChange={handleChange} style={styles.input} placeholder="Example: Rooftop Sri Lankan Dinner Night" />
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
              <input name="venue" value={form.venue} onChange={handleChange} style={styles.input} placeholder="Hotel rooftop / beach garden / banquet hall" />
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
              <span>Map URL</span>
              <input name="map_url" value={form.map_url || ""} onChange={handleChange} style={styles.input} placeholder="Google Maps link" />
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
            <textarea name="short_description" value={form.short_description || ""} onChange={handleChange} style={styles.textarea} rows="3" placeholder="Small attractive description for event cards." />
          </label>

          <label style={styles.labelFull}>
            <span>Full Description *</span>
            <textarea name="description" value={form.description || ""} onChange={handleChange} style={styles.textarea} rows="5" placeholder="Explain what tourists can experience, what is included, and why they should join." />
          </label>

          <div style={styles.formGrid}>
            <label style={styles.label}>
              <span>Nearby Hotels</span>
              <textarea name="near_hotels" value={form.near_hotels || ""} onChange={handleChange} style={styles.textarea} rows="5" placeholder={"One hotel per line\nExample Hotel\nBeach View Hotel"} />
            </label>

            <label style={styles.label}>
              <span>Highlights</span>
              <textarea name="highlights" value={form.highlights || ""} onChange={handleChange} style={styles.textarea} rows="5" placeholder={"One highlight per line\nLive music\nBuffet dinner\nPhoto spot"} />
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
              <img src={imagePreview} alt="Event preview" style={styles.previewImage} />
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
              {saving ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
            </button>
            <button type="button" onClick={resetForm} style={styles.secondaryButton}>
              Clear Form
            </button>
          </div>
        </form>
      )}

      <section style={styles.listCard}>
        <div style={styles.listHeader}>
          <div>
            <h2 style={styles.listTitle}>My Events</h2>
            <p style={styles.formHint}>Manage all events created by your partner account.</p>
          </div>

          <div style={styles.filters}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search event..." style={styles.searchInput} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={styles.searchInput}>
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p style={styles.loadingText}>Loading events...</p>
        ) : filteredEvents.length === 0 ? (
          <div style={styles.emptyBox}>
            <span>🎪</span>
            <h3>No events found</h3>
            <p>Create your first hotel event, cultural night, food experience, or tourist activity.</p>
            <button type="button" onClick={resetForm} style={styles.primaryButton}>
              Add New Event
            </button>
          </div>
        ) : (
          <div style={styles.eventGrid}>
            {filteredEvents.map((event) => (
              <article key={event.id} className="partner-event-card">
                <div style={styles.eventImageBox}>
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} style={styles.eventImage} />
                  ) : (
                    <div style={styles.eventImageEmpty}>No Image</div>
                  )}
                  <span className={`partner-event-status status-${event.status}`}>{event.status}</span>
                </div>

                <div style={styles.eventBody}>
                  <div style={styles.eventMetaRow}>
                    <span>{event.category}</span>
                    <span>{event.city}</span>
                    <span>{formatPrice(event)}</span>
                  </div>

                  <h3 style={styles.eventTitle}>{event.title}</h3>
                  <p style={styles.eventText}>{event.short_description}</p>

                  <div style={styles.eventDetails}>
                    <span>📍 {event.venue}</span>
                    <span>🗓 {event.date_label || event.month_name}</span>
                    <span>⏱ {event.time_label}</span>
                    {event.property_name && <span>🏨 {event.property_name}</span>}
                  </div>

                  <div style={styles.eventButtonRow}>
                    <button type="button" onClick={() => editEvent(event)} style={styles.editButton}>
                      Edit
                    </button>

                    {event.status !== "published" && (
                      <button type="button" onClick={() => updateStatus(event.id, "published")} style={styles.publishButton}>
                        Publish
                      </button>
                    )}

                    {event.status !== "hidden" && (
                      <button type="button" onClick={() => updateStatus(event.id, "hidden")} style={styles.hideButton}>
                        Hide
                      </button>
                    )}

                    <button type="button" onClick={() => deleteEvent(event.id)} style={styles.deleteButton}>
                      Delete
                    </button>
                  </div>

                  {event.status === "published" && (
                    <Link to={`/events/${event.slug}`} target="_blank" style={styles.publicLink}>
                      View Public Event →
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  pageWrap: {
    background: "linear-gradient(180deg,#f0fdf4 0%,#f8fafc 45%,#ffffff 100%)",
  },
  noticeCard: {
    padding: "30px",
    textAlign: "center",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "22px",
  },
  backLink: {
    color: "#047857",
    fontWeight: "900",
    textDecoration: "none",
  },
  title: {
    margin: "10px 0 8px",
    fontSize: "42px",
    letterSpacing: "-0.04em",
    color: "#064e3b",
  },
  subtitle: {
    color: "#475569",
    fontWeight: "650",
    margin: 0,
    maxWidth: "760px",
  },
  primaryButton: {
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg,#047857,#10b981)",
    color: "#ffffff",
    padding: "13px 18px",
    fontWeight: "950",
    cursor: "pointer",
    boxShadow: "0 14px 34px rgba(4,120,87,0.24)",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "16px",
    background: "#ffffff",
    color: "#334155",
    padding: "12px 16px",
    fontWeight: "900",
    cursor: "pointer",
  },
  successBox: {
    background: "#dcfce7",
    color: "#166534",
    padding: "14px 18px",
    borderRadius: "14px",
    marginBottom: "18px",
    fontWeight: "800",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px 18px",
    borderRadius: "14px",
    marginBottom: "18px",
    fontWeight: "800",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "16px",
    marginBottom: "22px",
  },
  formCard: {
    background: "#ffffff",
    border: "1px solid #bbf7d0",
    borderRadius: "28px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 24px 70px rgba(15,23,42,0.08)",
  },
  formHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "18px",
    marginBottom: "18px",
  },
  formTitle: {
    margin: 0,
    color: "#064e3b",
    letterSpacing: "-0.03em",
  },
  formHint: {
    margin: "6px 0 0",
    color: "#64748b",
    fontWeight: "650",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: "16px",
  },
  label: {
    display: "grid",
    gap: "8px",
    fontWeight: "900",
    color: "#334155",
  },
  labelFull: {
    display: "grid",
    gap: "8px",
    fontWeight: "900",
    color: "#334155",
    marginTop: "16px",
  },
  input: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "13px 14px",
    fontWeight: "700",
    outline: "none",
  },
  textarea: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "13px 14px",
    fontWeight: "700",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  uploadBox: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "center",
    border: "1px dashed #86efac",
    background: "#f0fdf4",
    borderRadius: "22px",
    padding: "18px",
    marginTop: "18px",
  },
  uploadTitle: {
    margin: "0 0 6px",
    color: "#065f46",
  },
  previewImage: {
    width: "220px",
    height: "140px",
    objectFit: "cover",
    borderRadius: "18px",
    border: "1px solid #bbf7d0",
  },
  previewPlaceholder: {
    width: "220px",
    height: "140px",
    borderRadius: "18px",
    background: "#ffffff",
    border: "1px solid #bbf7d0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    color: "#64748b",
  },
  checkboxRow: {
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
    marginTop: "18px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "999px",
    padding: "10px 14px",
    fontWeight: "900",
    color: "#334155",
  },
  actionRow: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
  },
  listCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 24px 70px rgba(15,23,42,0.08)",
  },
  listHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    marginBottom: "18px",
  },
  listTitle: {
    margin: 0,
    color: "#064e3b",
  },
  filters: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  searchInput: {
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "12px 14px",
    fontWeight: "800",
  },
  loadingText: {
    color: "#64748b",
    fontWeight: "800",
  },
  emptyBox: {
    textAlign: "center",
    padding: "42px",
    background: "#f8fafc",
    borderRadius: "24px",
  },
  eventGrid: {
    display: "grid",
    gap: "18px",
  },
  eventImageBox: {
    position: "relative",
    minHeight: "230px",
    background: "#ecfdf5",
  },
  eventImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  eventImageEmpty: {
    height: "100%",
    minHeight: "230px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "950",
    color: "#047857",
  },
  eventBody: {
    padding: "22px",
  },
  eventMetaRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  eventTitle: {
    margin: "14px 0 8px",
    color: "#0f172a",
    fontSize: "26px",
    letterSpacing: "-0.03em",
  },
  eventText: {
    color: "#475569",
    lineHeight: 1.7,
    fontWeight: "650",
  },
  eventDetails: {
    display: "grid",
    gap: "8px",
    color: "#334155",
    fontWeight: "800",
    marginTop: "14px",
  },
  eventButtonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "18px",
  },
  editButton: {
    border: "none",
    borderRadius: "12px",
    padding: "10px 13px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "900",
    cursor: "pointer",
  },
  publishButton: {
    border: "none",
    borderRadius: "12px",
    padding: "10px 13px",
    background: "#059669",
    color: "#ffffff",
    fontWeight: "900",
    cursor: "pointer",
  },
  hideButton: {
    border: "none",
    borderRadius: "12px",
    padding: "10px 13px",
    background: "#f59e0b",
    color: "#111827",
    fontWeight: "900",
    cursor: "pointer",
  },
  deleteButton: {
    border: "none",
    borderRadius: "12px",
    padding: "10px 13px",
    background: "#ef4444",
    color: "#ffffff",
    fontWeight: "900",
    cursor: "pointer",
  },
  publicLink: {
    display: "inline-block",
    marginTop: "14px",
    color: "#047857",
    textDecoration: "none",
    fontWeight: "950",
  },
};

const css = `
.partner-event-stat-card{background:#fff;border:1px solid #bbf7d0;border-radius:22px;padding:20px;box-shadow:0 18px 50px rgba(5,46,28,.08)}
.partner-event-stat-card span{display:block;color:#64748b;font-weight:900;margin-bottom:8px}
.partner-event-stat-card strong{font-size:34px;color:#064e3b;letter-spacing:-.04em}
.partner-event-card{display:grid;grid-template-columns:320px 1fr;border:1px solid #e2e8f0;border-radius:26px;overflow:hidden;background:#fff;box-shadow:0 18px 55px rgba(15,23,42,.08)}
.partner-event-status{position:absolute;left:14px;top:14px;border-radius:999px;padding:8px 12px;color:white;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}
.status-published{background:#059669}.status-draft{background:#64748b}.status-hidden{background:#f59e0b;color:#111827}
.partner-event-card div[style*="eventMetaRow"] span,.partner-event-card [style*="eventMetaRow"] span{background:#ecfdf5;border:1px solid #bbf7d0;color:#047857;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900}
@media(max-width:960px){.partner-event-card{grid-template-columns:1fr}.partner-event-stat-card strong{font-size:28px}}
@media(max-width:760px){.page{padding-left:14px;padding-right:14px}.partner-event-stat-card{padding:16px}}
@media(max-width:900px){
  .page [style*="grid-template-columns: repeat(4,1fr)"]{grid-template-columns:repeat(2,1fr)!important}
  .page [style*="grid-template-columns: repeat(2,1fr)"]{grid-template-columns:1fr!important}
  .page [style*="justify-content: space-between"]{align-items:flex-start!important;flex-direction:column!important}
}
`;

export default PartnerEventsPage;
