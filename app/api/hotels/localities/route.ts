// API route: GET /api/hotels/localities?city=Delhi - Get localities for a city
import { NextRequest, NextResponse } from 'next/server';
import { hotelService } from '@/services/hotel.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city') || undefined;

    const result = await hotelService.getLocalities(city);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Get localities API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch localities' },
      { status: 500 }
    );
  }
}

