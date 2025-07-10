const express = require('express');
const router = express.Router();
const User = require('../models/user'); // adjust path if needed
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Secret key (you can move this to .env)
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

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

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid email or password.' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    // Send token and user info (frontend expects fullname and email)
    res.status(200).json({
      msg: 'Login successful.',
      token,
      user: {
        fullname: user.fullname,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error. Please try again later.' });
  }
});

module.exports = router;
