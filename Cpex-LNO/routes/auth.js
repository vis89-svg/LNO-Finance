const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');

/**
 * POST /auth/login
 * Handle user login
 */
router.post('/login', [
  body('user_name').trim().notEmpty().withMessage('Username is required'),
  body('password').trim().notEmpty().withMessage('Password is required'),
], async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  await authController.login(req, res);
});

/**
 * POST /auth/logout
 * Handle user logout
 */
router.post('/logout', (req, res) => {
  authController.logout(req, res);
});

/**
 * GET /auth/check
 * Check if user is authenticated
 */
router.get('/check', (req, res) => {
  authController.checkAuth(req, res);
});

module.exports = router;
