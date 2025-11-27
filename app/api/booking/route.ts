// API route: GET /api/booking, POST /api/booking
import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/services/booking.service';
import { uploadFilesToS3 } from '@/lib/s3';
import { Booking as IBooking } from '@/types';

// Helper to parse multipart form data using FormData
async function parseFormData(req: NextRequest): Promise<{
  fields: Record<string, string>;
  files: Array<{
    fieldname: string;
    filename: string;
    encoding: string;
    mimeType: string;
    buffer: Buffer;
  }>;
}> {
  const formData = await req.formData();
  const fields: Record<string, string> = {};
  const files: Array<{
    fieldname: string;
    filename: string;
    encoding: string;
    mimeType: string;
    buffer: Buffer;
  }> = [];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const buffer = Buffer.from(await value.arrayBuffer());
      files.push({
        fieldname: key,
        filename: value.name,
        encoding: '',
        mimeType: value.type,
        buffer,
      });
    } else {
      fields[key] = value as string;
    }
  }

  return { fields, files };
}

export async function GET() {
  try {
    const result = await bookingService.getBookings();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Get bookings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Creating new booking...');
    
    const { fields, files } = await parseFormData(request);
    console.log('Parsed form data - fields:', Object.keys(fields), 'files:', files.length);

    // Parse booking data
    let bookingData: Partial<IBooking>;
    try {
      bookingData = JSON.parse(fields.booking || '{}');
      console.log('Parsed booking data:', { 
        bookingId: bookingData.bookingId,
        name: bookingData.name,
        hasCheckin: !!bookingData.checkin,
        hasCheckout: !!bookingData.checkout,
      });
    } catch (parseError) {
      console.error('Failed to parse booking data:', parseError);
      return NextResponse.json(
        { error: 'Invalid booking data format' },
        { status: 400 }
      );
    }

    // Ensure bookingId exists before uploading files
    if (!bookingData.bookingId) {
      bookingData.bookingId = 'BK' + Date.now() + Math.random().toString(36).substring(2, 11);
      console.log('Generated booking ID:', bookingData.bookingId);
    }

    // Upload files to S3 (only idProofs files)
    const idProofFiles = files.filter((f) => f.fieldname === 'idProofs');
    let documentKeys: string[] = [];

    if (idProofFiles.length > 0) {
      try {
        console.log(`Uploading ${idProofFiles.length} file(s) to S3 for booking ${bookingData.bookingId}...`);
        // Store S3 keys (paths) instead of URLs
        documentKeys = await uploadFilesToS3(idProofFiles, bookingData.bookingId);
        console.log(`Successfully uploaded ${documentKeys.length} file(s) to S3`);
      } catch (error) {
        console.error('S3 upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
          { 
            error: 'Failed to upload documents. Please try again.',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          },
          { status: 500 }
        );
      }
    }

    // Store S3 keys in documents field
    bookingData.documents = documentKeys;

    // Log final booking data before saving
    console.log('Final booking data before save:', {
      bookingId: bookingData.bookingId,
      name: bookingData.name,
      phone: bookingData.phone,
      checkin: bookingData.checkin,
      checkout: bookingData.checkout,
      price: bookingData.price,
      paymentMethod: bookingData.paymentMethod,
      paymentStatus: bookingData.paymentStatus,
      documentsCount: bookingData.documents?.length || 0,
      guestsCount: bookingData.guests?.length || 0,
    });

    console.log('Creating booking in database...');
    const result = await bookingService.createBooking(bookingData);

    if (!result.success) {
      console.error('Booking creation failed:', result.error);
      console.error('Full error result:', JSON.stringify(result, null, 2));
      return NextResponse.json(
        { 
          error: result.error || 'Failed to create booking',
          details: process.env.NODE_ENV === 'development' ? JSON.stringify(result) : undefined
        },
        { status: 500 }
      );
    }

    console.log('Booking created successfully:', result.data?.bookingId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Create booking API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Failed to create booking',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

