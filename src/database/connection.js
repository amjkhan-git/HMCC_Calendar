const { createClient } = require('@libsql/client');
const config = require('../config');

// Create Turso client
const db = createClient({
  url: config.tursoUrl,
  authToken: config.tursoAuthToken,
});

// Initialize database schema
async function initializeDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      hijri_date TEXT NOT NULL,
      hijri_day INTEGER NOT NULL,
      day_of_week TEXT NOT NULL,
      
      -- Sponsor Information
      sponsor_name TEXT,
      sponsor_email TEXT,
      sponsor_phone TEXT,
      sponsor_organization TEXT,
      
      -- Food Vendor Information
      food_vendor_name TEXT,
      food_vendor_contact_name TEXT,
      food_vendor_phone TEXT,
      expected_guests INTEGER,
      special_notes TEXT,
      
      -- Payment Information (separated food and cleaning)
      food_amount REAL DEFAULT 0,
      cleaning_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      payment_method TEXT CHECK(payment_method IN ('check', 'cash', 'zelle', NULL)),
      check_number TEXT,
      mohid_reference TEXT,
      amount_paid REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'partial', 'completed', 'cancelled', 'refunded')),
      payment_date TEXT,
      
      -- Booking Status (added pending_approval, hmcc_sponsored, eid)
      booking_status TEXT DEFAULT 'available' CHECK(booking_status IN ('available', 'pending_approval', 'booked', 'blocked', 'hmcc_sponsored', 'eid')),
      
      -- Approval workflow
      approval_status TEXT DEFAULT NULL CHECK(approval_status IN ('pending', 'approved', 'rejected', NULL)),
      approved_by TEXT,
      approved_at TEXT,
      rejection_reason TEXT,
      
      -- Pricing tier
      pricing_tier TEXT CHECK(pricing_tier IN ('weekday', 'weekend', 'last10nights', NULL)),
      
      -- Admin comments
      admin_comment TEXT,
      
      -- Metadata
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `;
  
  await db.execute(createTableSQL);
  
  // Create indexes
  await db.execute('CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_bookings_approval_status ON bookings(approval_status)');
  
  // Create audit log table
  const createAuditSQL = `
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      performed_by TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `;
  
  await db.execute(createAuditSQL);
  await db.execute('CREATE INDEX IF NOT EXISTS idx_audit_booking_id ON audit_log(booking_id)');
  
  // Create admin sessions table
  const createSessionsSQL = `
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `;
  
  await db.execute(createSessionsSQL);
  await db.execute('CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(token)');
  
  console.log('Database initialized successfully');
}

// Drop all tables (for fresh start)
async function dropAllTables() {
  await db.execute('DROP TABLE IF EXISTS bookings');
  await db.execute('DROP TABLE IF EXISTS audit_log');
  await db.execute('DROP TABLE IF EXISTS admin_sessions');
  console.log('All tables dropped');
}

module.exports = {
  db,
  initializeDatabase,
  dropAllTables
};
