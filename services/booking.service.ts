// Booking service - handles booking business logic
import Booking from '@/models/Booking';
import connectDB from '@/lib/db';
import { Booking as IBooking, ApiResponse } from '@/types';

export class BookingService {
  async createBooking(bookingData: Partial<IBooking>): Promise<ApiResponse<IBooking>> {
    try {
      await connectDB();

      // Ensure bookingId exists
      if (!bookingData.bookingId) {
        bookingData.bookingId =
          'BK' + Date.now() + Math.random().toString(36).substring(2, 11);
      }

      // Validate required fields
      if (!bookingData.name) {
        return {
          success: false,
          error: 'Guest name is required',
        };
      }

      if (!bookingData.phone) {
        return {
          success: false,
          error: 'Phone number is required',
        };
      }

      if (!bookingData.checkin) {
        return {
          success: false,
          error: 'Check-in date is required',
        };
      }

      // Convert date strings to Date objects
      if (typeof bookingData.checkin === 'string' && bookingData.checkin.trim() !== '') {
        const checkinDate = new Date(bookingData.checkin);
        if (isNaN(checkinDate.getTime())) {
          return {
            success: false,
            error: 'Invalid check-in date format',
          };
        }
        bookingData.checkin = checkinDate;
      }
      
      // Checkout is optional - handle null, undefined, empty string, or valid date string
      if (bookingData.checkout !== null && bookingData.checkout !== undefined) {
        if (typeof bookingData.checkout === 'string') {
          const trimmed = bookingData.checkout.trim();
          if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
            // Set to null if empty string or string "null"
            bookingData.checkout = null;
          } else {
            const checkoutDate = new Date(trimmed);
            if (isNaN(checkoutDate.getTime())) {
              return {
                success: false,
                error: 'Invalid check-out date format',
              };
            }
            bookingData.checkout = checkoutDate;
          }
        }
        // If it's already a Date object, keep it as is
      } else {
        // Explicitly set to null if null or undefined
        bookingData.checkout = null;
      }

      // Ensure price is set (default to 0 if not provided)
      if (typeof bookingData.price !== 'number') {
        bookingData.price = 0;
      }

      // Ensure paymentMethod is set
      if (!bookingData.paymentMethod) {
        bookingData.paymentMethod = 'pending';
      }

      // Ensure documents is an array (even if empty)
      if (!Array.isArray(bookingData.documents)) {
        bookingData.documents = bookingData.documents ? [bookingData.documents] : [];
      }

      // Ensure guests is an array
      if (!Array.isArray(bookingData.guests)) {
        bookingData.guests = bookingData.guests ? [bookingData.guests] : [];
      }

      console.log('Creating booking with data:', {
        bookingId: bookingData.bookingId,
        name: bookingData.name,
        checkin: bookingData.checkin,
        checkout: bookingData.checkout,
        documentsCount: bookingData.documents?.length || 0,
        guestsCount: bookingData.guests?.length || 0,
      });

      const booking = new Booking(bookingData);
      await booking.save();

      console.log('Booking saved successfully:', booking.bookingId);

      return {
        success: true,
        data: booking.toObject() as IBooking,
      };
    } catch (error) {
      console.error('Create booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check for MongoDB validation errors
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
        return {
          success: false,
          error: `Validation error: ${errorMessage}`,
        };
      }
      
      // Check for duplicate key errors
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        return {
          success: false,
          error: 'Booking ID already exists',
        };
      }

      return {
        success: false,
        error: `Failed to create booking: ${errorMessage}`,
      };
    }
  }

  async getBookings(): Promise<ApiResponse<IBooking[]>> {
    try {
      await connectDB();
      const bookings = await Booking.find().sort({ createdAt: -1 });
      return {
        success: true,
        data: bookings.map((b) => b.toObject() as IBooking),
      };
    } catch (error) {
      console.error('Get bookings error:', error);
      return {
        success: false,
        error: 'Failed to fetch bookings',
      };
    }
  }

  async getBookingById(bookingId: string): Promise<ApiResponse<IBooking>> {
    try {
      await connectDB();
      const booking = await Booking.findOne({ bookingId });

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
        };
      }

      return {
        success: true,
        data: booking.toObject() as IBooking,
      };
    } catch (error) {
      console.error('Get booking error:', error);
      return {
        success: false,
        error: 'Failed to fetch booking',
      };
    }
  }

  async updateBooking(
    bookingId: string,
    updateData: Partial<IBooking>
  ): Promise<ApiResponse<IBooking>> {
    try {
      await connectDB();

      // Convert date strings to Date objects if needed
      const processedData: any = { ...updateData };
      if (typeof processedData.checkin === 'string' && processedData.checkin.trim() !== '') {
        processedData.checkin = new Date(processedData.checkin);
      }
      
      // Checkout is optional - handle clearing it explicitly
      if ('checkout' in updateData) {
        if (typeof processedData.checkout === 'string') {
          if (processedData.checkout.trim() === '') {
            // Explicitly set to null to clear the field
            processedData.checkout = null;
          } else {
            processedData.checkout = new Date(processedData.checkout);
          }
        } else if (processedData.checkout === undefined || processedData.checkout === null) {
          // Explicitly set to null to clear the field
          processedData.checkout = null;
        }
      }

      const booking = await Booking.findOneAndUpdate(
        { bookingId },
        { ...processedData, bookingId }, // Ensure bookingId doesn't change
        { new: true }
      );

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
        };
      }

      return {
        success: true,
        data: booking.toObject() as IBooking,
      };
    } catch (error) {
      console.error('Update booking error:', error);
      return {
        success: false,
        error: 'Failed to update booking',
      };
    }
  }

  async deleteBooking(bookingId: string): Promise<ApiResponse> {
    try {
      await connectDB();

      const booking = await Booking.findOneAndDelete({ bookingId });

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
        };
      }

      return {
        success: true,
        message: 'Booking deleted successfully',
      };
    } catch (error) {
      console.error('Delete booking error:', error);
      return {
        success: false,
        error: 'Failed to delete booking',
      };
    }
  }
}

export const bookingService = new BookingService();

