// Property model
import mongoose, { Schema, Model } from 'mongoose';
import { Property as IProperty } from '@/types';

const propertySchema = new Schema<IProperty>(
  {
    listingId: {
      type: String,
      required: true,
      unique: true,
    },
    propertyName: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      required: true,
    },
    receptionMobile: {
      type: String,
      required: true,
    },
    ownerMobile: {
      type: String,
      required: true,
    },
    receptionLandline: String,
    receptionEmail: {
      type: String,
      required: true,
    },
    ownerEmail: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    locality: String,
    state: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    pincode: String,
    landmark: String,
    googleBusinessLink: String,
    gstNo: String,
    panNo: String,
    gstCertificate: String,
    panCard: String,
    propertyImages: [String],
    overnightRooms: [Schema.Types.Mixed],
    hourlyRooms: [Schema.Types.Mixed],
    packages: [Schema.Types.Mixed],
    hotelAmenities: [String], // Array of selected hotel amenity names
    roomAmenities: [String], // Array of selected room amenity names
    placesOfInterest: [{
      name: String,
      distance: String, // Optional distance
    }],
    latitude: Number, // Google Maps latitude
    longitude: Number, // Google Maps longitude
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: false,
  }
);

// Prevent model re-compilation during serverless function invocations
const Property: Model<IProperty> =
  mongoose.models.Property ||
  mongoose.model<IProperty>('Property', propertySchema);

export default Property;

