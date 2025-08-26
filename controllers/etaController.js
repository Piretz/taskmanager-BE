import Report from "../models/report.js";

// POST commuter report
export const addReport = async (req, res) => {
  try {
    const { busId, stop, travelTime } = req.body;
    const newReport = new Report({ busId, stop, travelTime });
    await newReport.save();
    res.json({ message: "Report added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save report" });
  }
};

// GET ETA between stops
export const getETA = async (req, res) => {
  try {
    const { busId, fromStop, toStop } = req.query;
    const now = new Date();

    // Fetch reports for this bus
    const reports = await Report.find({
      busId,
      stop: { $in: [fromStop, toStop] },
    });

    if (reports.length === 0) {
      return res.json({ eta: "Not enough data" });
    }

    // Filter reports from the last 2 hours
    const recentReports = reports.filter(
      (r) => now - r.timestamp <= 2 * 60 * 60 * 1000
    );

    const times = (recentReports.length ? recentReports : reports).map(
      (r) => r.travelTime
    );
    const avg = times.reduce((a, b) => a + b, 0) / times.length;

    res.json({ eta: `${Math.round(avg)} mins` });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate ETA" });
  }
};
