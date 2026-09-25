import ContentImage from "../../components/ContentImage";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { usePreferences } from "../../context/PreferencesContext";
import PaymentModal from "../../components/PaymentModal";

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

const languageOptions = [
  "English",
  "Sinhala",
  "Tamil",
  "Hindi",
  "French",
  "German",
  "Chinese",
  "Japanese",
];

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
  languages: [
    "English",
  ],
  experience_years: "1",
  license_number: "",
  nic_or_passport: "",
  phone: "",
  email: "",
  whatsapp_number: "",
  price_per_day: "",
  price_per_hour: "",
  availability:
    "Weekdays and weekends with prior booking",
  services: [
    "City walking tours",
  ],
  specialities: [
    "First-time traveller support",
  ],
  short_description: "",
  bio: "",
  image_url: "",
};

const listToText = (
  items
) =>
  Array.isArray(items)
    ? items.join("\n")
    : "";

const formatDate = (
  value
) => {
  if (!value) {
    return "Not set";
  }

  return String(value).slice(
    0,
    10
  );
};

function PartnerGuideRegistrationPage() {
  const {
    user,
    isLoggedIn,
  } = useAuth();

  const {
    currency,
    currencies,
    formatMoney,
  } = usePreferences();

  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const editId =
    searchParams.get(
      "edit"
    );

  const guideImageInputRef =
    useRef(null);

  const [
    form,
    setForm,
  ] = useState(
    initialForm
  );

  const [
    priceCurrency,
    setPriceCurrency,
  ] = useState(
    currency || "LKR"
  );

  const [
    guides,
    setGuides,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    paymentRequest,
    setPaymentRequest,
  ] = useState(null);

  const isEditing =
    Boolean(editId);

  const priceCurrencyOption =
    currencies.find(
      (item) =>
        item.value ===
        priceCurrency
    ) ||
    currencies[0];

  const convertLkrToSelectedCurrency =
    (amount) => {
      if (
        amount === "" ||
        amount === null ||
        amount ===
          undefined
      ) {
        return "";
      }

      const converted =
        Number(
          amount || 0
        ) *
        Number(
          priceCurrencyOption
            .rate || 1
        );

      if (
        !Number.isFinite(
          converted
        )
      ) {
        return "";
      }

      if (
        priceCurrencyOption
          .value === "LKR"
      ) {
        return String(
          Math.round(
            converted
          )
        );
      }

      return converted.toFixed(
        2
      );
    };

  const convertSelectedCurrencyToLkr =
    (amount) => {
      if (
        amount === "" ||
        amount === null ||
        amount ===
          undefined
      ) {
        return "";
      }

      const numericValue =
        Number(amount);

      const rate =
        Number(
          priceCurrencyOption
            .rate || 1
        );

      if (
        !Number.isFinite(
          numericValue
        ) ||
        !Number.isFinite(
          rate
        ) ||
        rate <= 0
      ) {
        return "";
      }

      return String(
        Math.round(
          numericValue /
            rate
        )
      );
    };

  const updatePriceField = (
    name,
    value
  ) => {
    updateField(
      name,
      convertSelectedCurrencyToLkr(
        value
      )
    );
  };

  const previewPrice = (
    value
  ) => {
    if (!value) {
      return "";
    }

    return `${formatMoney(
      value
    )} saved to system`;
  };

  useEffect(() => {
    setPriceCurrency(
      currency ||
        "LKR"
    );
  }, [currency]);

  const loadGuides =
    async () => {
      try {
        const response =
          await api.get(
            "/partner/guides"
          );

        setGuides(
          response.data
            .guides || []
        );
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Failed to load your guide profiles"
        );
      }
    };

  const loadEditGuide =
    async () => {
      if (!editId) {
        return;
      }

      try {
        setLoading(true);

        const response =
          await api.get(
            `/partner/guides/${editId}`
          );

        const guide =
          response.data.guide;

        setForm({
          full_name:
            guide.full_name ||
            "",

          display_name:
            guide.display_name ||
            "",

          guide_type:
            guide.guide_type ||
            "Heritage",

          city:
            guide.city ||
            "",

          district:
            guide.district ||
            "",

          base_location:
            guide.base_location ||
            "",

          languages:
            guide.languages
              ?.length
              ? guide.languages
              : [
                  "English",
                ],

          experience_years:
            String(
              guide.experience_years ||
                0
            ),

          license_number:
            guide.license_number ||
            "",

          nic_or_passport:
            guide.nic_or_passport ||
            "",

          phone:
            guide.phone ||
            "",

          email:
            guide.email ||
            "",

          whatsapp_number:
            guide.whatsapp_number ||
            "",

          price_per_day:
            String(
              guide.price_per_day ||
                ""
            ),

          price_per_hour:
            String(
              guide.price_per_hour ||
                ""
            ),

          availability:
            guide.availability ||
            "",

          services:
            guide.services
              ?.length
              ? guide.services
              : [],

          specialities:
            guide.specialities
              ?.length
              ? guide.specialities
              : [],

          short_description:
            guide.short_description ||
            "",

          bio:
            guide.bio ||
            "",

          image_url:
            guide.image_url ||
            "",
        });
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Failed to load guide details"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (
      isLoggedIn &&
      user?.role ===
        "partner"
    ) {
      loadGuides();

      loadEditGuide();
    }
  }, [
    isLoggedIn,
    user,
    editId,
  ]);

  const stats =
    useMemo(() => {
      return {
        total:
          guides.length,

        pending:
          guides.filter(
            (guide) =>
              guide.status ===
              "pending"
          ).length,

        approved:
          guides.filter(
            (guide) =>
              guide.status ===
              "approved"
          ).length,

        rejected:
          guides.filter(
            (guide) =>
              guide.status ===
              "rejected"
          ).length,
      };
    }, [guides]);

  if (!isLoggedIn) {
    return (
      <Navigate to="/partner/login" />
    );
  }

  if (
    user?.role !==
    "partner"
  ) {
    return (
      <main className="partner-guide-page">
        <style>
          {guideFormCss}
        </style>

        <div className="guide-alert error">
          This page is only
          for partners.
        </div>
      </main>
    );
  }

  const updateField = (
    name,
    value
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const toggleListValue = (
    name,
    value
  ) => {
    setForm(
      (previous) => {
        const current =
          previous[name] ||
          [];

        return {
          ...previous,

          [name]:
            current.includes(
              value
            )
              ? current.filter(
                  (item) =>
                    item !==
                    value
                )
              : [
                  ...current,
                  value,
                ],
        };
      }
    );
  };

  const uploadImage =
    async (file) => {
      if (!file) {
        return;
      }

      const data =
        new FormData();

      data.append(
        "image",
        file
      );

      try {
        setUploading(true);

        setError("");

        const response =
          await api.post(
            "/partner/guides/upload-image",
            data,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        updateField(
          "image_url",
          response.data
            .image_url
        );

        setMessage(
          "Guide profile photo uploaded successfully."
        );
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Image upload failed"
        );
      } finally {
        setUploading(false);
      }
    };

  /* GUIDE PHOTO:
     USED BY BOTH DRAG/DROP
     AND CHOOSE FILE */

  const selectGuideImage = (
    file
  ) => {
    if (!file) {
      return;
    }

    if (
      !String(
        file.type ||
          ""
      ).startsWith(
        "image/"
      )
    ) {
      setError(
        "Please choose an image file."
      );

      return;
    }

    uploadImage(file);
  };

  const buildPayload =
    () => ({
      ...form,

      languages:
        listToText(
          form.languages
        ),

      services:
        listToText(
          form.services
        ),

      specialities:
        listToText(
          form.specialities
        ),
    });

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);

        setMessage("");

        setError("");

        if (isEditing) {
          await api.put(
            `/partner/guides/${editId}`,
            buildPayload()
          );

          setMessage(
            "Guide profile updated and resubmitted for admin approval."
          );
        } else {
          await api.post(
            "/partner/guides",
            buildPayload()
          );

          setMessage(
            "Guide profile submitted successfully. It is pending admin approval."
          );

          setForm(
            initialForm
          );
        }

        await loadGuides();
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Failed to save guide profile"
        );
      } finally {
        setSaving(false);
      }
    };

  const hideGuide =
    async (guideId) => {
      const confirmHide =
        window.confirm(
          "Hide this approved guide from the public Tourist Guides page?"
        );

      if (!confirmHide) {
        return;
      }

      try {
        await api.patch(
          `/partner/guides/${guideId}/status`,
          {
            status:
              "hidden",
          }
        );

        setMessage(
          "Guide profile hidden successfully."
        );

        await loadGuides();
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Failed to hide guide profile"
        );
      }
    };

  const payRegistrationFee =
    async (guide) => {
      setPaymentRequest({
        type:
          "registration",

        guide,

        title:
          "Guide registration fee",

        description:
          "Pay the guide registration fee before admin approval.",

        amount:
          guide.registration_fee,

        submitLabel:
          "Pay registration fee",
      });
    };

  const payPromotionFee =
    async (guide) => {
      setPaymentRequest({
        type:
          "promotion",

        guide,

        title:
          "Guide top-ad promotion",

        description:
          "Pay the optional top listing fee to keep this approved guide near the top.",

        amount:
          guide.promotion_fee,

        submitLabel:
          "Pay top-ad fee",
      });
    };

  const confirmGuidePayment =
    async ({
      gateway,
      card_last4,
    }) => {
      if (
        !paymentRequest?.guide
      ) {
        return;
      }

      try {
        setMessage("");

        setError("");

        if (
          paymentRequest.type ===
          "registration"
        ) {
          await api.post(
            `/partner/guides/${paymentRequest.guide.id}/pay-registration`,
            {
              payment_gateway:
                gateway,

              card_last4,
            }
          );

          setMessage(
            "Guide registration fee paid successfully. Admin can now approve this guide."
          );
        } else {
          await api.post(
            `/partner/guides/${paymentRequest.guide.id}/pay-promotion`,
            {
              payment_gateway:
                gateway,

              card_last4,
            }
          );

          setMessage(
            "Top-listing promotion paid successfully. Approved promoted guides appear before normal guides."
          );
        }

        setPaymentRequest(
          null
        );

        await loadGuides();
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Failed to complete guide payment"
        );

        throw err;
      }
    };

  const deleteGuide =
    async (guideId) => {
      const confirmDelete =
        window.confirm(
          "Are you sure you want to delete this guide profile?"
        );

      if (!confirmDelete) {
        return;
      }

      try {
        await api.delete(
          `/partner/guides/${guideId}`
        );

        setMessage(
          "Guide profile deleted successfully."
        );

        await loadGuides();

        if (
          String(editId) ===
          String(guideId)
        ) {
          navigate(
            "/partner/guides"
          );
        }
      } catch (err) {
        setError(
          err.response?.data
            ?.message ||
            "Failed to delete guide profile"
        );
      }
    };

  return (
    <main className="partner-guide-page">
      <style>
        {guideFormCss}
      </style>

      <PaymentModal
        open={
          Boolean(
            paymentRequest
          )
        }
        title={
          paymentRequest?.title
        }
        description={
          paymentRequest?.description
        }
        amount={
          paymentRequest?.amount ||
          0
        }
        reference={
          paymentRequest
            ?.guide
            ?.display_name ||
          ""
        }
        submitLabel={
          paymentRequest?.submitLabel ||
          "Pay now"
        }
        onClose={() =>
          setPaymentRequest(
            null
          )
        }
        onConfirm={
          confirmGuidePayment
        }
      />

      <section className="guide-form-hero">
        <div>
          <span className="guide-pill">
            Partner Guide
            Portal
          </span>

          <h1>
            Become a verified
            tourist guider.
          </h1>

          <p>
            Add your guide
            profile, languages,
            services, pricing,
            and travel
            expertise. Pay the
            registration fee
            before admin
            approval, then
            optionally promote
            your approved ad
            near the top.
          </p>

          <div className="guide-hero-actions">
            <Link to="/partner/dashboard">
              ← Back to
              Dashboard
            </Link>

            <Link to="/tourist-guides">
              View Public
              Guides
            </Link>
          </div>
        </div>

        <div className="guide-stat-card-wrap">
          <div className="guide-stat-card">
            <span>
              Total
            </span>

            <strong>
              {
                stats.total
              }
            </strong>
          </div>

          <div className="guide-stat-card">
            <span>
              Pending
            </span>

            <strong>
              {
                stats.pending
              }
            </strong>
          </div>

          <div className="guide-stat-card">
            <span>
              Approved
            </span>

            <strong>
              {
                stats.approved
              }
            </strong>
          </div>

          <div className="guide-stat-card">
            <span>
              Rejected
            </span>

            <strong>
              {
                stats.rejected
              }
            </strong>
          </div>
        </div>
      </section>

      {message && (
        <div className="guide-alert success">
          {message}
        </div>
      )}

      {error && (
        <div className="guide-alert error">
          {error}
        </div>
      )}

      <section className="guide-main-grid">
        <form
          className="guide-form-card"
          onSubmit={
            handleSubmit
          }
        >
          <div className="guide-form-head">
            <div>
              <span>
                {isEditing
                  ? "Edit Guide"
                  : "New Guide Profile"}
              </span>

              <h2>
                {isEditing
                  ? "Update guider details"
                  : "Register as a guider"}
              </h2>
            </div>

            {isEditing && (
              <Link
                to="/partner/guides"
                className="new-guide-link"
              >
                + New Guide
              </Link>
            )}
          </div>

          {loading ? (
            <div className="guide-empty">
              Loading guide
              details...
            </div>
          ) : (
            <>
              {/* PROFILE PHOTO:
                  DRAG & DROP +
                  CHOOSE FILE */}

              <div
                className={`guide-photo-panel${
                  uploading
                    ? " uploading"
                    : ""
                }`}
                onDragOver={(
                  event
                ) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onDrop={(
                  event
                ) => {
                  event.preventDefault();
                  event.stopPropagation();

                  selectGuideImage(
                    event.dataTransfer
                      .files?.[0]
                  );
                }}
              >
                <div className="guide-photo-preview">
                  {form.image_url ? (
                    <ContentImage
                      src={
                        form.image_url
                      }
                      alt="Guide preview"
                    />
                  ) : (
                    <span>
                      👤
                    </span>
                  )}
                </div>

                <div className="guide-photo-upload-copy">
                  <h3>
                    Profile Photo
                  </h3>

                  <p>
                    Upload a clear
                    friendly photo.
                    This will appear
                    on the public
                    tourist guide
                    page after
                    approval.
                  </p>

                  <div className="guide-photo-drop-message">
                    <strong>
                      Drag and drop
                      your photo
                      here
                    </strong>

                    <span>
                      or choose a
                      file from
                      your device
                    </span>
                  </div>

                  <button
                    type="button"
                    className="guide-photo-choose-button"
                    disabled={
                      uploading
                    }
                    onClick={() =>
                      guideImageInputRef.current?.click()
                    }
                  >
                    {uploading
                      ? "Uploading..."
                      : "Choose file"}
                  </button>

                  <input
                    ref={
                      guideImageInputRef
                    }
                    className="guide-photo-file-input"
                    type="file"
                    accept="image/*"
                    onChange={(
                      event
                    ) =>
                      selectGuideImage(
                        event.target
                          .files?.[0]
                      )
                    }
                  />

                  {uploading && (
                    <small>
                      Uploading
                      image...
                    </small>
                  )}
                </div>
              </div>

              <div className="form-grid two">
                <label>
                  <span>
                    Legal full
                    name *
                  </span>

                  <input
                    value={
                      form.full_name
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "full_name",
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Display name *
                  </span>

                  <input
                    value={
                      form.display_name
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "display_name",
                        e.target
                          .value
                      )
                    }
                    placeholder="Example: Kandy Heritage Guide"
                  />
                </label>

                <label>
                  <span>
                    Guide type *
                  </span>

                  <select
                    value={
                      form.guide_type
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "guide_type",
                        e.target
                          .value
                      )
                    }
                  >
                    {guideTypes.map(
                      (item) => (
                        <option
                          key={
                            item
                          }
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    Experience
                    years
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.experience_years
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "experience_years",
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    City *
                  </span>

                  <input
                    value={
                      form.city
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "city",
                        e.target
                          .value
                      )
                    }
                    placeholder="Example: Kandy"
                  />
                </label>

                <label>
                  <span>
                    District
                  </span>

                  <input
                    value={
                      form.district
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "district",
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <label className="full">
                  <span>
                    Base location
                    / meeting
                    point
                  </span>

                  <input
                    value={
                      form.base_location
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "base_location",
                        e.target
                          .value
                      )
                    }
                    placeholder="Example: Near Kandy railway station"
                  />
                </label>
              </div>

              <div className="check-section">
                <h3>
                  Languages *
                </h3>

                <div className="check-grid">
                  {languageOptions.map(
                    (item) => (
                      <label
                        key={
                          item
                        }
                        className="check-card"
                      >
                        <input
                          type="checkbox"
                          checked={
                            form.languages.includes(
                              item
                            )
                          }
                          onChange={() =>
                            toggleListValue(
                              "languages",
                              item
                            )
                          }
                        />

                        <span>
                          {item}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="form-grid two">
                <label>
                  <span>
                    Contact phone *
                  </span>

                  <input
                    value={
                      form.phone
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "phone",
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Email *
                  </span>

                  <input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "email",
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    WhatsApp
                    number
                  </span>

                  <input
                    value={
                      form.whatsapp_number
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "whatsapp_number",
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    License number
                  </span>

                  <input
                    value={
                      form.license_number
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "license_number",
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    NIC / Passport
                  </span>

                  <input
                    value={
                      form.nic_or_passport
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "nic_or_passport",
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Availability
                  </span>

                  <input
                    value={
                      form.availability
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "availability",
                        e.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Price currency
                  </span>

                  <select
                    value={
                      priceCurrency
                    }
                    onChange={(
                      e
                    ) =>
                      setPriceCurrency(
                        e.target
                          .value
                      )
                    }
                  >
                    {currencies.map(
                      (item) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    Price per day{" "}
                    {
                      priceCurrencyOption.label
                    }
                  </span>

                  <input
                    type="number"
                    min="0"
                    step={
                      priceCurrencyOption.value ===
                      "LKR"
                        ? "1"
                        : "0.01"
                    }
                    value={
                      convertLkrToSelectedCurrency(
                        form.price_per_day
                      )
                    }
                    onChange={(
                      e
                    ) =>
                      updatePriceField(
                        "price_per_day",
                        e.target
                          .value
                      )
                    }
                    placeholder={`Daily cost in ${priceCurrencyOption.label}`}
                  />

                  {form.price_per_day && (
                    <small>
                      {previewPrice(
                        form.price_per_day
                      )}
                    </small>
                  )}
                </label>

                <label>
                  <span>
                    Price per one
                    hour{" "}
                    {
                      priceCurrencyOption.label
                    }
                  </span>

                  <input
                    type="number"
                    min="0"
                    step={
                      priceCurrencyOption.value ===
                      "LKR"
                        ? "1"
                        : "0.01"
                    }
                    value={
                      convertLkrToSelectedCurrency(
                        form.price_per_hour
                      )
                    }
                    onChange={(
                      e
                    ) =>
                      updatePriceField(
                        "price_per_hour",
                        e.target
                          .value
                      )
                    }
                    placeholder={`Hourly cost in ${priceCurrencyOption.label}`}
                  />

                  {form.price_per_hour && (
                    <small>
                      {previewPrice(
                        form.price_per_hour
                      )}
                    </small>
                  )}
                </label>
              </div>

              <div className="check-section">
                <h3>
                  Services offered
                </h3>

                <div className="check-grid">
                  {serviceOptions.map(
                    (item) => (
                      <label
                        key={
                          item
                        }
                        className="check-card"
                      >
                        <input
                          type="checkbox"
                          checked={
                            form.services.includes(
                              item
                            )
                          }
                          onChange={() =>
                            toggleListValue(
                              "services",
                              item
                            )
                          }
                        />

                        <span>
                          {item}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="check-section">
                <h3>
                  Specialities
                </h3>

                <div className="check-grid">
                  {specialityOptions.map(
                    (item) => (
                      <label
                        key={
                          item
                        }
                        className="check-card"
                      >
                        <input
                          type="checkbox"
                          checked={
                            form.specialities.includes(
                              item
                            )
                          }
                          onChange={() =>
                            toggleListValue(
                              "specialities",
                              item
                            )
                          }
                        />

                        <span>
                          {item}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="form-grid">
                <label>
                  <span>
                    Short
                    description *
                  </span>

                  <input
                    value={
                      form.short_description
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "short_description",
                        e.target
                          .value
                      )
                    }
                    maxLength="255"
                    placeholder="A short public summary for tourists"
                  />
                </label>

                <label>
                  <span>
                    Full guide bio
                    *
                  </span>

                  <textarea
                    value={
                      form.bio
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "bio",
                        e.target
                          .value
                      )
                    }
                    rows="6"
                    placeholder="Explain your experience, tour style, safety support, and why tourists should choose you."
                  />
                </label>
              </div>

              <button
                className="submit-guide-btn"
                type="submit"
                disabled={
                  saving ||
                  uploading
                }
              >
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Update and Submit for Approval"
                    : "Submit Guide Profile"}
              </button>

              <div className="guide-payment-note">
                <strong>
                  Payment
                  process:
                </strong>{" "}
                after saving the
                profile, use the
                payment buttons
                in your profile
                card. Admin
                approval is
                available only
                after the
                registration fee
                is paid.
              </div>
            </>
          )}
        </form>

        <aside className="my-guides-panel">
          <div className="my-guides-head">
            <span>
              My Guide Profiles
            </span>

            <h2>
              Approval status
            </h2>
          </div>

          {!guides.length ? (
            <div className="guide-empty">
              <h3>
                No guide
                profiles yet
              </h3>

              <p>
                Fill the form
                and submit your
                first guide
                profile.
              </p>
            </div>
          ) : (
            <div className="my-guides-list">
              {guides.map(
                (guide) => (
                  <article
                    key={
                      guide.id
                    }
                    className="my-guide-card"
                  >
                    <div className="mini-guide-img">
                      {guide.image_url ? (
                        <ContentImage
                          src={
                            guide.image_url
                          }
                          alt={
                            guide.display_name
                          }
                        />
                      ) : (
                        <span>
                          🧭
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="mini-guide-top">
                        <h3>
                          {
                            guide.display_name
                          }
                        </h3>

                        <span
                          className={`guide-status ${guide.status}`}
                        >
                          {
                            guide.status
                          }
                        </span>
                      </div>

                      <p>
                        {
                          guide.city
                        }{" "}
                        •{" "}
                        {
                          guide.guide_type
                        }
                      </p>

                      <small>
                        {
                          guide.short_description
                        }
                      </small>

                      <div className="guide-payment-mini">
                        <span
                          className={
                            guide.registration_payment_status ===
                            "Paid"
                              ? "paid"
                              : "unpaid"
                          }
                        >
                          Registration:{" "}
                          {guide.registration_payment_status ||
                            "Unpaid"}{" "}
                          (
                          {formatMoney(
                            guide.registration_fee
                          )}
                          )
                        </span>

                        <span
                          className={
                            guide.is_promoted
                              ? "paid"
                              : "unpaid"
                          }
                        >
                          Top ad:{" "}
                          {guide.promotion_payment_status ||
                            "Unpaid"}

                          {guide.is_promoted
                            ? ` until ${formatDate(
                                guide.promotion_expires_at
                              )}`
                            : ""}
                        </span>
                      </div>

                      {guide.rejection_reason && (
                        <em>
                          Reason:{" "}
                          {
                            guide.rejection_reason
                          }
                        </em>
                      )}

                      <div className="mini-guide-actions">
                        <Link
                          to={`/partner/guides?edit=${guide.id}`}
                        >
                          Edit
                        </Link>

                        {guide.status ===
                          "approved" &&
                          guide.registration_payment_status ===
                            "Paid" && (
                            <Link
                              className="requests-mini"
                              to={`/partner/guides/${guide.id}/requests`}
                            >
                              Manage
                              requests
                            </Link>
                          )}

                        {guide.registration_payment_status !==
                          "Paid" && (
                          <button
                            type="button"
                            className="pay-mini"
                            onClick={() =>
                              payRegistrationFee(
                                guide
                              )
                            }
                          >
                            Pay
                            registration
                          </button>
                        )}

                        {guide.registration_payment_status ===
                          "Paid" &&
                          guide.status ===
                            "approved" &&
                          !guide.is_promoted && (
                            <button
                              type="button"
                              className="promote-mini"
                              onClick={() =>
                                payPromotionFee(
                                  guide
                                )
                              }
                            >
                              Promote top
                              ad
                            </button>
                          )}

                        {guide.registration_payment_status ===
                          "Paid" &&
                          guide.status !==
                            "approved" &&
                          !guide.is_promoted && (
                            <span className="promotion-waiting">
                              Promotion
                              available
                              after
                              approval
                            </span>
                          )}

                        {guide.status ===
                          "approved" && (
                          <button
                            type="button"
                            onClick={() =>
                              hideGuide(
                                guide.id
                              )
                            }
                          >
                            Hide
                          </button>
                        )}

                        <button
                          type="button"
                          className="delete-mini"
                          onClick={() =>
                            deleteGuide(
                              guide.id
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

const guideFormCss = `
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");

.partner-guide-page,
.partner-guide-page input,
.partner-guide-page textarea,
.partner-guide-page select,
.partner-guide-page button {
  font-family: "Manrope","Segoe UI",Arial,sans-serif;
}

.guide-payment-note {
  margin-top: 12px;
  background: #f2f8f6;
  border: 1px solid #c9ded8;
  color: #42534e;
  border-radius: 10px;
  padding: 13px 14px;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.55;
}

.guide-payment-mini {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}

.guide-payment-mini span {
  border-radius: 999px;
  padding: 7px 9px;
  font-size: 11px;
  font-weight: 800;
}

.guide-payment-mini .paid {
  background: #e8f7ef;
  color: #267552;
}

.guide-payment-mini .unpaid {
  background: #fff5dc;
  color: #8a6817;
}

.mini-guide-actions .pay-mini,
.mini-guide-actions .requests-mini {
  background: #0f8276;
}

.mini-guide-actions .promote-mini {
  background: #aa7b15;
}

.partner-guide-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 5% 4%, rgba(55,190,174,.12), transparent 28%),
    radial-gradient(circle at 95% 2%, rgba(229,180,56,.12), transparent 30%),
    #f6f8f6;
  padding: 30px 20px 70px;
  color: #17211f;
}

.guide-form-hero {
  width: min(1180px,100%);
  margin: 0 auto 22px;
  background:
    radial-gradient(circle at 7% 17%, rgba(10,150,136,.18) 0%, transparent 42%),
    radial-gradient(circle at 93% 5%, rgba(232,179,47,.22) 0%, transparent 38%),
    linear-gradient(118deg,#e9f8f4 0%,#f5fbf8 38%,#fcfdfb 62%,#fff4d9 100%);
  border: 1px solid rgba(126,188,172,.62);
  border-radius: 18px;
  padding: 36px;
  color: #17211f;
  box-shadow: 0 18px 50px rgba(21,69,58,.08);
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 28px;
  align-items: end;
  overflow: hidden;
  position: relative;
}

.guide-form-hero:before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background:
    linear-gradient(
      90deg,
      #08786d 0%,
      #11a08e 43%,
      #d6a624 100%
    );
}

.guide-form-hero > * {
  position: relative;
  z-index: 1;
}

.guide-pill {
  display: inline-flex;
  padding: 7px 11px;
  border-radius: 999px;
  background:
    rgba(255,255,255,.82);
  border:
    1px solid
    rgba(15,118,110,.16);
  color: #0f766e;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .05em;
}

.guide-form-hero h1 {
  margin: 16px 0 12px;
  color: #15231f;
  font-size:
    clamp(38px,5vw,64px);
  line-height: 1;
  font-weight: 800;
  letter-spacing: -.045em;
}

.guide-form-hero p {
  max-width: 720px;
  color: #536a63;
  font-weight: 500;
  line-height: 1.7;
  font-size: 17px;
}

.guide-hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.guide-hero-actions a {
  color: #ffffff;
  background: #0f8276;
  text-decoration: none;
  border: 1px solid #0d6f66;
  border-radius: 10px;
  padding: 12px 15px;
  font-weight: 800;
  font-size: 14px;
}

.guide-hero-actions a + a {
  background: #ffffff;
  color: #0f766e;
  border: 1px solid #b7d7cf;
}

.guide-stat-card-wrap {
  display: grid;
  grid-template-columns:
    repeat(2,1fr);
  gap: 12px;
}

.guide-stat-card {
  background:
    rgba(255,255,255,.80);
  border:
    1px solid #c8ddd7;
  border-radius: 12px;
  padding: 18px;
  box-shadow:
    0 8px 24px
    rgba(22,53,46,.035);
}

.guide-stat-card span {
  display: block;
  color: #6f7e79;
  font-weight: 700;
  font-size: 13px;
}

.guide-stat-card strong {
  color: #0f766e;
  font-size: 34px;
  font-weight: 800;
}

.guide-alert {
  width: min(1180px,100%);
  margin: 0 auto 18px;
  padding: 14px 16px;
  border-radius: 10px;
  font-weight: 700;
}

.guide-alert.success {
  background: #edf8f5;
  border: 1px solid #a9d8cc;
  color: #0f766e;
}

.guide-alert.error {
  background: #fff4f4;
  border: 1px solid #efc1c1;
  color: #a43737;
}

.guide-main-grid {
  width: min(1180px,100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns:
    1fr 360px;
  gap: 22px;
  align-items: start;
}

.guide-form-card,
.my-guides-panel {
  background: #ffffff;
  border: 1px solid #dde7e3;
  border-radius: 16px;
  box-shadow:
    0 10px 30px
    rgba(22,53,46,.045);
}

.guide-form-card {
  padding: 26px;
}

.guide-form-head,
.my-guides-head {
  display: flex;
  align-items: flex-start;
  justify-content:
    space-between;
  gap: 14px;
  margin-bottom: 22px;
}

.guide-form-head span,
.my-guides-head span {
  color: #0f766e;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .06em;
  font-size: 12px;
}

.guide-form-head h2,
.my-guides-head h2 {
  margin: 6px 0 0;
  color: #183029;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 750;
  letter-spacing: -.025em;
}

.new-guide-link {
  color: #0f766e;
  text-decoration: none;
  font-weight: 800;
}

/* PHOTO DROP AREA */

.guide-photo-panel {
  display: grid;
  grid-template-columns:
    150px 1fr;
  gap: 18px;
  align-items: center;
  background: #f7faf8;
  border:
    1px dashed #9bc8be;
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 22px;
  transition:
    border-color 150ms ease,
    background 150ms ease;
}

.guide-photo-preview {
  width: 150px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  background: #e9f5f2;
  display: grid;
  place-items: center;
  color: #0f766e;
  font-size: 48px;
}

.guide-photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guide-photo-panel h3 {
  margin: 0 0 6px;
  color: #26332f;
  font-size: 18px;
  font-weight: 750;
}

.guide-photo-panel p {
  margin: 0 0 12px;
  color: #6f7e79;
  line-height: 1.55;
  font-weight: 500;
  font-size: 14px;
}

.guide-photo-upload-copy {
  min-width: 0;
}

.guide-photo-drop-message {
  margin: 12px 0;
  padding: 13px 14px;
  display: grid;
  gap: 3px;
  border:
    1px dashed #8fc9bd;
  border-radius: 10px;
  background: #ffffff;
}

.guide-photo-drop-message strong {
  color: #183029;
  font-size: 14px;
  font-weight: 750;
}

.guide-photo-drop-message span {
  color: #778681;
  font-size: 12px;
  font-weight: 600;
}

.guide-photo-choose-button {
  min-height: 42px;
  padding: 0 16px;
  border:
    1px solid #0d6f66;
  border-radius: 9px;
  background: #0f8276;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.guide-photo-choose-button:hover:not(:disabled) {
  background: #0d746a;
}

.guide-photo-choose-button:disabled {
  opacity: .65;
  cursor: wait;
}

.guide-photo-file-input {
  display: none;
}

.guide-photo-panel.uploading {
  border-color: #0f8276;
  background: #f0faf7;
}

.form-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 18px;
}

.form-grid.two {
  grid-template-columns:
    repeat(2,1fr);
}

.form-grid .full {
  grid-column: 1/-1;
}

.form-grid label {
  display: grid;
  gap: 7px;
}

.form-grid span {
  font-size: 13px;
  color: #42534e;
  font-weight: 750;
  text-transform: none;
  letter-spacing: 0;
}

.form-grid small {
  display: block;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}

.form-grid input,
.form-grid select,
.form-grid textarea {
  width: 100%;
  border: 1px solid #cfdcd7;
  border-radius: 10px;
  padding: 13px 14px;
  font-size: 15px;
  font-weight: 500;
  color: #26332f;
  outline: none;
  background: #ffffff;
}

.form-grid input::placeholder,
.form-grid textarea::placeholder {
  color: #87948f;
  opacity: 1;
}

.form-grid input:focus,
.form-grid select:focus,
.form-grid textarea:focus {
  border-color: #0f8276;
  box-shadow:
    0 0 0 3px
    rgba(15,130,118,.10);
}

.check-section {
  border: 1px solid #dfe7e3;
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 18px;
  background: #fafcfb;
}

.check-section h3 {
  margin: 0 0 12px;
  color: #26332f;
  font-size: 18px;
  font-weight: 750;
}

.check-grid {
  display: grid;
  grid-template-columns:
    repeat(
      auto-fit,
      minmax(190px,1fr)
    );
  gap: 10px;
}

.check-card {
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid #dfe7e3;
  background: #ffffff;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 650;
  color: #42534e;
}

.check-card input {
  accent-color: #0f8276;
}

.submit-guide-btn {
  width: 100%;
  border: 1px solid #0d6f66;
  border-radius: 10px;
  background: #0f8276;
  color: #ffffff;
  padding: 15px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  box-shadow:
    0 10px 24px
    rgba(15,130,118,.16);
}

.submit-guide-btn:disabled {
  opacity: .65;
  cursor: not-allowed;
}

.my-guides-panel {
  padding: 22px;
  position: sticky;
  top: 90px;
}

.guide-empty {
  padding: 24px;
  border-radius: 12px;
  background: #f8faf9;
  color: #6f7e79;
  text-align: center;
  font-size: 14px;
}

.my-guides-list {
  display: grid;
  gap: 14px;
}

.my-guide-card {
  display: grid;
  grid-template-columns:
    74px 1fr;
  gap: 12px;
  padding: 13px;
  border: 1px solid #dfe7e3;
  border-radius: 12px;
}

.mini-guide-img {
  width: 74px;
  height: 74px;
  border-radius: 10px;
  background: #edf8f5;
  display: grid;
  place-items: center;
  overflow: hidden;
  font-size: 30px;
}

.mini-guide-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-guide-top {
  display: flex;
  align-items: center;
  justify-content:
    space-between;
  gap: 8px;
}

.mini-guide-top h3 {
  font-size: 16px;
  margin: 0;
  color: #26332f;
}

.my-guide-card p {
  margin: 4px 0;
  color: #6f7e79;
  font-weight: 650;
  font-size: 13px;
}

.my-guide-card small {
  display: block;
  color: #566762;
  line-height: 1.5;
}

.my-guide-card em {
  display: block;
  margin-top: 8px;
  color: #a43737;
  font-size: 12px;
  font-weight: 700;
}

.guide-status {
  border-radius: 999px;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 800;
  text-transform: capitalize;
}

.guide-status.approved {
  background: #e8f7ef;
  color: #267552;
}

.guide-status.pending {
  background: #fff5dc;
  color: #8a6817;
}

.guide-status.rejected,
.guide-status.hidden {
  background: #fff0f0;
  color: #a43737;
}

.mini-guide-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.mini-guide-actions a,
.mini-guide-actions button {
  border: none;
  text-decoration: none;
  border-radius: 8px;
  background: #0f8276;
  color: #ffffff;
  padding: 8px 10px;
  font-weight: 750;
  font-size: 12px;
  cursor: pointer;
}

.mini-guide-actions button {
  background: #34443f;
}

.mini-guide-actions .delete-mini {
  background: #fff0f0;
  color: #a43737;
}

@media(max-width:980px) {
  .guide-form-hero,
  .guide-main-grid {
    grid-template-columns: 1fr;
  }

  .my-guides-panel {
    position: static;
  }

  .guide-stat-card-wrap {
    grid-template-columns:
      repeat(4,1fr);
  }
}

@media(max-width:680px) {
  .partner-guide-page {
    padding:
      22px 12px 60px;
  }

  .guide-form-hero {
    padding: 28px 22px;
  }

  .guide-stat-card-wrap,
  .form-grid.two {
    grid-template-columns:
      1fr;
  }

  .guide-photo-panel {
    grid-template-columns:
      1fr;
  }

  .guide-photo-preview {
    width: 100%;
    height: 230px;
  }

  .guide-form-card {
    padding: 18px;
  }
}
`;

export default PartnerGuideRegistrationPage;