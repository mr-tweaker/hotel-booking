// API route: GET /api/property/list, POST /api/property/list
import { NextRequest, NextResponse } from 'next/server';
import { propertyService } from '@/services/property.service';
import { uploadPropertyFilesToS3 } from '@/lib/s3';
import { Property as IProperty, RoomDetail, PackageDetail } from '@/types';

// Helper to parse multipart form data using FormData
async function parseFormData(req: NextRequest): Promise<{
  fields: Record<string, string | string[]>; // Support arrays
  files: Array<{
    fieldname: string;
    filename: string;
    encoding: string;
    mimeType: string;
    buffer: Buffer;
  }>;
}> {
  const formData = await req.formData();
  const fields: Record<string, string | string[]> = {};
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
      const stringValue = value as string;
      
      // Handle arrays - keys ending with [] or containing [index]
      if (key.endsWith('[]')) {
        // Direct array field like "hotelAmenities[]"
        const baseKey = key;
        if (!fields[baseKey]) {
          fields[baseKey] = [];
        }
        if (Array.isArray(fields[baseKey])) {
          (fields[baseKey] as string[]).push(stringValue);
        }
      } else if (key.includes('[') && key.includes(']')) {
        // Indexed array field like "placesOfInterest[0][name]"
        // Keep the full key for parsing later
        fields[key] = stringValue;
      } else {
        // Regular field - if it already exists, keep the last value (FormData behavior)
        fields[key] = stringValue;
      }
    }
  }

  return { fields, files };
}

// Helper to parse room data from form
function parseRoomData(
  body: Record<string, string | string[]>,
  prefix: string
): RoomDetail[] {
  const roomKeys = Object.keys(body).filter(
    (key) => key && key.startsWith(prefix + '[')
  );

  const roomMap: Record<string, RoomDetail> = {};
  roomKeys.forEach((key) => {
    // Match simple fields e.g. overnightRooms[room_0][category]
    const match = key.match(new RegExp(prefix + '\\[(\\w+)\\]\\[(\\w+)\\]$'));
    if (match) {
      const [, roomId, field] = match;
      if (!roomMap[roomId]) {
        roomMap[roomId] = {};
      }
      const value = body[key];
      const stringValue = Array.isArray(value) ? value[0] : value;
      if (
        field.includes('rate') ||
        field.includes('Occupancy') ||
        field.includes('Children')
      ) {
        roomMap[roomId][field as keyof RoomDetail] = stringValue
          ? Number(stringValue)
          : undefined;
      } else {
        roomMap[roomId][field as keyof RoomDetail] = stringValue as never;
      }
      return;
    }

    // Match room amenities e.g. overnightRooms[room_0][roomAmenities][Wifi]
    const amenityMatch = key.match(
      new RegExp(prefix + '\\[(\\w+)\\]\\[roomAmenities\\]\\[(.+)\\]')
    );
    if (amenityMatch) {
      const [, roomId, amenityName] = amenityMatch;
      if (!roomMap[roomId]) {
        roomMap[roomId] = {};
      }
      if (!roomMap[roomId].roomAmenities) {
        roomMap[roomId].roomAmenities = [];
      }
      if (
        amenityName &&
        !roomMap[roomId].roomAmenities!.includes(amenityName)
      ) {
        roomMap[roomId].roomAmenities!.push(amenityName);
      }
    }
  });

  return Object.values(roomMap).filter((room) => Object.keys(room).length > 0);
}

// Helper to parse package data from form
function parsePackageData(body: Record<string, string | string[]>): PackageDetail[] {
  const packages: PackageDetail[] = [];
  const packageKeys = Object.keys(body).filter(
    (key) => key && key.startsWith('packages[')
  );

  const packageMap: Record<string, PackageDetail> = {};
  packageKeys.forEach((key) => {
    const match = key.match(/packages\[(\w+)\]\[(\w+)\]/);
    if (match) {
      const [, packageId, field] = match;
      if (!packageMap[packageId]) {
        packageMap[packageId] = {};
      }
      const value = body[key];
      const stringValue = Array.isArray(value) ? value[0] : value;
      if (
        field.includes('Decorate') ||
        field.includes('Drink') ||
        field.includes('Dinner') ||
        field.includes('breakfast') ||
        field.includes('buffet') ||
        field.includes('alacarte') ||
        field.includes('spa')
      ) {
        packageMap[packageId][field as keyof PackageDetail] = (stringValue === 'on' || stringValue === 'true') as never;
      } else if (
        field.includes('nights') ||
        field.includes('days') ||
        field.includes('children') ||
        field.includes('rate') ||
        field.includes('Rate')
      ) {
        packageMap[packageId][field as keyof PackageDetail] = stringValue ? Number(stringValue) : undefined;
      } else if (field === 'hourlyCharge' || field === 'checkInCharge') {
        packageMap[packageId][field as keyof PackageDetail] = stringValue ? Number(stringValue) : undefined;
      } else {
        packageMap[packageId][field as keyof PackageDetail] = stringValue as never;
      }
    }
  });

  return Object.values(packageMap).filter(
    (pkg) => Object.keys(pkg).length > 0
  );
}

export async function GET() {
  try {
    const result = await propertyService.getProperties();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Get properties API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting property submission...');
    const { fields, files } = await parseFormData(request);
    console.log('Parsed form data - fields:', Object.keys(fields).length, 'files:', files.length);

    // Generate listing ID first (needed for organizing files in S3)
    const listingId = 'PROP' + Date.now() + Math.random().toString(36).substring(2, 11);

    // Upload files to S3
    const gstFile = files.find((f) => f.fieldname === 'gstCertificate');
    const panFile = files.find((f) => f.fieldname === 'panCard');
    const propertyImageFiles = files.filter(
      (f) => f.fieldname === 'propertyImages'
    );

    let gstCertificate = '';
    let panCard = '';
    const propertyImages: string[] = [];

    try {
      if (gstFile) {
        console.log('Uploading GST certificate to S3...');
        const keys = await uploadPropertyFilesToS3([gstFile], listingId, 'certificates');
        gstCertificate = keys[0] || '';
        console.log('GST certificate uploaded to S3:', gstCertificate ? 'success' : 'failed');
      }

      if (panFile) {
        console.log('Uploading PAN card to S3...');
        const keys = await uploadPropertyFilesToS3([panFile], listingId, 'certificates');
        panCard = keys[0] || '';
        console.log('PAN card uploaded to S3:', panCard ? 'success' : 'failed');
      }

      if (propertyImageFiles.length > 0) {
        console.log(`Uploading ${propertyImageFiles.length} property images to S3...`);
        const keys = await uploadPropertyFilesToS3(propertyImageFiles, listingId, 'images');
        propertyImages.push(...keys);
        console.log('Property images uploaded to S3:', propertyImages.length);
      }
    } catch (fileError) {
      console.error('S3 file upload error:', fileError);
      return NextResponse.json(
        { 
          error: 'Failed to upload files. Please check your AWS S3 configuration.',
          details: process.env.NODE_ENV === 'development' ? String(fileError) : undefined
        },
        { status: 500 }
      );
    }

    // Parse hotel amenities
    const hotelAmenities: string[] = [];
    const hotelAmenitiesField = fields['hotelAmenities[]'];
    if (Array.isArray(hotelAmenitiesField)) {
      hotelAmenities.push(...hotelAmenitiesField.map(v => v.trim()).filter(v => v));
    } else if (typeof hotelAmenitiesField === 'string' && hotelAmenitiesField.trim()) {
      hotelAmenities.push(hotelAmenitiesField.trim());
    }

    // Parse room amenities
    const roomAmenities: string[] = [];
    const roomAmenitiesField = fields['roomAmenities[]'];
    if (Array.isArray(roomAmenitiesField)) {
      roomAmenities.push(...roomAmenitiesField.map(v => v.trim()).filter(v => v));
    } else if (typeof roomAmenitiesField === 'string' && roomAmenitiesField.trim()) {
      roomAmenities.push(roomAmenitiesField.trim());
    }

    // Parse places of interest
    const placesOfInterest: Array<{ name: string; distance?: string }> = [];
    const placeKeys = Object.keys(fields).filter((key) => key.startsWith('placesOfInterest['));
    const placeMap: Record<string, { name: string; distance?: string }> = {};
    
    placeKeys.forEach((key) => {
      const match = key.match(/placesOfInterest\[(\d+)\]\[(\w+)\]/);
      if (match) {
        const [, index, field] = match;
        if (!placeMap[index]) {
          placeMap[index] = { name: '', distance: '' };
        }
        const value = fields[key];
        const stringValue = Array.isArray(value) ? value[0] : value;
        if (field === 'name') {
          placeMap[index].name = stringValue || '';
        } else if (field === 'distance') {
          placeMap[index].distance = stringValue || '';
        }
      }
    });
    
    Object.values(placeMap).forEach((place) => {
      if (place.name.trim()) {
        placesOfInterest.push({
          name: place.name.trim(),
          distance: place.distance?.trim() || undefined,
        });
      }
    });

    // Helper to get string value from field
    const getString = (key: string, defaultValue = ''): string => {
      const value = fields[key];
      return Array.isArray(value) ? (value[0] || defaultValue) : (value || defaultValue);
    };

    // Parse location coordinates
    const latitude = fields.latitude ? parseFloat(Array.isArray(fields.latitude) ? fields.latitude[0] : fields.latitude) : undefined;
    const longitude = fields.longitude ? parseFloat(Array.isArray(fields.longitude) ? fields.longitude[0] : fields.longitude) : undefined;

    // Validate required fields
    const propertyName = getString('propertyName');
    const propertyType = getString('propertyType');
    const receptionMobile = getString('receptionMobile');
    const ownerMobile = getString('ownerMobile');
    const receptionEmail = getString('receptionEmail');
    const ownerEmail = getString('ownerEmail');
    const city = getString('city');
    const state = getString('state');
    const address = getString('address');

    if (!propertyName || !propertyType || !receptionMobile || !ownerMobile || !receptionEmail || !ownerEmail || !city || !state || !address) {
      console.error('Missing required fields:', {
        propertyName: !!propertyName,
        propertyType: !!propertyType,
        receptionMobile: !!receptionMobile,
        ownerMobile: !!ownerMobile,
        receptionEmail: !!receptionEmail,
        ownerEmail: !!ownerEmail,
        city: !!city,
        state: !!state,
        address: !!address,
      });
      return NextResponse.json(
        { error: 'Missing required fields. Please fill in all required information.' },
        { status: 400 }
      );
    }

    const propertyData: Partial<IProperty> = {
      listingId, // Use the generated listing ID
      propertyName,
      propertyType,
      receptionMobile,
      ownerMobile,
      receptionLandline: getString('receptionLandline'),
      receptionEmail,
      ownerEmail,
      city,
      locality: getString('locality'),
      state,
      address,
      pincode: getString('pincode'),
      landmark: getString('landmark'),
      googleBusinessLink: getString('googleBusinessLink'),
      gstNo: getString('gstNo'),
      panNo: getString('panNo'),
      gstCertificate, // S3 key for GST certificate
      panCard, // S3 key for PAN card
      propertyImages, // Array of S3 keys for property images
      overnightRooms: parseRoomData(fields, 'overnightRooms'),
      hourlyRooms: parseRoomData(fields, 'hourlyRooms'),
      packages: parsePackageData(fields),
      hotelAmenities: hotelAmenities.length > 0 ? hotelAmenities : undefined,
      roomAmenities: roomAmenities.length > 0 ? roomAmenities : undefined,
      placesOfInterest: placesOfInterest.length > 0 ? placesOfInterest : undefined,
      latitude: latitude && !isNaN(latitude) ? latitude : undefined,
      longitude: longitude && !isNaN(longitude) ? longitude : undefined,
    };

    console.log('Creating property with data:', {
      propertyName: propertyData.propertyName,
      propertyType: propertyData.propertyType,
      city: propertyData.city,
      hotelAmenitiesCount: propertyData.hotelAmenities?.length || 0,
      roomAmenitiesCount: propertyData.roomAmenities?.length || 0,
      placesOfInterestCount: propertyData.placesOfInterest?.length || 0,
      hasLocation: !!(propertyData.latitude && propertyData.longitude),
    });

    const result = await propertyService.createProperty(propertyData);

    if (!result.success) {
      console.error('Property creation failed:', result.error);
      return NextResponse.json(
        { 
          error: result.error || 'Failed to create property listing',
          details: process.env.NODE_ENV === 'development' ? JSON.stringify(result) : undefined
        },
        { status: 500 }
      );
    }

    console.log('Property created successfully:', result.data?.listingId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Create property API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Failed to submit property listing',
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

