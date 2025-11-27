# Database Setup Guide

## Prerequisites

1. MongoDB database (local or MongoDB Atlas)
2. Environment variables configured

## Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/bookinghours
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookinghours

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Seeding the Database

### Install Dependencies

```bash
npm install
```

### Run Seed Script

```bash
npm run seed:hotels
```

This will populate the database with mock hotel data including:
- 7 hotels in Delhi (various localities)
- 1 resort in Rishikesh
- All with hourly room rates and amenities

### Seed Data Includes

- **Hotels in Delhi:**
  - Connaught Place Comfort (4 stars)
  - Saket Suites (3 stars)
  - Hauz Khas Inn (2 stars)
  - Dwarka Deluxe (5 stars)
  - Karol Bagh Central (3 stars)
  - Rohini Grand (3 stars)
  - Janakpuri Plaza (2 stars)

- **Resorts:**
  - Nature on the Rocks (Rishikesh, 4 stars)

Each hotel includes:
- Hourly room rates (3h, 6h, 9h, 12h, 24h)
- Amenities (Wifi, Parking, Pool, etc.)
- Images
- Descriptions
- Location details

## API Endpoints

### Search Hotels
```
POST /api/hotels/search
Body: {
  city?: string,
  locality?: string,
  propertyType?: string,
  minPrice?: number,
  maxPrice?: number,
  stars?: number,
  amenities?: string[],
  checkIn?: string (ISO date),
  checkOut?: string (ISO date),
  guests?: number,
  rooms?: number
}
```

### Get Cities
```
GET /api/hotels/cities
Returns: string[] (array of city names)
```

### Get Localities
```
GET /api/hotels/localities?city=Delhi
Returns: string[] (array of locality names for the city)
```

## Testing

1. Start the development server:
```bash
npm run dev
```

2. Seed the database:
```bash
npm run seed:hotels
```

3. Navigate to http://localhost:3000 (or your dev port)

4. Test the search functionality:
   - Select "Hotels" property type
   - Choose a city (Delhi is pre-selected)
   - Select a locality
   - Set check-in/check-out dates and times
   - Set number of guests/rooms
   - Click "Search"

The results should display hotels from the database matching your criteria.

## Database Schema

### Hotel Model
- `hotelId`: Unique identifier
- `name`: Hotel name
- `city`: City name (indexed)
- `locality`: Locality/area (indexed)
- `state`: State name
- `price`: Starting price per hour
- `stars`: Star rating (1-5)
- `amenities`: Array of amenities
- `images`: Array of image URLs
- `description`: Hotel description
- `propertyType`: Hotel | Homestay | Resort
- `hourlyRooms`: Array of room configurations with hourly rates
- `isActive`: Boolean (for soft delete)

## Troubleshooting

### No hotels showing up
1. Check if database is connected (check MongoDB connection)
2. Verify seed script ran successfully
3. Check browser console for API errors
4. Verify environment variables are set correctly

### Search not working
1. Check network tab in browser dev tools
2. Verify API endpoints are accessible
3. Check server logs for errors
4. Ensure MongoDB indexes are created (they're created automatically)

