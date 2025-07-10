import mongoose from 'mongoose';

const gpsLocationSchema = new mongoose.Schema({
  busId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.GPSLocation || mongoose.model('GPSLocation', gpsLocationSchema);
