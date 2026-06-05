#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Usage:
// Set GOOGLE_APPLICATION_CREDENTIALS env or place serviceAccountKey.json next to this script.
// Example:
//   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node scripts/seed_admin.mjs admin@example.com StrongP@ssw0rd

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(process.cwd(), 'serviceAccountKey.json');
const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@example.com';
const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'ChangeMe123!';

function loadServiceAccount(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (err) {
    console.error('Could not load service account JSON from', p);
    console.error('Provide path via GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json in project root.');
    process.exit(1);
  }
}

const serviceAccount = loadServiceAccount(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function main() {
  try {
    // Create or fetch user
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('User already exists:', userRecord.uid);
    } catch (err) {
      console.log('Creating user', email);
      userRecord = await admin.auth().createUser({
        email,
        password,
        emailVerified: true,
        displayName: 'Admin',
      });
      console.log('Created user:', userRecord.uid);
    }

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin', status: 'approved' });
    console.log('Set custom claims: role=admin,status=approved');

    // Create Firestore profile
    const db = admin.firestore();
    const userDoc = {
      uid: userRecord.uid,
      email,
      displayName: userRecord.displayName || 'Admin',
      role: 'admin',
      status: 'approved',
      approvedBy: 'seed-script',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
    await db.collection('meta').doc('adminBootstrap').set({
      adminExists: true,
      createdBy: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('Seeded users collection with admin profile and bootstrap metadata');

    console.log('Admin seeding complete. You can now sign in with', email);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
}

main();
