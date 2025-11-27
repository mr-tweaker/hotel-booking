# BookingHours - Next.js + TypeScript Migration

This is the migrated version of BookingHours to Next.js 14 with TypeScript, featuring a loosely coupled architecture.

## Project Structure

```
nextjs-migration/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── booking/       # Booking endpoints
│   │   ├── property/      # Property endpoints
│   │   └── analytics/    # Analytics endpoints
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── hotel/             # Hotel detail page
│   ├── list-property/     # Property listing page
│   ├── dashboard/         # Manager dashboard
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components (loosely coupled)
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── HotelCard.tsx
├── lib/                   # Utilities
│   ├── db.ts             # Database connection
│   ├── cloudinary.ts      # Cloudinary utilities
│   ├── api-client.ts     # API client
│   ├── auth.ts           # Auth utilities
│   └── utils.ts          # General utilities
├── models/               # Mongoose models
│   ├── User.ts
│   ├── Booking.ts
│   ├── Property.ts
│   └── AnalyticsEvent.ts
├── services/             # Business logic layer
│   ├── auth.service.ts
│   ├── booking.service.ts
│   ├── property.service.ts
│   └── analytics.service.ts
└── types/                # TypeScript types
    └── index.ts
```

## Architecture

### Loose Coupling Principles

1. **Service Layer**: Business logic is separated from API routes and components
2. **Component Isolation**: Components are self-contained and reusable
3. **Type Safety**: Full TypeScript coverage ensures type safety across layers
4. **API Abstraction**: API client provides a clean interface for frontend
5. **Model Separation**: Database models are independent of business logic

### Key Features

- **Next.js 14** with App Router
- **TypeScript** throughout the codebase
- **MongoDB** with Mongoose
- **Cloudinary** for file uploads
- **Bootstrap 5** for UI
- **Server Actions** ready (can be added)
- **API Routes** for backend functionality

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## Migration Notes

### From Original Codebase

- **Frontend**: HTML files → Next.js pages with React components
- **Backend**: Express routes → Next.js API routes
- **Database**: JSON files + MongoDB → MongoDB only (Mongoose)
- **File Uploads**: Multer → Cloudinary via API routes
- **Authentication**: LocalStorage-based (can be upgraded to JWT)
- **Styling**: Inline styles + CSS → CSS modules + styled-jsx

### API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/booking` - Get all bookings
- `POST /api/booking` - Create booking
- `GET /api/booking/[id]` - Get booking by ID
- `PUT /api/booking/[id]` - Update booking
- `DELETE /api/booking/[id]` - Delete booking
- `GET /api/property/list` - Get all properties
- `POST /api/property/list` - Submit property listing
- `POST /api/analytics/event` - Track analytics event

## Development

- Type checking: `npm run type-check`
- Linting: `npm run lint`

## Deployment

This project is ready for deployment on:
- Vercel (recommended)
- Netlify
- Any Node.js hosting platform

Make sure to set environment variables in your hosting platform.

