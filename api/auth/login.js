// api/auth/login.js - Login endpoint
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

    const { user, pass, email, password } = req.body;

    // Support both {user,pass} and {email,password}
    let testUser;
    if (user && pass) {
      testUser = await User.findOne({
        $or: [{ email: user }, { phone: user }],
        password: pass,
      });
    } else if (email && password) {
      testUser = await User.findOne({ email, password });
    } else {
      return res.status(400).json({ error: 'Credentials required' });
    }

    if (!testUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      success: true,
      user: {
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

