// api/analytics/event.js - Analytics event tracking
const connectDB = require('../../lib/db');
const AnalyticsEvent = require('../../models/AnalyticsEvent');

// Map event types to categories
function getCategory(type) {
  if (type === 'visit_home' || type === 'visit_search' || type === 'hotel_open') {
    return 'visit';
  } else if (type === 'signup' || type === 'signup_fail' || type === 'login_success' || type === 'login_fail') {
    return 'session';
  } else if (type === 'payment_page_opened' || type === 'booking_attempt' || type === 'booking_failed') {
    return 'payment';
  } else if (type === 'booking_completed' || type === 'booking_created') {
    return 'booking';
  }
  return 'event';
}

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

    const { type, payload, ts } = req.body || {};

    if (!type) {
      return res.status(400).json({ error: 'type required' });
    }

    const event = new AnalyticsEvent({
      type,
      payload: payload || {},
      ts: ts ? new Date(ts) : new Date(),
      category: getCategory(type),
    });

    await event.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to write event' });
  }
};

