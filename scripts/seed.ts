// Main seed script - runs all seeders
import seedHotels from './seed-hotels';

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');
  
  await seedHotels();
  
  console.log('\n✨ All seeding completed!');
  process.exit(0);
}

runSeeds().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});

