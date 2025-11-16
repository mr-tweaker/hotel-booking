const express = require('express');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const router = express.Router();
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const USERS_JSON = path.join(DATA_DIR, 'users.json');
const USERS_XLS = path.join(DATA_DIR, 'users.xlsx');

function readJSON(file) {
  if (!fs.existsSync(file)) {
    return [];
  }
  try {
    const content = fs.readFileSync(file, 'utf8');
    return content.trim() ? JSON.parse(content) : [];
  } catch (err) {
    console.error('Error reading JSON file:', err);
    return [];
  }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
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

// Signup
router.post('/signup', (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.phone || !payload.email || !payload.password || !payload.name) {
      return res.status(400).json({ error: "phone/name/email/password required" });
    }
    const users = readJSON(USERS_JSON);
    if (users.find(u => u.email === payload.email || u.phone === payload.phone)) {
      return res.status(400).json({ error: "User exists" });
    }
    users.push(payload);
    writeJSON(USERS_JSON, users);
    appendToExcel(USERS_XLS, 'Users', Object.assign({ ts: new Date().toISOString() }, payload));
    res.json({ success: true, message: "Signup saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { user, pass, email, password } = req.body;
    // support both {user,pass} and {email,password}
    const users = readJSON(USERS_JSON);
    const testUser = user ? users.find(u => (u.email === user || u.phone === user) && u.password === pass)
                          : users.find(u => u.email === email && u.password === password);
    if (!testUser) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ success: true, user: { name: testUser.name, email: testUser.email, phone: testUser.phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
