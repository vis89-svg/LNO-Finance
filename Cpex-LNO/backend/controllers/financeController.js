const { db } = require('../config/firebase');

const normalizeIncomingDate = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
    const [day, month, year] = dateValue.split('-');
    return `${year}-${month}-${day}`;
  }

  return null;
};

const ensureEventReadAccess = async (req, res, eventId) => {
  let eventRef = db.collection('events').doc(eventId);
  let eventDoc = await eventRef.get();

  if (!eventDoc.exists) {
    const eventsSnapshot = await db.collection('events').where('event_name', '==', eventId).limit(1).get();
    if (!eventsSnapshot.empty) {
      eventDoc = eventsSnapshot.docs[0];
      eventRef = eventDoc.ref;
    }
  }

  if (!eventDoc.exists) {
    res.status(404).json({ error: 'Event not found' });
    return null;
  }

  const resolvedEventId = eventDoc.id;
  if (!req.session.isAdmin && req.session.eventId !== resolvedEventId) {
    res.status(403).json({ error: 'Access denied' });
    return null;
  }

  return eventDoc;
};

const ensureFinanceAccess = async (req, res, financeId, requireAdmin = false) => {
  const financeRef = db.collection('finances').doc(financeId);
  const financeDoc = await financeRef.get();

  if (!financeDoc.exists) {
    res.status(404).json({ error: 'Finance record not found' });
    return null;
  }

  const financeData = financeDoc.data();

  if (requireAdmin && !req.session.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }

  if (!req.session.isAdmin && req.session.eventId !== financeData.event_id) {
    res.status(403).json({ error: 'Access denied' });
    return null;
  }

  return { financeRef, financeDoc, financeData };
};

/**
 * Get all finances for an event
 */
const getFinancesByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventDoc = await ensureEventReadAccess(req, res, eventId);
    if (!eventDoc) {
      return;
    }

    const financesRef = db.collection('finances');
    const snapshot = await financesRef
      .where('event_id', '==', eventDoc.id)
      .get();

    const finances = [];
    snapshot.forEach((doc) => {
      finances.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    finances.sort((left, right) => String(right.date_event || '').localeCompare(String(left.date_event || '')));

    res.json(finances);
  } catch (error) {
    console.error('Error fetching finances:', error);
    res.status(500).json({ error: 'Failed to fetch finances' });
  }
};

/**
 * Get single finance record by ID
 */
const getFinanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const financeRecord = await ensureFinanceAccess(req, res, id);
    if (!financeRecord) {
      return;
    }

    res.json({
      id: financeRecord.financeDoc.id,
      ...financeRecord.financeData,
    });
  } catch (error) {
    console.error('Error fetching finance:', error);
    res.status(500).json({ error: 'Failed to fetch finance record' });
  }
};

/**
 * Add finance record to an event
 */
const addFinance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { from_person, to_person, description, amount, date_event, mode, transaction_type } = req.body;

    // Validate required fields
    if (!from_person || !to_person || !amount || !date_event || !mode || !transaction_type) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const eventDoc = await ensureEventReadAccess(req, res, eventId);
    if (!eventDoc) {
      return;
    }

    // Parse amount to ensure it's a number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }

    const normalizedDate = normalizeIncomingDate(date_event);
    if (!normalizedDate) {
      return res.status(400).json({ error: 'Date must be in DD-MM-YYYY format' });
    }

    const financeData = {
      event_id: eventDoc.id,
      from_person: from_person.trim(),
      to_person: to_person.trim(),
      description: description ? description.trim() : '',
      amount: parsedAmount,
      date_event: normalizedDate,
      mode: mode.trim(),
      transaction_type: transaction_type.trim(),
      created_at: new Date().toISOString(),
    };

    const financeRef = await db.collection('finances').add(financeData);

    res.json({
      success: true,
      id: financeRef.id,
      ...financeData,
    });
  } catch (error) {
    console.error('Error adding finance:', error);
    res.status(500).json({ error: 'Failed to add finance record' });
  }
};

/**
 * Update finance record
 */
const updateFinance = async (req, res) => {
  try {
    const { id } = req.params;
    const { from_person, to_person, description, amount, date_event, mode } = req.body;
    const financeRecord = await ensureFinanceAccess(req, res, id, true);
    if (!financeRecord) {
      return;
    }

    const updateData = {};
    if (from_person) updateData.from_person = from_person.trim();
    if (to_person) updateData.to_person = to_person.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (amount) {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount)) {
        updateData.amount = parsedAmount;
      }
    }
    if (date_event) {
      const normalizedDate = normalizeIncomingDate(date_event);
      if (normalizedDate) {
        updateData.date_event = normalizedDate;
      }
    }
    if (mode) updateData.mode = mode.trim();
    updateData.updated_at = new Date().toISOString();

    await financeRecord.financeRef.update(updateData);

    const updatedDoc = await financeRecord.financeRef.get();
    res.json({
      success: true,
      id: id,
      ...updatedDoc.data(),
    });
  } catch (error) {
    console.error('Error updating finance:', error);
    res.status(500).json({ error: 'Failed to update finance record' });
  }
};

/**
 * Delete finance record
 */
const deleteFinance = async (req, res) => {
  try {
    const { id } = req.params;
    const financeRecord = await ensureFinanceAccess(req, res, id, true);
    if (!financeRecord) {
      return;
    }

    await financeRecord.financeRef.delete();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting finance:', error);
    res.status(500).json({ error: 'Failed to delete finance record' });
  }
};

module.exports = {
  getFinancesByEventId,
  getFinanceById,
  addFinance,
  updateFinance,
  deleteFinance,
};
