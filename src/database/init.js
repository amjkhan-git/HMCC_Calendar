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
      
      // HMCC sponsored dates
      if (dateInfo.initial_status === 'hmcc_sponsored') {
        sponsorName = dateInfo.sponsor_label || 'HMCC - Heathrow Muslim Community Center';
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

/**
 * Fix hijri_day and hijri_date for all existing records in the database.
 * This is safe to run multiple times - it uses the correct data from ramadanDates.js
 * and only updates hijri fields, preserving all booking/sponsor/payment data.
 */
async function fixHijriDates() {
  console.log('Fixing hijri dates in database...');
  let updated = 0;

  for (const dateInfo of ramadanDates) {
    try {
      const result = await db.execute({
        sql: `UPDATE bookings 
              SET hijri_day = ?, hijri_date = ?, day_of_week = ?,
                  updated_at = datetime('now')
              WHERE date = ? AND (hijri_day != ? OR hijri_date != ?)`,
        args: [
          dateInfo.hijri_day,
          dateInfo.hijri_date,
          dateInfo.day_of_week,
          dateInfo.date,
          dateInfo.hijri_day,
          dateInfo.hijri_date
        ]
      });
      if (result.rowsAffected > 0) {
        updated++;
        console.log(`  Fixed: ${dateInfo.date} → ${dateInfo.hijri_date} (Day ${dateInfo.hijri_day})`);
      }
    } catch (err) {
      console.error('Error fixing date:', dateInfo.date, err.message);
    }
  }

  // Fix Mar 13 → HMCC Khatam-e-Quran sponsored
  try {
    const mar13 = await db.execute({
      sql: `UPDATE bookings 
            SET booking_status = 'hmcc_sponsored', 
                sponsor_name = 'HMCC - Khatam-e-Quran',
                approval_status = 'approved',
                updated_at = datetime('now')
            WHERE date = '2026-03-13' AND booking_status NOT IN ('hmcc_sponsored')`,
      args: []
    });
    if (mar13.rowsAffected > 0) {
      updated++;
      console.log('  Fixed: 2026-03-13 → HMCC Khatam-e-Quran (sponsored)');
    }
  } catch (err) {
    console.error('Error fixing Mar 13:', err.message);
  }

  // Ensure Mar 14 is available
  try {
    const mar14 = await db.execute({
      sql: `UPDATE bookings 
            SET booking_status = 'available',
                sponsor_name = NULL,
                approval_status = NULL,
                updated_at = datetime('now')
            WHERE date = '2026-03-14' AND booking_status = 'hmcc_sponsored'`,
      args: []
    });
    if (mar14.rowsAffected > 0) {
      updated++;
      console.log('  Fixed: 2026-03-14 → Available');
    }
  } catch (err) {
    console.error('Error fixing Mar 14:', err.message);
  }

  if (updated > 0) {
    console.log(`Fixed ${updated} records`);
  } else {
    console.log('All dates are already correct');
  }
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
    await fixHijriDates();
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
