// API route: POST /api/hotels/search - Search hotels with filters
import { NextRequest, NextResponse } from 'next/server';
import { hotelService, HotelSearchParams } from '@/services/hotel.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const searchParams: HotelSearchParams = {
      city: body.city,
      locality: body.locality,
      propertyType: body.propertyType,
      minPrice: body.minPrice,
      maxPrice: body.maxPrice,
      stars: body.stars,
      amenities: body.amenities,
      checkIn: body.checkIn ? new Date(body.checkIn) : undefined,
      checkOut: body.checkOut ? new Date(body.checkOut) : undefined,
      guests: body.guests,
      rooms: body.rooms,
      sortBy: body.sortBy,
      sortOrder: body.sortOrder,
      coupleFriendly: body.coupleFriendly,
      localId: body.localId,
      payAtHotel: body.payAtHotel,
      newlyAdded: body.newlyAdded,
    };

    const result = await hotelService.searchHotels(searchParams);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Search hotels API error:', error);
    return NextResponse.json(
      { error: 'Failed to search hotels' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

