// Seed script to populate hotels in the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables (try multiple locations)
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });

// Set default MongoDB URI if not provided
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/bookinghours';
  console.log('⚠️  MONGODB_URI not found in environment variables. Using default: mongodb://localhost:27017/bookinghours');
  console.log('   To use a custom MongoDB URI, create a .env.local file with MONGODB_URI=your_connection_string\n');
}

import Hotel from '../models/Hotel';
import connectDB from '../lib/db';

// ============================================================================
// HOTEL DATA ORGANIZED BY CITY
// ============================================================================

// ============================================================================
// DELHI - 7 Hotels
// ============================================================================
const delhiHotels = [
  {
    hotelId: 'H1001',
    name: 'Connaught Place Comfort',
    city: 'Delhi',
    locality: 'Connaught Place',
    state: 'Delhi',
    address: 'Connaught Place, New Delhi',
    price: 799,
    checkInCharge: 500,
    stars: 4,
    amenities: ['Wifi', 'Parking', 'AC', 'TV'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
    ],
    description: 'Comfortable rooms in the heart of Connaught Place, perfect for business travelers.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Standard',
        rate3h: 599,
        rate6h: 999,
        rate9h: 1299,
        rate12h: 1599,
        rate24h: 2499,
        additionalGuestRate: 200,
        standardOccupancy: 2,
        maxOccupancy: 4,
      },
      {
        category: 'Deluxe',
        rate3h: 799,
        rate6h: 1299,
        rate9h: 1699,
        rate12h: 2099,
        rate24h: 3299,
        additionalGuestRate: 300,
        standardOccupancy: 2,
        maxOccupancy: 4,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'H1002',
    name: 'Saket Suites',
    city: 'Delhi',
    locality: 'Saket',
    state: 'Delhi',
    address: 'Saket, South Delhi',
    price: 599,
    checkInCharge: 500,
    stars: 3,
    amenities: ['Wifi', 'Pool', 'AC', 'TV', 'Gym'],
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
    ],
    description: 'Modern suites with pool access, ideal for families and leisure travelers.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Standard',
        rate3h: 499,
        rate6h: 799,
        rate9h: 1099,
        rate12h: 1399,
        rate24h: 2199,
        additionalGuestRate: 150,
        standardOccupancy: 2,
        maxOccupancy: 3,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'H1003',
    name: 'Hauz Khas Inn',
    city: 'Delhi',
    locality: 'Hauz Khas',
    state: 'Delhi',
    address: 'Hauz Khas, South Delhi',
    price: 499,
    checkInCharge: 500,
    stars: 2,
    amenities: ['Wifi', 'AC'],
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
    ],
    description: 'Budget-friendly accommodation in the trendy Hauz Khas area.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Basic',
        rate3h: 399,
        rate6h: 599,
        rate9h: 799,
        rate12h: 999,
        rate24h: 1599,
        additionalGuestRate: 100,
        standardOccupancy: 1,
        maxOccupancy: 2,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'H1004',
    name: 'Dwarka Deluxe',
    city: 'Delhi',
    locality: 'Dwarka',
    state: 'Delhi',
    address: 'Dwarka Sector, New Delhi',
    price: 999,
    checkInCharge: 500,
    stars: 5,
    amenities: ['Wifi', 'Parking', 'Pool', 'AC', 'TV', 'Spa', 'Gym', 'Restaurant'],
    images: [
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
    ],
    description: 'Luxury hotel with world-class amenities and exceptional service.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Deluxe',
        rate3h: 899,
        rate6h: 1499,
        rate9h: 1999,
        rate12h: 2499,
        rate24h: 3999,
        additionalGuestRate: 400,
        standardOccupancy: 2,
        maxOccupancy: 4,
      },
      {
        category: 'Suite',
        rate3h: 1299,
        rate6h: 2199,
        rate9h: 2999,
        rate12h: 3799,
        rate24h: 5999,
        additionalGuestRate: 500,
        standardOccupancy: 2,
        maxOccupancy: 5,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'H1005',
    name: 'Karol Bagh Central',
    city: 'Delhi',
    locality: 'Karol Bagh',
    state: 'Delhi',
    address: 'Karol Bagh, Central Delhi',
    price: 699,
    checkInCharge: 500,
    stars: 3,
    amenities: ['Wifi', 'Parking', 'AC', 'TV'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    ],
    description: 'Convenient location near shopping and dining areas.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Standard',
        rate3h: 549,
        rate6h: 899,
        rate9h: 1199,
        rate12h: 1499,
        rate24h: 2399,
        additionalGuestRate: 180,
        standardOccupancy: 2,
        maxOccupancy: 3,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'H1006',
    name: 'Rohini Grand',
    city: 'Delhi',
    locality: 'Rohini',
    state: 'Delhi',
    address: 'Rohini, North Delhi',
    price: 649,
    checkInCharge: 500,
    stars: 3,
    amenities: ['Wifi', 'Parking', 'AC'],
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
    ],
    description: 'Comfortable stay in North Delhi with easy access to metro.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Standard',
        rate3h: 499,
        rate6h: 799,
        rate9h: 1099,
        rate12h: 1399,
        rate24h: 2199,
        additionalGuestRate: 150,
        standardOccupancy: 2,
        maxOccupancy: 3,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'H1007',
    name: 'Janakpuri Plaza',
    city: 'Delhi',
    locality: 'Janakpuri',
    state: 'Delhi',
    address: 'Janakpuri, West Delhi',
    price: 549,
    checkInCharge: 500,
    stars: 2,
    amenities: ['Wifi', 'AC'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    ],
    description: 'Affordable accommodation in West Delhi.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Basic',
        rate3h: 449,
        rate6h: 699,
        rate9h: 949,
        rate12h: 1199,
        rate24h: 1899,
        additionalGuestRate: 120,
        standardOccupancy: 1,
        maxOccupancy: 2,
      },
    ],
    isActive: true,
  },
];

// ============================================================================
// NOIDA - 3 Hotels
// ============================================================================
const noidaHotels = [
  {
    hotelId: 'NOID001',
    name: 'Sector 18 Business Hub',
    city: 'Noida',
    locality: 'Sector 18',
    state: 'Uttar Pradesh',
    address: 'Sector 18, Noida',
    price: 749,
    checkInCharge: 500,
    stars: 4,
    amenities: ['Wifi', 'Parking', 'AC', 'TV', 'Gym'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
    ],
    description: 'Modern business hotel in the heart of Noida, perfect for corporate travelers.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Standard',
        rate3h: 599,
        rate6h: 999,
        rate9h: 1299,
        rate12h: 1599,
        rate24h: 2499,
        additionalGuestRate: 200,
        standardOccupancy: 2,
        maxOccupancy: 4,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'NOID002',
    name: 'Sector 62 Corporate Suites',
    city: 'Noida',
    locality: 'Sector 62',
    state: 'Uttar Pradesh',
    address: 'Sector 62, Noida',
    price: 849,
    checkInCharge: 500,
    stars: 4,
    amenities: ['Wifi', 'Parking', 'AC', 'TV', 'Restaurant', 'Conference Room'],
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
    ],
    description: 'Luxury suites designed for business professionals in Noida.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Deluxe',
        rate3h: 699,
        rate6h: 1199,
        rate9h: 1599,
        rate12h: 1999,
        rate24h: 3199,
        additionalGuestRate: 250,
        standardOccupancy: 2,
        maxOccupancy: 4,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'NOID003',
    name: 'Greater Noida Expressway Inn',
    city: 'Noida',
    locality: 'Greater Noida',
    state: 'Uttar Pradesh',
    address: 'Greater Noida Expressway, Noida',
    price: 649,
    checkInCharge: 500,
    stars: 3,
    amenities: ['Wifi', 'Parking', 'AC', 'TV'],
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
    ],
    description: 'Comfortable stay near Greater Noida Expressway with easy connectivity.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Standard',
        rate3h: 499,
        rate6h: 799,
        rate9h: 1099,
        rate12h: 1399,
        rate24h: 2199,
        additionalGuestRate: 150,
        standardOccupancy: 2,
        maxOccupancy: 3,
      },
    ],
    isActive: true,
  },
];

// ============================================================================
// GURUGRAM - 4 Hotels
// ============================================================================
const gurugramHotels = [
  {
    hotelId: 'GURU001',
    name: 'Cyber City Business Hotel',
    city: 'Gurugram',
    locality: 'Cyber City',
    state: 'Haryana',
    address: 'Cyber City, Gurugram',
    price: 999,
    checkInCharge: 500,
    stars: 5,
    amenities: ['Wifi', 'Parking', 'Pool', 'AC', 'TV', 'Spa', 'Gym', 'Restaurant'],
    images: [
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
    ],
    description: 'Premium business hotel in the heart of Cyber City, Gurugram.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Deluxe',
        rate3h: 899,
        rate6h: 1499,
        rate9h: 1999,
        rate12h: 2499,
        rate24h: 3999,
        additionalGuestRate: 400,
        standardOccupancy: 2,
        maxOccupancy: 4,
      },
      {
        category: 'Executive Suite',
        rate3h: 1299,
        rate6h: 2199,
        rate9h: 2999,
        rate12h: 3799,
        rate24h: 5999,
        additionalGuestRate: 500,
        standardOccupancy: 2,
        maxOccupancy: 5,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'GURU002',
    name: 'Sohna Road Comfort',
    city: 'Gurugram',
    locality: 'Sohna Road',
    state: 'Haryana',
    address: 'Sohna Road, Gurugram',
    price: 699,
    checkInCharge: 500,
    stars: 3,
    amenities: ['Wifi', 'Parking', 'AC', 'TV'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    ],
    description: 'Affordable comfort on Sohna Road, close to major business hubs.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Standard',
        rate3h: 549,
        rate6h: 899,
        rate9h: 1199,
        rate12h: 1499,
        rate24h: 2399,
        additionalGuestRate: 180,
        standardOccupancy: 2,
        maxOccupancy: 3,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'GURU003',
    name: 'MG Road Grand',
    city: 'Gurugram',
    locality: 'MG Road',
    state: 'Haryana',
    address: 'MG Road, Gurugram',
    price: 849,
    checkInCharge: 500,
    stars: 4,
    amenities: ['Wifi', 'Parking', 'AC', 'TV', 'Gym', 'Restaurant'],
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
    ],
    description: 'Elegant hotel on MG Road with excellent connectivity and amenities.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Standard',
        rate3h: 699,
        rate6h: 1199,
        rate9h: 1599,
        rate12h: 1999,
        rate24h: 3199,
        additionalGuestRate: 250,
        standardOccupancy: 2,
        maxOccupancy: 4,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'GURU004',
    name: 'DLF Phase 1 Suites',
    city: 'Gurugram',
    locality: 'DLF Phase 1',
    state: 'Haryana',
    address: 'DLF Phase 1, Gurugram',
    price: 799,
    checkInCharge: 500,
    stars: 4,
    amenities: ['Wifi', 'Parking', 'AC', 'TV', 'Pool'],
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
    ],
    description: 'Modern suites in DLF Phase 1, ideal for extended stays.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Deluxe',
        rate3h: 649,
        rate6h: 1099,
        rate9h: 1499,
        rate12h: 1899,
        rate24h: 2999,
        additionalGuestRate: 220,
        standardOccupancy: 2,
        maxOccupancy: 4,
      },
    ],
    isActive: true,
  },
];

// ============================================================================
// FARIDABAD - 3 Hotels
// ============================================================================
const faridabadHotels = [
  {
    hotelId: 'FARI001',
    name: 'Sector 15 Business Hotel',
    city: 'Faridabad',
    locality: 'Sector 15',
    state: 'Haryana',
    address: 'Sector 15, Faridabad',
    price: 599,
    checkInCharge: 500,
    stars: 3,
    amenities: ['Wifi', 'Parking', 'AC', 'TV'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
    ],
    description: 'Comfortable business hotel in Sector 15, Faridabad.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Standard',
        rate3h: 449,
        rate6h: 749,
        rate9h: 1049,
        rate12h: 1349,
        rate24h: 2149,
        additionalGuestRate: 140,
        standardOccupancy: 2,
        maxOccupancy: 3,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'FARI002',
    name: 'NIT Faridabad Inn',
    city: 'Faridabad',
    locality: 'NIT',
    state: 'Haryana',
    address: 'NIT, Faridabad',
    price: 549,
    checkInCharge: 500,
    stars: 2,
    amenities: ['Wifi', 'AC'],
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
    ],
    description: 'Budget-friendly accommodation near NIT, Faridabad.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Basic',
        rate3h: 399,
        rate6h: 649,
        rate9h: 899,
        rate12h: 1149,
        rate24h: 1849,
        additionalGuestRate: 120,
        standardOccupancy: 1,
        maxOccupancy: 2,
      },
    ],
    isActive: true,
  },
  {
    hotelId: 'FARI003',
    name: 'Sector 21 Grand',
    city: 'Faridabad',
    locality: 'Sector 21',
    state: 'Haryana',
    address: 'Sector 21, Faridabad',
    price: 699,
    checkInCharge: 500,
    stars: 3,
    amenities: ['Wifi', 'Parking', 'AC', 'TV', 'Restaurant'],
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
    ],
    description: 'Well-appointed hotel in Sector 21 with modern amenities.',
    propertyType: 'Hotel' as const,
    hourlyRooms: [
      {
        category: 'Standard',
        rate3h: 549,
        rate6h: 899,
        rate9h: 1199,
        rate12h: 1499,
        rate24h: 2399,
        additionalGuestRate: 180,
        standardOccupancy: 2,
        maxOccupancy: 3,
      },
    ],
    isActive: true,
  },
];

// ============================================================================
// RISHIKESH - 1 Resort
// ============================================================================
const rishikeshHotels = [
  {
    hotelId: 'NTR001',
    name: 'Nature on the Rocks',
    city: 'Rishikesh',
    locality: 'Rishikesh',
    state: 'Uttarakhand',
    address: 'Rishikesh, Uttarakhand',
    price: 1299,
    checkInCharge: 500,
    stars: 4,
    amenities: ['Wifi', 'Parking', 'Bathtub', 'AC', 'Restaurant'],
    images: [
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=600&fit=crop',
    ],
    description: 'Cliffside property in Rishikesh — great views and relaxing dining patio.',
    propertyType: 'Resort' as const,
    hourlyRooms: [
      {
        category: 'Deluxe',
        rate3h: 1099,
        rate6h: 1899,
        rate9h: 2599,
        rate12h: 3299,
        rate24h: 5199,
        additionalGuestRate: 300,
        standardOccupancy: 2,
        maxOccupancy: 4,
      },
    ],
    isActive: true,
  },
];

// ============================================================================
// COMBINE ALL HOTELS
// ============================================================================
const mockHotels = [
  ...delhiHotels,
  ...noidaHotels,
  ...gurugramHotels,
  ...faridabadHotels,
  ...rishikeshHotels,
];

async function seedHotels() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('✓ Connected to database successfully\n');

    // Clear existing hotels (optional - comment out if you want to keep existing data)
    // await Hotel.deleteMany({});
    // console.log('Cleared existing hotels');

    // Insert hotels
    for (const hotelData of mockHotels) {
      const existing = await Hotel.findOne({ hotelId: hotelData.hotelId });
      if (existing) {
        console.log(`Hotel ${hotelData.hotelId} already exists, skipping...`);
        continue;
      }

      const hotel = new Hotel(hotelData);
      await hotel.save();
      console.log(`✓ Seeded hotel: ${hotelData.name} (${hotelData.hotelId})`);
    }

    console.log('\n✅ Hotel seeding completed!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error seeding hotels:', error.message);
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connect')) {
      console.error('\n💡 MongoDB connection failed. Please ensure:');
      console.error('   1. MongoDB is running locally, OR');
      console.error('   2. Set MONGODB_URI in .env.local for MongoDB Atlas');
      console.error('\n   To start MongoDB locally:');
      console.error('   - Linux: sudo systemctl start mongod');
      console.error('   - macOS: brew services start mongodb-community');
      console.error('   - Windows: net start MongoDB');
      console.error('\n   Or use MongoDB Atlas: https://www.mongodb.com/cloud/atlas');
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedHotels();
}

export default seedHotels;

