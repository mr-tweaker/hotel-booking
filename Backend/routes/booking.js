const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const helper = require('./analytics_helper');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const BOOKINGS_JSON = path.join(DATA_DIR, 'bookings.json');

// ensure uploads dir
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// helper
function readBookings() {
  if (!fs.existsSync(BOOKINGS_JSON)) {
    return [];
  }
  try {
    const content = fs.readFileSync(BOOKINGS_JSON, 'utf8');
    return content.trim() ? JSON.parse(content) : [];
  } catch (err) {
    console.error('Error reading bookings.json:', err);
    return [];
  }
}
function writeBookings(data) {
  fs.writeFileSync(BOOKINGS_JSON, JSON.stringify(data, null, 2));
}

// POST new booking (with file upload)
router.post('/', upload.array('idProofs', 3), (req, res) => {
  try {
    const body = JSON.parse(req.body.booking); // booking data comes as JSON string
    const files = req.files ? req.files.map(f => '/uploads/' + f.filename) : [];
    body.documents = files;
    
    // Ensure bookingId exists
    if (!body.bookingId) {
      body.bookingId = 'BK' + Date.now() + Math.random().toString(36).substr(2, 9);
    }

    const bookings = readBookings();
    bookings.push(body);
    writeBookings(bookings);

    // also save to Excel
    helper.appendBooking(body);

    res.json({ success: true, booking: body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

// GET all bookings
router.get('/', (req, res) => {
  try {
    const bookings = readBookings();
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET single booking by ID
router.get('/:id', (req, res) => {
  try {
    const bookings = readBookings();
    const booking = bookings.find(b => b.bookingId === req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// PUT update booking
router.put('/:id', (req, res) => {
  try {
    const bookings = readBookings();
    const index = bookings.findIndex(b => b.bookingId === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update booking while preserving bookingId and documents
    bookings[index] = {
      ...bookings[index],
      ...req.body,
      bookingId: req.params.id, // Ensure bookingId doesn't change
      documents: bookings[index].documents || [] // Preserve existing documents
    };

    writeBookings(bookings);
    
    // Update Excel backup (append for logging purposes)
    helper.appendBooking(bookings[index]);

    res.json({ success: true, booking: bookings[index] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// DELETE booking
router.delete('/:id', (req, res) => {
  try {
    const bookings = readBookings();
    const index = bookings.findIndex(b => b.bookingId === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const deleted = bookings.splice(index, 1)[0];
    writeBookings(bookings);

    res.json({ success: true, message: 'Booking deleted', booking: deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

module.exports = router;
