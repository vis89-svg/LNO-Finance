/**
 * Data Migration Script: SQLite to Firestore
 *
 * This script migrates data from the Django SQLite database to Firebase Firestore.
 *
 * Usage:
 *   npm run migrate
 *   or
 *   node scripts/migrate-data.js
 *
 * Prerequisites:
 * 1. Place your firebase-service-account.json in backend/config/
 * 2. Ensure db.sqlite3 exists in moveproject/ directory
 * 3. Run: npm install in the backend directory
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Import Firebase config
const { db } = require('../backend/config/firebase');

// Database paths
const SQLITE_DB_PATH = path.join(__dirname, '../moveproject/db.sqlite3');
const FIREBASE_SERVICE_ACCOUNT = path.join(__dirname, '../backend/config/firebase-service-account.json');

// Check if SQLite database exists
if (!fs.existsSync(SQLITE_DB_PATH)) {
  console.error('Error: SQLite database not found at:', SQLITE_DB_PATH);
  console.error('Please ensure db.sqlite3 exists in the moveproject directory.');
  process.exit(1);
}

// Check if Firebase service account exists
if (!fs.existsSync(FIREBASE_SERVICE_ACCOUNT)) {
  console.error('Error: Firebase service account not found at:', FIREBASE_SERVICE_ACCOUNT);
  console.error('Please download the service account JSON from Firebase Console and place it in backend/config/');
  process.exit(1);
}

// Open SQLite connection
const sqliteDb = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY);

// Promisified SQLite functions
const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Migration functions
async function migrateEvents() {
  console.log('\n📦 Migrating Events...');

  const events = await allAsync('SELECT * FROM myapp_event');
  console.log(`   Found ${events.length} events in SQLite`);

  let successCount = 0;
  let errorCount = 0;

  for (const event of events) {
    try {
      const eventData = {
        event_name: event.event_name,
        user_name: event.user_name,
        password: event.password, // Keep as-is for backward compatibility
        event_amount: event.event_amount || '0',
        migrated_from_sqlite: true,
        migrated_at: new Date().toISOString(),
      };

      // Check if event already exists (by event_name + user_name)
      const existingRef = db.collection('events')
        .where('event_name', '==', eventData.event_name)
        .where('user_name', '==', eventData.user_name);

      const existingSnapshot = await existingRef.get();

      if (existingSnapshot.empty) {
        await db.collection('events').add(eventData);
        console.log(`   ✓ Migrated event: ${event.event_name}`);
        successCount++;
      } else {
        console.log(`   ⚠ Skipped (already exists): ${event.event_name}`);
        successCount++;
      }
    } catch (error) {
      console.error(`   ✗ Error migrating event ${event.event_name}:`, error.message);
      errorCount++;
    }
  }

  console.log(`   Events migration complete: ${successCount} succeeded, ${errorCount} failed`);
  return { success: successCount, errors: errorCount };
}

async function migrateFinances() {
  console.log('\n💰 Migrating Finances...');

  const finances = await allAsync('SELECT * FROM myapp_finance');
  console.log(`   Found ${finances.length} finance records in SQLite`);

  // First, get all events to map event_id to Firestore document IDs
  const eventsSnapshot = await db.collection('events').get();
  const eventMap = new Map();

  eventsSnapshot.forEach((doc) => {
    const data = doc.data();
    // Map by event_name + user_name combination
    const key = `${data.event_name}|${data.user_name}`;
    eventMap.set(key, doc.id);
  });

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const finance of finances) {
    try {
      // Find the corresponding event in Firestore
      const eventsRef = db.collection('events')
        .where('event_name', '==', finance.event_id)
        .limit(1);

      // Note: In SQLite, event_id is the integer ID, but we need to match by name
      const event = await allAsync(
        'SELECT event_name, user_name FROM myapp_event WHERE id = ?',
        [finance.event_id]
      );

      if (!event || event.length === 0) {
        console.log(`   ⚠ Skipped finance (event not found): ${finance.description}`);
        skippedCount++;
        continue;
      }

      const eventKey = `${event[0].event_name}|${event[0].user_name}`;
      const firestoreEventId = eventMap.get(eventKey);

      if (!firestoreEventId) {
        console.log(`   ⚠ Skipped finance (Firestore event not found): ${finance.description}`);
        skippedCount++;
        continue;
      }

      const financeData = {
        event_id: firestoreEventId,
        from_person: finance.from_person,
        to_person: finance.to_person,
        description: finance.description,
        amount: parseFloat(finance.amount) || 0,
        date_event: finance.date_event,
        mode: finance.mode,
        migrated_from_sqlite: true,
        migrated_at: new Date().toISOString(),
      };

      await db.collection('finances').add(financeData);
      console.log(`   ✓ Migrated finance: ${finance.description}`);
      successCount++;
    } catch (error) {
      console.error(`   ✗ Error migrating finance ${finance.description}:`, error.message);
      errorCount++;
    }
  }

  console.log(`   Finances migration complete: ${successCount} succeeded, ${errorCount} failed, ${skippedCount} skipped`);
  return { success: successCount, errors: errorCount, skipped: skippedCount };
}

async function verifyMigration() {
  console.log('\n🔍 Verifying Migration...');

  const eventsCount = await db.collection('events').count().get();
  const financesCount = await db.collection('finances').count().get();

  console.log(`   Firestore Events: ${eventsCount.data().count}`);
  console.log(`   Firestore Finances: ${financesCount.data().count}`);

  return {
    events: eventsCount.data().count,
    finances: financesCount.data().count,
  };
}

// Main migration function
async function runMigration() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         Django SQLite to Firestore Migration              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  console.log(`\n📂 SQLite Database: ${SQLITE_DB_PATH}`);
  console.log(`📂 Firebase Config: ${FIREBASE_SERVICE_ACCOUNT}`);

  try {
    const eventsResult = await migrateEvents();
    const financesResult = await migrateFinances();
    const verification = await verifyMigration();

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                  Migration Summary                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`\n   Events:    ${eventsResult.success} migrated, ${eventsResult.errors} errors`);
    console.log(`   Finances:  ${financesResult.success} migrated, ${financesResult.errors} errors, ${financesResult.skipped} skipped`);
    console.log(`\n   Firestore totals:`);
    console.log(`     - Events:   ${verification.events}`);
    console.log(`     - Finances: ${verification.finances}`);
    console.log('\n✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    sqliteDb.close();
  }
}

// Run migration
runMigration();
