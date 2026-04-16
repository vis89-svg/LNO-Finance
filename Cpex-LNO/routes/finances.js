const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const financeController = require('../controllers/financeController');
const { requireAuth } = require('../middleware/session');

// All finance routes require authentication
router.use(requireAuth);

/**
 * GET /finances/event/:eventId
 * Get all finances for an event
 */
router.get('/event/:eventId', async (req, res) => {
  await financeController.getFinancesByEventId(req, res);
});

/**
 * GET /finances/:id
 * Get single finance record
 */
router.get('/:id', async (req, res) => {
  await financeController.getFinanceById(req, res);
});

/**
 * POST /finances/event/:eventId/add
 * Add finance record to an event
 */
router.post('/event/:eventId/add', [
  body('from_person').trim().notEmpty().withMessage('From person is required'),
  body('to_person').trim().notEmpty().withMessage('To person is required'),
  body('amount').notEmpty().withMessage('Amount is required').isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('date_event').trim().notEmpty().withMessage('Date is required'),
  body('mode').trim().notEmpty().withMessage('Mode is required'),
  body('transaction_type').trim().notEmpty().withMessage('Transaction type is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  await financeController.addFinance(req, res);
});

/**
 * POST /finances/:id/update
 * Update finance record
 */
router.post('/:id/update', async (req, res) => {
  await financeController.updateFinance(req, res);
});

/**
 * POST /finances/:id/delete
 * Delete finance record
 */
router.post('/:id/delete', async (req, res) => {
  await financeController.deleteFinance(req, res);
});

module.exports = router;
