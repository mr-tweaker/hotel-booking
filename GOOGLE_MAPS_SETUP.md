# Google Maps Setup Guide

## Quick Setup

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (required)
   - **Places API** (required for location search)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### 2. Configure API Key Restrictions (Recommended)

For security, restrict your API key:

1. Click on your API key in the credentials page
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domains:
     - `localhost:3000/*` (for development)
     - `yourdomain.com/*` (for production)
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose: "Maps JavaScript API" and "Places API"
4. Save

### 3. Add to Environment Variables

Create or update `.env.local` in your project root:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 4. Restart Development Server

After adding the API key, restart your Next.js development server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Features

The Google Maps integration includes:

- **Location Search**: Type to search for hotels, addresses, landmarks
- **Interactive Map**: Click on the map to set location
- **Draggable Marker**: Drag the marker to fine-tune location
- **Automatic Display**: Map automatically shows on hotel detail pages when coordinates are available

## Troubleshooting

### Error: "This page didn't load Google Maps correctly"

**Possible causes:**
1. API key not set in `.env.local`
2. API key is invalid or expired
3. Required APIs not enabled (Maps JavaScript API, Places API)
4. API key restrictions blocking your domain

**Solutions:**
1. Verify API key is in `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. Check API key is valid in Google Cloud Console
3. Ensure both "Maps JavaScript API" and "Places API" are enabled
4. Check API key restrictions allow your domain

### Map not showing on hotel page

- Verify the property has latitude and longitude saved
- Check browser console for errors
- Ensure API key is correctly configured

### Search not working

- Verify "Places API" is enabled in Google Cloud Console
- Check API key restrictions allow Places API
- Try refreshing the page

## Cost Information

Google Maps offers a free tier:
- **$200 free credit per month**
- Maps JavaScript API: Free for up to 28,000 loads/month
- Places API: Free for up to 1,000 requests/day

For most small to medium applications, this should be sufficient.








