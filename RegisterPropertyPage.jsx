import ContentImage from "../../components/ContentImage";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/PasswordInput";

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
  background: "#ffffff",
  border: "1px solid #dde7e3",
  borderRadius: 16,
  padding: 26,
  boxShadow: "0 10px 30px rgba(22, 53, 46, 0.045)",
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
    <div className="page property-register-page" style={styles.pageWrap}>
      <style>{registerPropertyFormCss}</style>
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "30px 18px" }}>
        <Link to="/partner/dashboard" style={styles.backLink}>
          ← Back to dashboard
        </Link>

        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Partner Property Portal</p>
            <h1 style={styles.title}>Register your property</h1>
            <p style={styles.subtitle}>
              Add hotel details, select a package, upload high-quality photos, and create room types.
              Your property becomes public only after admin approval.
            </p>
          </div>
          <div style={styles.headerBadge}>
            <span>🏨</span>
            <strong>Property</strong>
            <small>Admin approval required</small>
          </div>
        </div>

        {message && <div style={styles.successBox}>{message}</div>}
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 22 }}>
          <section style={card}>
            <div style={styles.sectionTitleRow}>
              <span style={styles.sectionNumber}>01</span>
              <h2 style={styles.sectionTitle}>Property details</h2>
            </div>

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
                <PasswordInput
                  name="property_password"
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

              <PasswordInput
                name="confirm_property_password"
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
            <div style={styles.sectionTitleRow}>
              <span style={styles.sectionNumber}>02</span>
              <h2 style={styles.sectionTitle}>Select property version</h2>
            </div>

            <div style={styles.planGrid}>
              {plans.map((plan) => (
                <label
                  key={plan.plan_key}
                  style={{
                    ...styles.plan,
                    borderColor:
                      form.plan_type === plan.plan_key ? "#0f8276" : "#cfded9",
                    background:
                      form.plan_type === plan.plan_key ? "#edf8f5" : "#ffffff",
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
                    ? "#a43737"
                    : "#0f766e",
                fontWeight: 900,
                marginTop: 16,
              }}
            >
              Total rooms: {totalRoomCount} / {selectedPlan?.room_limit || 0}
            </p>
          </section>

          <section style={card}>
            <div style={styles.sectionTitleRow}>
              <span style={styles.sectionNumber}>03</span>
              <h2 style={styles.sectionTitle}>Photos</h2>
            </div>

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
                    <ContentImage src={logoPreview} alt="Property logo" style={styles.preview} />
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
                    <ContentImage
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
            <div style={styles.sectionTitleRow}>
              <span style={styles.sectionNumber}>04</span>
              <h2 style={styles.sectionTitle}>Rooms and room photos</h2>
            </div>

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
                      <ContentImage
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
  pageWrap: {
    background:
      "radial-gradient(circle at 5% 4%, rgba(55,190,174,0.12), transparent 28%), radial-gradient(circle at 95% 2%, rgba(229,180,56,0.12), transparent 30%), #f6f8f6",
    paddingBottom: 70,
    minHeight: "calc(100vh - 76px)",
    fontFamily: '"Manrope","Segoe UI",Arial,sans-serif',
    color: "#17211f",
  },

  backLink: {
    color: "#0f766e",
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 15,
  },

  header: {
    marginTop: 18,
    marginBottom: 24,
    padding: "34px 36px",
    borderRadius: 18,
    background:
      "radial-gradient(circle at 7% 17%, rgba(10,150,136,0.18) 0%, transparent 42%), radial-gradient(circle at 93% 5%, rgba(232,179,47,0.22) 0%, transparent 38%), linear-gradient(118deg,#e9f8f4 0%,#f5fbf8 38%,#fcfdfb 62%,#fff4d9 100%)",
    border: "1px solid rgba(126,188,172,0.62)",
    boxShadow: "0 18px 50px rgba(21,69,58,0.08)",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
  },

  sectionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },

  sectionNumber: {
    flex: "0 0 auto",
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    background: "#e9f8f5",
    color: "#0f766e",
    border: "1px solid #bcded6",
    fontWeight: 800,
    fontSize: 14,
  },

  eyebrow: {
    display: "inline-flex",
    margin: 0,
    padding: "7px 11px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.82)",
    color: "#0f766e",
    border: "1px solid rgba(15,118,110,0.16)",
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    fontSize: 12,
  },

  title: {
    fontSize: "clamp(38px,5vw,58px)",
    lineHeight: 1.04,
    letterSpacing: "-0.045em",
    margin: "16px 0 10px",
    color: "#15231f",
    fontWeight: 800,
  },

  subtitle: {
    color: "#536a63",
    maxWidth: 780,
    lineHeight: 1.7,
    fontWeight: 500,
    fontSize: 16,
    margin: 0,
  },

  headerBadge: {
    minWidth: 190,
    borderRadius: 14,
    padding: 22,
    background: "rgba(255,255,255,0.78)",
    border: "1px solid #cce1db",
    display: "grid",
    gap: 7,
    textAlign: "center",
    color: "#26332f",
    boxShadow: "0 12px 32px rgba(21,69,58,0.06)",
  },

  sectionTitle: {
    color: "#183029",
    margin: 0,
    fontSize: 30,
    lineHeight: 1.2,
    fontWeight: 750,
    letterSpacing: "-0.025em",
  },

  successBox: {
    ...card,
    borderColor: "#a9d8cc",
    background: "#edf8f5",
    color: "#0f766e",
    marginBottom: 18,
    fontWeight: 700,
  },

  errorBox: {
    ...card,
    borderColor: "#efc1c1",
    background: "#fff4f4",
    color: "#a43737",
    marginBottom: 18,
    fontWeight: 700,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: 14,
    marginBottom: 14,
  },

  input: {
    width: "100%",
    padding: "14px 15px",
    borderRadius: 10,
    border: "1px solid #cfdcd7",
    fontSize: 15,
    outline: "none",
    background: "#ffffff",
    color: "#26332f",
  },

  textarea: {
    width: "100%",
    minHeight: 96,
    padding: 15,
    borderRadius: 10,
    border: "1px solid #cfdcd7",
    fontSize: 15,
    marginBottom: 14,
    outline: "none",
    resize: "vertical",
    color: "#26332f",
    background: "#ffffff",
    fontFamily: "inherit",
  },

  planGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: 16,
  },

  plan: {
    display: "grid",
    gap: 8,
    border: "1px solid",
    borderRadius: 12,
    padding: 18,
    cursor: "pointer",
    color: "#4e615b",
    lineHeight: 1.55,
  },

  planName: {
    color: "#183029",
    fontSize: 18,
    fontWeight: 750,
  },

  planDescription: {
    color: "#6f7e79",
    fontSize: 14,
    lineHeight: 1.5,
  },

  passwordRules: {
    display: "grid",
    gap: 6,
    margin: "9px 0 14px",
    fontSize: 13,
    fontWeight: 700,
  },

  ruleOk: {
    color: "#0f766e",
  },

  ruleBad: {
    color: "#a43737",
  },

  dropBox: {
    minHeight: 180,
    border: "1px dashed #8fc9bd",
    borderRadius: 12,
    padding: 18,
    display: "grid",
    placeItems: "center",
    gap: 10,
    textAlign: "center",
    cursor: "pointer",
    background: "#f4faf8",
    color: "#0f766e",
  },

  roomDropBox: {
    marginTop: 12,
    minHeight: 130,
    border: "1px dashed #8fc9bd",
    borderRadius: 12,
    padding: 18,
    display: "grid",
    placeItems: "center",
    gap: 10,
    textAlign: "center",
    background: "#f4faf8",
    color: "#0f766e",
  },

  preview: {
    width: "100%",
    maxHeight: 180,
    objectFit: "cover",
    borderRadius: 10,
    border: "1px solid #cfdcd7",
  },

  roomBox: {
    border: "1px solid #dfe7e3",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    background: "#fbfcfb",
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
    borderRadius: 9,
    border: "1px solid #8fc9bd",
    color: "#0f766e",
    background: "#ffffff",
    fontWeight: 750,
    cursor: "pointer",
    fontSize: 14,
  },

  dangerBtn: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #e3b2b2",
    color: "#a43737",
    background: "#fff5f5",
    fontWeight: 750,
    cursor: "pointer",
  },

  removeBtn: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #e3b2b2",
    color: "#a43737",
    background: "#fff5f5",
    fontWeight: 750,
    cursor: "pointer",
  },

  submitBtn: {
    padding: "15px 22px",
    borderRadius: 10,
    border: "1px solid #0d6f66",
    color: "#ffffff",
    background: "#0f8276",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15,130,118,0.16)",
  },
};

const registerPropertyFormCss = `
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");

.property-register-page,
.property-register-page input,
.property-register-page textarea,
.property-register-page select,
.property-register-page button {
  font-family: "Manrope","Segoe UI",Arial,sans-serif;
}

.property-register-page input::placeholder,
.property-register-page textarea::placeholder {
  color: #87948f;
  opacity: 1;
}

.property-register-page input:focus,
.property-register-page textarea:focus,
.property-register-page select:focus {
  border-color: #0f8276 !important;
  box-shadow: 0 0 0 3px rgba(15,130,118,0.10);
}

.property-register-page input[type="radio"] {
  accent-color: #0f8276;
}

.property-register-page button {
  transition: transform 150ms ease, background 150ms ease, border-color 150ms ease;
}

.property-register-page button:hover:not(:disabled) {
  transform: translateY(-1px);
}

@media (max-width: 760px) {
  .property-register-page {
    padding-left: 0;
    padding-right: 0;
  }
}
`;

export default RegisterPropertyPage;
