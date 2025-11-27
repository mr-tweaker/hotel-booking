// API route: GET /api/documents/[key] - Generate signed URL for document access
import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrlForFile } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params;
    
    if (!key) {
      return NextResponse.json(
        { error: 'Document key is required' },
        { status: 400 }
      );
    }

    // Decode the key (it's URL encoded)
    const decodedKey = decodeURIComponent(key);
    
    console.log(`Generating signed URL for: ${decodedKey}`);
    
    // Generate signed URL (valid for 1 hour)
    const signedUrl = await getSignedUrlForFile(decodedKey, 3600);

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to generate document URL',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

