# BookingHours - Vercel Deployment

This project has been migrated from Express to Vercel serverless functions.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Services

#### MongoDB Atlas (Database)
1. Sign up at https://cloud.mongodb.com/
2. Create free cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0`
5. Get connection string

#### Cloudinary (File Storage)
1. Sign up at https://cloudinary.com/
2. Get Cloud Name, API Key, and API Secret

### 3. Deploy to Vercel

#### Via CLI:
```bash
npm i -g vercel
vercel login
vercel
```

Then add environment variables in Vercel dashboard or via CLI:
```bash
vercel env add MONGODB_URI
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
```

#### Via Dashboard:
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## 📁 Project Structure

```
/
├── api/                    # Vercel serverless functions
│   ├── auth/
│   │   ├── signup.js
│   │   └── login.js
│   ├── booking/
│   │   ├── index.js       # GET all, POST new
│   │   └── [id].js        # GET, PUT, DELETE by ID
│   └── analytics/
│       └── event.js
├── lib/                    # Shared utilities
│   ├── db.js              # MongoDB connection
│   └── cloudinary.js      # Cloudinary config
├── models/                 # Mongoose models
│   ├── User.js
│   ├── Booking.js
│   └── AnalyticsEvent.js
├── Frontend/               # Static frontend
│   ├── index.html
│   ├── assets/
│   └── ...
├── vercel.json            # Vercel config
└── package.json
```

## 🔧 Environment Variables

Add these in Vercel dashboard:

- `MONGODB_URI` - MongoDB connection string
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Bookings
- `GET /api/booking` - Get all bookings
- `POST /api/booking` - Create booking (with file upload)
- `GET /api/booking/:id` - Get single booking
- `PUT /api/booking/:id` - Update booking
- `DELETE /api/booking/:id` - Delete booking

### Analytics
- `POST /api/analytics/event` - Track events

## 🧪 Local Development

For local testing with Vercel:

```bash
npm install -g vercel
vercel dev
```

This will run the serverless functions locally.

## 🔄 Migration Notes

### What Changed:
- ✅ Express routes → Vercel serverless functions
- ✅ File system storage → MongoDB Atlas
- ✅ Local file uploads → Cloudinary
- ✅ Excel analytics → MongoDB collections
- ✅ Static file serving → Vercel static hosting

### What Stayed the Same:
- ✅ Frontend HTML/CSS/JS (minimal changes)
- ✅ API endpoint structure
- ✅ Business logic

## 📚 Documentation

- [Deployment Steps](./DEPLOYMENT_STEPS.md) - Detailed deployment guide
- [Migration Checklist](./MIGRATION_CHECKLIST.md) - Migration checklist
- [Hosting Comparison](./HOSTING_COMPARISON.md) - Platform comparison

## 🐛 Troubleshooting

### MongoDB Connection
- Verify connection string format
- Check IP whitelist includes `0.0.0.0/0`
- Verify database user has read/write permissions

### Cloudinary Uploads
- Check API credentials
- Verify file size limits (10MB free tier)
- Check CORS settings

### CORS Issues
- Update CORS headers in API functions
- Add your domain to allowed origins

## 📞 Support

For issues or questions, check:
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Cloudinary Docs: https://cloudinary.com/documentation

