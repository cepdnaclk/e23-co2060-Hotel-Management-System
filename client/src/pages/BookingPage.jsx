import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  countries,
  getCountryByNationality,
  onlyDigits,
  formatCountryPhone,
  validateCountryPhone,
} from "../utils/countryPhone";

const toDateInputValue = (date) => {
  const fixedDate = new Date(date);
  fixedDate.setMinutes(fixedDate.getMinutes() - fixedDate.getTimezoneOffset());
  return fixedDate.toISOString().slice(0, 10);
};

const getDateDifference = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const diff = end.getTime() - start.getTime();

  return Math.round(diff / (1000 * 60 * 60 * 24));
};

const packageToUnits = (packageType) => {
  if (packageType === "day") {
    return {
      dayUnits: 1,
      nightUnits: 0,
    };
  }

  if (packageType === "night") {
    return {
      dayUnits: 0,
      nightUnits: 1,
    };
  }

  return {
    dayUnits: 1,
    nightUnits: 1,
  };
};

function BookingPage() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const propertyId =
    searchParams.get("propertyId") ||
    searchParams.get("hotelId") ||
    searchParams.get("property_id");

  const roomId = searchParams.get("roomId") || searchParams.get("room_id");

  const todayDate = toDateInputValue(new Date());

  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(null);

  const [form, setForm] = useState({
    check_in: "",
    check_out: "",
    check_in_package: "night",
    check_out_package: "day",
    extra_persons: "0",
    full_name: user?.full_name || user?.name || "",
    email: user?.email || "",
    nationality: "Sri Lankan",
    country_code: "+94",
    phone_number: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedCountry = useMemo(() => {
    return getCountryByNationality(form.nationality);
  }, [form.nationality]);

  const cleanPhoneNumber = onlyDigits(form.phone_number);

  const minimumCheckOutDate = useMemo(() => {
    return form.check_in || todayDate;
  }, [form.check_in, todayDate]);

  const dateDifference = useMemo(() => {
    return getDateDifference(form.check_in, form.check_out);
  }, [form.check_in, form.check_out]);

  const isSameDayBooking =
    form.check_in && form.check_out && dateDifference === 0;

  const roomCapacity = Number(room?.capacity || 1);
  const baseOccupancy = Number(room?.base_occupancy || 1);
  const baseNightPrice = Number(room?.price_per_night || 0);
  const baseDayPrice = Number(room?.price_per_day || room?.price_per_night || 0);
  const extraPersonPrice = Number(room?.extra_person_price || 0);

  const maxExtraPersons = Math.max(0, roomCapacity - baseOccupancy);

  const extraPersonCount = useMemo(() => {
    const extra = Number(form.extra_persons || 0);
    return extra >= 0 ? extra : 0;
  }, [form.extra_persons]);

  const guestCount = useMemo(() => {
    return baseOccupancy + extraPersonCount;
  }, [baseOccupancy, extraPersonCount]);

  const calculatedUnits = useMemo(() => {
    if (!form.check_in || !form.check_out) {
      return {
        dayUnits: 0,
        nightUnits: 0,
        middleDays: 0,
      };
    }

    if (dateDifference === 0) {
      const sameDayUnits = packageToUnits(form.check_in_package);

      return {
        dayUnits: sameDayUnits.dayUnits,
        nightUnits: sameDayUnits.nightUnits,
        middleDays: 0,
      };
    }

    const checkInUnits = packageToUnits(form.check_in_package);
    const checkOutUnits = packageToUnits(form.check_out_package);
    const middleDays = Math.max(0, dateDifference - 1);

    return {
      dayUnits: checkInUnits.dayUnits + checkOutUnits.dayUnits + middleDays,
      nightUnits:
        checkInUnits.nightUnits + checkOutUnits.nightUnits + middleDays,
      middleDays,
    };
  }, [
    form.check_in,
    form.check_out,
    form.check_in_package,
    form.check_out_package,
    dateDifference,
  ]);

  const dayAmount =
    (baseDayPrice + extraPersonCount * extraPersonPrice) *
    calculatedUnits.dayUnits;

  const nightAmount =
    (baseNightPrice + extraPersonCount * extraPersonPrice) *
    calculatedUnits.nightUnits;

  const totalAmount = dayAmount + nightAmount;

  const availableRooms = Number(room?.available_rooms || 0);
  const isSelectedRoomSoldOut = availableRooms <= 0;

  const suggestedRooms = useMemo(() => {
    return rooms.filter(
      (item) =>
        String(item.id) !== String(room?.id) &&
        Number(item.available_rooms || 0) > 0 &&
        Number(item.capacity || 1) >= guestCount
    );
  }, [rooms, room, guestCount]);

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString("en-LK")}`;
  };

  const getRoomImage = (roomItem) => {
    return (
      roomItem?.main_image ||
      roomItem?.image_url ||
      roomItem?.photo_url ||
      property?.main_photo ||
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80"
    );
  };

  const loadBookingData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!propertyId || !roomId) {
        setError("Property ID and Room ID are required for booking.");
        return;
      }

      const [propertyResponse, roomsResponse] = await Promise.all([
        api.get(`/properties/${propertyId}`),
        api.get(`/properties/${propertyId}/rooms`),
      ]);

      const propertyData =
        propertyResponse.data.data ||
        propertyResponse.data.property ||
        propertyResponse.data;

      const roomsData =
        roomsResponse.data.data ||
        roomsResponse.data.rooms ||
        roomsResponse.data ||
        [];

      const selectedRoom = roomsData.find(
        (item) => String(item.id) === String(roomId)
      );

      setProperty(propertyData);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setRoom(selectedRoom || null);

      if (!selectedRoom) {
        setError("Selected room was not found.");
      }
    } catch (err) {
      console.error("Load booking page error:", err);
      setError(err.response?.data?.message || "Failed to load booking data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, roomId]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      full_name: user?.full_name || user?.name || prev.full_name,
      email: user?.email || prev.email,
    }));
  }, [user]);

  useEffect(() => {
    if (!form.check_in || !form.check_out) return;

    if (isSameDayBooking) return;

    setForm((prev) => ({
      ...prev,
      check_in_package:
        prev.check_in_package === "day" ? "night" : prev.check_in_package,
      check_out_package:
        prev.check_out_package === "night" ? "day" : prev.check_out_package,
    }));
  }, [form.check_in, form.check_out, isSameDayBooking]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "nationality") {
      const selected = getCountryByNationality(value);

      setForm((prev) => ({
        ...prev,
        nationality: value,
        country_code: selected?.code || "+",
        phone_number: "",
      }));

      return;
    }

    if (name === "phone_number") {
      setForm((prev) => ({
        ...prev,
        phone_number: onlyDigits(value),
      }));

      return;
    }

    if (name === "check_in") {
      setForm((prev) => ({
        ...prev,
        check_in: value,
        check_out: prev.check_out && prev.check_out < value ? "" : prev.check_out,
      }));

      return;
    }

    if (name === "check_out") {
      setForm((prev) => ({
        ...prev,
        check_out: value,
      }));

      return;
    }

    if (name === "extra_persons") {
      if (value === "") {
        setForm((prev) => ({
          ...prev,
          extra_persons: "",
        }));
        return;
      }

      const numberValue = Number(value);

      if (numberValue < 0) {
        setForm((prev) => ({
          ...prev,
          extra_persons: "0",
        }));
        return;
      }

      if (numberValue > maxExtraPersons) {
        setForm((prev) => ({
          ...prev,
          extra_persons: String(maxExtraPersons),
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        extra_persons: value,
      }));
      return;
    }

    if (name === "check_in_package" && !isSameDayBooking && value === "day") {
      return;
    }

    if (name === "check_out_package" && !isSameDayBooking && value === "night") {
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateBooking = () => {
    if (!property || !room) {
      return "Booking data is not ready yet.";
    }

    if (isSelectedRoomSoldOut) {
      return "This room category is fully booked. Please select another room option in this hotel.";
    }

    if (!form.full_name || !form.email || !form.nationality) {
      return "Please enter your name, email, and nationality.";
    }

    if (!form.phone_number) {
      return "Please enter your WhatsApp / phone number.";
    }

    const phoneValidation = validateCountryPhone(
      selectedCountry,
      cleanPhoneNumber
    );

    if (!phoneValidation.valid) {
      return phoneValidation.message;
    }

    if (!form.check_in || !form.check_out) {
      return "Please select check-in and check-out dates.";
    }

    if (form.check_in < todayDate) {
      return "Check-in date cannot be a past date.";
    }

    if (form.check_out < form.check_in) {
      return "Check-out date cannot be before check-in date.";
    }

    if (extraPersonCount < 0) {
      return "Extra persons cannot be less than 0.";
    }

    if (guestCount > roomCapacity) {
      return `This room includes ${baseOccupancy} person(s) and allows only ${maxExtraPersons} extra person(s).`;
    }

    if (!isSameDayBooking) {
      if (form.check_in_package === "day") {
        return "Check-in package cannot be Day only for multi-day bookings.";
      }

      if (form.check_out_package === "night") {
        return "Check-out package cannot be Night only for multi-day bookings.";
      }
    }

    if (calculatedUnits.dayUnits === 0 && calculatedUnits.nightUnits === 0) {
      return "Please select day, night, or both for the booking.";
    }

    if (totalAmount <= 0) {
      return "Room price is not valid. Please contact the hotel.";
    }

    return "";
  };

  const goToSuggestedRoom = (suggestedRoomId) => {
    navigate(`/booking?propertyId=${propertyId}&roomId=${suggestedRoomId}`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const validationError = validateBooking();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const fullPhoneNumber = formatCountryPhone(
        selectedCountry,
        cleanPhoneNumber
      );

      const response = await api.post("/bookings", {
        property_id: property.id,
        room_id: room.id,
        full_name: form.full_name,
        email: form.email,
        nationality: form.nationality,
        country_code: selectedCountry.code,
        phone: fullPhoneNumber,
        check_in: form.check_in,
        check_out: form.check_out,
        check_in_package: form.check_in_package,
        check_out_package: isSameDayBooking
          ? form.check_in_package
          : form.check_out_package,
        guests: guestCount,
        day_units: calculatedUnits.dayUnits,
        night_units: calculatedUnits.nightUnits,
        total_amount: totalAmount,
        notes: form.notes,
      });

      localStorage.setItem(
        "tourismhub_completed_booking",
        JSON.stringify({
          booking_reference: response.data.booking_reference,
          property_id: property.id,
          room_id: room.id,
          property_name: property.name,
          property_city: property.city,
          room_type: room.room_type,
          check_in: form.check_in,
          check_out: form.check_out,
          check_in_package: form.check_in_package,
          check_out_package: isSameDayBooking
            ? form.check_in_package
            : form.check_out_package,
          guests: guestCount,
          extra_persons: extraPersonCount,
          day_units: response.data.day_units || calculatedUnits.dayUnits,
          night_units: response.data.night_units || calculatedUnits.nightUnits,
          total_amount: response.data.total_amount || totalAmount,
          booking_status:
            response.data.booking_status || "Pending Partner Approval",
          payment_status: response.data.payment_status || "Pending Payment",
          is_guest_booking: response.data.is_guest_booking,
        })
      );

      alert(
        isLoggedIn
          ? "Booking request submitted successfully. It is now waiting for partner approval."
          : "Guest booking request submitted successfully. You can see it in My Bookings on this same browser."
      );

      navigate("/my-bookings");
    } catch (err) {
      console.error("Submit booking error:", err);

      if (err.response?.data?.suggestions?.length > 0) {
        setError(
          `${err.response.data.message} Suggested available rooms are shown below.`
        );
      } else {
        setError(
          err.response?.data?.message || "Server error while creating booking"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>Loading booking page...</div>
        </div>
      </main>
    );
  }

  if (error && (!property || !room)) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.noticeCard}>
            <h2 style={styles.noticeTitle}>Booking Error</h2>
            <p style={styles.noticeText}>{error}</p>
            <Link to="/hotels" style={styles.primaryLink}>
              Back to Hotels
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const logo =
    property?.logo_url ||
    "https://dummyimage.com/160x160/ffffff/111827.png&text=LOGO";

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerCard}>
          <div style={styles.titleRow}>
            <img src={logo} alt={`${property?.name} logo`} style={styles.logo} />

            <div>
              <Link
                to={`/hotels/${property?.id}/rooms`}
                style={styles.backLink}
              >
                ← Back to Rooms
              </Link>

              <h1 style={styles.title}>Complete Your Booking</h1>

              <p style={styles.subtitle}>
                {property?.name} — {property?.city}
                {property?.district ? `, ${property.district}` : ""}
              </p>
            </div>
          </div>
        </div>

        {!isLoggedIn && (
          <div style={styles.guestBox}>
            <strong>Guest Booking:</strong> You are not logged in. Your booking
            will be saved in this browser.
          </div>
        )}

        {error && <div style={styles.errorBox}>{error}</div>}

        {isSelectedRoomSoldOut && (
          <div style={styles.soldOutBox}>
            <h2>This room category is fully booked</h2>
            <p>
              You cannot book this room type now. Choose another available room
              in the same hotel below.
            </p>

            {suggestedRooms.length === 0 ? (
              <strong>
                No suitable alternative rooms available for this accommodation
                size.
              </strong>
            ) : (
              <div style={styles.suggestionGrid}>
                {suggestedRooms.map((suggestedRoom) => (
                  <button
                    key={suggestedRoom.id}
                    type="button"
                    style={styles.suggestionCard}
                    onClick={() => goToSuggestedRoom(suggestedRoom.id)}
                  >
                    <strong>{suggestedRoom.room_type}</strong>
                    <span>
                      Up to {suggestedRoom.capacity} person(s) •{" "}
                      {formatCurrency(suggestedRoom.price_per_night)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={styles.layout}>
          <form style={styles.formCard} onSubmit={handleSubmit}>
            <h2 style={styles.sectionTitle}>Guest Details</h2>

            <div style={styles.twoColumns}>
              <div>
                <label style={styles.label}>Full Name</label>
                <input
                  style={styles.input}
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div style={styles.twoColumns}>
              <div>
                <label style={styles.label}>Nationality</label>
                <select
                  style={styles.input}
                  name="nationality"
                  value={form.nationality}
                  onChange={handleChange}
                  required
                >
                  {countries.map((item) => (
                    <option key={item.nationality} value={item.nationality}>
                      {item.nationality} ({item.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>WhatsApp / Phone Number</label>

                <div style={styles.phoneGroup}>
                  <div style={styles.codeBox}>{selectedCountry.code}</div>

                  <input
                    style={styles.phoneInput}
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    placeholder={selectedCountry.placeholder}
                    maxLength={selectedCountry.maxLength}
                    required
                  />
                </div>

                <p style={styles.phoneHint}>
                  Example:{" "}
                  <strong>
                    {formatCountryPhone(
                      selectedCountry,
                      form.phone_number || selectedCountry.placeholder
                    )}
                  </strong>
                </p>
              </div>
            </div>

            <h2 style={styles.sectionTitle}>Stay Details</h2>

            <div style={styles.twoColumns}>
              <div>
                <label style={styles.label}>Check-in Date</label>
                <input
                  style={styles.input}
                  type="date"
                  name="check_in"
                  value={form.check_in}
                  min={todayDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Check-out Date</label>
                <input
                  style={styles.input}
                  type="date"
                  name="check_out"
                  value={form.check_out}
                  min={minimumCheckOutDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {form.check_in && form.check_out && (
              <div style={styles.packageBox}>
                {isSameDayBooking ? (
                  <>
                    <h3 style={styles.packageTitle}>
                      This is a same-day booking. What do you want to book?
                    </h3>

                    <select
                      style={styles.input}
                      name="check_in_package"
                      value={form.check_in_package}
                      onChange={handleChange}
                      required
                    >
                      <option value="day">Day only</option>
                      <option value="night">Night only</option>
                      <option value="both">Day & Night</option>
                    </select>
                  </>
                ) : (
                  <>
                    <h3 style={styles.packageTitle}>
                      Choose day/night package for first and last date
                    </h3>

                    <p style={styles.packageText}>
                      Check-in does not allow Day only, and check-out does not
                      allow Night only. Middle dates automatically count as both
                      day and night.
                    </p>

                    <div style={styles.twoColumnsNoMargin}>
                      <div>
                        <label style={styles.label}>
                          Check-in date package
                        </label>

                        <select
                          style={styles.input}
                          name="check_in_package"
                          value={form.check_in_package}
                          onChange={handleChange}
                          required
                        >
                          <option value="night">Night only</option>
                          <option value="both">Day & Night</option>
                        </select>
                      </div>

                      <div>
                        <label style={styles.label}>
                          Check-out date package
                        </label>

                        <select
                          style={styles.input}
                          name="check_out_package"
                          value={form.check_out_package}
                          onChange={handleChange}
                          required
                        >
                          <option value="day">Day only</option>
                          <option value="both">Day & Night</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div style={styles.unitPreview}>
                  <span>
                    Day units: <strong>{calculatedUnits.dayUnits}</strong>
                  </span>

                  <span>
                    Night units: <strong>{calculatedUnits.nightUnits}</strong>
                  </span>

                  {calculatedUnits.middleDays > 0 && (
                    <span>
                      Middle full days:{" "}
                      <strong>{calculatedUnits.middleDays}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            <div style={styles.twoColumns}>
              <div>
                <label style={styles.label}>Number of Extra Persons</label>
                <input
                  style={styles.input}
                  type="number"
                  name="extra_persons"
                  value={form.extra_persons}
                  min="0"
                  max={maxExtraPersons}
                  onChange={handleChange}
                  required
                />

                <p style={styles.phoneHint}>
                  Base included: <strong>{baseOccupancy} person(s)</strong>
                  <br />
                  Maximum extra persons allowed:{" "}
                  <strong>{maxExtraPersons}</strong>
                  <br />
                  Total accommodation with current selection:{" "}
                  <strong>{guestCount} person(s)</strong>
                </p>
              </div>

              <div>
                <label style={styles.label}>Special Notes</label>
                <input
                  style={styles.input}
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any special request?"
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                opacity: isSelectedRoomSoldOut ? 0.5 : 1,
                cursor: isSelectedRoomSoldOut ? "not-allowed" : "pointer",
              }}
              disabled={submitting || isSelectedRoomSoldOut}
            >
              {submitting ? "Submitting Booking..." : "Submit Booking Request"}
            </button>
          </form>

          <aside style={styles.summaryCard}>
            <div style={styles.summaryImageBox}>
              <img
                src={getRoomImage(room)}
                alt={room?.room_type}
                style={styles.summaryImage}
              />
            </div>

            <h2 style={styles.summaryTitle}>{room?.room_type}</h2>

            <p style={styles.summaryHotel}>{property?.name}</p>

            <div style={styles.summaryLine}>
              <span>Availability</span>
              <strong
                style={{ color: isSelectedRoomSoldOut ? "#dc2626" : "#15803d" }}
              >
                {isSelectedRoomSoldOut
                  ? "Fully Booked"
                  : `${availableRooms} room(s) left`}
              </strong>
            </div>

            <div style={styles.summaryLine}>
              <span>Day price</span>
              <strong>{formatCurrency(baseDayPrice)}</strong>
            </div>

            <div style={styles.summaryLine}>
              <span>Night price</span>
              <strong>{formatCurrency(baseNightPrice)}</strong>
            </div>

            <div style={styles.summaryLine}>
              <span>Base persons included</span>
              <strong>{baseOccupancy}</strong>
            </div>

            <div style={styles.summaryLine}>
              <span>Extra person price</span>
              <strong>{formatCurrency(extraPersonPrice)}</strong>
            </div>

            <div style={styles.summaryLine}>
              <span>Extra persons</span>
              <strong>{extraPersonCount}</strong>
            </div>

            <div style={styles.summaryLine}>
              <span>Total persons accommodated</span>
              <strong>{guestCount}</strong>
            </div>

            <div style={styles.summaryLine}>
              <span>Day units</span>
              <strong>{calculatedUnits.dayUnits}</strong>
            </div>

            <div style={styles.summaryLine}>
              <span>Night units</span>
              <strong>{calculatedUnits.nightUnits}</strong>
            </div>

            <div style={styles.totalBox}>
              <span>Total Amount</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>

            <p style={styles.calculationNote}>
              Day amount: ({formatCurrency(baseDayPrice)} + {extraPersonCount} ×{" "}
              {formatCurrency(extraPersonPrice)}) ×{" "}
              {calculatedUnits.dayUnits}
              <br />
              Night amount: ({formatCurrency(baseNightPrice)} + {extraPersonCount} ×{" "}
              {formatCurrency(extraPersonPrice)}) ×{" "}
              {calculatedUnits.nightUnits}
            </p>

            <div style={styles.statusNote}>
              Booking will be submitted as{" "}
              <strong>Pending Partner Approval</strong>.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, rgba(15, 118, 110, 0.08), rgba(14, 165, 233, 0.08))",
    padding: "40px 16px",
  },

  container: {
    maxWidth: "1160px",
    margin: "0 auto",
  },

  loadingCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "20px",
    fontWeight: "900",
    color: "#0f172a",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
  },

  noticeCard: {
    background: "#ffffff",
    padding: "34px",
    borderRadius: "24px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
    textAlign: "center",
  },

  noticeTitle: {
    margin: "0 0 10px",
    color: "#0f172a",
  },

  noticeText: {
    color: "#64748b",
    fontWeight: "700",
  },

  primaryLink: {
    display: "inline-block",
    marginTop: "14px",
    background: "#0f766e",
    color: "#ffffff",
    padding: "12px 18px",
    borderRadius: "14px",
    textDecoration: "none",
    fontWeight: "900",
  },

  headerCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "22px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
    marginBottom: "18px",
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  logo: {
    width: "78px",
    height: "78px",
    objectFit: "contain",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    padding: "8px",
    background: "#ffffff",
  },

  backLink: {
    color: "#0f766e",
    fontWeight: "900",
    textDecoration: "none",
  },

  title: {
    margin: "8px 0 6px",
    color: "#0f172a",
    fontSize: "36px",
  },

  subtitle: {
    margin: 0,
    color: "#475569",
    fontWeight: "800",
  },

  guestBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e3a8a",
    padding: "14px 16px",
    borderRadius: "16px",
    marginBottom: "18px",
    fontWeight: "700",
  },

  errorBox: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "14px 16px",
    borderRadius: "16px",
    marginBottom: "18px",
    fontWeight: "900",
  },

  soldOutBox: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    padding: "18px",
    borderRadius: "18px",
    marginBottom: "18px",
    fontWeight: "700",
  },

  suggestionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginTop: "14px",
  },

  suggestionCard: {
    background: "#ffffff",
    border: "1px solid #fed7aa",
    borderRadius: "14px",
    padding: "14px",
    textAlign: "left",
    cursor: "pointer",
    display: "grid",
    gap: "6px",
    color: "#0f172a",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.8fr",
    gap: "22px",
    alignItems: "start",
  },

  formCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "26px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
  },

  sectionTitle: {
    margin: "0 0 16px",
    color: "#0f172a",
    fontSize: "22px",
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "18px",
  },

  twoColumnsNoMargin: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#334155",
    fontWeight: "900",
  },

  input: {
    width: "100%",
    padding: "13px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    outline: "none",
    fontSize: "14px",
    fontWeight: "700",
    background: "#ffffff",
  },

  packageBox: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "20px",
  },

  packageTitle: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize: "18px",
  },

  packageText: {
    margin: "0 0 14px",
    color: "#64748b",
    fontWeight: "700",
  },

  unitPreview: {
    marginTop: "14px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  phoneGroup: {
    display: "grid",
    gridTemplateColumns: "86px 1fr",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    overflow: "hidden",
    background: "#ffffff",
  },

  codeBox: {
    background: "#f1f5f9",
    borderRight: "1px solid #cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    color: "#0f766e",
  },

  phoneInput: {
    width: "100%",
    padding: "13px 14px",
    border: "none",
    outline: "none",
    fontSize: "14px",
    fontWeight: "700",
  },

  phoneHint: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: 1.5,
  },

  submitButton: {
    width: "100%",
    background: "#0f766e",
    color: "#ffffff",
    border: "none",
    padding: "15px 18px",
    borderRadius: "16px",
    fontWeight: "900",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(15, 118, 110, 0.24)",
  },

  summaryCard: {
    background: "#ffffff",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
    position: "sticky",
    top: "100px",
  },

  summaryImageBox: {
    width: "100%",
    height: "170px",
    borderRadius: "18px",
    overflow: "hidden",
    marginBottom: "16px",
  },

  summaryImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  summaryTitle: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "24px",
  },

  summaryHotel: {
    margin: "0 0 18px",
    color: "#0f766e",
    fontWeight: "900",
  },

  summaryLine: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    color: "#475569",
    fontWeight: "700",
    marginBottom: "12px",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "10px",
  },

  totalBox: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    background: "#ecfdf5",
    color: "#065f46",
    padding: "16px",
    borderRadius: "16px",
    fontSize: "18px",
    fontWeight: "900",
    marginTop: "14px",
  },

  calculationNote: {
    background: "#f8fafc",
    color: "#475569",
    padding: "12px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: 1.5,
  },

  statusNote: {
    background: "#fffbeb",
    color: "#92400e",
    padding: "12px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: "800",
  },
};

export default BookingPage;