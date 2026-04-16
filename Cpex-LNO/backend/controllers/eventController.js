const { db } = require('../config/firebase');

const ensureAdmin = (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return false;
  }

  return true;
};

const ensureEventAccess = (req, res, eventId) => {
  if (req.session && req.session.isAdmin) {
    return true;
  }

  if (req.session && req.session.eventId === eventId) {
    return true;
  }

  res.status(403).json({ error: 'Access denied' });
  return false;
};

const calculateEventTotal = async (eventId, eventAmount = '0') => {
  const financesSnapshot = await db.collection('finances').where('event_id', '==', eventId).get();
  const financeTotal = financesSnapshot.docs.reduce((sum, doc) => {
    const data = doc.data();
    const amount = parseFloat(data.amount) || 0;
    const type = (data.transaction_type || '').toLowerCase();

    if (type === 'expense') {
      return sum - amount;
    }
    return sum + amount;
  }, 0);

  const baseAmount = parseFloat(eventAmount) || 0;
  return (baseAmount + financeTotal).toFixed(2);
};

/**
 * Get all events
 */
const getAllEvents = async (req, res) => {
  try {
    const events = [];

    if (req.session && req.session.isAdmin) {
      const snapshot = await db.collection('events').orderBy('event_name').get();

      const eventPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const totalAmount = await calculateEventTotal(doc.id, data.event_amount);
        return {
          id: doc.id,
          ...data,
          total_amount: totalAmount,
        };
      });

      const eventResults = await Promise.all(eventPromises);
      events.push(...eventResults);
    } else if (req.session && req.session.eventId) {
      const doc = await db.collection('events').doc(req.session.eventId).get();

      if (doc.exists) {
        const data = doc.data();
        const totalAmount = await calculateEventTotal(doc.id, data.event_amount);
        events.push({
          id: doc.id,
          ...data,
          total_amount: totalAmount,
        });
      }
    }

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

/**
 * Get single event by ID
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ensureEventAccess(req, res, id)) {
      return;
    }

    const eventRef = db.collection('events').doc(id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

/**
 * Create new event
 */
const createEvent = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const { event_name, user_name, password, event_amount } = req.body;

    // Validate required fields
    if (!event_name || !user_name || !password) {
      return res.status(400).json({ error: 'Event name, username, and password are required' });
    }

    const eventData = {
      event_name: event_name.trim(),
      user_name: user_name.trim(),
      password: password,
      event_amount: event_amount || '0',
      created_at: new Date().toISOString(),
    };

    const eventRef = await db.collection('events').add(eventData);

    res.json({
      success: true,
      id: eventRef.id,
      ...eventData,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

/**
 * Update event
 */
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ensureAdmin(req, res)) {
      return;
    }

    const { event_name, user_name, password, event_amount } = req.body;

    const eventRef = db.collection('events').doc(id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updateData = {};
    if (event_name) updateData.event_name = event_name.trim();
    if (user_name) updateData.user_name = user_name.trim();
    if (password) updateData.password = password;
    if (event_amount) updateData.event_amount = event_amount;
    updateData.updated_at = new Date().toISOString();

    await eventRef.update(updateData);

    const updatedDoc = await eventRef.get();
    res.json({
      success: true,
      id: id,
      ...updatedDoc.data(),
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

/**
 * Delete event
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ensureAdmin(req, res)) {
      return;
    }

    const eventRef = db.collection('events').doc(id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete associated finances (cascade delete behavior)
    const financesRef = db.collection('finances');
    const financesSnapshot = await financesRef.where('event_id', '==', id).get();

    const batch = db.batch();
    financesSnapshot.forEach((financeDoc) => {
      batch.delete(financeDoc.ref);
    });
    await batch.commit();

    // Delete the event
    await eventRef.delete();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
