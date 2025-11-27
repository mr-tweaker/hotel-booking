// Hotel model for searchable hotels/properties
import mongoose, { Schema, Model } from 'mongoose';

export interface IHotel {
  _id?: string;
  hotelId: string;
  name: string;
  city: string;
  locality: string;
  state: string;
  address?: string;
  price: number; // Starting price per hour
  checkInCharge?: number; // Base check-in charge (one-time fee)
  stars: number;
  amenities: string[];
  images?: string[];
  description?: string;
  propertyType: 'Hotel' | 'Homestay' | 'Resort';
  hourlyRooms?: Array<{
    category: string;
    rate3h?: number;
    rate6h?: number;
    rate9h?: number;
    rate12h?: number;
    rate24h?: number;
    additionalGuestRate?: number;
    standardOccupancy?: number;
    maxOccupancy?: number;
  }>;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const hotelSchema = new Schema<IHotel>(
  {
    hotelId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
      index: true,
    },
    locality: {
      type: String,
      required: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
    },
    address: String,
    price: {
      type: Number,
      required: true,
      index: true,
    },
    checkInCharge: {
      type: Number,
      default: 500, // Base check-in charge (can be customized per hotel)
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    amenities: [String],
  hotelAmenities: [String],
  roomAmenities: [String],
  placesOfInterest: [
    {
      name: String,
      distance: String,
    },
  ],
    images: [String],
    description: String,
    propertyType: {
      type: String,
      enum: ['Hotel', 'Homestay', 'Resort'],
      required: true,
      index: true,
    },
    hourlyRooms: [Schema.Types.Mixed],
    latitude: Number,
    longitude: Number,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    availableForHourly: {
      type: Boolean,
      default: false,
      index: true,
    },
    availableForDay: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better search performance
hotelSchema.index({ city: 1, locality: 1 });
hotelSchema.index({ propertyType: 1, isActive: 1 });
hotelSchema.index({ price: 1 });

// Prevent model re-compilation during serverless function invocations
const Hotel: Model<IHotel> =
  mongoose.models.Hotel || mongoose.model<IHotel>('Hotel', hotelSchema);

export default Hotel;

