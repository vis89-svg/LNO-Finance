require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const { sessionMiddleware } = require('../middleware/session');
const firebaseConfig = require('../config/firebase');

const app = express();
const PORT = process.env.PORT || 3000;

// Check Firebase initialization
if (firebaseConfig.initError) {
  console.error('⚠️  Firebase initialization failed:', firebaseConfig.initError.message);
}

// Try to load routes (they might fail if Firebase isn't available)
let authRoutes, eventRoutes, financeRoutes;
try {
  authRoutes = require('../routes/auth');
  eventRoutes = require('../routes/events');
  financeRoutes = require('../routes/finances');
} catch (err) {
  console.error('❌ Failed to load routes:', err.message);
  // Continue anyway - we'll serve a basic health check
}

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(sessionMiddleware);

// 🔥 FIXED: Serve static files from /public (one level up from /api)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
if (authRoutes && eventRoutes && financeRoutes) {
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/finances', financeRoutes);
} else {
  console.warn('⚠️  Some routes are not available due to initialization errors');
}

// Health check endpoint - detailed diagnostics
app.get('/api/health', (req, res) => {
  const status = {
    status: 'ok',
    message: 'Capex Finance API is running',
    firebase: firebaseConfig.db ? 'connected' : 'not connected',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  };

  if (firebaseConfig.initError) {
    status.firebase_error = firebaseConfig.initError.message;
  }

  res.json(status);
});

// Serve login page for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public/login.html'));
});

// Serve index page
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public/index.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public/index.html'));
});

// Serve other pages
app.get('/create-event', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public/event-creation.html'));
});
app.get('/create-event.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public/event-creation.html'));
});
app.get('/add-finance/:eventId', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public/add-finance.html'));
});
app.get('/add-finance/:eventId.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public/add-finance.html'));
});
app.get('/edit-event/:eventId', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public/edit-event.html'));
});
app.get('/edit-event/:eventId.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public/edit-event.html'));
});

// 404 handler
app.use((req, res) => {
  // Check if it's an API request
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'Not found',
      message: 'This API endpoint does not exist. Check /api/health for status.'
    });
  }
  
  // Serve 404.html for non-API requests
  res.status(404).sendFile(path.join(__dirname, '..', 'public/404.html'), (err) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
    });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 🚀 VERCEL SERVERLESS + LOCAL SUPPORT
module.exports = app;  // REQUIRED for Vercel /api/index.js

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Capex Finance Backend is running!                       ║
║                                                           ║
║   Local:    http://localhost:${PORT}                        ║
║                                                           ║
║   API:      http://localhost:${PORT}/api/health             ║
║                                                           ║
║   Press Ctrl+C to stop                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}