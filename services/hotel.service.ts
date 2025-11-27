// Hotel service - handles hotel search and business logic
import Hotel from '@/models/Hotel';
import connectDB from '@/lib/db';
import { ApiResponse } from '@/types';

export interface HotelSearchParams {
  city?: string;
  locality?: string | string[];
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  stars?: number | number[];
  amenities?: string[];
  checkIn?: Date | string;
  checkOut?: Date | string;
  guests?: number;
  rooms?: number;
  sortBy?: 'popularity' | 'price' | 'starRating';
  sortOrder?: 'asc' | 'desc';
  coupleFriendly?: boolean;
  localId?: boolean;
  payAtHotel?: boolean;
  newlyAdded?: boolean;
}

export interface HotelSearchResult {
  _id?: string;
  hotelId: string;
  name: string;
  city: string;
  locality: string;
  state: string;
  address?: string;
  price: number;
  checkInCharge?: number;
  stars: number;
  amenities: string[];
  hotelAmenities?: string[];
  roomAmenities?: string[];
  placesOfInterest?: Array<{ name: string; distance?: string }>;
  latitude?: number;
  longitude?: number;
  images?: string[];
  description?: string;
  propertyType: string;
  availableForHourly?: boolean;
  availableForDay?: boolean;
  hourlyRooms?: Array<unknown>;
}

const normalizeImageUrls = (images?: string[]) => {
  if (!images || images.length === 0) return [];
  return images
    .map((img) => {
      if (!img) return null;
      if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
        return img;
      }
      return `/${img.replace(/^\/+/, '')}`;
    })
    .filter(Boolean) as string[];
};

export class HotelService {
  async searchHotels(params: HotelSearchParams): Promise<ApiResponse<HotelSearchResult[]>> {
    try {
      await connectDB();

      const query: Record<string, unknown> = {
        isActive: true,
      };

      // City filter
      if (params.city) {
        query.city = { $regex: new RegExp(params.city, 'i') };
      }

      // Locality filter (supports single or multiple)
      if (params.locality) {
        if (Array.isArray(params.locality) && params.locality.length > 0) {
          query.locality = { $in: params.locality };
        } else if (typeof params.locality === 'string' && params.locality !== 'All') {
          query.locality = { $regex: new RegExp(params.locality, 'i') };
        }
      }

      // Property type filter
      if (params.propertyType) {
        query.propertyType = params.propertyType;
      }

      // Price range filter
      if (params.minPrice || params.maxPrice) {
        query.price = {};
        if (params.minPrice) {
          (query.price as Record<string, unknown>).$gte = params.minPrice;
        }
        if (params.maxPrice) {
          (query.price as Record<string, unknown>).$lte = params.maxPrice;
        }
      }

      // Stars filter (supports single or multiple)
      if (params.stars) {
        if (Array.isArray(params.stars) && params.stars.length > 0) {
          query.stars = { $in: params.stars };
        } else if (typeof params.stars === 'number') {
          query.stars = params.stars;
        }
      }

      // Amenities filter (at least one must match)
      if (params.amenities && params.amenities.length > 0) {
        query.amenities = { $in: params.amenities };
      }

      // Additional filters
      if (params.newlyAdded) {
      // If a time range is specified, restrict to hotels that support hourly stays
      if (params.checkIn && params.checkOut) {
        query.availableForHourly = true;
      }
        // Filter hotels added in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.createdAt = { $gte: thirtyDaysAgo };
      }

      // Build sort object
      let sortObject: Record<string, 1 | -1> = {};
      if (params.sortBy) {
        switch (params.sortBy) {
          case 'price':
            sortObject.price = params.sortOrder === 'asc' ? 1 : -1;
            break;
          case 'starRating':
            sortObject.stars = params.sortOrder === 'asc' ? 1 : -1;
            break;
          case 'popularity':
          default:
            // Popularity: sort by stars (desc) then price (asc)
            sortObject.stars = -1;
            sortObject.price = 1;
            break;
        }
      } else {
        // Default: popularity (stars desc, price asc)
        sortObject.stars = -1;
        sortObject.price = 1;
      }

      const hotels = await Hotel.find(query)
        .sort(sortObject)
        .limit(100);

      const results: HotelSearchResult[] = hotels.map((hotel) => ({
        _id: hotel._id?.toString(),
        hotelId: hotel.hotelId,
        name: hotel.name,
        city: hotel.city,
        locality: hotel.locality,
        state: hotel.state,
        address: hotel.address,
        price: hotel.price,
        checkInCharge: (hotel as any).checkInCharge || 500,
        stars: hotel.stars,
        amenities: hotel.amenities,
        hotelAmenities: hotel.hotelAmenities,
        roomAmenities: hotel.roomAmenities,
        placesOfInterest: hotel.placesOfInterest as Array<{ name: string; distance?: string }>,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        images: normalizeImageUrls(hotel.images),
        description: hotel.description,
        propertyType: hotel.propertyType,
        availableForHourly: (hotel as any).availableForHourly,
        availableForDay: (hotel as any).availableForDay,
        hourlyRooms: (hotel as any).hourlyRooms,
      }));

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error('Search hotels error:', error);
      return {
        success: false,
        error: 'Failed to search hotels',
      };
    }
  }

  async getHotelById(hotelId: string): Promise<ApiResponse<HotelSearchResult>> {
    try {
      await connectDB();

      // Try to find by hotelId first, then by _id
      let hotel = await Hotel.findOne({ hotelId, isActive: true });
      
      if (!hotel) {
        // Try finding by _id if hotelId doesn't match
        hotel = await Hotel.findOne({ _id: hotelId, isActive: true });
      }

      if (!hotel) {
        return {
          success: false,
          error: 'Hotel not found',
        };
      }

      const result: HotelSearchResult = {
        _id: hotel._id?.toString(),
        hotelId: hotel.hotelId,
        name: hotel.name,
        city: hotel.city,
        locality: hotel.locality,
        state: hotel.state,
        address: hotel.address,
        price: hotel.price,
        checkInCharge: (hotel as any).checkInCharge || 500,
        stars: hotel.stars,
        amenities: hotel.amenities,
        hotelAmenities: hotel.hotelAmenities,
        roomAmenities: hotel.roomAmenities,
        placesOfInterest: hotel.placesOfInterest as Array<{ name: string; distance?: string }>,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        images: normalizeImageUrls(hotel.images),
        description: hotel.description,
        propertyType: hotel.propertyType,
        availableForHourly: (hotel as any).availableForHourly,
        availableForDay: (hotel as any).availableForDay,
        hourlyRooms: (hotel as any).hourlyRooms,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Get hotel error:', error);
      return {
        success: false,
        error: 'Failed to fetch hotel',
      };
    }
  }

  async getCities(): Promise<ApiResponse<string[]>> {
    try {
      await connectDB();

      const cities = await Hotel.distinct('city', { isActive: true });
      return {
        success: true,
        data: cities.sort(),
      };
    } catch (error) {
      console.error('Get cities error:', error);
      return {
        success: false,
        error: 'Failed to fetch cities',
      };
    }
  }

  async getLocalities(city?: string): Promise<ApiResponse<string[]>> {
    try {
      await connectDB();

      const query: Record<string, unknown> = { isActive: true };
      if (city) {
        query.city = { $regex: new RegExp(city, 'i') };
      }

      const localities = await Hotel.distinct('locality', query);
      return {
        success: true,
        data: localities.sort(),
      };
    } catch (error) {
      console.error('Get localities error:', error);
      return {
        success: false,
        error: 'Failed to fetch localities',
      };
    }
  }
}

export const hotelService = new HotelService();

