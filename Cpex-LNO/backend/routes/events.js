const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const eventController = require('../controllers/eventController');
const { requireAuth } = require('../middleware/session');

// All event routes require authentication
router.use(requireAuth);

/**
 * GET /events
 * Get all events
 */
router.get('/', async (req, res) => {
  await eventController.getAllEvents(req, res);
});

/**
 * GET /events/:id
 * Get single event by ID
 */
router.get('/:id', async (req, res) => {
  await eventController.getEventById(req, res);
});

/**
 * POST /events
 * Create new event
 */
router.post('/', [
  body('event_name').trim().notEmpty().withMessage('Event name is required'),
  body('user_name').trim().notEmpty().withMessage('Username is required'),
  body('password').trim().notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  await eventController.createEvent(req, res);
});

/**
 * POST /events/:id/update
 * Update event
 */
router.post('/:id/update', [
  body('event_name').optional().trim().notEmpty().withMessage('Event name cannot be empty'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  await eventController.updateEvent(req, res);
});

/**
 * POST /events/:id/delete
 * Delete event (AJAX endpoint)
 */
router.post('/:id/delete', async (req, res) => {
  await eventController.deleteEvent(req, res);
});

module.exports = router;
