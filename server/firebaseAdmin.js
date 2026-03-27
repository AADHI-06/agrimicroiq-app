const path = require('path');
const admin = require('firebase-admin');

// Priority 1: Use stringified JSON from environment (Standard for Cloud/Render)
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let credential;
if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    credential = admin.credential.cert(serviceAccount);
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", err.message);
  }
}

// Priority 2: Fallback to file path (Local development)
if (!credential) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebaseServiceAccount.json';
  const resolvedPath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.join(__dirname, serviceAccountPath);

  try {
    const serviceAccount = require(resolvedPath);
    credential = admin.credential.cert(serviceAccount);
  } catch (err) {
    console.error("Failed to load Firebase Service Account from file:", err.message);
  }
}

if (!credential) {
  console.warn("Firebase Admin initialized with default credentials (likely to fail in non-GCP environments).");
}

admin.initializeApp({
  credential: credential || admin.credential.applicationDefault()
});

module.exports = admin;
