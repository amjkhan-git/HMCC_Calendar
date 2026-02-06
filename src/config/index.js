require('dotenv').config();

const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database (Turso) - UPDATE THIS WITH YOUR HMCC TURSO DATABASE
  tursoUrl: process.env.TURSO_DATABASE_URL || 'libsql://hmcc-ramadan-YOUR-DATABASE.turso.io',
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
  
  // API
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  // CORS - Updated for HMCC
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'https://heathrowmcc.org', 'https://www.heathrowmcc.org'],
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  
  // Zelle payment info for HMCC
  zelleInfo: {
    primary: 'Hmccoppexp@yahoo.com'
  },
  
  // Guest Capacity - Fixed at 100 for HMCC
  weekdayGuests: 100,
  weekendGuests: 100,
  
  // Pricing - Flat rate for all days
  pricing: {
    weekday: {
      food: 1400,
      cleaning: 100,
      total: 1500,
      description: 'Iftar Sponsorship: $1,500 ($1,400 Food + $100 Cleanup)'
    },
    weekend: {
      food: 1400,
      cleaning: 100,
      total: 1500,
      description: 'Iftar Sponsorship: $1,500 ($1,400 Food + $100 Cleanup)'
    },
    lastTenNights: {
      food: 1400,
      cleaning: 100,
      total: 1500,
      description: 'Iftar Sponsorship: $1,500 ($1,400 Food + $100 Cleanup)'
    }
  },
  
  // Admin Credentials - HMCC
  admin: {
    username: process.env.ADMIN_USERNAME || 'hmcc_admin',
    password: process.env.ADMIN_PASSWORD || 'Ramadan1447!'
  },
  
  // JWT Secret for admin sessions - CHANGE THIS IN PRODUCTION
  jwtSecret: process.env.JWT_SECRET || 'hmcc-ramadan-2026-secret-key-change-in-production',
  jwtExpiresIn: '24h',
  
  // Ramadan 2026 Configuration
  ramadan2026: {
    // Ramadan 1447 AH starts Feb 17, 2026
    // Iftar sponsorship starts from Feb 19, 2026
    startDate: '2026-02-19',
    endDate: '2026-03-18',
    hijriYear: 1447,
    hijriMonth: 9, // Ramadan is the 9th month
    totalDays: 28 // Feb 19 - Mar 18 (28 days of sponsorship)
  }
};

module.exports = config;
