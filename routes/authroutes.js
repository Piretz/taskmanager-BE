import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = Router();

// ✅ Helper: Use fallback secret in dev (DO NOT use in prod!)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_for_dev';

// ✅ REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ msg: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      msg: 'User registered',
      user: {
        fullname: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error('❌ Register Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ✅ LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      msg: 'Login successful',
      token,
      user: {
        fullname: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('❌ Login Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
