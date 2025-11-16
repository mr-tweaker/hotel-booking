// Example: Converting Express route to Vercel Serverless Function
// File: api/auth/signup.js

// Instead of Express router, use Vercel function format
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

// Connect to MongoDB (connection is cached between invocations)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// User Schema (would be in a models folder)
const userSchema = new mongoose.Schema({
  phone: String,
  name: String,
  email: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Vercel Serverless Function Handler
export default async function handler(req, res) {
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
      return res.status(400).json({ error: "phone/name/email/password required" });
    }

    // Check if user exists
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ error: "User exists" });
    }

    // Create user
    const user = new User({ phone, name, email, password });
    await user.save();

    res.json({ success: true, message: "Signup saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
}

