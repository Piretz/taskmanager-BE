const express = require('express');
const router = express.Router();
const User = require('../models/user'); // adjust if needed
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Use environment variable securely
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing in environment variables.');
  process.exit(1);
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter both email and password.' });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ msg: 'Invalid email or password.' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Respond with token and user info
    return res.status(200).json({
      msg: 'Login successful.',
      token,
      user: {
        fullname: user.name || user.fullname, // fallback
        email: user.email,
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ msg: 'Server error. Please try again later.' });
  }
});

module.exports = router;
