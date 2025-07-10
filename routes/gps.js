import express from 'express';
import GPSLocation from '../models/GPSLocation.js';

const router = express.Router();

// POST /api/gps/update
router.post('/update', async (req, res) => {
  try {
    const { busId, latitude, longitude } = req.body;

    if (!busId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Upsert (update if exists, insert if not)
    const result = await GPSLocation.findOneAndUpdate(
      { busId },
      { latitude, longitude, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Location updated', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET /api/gps/all — fetch all current bus locations
router.get('/all', async (req, res) => {
  try {
    const data = await GPSLocation.find({});
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

export default router;
