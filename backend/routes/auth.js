const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const TOKEN_COOKIE_NAME = 'token';
const TOKEN_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

function createToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('📝 Register attempt:', { name, email, role });
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required' });
    }
    if (!['applicant', 'recruiter'].includes(role)) {
      return res.status(400).json({ message: 'role must be applicant or recruiter' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = new User({ name, email, password, role });
    await user.save();
    console.log('✅ User registered:', user._id);

    const token = createToken(user);

    res.cookie(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: TOKEN_EXPIRES_MS
    });

    return res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('❌ Register error:', err.stack);
    return res.status(500).json({ message: 'Server error', error: err.message || String(err) });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = createToken(user);
    res.cookie(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: TOKEN_EXPIRES_MS
    });

    const userObj = { id: user._id, name: user.name, email: user.email, role: user.role };
    return res.status(200).json({ user: userObj });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  });
  return res.json({ message: 'Logged out' });
});

module.exports = router;