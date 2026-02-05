/**
 * Database Initialization Script for HMCC
 * Run with: npm run init-db
 */

const { db, initializeDatabase, dropAllTables } = require('./connection');
const { ramadanDates, getPricing, getExpectedGuests } = require('./ramadanDates');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

async function seedRamadanDates() {
  console.log('Seeding Ramadan 2026 dates for HMCC...');
  
  for (const dateInfo of ramadanDates) {
    try {
      const pricing = getPricing(dateInfo.date, dateInfo.day_of_week);
      const expectedGuests = getExpectedGuests(dateInfo.day_of_week);
      
      // Determine initial booking status
      let bookingStatus = dateInfo.initial_status || 'available';
      let sponsorName = null;
      let approvalStatus = null;
      
      // March 14 is HMCC sponsored - Khatam-e-Quran
      if (dateInfo.initial_status === 'hmcc_sponsored') {
        sponsorName = 'HMCC - Khatm-e-Quran';
        approvalStatus = 'approved';
      }
      
      await db.execute({
        sql: `INSERT OR IGNORE INTO bookings (
          id, date, hijri_date, hijri_day, day_of_week, 
          booking_status, food_amount, cleaning_amount, total_amount,
          expected_guests, pricing_tier, payment_status, sponsor_name, approval_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        args: [
          uuidv4(),
          dateInfo.date,
          dateInfo.hijri_date,
          dateInfo.hijri_day,
          dateInfo.day_of_week,
          bookingStatus,
          pricing.food_amount,
          pricing.cleaning_amount,
          pricing.total,
          expectedGuests,
          pricing.tier,
          sponsorName,
          approvalStatus
        ]
      });
    } catch (err) {
      // Ignore duplicate errors
      if (!err.message.includes('UNIQUE constraint')) {
        console.error('Error inserting date:', dateInfo.date, err.message);
      }
    }
  }
  
  console.log(`Seeded ${ramadanDates.length} Ramadan dates`);
}

async function init(freshStart = false) {
  try {
    console.log('Initializing HMCC database...');
    
    if (freshStart) {
      console.log('Fresh start requested - dropping all tables...');
      await dropAllTables();
    }
    
    await initializeDatabase();
    await seedRamadanDates();
    console.log('HMCC Database initialization complete!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  // Check for --fresh flag
  const freshStart = process.argv.includes('--fresh');
  init(freshStart);
}

module.exports = { init, seedRamadanDates };
