// models/AnalyticsEvent.js - Analytics event model
const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    index: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ts: {
    type: Date,
    default: Date.now,
    index: true,
  },
  category: {
    type: String,
    enum: ['visit', 'session', 'payment', 'booking', 'event'],
    index: true,
  },
});

// Prevent model re-compilation during serverless function invocations
const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsEventSchema);

module.exports = AnalyticsEvent;

