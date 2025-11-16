// api/auth/signup.js - Signup endpoint
const connectDB = require('../../lib/db');
const User = require('../../models/User');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { phone, name, email, password } = req.body;

    if (!phone || !name || !email || !password) {
      return res.status(400).json({ error: 'phone/name/email/password required' });
    }

    // Check if user exists
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ error: 'User exists' });
    }

    // Create user
    const user = new User({ phone, name, email, password });
    await user.save();

    res.json({ success: true, message: 'Signup saved' });
  } catch (err) {
    console.error('Signup error:', err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    res.status(500).json({ error: 'Signup failed' });
  }
};

