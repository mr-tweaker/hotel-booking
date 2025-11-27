// API route: GET /api/property/[id], PUT /api/property/[id]
import { NextRequest, NextResponse } from 'next/server';
import { propertyService } from '@/services/property.service';
import { Property as IProperty } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await propertyService.getPropertyById(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Property not found' ? 404 : 500 }
      );
    }

    // Return the property data directly, not wrapped in ApiResponse
    // The apiRequest function will wrap it in { success: true, data: ... }
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Get property API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updateData = await request.json();

    const result = await propertyService.updateProperty(id, updateData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Property not found' ? 404 : 500 }
      );
    }

    // Return the property data directly, not wrapped in ApiResponse
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Update property API error:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

