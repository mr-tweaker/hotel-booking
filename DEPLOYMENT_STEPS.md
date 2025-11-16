# Vercel Deployment Steps

## Prerequisites

1. **MongoDB Atlas Account** (Free tier available)
   - Sign up at https://cloud.mongodb.com/
   - Create a free cluster
   - Create a database user
   - Whitelist IP: `0.0.0.0/0` (allow all for Vercel)
   - Get connection string

2. **Cloudinary Account** (Free tier available)
   - Sign up at https://cloudinary.com/
   - Get Cloud Name, API Key, and API Secret from dashboard

3. **Vercel Account**
   - Sign up at https://vercel.com/
   - Connect your GitHub account

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up MongoDB Atlas

1. Go to https://cloud.mongodb.com/
2. Create a new cluster (free tier M0)
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `bookinghours`

## Step 3: Set Up Cloudinary

1. Go to https://cloudinary.com/console
2. Copy your:
   - Cloud Name
   - API Key
   - API Secret

## Step 4: Deploy to Vercel

### Option A: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET

# Deploy to production
vercel --prod
```

### Option B: Via Vercel Dashboard

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY` - Your Cloudinary API key
   - `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
5. Click "Deploy"

## Step 5: Update Frontend API Base URL

After deployment, update `Frontend/assets/app.js`:

```javascript
// Replace this:
const API_BASE = "http://localhost:4000/api";

// With your Vercel URL:
const API_BASE = "https://your-project.vercel.app/api";
```

Or use environment variable:
```javascript
const API_BASE = process.env.API_BASE || "https://your-project.vercel.app/api";
```

## Step 6: Test Your Deployment

1. Visit your Vercel URL
2. Test signup
3. Test login
4. Test booking creation
5. Check MongoDB Atlas to see data
6. Check Cloudinary to see uploaded files

## Troubleshooting

### MongoDB Connection Issues
- Check IP whitelist includes `0.0.0.0/0`
- Verify connection string format
- Check database user permissions

### Cloudinary Upload Issues
- Verify API credentials
- Check file size limits (free tier: 10MB)
- Verify CORS settings

### CORS Issues
- Update CORS origins in each API function
- Add your Vercel domain to allowed origins

### Function Timeout
- Vercel free tier: 10 seconds
- Pro tier: 60 seconds
- Optimize database queries if needed

## Project Structure

```
/
├── api/                    # Serverless functions
│   ├── auth/
│   │   ├── signup.js
│   │   └── login.js
│   ├── booking/
│   │   ├── index.js
│   │   └── [id].js
│   └── analytics/
│       └── event.js
├── lib/                    # Shared utilities
│   ├── db.js              # MongoDB connection
│   └── cloudinary.js      # Cloudinary config
├── models/                 # Mongoose models
│   ├── User.js
│   ├── Booking.js
│   └── AnalyticsEvent.js
├── Frontend/               # Static frontend files
│   ├── index.html
│   ├── assets/
│   └── ...
├── vercel.json            # Vercel configuration
└── package.json
```

## Environment Variables Reference

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `MONGODB_URI` | MongoDB connection string | MongoDB Atlas Dashboard |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Cloudinary Dashboard |

## Next Steps

1. Set up custom domain (optional)
2. Enable analytics in Vercel dashboard
3. Set up monitoring and alerts
4. Configure backup strategy for MongoDB
5. Set up Cloudinary backup (optional)

## Support

- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Cloudinary Docs: https://cloudinary.com/documentation

