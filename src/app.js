const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const courseRoutes = require("./routes/courseRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running", status: "OK" });
});

// Error middleware
app.use(errorMiddleware);

module.exports = app;
