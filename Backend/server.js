const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow all localhost variations and common dev ports
      const allowedOrigins = [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://0.0.0.0:5500",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://bookinghours.netlify.app",
        "https://bookinghours.com"
      ];
      
      // Check if origin matches any allowed origin or is a localhost variant
      if (allowedOrigins.includes(origin) || 
          origin.includes('localhost') || 
          origin.includes('127.0.0.1') ||
          origin.includes('0.0.0.0')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for development - restrict in production
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Ensure data and uploads directories exist
const dataDir = path.join(__dirname, "data");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// --------- Routes ----------
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const analyticsRoutes = require('./routes/analytics');
const propertyRoutes = require('./routes/property');

app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/property', propertyRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("BookingHours API running");
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
