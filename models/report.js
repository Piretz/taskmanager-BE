import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  busId: { type: String, required: true },
  stop: { type: String, required: true },
  travelTime: { type: Number, required: true }, // minutes between stops
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Report", reportSchema);
