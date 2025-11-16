# Migration Checklist: Express → Vercel Serverless

## Pre-Migration Assessment

### Current Issues for Vercel:
- ❌ Uses file system (JSON/Excel files) - Vercel is read-only filesystem
- ❌ Uses multer for file uploads - Need cloud storage
- ❌ Express server structure - Need serverless functions
- ❌ Persistent file storage in `/uploads` - Not available on Vercel

### Required Changes:

## Phase 1: Database Migration

- [ ] Choose database: MongoDB Atlas OR Vercel Postgres
- [ ] Create database account and get connection string
- [ ] Install database driver (mongoose or @vercel/postgres)
- [ ] Create database schemas/models
- [ ] Migrate existing data (if any) from JSON files
- [ ] Update all routes to use database instead of file system

## Phase 2: File Storage Migration

- [ ] Sign up for Cloudinary (or AWS S3)
- [ ] Install Cloudinary SDK: `npm install cloudinary`
- [ ] Replace multer with Cloudinary upload
- [ ] Update booking route to upload to Cloudinary
- [ ] Update file serving logic (Cloudinary provides URLs)

## Phase 3: Convert to Serverless Functions

- [ ] Create `/api` folder structure
- [ ] Convert `/routes/auth.js` → `/api/auth/signup.js` and `/api/auth/login.js`
- [ ] Convert `/routes/booking.js` → `/api/booking/index.js` and `/api/booking/[id].js`
- [ ] Convert `/routes/analytics.js` → `/api/analytics/event.js`
- [ ] Remove Express app.listen() - not needed
- [ ] Update function exports (use `export default`)

## Phase 4: Frontend Updates

- [ ] Update `API_BASE` in `app.js` to Vercel domain
- [ ] Update CORS origins in backend functions
- [ ] Test all API endpoints
- [ ] Update file upload handling
- [ ] Update file display (use Cloudinary URLs)

## Phase 5: Vercel Configuration

- [ ] Create `vercel.json` configuration
- [ ] Set up environment variables in Vercel dashboard
- [ ] Configure build settings
- [ ] Set up custom domain (if needed)

## Phase 6: Testing

- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test booking creation with file upload
- [ ] Test booking update (PUT)
- [ ] Test booking deletion (DELETE)
- [ ] Test analytics tracking
- [ ] Test dashboard functionality

## Phase 7: Deployment

- [ ] Connect GitHub repo to Vercel
- [ ] Deploy to preview
- [ ] Test on preview URL
- [ ] Deploy to production
- [ ] Monitor logs and errors

---

## Quick Migration Script Structure

```
project-root/
├── api/                          # Serverless functions
│   ├── auth/
│   │   ├── signup.js
│   │   └── login.js
│   ├── booking/
│   │   ├── index.js             # GET, POST /api/booking
│   │   └── [id].js              # GET, PUT, DELETE /api/booking/:id
│   └── analytics/
│       └── event.js
├── public/                       # Frontend static files
│   ├── index.html
│   ├── assets/
│   └── ...
├── models/                       # Database models (if using)
│   ├── User.js
│   └── Booking.js
├── lib/                          # Shared utilities
│   ├── db.js                     # Database connection
│   └── cloudinary.js             # Cloudinary config
├── vercel.json
└── package.json
```

---

## Estimated Time

- **Database setup**: 1-2 hours
- **File storage setup**: 1 hour
- **Code conversion**: 4-6 hours
- **Testing**: 2-3 hours
- **Total**: 8-12 hours

---

## Alternative: Keep Express, Use Different Hosting

If migration seems complex, consider:
- **Railway.app** - Deploy Express as-is (15 min setup)
- **Render.com** - Free tier, supports Express
- **Fly.io** - Good for Express apps

These platforms support your current codebase with minimal changes.

