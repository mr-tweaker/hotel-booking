# Quick Start Guide

## Fastest Way to Run (2 minutes) ⚡

### Step 1: Start Backend
```bash
cd Backend
npm install
npm start
```
✅ Backend running on http://localhost:4000

### Step 2: Start Frontend (New Terminal)
```bash
cd Frontend
python3 -m http.server 5500
```
✅ Frontend running on http://localhost:5500

### Step 3: Open Browser
Go to: **http://localhost:5500**

---

## That's It! 🎉

You can now:
- Browse hotels
- Sign up / Login
- Create bookings
- View dashboard

---

## Alternative: VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Open `Frontend/index.html`
3. Right-click → "Open with Live Server"
4. Backend still needs to run separately (Step 1 above)

---

## Troubleshooting

**Backend won't start?**
```bash
cd Backend
npm install
npm start
```

**Frontend shows errors?**
- Make sure backend is running on port 4000
- Check browser console (F12)

**Port already in use?**
- Change port in `Backend/server.js` (line 7)
- Or kill the process using the port

---

For detailed instructions, see `HOW_TO_RUN.md`

