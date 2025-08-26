import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authroutes.js";
import etaRoutes from "./routes/etaRoutes.js"; // ✅ NEW

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS setup
app.use(
  cors({
    origin: ["http://localhost:3000", "https://bus-tracker-be.onrender.com/"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api", etaRoutes); // ✅ Add ETA routes

// ✅ MongoDB & Server Initialization
const startServer = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error("❌ MONGO_URI not found in environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

startServer();
