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

      console.log(`[updateProperty] Updating property ${listingId} with packages:`, {
        packagesCount: updateData.packages?.length || 0,
        packages: updateData.packages,
      });

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

      const propertyObj = property.toObject() as IProperty;
      console.log(`[updateProperty] Property saved. Packages in DB:`, {
        packagesCount: propertyObj.packages?.length || 0,
        packages: propertyObj.packages,
      });

      await this.syncHotelListing(propertyObj);

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
      if (amenity && typeof amenity === 'string') {
        set.add(amenity.trim());
      }
    };

    // Collect from global roomAmenities array (legacy)
    (property.roomAmenities || []).forEach(addAmenity);

    const collectFromRooms = (rooms?: Array<RoomDetail | Record<string, unknown>>) => {
      rooms?.forEach((room) => {
        const amenities =
          (room as RoomDetail).roomAmenities ||
          (room as Record<string, unknown>).roomAmenities;
        
        if (!amenities) return;

        // Handle array format (legacy): ['Mineral Water', 'Hot Water']
        if (Array.isArray(amenities)) {
          amenities.forEach((a) => {
            if (typeof a === 'string') addAmenity(a);
          });
        } 
        // Handle object format: { Normal: ['Mineral Water', 'Hot Water'], Deluxe: ['Wifi', 'AC'] }
        else if (amenities && typeof amenities === 'object' && !Array.isArray(amenities)) {
          Object.values(amenities).forEach((value) => {
            // If value is an array of amenity names (current structure)
            if (Array.isArray(value)) {
              value.forEach((a) => {
                if (typeof a === 'string') addAmenity(a);
              });
            }
            // If value is a string (single amenity, legacy)
            else if (typeof value === 'string') {
              addAmenity(value);
            }
          });
          
          // Also check if keys are amenity names with boolean values (legacy checkbox format)
          // This handles: { 'Mineral Water': true, 'Hot Water': true }
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

    const roomAmenitiesList = Array.from(set);
    console.log('Collected room amenities:', roomAmenitiesList);
    return roomAmenitiesList;
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
    roomAmenities?: string[];
  }> {
    const roomTypesMap = new Map<string, {
      category: string;
      hourlyCharge?: number;
      checkInCharge?: number;
      dayCharge?: number;
      nightCharge?: number;
      charge24Hours?: number;
      roomAmenities?: string[];
    }>();

    console.log('Extracting room types from packages. Total packages:', property.packages?.length || 0);
    console.log('Packages data:', JSON.stringify(property.packages, null, 2));

    // Extract room types from packages
    (property.packages || []).forEach((pkg, index) => {
      console.log(`Processing package ${index}:`, JSON.stringify(pkg, null, 2));
      
      if (!pkg) {
        console.warn(`Package ${index} is null or undefined`);
        return;
      }

      const duration = (pkg.duration || '').trim();

      // First, extract from the charges object if it exists (this contains all cached categories)
      if (pkg.charges && typeof pkg.charges === 'object' && !Array.isArray(pkg.charges)) {
        console.log(`Package ${index} has charges object with categories:`, Object.keys(pkg.charges));
        
        Object.keys(pkg.charges).forEach((categoryKey) => {
          const category = String(categoryKey).trim();
          if (!category) return;

          // Initialize room type if not exists
          if (!roomTypesMap.has(category)) {
            roomTypesMap.set(category, { category });
          }

          const roomType = roomTypesMap.get(category)!;
          const chargeData = (pkg.charges as any)[categoryKey];

          // Store rates based on duration from the charges object
          if (duration === 'Hourly') {
            if (chargeData.hourlyCharge !== undefined && chargeData.hourlyCharge !== null && chargeData.hourlyCharge !== '') {
              const hourlyValue = Number(chargeData.hourlyCharge);
              if (!isNaN(hourlyValue) && hourlyValue > 0) {
                roomType.hourlyCharge = hourlyValue;
              }
            }
            if (chargeData.checkInCharge !== undefined && chargeData.checkInCharge !== null && chargeData.checkInCharge !== '') {
              const checkInValue = Number(chargeData.checkInCharge);
              if (!isNaN(checkInValue) && checkInValue > 0) {
                roomType.checkInCharge = checkInValue;
              }
            }
          } else if (duration === 'Day') {
            if (chargeData.checkInCharge !== undefined && chargeData.checkInCharge !== null && chargeData.checkInCharge !== '') {
              const dayValue = Number(chargeData.checkInCharge);
              if (!isNaN(dayValue) && dayValue > 0) {
                roomType.dayCharge = dayValue;
              }
            }
          } else if (duration === 'Night') {
            if (chargeData.checkInCharge !== undefined && chargeData.checkInCharge !== null && chargeData.checkInCharge !== '') {
              const nightValue = Number(chargeData.checkInCharge);
              if (!isNaN(nightValue) && nightValue > 0) {
                roomType.nightCharge = nightValue;
              }
            }
          } else if (duration === '24 hours') {
            if (chargeData.checkInCharge !== undefined && chargeData.checkInCharge !== null && chargeData.checkInCharge !== '') {
              const charge24Value = Number(chargeData.checkInCharge);
              if (!isNaN(charge24Value) && charge24Value > 0) {
                roomType.charge24Hours = charge24Value;
              }
            }
          }
        });
      }

      // Also extract from the main category field (for backward compatibility and packages without charges object)
      if (pkg.category) {
        const category = String(pkg.category).trim();
        if (category) {
          console.log(`Package ${index}: category="${category}", duration="${duration}"`);

          // Initialize room type if not exists
          if (!roomTypesMap.has(category)) {
            roomTypesMap.set(category, { category });
          }

          const roomType = roomTypesMap.get(category)!;

          // Store rates based on duration (only if not already set from charges object)
          if (duration === 'Hourly') {
            if (pkg.hourlyCharge !== undefined && pkg.hourlyCharge !== null && pkg.hourlyCharge !== '' && !roomType.hourlyCharge) {
              const hourlyValue = Number(pkg.hourlyCharge);
              if (!isNaN(hourlyValue) && hourlyValue > 0) {
                roomType.hourlyCharge = hourlyValue;
              }
            }
            if (pkg.checkInCharge !== undefined && pkg.checkInCharge !== null && pkg.checkInCharge !== '' && !roomType.checkInCharge) {
              const checkInValue = Number(pkg.checkInCharge);
              if (!isNaN(checkInValue) && checkInValue > 0) {
                roomType.checkInCharge = checkInValue;
              }
            }
          } else if (duration === 'Day') {
            if (pkg.checkInCharge !== undefined && pkg.checkInCharge !== null && pkg.checkInCharge !== '' && !roomType.dayCharge) {
              const dayValue = Number(pkg.checkInCharge);
              if (!isNaN(dayValue) && dayValue > 0) {
                roomType.dayCharge = dayValue;
              }
            }
          } else if (duration === 'Night') {
            if (pkg.checkInCharge !== undefined && pkg.checkInCharge !== null && pkg.checkInCharge !== '' && !roomType.nightCharge) {
              const nightValue = Number(pkg.checkInCharge);
              if (!isNaN(nightValue) && nightValue > 0) {
                roomType.nightCharge = nightValue;
              }
            }
          } else if (duration === '24 hours') {
            if (pkg.checkInCharge !== undefined && pkg.checkInCharge !== null && pkg.checkInCharge !== '' && !roomType.charge24Hours) {
              const charge24Value = Number(pkg.checkInCharge);
              if (!isNaN(charge24Value) && charge24Value > 0) {
                roomType.charge24Hours = charge24Value;
              }
            }
          }
        }
      }
    });

    // Extract room amenities per room type from overnightRooms
    const collectRoomAmenitiesByType = (rooms?: Array<RoomDetail | Record<string, unknown>>) => {
      console.log('Collecting room amenities by type. Total rooms:', rooms?.length || 0);
      rooms?.forEach((room, roomIndex) => {
        const amenities = (room as RoomDetail).roomAmenities || (room as Record<string, unknown>).roomAmenities;
        
        console.log(`\n=== Processing room ${roomIndex} ===`);
        console.log(`Amenities type:`, Array.isArray(amenities) ? 'array' : typeof amenities);
        if (amenities && typeof amenities === 'object' && !Array.isArray(amenities)) {
          console.log(`Amenities object keys:`, Object.keys(amenities));
        } else if (Array.isArray(amenities)) {
          console.log(`Amenities array:`, amenities);
        }
        
        if (!amenities) {
          console.warn(`Room ${roomIndex} has no amenities`);
          return;
        }

        // Handle array format (legacy): ['Mineral Water', 'Hot Water']
        if (Array.isArray(amenities)) {
          const roomCategory = (room as RoomDetail).category || (room as Record<string, unknown>).category;
          if (!roomCategory) {
            console.warn(`Room ${roomIndex} has array amenities but no category, skipping`);
            return;
          }
          const category = String(roomCategory).trim();
          
          // Get or create room type entry
          if (!roomTypesMap.has(category)) {
            roomTypesMap.set(category, { category });
          }
          const roomType = roomTypesMap.get(category)!;
          
          // Initialize roomAmenities array if not exists
          if (!roomType.roomAmenities) {
            roomType.roomAmenities = [];
          }
          
          amenities.forEach((a) => {
            if (typeof a === 'string' && !roomType.roomAmenities!.includes(a.trim())) {
              roomType.roomAmenities!.push(a.trim());
            }
          });
        }
        // Handle object format: { Normal: ['Mineral Water', 'Hot Water'], Deluxe: ['Wifi', 'AC'] }
        // IMPORTANT: The object contains amenities for ALL room types, so we extract ALL of them
        else if (amenities && typeof amenities === 'object' && !Array.isArray(amenities)) {
          // Extract amenities for ALL categories found in the amenities object
          Object.keys(amenities).forEach((categoryKey) => {
            const category = String(categoryKey).trim();
            if (!category) return;
            
            const categoryAmenities = amenities[categoryKey];
            if (!Array.isArray(categoryAmenities)) return;
            
            // Get or create room type entry for this category
            if (!roomTypesMap.has(category)) {
              roomTypesMap.set(category, { category });
            }
            const roomType = roomTypesMap.get(category)!;
            
            // Initialize roomAmenities array if not exists
            if (!roomType.roomAmenities) {
              roomType.roomAmenities = [];
            }
            
            // Extract amenities for this specific category
            console.log(`✓ Extracting ${categoryAmenities.length} amenities for category "${category}":`, categoryAmenities);
            categoryAmenities.forEach((a: string) => {
              if (typeof a === 'string' && !roomType.roomAmenities!.includes(a.trim())) {
                roomType.roomAmenities!.push(a.trim());
              }
            });
          });
        }
      });
    };

    // Collect room amenities from overnightRooms and hourlyRooms
    collectRoomAmenitiesByType(property.overnightRooms as RoomDetail[]);
    collectRoomAmenitiesByType(property.hourlyRooms as RoomDetail[]);

    const roomTypes = Array.from(roomTypesMap.values());
    console.log(`Extracted ${roomTypes.length} unique room types from packages:`, JSON.stringify(roomTypes, null, 2));
    console.log('Room type categories:', roomTypes.map(rt => rt.category).join(', '));
    roomTypes.forEach(rt => {
      if (rt.roomAmenities && rt.roomAmenities.length > 0) {
        console.log(`Room type "${rt.category}" has ${rt.roomAmenities.length} amenities:`, rt.roomAmenities);
      }
    });
    return roomTypes;
  }

  private async syncHotelListing(property: IProperty) {
    try {
      if (!property.listingId) return;

      if (property.status === 'approved') {
        const pricing = this.extractPricing(property);

        const hotelAmenities = this.collectHotelAmenities(property);
        const roomAmenities = this.collectRoomAmenities(property);
        console.log(`[syncHotelListing] Collected ${roomAmenities.length} room amenities for property ${property.listingId}:`, roomAmenities);
        const amenitiesSet = new Set<string>([
          ...hotelAmenities,
          ...roomAmenities,
        ]);

        const bookingCategories = property.bookingTypeCategories || [];
        const availableForHourly = bookingCategories.includes('Hourly');
        const availableForDay = bookingCategories.includes('Day');

        // Extract room types from packages
        const roomTypes = this.extractRoomTypesFromPackages(property);
        console.log(`Extracted ${roomTypes.length} room types for property ${property.listingId}:`, roomTypes.map(rt => rt.category).join(', '));

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
          hourlyRooms: roomTypes.length > 0 ? roomTypes : (property.hourlyRooms || []),
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

