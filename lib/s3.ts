// AWS S3 configuration and utilities
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UploadFile } from './cloudinary';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'booking-hours';

/**
 * Upload a single file to S3
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The name of the file
 * @param bookingId - The booking ID to organize files
 * @param contentType - The MIME type of the file
 * @returns The S3 key (path) of the uploaded file
 */
export async function uploadFileToS3(
  fileBuffer: Buffer,
  fileName: string,
  bookingId: string,
  contentType = 'application/octet-stream'
): Promise<string> {
  try {
    // Validate AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are not configured. Please check your .env.local file.');
    }

    if (!BUCKET_NAME) {
      throw new Error('AWS S3 bucket name is not configured.');
    }

    if (!bookingId) {
      throw new Error('Booking ID is required to organize files.');
    }

    // Sanitize booking ID and filename
    const sanitizedBookingId = bookingId.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 100); // Limit filename length
    const uniqueFileName = `${timestamp}-${randomString}-${sanitizedFileName}`;
    
    // Organize by booking ID: id-proofs/BOOKING_ID/filename
    const key = `id-proofs/${sanitizedBookingId}/${uniqueFileName}`;

    console.log(`Uploading to S3: ${BUCKET_NAME}/${key} (${fileBuffer.length} bytes)`);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    console.log(`Successfully uploaded to S3: ${key}`);

    // Return the S3 key (not a public URL, we'll use signed URLs for access)
    return key;
  } catch (error) {
    console.error('S3 upload error details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      bucket: BUCKET_NAME,
      region: process.env.AWS_REGION,
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    });
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a signed URL for accessing a file in S3
 * @param key - The S3 key (path) of the file
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns A signed URL that can be used to access the file
 */
export async function getSignedUrlForFile(
  key: string,
  expiresIn = 3600 // 1 hour
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple files to S3
 * @param files - Array of files to upload
 * @param bookingId - The booking ID to organize files
 * @returns Array of S3 keys (paths) of uploaded files
 */
export async function uploadFilesToS3(
  files: UploadFile[],
  bookingId: string
): Promise<string[]> {
  try {
    const uploadPromises = files.map((file) =>
      uploadFileToS3(
        file.buffer,
        file.filename,
        bookingId,
        file.mimeType || 'application/octet-stream'
      )
    );

    const keys = await Promise.all(uploadPromises);
    return keys;
  } catch (error) {
    console.error('S3 batch upload error:', error);
    throw error;
  }
}

/**
 * Upload a file to S3 for property listings
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The name of the file
 * @param listingId - The property listing ID to organize files
 * @param folder - The folder type (e.g., 'certificates', 'images')
 * @param contentType - The MIME type of the file
 * @returns The S3 key (path) of the uploaded file
 */
export async function uploadPropertyFileToS3(
  fileBuffer: Buffer,
  fileName: string,
  listingId: string,
  folder: 'certificates' | 'images' = 'images',
  contentType = 'application/octet-stream'
): Promise<string> {
  try {
    // Validate AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are not configured. Please check your .env.local file.');
    }

    if (!BUCKET_NAME) {
      throw new Error('AWS S3 bucket name is not configured.');
    }

    if (!listingId) {
      throw new Error('Listing ID is required to organize files.');
    }

    // Sanitize listing ID and filename
    const sanitizedListingId = listingId.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 100); // Limit filename length
    const uniqueFileName = `${timestamp}-${randomString}-${sanitizedFileName}`;
    
    // Organize by listing ID: properties/LISTING_ID/folder/filename
    const key = `properties/${sanitizedListingId}/${folder}/${uniqueFileName}`;

    console.log(`Uploading property file to S3: ${BUCKET_NAME}/${key} (${fileBuffer.length} bytes)`);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    console.log(`Successfully uploaded property file to S3: ${key}`);

    // Return the S3 key (not a public URL, we'll use signed URLs for access)
    return key;
  } catch (error) {
    console.error('S3 property file upload error details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      bucket: BUCKET_NAME,
      region: process.env.AWS_REGION,
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    });
    throw new Error(`Failed to upload property file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple property files to S3
 * @param files - Array of files to upload
 * @param listingId - The property listing ID to organize files
 * @param folder - The folder type (e.g., 'certificates', 'images')
 * @returns Array of S3 keys (paths) of uploaded files
 */
export async function uploadPropertyFilesToS3(
  files: UploadFile[],
  listingId: string,
  folder: 'certificates' | 'images' = 'images'
): Promise<string[]> {
  try {
    const uploadPromises = files.map((file) =>
      uploadPropertyFileToS3(
        file.buffer,
        file.filename,
        listingId,
        folder,
        file.mimeType || 'application/octet-stream'
      )
    );

    const keys = await Promise.all(uploadPromises);
    return keys;
  } catch (error) {
    console.error('S3 property batch upload error:', error);
    throw error;
  }
}

export { s3Client, BUCKET_NAME };

