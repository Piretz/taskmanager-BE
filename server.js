import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authroutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS setup for both dev and prod
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// DB Connect & Server Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
