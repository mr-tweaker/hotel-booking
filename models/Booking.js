// models/Booking.js - Booking model
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
  },
  hotelId: String,
  hotelName: String,
  userEmail: String,
  userName: String,
  name: String,
  phone: String,
  roomNumber: String,
  roomType: String,
  price: Number,
  checkin: Date,
  checkout: Date,
  paymentMethod: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partially paid'],
    default: 'pending',
  },
  numberOfGuests: Number,
  guests: [String],
  documents: [String], // Cloudinary URLs
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent model re-compilation during serverless function invocations
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

module.exports = Booking;

