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
const exploreRoutes = require("./routes/explore.routes");
const adminExploreRoutes = require("./routes/adminExplore.routes");
const bookingRoutes = require("./routes/booking.routes");
const touristEventRoutes = require("./routes/touristEvent.routes");
const partnerEventRoutes = require("./routes/partnerEvent.routes");
const adminEventRoutes = require("./routes/adminEvent.routes");
const adminGuideRoutes = require("./routes/adminGuide.routes");
const partnerGuideRoutes = require("./routes/partnerGuide.routes");
const publicGuideRoutes = require("./routes/publicGuide.routes");
const assistantRoutes = require("./routes/assistant.routes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "https://e23-co2060-hotel-management-system.vercel.app",
  process.env.CLIENT_URL,
  process.env.ADMIN_CLIENT_URL,
].filter(Boolean);

const isLocalDevelopmentOrigin = (origin) => {
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");
};

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || isLocalDevelopmentOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.send("TourismHub LK Backend API");
});

app.get("/api/cors-test", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working",
    origin: req.headers.origin || "No origin header",
    allowedOrigins,
  });
});

app.use("/api", healthRoutes);
app.use("/api", dbTestRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/partner/events", partnerEventRoutes);
app.use("/api/partner/guides", partnerGuideRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/admin/events", adminEventRoutes);
app.use("/api/admin/guides", adminGuideRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/explore", adminExploreRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/tourist", touristEventRoutes);
app.use("/api/guides", publicGuideRoutes);
app.use("/api/assistant", assistantRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (err.message && err.message.startsWith("Not allowed by CORS")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Allowed CORS origins:", allowedOrigins);
  console.log("Local Vite development origins are allowed on any port.");
});

