// Cloudinary configuration and utilities
import { v2 as cloudinary } from 'cloudinary';

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn('Cloudinary is not configured. File uploads will fail. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env.local file.');
}

export interface UploadFile {
  fieldname: string;
  filename: string;
  encoding: string;
  mimeType: string;
  buffer: Buffer;
}

// Upload file to Cloudinary
export async function uploadFile(
  fileBuffer: Buffer,
  folder = 'id-proofs'
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env.local file.');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto' as const,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

// Upload multiple files
export async function uploadFiles(
  files: UploadFile[],
  folder = 'id-proofs'
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadFile(file.buffer, folder));
  return Promise.all(uploadPromises);
}

export { cloudinary };

