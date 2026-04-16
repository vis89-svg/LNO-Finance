require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const { sessionMiddleware } = require('../middleware/session');
const authRoutes = require('../routes/auth');
const eventRoutes = require('../routes/events');
const financeRoutes = require('../routes/finances');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : '*',
  credentials: true,
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(sessionMiddleware);

// 🔥 FIXED: Serve static files from ROOT /public (from /api/index.js)
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/finances', financeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Capex Finance API is running' });
});

// Serve login page for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public/login.html'));
});

// Serve index page
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public/index.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public/index.html'));
});

// Serve other pages
app.get('/create-event', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public/event-creation.html'));
});
app.get('/create-event.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public/event-creation.html'));
});
app.get('/add-finance/:eventId', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public/add-finance.html'));
});
app.get('/add-finance/:eventId.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public/add-finance.html'));
});
app.get('/edit-event/:eventId', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public/edit-event.html'));
});
app.get('/edit-event/:eventId.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public/edit-event.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', '..', 'public/404.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
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