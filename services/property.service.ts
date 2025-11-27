// Property service - handles property listing business logic
import Property from '@/models/Property';
import Hotel from '@/models/Hotel';
import connectDB from '@/lib/db';
import { Property as IProperty, ApiResponse, RoomDetail } from '@/types';

export class PropertyService {
  async createProperty(propertyData: Partial<IProperty>): Promise<ApiResponse<IProperty>> {
    try {
      await connectDB();

      // Generate listingId if not provided
      if (!propertyData.listingId) {
        propertyData.listingId =
          'PROP' + Date.now() + Math.random().toString(36).substring(2, 11);
      }

      // Set default status
      if (!propertyData.status) {
        propertyData.status = 'pending';
      }

      // Set submittedAt
      if (!propertyData.submittedAt) {
        propertyData.submittedAt = new Date();
      }

      console.log('Saving property to database:', {
        listingId: propertyData.listingId,
        propertyName: propertyData.propertyName,
        city: propertyData.city,
      });

      const property = new Property(propertyData);
      await property.save();

      console.log('Property saved successfully:', property.listingId);

      return {
        success: true,
        data: property.toObject() as IProperty,
        message: 'Property listing submitted successfully. We will contact you within 24 hours.',
      };
    } catch (error) {
      console.error('Create property error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check for MongoDB validation errors
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
        const validationError = error as any;
        const errors = Object.keys(validationError.errors || {}).map(
          (key) => `${key}: ${validationError.errors[key].message}`
        );
        return {
          success: false,
          error: `Validation error: ${errors.join(', ')}`,
        };
      }
      
      // Check for duplicate key errors
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return {
          success: false,
          error: 'Property listing ID already exists. Please try again.',
        };
      }

      return {
        success: false,
        error: `Failed to submit property listing: ${errorMessage}`,
      };
    }
  }

  async getProperties(): Promise<ApiResponse<IProperty[]>> {
    try {
      await connectDB();
      const properties = await Property.find().sort({ submittedAt: -1 });
      return {
        success: true,
        data: properties.map((p) => p.toObject() as IProperty),
      };
    } catch (error) {
      console.error('Get properties error:', error);
      return {
        success: false,
        error: 'Failed to fetch properties',
      };
    }
  }

  async getPropertyById(listingId: string): Promise<ApiResponse<IProperty>> {
    try {
      await connectDB();
      const property = await Property.findOne({ listingId });

      if (!property) {
        return {
          success: false,
          error: 'Property not found',
        };
      }

      return {
        success: true,
        data: property.toObject() as IProperty,
      };
    } catch (error) {
      console.error('Get property error:', error);
      return {
        success: false,
        error: 'Failed to fetch property',
      };
    }
  }

  async updateProperty(
    listingId: string,
    updateData: Partial<IProperty>
  ): Promise<ApiResponse<IProperty>> {
    try {
      await connectDB();

      const property = await Property.findOneAndUpdate(
        { listingId },
        { $set: updateData },
        { new: true }
      );

      if (!property) {
        return {
          success: false,
          error: 'Property not found',
        };
      }

      await this.syncHotelListing(property.toObject() as IProperty);

      return {
        success: true,
        data: property.toObject() as IProperty,
      };
    } catch (error) {
      console.error('Update property error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check for MongoDB validation errors
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
        const validationError = error as any;
        const errors = Object.keys(validationError.errors || {}).map(
          (key) => `${key}: ${validationError.errors[key].message}`
        );
        return {
          success: false,
          error: `Validation error: ${errors.join(', ')}`,
        };
      }

      return {
        success: false,
        error: `Failed to update property: ${errorMessage}`,
      };
    }
  }

  private extractPricing(property: IProperty) {
    let hourlyCharge: number | null = null;
    let hourlyCheckIn: number | null = null;
    let generalCharge: number | null = null;

    property.packages?.forEach((pkg) => {
      const duration = pkg.duration;
      const hourlyValue = pkg.hourlyCharge !== undefined ? Number(pkg.hourlyCharge) : NaN;
      const checkValue = pkg.checkInCharge !== undefined ? Number(pkg.checkInCharge) : NaN;

      if (duration === 'Hourly') {
        if (!Number.isNaN(hourlyValue)) {
          hourlyCharge = hourlyCharge === null ? hourlyValue : Math.min(hourlyCharge, hourlyValue);
        }
        if (!Number.isNaN(checkValue)) {
          hourlyCheckIn = hourlyCheckIn === null ? checkValue : Math.min(hourlyCheckIn, checkValue);
        }
      } else if (!Number.isNaN(checkValue)) {
        generalCharge = generalCharge === null ? checkValue : Math.min(generalCharge, checkValue);
      }
    });

    return {
      price: hourlyCharge ?? generalCharge ?? 999,
      checkInCharge: hourlyCheckIn ?? generalCharge ?? 500,
    };
  }

  private collectRoomAmenities(property: IProperty): string[] {
    const set = new Set<string>();

    const addAmenity = (amenity?: string) => {
      if (amenity) {
        set.add(amenity);
      }
    };

    (property.roomAmenities || []).forEach(addAmenity);

    const collectFromRooms = (rooms?: Array<RoomDetail | Record<string, unknown>>) => {
      rooms?.forEach((room) => {
        const amenities =
          (room as RoomDetail).roomAmenities ||
          (room as Record<string, unknown>).roomAmenities;
        if (Array.isArray(amenities)) {
          amenities.forEach((a) => {
            if (typeof a === 'string') addAmenity(a);
          });
        } else if (amenities && typeof amenities === 'object') {
          Object.entries(amenities).forEach(([key, value]) => {
            if (value === true || value === 'on' || value === 'true' || value === 1) {
              addAmenity(key);
            }
          });
        }
      });
    };

    collectFromRooms(property.overnightRooms as RoomDetail[]);
    collectFromRooms(property.hourlyRooms as RoomDetail[]);

    return Array.from(set);
  }

  private collectHotelAmenities(property: IProperty): string[] {
    const set = new Set<string>();
    (property.hotelAmenities || []).forEach((a) => {
      if (a) set.add(a);
    });
    return Array.from(set);
  }

  private extractRoomTypesFromPackages(property: IProperty): Array<{
    category: string;
    hourlyCharge?: number;
    checkInCharge?: number;
    dayCharge?: number;
    nightCharge?: number;
    charge24Hours?: number;
  }> {
    const roomTypesMap = new Map<string, {
      category: string;
      hourlyCharge?: number;
      checkInCharge?: number;
      dayCharge?: number;
      nightCharge?: number;
      charge24Hours?: number;
    }>();

    // Extract room types from packages
    (property.packages || []).forEach((pkg) => {
      if (!pkg.category) return;

      const category = pkg.category;
      const duration = pkg.duration || '';

      // Initialize room type if not exists
      if (!roomTypesMap.has(category)) {
        roomTypesMap.set(category, { category });
      }

      const roomType = roomTypesMap.get(category)!;

      // Store rates based on duration
      if (duration === 'Hourly') {
        if (pkg.hourlyCharge !== undefined && pkg.hourlyCharge !== null && pkg.hourlyCharge !== '') {
          roomType.hourlyCharge = Number(pkg.hourlyCharge);
        }
        if (pkg.checkInCharge !== undefined && pkg.checkInCharge !== null && pkg.checkInCharge !== '') {
          roomType.checkInCharge = Number(pkg.checkInCharge);
        }
      } else if (duration === 'Day') {
        if (pkg.checkInCharge !== undefined && pkg.checkInCharge !== null && pkg.checkInCharge !== '') {
          roomType.dayCharge = Number(pkg.checkInCharge);
        }
      } else if (duration === 'Night') {
        if (pkg.checkInCharge !== undefined && pkg.checkInCharge !== null && pkg.checkInCharge !== '') {
          roomType.nightCharge = Number(pkg.checkInCharge);
        }
      } else if (duration === '24 hours') {
        if (pkg.checkInCharge !== undefined && pkg.checkInCharge !== null && pkg.checkInCharge !== '') {
          roomType.charge24Hours = Number(pkg.checkInCharge);
        }
      }
    });

    return Array.from(roomTypesMap.values());
  }

  private async syncHotelListing(property: IProperty) {
    try {
      if (!property.listingId) return;

      if (property.status === 'approved') {
        const pricing = this.extractPricing(property);

        const hotelAmenities = this.collectHotelAmenities(property);
        const roomAmenities = this.collectRoomAmenities(property);
        const amenitiesSet = new Set<string>([
          ...hotelAmenities,
          ...roomAmenities,
        ]);

        const bookingCategories = property.bookingTypeCategories || [];
        const availableForHourly = bookingCategories.includes('Hourly');
        const availableForDay = bookingCategories.includes('Day');

        // Extract room types from packages
        const roomTypes = this.extractRoomTypesFromPackages(property);

        const imageUrls = (property.propertyImages || [])
          .map((img) => {
            if (!img) return null;
            if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
              return img;
            }
            if (img.startsWith('/')) {
              return img;
            }
            return `/${img.replace(/^\/+/, '')}`;
          })
          .filter(Boolean) as string[];

        const hotelData = {
          hotelId: property.listingId,
          name: property.propertyName || 'Untitled Property',
          city: property.city || 'Unknown',
          locality: property.locality || property.city || 'City Center',
          state: property.state || property.city || 'N/A',
          address: property.address,
          price: pricing.price,
          checkInCharge: pricing.checkInCharge,
          stars: 4,
          amenities: Array.from(amenitiesSet),
          hotelAmenities,
          roomAmenities,
          images: imageUrls,
          description: property.propertyType ? `${property.propertyType} in ${property.city}` : undefined,
          propertyType:
            property.propertyType === 'Resort'
              ? 'Resort'
              : property.propertyType === 'Homestay'
              ? 'Homestay'
              : 'Hotel',
          hourlyRooms: roomTypes.length > 0 ? roomTypes : property.hourlyRooms,
          placesOfInterest: property.placesOfInterest,
          latitude: property.latitude,
          longitude: property.longitude,
          availableForHourly,
          availableForDay,
          isActive: true,
        };

        await Hotel.findOneAndUpdate(
          { hotelId: property.listingId },
          hotelData,
          { upsert: true, new: true }
        );
      } else {
        await Hotel.findOneAndUpdate(
          { hotelId: property.listingId },
          { isActive: false }
        );
      }
    } catch (error) {
      console.error('syncHotelListing error:', error);
    }
  }
}

export const propertyService = new PropertyService();

