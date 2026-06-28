#!/usr/bin/env node

/**
 * Migrates existing Firestore projects to the unified status model.
 *
 * Usage:
 *   npm run migrate:project-statuses
 *   npm run migrate:project-statuses -- --approve-existing
 *   npm run migrate:project-statuses -- --dry-run
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

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

function getServiceAccountKey() {
  if (process.env.FIREBASE_USE_APPLICATION_DEFAULT_CREDENTIALS === 'true') {
    return null;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }

  const candidatePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(process.cwd(), 'firebase-key.json'),
    path.join(process.cwd(), 'serviceAccountKey.json'),
  ].filter(Boolean);

  for (const candidatePath of candidatePaths) {
    if (fs.existsSync(candidatePath)) {
      return JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
    }
  }

  if (
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ) {
    return {
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  console.error('❌ Brak klucza konta serwisowego Firebase.');
  process.exit(1);
}

function normalizeStatus(rawStatus, approveExisting) {
  if (rawStatus === 'approved' || rawStatus === 'rejected' || rawStatus === 'submitted') {
    return rawStatus;
  }

  if (!rawStatus) {
    return approveExisting ? 'approved' : 'submitted';
  }

  if (rawStatus === 'active' || rawStatus === 'voting' || rawStatus === 'completed') {
    return 'approved';
  }

  if (rawStatus === 'rejected' || rawStatus === 'odrzucony') {
    return 'rejected';
  }

  return approveExisting ? 'approved' : 'submitted';
}

async function main() {
  const args = parseCliArgs(process.argv);
  const dryRun = args['dry-run'] === 'true';
  const approveExisting = args['approve-existing'] === 'true';

  const serviceAccount = getServiceAccountKey();
  if (serviceAccount) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    admin.initializeApp();
  }

  const db = admin.firestore();
  const snapshot = await db.collection('projects').get();

  let updated = 0;
  let skipped = 0;

  console.log(`Znaleziono ${snapshot.size} projektów.`);
  console.log(`Tryb: ${dryRun ? 'DRY RUN' : 'ZAPIS'}`);
  console.log(`Brak statusu / legacy → ${approveExisting ? 'approved' : 'submitted'}`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const nextStatus = normalizeStatus(data.status, approveExisting);
    const nextAuthorId = data.authorId || data.createdBy || null;
    const updates = {};

    if (data.status !== nextStatus) {
      updates.status = nextStatus;
    }

    if (!data.authorId && data.createdBy) {
      updates.authorId = data.createdBy;
    }

    if (!data.updatedAt) {
      updates.updatedAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
    }

    if (Object.keys(updates).length === 0) {
      skipped += 1;
      continue;
    }

    console.log(`• ${doc.id}: ${data.status ?? '(brak)'} → ${nextStatus}${nextAuthorId ? '' : ' [brak autora]'}`);

    if (!dryRun) {
      await doc.ref.update(updates);
    }

    updated += 1;
  }

  console.log(`\nZaktualizowano: ${updated}`);
  console.log(`Bez zmian: ${skipped}`);

  if (dryRun) {
    console.log('\nTo był dry-run. Uruchom ponownie bez --dry-run, aby zapisać zmiany.');
  }
}

main().catch((error) => {
  console.error('❌ Migracja nie powiodła się:', error);
  process.exit(1);
});
