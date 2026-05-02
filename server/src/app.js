const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const healthRoutes = require("./routes/health.routes");
const dbTestRoutes = require("./routes/dbTest.routes");
const authRoutes = require("./routes/auth.routes");
const propertyRoutes = require("./routes/property.routes");
const partnerRoutes = require("./routes/partner.routes");
const adminRoutes = require("./routes/admin.routes");
const bookingRoutes = require("./routes/booking.routes");

const app = express();

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      process.env.ADMIN_CLIENT_URL || "http://localhost:5174",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api", healthRoutes);
app.use("/api", dbTestRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/", (req, res) => {
  res.send("TourismHub LK Backend API");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});