const express = require('express');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const helper = require('./analytics_helper');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const VISITORS_XLS = path.join(DATA_DIR, 'visitors.xlsx');
const SESSIONS_XLS = path.join(DATA_DIR, 'sessions_no_login.xlsx');
const OPENPAY_XLS = path.join(DATA_DIR, 'opened_payment_not_paid.xlsx');
const BOOKINGS_XLS = path.join(DATA_DIR, 'bookings.xlsx');

// generic excel appender
function appendToExcel(filePath, sheetName, row) {
  let workbook;
  if (fs.existsSync(filePath)) workbook = XLSX.readFile(filePath);
  else workbook = XLSX.utils.book_new();

  let worksheet = workbook.Sheets[sheetName];
  let data = worksheet ? XLSX.utils.sheet_to_json(worksheet) : [];
  data.push(row);
  worksheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets[sheetName] = worksheet;
  if (!workbook.SheetNames.includes(sheetName)) workbook.SheetNames.push(sheetName);
  XLSX.writeFile(workbook, filePath);
}

// GET endpoint for testing
router.get('/event', (req, res) => {
  res.json({ message: 'Analytics endpoint is working. Use POST to track events.' });
});

// POST endpoint for tracking events
router.post('/event', (req, res) => {
  // Set CORS headers explicitly
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  const { type, payload, ts } = req.body || {};
  if (!type) return res.status(400).json({ error: "type required" });

  const row = { type, ts: ts || new Date().toISOString(), payload: payload || {} };

  try {
    if (type === 'visit_home' || type === 'visit_search' || type === 'hotel_open') {
      appendToExcel(VISITORS_XLS, 'Visits', row);
    } else if (type === 'signup' || type === 'signup_fail' || type === 'login_success' || type === 'login_fail') {
      appendToExcel(SESSIONS_XLS, 'Sessions', row);
    } else if (type === 'payment_page_opened' || type === 'booking_attempt' || type === 'booking_failed') {
      appendToExcel(OPENPAY_XLS, 'OpenPayments', row);
    } else if (type === 'booking_completed' || type === 'booking_created') {
      // booking payload might be full booking - append to bookings.xlsx as row
      appendToExcel(BOOKINGS_XLS, 'Bookings', Object.assign({ event: type, ts }, payload || {}));
    } else {
      appendToExcel(VISITORS_XLS, 'Events', row);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: "Failed to write event" });
  }
});

// Handle OPTIONS for CORS preflight
router.options('/event', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

module.exports = router;
