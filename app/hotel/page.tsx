'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GoogleMapDisplay from '@/components/GoogleMapDisplay';
import { getCurrentUser } from '@/lib/auth';
import { hotelsApi, analyticsApi, apiRequest } from '@/lib/api-client';
import { Hotel, Booking, Property } from '@/types';

interface RoomType {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export default function HotelPage() {
  const searchParams = useSearchParams();
  const hotelId = searchParams.get('id') || '';
  const checkinDate = searchParams.get('checkin_date') || '2025-11-22';
  const checkinSlot = searchParams.get('checkin_slot') || '3';
  const slotCount = searchParams.get('slot_count') || '5';
  const roomCount = searchParams.get('room_count') || '1';
  const guestCount = searchParams.get('guest_count') || '2';

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [guestName, setGuestName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [showGST, setShowGST] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPriceBreakup, setShowPriceBreakup] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Editable booking details state
  const [editableCheckInDate, setEditableCheckInDate] = useState(checkinDate);
  const [editableCheckInTime, setEditableCheckInTime] = useState(parseInt(checkinSlot) || 20);
  const [editableCheckOutDate, setEditableCheckOutDate] = useState(() => {
    const date = new Date(checkinDate);
    const hours = parseInt(slotCount) || 5;
    date.setHours(date.getHours() + hours);
    return date.toISOString().split('T')[0];
  });
  const [editableCheckOutTime, setEditableCheckOutTime] = useState(() => {
    const checkInTimeSlot = parseInt(checkinSlot) || 20;
    const hours = parseInt(slotCount) || 5;
    return (checkInTimeSlot + hours) % 24;
  });
  const [editableRooms, setEditableRooms] = useState(parseInt(roomCount) || 1);
  const [editableGuests, setEditableGuests] = useState(parseInt(guestCount) || 2);
  
  // Dropdown visibility state
  const [showWhereToDropdown, setShowWhereToDropdown] = useState(false);
  const [showCheckInDropdown, setShowCheckInDropdown] = useState(false);
  const [showCheckOutDropdown, setShowCheckOutDropdown] = useState(false);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);

  // Parse dates and times from editable state
  const checkInDateObj = new Date(editableCheckInDate);
  checkInDateObj.setHours(editableCheckInTime, 0, 0, 0);
  const checkInTimeSlot = editableCheckInTime;
  const checkoutDateObj = new Date(editableCheckOutDate);
  checkoutDateObj.setHours(editableCheckOutTime, 0, 0, 0);
  
  // Calculate hours between check-in and check-out
  const hours = Math.max(1, Math.ceil((checkoutDateObj.getTime() - checkInDateObj.getTime()) / (1000 * 60 * 60)));

  useEffect(() => {
    loadHotelData();
    analyticsApi.trackEvent('hotel_open', { hotelId });
  }, [hotelId]);

  const loadHotelData = async () => {
    if (!hotelId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Try to get hotel by ID first
      const result = await hotelsApi.getById(hotelId);
      
      const enhanceFromProperty = async (base: Hotel): Promise<Hotel> => {
        try {
          const propRes = await apiRequest<Property>(`/property/${encodeURIComponent(hotelId)}`, {
            method: 'GET',
          });
          if (propRes.success && propRes.data) {
            const prop = propRes.data as Property;
            const hotelAmenities =
              prop.hotelAmenities && prop.hotelAmenities.length > 0
                ? prop.hotelAmenities
                : base.hotelAmenities || base.amenities || [];
            
            // Collect room amenities from property (same logic as backend sync)
            const roomAmenitiesSet = new Set<string>();
            
            // Add global room amenities (legacy)
            (prop.roomAmenities || []).forEach((a: string) => {
              if (a && typeof a === 'string') roomAmenitiesSet.add(a.trim());
            });
            
            // Collect from overnightRooms and hourlyRooms
            const collectFromRooms = (rooms?: any[]) => {
              rooms?.forEach((room) => {
                const amenities = room?.roomAmenities;
                if (!amenities) return;
                
                // Handle array format (legacy)
                if (Array.isArray(amenities)) {
                  amenities.forEach((a: string) => {
                    if (typeof a === 'string') roomAmenitiesSet.add(a.trim());
                  });
                }
                // Handle object format: { Normal: ['Mineral Water', 'Hot Water'], Deluxe: [...] }
                else if (amenities && typeof amenities === 'object' && !Array.isArray(amenities)) {
                  Object.values(amenities).forEach((value) => {
                    // If value is an array of amenity names
                    if (Array.isArray(value)) {
                      value.forEach((a: string) => {
                        if (typeof a === 'string') roomAmenitiesSet.add(a.trim());
                      });
                    }
                    // If value is a string (single amenity)
                    else if (typeof value === 'string') {
                      roomAmenitiesSet.add(value.trim());
                    }
                  });
                  
                  // Also check if keys are amenity names with boolean values (legacy checkbox format)
                  Object.entries(amenities).forEach(([key, value]) => {
                    if (value === true || value === 'on' || value === 'true' || value === 1) {
                      roomAmenitiesSet.add(key.trim());
                    }
                  });
                }
              });
            };
            
            collectFromRooms(prop.overnightRooms);
            collectFromRooms(prop.hourlyRooms);
            
            const roomAmenities = Array.from(roomAmenitiesSet);
            console.log('Collected room amenities from property:', roomAmenities);
            
            // Extract room amenities per room type and attach to hourlyRooms
            const enhancedHourlyRooms = base.hourlyRooms ? [...base.hourlyRooms] : [];
            const collectRoomAmenitiesByType = (rooms?: any[]) => {
              rooms?.forEach((room) => {
                const roomCategory = room?.category;
                if (!roomCategory) return;

                const category = String(roomCategory).trim();
                const amenities = room?.roomAmenities;
                
                if (!amenities) return;

                // Find or create room type entry in hourlyRooms
                let roomType = enhancedHourlyRooms.find(rt => rt.category === category);
                if (!roomType) {
                  roomType = { category };
                  enhancedHourlyRooms.push(roomType);
                }
                
                // Initialize roomAmenities array if not exists
                if (!roomType.roomAmenities) {
                  roomType.roomAmenities = [];
                }

                // Handle array format (legacy)
                if (Array.isArray(amenities)) {
                  amenities.forEach((a: string) => {
                    if (typeof a === 'string' && !roomType.roomAmenities!.includes(a.trim())) {
                      roomType.roomAmenities!.push(a.trim());
                    }
                  });
                }
                // Handle object format: { Normal: ['Mineral Water', 'Hot Water'], Deluxe: [...] }
                else if (amenities && typeof amenities === 'object' && !Array.isArray(amenities)) {
                  // If the object has the same category key, extract its amenities
                  if (amenities[category] && Array.isArray(amenities[category])) {
                    (amenities[category] as string[]).forEach((a: string) => {
                      if (typeof a === 'string' && !roomType.roomAmenities!.includes(a.trim())) {
                        roomType.roomAmenities!.push(a.trim());
                      }
                    });
                  }
                  // Otherwise, extract all amenities from all categories (fallback)
                  else {
                    Object.values(amenities).forEach((value) => {
                      if (Array.isArray(value)) {
                        value.forEach((a: string) => {
                          if (typeof a === 'string' && !roomType.roomAmenities!.includes(a.trim())) {
                            roomType.roomAmenities!.push(a.trim());
                          }
                        });
                      }
                    });
                  }
                }
              });
            };

            collectRoomAmenitiesByType(prop.overnightRooms);
            collectRoomAmenitiesByType(prop.hourlyRooms);
            
            const placesOfInterest =
              prop.placesOfInterest && prop.placesOfInterest.length > 0
                ? prop.placesOfInterest
                : base.placesOfInterest || [];
            return {
              ...base,
              hotelAmenities,
              roomAmenities: roomAmenities.length > 0 ? roomAmenities : (base.roomAmenities || []),
              hourlyRooms: enhancedHourlyRooms.length > 0 ? enhancedHourlyRooms : base.hourlyRooms,
              placesOfInterest,
              latitude: prop.latitude ?? base.latitude,
              longitude: prop.longitude ?? base.longitude,
            };
          }
        } catch (err) {
          console.warn('Failed to enhance hotel from property:', err);
        }
        return base;
      };

      if (result.success && result.data) {
        const foundHotel = result.data;
        let transformedHotel: Hotel = {
          id: foundHotel.hotelId || foundHotel._id || hotelId,
          name: foundHotel.name,
          locality: foundHotel.locality,
          city: foundHotel.city,
          price: foundHotel.price,
          checkInCharge: foundHotel.checkInCharge || 500,
          originalPrice: foundHotel.originalPrice || Math.round(foundHotel.price * 1.3),
          discount: foundHotel.discount,
          bag2bagDiscount: foundHotel.bag2bagDiscount,
          stars: foundHotel.stars,
          rating: foundHotel.rating || foundHotel.stars + (Math.random() * 0.5 - 0.2),
          reviews: foundHotel.reviews || Math.floor(Math.random() * 500) + 5,
          amenities: foundHotel.amenities || [],
          hotelAmenities: foundHotel.hotelAmenities || foundHotel.amenities || [],
          roomAmenities: foundHotel.roomAmenities || [],
          placesOfInterest: foundHotel.placesOfInterest || [],
          images: foundHotel.images || [
            `https://source.unsplash.com/800x600/?hotel,${encodeURIComponent(foundHotel.name)}`,
            `https://source.unsplash.com/400x300/?hotel,room,${encodeURIComponent(foundHotel.locality)}`,
            `https://source.unsplash.com/400x300/?hotel,lobby,${encodeURIComponent(foundHotel.locality)}`,
          ],
          description: foundHotel.description,
          distance: foundHotel.distance,
          availability: foundHotel.availability,
          isPremium: foundHotel.isPremium || foundHotel.stars >= 4,
          isCertified: foundHotel.isCertified || Math.random() > 0.7,
          latitude: foundHotel.latitude,
          longitude: foundHotel.longitude,
          availableForHourly: (foundHotel as any).availableForHourly,
          availableForDay: (foundHotel as any).availableForDay,
          hourlyRooms: (foundHotel as any).hourlyRooms as any,
        };
        transformedHotel = await enhanceFromProperty(transformedHotel);
        setHotel(transformedHotel);
        
        // Set default room type based on available room types
        if (transformedHotel.hourlyRooms && transformedHotel.hourlyRooms.length > 0) {
          const firstCategory = (transformedHotel.hourlyRooms[0] as any).category as string;
          if (firstCategory) {
            setSelectedRoomType(firstCategory.toLowerCase().replace(/\s+/g, '-'));
          }
        } else {
          setSelectedRoomType('deluxe-double');
        }
      } else {
        // Fallback: search for hotel
        const searchResult = await hotelsApi.search({ city: 'Delhi' });
        if (searchResult.success && searchResult.data) {
          const foundHotel = searchResult.data.find((h: any) => 
            h.hotelId === hotelId || h._id === hotelId || h.id === hotelId
          );
          if (foundHotel) {
            let transformedHotel: Hotel = {
              id: foundHotel.hotelId || foundHotel._id || hotelId,
              name: foundHotel.name,
              locality: foundHotel.locality,
              city: foundHotel.city,
              price: foundHotel.price,
              checkInCharge: foundHotel.checkInCharge || 500,
              originalPrice: foundHotel.originalPrice || Math.round(foundHotel.price * 1.3),
              discount: foundHotel.discount,
              bag2bagDiscount: foundHotel.bag2bagDiscount,
              stars: foundHotel.stars,
              rating: foundHotel.rating || foundHotel.stars + (Math.random() * 0.5 - 0.2),
              reviews: foundHotel.reviews || Math.floor(Math.random() * 500) + 5,
              amenities: foundHotel.amenities || [],
              hotelAmenities: foundHotel.hotelAmenities || foundHotel.amenities || [],
              roomAmenities: foundHotel.roomAmenities || [],
              placesOfInterest: foundHotel.placesOfInterest || [],
              images: foundHotel.images || [
                `https://source.unsplash.com/800x600/?hotel,${encodeURIComponent(foundHotel.name)}`,
              ],
              description: foundHotel.description,
              distance: foundHotel.distance,
              availability: foundHotel.availability,
              isPremium: foundHotel.isPremium || foundHotel.stars >= 4,
              isCertified: foundHotel.isCertified || Math.random() > 0.7,
              latitude: foundHotel.latitude,
              longitude: foundHotel.longitude,
              availableForHourly: (foundHotel as any).availableForHourly,
              availableForDay: (foundHotel as any).availableForDay,
              hourlyRooms: (foundHotel as any).hourlyRooms as any,
            };
            transformedHotel = await enhanceFromProperty(transformedHotel);
            setHotel(transformedHotel);
            if (transformedHotel.hourlyRooms && transformedHotel.hourlyRooms.length > 0) {
              const firstCategory = (transformedHotel.hourlyRooms[0] as any).category as string;
              if (firstCategory) {
                setSelectedRoomType(firstCategory.toLowerCase().replace(/\s+/g, '-'));
              }
            } else {
              setSelectedRoomType('deluxe-double');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading hotel:', error);
    } finally {
      setLoading(false);
    }
  };

  // Room types based on data coming from property/hotel (keeps booking summary in sync)
  const roomTypes: RoomType[] = (() => {
    if (!hotel) return [];

    // If hourlyRooms (from property packages) are available, derive room types from there
    if (hotel.hourlyRooms && hotel.hourlyRooms.length > 0) {
      console.log('Hotel hourlyRooms data:', JSON.stringify(hotel.hourlyRooms, null, 2));
      
      const extractedRoomTypes = hotel.hourlyRooms
        .filter((r) => {
          const hasCategory = !!(r as any).category;
          if (!hasCategory) {
            console.warn('Room type missing category:', r);
          }
          return hasCategory;
        })
        .map((r, index) => {
          const category = String((r as any).category).trim();
          
          // Use hourlyCharge as the base price for display (or fallback to hotel price)
          // The actual rate used for calculation will be determined based on booking duration
          let baseRate = hotel.price; // Default fallback
          
          // Prefer hourlyCharge if available (for hourly bookings)
          if (typeof (r as any).hourlyCharge === 'number' && (r as any).hourlyCharge > 0) {
            baseRate = (r as any).hourlyCharge;
          } else if (typeof (r as any).dayCharge === 'number' && (r as any).dayCharge > 0) {
            baseRate = (r as any).dayCharge;
          } else if (typeof (r as any).checkInCharge === 'number' && (r as any).checkInCharge > 0) {
            baseRate = (r as any).checkInCharge;
          }

          return {
            id: category.toLowerCase().replace(/\s+/g, '-'),
            name: category,
            price: baseRate,
            description: undefined,
          } as RoomType;
        });
      
      console.log('Extracted room types for dropdown:', extractedRoomTypes);
      return extractedRoomTypes;
    }

    // Fallback to legacy hard-coded room types
    return [
      {
        id: 'deluxe-double',
        name: 'Deluxe Double',
        price: hotel.price,
        description: 'Spacious room with double bed',
      },
      {
        id: 'standard-single',
        name: 'Standard Single',
        price: hotel.price - 200,
        description: 'Comfortable single room',
      },
      {
        id: 'suite',
        name: 'Suite',
        price: hotel.price + 500,
        description: 'Luxury suite with extra amenities',
      },
    ];
  })();

  const selectedRoom = roomTypes.find((r) => r.id === selectedRoomType) || roomTypes[0];

  // Get the selected room's rates from hotel.hourlyRooms
  const selectedRoomData = hotel?.hourlyRooms?.find(
    (r: any) => {
      if (!r.category) return false;
      const roomCategoryId = String(r.category).toLowerCase().replace(/\s+/g, '-');
      return roomCategoryId === selectedRoomType;
    }
  ) as any;
  
  console.log('Selected room type ID:', selectedRoomType);
  console.log('Available room categories:', hotel?.hourlyRooms?.map((r: any) => ({
    category: r.category,
    id: r.category ? String(r.category).toLowerCase().replace(/\s+/g, '-') : 'no-category',
    amenities: r.roomAmenities || []
  })));
  console.log('Selected room data:', selectedRoomData);

  // Determine if this is an hourly booking (less than 24 hours)
  const isHourlyBooking = hotel?.availableForHourly && totalHours < 24;

  // Calculate pricing (recalculate when dates/times change)
  // For hourly bookings, use hourlyCharge; otherwise use the base price
  let hourlyRate = selectedRoom?.price || hotel?.price || 0;
  let checkInCharge = hotel?.checkInCharge || 500;

  // Override with room-specific rates if available
  if (selectedRoomData) {
    if (isHourlyBooking) {
      // For hourly bookings, use hourlyCharge and checkInCharge from the room
      if (typeof selectedRoomData.hourlyCharge === 'number' && selectedRoomData.hourlyCharge > 0) {
        hourlyRate = selectedRoomData.hourlyCharge;
      }
      if (typeof selectedRoomData.checkInCharge === 'number' && selectedRoomData.checkInCharge > 0) {
        checkInCharge = selectedRoomData.checkInCharge;
      }
    } else {
      // For day/night bookings, use the appropriate charge
      if (typeof selectedRoomData.dayCharge === 'number' && selectedRoomData.dayCharge > 0) {
        hourlyRate = selectedRoomData.dayCharge;
        checkInCharge = 0; // Day charge includes everything
      } else if (typeof selectedRoomData.nightCharge === 'number' && selectedRoomData.nightCharge > 0) {
        hourlyRate = selectedRoomData.nightCharge;
        checkInCharge = 0; // Night charge includes everything
      } else if (typeof selectedRoomData.charge24Hours === 'number' && selectedRoomData.charge24Hours > 0) {
        hourlyRate = selectedRoomData.charge24Hours;
        checkInCharge = 0; // 24-hour charge includes everything
      }
    }
  }
  const totalHours = Math.max(1, hours); // Ensure at least 1 hour
  const billableHourlyBlocks = Math.max(0, totalHours - 1); // First hour covered by check-in charge
  const hourlyCharges = hourlyRate * billableHourlyBlocks * editableRooms; // Multiply by number of rooms
  const subtotal = (checkInCharge * editableRooms) + hourlyCharges;
  const taxes = Math.round(subtotal * 0.18); // 18% GST
  const convenienceFee = Math.round(subtotal * 0.02); // 2% convenience fee
  const totalPrice = subtotal + taxes + convenienceFee;
  const payAtHotelAmount = Math.round(totalPrice * 0.25); // 25% advance for pay at hotel

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Only close if clicking outside all dropdown containers
      if (!target.closest('[data-dropdown-container]')) {
        setShowWhereToDropdown(false);
        setShowCheckInDropdown(false);
        setShowCheckOutDropdown(false);
        setShowGuestsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const formatTime = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  const checkInDate = checkInDateObj;
  const checkInTime = checkInTimeSlot;
  const checkoutDate = checkoutDateObj;

  const formatDay = (date: Date): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const handleBooking = async (paymentMethod: 'online' | 'hotel') => {
    if (!hotel || !selectedRoom || !guestName || !mobileNumber || !email) {
      alert('Please fill in all required fields');
      return;
    }

    if (!agreeTerms) {
      alert('Please agree to the Terms and Conditions');
      return;
    }

    setBookingLoading(true);
    try {
      const user = getCurrentUser();
      const booking: Partial<Booking> = {
        bookingId: 'BK' + Date.now(),
        hotelId: hotel.id,
        hotelName: hotel.name,
        userEmail: user?.email || email,
        userName: user?.name || guestName,
        name: guestName,
        phone: mobileNumber,
        roomType: selectedRoom.name,
        price: totalPrice,
        checkin: checkInDateObj.toISOString(),
        checkout: checkoutDateObj.toISOString(),
        paymentMethod: paymentMethod === 'online' ? 'online' : 'paylater',
        numberOfGuests: editableGuests,
        paymentStatus: paymentMethod === 'online' ? 'paid' : 'pending',
        guests: [guestName],
      };

      // TODO: Implement actual booking API call
      analyticsApi.trackEvent('booking_attempt', {
        hotelId: hotel.id,
        paymentMethod,
      });

      alert(`Booking ${paymentMethod === 'online' ? 'confirmed' : 'initiated'}!`);
      // Redirect to booking confirmation page
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container my-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading hotel details...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!hotel) {
    return (
      <>
        <Navbar />
        <div className="container my-5 text-center">
          <p className="text-muted">Hotel not found</p>
          <Link href="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const hotelImages = hotel.images || [
    `https://source.unsplash.com/800x600/?hotel,${encodeURIComponent(hotel.name)}`,
  ];

  const defaultPlacesOfInterest = [
    { name: 'Aerocity Metro Station', distance: '0.4 km' },
    { name: 'Mahipalpur Bus Station', distance: '0.5 km' },
    { name: 'Shankar Vihar Metro Station', distance: '2.4 km' },
    { name: 'Aravalli Biodiversity Park', distance: '2.4 km' },
    { name: 'Indira Gandhi International Airport', distance: '2.5 km' },
    { name: 'Delhi International Airport', distance: '2.5 km' },
  ];

  const hotelAmenitiesList =
    hotel.hotelAmenities && hotel.hotelAmenities.length > 0
      ? hotel.hotelAmenities
      : hotel.amenities || [];

  // Room amenities: Get amenities for the selected room type
  const selectedRoomAmenities = selectedRoomData?.roomAmenities || [];
  
  // Fallback: use combined amenities if no room-specific amenities found
  const roomAmenitiesList = selectedRoomAmenities.length > 0
    ? selectedRoomAmenities
    : (hotel.roomAmenities && hotel.roomAmenities.length > 0)
      ? hotel.roomAmenities
      : [];
  
  console.log('Selected room type:', selectedRoomType);
  console.log('Selected room data:', selectedRoomData);
  console.log('Room amenities to display:', roomAmenitiesList);

  const placesOfInterestList =
    hotel.placesOfInterest && hotel.placesOfInterest.length > 0
      ? hotel.placesOfInterest
      : defaultPlacesOfInterest;

  return (
    <>
      <Navbar />

      {/* Header Navigation Bar */}
      <div className="bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1000 }}>
        <div className="container">
          <div className="d-flex align-items-center justify-content-between py-3">
            <div className="d-flex align-items-center gap-4">
              {/* WHERE TO? - Editable */}
              <div style={{ position: 'relative' }} data-dropdown-container>
                <div className="small text-muted">WHERE TO?</div>
                <div 
                  className="fw-semibold"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWhereToDropdown(!showWhereToDropdown);
                    setShowCheckInDropdown(false);
                    setShowCheckOutDropdown(false);
                    setShowGuestsDropdown(false);
                  }}
                >
                  {hotel?.name || 'Select Hotel'}, {hotel?.city || 'Delhi'} ▼
                </div>
                {showWhereToDropdown && (
                  <div
                    className="card p-3 shadow"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      zIndex: 1001,
                      marginTop: '8px',
                      minWidth: '250px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    data-dropdown-container
                  >
                    <div className="small text-muted mb-2">Search for a different hotel</div>
                    <input
                      type="text"
                      className="form-control form-control-sm mb-2"
                      placeholder="Search hotels..."
                    />
                    <div className="small text-muted">
                      Currently viewing: <strong>{hotel?.name}</strong>
                    </div>
                    <div className="small text-muted mt-2">
                      To change hotel, go back to search page
                    </div>
                    <button
                      className="btn btn-sm btn-primary mt-2"
                      onClick={() => {
                        window.location.href = '/';
                        setShowWhereToDropdown(false);
                      }}
                    >
                      Search Hotels
                    </button>
                  </div>
                )}
              </div>

              {/* CHECK-IN - Editable */}
              <div style={{ position: 'relative' }} data-dropdown-container>
                <div className="small text-muted">CHECK-IN</div>
                <div 
                  className="fw-semibold"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCheckInDropdown(!showCheckInDropdown);
                    setShowWhereToDropdown(false);
                    setShowCheckOutDropdown(false);
                    setShowGuestsDropdown(false);
                  }}
                >
                  {formatTime(checkInTimeSlot)} {formatDate(checkInDateObj)} {formatDay(checkInDateObj)} ▼
                </div>
                {showCheckInDropdown && (
                  <div
                    className="card p-3 shadow"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      zIndex: 1001,
                      marginTop: '8px',
                      minWidth: '280px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    data-dropdown-container
                  >
                    <div className="mb-3">
                      <label className="form-label small">Check-In Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={editableCheckInDate}
                        onChange={(e) => {
                          setEditableCheckInDate(e.target.value);
                          // Update checkout date to maintain duration
                          const newCheckIn = new Date(e.target.value);
                          newCheckIn.setHours(editableCheckInTime, 0, 0, 0);
                          const currentCheckOut = new Date(editableCheckOutDate);
                          currentCheckOut.setHours(editableCheckOutTime, 0, 0, 0);
                          const currentHours = Math.ceil((currentCheckOut.getTime() - checkInDateObj.getTime()) / (1000 * 60 * 60));
                          const newCheckOut = new Date(newCheckIn);
                          newCheckOut.setHours(newCheckIn.getHours() + Math.max(1, currentHours));
                          setEditableCheckOutDate(newCheckOut.toISOString().split('T')[0]);
                          setEditableCheckOutTime(newCheckOut.getHours());
                        }}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="form-label small">Check-In Time</label>
                      <select
                        className="form-select form-select-sm"
                        value={editableCheckInTime}
                        onChange={(e) => {
                          const newTime = parseInt(e.target.value);
                          setEditableCheckInTime(newTime);
                          // Update checkout time to maintain duration
                          const newCheckIn = new Date(editableCheckInDate);
                          newCheckIn.setHours(newTime, 0, 0, 0);
                          const currentCheckOut = new Date(editableCheckOutDate);
                          currentCheckOut.setHours(editableCheckOutTime, 0, 0, 0);
                          const currentHours = Math.ceil((currentCheckOut.getTime() - checkInDateObj.getTime()) / (1000 * 60 * 60));
                          const newCheckOut = new Date(newCheckIn);
                          newCheckOut.setHours(newCheckIn.getHours() + Math.max(1, currentHours));
                          setEditableCheckOutDate(newCheckOut.toISOString().split('T')[0]);
                          setEditableCheckOutTime(newCheckOut.getHours());
                        }}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {formatTime(i)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* CHECK-OUT - Editable */}
              <div style={{ position: 'relative' }} data-dropdown-container>
                <div className="small text-muted">CHECK-OUT</div>
                <div 
                  className="fw-semibold"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCheckOutDropdown(!showCheckOutDropdown);
                    setShowWhereToDropdown(false);
                    setShowCheckInDropdown(false);
                    setShowGuestsDropdown(false);
                  }}
                >
                  {formatTime(checkoutDateObj.getHours())} {formatDate(checkoutDateObj)} {formatDay(checkoutDateObj)} ▼
                </div>
                {showCheckOutDropdown && (
                  <div
                    className="card p-3 shadow"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      zIndex: 1001,
                      marginTop: '8px',
                      minWidth: '280px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    data-dropdown-container
                  >
                    <div className="mb-3">
                      <label className="form-label small">Check-Out Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={editableCheckOutDate}
                        onChange={(e) => {
                          setEditableCheckOutDate(e.target.value);
                        }}
                        min={editableCheckInDate}
                      />
                    </div>
                    <div>
                      <label className="form-label small">Check-Out Time</label>
                      <select
                        className="form-select form-select-sm"
                        value={editableCheckOutTime}
                        onChange={(e) => setEditableCheckOutTime(parseInt(e.target.value))}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {formatTime(i)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* ANY GUESTS? - Editable */}
              <div style={{ position: 'relative' }} data-dropdown-container>
                <div className="small text-muted">ANY GUESTS?</div>
                <div 
                  className="fw-semibold"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGuestsDropdown(!showGuestsDropdown);
                    setShowWhereToDropdown(false);
                    setShowCheckInDropdown(false);
                    setShowCheckOutDropdown(false);
                  }}
                >
                  {editableRooms} Rooms / {editableGuests} Guests ▼
                </div>
                {showGuestsDropdown && (
                  <div
                    className="card p-3 shadow"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      zIndex: 1001,
                      marginTop: '8px',
                      minWidth: '200px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                    data-dropdown-container
                  >
                    <div className="mb-3">
                      <label className="form-label small">Rooms</label>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setEditableRooms(Math.max(1, editableRooms - 1))}
                        >
                          -
                        </button>
                        <span className="fw-semibold">{editableRooms}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setEditableRooms(editableRooms + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="form-label small">Guests</label>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setEditableGuests(Math.max(1, editableGuests - 1))}
                        >
                          -
                        </button>
                        <span className="fw-semibold">{editableGuests}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setEditableGuests(editableGuests + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <button className="btn btn-sm" style={{ border: 'none', background: 'transparent' }}>
                🔍
              </button>
              <button className="btn btn-sm" style={{ border: 'none', background: 'transparent' }}>
                👤
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="container my-4">
        <div className="row">
          {/* Left Content Area */}
          <div className="col-lg-8">
            {/* Hotel Images Carousel */}
            <div className="mb-4">
              <div className="position-relative" style={{ height: '500px', borderRadius: '12px', overflow: 'hidden' }}>
                <Image
                  src={hotelImages[selectedImageIndex] || hotelImages[0]}
                  alt={hotel.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
                {hotelImages.length > 1 && (
                  <>
                    <button
                      className="btn btn-light position-absolute"
                      style={{ left: '20px', top: '50%', transform: 'translateY(-50%)' }}
                      onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : hotelImages.length - 1))}
                    >
                      ‹
                    </button>
                    <button
                      className="btn btn-light position-absolute"
                      style={{ right: '20px', top: '50%', transform: 'translateY(-50%)' }}
                      onClick={() => setSelectedImageIndex((prev) => (prev < hotelImages.length - 1 ? prev + 1 : 0))}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              {hotelImages.length > 1 && (
                <div className="d-flex gap-2 mt-2">
                  {hotelImages.slice(0, 3).map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: selectedImageIndex === idx ? '3px solid #0d47a1' : '2px solid transparent',
                      }}
                      onClick={() => setSelectedImageIndex(idx)}
                    >
                      <Image
                        src={img}
                        alt={`${hotel.name} ${idx + 1}`}
                        width={150}
                        height={80}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hotel Name and Address */}
            <div className="mb-4">
              <h2 className="fw-bold mb-2">{hotel.name}</h2>
              <p className="text-muted mb-3">
                {hotel.locality}, {hotel.city || 'Delhi'}
              </p>
              
              {/* Hotel Tags */}
              <div className="d-flex gap-2 mb-3">
                <span className="badge" style={{ background: '#28a745', color: 'white', padding: '6px 12px' }}>
                  Couple Friendly
                </span>
                <span className="badge" style={{ background: '#28a745', color: 'white', padding: '6px 12px' }}>
                  Local ID accepted
                </span>
                <span className="badge" style={{ background: '#28a745', color: 'white', padding: '6px 12px' }}>
                  {hotel.stars} Star Hotel
                </span>
              </div>
            </div>

            {/* Hotel Amenities */}
            <div className="card p-4 mb-4">
              <h5 className="fw-bold mb-3">Hotel Amenities</h5>
              {hotelAmenitiesList.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {hotelAmenitiesList.map((amenity, idx) => (
                    <span
                      key={`${amenity}-${idx}`}
                      className="badge rounded-pill text-bg-light"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted mb-0">Amenities information not provided.</p>
              )}
            </div>

            {/* Room Amenities - Dynamic based on selected room type */}
            <div className="card p-4 mb-4">
              <h5 className="fw-bold mb-3">Room Amenities</h5>
              {roomAmenitiesList.length > 0 ? (
                <div>
                  {selectedRoomData && selectedRoomData.category && (
                    <p className="text-muted mb-2 small">
                      Showing amenities for <strong>{selectedRoomData.category}</strong> room
                    </p>
                  )}
                  <div className="d-flex flex-wrap gap-2">
                    {roomAmenitiesList.map((amenity, idx) => (
                      <span
                        key={`${amenity}-${idx}`}
                        className="badge rounded-pill text-bg-light"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted mb-0">Room amenities not specified for this room type.</p>
              )}
            </div>

            {/* Hotel Policy */}
            <div className="card p-4 mb-4">
              <h5 className="fw-bold mb-3">Hotel Policy</h5>
              <ul className="mb-0" style={{ paddingLeft: '20px' }}>
                <li className="mb-2">
                  Guests need to produce valid address & photo identification proof at check-in.
                </li>
                <li className="mb-2">
                  Check-in/check-out times correspond to booked slots; early/late check-out is at the hotel's discretion.
                </li>
                <li className="mb-2">
                  Guests must be of legal age for independent reservations (unless accompanied by a parent/guardian).
                </li>
                <li>
                  The hotel reserves the right to refuse service to anyone.
                </li>
              </ul>
            </div>

            {/* Cancellation Policy */}
            <div className="card p-4 mb-4">
              <h5 className="fw-bold mb-3">Cancellation Policy</h5>
              <ul className="mb-0" style={{ paddingLeft: '20px' }}>
                <li className="mb-2">
                  100% refund if cancelled before 48 hours of check-in.
                </li>
                <li className="mb-2">
                  No refund if cancellation is within 48 hours of check-in.
                </li>
                <li className="mb-2">
                  No refund in case of no-show.
                </li>
                <li>
                  Convenience Fees are non-refundable.
                </li>
              </ul>
            </div>

            {/* Places of Interest */}
            <div className="card p-4 mb-4">
              <h5 className="fw-bold mb-3">Places of Interest</h5>
              {placesOfInterestList.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {placesOfInterestList.map((place, idx) => (
                    <div key={`${place.name}-${idx}`} className="d-flex justify-content-between align-items-center">
                      <span>{place.name}</span>
                      {place.distance && (
                        <span className="text-muted">{place.distance}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted mb-0">No nearby places shared by the owner.</p>
              )}
            </div>

            {/* Map */}
            <div className="card p-4 mb-4">
              <h5 className="fw-bold mb-3">Location</h5>
              {hotel.latitude && hotel.longitude ? (
                <GoogleMapDisplay
                  lat={hotel.latitude}
                  lng={hotel.longitude}
                  height="300px"
                  zoom={15}
                />
              ) : (
                <div
                  style={{
                    height: '300px',
                    background: '#e9ecef',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {!showMap ? (
                    <button
                      className="btn"
                      style={{
                        background: '#FF6B35',
                        color: 'white',
                        padding: '10px 24px',
                        borderRadius: '6px',
                        fontWeight: '600',
                      }}
                      onClick={() => setShowMap(true)}
                    >
                      Show Map
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="text-muted">Map location not available for this property</p>
                      <button
                        className="btn btn-sm btn-outline-secondary mt-2"
                        onClick={() => setShowMap(false)}
                      >
                        Hide
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Booking Sidebar */}
          <div className="col-lg-4">
            <div className="card p-4 sticky-top" style={{ top: '100px' }}>
              {/* Booking Summary */}
              <div className="mb-4">
                <h6 className="fw-bold mb-3">Booking Summary</h6>
                <div className="small text-muted mb-1">
                  Check In: {formatTime(checkInTimeSlot)}, {formatDate(checkInDateObj)}
                </div>
                <div className="small text-muted mb-1">
                  Check Out: {formatTime(checkoutDateObj.getHours())}, {formatDate(checkoutDateObj)}
                </div>
                <div className="small text-muted">
                  Rooms/Guests: {editableRooms} Room{editableRooms > 1 ? 's' : ''} / {editableGuests} Guest{editableGuests > 1 ? 's' : ''}
                </div>
              </div>

              <hr />

              {/* Room Type */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Room Type</label>
                <select
                  className="form-select"
                  value={selectedRoomType}
                  onChange={(e) => setSelectedRoomType(e.target.value)}
                >
                  {roomTypes.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <hr />

              {/* Guest Details */}
              <div className="mb-4">
                <h6 className="fw-bold mb-3">Guest Details</h6>
                <div className="mb-3">
                  <label className="form-label small">Primary Guest's Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small">+91 Mobile Number</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">+91</span>
                    <input
                      type="tel"
                      className="form-control"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Mobile Number"
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small">Email</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="gstCheckbox"
                    checked={showGST}
                    onChange={(e) => setShowGST(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="gstCheckbox">
                    Provide GST Details (Optional)
                  </label>
                </div>
                {showGST && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="GST Number"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <hr />

              {/* Promotions */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small">No Promotions Applied</span>
                  <button
                    className="btn btn-link btn-sm p-0"
                    style={{ textDecoration: 'none' }}
                    onClick={() => alert('Coupon code feature coming soon!')}
                  >
                    Apply Coupon Code
                  </button>
                </div>
              </div>

              <hr />

              {/* Terms and Conditions */}
              <div className="mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="termsCheckbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="termsCheckbox">
                    I agree to the Terms and Conditions
                  </label>
                </div>
              </div>

              <hr />

              {/* Price */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="h5 fw-bold mb-0">₹ {totalPrice.toLocaleString()}</span>
                  <button
                    className="btn btn-link btn-sm p-0"
                    style={{ textDecoration: 'none' }}
                    onClick={() => setShowPriceBreakup(!showPriceBreakup)}
                  >
                    (Price Breakup)
                  </button>
                </div>
                {showPriceBreakup && (
                  <div className="small text-muted mt-2 p-2" style={{ background: '#f8f9fa', borderRadius: '4px' }}>
                    <div className="d-flex justify-content-between mb-1">
                      <span>Hourly Rate ({totalHours} hrs × {editableRooms} room{editableRooms > 1 ? 's' : ''})</span>
                      <span>₹{hourlyCharges.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span>Check-In Charge ({editableRooms} room{editableRooms > 1 ? 's' : ''})</span>
                      <span>₹{(checkInCharge * editableRooms).toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span>Taxes & Fees (18%)</span>
                      <span>₹{taxes.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span>Convenience Fee (2%)</span>
                      <span>₹{convenienceFee.toLocaleString()}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Total</span>
                      <span>₹{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                <div className="small text-muted mt-2">
                  <Link href="/signup" style={{ textDecoration: 'none' }}>
                    Sign up to get ₹50 credits
                  </Link>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="d-grid gap-2">
                <button
                  className="btn"
                  style={{
                    background: '#FF6B35',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '6px',
                    fontWeight: '600',
                  }}
                  onClick={() => handleBooking('online')}
                  disabled={bookingLoading || !agreeTerms}
                >
                  Pay Online
                </button>
                <button
                  className="btn"
                  style={{
                    background: '#FF6B35',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '6px',
                    fontWeight: '600',
                  }}
                  onClick={() => handleBooking('hotel')}
                  disabled={bookingLoading || !agreeTerms}
                >
                  Pay at Hotel
                </button>
                <div className="small text-center text-muted mt-1">
                  Pay ₹ {payAtHotelAmount.toLocaleString()} to confirm
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .badge {
          font-size: 12px;
        }
      `}</style>
    </>
  );
}
