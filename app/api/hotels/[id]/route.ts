// API route: GET /api/hotels/[id] - Get a single hotel by ID
import { NextRequest, NextResponse } from 'next/server';
import { hotelService } from '@/services/hotel.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await hotelService.getHotelById(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Hotel not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Get hotel API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotel' },
      { status: 500 }
    );
  }
}











