// api/booking/index.js - Booking endpoints (GET all, POST new)
const connectDB = require('../../lib/db');
const Booking = require('../../models/Booking');
const { uploadFiles } = require('../../lib/cloudinary');
const busboy = require('busboy');

// Helper to parse multipart form data
function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const form = busboy({ headers: req.headers });
    const files = [];
    const fields = {};

    form.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      const chunks = [];
      
      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        files.push({
          fieldname: name,
          filename,
          encoding,
          mimeType,
          buffer: Buffer.concat(chunks),
        });
      });
    });

    form.on('field', (name, value) => {
      fields[name] = value;
    });

    form.on('finish', () => {
      resolve({ fields, files });
    });

    form.on('error', (err) => {
      reject(err);
    });

    req.pipe(form);
  });
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // GET all bookings
    if (req.method === 'GET') {
      const bookings = await Booking.find().sort({ createdAt: -1 });
      return res.json(bookings);
    }

    // POST new booking
    if (req.method === 'POST') {
      const { fields, files } = await parseFormData(req);
      
      // Parse booking data
      const bookingData = JSON.parse(fields.booking || '{}');
      
      // Ensure bookingId exists
      if (!bookingData.bookingId) {
        bookingData.bookingId = 'BK' + Date.now() + Math.random().toString(36).substr(2, 9);
      }

      // Upload files to Cloudinary (only idProofs files)
      const idProofFiles = files.filter(f => f.fieldname === 'idProofs');
      let documentUrls = [];
      
      if (idProofFiles.length > 0) {
        documentUrls = await uploadFiles(idProofFiles, 'id-proofs');
      }

      bookingData.documents = documentUrls;
      
      // Convert date strings to Date objects
      if (bookingData.checkin) bookingData.checkin = new Date(bookingData.checkin);
      if (bookingData.checkout) bookingData.checkout = new Date(bookingData.checkout);

      // Create booking
      const booking = new Booking(bookingData);
      await booking.save();

      return res.json({ success: true, booking });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to process booking request' });
  }
};

