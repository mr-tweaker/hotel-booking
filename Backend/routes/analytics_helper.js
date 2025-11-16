const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const BOOKINGS_XLS = path.join(DATA_DIR, 'bookings.xlsx');

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
  if (!workbook.SheetNames.includes(sheetName)) workbook.SheetNames.push(sheetName);
  XLSX.writeFile(workbook, filePath);
}

function appendBooking(booking) {
  appendToExcel(BOOKINGS_XLS, 'Bookings', booking);
}

module.exports = { appendToExcel, appendBooking };
