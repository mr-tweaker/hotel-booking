// lib/cloudinary.js - Cloudinary configuration
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file to Cloudinary
async function uploadFile(fileBuffer, folder = 'id-proofs') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

// Upload multiple files
async function uploadFiles(files, folder = 'id-proofs') {
  const uploadPromises = files.map(file => {
    return uploadFile(file.buffer, folder);
  });
  return Promise.all(uploadPromises);
}

module.exports = { cloudinary, uploadFile, uploadFiles };

