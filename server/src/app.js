const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const dbTestRoutes = require("./routes/dbTest.routes");
const hotelRoutes = require("./routes/hotel.routes");
const healthRoutes = require("./routes/health.routes");
const roomRoutes = require("./routes/room.routes");
const bookingRoutes = require("./routes/booking.routes");
const authRoutes = require("./routes/auth.routes");
const partnerRoutes = require("./routes/partner.routes");
const eventRoutes = require("./routes/event.routes");
const diningRoutes = require("./routes/dining.routes");
const complaintRoutes = require("./routes/complaint.routes");
const adminRoutes = require("./routes/admin.routes");
const tripsRoutes = require("./routes/trips.routes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to TourismHub LK API",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/db-test", dbTestRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/hotels/:hotelId/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/partner/events", eventRoutes);
app.use("/api/partner/dining", diningRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/complaints", complaintRoutes);

/* Saved trips API */
app.use("/api/trips", tripsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`TourismHub LK backend running on port ${PORT}`);
});