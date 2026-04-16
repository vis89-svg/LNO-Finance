const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const resolveServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const fallbackPath = path.join(__dirname, 'firebase-service-account.json');
  const serviceAccountPath = configuredPath || fallbackPath;

  if (fs.existsSync(serviceAccountPath)) {
    return JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  }

  return null;
};

if (!admin.apps.length) {
  const serviceAccount = resolveServiceAccount();

  if (!serviceAccount) {
    throw new Error(
      'Firebase credentials not configured. Set FIREBASE_SERVICE_ACCOUNT, FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_PATH.'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
db.settings({
  ignoreUndefinedProperties: true,
});

module.exports = { admin, db };
