const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const XLSX = require('xlsx');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const PROPERTIES_JSON = path.join(DATA_DIR, 'properties.json');
const PROPERTIES_XLS = path.join(DATA_DIR, 'properties.xlsx');

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'properties');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper functions
function readProperties() {
  if (!fs.existsSync(PROPERTIES_JSON)) {
    return [];
  }
  try {
    const content = fs.readFileSync(PROPERTIES_JSON, 'utf8');
    return content.trim() ? JSON.parse(content) : [];
  } catch (err) {
    console.error('Error reading properties.json:', err);
    return [];
  }
}

function writeProperties(data) {
  fs.writeFileSync(PROPERTIES_JSON, JSON.stringify(data, null, 2));
}

function appendToExcel(filePath, sheetName, row) {
  let workbook;
  if (fs.existsSync(filePath)) {
    workbook = XLSX.readFile(filePath);
  } else {
    workbook = XLSX.utils.book_new();
  }

  let worksheet = workbook.Sheets[sheetName];
  let data = worksheet ? XLSX.utils.sheet_to_json(worksheet) : [];
  data.push(row);
  worksheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets[sheetName] = worksheet;
  if (!workbook.SheetNames.includes(sheetName)) {
    workbook.SheetNames.push(sheetName);
  }
  XLSX.writeFile(workbook, filePath);
}

// POST /api/property/list - Submit property listing
router.post('/list', 
  upload.fields([
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'propertyImages', maxCount: 20 }
  ]),
  (req, res) => {
    try {
      const propertyData = {
        // Basic Information
        propertyName: req.body.propertyName,
        propertyType: req.body.propertyType,
        
        // Contact Information
        receptionMobile: req.body.receptionMobile,
        ownerMobile: req.body.ownerMobile,
        receptionLandline: req.body.receptionLandline || '',
        receptionEmail: req.body.receptionEmail,
        ownerEmail: req.body.ownerEmail,
        
        // Location Information
        city: req.body.city,
        locality: req.body.locality || '',
        state: req.body.state,
        address: req.body.address,
        pincode: req.body.pincode || '',
        landmark: req.body.landmark || '',
        googleBusinessLink: req.body.googleBusinessLink || '',
        
        // Business Documents
        gstNo: req.body.gstNo || '',
        panNo: req.body.panNo || '',
        
        // File paths
        gstCertificate: req.files?.gstCertificate ? `/uploads/properties/${req.files.gstCertificate[0].filename}` : '',
        panCard: req.files?.panCard ? `/uploads/properties/${req.files.panCard[0].filename}` : '',
        propertyImages: req.files?.propertyImages ? req.files.propertyImages.map(f => `/uploads/properties/${f.filename}`) : [],
        
        // Room Details (parse from form data)
        overnightRooms: parseRoomData(req.body, 'overnightRooms'),
        hourlyRooms: parseRoomData(req.body, 'hourlyRooms'),
        packages: parsePackageData(req.body),
        
        // Metadata
        submittedAt: new Date().toISOString(),
        status: 'pending', // pending, approved, rejected
        listingId: 'PROP' + Date.now() + Math.random().toString(36).substr(2, 9)
      };

      // Save to JSON
      const properties = readProperties();
      properties.push(propertyData);
      writeProperties(properties);

      // Save to Excel for backup
      appendToExcel(PROPERTIES_XLS, 'Properties', propertyData);

      res.json({ 
        success: true, 
        message: 'Property listing submitted successfully. We will contact you within 24 hours.',
        listingId: propertyData.listingId
      });
    } catch (err) {
      console.error('Property listing error:', err);
      res.status(500).json({ error: 'Failed to submit property listing' });
    }
  }
);

// GET /api/property/list - Get all property listings (for admin)
router.get('/list', (req, res) => {
  try {
    const properties = readProperties();
    res.json(properties);
  } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Helper function to parse room data from form
function parseRoomData(body, prefix) {
  try {
    const rooms = [];
    const roomKeys = Object.keys(body).filter(key => key && key.startsWith(prefix + '['));
    
    const roomMap = {};
    roomKeys.forEach(key => {
      // Match pattern like "overnightRooms[overnight_0][category]"
      const match = key.match(new RegExp(prefix + '\\[(\\w+)\\]\\[(\\w+)\\]'));
      if (match) {
        const [, roomId, field] = match;
        if (!roomMap[roomId]) {
          roomMap[roomId] = {};
        }
        roomMap[roomId][field] = body[key];
      }
    });
    
    return Object.values(roomMap).filter(room => Object.keys(room).length > 0);
  } catch (err) {
    console.error('Error parsing room data:', err);
    return [];
  }
}

// Helper function to parse package data from form
function parsePackageData(body) {
  try {
    const packages = [];
    const packageKeys = Object.keys(body).filter(key => key && key.startsWith('packages['));
    
    const packageMap = {};
    packageKeys.forEach(key => {
      // Match pattern like "packages[package_0][category]"
      const match = key.match(/packages\[(\w+)\]\[(\w+)\]/);
      if (match) {
        const [, packageId, field] = match;
        if (!packageMap[packageId]) {
          packageMap[packageId] = {};
        }
        // Handle checkbox values (they come as "on" or undefined)
        const value = body[key];
        if (field.includes('Decorate') || field.includes('Drink') || field.includes('Dinner') || 
            field.includes('breakfast') || field.includes('buffet') || field.includes('alacarte') || 
            field.includes('spa')) {
          packageMap[packageId][field] = value === 'on' || value === true;
        } else {
          packageMap[packageId][field] = value;
        }
      }
    });
    
    return Object.values(packageMap).filter(pkg => Object.keys(pkg).length > 0);
  } catch (err) {
    console.error('Error parsing package data:', err);
    return [];
  }
}

module.exports = router;

