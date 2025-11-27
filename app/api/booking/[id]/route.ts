// API route: GET /api/booking/[id], PUT /api/booking/[id], DELETE /api/booking/[id]
import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/services/booking.service';
import { uploadFilesToS3 } from '@/lib/s3';
import { Booking as IBooking } from '@/types';

// Helper to parse multipart form data
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await bookingService.getBookingById(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Booking not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Get booking API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
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
    
    // Check if request is multipart/form-data (has files) or JSON
    const contentType = request.headers.get('content-type') || '';
    let updateData: Partial<IBooking>;
    let existingDocuments: string[] = [];

    // Try to parse as FormData - check content-type
    // Note: When FormData is sent, browser sets content-type with boundary
    const isFormData = contentType.includes('multipart/form-data') || 
                       contentType.includes('form-data') ||
                       contentType.includes('boundary');
    
    if (isFormData) {
      // Handle file uploads
      const { fields, files } = await parseFormData(request);
      
      // Parse booking data
      if (!fields.booking) {
        return NextResponse.json(
          { error: 'Booking data is required' },
          { status: 400 }
        );
      }
      
      try {
        updateData = JSON.parse(fields.booking);
      } catch (parseError) {
        console.error('Failed to parse booking data:', parseError);
        return NextResponse.json(
          { error: 'Invalid booking data format' },
          { status: 400 }
        );
      }
      
      // Get existing documents if provided
      if (fields.existingDocuments) {
        try {
          existingDocuments = JSON.parse(fields.existingDocuments);
        } catch (e) {
          console.warn('Failed to parse existing documents, using empty array');
          existingDocuments = [];
        }
      }
      
        // Upload new ID proof files to S3
        const idProofFiles = files.filter((f) => f.fieldname === 'idProofs');
        let newDocumentKeys: string[] = [];

        if (idProofFiles.length > 0) {
          try {
            console.log(`Uploading ${idProofFiles.length} file(s) to S3...`);
            // Use booking ID from the update data or the route param
            const bookingId = updateData.bookingId || id;
            newDocumentKeys = await uploadFilesToS3(idProofFiles, bookingId);
            console.log(`Successfully uploaded ${newDocumentKeys.length} file(s)`);
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

        // Combine existing and new documents (both are S3 keys now)
        updateData.documents = [...existingDocuments, ...newDocumentKeys];
    } else {
      // Handle JSON-only updates
      try {
        updateData = await request.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON:', jsonError);
        return NextResponse.json(
          { error: 'Invalid request format' },
          { status: 400 }
        );
      }
    }

    const result = await bookingService.updateBooking(id, updateData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Booking not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Update booking API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error('Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Failed to update booking',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await bookingService.deleteBooking(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Booking not found' ? 404 : 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Delete booking API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

