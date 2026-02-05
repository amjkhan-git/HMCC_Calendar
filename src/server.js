const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const bookingRoutes = require('./routes/bookingRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { initializeDatabase, setupTriggers } = require('./database/connection');
const { init: initDb } = require('./database/init');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration - Allow all origins for this public API
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Edit-Token']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serve static files (for demo frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'HMCC Ramadan Calendar API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Info endpoint
app.get(config.apiPrefix, (req, res) => {
  res.json({
    success: true,
    message: 'HMCC Ramadan Iftar Sponsorship Calendar API',
    version: '2.0.0',
    endpoints: {
      calendar: `${config.apiPrefix}/calendar`,
      statistics: `${config.apiPrefix}/calendar/stats`,
      pricing: `${config.apiPrefix}/pricing`,
      bookings: `${config.apiPrefix}/bookings`,
      bookingById: `${config.apiPrefix}/bookings/:id`,
      bookingByDate: `${config.apiPrefix}/bookings/date/:date`,
      createBooking: `POST ${config.apiPrefix}/bookings/date/:date`,
      adminLogin: `POST ${config.apiPrefix}/admin/login`,
      adminPending: `GET ${config.apiPrefix}/admin/pending`,
      adminApprove: `POST ${config.apiPrefix}/admin/bookings/:id/approve`,
      adminReject: `POST ${config.apiPrefix}/admin/bookings/:id/reject`,
      adminUpdate: `PUT ${config.apiPrefix}/admin/bookings/:id`,
      adminPayment: `PATCH ${config.apiPrefix}/admin/bookings/:id/payment`,
      adminCancel: `DELETE ${config.apiPrefix}/admin/bookings/:id`,
      adminBlock: `PATCH ${config.apiPrefix}/admin/dates/:id/block`,
      exportCSV: `GET ${config.apiPrefix}/admin/export/csv`,
      exportExcel: `GET ${config.apiPrefix}/admin/export/excel`,
      exportPDF: `GET ${config.apiPrefix}/admin/export/pdf`
    },
    ramadan2026: {
      startDate: config.ramadan2026.startDate,
      endDate: config.ramadan2026.endDate,
      hijriYear: config.ramadan2026.hijriYear,
      totalDays: config.ramadan2026.totalDays
    },
    pricing: config.pricing
  });
});

// API Routes
app.use(config.apiPrefix, bookingRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Self-ping to keep Render.com service awake (prevents spin-down on free tier)
function startKeepAlive() {
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_URL && config.nodeEnv === 'production') {
    const INTERVAL = 10 * 60 * 1000; // 10 minutes
    setInterval(async () => {
      try {
        const response = await fetch(`${RENDER_URL}/health`);
        console.log(`[Keep-Alive] Pinged ${RENDER_URL}/health - Status: ${response.status}`);
      } catch (error) {
        console.error('[Keep-Alive] Ping failed:', error.message);
      }
    }, INTERVAL);
    console.log(`[Keep-Alive] Started - pinging every 10 minutes`);
  }
}

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    console.log('Initializing database...');
    await initDb();
    
    // Start server
    app.listen(config.port, () => {
      // Start keep-alive pings after server is running
      startKeepAlive();
      
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🌙 HMCC Ramadan Iftar Sponsorship Calendar API               ║
║                                                                ║
║   Server running on port ${config.port}                              ║
║   Environment: ${config.nodeEnv.padEnd(45)}║
║                                                                ║
║   API Base URL: http://localhost:${config.port}${config.apiPrefix.padEnd(23)}║
║   Demo UI: http://localhost:${config.port}/                           ║
║                                                                ║
║   Ramadan 2026: ${config.ramadan2026.startDate} to ${config.ramadan2026.endDate}            ║
║   Hijri Year: ${config.ramadan2026.hijriYear} AH                                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

module.exports = app;
