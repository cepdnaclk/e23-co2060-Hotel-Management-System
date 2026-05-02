import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const fallbackPlans = [
  {
    plan_key: "standard",
    plan_name: "Normal Version",
    room_limit: 50,
    registration_fee: 5000,
    monthly_fee: 2500,
  },
  {
    plan_key: "premium",
    plan_name: "Premium Version",
    room_limit: 100,
    registration_fee: 8500,
    monthly_fee: 4000,
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
};

const card = {
  background: "#ffffff",
  border: "1px solid #bbf7d0",
  borderRadius: 22,
  padding: 22,
  boxShadow: "0 18px 50px rgba(5, 46, 28, 0.08)",
};

function PropertyManagementPage() {
  const { id } = useParams();
  const { user, isLoggedIn } = useAuth();

  const isPropertyVerified =
    sessionStorage.getItem(`property_verified_${id}`) === "true";

  const logoInputRef = useRef(null);
  const mainPhotoInputRef = useRef(null);
  const introPhotoOneInputRef = useRef(null);
  const introPhotoTwoInputRef = useRef(null);
  const addRoomPhotoInputRef = useRef(null);

  const [property, setProperty] = useState(null);
  const [plans, setPlans] = useState(fallbackPlans);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [detailsForm, setDetailsForm] = useState({
    name: "",
    city: "",
    district: "",
    address: "",
    description: "",
    quote: "",
    logo_url: "",
    hero_title: "",
    theme_color: "#0f7a43",
    property_type: "Hotel",
  });

  const [roomForm, setRoomForm] = useState({ ...emptyRoom });
  const [editRoomForms, setEditRoomForms] = useState({});

  const [selectedPlan, setSelectedPlan] = useState("");

  const [addRoomPhotoFile, setAddRoomPhotoFile] = useState(null);
  const [addRoomPhotoPreview, setAddRoomPhotoPreview] = useState("");

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingMainPhoto, setUploadingMainPhoto] = useState(false);
  const [uploadingIntroPhotoIndex, setUploadingIntroPhotoIndex] = useState(null);
  const [uploadingRoomId, setUploadingRoomId] = useState(null);

  useEffect(() => {
    loadEverything();
  }, [id]);

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

  if (!isPropertyVerified) {
    return <Navigate to={`/partner/property-login/${id}`} />;
  }

  const loadEverything = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [propertyRes, plansRes] = await Promise.all([
        api.get(`/partner/properties/${id}`),
        api.get("/partner/plans").catch(() => ({ data: { data: [] } })),
      ]);

      const propertyData = propertyRes.data.data;
      const activePlans = plansRes.data.data || [];

      setProperty(propertyData);
      setPlans(activePlans.length > 0 ? activePlans : fallbackPlans);
      setSelectedPlan(propertyData.plan_type || "");

      setDetailsForm({
        name: propertyData.name || "",
        city: propertyData.city || "",
        district: propertyData.district || "",
        address: propertyData.address || "",
        description: propertyData.description || "",
        quote: propertyData.quote || "",
        logo_url: propertyData.logo_url || "",
        hero_title: propertyData.hero_title || "",
        theme_color: propertyData.theme_color || "#0f7a43",
        property_type: propertyData.property_type || "Hotel",
      });

      const roomEdits = {};

      (propertyData.rooms || []).forEach((room) => {
        roomEdits[room.id] = {
          room_type: room.room_type || "",
          capacity: room.capacity || "",
          base_occupancy: room.base_occupancy || "",
          price_per_night: room.price_per_night || "",
          price_per_day: room.price_per_day || "",
          extra_person_price: room.extra_person_price || "",
          total_rooms: room.total_rooms || "",
          available_rooms: room.available_rooms || "",
        };
      });

      setEditRoomForms(roomEdits);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load property");
    } finally {
      setLoading(false);
    }
  };

  const showResult = (ok, text) => {
    setMessage(ok ? text : "");
    setError(ok ? "" : text);
  };

  const formatMoney = (value) => {
    return `Rs. ${Number(value || 0).toLocaleString("en-LK")}`;
  };

  const formatDate = (value) => {
    if (!value) return "Not set";

    return new Date(value).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getIntroPhotoByIndex = (index) => {
    const introPhotos = (property?.photos || []).filter((photo) => !photo.is_main);
    return introPhotos[index]?.image_url || "";
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

  const uploadFile = async (url, file) => {
    const imageError = validateImageFile(file);

    if (imageError) {
      throw new Error(imageError);
    }

    const formData = new FormData();
    formData.append("image", file);

    await api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  };

  const handleDetailsChange = (e) => {
    setDetailsForm({ ...detailsForm, [e.target.name]: e.target.value });
  };

  const handleRoomChange = (e) => {
    setRoomForm({ ...roomForm, [e.target.name]: e.target.value });
  };

  const handleEditRoomChange = (roomId, e) => {
    setEditRoomForms({
      ...editRoomForms,
      [roomId]: {
        ...editRoomForms[roomId],
        [e.target.name]: e.target.value,
      },
    });
  };

  const updateDetails = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.put(`/partner/properties/${id}`, detailsForm);
      await loadEverything();

      showResult(true, "Property details updated successfully.");
    } catch (err) {
      showResult(false, err.response?.data?.message || "Failed to update details");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file) => {
    if (!file) return;

    try {
      setUploadingLogo(true);
      await uploadFile(`/partner/properties/${id}/upload-logo`, file);
      await loadEverything();
      showResult(true, "Logo uploaded successfully.");
    } catch (err) {
      showResult(false, err.message || err.response?.data?.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const uploadMainPhoto = async (file) => {
    if (!file) return;

    try {
      setUploadingMainPhoto(true);
      await uploadFile(`/partner/properties/${id}/upload-main-photo`, file);
      await loadEverything();
      showResult(true, "Main photo uploaded successfully.");
    } catch (err) {
      showResult(
        false,
        err.message || err.response?.data?.message || "Failed to upload main photo"
      );
    } finally {
      setUploadingMainPhoto(false);
    }
  };

  const uploadIntroPhoto = async (file, slotNumber) => {
    if (!file) return;

    try {
      setUploadingIntroPhotoIndex(slotNumber);

      const imageError = validateImageFile(file);

      if (imageError) {
        setError(imageError);
        return;
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("slot", String(slotNumber));

      await api.post(`/partner/properties/${id}/upload-intro-photo`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await loadEverything();
      showResult(true, `Intro photo ${slotNumber} uploaded successfully.`);
    } catch (err) {
      showResult(
        false,
        err.response?.data?.message || "Failed to upload intro photo"
      );
    } finally {
      setUploadingIntroPhotoIndex(null);
    }
  };

  const selectAddRoomPhoto = (file) => {
    const imageError = validateImageFile(file);

    if (imageError) {
      setError(imageError);
      return;
    }

    setError("");
    setAddRoomPhotoFile(file || null);
    setAddRoomPhotoPreview(file ? URL.createObjectURL(file) : "");
  };

  const removeAddRoomPhoto = () => {
    setAddRoomPhotoFile(null);
    setAddRoomPhotoPreview("");
  };

  const payRegistration = async () => {
    if (!window.confirm("Mark registration fee as paid?")) return;

    try {
      await api.post(`/partner/properties/${id}/pay-registration`, {
        payment_method_id: null,
      });

      await loadEverything();
      showResult(true, "Registration fee paid successfully.");
    } catch (err) {
      showResult(
        false,
        err.response?.data?.message || "Failed to pay registration fee"
      );
    }
  };

  const payMonthly = async () => {
    if (!window.confirm("Pay monthly charge for this property?")) return;

    try {
      await api.post(`/partner/properties/${id}/pay-monthly`, {
        payment_method_id: null,
      });

      await loadEverything();
      showResult(true, "Monthly payment successful. New cycle started today.");
    } catch (err) {
      showResult(false, err.response?.data?.message || "Failed to pay monthly fee");
    }
  };

  const changePlan = async () => {
    if (!property) return;

    if (selectedPlan === property.plan_type) {
      showResult(false, "Please choose a different version first.");
      return;
    }

    const newPlan = plans.find((plan) => plan.plan_key === selectedPlan);

    if (!newPlan) {
      showResult(false, "Selected version is not valid.");
      return;
    }

    if (totalRooms > Number(newPlan.room_limit || 0)) {
      showResult(
        false,
        `${newPlan.plan_name} allows only ${newPlan.room_limit} rooms. This property currently has ${totalRooms} rooms.`
      );
      return;
    }

    if (
      !window.confirm(
        "Changing version starts a new monthly cycle from today. Until the monthly charge is paid, this property may not display publicly. Continue?"
      )
    ) {
      return;
    }

    try {
      await api.put(`/partner/properties/${id}/change-plan`, {
        plan_type: selectedPlan,
      });

      await loadEverything();

      showResult(
        true,
        "Version changed successfully. Monthly started date reset from today."
      );
    } catch (err) {
      showResult(false, err.response?.data?.message || "Failed to change version");
    }
  };

  const addRoom = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(`/partner/properties/${id}/rooms`, {
        ...roomForm,
        capacity: Number(roomForm.capacity),
        base_occupancy: Number(roomForm.base_occupancy),
        price_per_night: Number(roomForm.price_per_night),
        price_per_day: roomForm.price_per_day
          ? Number(roomForm.price_per_day)
          : null,
        extra_person_price: Number(roomForm.extra_person_price || 0),
        total_rooms: Number(roomForm.total_rooms),
      });

      if (addRoomPhotoFile) {
        await uploadFile(
          `/partner/rooms/${response.data.room_id}/upload-photo`,
          addRoomPhotoFile
        );
      }

      setRoomForm({ ...emptyRoom });
      removeAddRoomPhoto();

      await loadEverything();

      showResult(true, "Room added successfully.");
    } catch (err) {
      showResult(false, err.message || err.response?.data?.message || "Failed to add room");
    }
  };

  const updateRoom = async (roomId) => {
    try {
      const form = editRoomForms[roomId];

      await api.put(`/partner/rooms/${roomId}`, {
        ...form,
        capacity: Number(form.capacity),
        base_occupancy: Number(form.base_occupancy),
        price_per_night: Number(form.price_per_night),
        price_per_day: form.price_per_day ? Number(form.price_per_day) : null,
        extra_person_price: Number(form.extra_person_price || 0),
        total_rooms: Number(form.total_rooms),
        available_rooms: Number(form.available_rooms),
      });

      await loadEverything();

      showResult(true, "Room updated successfully.");
    } catch (err) {
      showResult(false, err.response?.data?.message || "Failed to update room");
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm("Remove this room type?")) return;

    try {
      await api.delete(`/partner/rooms/${roomId}`);
      await loadEverything();
      showResult(true, "Room removed successfully.");
    } catch (err) {
      showResult(false, err.response?.data?.message || "Failed to remove room");
    }
  };

  const uploadRoomPhoto = async (roomId, file) => {
    if (!file) return;

    try {
      setUploadingRoomId(roomId);

      await uploadFile(`/partner/rooms/${roomId}/upload-photo`, file);
      await loadEverything();

      showResult(true, "Room photo uploaded successfully.");
    } catch (err) {
      showResult(
        false,
        err.message || err.response?.data?.message || "Failed to upload room photo"
      );
    } finally {
      setUploadingRoomId(null);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card">Loading property management...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="page">
        <div className="card">Property not found.</div>
      </div>
    );
  }

  const totalRooms = (property.rooms || []).reduce(
    (sum, room) => sum + Number(room.total_rooms || 0),
    0
  );

  const currentPlan =
    plans.find((plan) => plan.plan_key === property.plan_type) || plans[0];

  const inFreeMonth = property.monthly_payment_status === "Free Trial";

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
          <p style={styles.eyebrow}>Property Management</p>
          <h1 style={styles.title}>{property.name}</h1>
          <p style={styles.subtitle}>
            Update property details, upload photos using drag and drop, manage rooms,
            payments, and active property versions.
          </p>
        </div>

        {message && <div style={styles.successBox}>{message}</div>}
        {error && <div style={styles.errorBox}>{error}</div>}

        <section style={styles.statsGrid}>
          <div style={card}>
            <span style={styles.muted}>Current version</span>
            <h2 style={styles.statTitle}>
              {currentPlan?.plan_name || property.plan_type}
            </h2>
            <p style={styles.text}>
              {totalRooms} / {property.room_limit} rooms
            </p>
          </div>

          <div style={card}>
            <span style={styles.muted}>Registration payment</span>
            <h2 style={styles.statTitle}>
              {property.registration_payment_status}
            </h2>
            <p style={styles.text}>{formatMoney(property.registration_fee)}</p>
          </div>

          <div style={card}>
            <span style={styles.muted}>Monthly payment</span>
            <h2 style={styles.statTitle}>{property.monthly_payment_status}</h2>
            <p style={styles.text}>
              {inFreeMonth
                ? "First month free"
                : `Due: ${formatDate(property.next_monthly_due_date)}`}
            </p>
          </div>
        </section>

        <section style={{ ...card, marginBottom: 18 }}>
          <h2 style={styles.sectionTitle}>Payment and version control</h2>
          <p style={styles.text}>
            First month after registration is free. When the due date passes, the
            property is hidden until the monthly charge is paid.
          </p>

          <div style={styles.grid}>
            <button type="button" onClick={payRegistration} style={styles.primaryBtn}>
              Pay registration fee
            </button>

            <button type="button" onClick={payMonthly} style={styles.primaryBtn}>
              Pay monthly charge
            </button>
          </div>

          <div style={styles.grid}>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              style={styles.input}
            >
              {plans.map((plan) => (
                <option key={plan.plan_key} value={plan.plan_key}>
                  {plan.plan_name} - {plan.room_limit} rooms - Rs.{" "}
                  {Number(plan.monthly_fee || 0).toLocaleString()} monthly
                </option>
              ))}
            </select>

            <button type="button" onClick={changePlan} style={styles.warningBtn}>
              Change version
            </button>
          </div>
        </section>

        <section style={{ ...card, marginBottom: 18 }}>
          <h2 style={styles.sectionTitle}>Hotel page details</h2>

          <form onSubmit={updateDetails}>
            <div style={styles.grid}>
              <input
                name="name"
                value={detailsForm.name}
                onChange={handleDetailsChange}
                placeholder="Property name"
                style={styles.input}
              />

              <select
                name="property_type"
                value={detailsForm.property_type}
                onChange={handleDetailsChange}
                style={styles.input}
              >
                <option>Hotel</option>
                <option>Resort</option>
                <option>Villa</option>
                <option>Guesthouse</option>
              </select>

              <input
                name="city"
                value={detailsForm.city}
                onChange={handleDetailsChange}
                placeholder="City"
                style={styles.input}
              />

              <input
                name="district"
                value={detailsForm.district}
                onChange={handleDetailsChange}
                placeholder="District"
                style={styles.input}
              />

              <input
                name="hero_title"
                value={detailsForm.hero_title}
                onChange={handleDetailsChange}
                placeholder="Hero title"
                style={styles.input}
              />

              <input
                name="quote"
                value={detailsForm.quote}
                onChange={handleDetailsChange}
                placeholder="Quote"
                style={styles.input}
              />
            </div>

            <textarea
              name="address"
              value={detailsForm.address}
              onChange={handleDetailsChange}
              placeholder="Address"
              style={styles.textarea}
            />

            <textarea
              name="description"
              value={detailsForm.description}
              onChange={handleDetailsChange}
              placeholder="Description"
              style={styles.textarea}
            />

            <button disabled={saving} style={styles.primaryBtn}>
              {saving ? "Saving..." : "Save details"}
            </button>
          </form>
        </section>

        <section style={{ ...card, marginBottom: 18 }}>
          <h2 style={styles.sectionTitle}>Photos</h2>

          <p style={styles.text}>
            Upload the logo, main hotel photo, and the two intro photos shown on
            the public hotel details page. All photo boxes support drag and drop.
          </p>

          <div style={styles.grid}>
            <div
              style={styles.photoBox}
              onClick={() => logoInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                uploadLogo(e.dataTransfer.files?.[0]);
              }}
            >
              {property.logo_url ? (
                <img src={property.logo_url} alt="logo" style={styles.preview} />
              ) : (
                <>
                  <strong>Upload logo</strong>
                  <span>Click or drag and drop logo here</span>
                </>
              )}

              {uploadingLogo && <span>Uploading...</span>}

              <input
                ref={logoInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => uploadLogo(e.target.files?.[0])}
              />
            </div>

            <div
              style={styles.photoBox}
              onClick={() => mainPhotoInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                uploadMainPhoto(e.dataTransfer.files?.[0]);
              }}
            >
              {property.photos?.find((photo) => photo.is_main)?.image_url ? (
                <img
                  src={property.photos.find((photo) => photo.is_main)?.image_url}
                  alt="main"
                  style={styles.preview}
                />
              ) : (
                <>
                  <strong>Upload main hotel photo</strong>
                  <span>Click or drag and drop main photo here</span>
                </>
              )}

              {uploadingMainPhoto && <span>Uploading...</span>}

              <input
                ref={mainPhotoInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => uploadMainPhoto(e.target.files?.[0])}
              />
            </div>

            <div
              style={styles.photoBox}
              onClick={() => introPhotoOneInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                uploadIntroPhoto(e.dataTransfer.files?.[0], 1);
              }}
            >
              {getIntroPhotoByIndex(0) ? (
                <img
                  src={getIntroPhotoByIndex(0)}
                  alt="Intro photo 1"
                  style={styles.preview}
                />
              ) : (
                <>
                  <strong>Upload intro photo 1</strong>
                  <span>This appears in the first intro photo box.</span>
                  <span>Click or drag and drop intro photo here</span>
                </>
              )}

              {uploadingIntroPhotoIndex === 1 && <span>Uploading...</span>}

              <input
                ref={introPhotoOneInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => uploadIntroPhoto(e.target.files?.[0], 1)}
              />
            </div>

            <div
              style={styles.photoBox}
              onClick={() => introPhotoTwoInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                uploadIntroPhoto(e.dataTransfer.files?.[0], 2);
              }}
            >
              {getIntroPhotoByIndex(1) ? (
                <img
                  src={getIntroPhotoByIndex(1)}
                  alt="Intro photo 2"
                  style={styles.preview}
                />
              ) : (
                <>
                  <strong>Upload intro photo 2</strong>
                  <span>This appears in the second intro photo box.</span>
                  <span>Click or drag and drop second intro photo here</span>
                </>
              )}

              {uploadingIntroPhotoIndex === 2 && <span>Uploading...</span>}

              <input
                ref={introPhotoTwoInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => uploadIntroPhoto(e.target.files?.[0], 2)}
              />
            </div>
          </div>
        </section>

        <section style={{ ...card, marginBottom: 18 }}>
          <h2 style={styles.sectionTitle}>
            Rooms total: {totalRooms} / {property.room_limit}
          </h2>

          <form onSubmit={addRoom} style={styles.addRoomForm}>
            <h3 style={{ marginTop: 0 }}>Add new room type</h3>

            <div style={styles.grid}>
              <input
                name="room_type"
                value={roomForm.room_type}
                onChange={handleRoomChange}
                placeholder="Room type"
                style={styles.input}
              />

              <input
                name="capacity"
                type="number"
                value={roomForm.capacity}
                onChange={handleRoomChange}
                placeholder="Max guests"
                style={styles.input}
              />

              <input
                name="base_occupancy"
                type="number"
                value={roomForm.base_occupancy}
                onChange={handleRoomChange}
                placeholder="Base guests"
                style={styles.input}
              />

              <input
                name="total_rooms"
                type="number"
                value={roomForm.total_rooms}
                onChange={handleRoomChange}
                placeholder="Total rooms"
                style={styles.input}
              />

              <input
                name="price_per_night"
                type="number"
                value={roomForm.price_per_night}
                onChange={handleRoomChange}
                placeholder="Night price"
                style={styles.input}
              />

              <input
                name="price_per_day"
                type="number"
                value={roomForm.price_per_day}
                onChange={handleRoomChange}
                placeholder="Day price"
                style={styles.input}
              />

              <input
                name="extra_person_price"
                type="number"
                value={roomForm.extra_person_price}
                onChange={handleRoomChange}
                placeholder="Extra person price"
                style={styles.input}
              />

              <input
                name="image_url"
                value={roomForm.image_url}
                onChange={handleRoomChange}
                placeholder="Room photo URL optional"
                style={styles.input}
              />
            </div>

            <div
              style={styles.roomDropBox}
              onClick={() => addRoomPhotoInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                selectAddRoomPhoto(e.dataTransfer.files?.[0]);
              }}
            >
              {addRoomPhotoPreview ? (
                <>
                  <img
                    src={addRoomPhotoPreview}
                    alt="New room preview"
                    style={styles.roomPhotoPreview}
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAddRoomPhoto();
                    }}
                    style={styles.dangerBtn}
                  >
                    Remove selected photo
                  </button>
                </>
              ) : (
                <>
                  <strong>Upload room photo</strong>
                  <span>Click or drag and drop room photo here</span>
                </>
              )}

              <input
                ref={addRoomPhotoInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => selectAddRoomPhoto(e.target.files?.[0])}
              />
            </div>

            <button style={styles.primaryBtn}>Add room</button>
          </form>

          {(property.rooms || []).map((room) => (
            <div key={room.id} style={styles.roomEditCard}>
              <div>
                <div
                  style={styles.existingRoomPhotoBox}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    uploadRoomPhoto(room.id, e.dataTransfer.files?.[0]);
                  }}
                >
                  {room.main_image ? (
                    <img
                      src={room.main_image}
                      alt={room.room_type}
                      style={styles.roomImage}
                    />
                  ) : (
                    <div style={styles.noImage}>Room photo</div>
                  )}

                  <label style={styles.smallUploadButton}>
                    {uploadingRoomId === room.id ? "Uploading..." : "Choose photo"}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => uploadRoomPhoto(room.id, e.target.files?.[0])}
                    />
                  </label>

                  <small style={styles.dragText}>or drag and drop here</small>
                </div>
              </div>

              <div>
                <h3>{room.room_type}</h3>

                <div style={styles.grid}>
                  <input
                    name="room_type"
                    value={editRoomForms[room.id]?.room_type || ""}
                    onChange={(e) => handleEditRoomChange(room.id, e)}
                    style={styles.input}
                  />

                  <input
                    name="capacity"
                    type="number"
                    value={editRoomForms[room.id]?.capacity || ""}
                    onChange={(e) => handleEditRoomChange(room.id, e)}
                    style={styles.input}
                  />

                  <input
                    name="base_occupancy"
                    type="number"
                    value={editRoomForms[room.id]?.base_occupancy || ""}
                    onChange={(e) => handleEditRoomChange(room.id, e)}
                    style={styles.input}
                  />

                  <input
                    name="total_rooms"
                    type="number"
                    value={editRoomForms[room.id]?.total_rooms || ""}
                    onChange={(e) => handleEditRoomChange(room.id, e)}
                    style={styles.input}
                  />

                  <input
                    name="available_rooms"
                    type="number"
                    value={editRoomForms[room.id]?.available_rooms || ""}
                    onChange={(e) => handleEditRoomChange(room.id, e)}
                    style={styles.input}
                  />

                  <input
                    name="price_per_night"
                    type="number"
                    value={editRoomForms[room.id]?.price_per_night || ""}
                    onChange={(e) => handleEditRoomChange(room.id, e)}
                    style={styles.input}
                  />

                  <input
                    name="price_per_day"
                    type="number"
                    value={editRoomForms[room.id]?.price_per_day || ""}
                    onChange={(e) => handleEditRoomChange(room.id, e)}
                    style={styles.input}
                  />

                  <input
                    name="extra_person_price"
                    type="number"
                    value={editRoomForms[room.id]?.extra_person_price || ""}
                    onChange={(e) => handleEditRoomChange(room.id, e)}
                    style={styles.input}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => updateRoom(room.id)}
                  style={styles.primaryBtn}
                >
                  Update room
                </button>{" "}

                <button
                  type="button"
                  onClick={() => deleteRoom(room.id)}
                  style={styles.dangerBtn}
                >
                  Remove room
                </button>
              </div>
            </div>
          ))}
        </section>
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

  muted: {
    color: "#64748b",
    fontWeight: 800,
  },

  text: {
    color: "#64748b",
    fontWeight: 700,
    lineHeight: 1.5,
  },

  statTitle: {
    color: "#052e1c",
    marginBottom: 6,
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

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: 16,
    marginBottom: 18,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 14,
    marginBottom: 14,
  },

  input: {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    fontSize: 15,
    outline: "none",
  },

  textarea: {
    width: "100%",
    minHeight: 90,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    fontSize: 15,
    marginBottom: 14,
    resize: "vertical",
    outline: "none",
  },

  primaryBtn: {
    padding: "12px 17px",
    borderRadius: 14,
    border: "none",
    color: "#ffffff",
    background: "#0f7a43",
    fontWeight: 900,
    cursor: "pointer",
  },

  warningBtn: {
    padding: "12px 17px",
    borderRadius: 14,
    border: "none",
    color: "#ffffff",
    background: "#92400e",
    fontWeight: 900,
    cursor: "pointer",
  },

  dangerBtn: {
    padding: "12px 17px",
    borderRadius: 14,
    border: "none",
    color: "#ffffff",
    background: "#dc2626",
    fontWeight: 900,
    cursor: "pointer",
  },

  photoBox: {
    minHeight: 190,
    border: "2px dashed #86efac",
    borderRadius: 20,
    padding: 16,
    display: "grid",
    placeItems: "center",
    gap: 8,
    cursor: "pointer",
    background: "#f0fdf4",
    color: "#166534",
    textAlign: "center",
  },

  preview: {
    width: "100%",
    maxHeight: 190,
    objectFit: "cover",
    borderRadius: 16,
    border: "1px solid #bbf7d0",
  },

  addRoomForm: {
    border: "1px dashed #86efac",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    background: "#f8fafc",
  },

  roomDropBox: {
    minHeight: 145,
    border: "2px dashed #86efac",
    borderRadius: 18,
    padding: 16,
    display: "grid",
    placeItems: "center",
    gap: 8,
    textAlign: "center",
    cursor: "pointer",
    background: "#f0fdf4",
    color: "#166534",
    marginBottom: 14,
  },

  roomPhotoPreview: {
    width: 240,
    maxWidth: "100%",
    height: 140,
    objectFit: "cover",
    borderRadius: 16,
    border: "1px solid #bbf7d0",
  },

  roomEditCard: {
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    gap: 16,
    border: "1px solid #bbf7d0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    background: "#ffffff",
  },

  existingRoomPhotoBox: {
    border: "2px dashed #86efac",
    borderRadius: 18,
    padding: 10,
    background: "#f0fdf4",
    textAlign: "center",
    color: "#166534",
  },

  roomImage: {
    width: "100%",
    height: 130,
    objectFit: "cover",
    borderRadius: 16,
    marginBottom: 10,
  },

  noImage: {
    width: "100%",
    height: 130,
    borderRadius: 16,
    background: "#e2e8f0",
    display: "grid",
    placeItems: "center",
    color: "#64748b",
    marginBottom: 10,
    fontWeight: 800,
  },

  smallUploadButton: {
    display: "inline-block",
    padding: "9px 12px",
    borderRadius: 12,
    background: "#0f7a43",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
    marginBottom: 6,
  },

  dragText: {
    display: "block",
    color: "#166534",
    fontWeight: 800,
  },
};

export default PropertyManagementPage;
