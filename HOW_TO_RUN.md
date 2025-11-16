# How to Run BookingHours Project

You have **3 options** to run this project, depending on what you want to test:

---

## Option 1: Run Express Server (Easiest - Quick Testing) ⚡

This uses the **old Express backend** with file system storage. Good for quick local testing.

### Steps:

1. **Install Backend Dependencies**
   ```bash
   cd Backend
   npm install
   ```

2. **Start the Backend Server**
   ```bash
   npm start
   # Server runs on http://localhost:4000
   ```

3. **Serve the Frontend** (in a new terminal)

   **Option A: Using Python (if installed)**
   ```bash
   cd Frontend
   python3 -m http.server 5500
   # Or: python -m http.server 5500
   ```

   **Option B: Using Node.js http-server**
   ```bash
   npm install -g http-server
   cd Frontend
   http-server -p 5500
   ```

   **Option C: Using VS Code Live Server**
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

4. **Open in Browser**
   - Frontend: http://localhost:5500
   - Backend API: http://localhost:4000

### ✅ What Works:
- ✅ Signup/Login (saves to `Backend/data/users.json`)
- ✅ Bookings (saves to `Backend/data/bookings.json`)
- ✅ File uploads (saves to `Backend/uploads/`)
- ✅ Analytics (saves to Excel files)

### ❌ Limitations:
- File system storage (not suitable for production)
- No MongoDB/Cloudinary

---

## Option 2: Run with Vercel Dev (Test Serverless Functions) 🚀

This tests the **new Vercel serverless functions** locally. Requires MongoDB and Cloudinary setup.

### Prerequisites:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Set Up MongoDB Atlas**
   - Sign up: https://cloud.mongodb.com/
   - Create free cluster
   - Get connection string

3. **Set Up Cloudinary**
   - Sign up: https://cloudinary.com/
   - Get API credentials

### Steps:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create `.env.local` file** (in project root)
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookinghours?retryWrites=true&w=majority
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **Run Vercel Dev**
   ```bash
   npm run dev
   # Or: vercel dev
   ```

4. **Open in Browser**
   - Frontend: http://localhost:3000 (or port shown)
   - API: http://localhost:3000/api

### ✅ What Works:
- ✅ All serverless functions
- ✅ MongoDB database
- ✅ Cloudinary file uploads
- ✅ Production-like environment

---

## Option 3: Frontend Only (No Backend) 🎨

Just view the frontend UI without backend functionality.

### Steps:

1. **Serve Frontend**
   ```bash
   cd Frontend
   
   # Using Python
   python3 -m http.server 5500
   
   # Or using http-server
   http-server -p 5500
   ```

2. **Open in Browser**
   - http://localhost:5500

### ⚠️ Limitations:
- ❌ Signup/Login won't work
- ❌ Bookings won't save
- ✅ UI will display (hotels, search, etc.)

---

## Quick Start (Recommended for First Time)

If you just want to see it working quickly:

```bash
# Terminal 1: Start Backend
cd Backend
npm install
npm start

# Terminal 2: Start Frontend
cd Frontend
python3 -m http.server 5500
# Or use Live Server in VS Code
```

Then open: **http://localhost:5500**

---

## Troubleshooting

### Port Already in Use
```bash
# Change port in Backend/server.js (line 7)
const PORT = process.env.PORT || 4001;  # Change 4000 to 4001

# Or kill process using port
# Linux/Mac:
lsof -ti:4000 | xargs kill
# Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Frontend Can't Connect to Backend
- Check backend is running on port 4000
- Check CORS settings in `Backend/server.js`
- Check browser console for errors

### MongoDB Connection Issues (Vercel Dev)
- Verify connection string format
- Check IP whitelist in MongoDB Atlas (add `0.0.0.0/0`)
- Verify `.env.local` file exists

### Module Not Found
```bash
# Install dependencies
cd Backend
npm install

# Or for root (Vercel)
npm install
```

---

## Which Option Should I Use?

| Use Case | Recommended Option |
|----------|-------------------|
| Quick testing/demo | Option 1 (Express) |
| Testing Vercel migration | Option 2 (Vercel Dev) |
| Just viewing UI | Option 3 (Frontend only) |
| Production deployment | Deploy to Vercel |

---

## Development Workflow

### For Local Development:
1. Use **Option 1** (Express) for quick iteration
2. Test changes immediately
3. No need for MongoDB/Cloudinary setup

### For Vercel Testing:
1. Use **Option 2** (Vercel Dev) before deploying
2. Test serverless functions locally
3. Verify MongoDB/Cloudinary integration

---

## Next Steps

After running locally:
1. Test all features (signup, login, booking)
2. Check data files in `Backend/data/`
3. When ready, deploy to Vercel (see `DEPLOYMENT_STEPS.md`)

---

## Need Help?

- Check `DEPLOYMENT_STEPS.md` for Vercel setup
- Check `MIGRATION_SUMMARY.md` for architecture details
- Check browser console for errors
- Check backend terminal for server logs

