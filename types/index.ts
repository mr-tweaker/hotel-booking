// Core types for the application

export interface User {
  _id?: string;
  phone: string;
  name: string;
  email: string;
  password?: string; // Excluded in responses
  createdAt?: Date;
}

export interface Booking {
  _id?: string;
  bookingId: string;
  hotelId?: string;
  hotelName?: string;
  userEmail?: string;
  userName?: string;
  name: string;
  phone: string;
  roomNumber?: string;
  roomType?: string;
  price: number;
  checkin: Date | string;
  checkout?: Date | string | null; // Optional - can be set later when customer checks out
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'partially paid';
  numberOfGuests?: number;
  guests?: string[];
  documents?: string[];
  createdAt?: Date;
}

export interface Property {
  _id?: string;
  listingId: string;
  propertyName: string;
  propertyType: string;
  receptionMobile: string;
  ownerMobile: string;
  receptionLandline?: string;
  receptionEmail: string;
  ownerEmail: string;
  city: string;
  locality?: string;
  state: string;
  address: string;
  pincode?: string;
  landmark?: string;
  googleBusinessLink?: string;
  gstNo?: string;
  panNo?: string;
  gstCertificate?: string;
  panCard?: string;
  propertyImages?: string[];
  overnightRooms?: RoomDetail[];
  hourlyRooms?: RoomDetail[];
  packages?: PackageDetail[];
  hotelAmenities?: string[]; // Selected hotel amenities
  roomAmenities?: string[]; // Selected room amenities
  placesOfInterest?: Array<{ name: string; distance?: string }>; // Places of interest with optional distance
  latitude?: number; // Google Maps latitude
  longitude?: number; // Google Maps longitude
  submittedAt?: Date;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface RoomDetail {
  category?: string;
  ratePlan?: 'EP' | 'CP' | 'MAP' | 'AP';
  rate?: number;
  rate3h?: number;
  rate6h?: number;
  rate9h?: number;
  rate12h?: number;
  rate24h?: number;
  additionalGuestRate?: number;
  freeChildren?: number;
  additionalChildRate?: number;
  standardOccupancy?: number;
  maxOccupancy?: number;
  roomAmenities?: string[];
}

export interface PackageDetail {
  duration?: string;
  category?: string;
  nights?: number;
  days?: number;
  children?: number;
  rate?: number;
  additionalAdultRate?: number;
  additionalChildRate?: number;
  roomDecorate?: boolean;
  welcomeDrink?: boolean;
  candleDinner?: boolean;
  breakfast?: boolean;
  buffet?: boolean;
  alacarte?: boolean;
  spa?: boolean;
  inclusions?: string;
  hourlyCharge?: number;
  checkInCharge?: number;
}

export interface AnalyticsEvent {
  _id?: string;
  type: string;
  payload?: Record<string, unknown>;
  ts?: Date;
  category?: 'visit' | 'session' | 'payment' | 'booking' | 'event';
}

export interface Hotel {
  id: string;
  name: string;
  locality: string;
  city?: string;
  price: number;
  checkInCharge?: number; // Base check-in charge (one-time fee, added to first hour)
  originalPrice?: number;
  discount?: number;
  bag2bagDiscount?: number;
  stars: number;
  rating?: number; // Decimal rating like 4.8, 4.6
  reviews?: number;
  amenities: string[];
  images?: string[];
  description?: string;
  distance?: string; // Distance from center
  availability?: number; // Number of rooms left
  isPremium?: boolean;
  isCertified?: boolean;
  hotelAmenities?: string[];
  roomAmenities?: string[];
  placesOfInterest?: Array<{ name: string; distance?: string }>;
  latitude?: number; // Google Maps latitude
  longitude?: number; // Google Maps longitude
  availableForHourly?: boolean;
  availableForDay?: boolean;
  hourlyRooms?: Array<{
    category: string;
    // Legacy rates (for backward compatibility)
    rate3h?: number;
    rate6h?: number;
    rate9h?: number;
    rate12h?: number;
    rate24h?: number;
    additionalGuestRate?: number;
    standardOccupancy?: number;
    maxOccupancy?: number;
    // New rates from packages
    hourlyCharge?: number;
    checkInCharge?: number;
    dayCharge?: number;
    nightCharge?: number;
    charge24Hours?: number;
  }>;
}

export interface SearchFilters {
  locality?: string | string[]; // Can be single or multiple localities
  maxPrice?: number;
  minPrice?: number;
  stars?: number | number[]; // Can be single or multiple star ratings
  amenities?: string[];
  propertyType?: string;
  sortBy?: 'popularity' | 'price' | 'starRating';
  sortOrder?: 'asc' | 'desc';
  coupleFriendly?: boolean;
  localId?: boolean;
  payAtHotel?: boolean;
  newlyAdded?: boolean;
  locationSearch?: string; // For location search bar
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'password'>;
  error?: string;
  message?: string;
}

