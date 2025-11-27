// API route: GET /api/hotels/cities - Get all available cities
import { NextResponse } from 'next/server';
import { hotelService } from '@/services/hotel.service';

export async function GET() {
  try {
    const result = await hotelService.getCities();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Get cities API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}

