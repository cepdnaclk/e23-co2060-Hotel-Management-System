import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const fallbackPlans = [
  {
    plan_key: "standard",
    plan_name: "Normal Version",
    room_limit: 50,
    registration_fee: 5000,
    monthly_fee: 2500,
    description: "Suitable for small and medium properties.",
    is_active: 1,
  },
  {
    plan_key: "premium",
    plan_name: "Premium Version",
    room_limit: 100,
    registration_fee: 8500,
    monthly_fee: 4000,
    description: "Suitable for larger properties with more rooms.",
    is_active: 1,
  },
];

const emptyRoom = {
  room_type: "",
  capacity: "",
  base_occupancy: "",
  price_per_night: "",
  price_per_day: "",
  extra_person_price: "",
  total_rooms: "",
  image_url: "",
  image_file: null,
  image_preview: "",
};

const card = {
  background: "#fff",
  border: "1px solid #bbf7d0",
  borderRadius: 22,
  padding: 22,
  boxShadow: "0 18px 50px rgba(5, 46, 28, 0.08)",
};

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

  return "Property password must be at least 8 characters and contain a capital letter, simple letter, number, and symbol.";
};

function RegisterPropertyPage() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const logoInputRef = useRef(null);
  const mainPhotoInputRef = useRef(null);

  const [plans, setPlans] = useState(fallbackPlans);

  const [form, setForm] = useState({
    name: "",
    city: "",
    district: "",
    address: "",
    description: "",
    quote: "",
    hero_title: "",
    theme_color: "#0f7a43",
    property_type: "Hotel",
    property_password: "",
    confirm_property_password: "",
    plan_type: "standard",
    registration_payment_status: "Unpaid",
  });

  const [rooms, setRooms] = useState([{ ...emptyRoom }]);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [mainPhotoFile, setMainPhotoFile] = useState(null);
  const [mainPhotoPreview, setMainPhotoPreview] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const propertyPasswordStrength = checkPasswordStrength(form.property_password);

  useEffect(() => {
    const loadActivePlans = async () => {
      try {
        const res = await api.get("/partner/plans");
        const activePlans = res.data.data || [];

        if (activePlans.length > 0) {
          setPlans(activePlans);

          setForm((prev) => ({
            ...prev,
            plan_type: activePlans[0].plan_key,
          }));
        }
      } catch {
        setPlans(fallbackPlans);

        setForm((prev) => ({
          ...prev,
          plan_type: fallbackPlans[0].plan_key,
        }));
      }
    };

    loadActivePlans();
  }, []);

  const selectedPlan = useMemo(() => {
    return (
      plans.find((plan) => plan.plan_key === form.plan_type) ||
      plans[0] ||
      fallbackPlans[0]
    );
  }, [plans, form.plan_type]);

  const totalRoomCount = useMemo(() => {
    return rooms.reduce((sum, room) => sum + Number(room.total_rooms || 0), 0);
  }, [rooms]);

  if (!isLoggedIn) {
    return <Navigate to="/partner/login" />;
  }

  if (user?.role !== "partner") {
    return (
      <div className="page">
        <div className="card">
          <h2>Access denied</h2>
          <p>This page is only for partners.</p>
        </div>
      </div>
    );
  }

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "property_password") {
      const strength = checkPasswordStrength(value);

      setForm((prev) => ({
        ...prev,
        property_password: value,
        confirm_property_password: strength.isStrong
          ? prev.confirm_property_password
          : "",
      }));

      return;
    }

    setForm({ ...form, [name]: value });
  };

  const selectLogoFile = (file) => {
    const imageError = validateImageFile(file);

    if (imageError) {
      setError(imageError);
      return;
    }

    setError("");
    setLogoFile(file || null);
    setLogoPreview(file ? URL.createObjectURL(file) : "");
  };

  const removeLogoFile = () => {
    setLogoFile(null);
    setLogoPreview("");
  };

  const selectMainPhotoFile = (file) => {
    const imageError = validateImageFile(file);

    if (imageError) {
      setError(imageError);
      return;
    }

    setError("");
    setMainPhotoFile(file || null);
    setMainPhotoPreview(file ? URL.createObjectURL(file) : "");
  };

  const removeMainPhotoFile = () => {
    setMainPhotoFile(null);
    setMainPhotoPreview("");
  };

  const handleRoomChange = (index, e) => {
    const nextRooms = [...rooms];

    nextRooms[index] = {
      ...nextRooms[index],
      [e.target.name]: e.target.value,
    };

    setRooms(nextRooms);
  };

  const handleRoomFile = (index, file) => {
    const imageError = validateImageFile(file);

    if (imageError) {
      setError(imageError);
      return;
    }

    setError("");

    const nextRooms = [...rooms];

    nextRooms[index] = {
      ...nextRooms[index],
      image_file: file || null,
      image_preview: file ? URL.createObjectURL(file) : "",
    };

    setRooms(nextRooms);
  };

  const removeRoomFile = (index) => {
    const nextRooms = [...rooms];

    nextRooms[index] = {
      ...nextRooms[index],
      image_file: null,
      image_preview: "",
    };

    setRooms(nextRooms);
  };

  const addRoomRow = () => {
    setRooms([...rooms, { ...emptyRoom }]);
  };

  const removeRoomRow = (index) => {
    if (rooms.length === 1) {
      setError("At least one room type is required.");
      return;
    }

    setRooms(rooms.filter((_, roomIndex) => roomIndex !== index));
  };

  const validateForm = () => {
    if (
      !form.name ||
      !form.city ||
      !form.address ||
      !form.description ||
      !form.property_type
    ) {
      return "Please fill all required property details.";
    }

    const propertyPasswordError = getPasswordError(form.property_password);

    if (propertyPasswordError) {
      return propertyPasswordError;
    }

    if (form.property_password !== form.confirm_property_password) {
      return "Property password and confirm password do not match.";
    }

    if (!selectedPlan) {
      return "Please select a valid property version.";
    }

    if (totalRoomCount > Number(selectedPlan.room_limit)) {
      return `${selectedPlan.plan_name} allows maximum ${selectedPlan.room_limit} rooms. Your total is ${totalRoomCount}.`;
    }

    for (const room of rooms) {
      const maxGuests = Number(room.capacity || 0);
      const baseGuests = Number(room.base_occupancy || 0);
      const nightPrice = Number(room.price_per_night || 0);
      const totalRooms = Number(room.total_rooms || 0);

      if (!room.room_type || maxGuests < 1 || nightPrice <= 0 || totalRooms < 1) {
        return "Each room needs room type, maximum guests, night price, and total rooms.";
      }

      if (baseGuests < 1 || baseGuests > maxGuests) {
        return "Base guests included must be between 1 and maximum guests.";
      }
    }

    return "";
  };

  const uploadImage = async (url, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    await api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const formError = validateForm();

    if (formError) {
      setError(formError);
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/partner/properties", {
        name: form.name,
        city: form.city,
        district: form.district,
        address: form.address,
        description: form.description,
        quote: form.quote,
        logo_url: "",
        hero_title: form.hero_title || form.name,
        theme_color: form.theme_color,
        property_type: form.property_type,
        property_password: form.property_password,
        plan_type: form.plan_type,
        registration_payment_status: form.registration_payment_status,
        rooms: rooms.map((room) => ({
          room_type: room.room_type,
          capacity: Number(room.capacity),
          base_occupancy: Number(room.base_occupancy),
          price_per_night: Number(room.price_per_night),
          price_per_day: room.price_per_day ? Number(room.price_per_day) : null,
          extra_person_price: Number(room.extra_person_price || 0),
          total_rooms: Number(room.total_rooms),
          image_url: room.image_url || "",
        })),
        photos: [],
        policies: {
          check_in_time: "14:00:00",
          check_out_time: "11:00:00",
          cancellation_policy: "Cancellation policy not provided.",
          day_package_available: true,
          night_package_available: true,
        },
      });

      const propertyId = response.data.property_id;

      if (logoFile) {
        await uploadImage(`/partner/properties/${propertyId}/upload-logo`, logoFile);
      }

      if (mainPhotoFile) {
        await uploadImage(
          `/partner/properties/${propertyId}/upload-main-photo`,
          mainPhotoFile
        );
      }

      const createdRooms = response.data.rooms || [];

      for (const createdRoom of createdRooms) {
        const originalRoom = rooms[createdRoom.index];

        if (originalRoom?.image_file) {
          await uploadImage(
            `/partner/rooms/${createdRoom.room_id}/upload-photo`,
            originalRoom.image_file
          );
        }
      }

      setMessage(
        "Property registered successfully. First month is free. Admin approval is required before tourists can see it."
      );

      setTimeout(() => {
        navigate("/partner/dashboard");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register property");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="page"
      style={{
        background: "linear-gradient(180deg,#f0fdf4,#f8fafc)",
        paddingBottom: 50,
      }}
    >
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "30px 18px" }}>
        <Link to="/partner/dashboard" style={styles.backLink}>
          ← Back to dashboard
        </Link>

        <div style={styles.header}>
          <p style={styles.eyebrow}>Partner Property Registration</p>
          <h1 style={styles.title}>Register your property</h1>
          <p style={styles.subtitle}>
            Add property details, select an active admin-created version, upload
            photos, and add rooms. Every photo upload box supports drag and drop.
          </p>
        </div>

        {message && <div style={styles.successBox}>{message}</div>}
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 22 }}>
          <section style={card}>
            <h2 style={styles.sectionTitle}>1. Property details</h2>

            <div style={styles.grid}>
              <input
                name="name"
                placeholder="Property name *"
                value={form.name}
                onChange={handleChange}
                style={styles.input}
              />

              <select
                name="property_type"
                value={form.property_type}
                onChange={handleChange}
                style={styles.input}
              >
                <option>Hotel</option>
                <option>Resort</option>
                <option>Villa</option>
                <option>Guesthouse</option>
              </select>

              <input
                name="city"
                placeholder="City *"
                value={form.city}
                onChange={handleChange}
                style={styles.input}
              />

              <input
                name="district"
                placeholder="District"
                value={form.district}
                onChange={handleChange}
                style={styles.input}
              />

              <input
                name="hero_title"
                placeholder="Hero title"
                value={form.hero_title}
                onChange={handleChange}
                style={styles.input}
              />

              <input
                name="quote"
                placeholder="Short quote"
                value={form.quote}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <textarea
              name="address"
              placeholder="Address *"
              value={form.address}
              onChange={handleChange}
              style={styles.textarea}
            />

            <textarea
              name="description"
              placeholder="Description *"
              value={form.description}
              onChange={handleChange}
              style={styles.textarea}
            />

            <div style={styles.grid}>
              <div>
                <input
                  name="property_password"
                  type="password"
                  placeholder="Property management password *"
                  value={form.property_password}
                  onChange={handleChange}
                  style={styles.input}
                />

                <div style={styles.passwordRules}>
                  <span
                    style={
                      propertyPasswordStrength.hasMinLength
                        ? styles.ruleOk
                        : styles.ruleBad
                    }
                  >
                    {propertyPasswordStrength.hasMinLength ? "✓" : "•"} At least
                    8 characters
                  </span>

                  <span
                    style={
                      propertyPasswordStrength.hasCapital
                        ? styles.ruleOk
                        : styles.ruleBad
                    }
                  >
                    {propertyPasswordStrength.hasCapital ? "✓" : "•"} Capital
                    letter
                  </span>

                  <span
                    style={
                      propertyPasswordStrength.hasSimple
                        ? styles.ruleOk
                        : styles.ruleBad
                    }
                  >
                    {propertyPasswordStrength.hasSimple ? "✓" : "•"} Simple
                    letter
                  </span>

                  <span
                    style={
                      propertyPasswordStrength.hasNumber
                        ? styles.ruleOk
                        : styles.ruleBad
                    }
                  >
                    {propertyPasswordStrength.hasNumber ? "✓" : "•"} Number
                  </span>

                  <span
                    style={
                      propertyPasswordStrength.hasSymbol
                        ? styles.ruleOk
                        : styles.ruleBad
                    }
                  >
                    {propertyPasswordStrength.hasSymbol ? "✓" : "•"} Symbol
                  </span>
                </div>
              </div>

              <input
                name="confirm_property_password"
                type="password"
                placeholder={
                  propertyPasswordStrength.isStrong
                    ? "Confirm property password *"
                    : "Enter strong property password first"
                }
                value={form.confirm_property_password}
                onChange={handleChange}
                disabled={!propertyPasswordStrength.isStrong}
                style={{
                  ...styles.input,
                  background: propertyPasswordStrength.isStrong
                    ? "#ffffff"
                    : "#f3f4f6",
                  cursor: propertyPasswordStrength.isStrong
                    ? "text"
                    : "not-allowed",
                }}
              />

              <input
                name="theme_color"
                type="color"
                value={form.theme_color}
                onChange={handleChange}
                style={{ ...styles.input, height: 52, padding: 6 }}
              />
            </div>
          </section>

          <section style={card}>
            <h2 style={styles.sectionTitle}>2. Select property version</h2>

            <div style={styles.planGrid}>
              {plans.map((plan) => (
                <label
                  key={plan.plan_key}
                  style={{
                    ...styles.plan,
                    borderColor:
                      form.plan_type === plan.plan_key ? "#16a34a" : "#bbf7d0",
                    background:
                      form.plan_type === plan.plan_key ? "#f0fdf4" : "#ffffff",
                  }}
                >
                  <input
                    type="radio"
                    name="plan_type"
                    value={plan.plan_key}
                    checked={form.plan_type === plan.plan_key}
                    onChange={handleChange}
                  />

                  <strong style={styles.planName}>{plan.plan_name}</strong>

                  {plan.description && (
                    <span style={styles.planDescription}>{plan.description}</span>
                  )}

                  <span>Maximum rooms: {Number(plan.room_limit).toLocaleString()}</span>
                  <span>
                    Registration fee: Rs.{" "}
                    {Number(plan.registration_fee || 0).toLocaleString()}
                  </span>
                  <span>
                    Monthly fee after free month: Rs.{" "}
                    {Number(plan.monthly_fee || 0).toLocaleString()}
                  </span>
                </label>
              ))}
            </div>

            <p
              style={{
                color:
                  totalRoomCount > Number(selectedPlan?.room_limit || 0)
                    ? "#b91c1c"
                    : "#166534",
                fontWeight: 900,
                marginTop: 16,
              }}
            >
              Total rooms: {totalRoomCount} / {selectedPlan?.room_limit || 0}
            </p>
          </section>

          <section style={card}>
            <h2 style={styles.sectionTitle}>3. Photos</h2>

            <div style={styles.grid}>
              <div
                onClick={() => logoInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  selectLogoFile(e.dataTransfer.files?.[0]);
                }}
                style={styles.dropBox}
              >
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Property logo" style={styles.preview} />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLogoFile();
                      }}
                      style={styles.removeBtn}
                    >
                      Remove logo
                    </button>
                  </>
                ) : (
                  <>
                    <strong>Upload property logo</strong>
                    <span>Click or drag and drop image here</span>
                  </>
                )}

                <input
                  ref={logoInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => selectLogoFile(e.target.files?.[0])}
                />
              </div>

              <div
                onClick={() => mainPhotoInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  selectMainPhotoFile(e.dataTransfer.files?.[0]);
                }}
                style={styles.dropBox}
              >
                {mainPhotoPreview ? (
                  <>
                    <img
                      src={mainPhotoPreview}
                      alt="Main property"
                      style={styles.preview}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMainPhotoFile();
                      }}
                      style={styles.removeBtn}
                    >
                      Remove main photo
                    </button>
                  </>
                ) : (
                  <>
                    <strong>Main property photo</strong>
                    <span>Click or drag and drop image here</span>
                  </>
                )}

                <input
                  ref={mainPhotoInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => selectMainPhotoFile(e.target.files?.[0])}
                />
              </div>
            </div>
          </section>

          <section style={card}>
            <h2 style={styles.sectionTitle}>4. Rooms and room photos</h2>

            {rooms.map((room, index) => (
              <div key={index} style={styles.roomBox}>
                <div style={styles.roomHead}>
                  <h3 style={{ margin: 0 }}>Room type {index + 1}</h3>

                  <button
                    type="button"
                    onClick={() => removeRoomRow(index)}
                    style={styles.dangerBtn}
                  >
                    Remove
                  </button>
                </div>

                <div style={styles.grid}>
                  <input
                    name="room_type"
                    placeholder="Room type *"
                    value={room.room_type}
                    onChange={(e) => handleRoomChange(index, e)}
                    style={styles.input}
                  />

                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    placeholder="Maximum guests *"
                    value={room.capacity}
                    onChange={(e) => handleRoomChange(index, e)}
                    style={styles.input}
                  />

                  <input
                    name="base_occupancy"
                    type="number"
                    min="1"
                    placeholder="Base guests included *"
                    value={room.base_occupancy}
                    onChange={(e) => handleRoomChange(index, e)}
                    style={styles.input}
                  />

                  <input
                    name="total_rooms"
                    type="number"
                    min="1"
                    placeholder="Number of rooms *"
                    value={room.total_rooms}
                    onChange={(e) => handleRoomChange(index, e)}
                    style={styles.input}
                  />

                  <input
                    name="price_per_night"
                    type="number"
                    min="0"
                    placeholder="Night price Rs. *"
                    value={room.price_per_night}
                    onChange={(e) => handleRoomChange(index, e)}
                    style={styles.input}
                  />

                  <input
                    name="price_per_day"
                    type="number"
                    min="0"
                    placeholder="Day price Rs."
                    value={room.price_per_day}
                    onChange={(e) => handleRoomChange(index, e)}
                    style={styles.input}
                  />

                  <input
                    name="extra_person_price"
                    type="number"
                    min="0"
                    placeholder="Extra person price Rs."
                    value={room.extra_person_price}
                    onChange={(e) => handleRoomChange(index, e)}
                    style={styles.input}
                  />

                  <input
                    name="image_url"
                    placeholder="Room photo URL optional"
                    value={room.image_url}
                    onChange={(e) => handleRoomChange(index, e)}
                    style={styles.input}
                  />
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleRoomFile(index, e.dataTransfer.files?.[0]);
                  }}
                  style={styles.roomDropBox}
                >
                  {room.image_preview ? (
                    <>
                      <img
                        src={room.image_preview}
                        alt="Room preview"
                        style={{ ...styles.preview, maxWidth: 260 }}
                      />

                      <button
                        type="button"
                        onClick={() => removeRoomFile(index)}
                        style={styles.removeBtn}
                      >
                        Remove room photo
                      </button>
                    </>
                  ) : (
                    <>
                      <strong>Upload room photo</strong>
                      <span>Choose file or drag and drop image here</span>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleRoomFile(index, e.target.files?.[0])}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={addRoomRow} style={styles.secondaryBtn}>
              + Add another room type
            </button>
          </section>

          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? "Submitting..." : "Submit property registration"}
          </button>
        </form>
      </section>
    </div>
  );
}

const styles = {
  backLink: {
    color: "#0f7a43",
    fontWeight: 900,
    textDecoration: "none",
  },

  header: {
    marginTop: 18,
    marginBottom: 20,
  },

  eyebrow: {
    color: "#16a34a",
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  title: {
    fontSize: 38,
    margin: 0,
    color: "#052e1c",
  },

  subtitle: {
    color: "#64748b",
    maxWidth: 850,
    lineHeight: 1.6,
    fontWeight: 700,
  },

  sectionTitle: {
    color: "#052e1c",
    marginTop: 0,
  },

  successBox: {
    ...card,
    borderColor: "#86efac",
    background: "#f0fdf4",
    color: "#166534",
    marginBottom: 18,
    fontWeight: 800,
  },

  errorBox: {
    ...card,
    borderColor: "#fecaca",
    background: "#fee2e2",
    color: "#b91c1c",
    marginBottom: 18,
    fontWeight: 800,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: 14,
    marginBottom: 14,
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    fontSize: 15,
    outline: "none",
    background: "#ffffff",
  },

  textarea: {
    width: "100%",
    minHeight: 90,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    fontSize: 15,
    marginBottom: 14,
    outline: "none",
    resize: "vertical",
  },

  planGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: 16,
  },

  plan: {
    display: "grid",
    gap: 7,
    border: "2px solid",
    borderRadius: 18,
    padding: 16,
    cursor: "pointer",
    color: "#334155",
  },

  planName: {
    color: "#052e1c",
    fontSize: 18,
  },

  planDescription: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.4,
  },

  passwordRules: {
    display: "grid",
    gap: 6,
    margin: "8px 0 14px",
    fontSize: 13,
    fontWeight: 800,
  },

  ruleOk: {
    color: "#15803d",
  },

  ruleBad: {
    color: "#b91c1c",
  },

  dropBox: {
    minHeight: 180,
    border: "2px dashed #86efac",
    borderRadius: 20,
    padding: 16,
    display: "grid",
    placeItems: "center",
    gap: 10,
    textAlign: "center",
    cursor: "pointer",
    background: "#f0fdf4",
    color: "#166534",
  },

  roomDropBox: {
    marginTop: 12,
    minHeight: 130,
    border: "2px dashed #86efac",
    borderRadius: 18,
    padding: 16,
    display: "grid",
    placeItems: "center",
    gap: 10,
    textAlign: "center",
    background: "#f0fdf4",
    color: "#166534",
  },

  preview: {
    width: "100%",
    maxHeight: 180,
    objectFit: "cover",
    borderRadius: 16,
    border: "1px solid #bbf7d0",
  },

  roomBox: {
    border: "1px solid #bbf7d0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    background: "#ffffff",
  },

  roomHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  secondaryBtn: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid #16a34a",
    color: "#0f7a43",
    background: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },

  dangerBtn: {
    padding: "9px 12px",
    borderRadius: 12,
    border: "none",
    color: "#ffffff",
    background: "#dc2626",
    fontWeight: 900,
    cursor: "pointer",
  },

  removeBtn: {
    padding: "9px 12px",
    borderRadius: 12,
    border: "none",
    color: "#ffffff",
    background: "#b91c1c",
    fontWeight: 900,
    cursor: "pointer",
  },

  submitBtn: {
    padding: "16px 22px",
    borderRadius: 18,
    border: "none",
    color: "#ffffff",
    background: "linear-gradient(135deg,#0f7a43,#16a34a)",
    fontWeight: 1000,
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 16px 35px rgba(22, 163, 74, 0.25)",
  },
};

export default RegisterPropertyPage;
