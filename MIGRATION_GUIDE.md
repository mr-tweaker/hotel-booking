# Migration Guide: BookingHours to Next.js + TypeScript

## Overview

This document outlines the complete migration from the original BookingHours codebase to Next.js 14 with TypeScript, ensuring loose coupling and maintainability.

## Architecture Changes

### Original Architecture
- **Frontend**: Static HTML files with vanilla JavaScript
- **Backend**: Express.js server with routes
- **API**: Vercel serverless functions (separate)
- **Database**: MongoDB + JSON files (legacy)
- **File Storage**: Local filesystem + Cloudinary

### New Architecture
- **Frontend**: Next.js 14 App Router with React components
- **Backend**: Next.js API routes (integrated)
- **Database**: MongoDB only (Mongoose)
- **File Storage**: Cloudinary
- **Type Safety**: Full TypeScript coverage

## Key Improvements

### 1. Loose Coupling

#### Service Layer
- Business logic separated from API routes
- Services: `auth.service.ts`, `booking.service.ts`, `property.service.ts`, `analytics.service.ts`
- Each service is independent and testable

#### Component Isolation
- Components are self-contained and reusable
- Props-based communication
- No global state dependencies

#### API Abstraction
- `lib/api-client.ts` provides clean interface
- Frontend doesn't know about API implementation details
- Easy to swap API implementations

### 2. Type Safety

- All models have TypeScript interfaces
- API responses are typed
- Component props are typed
- Service methods are typed

### 3. Code Organization

```
nextjs-migration/
├── app/              # Next.js App Router
│   ├── api/         # API routes
│   ├── [pages]/     # Page components
│   └── layout.tsx   # Root layout
├── components/       # Reusable React components
├── lib/             # Utilities and helpers
├── models/          # Mongoose models
├── services/        # Business logic
└── types/           # TypeScript types
```

## Migration Checklist

### ✅ Completed

1. **Project Setup**
   - Next.js 14 configuration
   - TypeScript configuration
   - ESLint setup
   - Package.json with dependencies

2. **Type Definitions**
   - User, Booking, Property, AnalyticsEvent types
   - API response types
   - Component prop types

3. **Database Layer**
   - MongoDB connection (cached)
   - Mongoose models (TypeScript)
   - Model re-compilation prevention

4. **Service Layer**
   - Auth service (signup, login)
   - Booking service (CRUD operations)
   - Property service (create, list)
   - Analytics service (track events)

5. **API Routes**
   - `/api/auth/signup` - POST
   - `/api/auth/login` - POST
   - `/api/booking` - GET, POST
   - `/api/booking/[id]` - GET, PUT, DELETE
   - `/api/property/list` - GET, POST
   - `/api/analytics/event` - POST

6. **Frontend Pages**
   - Home page (search and listings)
   - Login page
   - Signup page
   - Hotel detail page
   - List property page
   - Dashboard page

7. **Components**
   - Navbar (with auth state)
   - Footer
   - HotelCard

8. **Utilities**
   - API client
   - Auth helpers
   - Date/currency formatters
   - Cloudinary integration

## File Upload Handling

### Original
- Used `multer` with Express
- Files stored locally, then uploaded to Cloudinary

### New
- Uses Next.js `FormData` API
- Direct upload to Cloudinary from API route
- No local file storage needed

## Authentication

### Current Implementation
- LocalStorage-based (client-side)
- No JWT tokens (can be added)
- Session management via localStorage

### Future Improvements
- JWT tokens
- Server-side session management
- Refresh tokens
- Role-based access control

## Environment Variables

Required environment variables:

```env
MONGODB_URI=mongodb://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Running the Application

### Development
```bash
cd nextjs-migration
npm install
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Testing

### Manual Testing Checklist
- [ ] User signup
- [ ] User login
- [ ] Property listing submission
- [ ] Hotel search and filtering
- [ ] Hotel detail view
- [ ] Room selection
- [ ] Booking creation
- [ ] Booking management (dashboard)
- [ ] File uploads (ID proofs, property images)
- [ ] Analytics tracking

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Other Platforms
- Ensure Node.js 18+ is available
- Set environment variables
- Run `npm run build` and `npm start`

## Breaking Changes

1. **API Endpoints**: Now under `/api/*` instead of separate server
2. **File Uploads**: Must use FormData (not JSON)
3. **Authentication**: Client-side only (no server sessions)
4. **Database**: MongoDB only (no JSON file fallback)

## Future Enhancements

1. **Server Components**: Use React Server Components for better performance
2. **Server Actions**: Replace API routes with Server Actions where appropriate
3. **Authentication**: Implement JWT-based auth
4. **Real-time**: Add WebSocket support for live updates
5. **Testing**: Add unit and integration tests
6. **Error Handling**: Implement error boundaries
7. **Loading States**: Add Suspense boundaries
8. **Caching**: Implement proper caching strategies

## Support

For issues or questions, refer to:
- Next.js Documentation: https://nextjs.org/docs
- TypeScript Documentation: https://www.typescriptlang.org/docs
- Mongoose Documentation: https://mongoosejs.com/docs

