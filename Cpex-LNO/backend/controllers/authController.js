const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

// Hardcoded admin credentials (matching Django backend)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Legacyiedc';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '8474244';

/**
 * Login controller
 * Authenticates user against either:
 * 1. Hardcoded admin credentials
 * 2. Event credentials stored in Firestore
 */
const login = async (req, res) => {
  try {
    const { user_name, password } = req.body;

    if (!user_name || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    let user = null;
    let isAdmin = false;
    let eventId = null;

    // Check hardcoded admin credentials first
    if (user_name === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      isAdmin = true;
      user = {
        user_name: ADMIN_USERNAME,
        is_admin: true,
      };
    } else {
      // Check against Event collection in Firestore
      const eventsRef = db.collection('events');
      const snapshot = await eventsRef.where('user_name', '==', user_name).where('password', '==', password).get();

      if (snapshot.empty) {
        // Try with bcrypt hashed password if a hashed credential exists
        const snapshotHashed = await eventsRef.where('user_name', '==', user_name).get();

        for (const doc of snapshotHashed.docs) {
          const data = doc.data();
          if (data.password_hashed) {
            const match = await bcrypt.compare(password, data.password_hashed);
            if (match) {
              user = data;
              eventId = doc.id;
              break;
            }
          }
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      } else {
        // Plaintext password match (legacy Django data)
        const doc = snapshot.docs[0];
        user = doc.data();
        eventId = doc.id;
      }
    }

    // Set session data
    req.session.isAuthenticated = true;
    req.session.isAdmin = isAdmin;
    req.session.user = {
      user_name: user.user_name,
      is_admin: isAdmin,
      event_id: eventId,
    };
    req.session.eventId = eventId;

    // Match the original Django behavior:
    // admins can create/edit/delete, regular users can only view their own event data.
    req.session.show_add_button = isAdmin;
    req.session.show_edit_button = isAdmin;
    req.session.show_delete_menu = isAdmin;

    res.json({
      success: true,
      redirect: '/index.html',
      user: req.session.user,
      permissions: {
        show_add_button: req.session.show_add_button,
        show_edit_button: req.session.show_edit_button,
        show_delete_menu: req.session.show_delete_menu,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

/**
 * Logout controller
 */
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.json({ success: true, redirect: '/login.html' });
  });
};

/**
 * Check authentication status
 */
const checkAuth = (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    res.json({
      authenticated: true,
      user: req.session.user,
      permissions: {
        show_add_button: req.session.show_add_button,
        show_edit_button: req.session.show_edit_button,
        show_delete_menu: req.session.show_delete_menu,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
};

module.exports = { login, logout, checkAuth };
