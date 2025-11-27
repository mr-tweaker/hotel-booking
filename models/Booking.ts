// Booking model
import mongoose, { Schema, Model } from 'mongoose';
import { Booking as IBooking } from '@/types';

const bookingSchema = new Schema<IBooking>(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    hotelId: String,
    hotelName: String,
    userEmail: String,
    userName: String,
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    roomNumber: String,
    roomType: String,
    price: {
      type: Number,
      required: true,
    },
    checkin: {
      type: Date,
      required: true,
    },
    checkout: {
      type: Date,
      required: false, // Optional - can be set later when customer checks out
    },
    paymentMethod: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partially paid'],
      default: 'pending',
    },
    numberOfGuests: Number,
    guests: [String],
    documents: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Prevent model re-compilation during serverless function invocations
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;

