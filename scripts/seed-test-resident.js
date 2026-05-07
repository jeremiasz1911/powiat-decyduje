#!/usr/bin/env node

/**
 * Seed script to add test resident account data to Firebase
 * Usage: npm run seed:test-resident
 * 
 * Creates/updates a test user with a resident account linked to phone number and PESEL
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');
dotenv.config({ path: envPath });

function parseCliArgs(argv) {
  return argv.slice(2).reduce((result, entry) => {
    if (!entry.startsWith('--')) {
      return result;
    }

    const [key, rawValue = 'true'] = entry.slice(2).split('=');
    result[key] = rawValue;
    return result;
  }, {});
}

// Firebase Admin SDK credentials - from environment, file path, or json file
const getServiceAccountKey = () => {
  if (process.env.FIREBASE_USE_APPLICATION_DEFAULT_CREDENTIALS === 'true') {
    return null;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      console.error('❌ Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON');
      process.exit(1);
    }
  }

  const cliArgs = parseCliArgs(process.argv);
  const candidatePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    cliArgs['service-account-path'],
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(process.cwd(), 'firebase-key.json'),
    path.join(process.cwd(), 'serviceAccountKey.json'),
    path.join(process.cwd(), 'firebase-service-account.json'),
  ].filter(Boolean);

  for (const candidatePath of candidatePaths) {
    if (!fs.existsSync(candidatePath)) {
      continue;
    }

    try {
      return JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
    } catch (error) {
      console.error(`❌ Nie mogę odczytać pliku klucza: ${candidatePath}`);
      console.error('   Plik musi być poprawnym JSON-em z Firebase Service Account.');
      process.exit(1);
    }
  }

  console.error('❌ Firebase service account key not found.');
  console.error('   Użyj jednego z wariantów:');
  console.error('   - FIREBASE_SERVICE_ACCOUNT_KEY="{...json...}"');
  console.error('   - FIREBASE_SERVICE_ACCOUNT_PATH=/sciezka/do/klucza.json');
  console.error('   - GOOGLE_APPLICATION_CREDENTIALS=/sciezka/do/klucza.json');
  console.error('   - albo ustaw FIREBASE_USE_APPLICATION_DEFAULT_CREDENTIALS=true po wcześniejszym `gcloud auth application-default login`');
  console.error('   - firebase-key.json w katalogu głównym projektu');
  console.error('   Pobierz go w Firebase Console → Project Settings → Service Accounts → Generate Key');
  process.exit(1);
};

const testData = {
  testEmail: 'test@powiat.local',
  testPassword: 'TestPassword123!',
  phoneNumber: '+48510490044',
  pesel: '02021234567', // Valid PESEL format (11 digits)
  firstName: 'Test',
  lastName: 'User',
  village: 'Mława',
  street: 'Testowa 1',
};

async function seedTestResident() {
  try {
    // Initialize Firebase Admin
    const serviceAccount = getServiceAccountKey();
    const useApplicationDefaultCredentials = process.env.FIREBASE_USE_APPLICATION_DEFAULT_CREDENTIALS === 'true';
    const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount?.project_id;

    if (!projectId) {
      console.error('❌ Nie udało się ustalić projectId.');
      console.error('   Ustaw EXPO_PUBLIC_FIREBASE_PROJECT_ID albo użyj klucza z polem project_id.');
      process.exit(1);
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: useApplicationDefaultCredentials
          ? admin.credential.applicationDefault()
          : admin.credential.cert(serviceAccount),
        projectId,
      });
    }

    const auth = admin.auth();
    const db = admin.firestore();

    console.log('🔧 Seeding test resident account...\n');
    console.log(`📧 Email: ${testData.testEmail}`);
    console.log(`📱 Phone: ${testData.phoneNumber}`);
    console.log(`🆔 PESEL: ${testData.pesel}`);
    console.log('');

    // Step 1: Create or get test user
    let uid;
    let isNewUser = false;

    try {
      const existingUser = await auth.getUserByEmail(testData.testEmail);
      uid = existingUser.uid;
      console.log(`✅ Found existing user: ${uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        const newUser = await auth.createUser({
          email: testData.testEmail,
          password: testData.testPassword,
          displayName: `${testData.firstName} ${testData.lastName}`,
        });
        uid = newUser.uid;
        isNewUser = true;
        console.log(`✅ Created new user: ${uid}`);
      } else {
        throw error;
      }
    }

    // Step 2: Create or update user profile
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};

    // Build resident account entry
    const newResidentAccount = {
      id: testData.pesel,
      pesel: testData.pesel,
      phoneNumber: testData.phoneNumber,
      label: `${testData.firstName} ${testData.lastName}`,
      phoneVerified: true, // Mark as verified for testing
    };

    // Merge with existing accounts
    const existingAccounts = Array.isArray(userData.residentAccounts)
      ? userData.residentAccounts
      : [];

    // Remove duplicate if exists
    const filteredAccounts = existingAccounts.filter(
      (acc) => acc.pesel !== testData.pesel || acc.phoneNumber !== testData.phoneNumber
    );

    const updatedAccounts = [...filteredAccounts, newResidentAccount];

    // Create or update user document (create if missing)
    await userRef.set({
      fullName: `${testData.firstName} ${testData.lastName}`,
      email: testData.testEmail,
      phoneNumber: testData.phoneNumber,
      phone: testData.phoneNumber,
      pesel: testData.pesel,
      village: testData.village,
      street: testData.street,
      commune: 'Mlawa',
      residentStatus: 'verified_resident',
      residentAccounts: updatedAccounts,
      phoneVerified: true,
      updatedAt: new Date(),
    }, { merge: true });

    console.log(`✅ Updated user profile with resident account`);

    // Step 3: Create phone index for faster lookups
    const phoneIndexRef = db.collection('_phoneIndex').doc(testData.phoneNumber);
    await phoneIndexRef.set(
      {
        accountCount: 1,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    console.log(`✅ Updated phone index\n`);

    // Step 4: Display login credentials
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Test resident account created successfully!\n');
    console.log('📲 Login options:');
    console.log(`   1. Phone: ${testData.phoneNumber}`);
    console.log(`      (Will send SMS code)\n`);
    console.log(`   2. Email: ${testData.testEmail}`);
    console.log(`      Password: ${testData.testPassword}\n`);
    console.log('📝 Resident Info:');
    console.log(`   Name: ${testData.firstName} ${testData.lastName}`);
    console.log(`   PESEL: ${testData.pesel}`);
    console.log(`   Village: ${testData.village}`);
    console.log(`   Status: verified_resident`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('ℹ️  Note: SMS verification is mocked in emulator.');
    console.log('   Use any SMS code (e.g., 000000) to verify.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test resident:', error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  }
}

// Confirm before running
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  '⚠️  This will create/update a test user in Firestore. Continue? (y/N): ',
  async (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'y') {
      await seedTestResident();
    } else {
      console.log('Cancelled.');
      process.exit(0);
    }
  }
);
