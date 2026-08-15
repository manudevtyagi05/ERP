/**
 * migrateProjectRoles.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time, safe, idempotent migration that converts legacy ProjectMember
 * records (with the old `projectRole` string field) to the new `projectRoles`
 * array field.
 *
 * IMPORTANT DESIGN DECISIONS:
 *
 *   OWNER  → ['PROJECT_LEAD']   — was the highest-authority role
 *   MANAGER→ ['PROJECT_LEAD']   — was managerial authority
 *   VIEWER → ['VIEWER']         — same semantics
 *   MEMBER → ['VIEWER']         — SAFE DEFAULT. We CANNOT assume MEMBER = DEVELOPER.
 *                                  Admins/leads must manually re-assign correct roles.
 *
 * Safety guarantees:
 *   - Only processes records where projectRoles is empty or undefined.
 *   - Never overwrites existing projectRoles data.
 *   - Does not delete any documents.
 *   - Does not drop any collections.
 *   - Logs every change before making it.
 *   - Fully idempotent — safe to run multiple times.
 *
 * Usage:
 *   node src/scripts/migrateProjectRoles.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const LEGACY_ROLE_MAP = {
  OWNER: 'PROJECT_LEAD',
  MANAGER: 'PROJECT_LEAD',
  VIEWER: 'VIEWER',
  MEMBER: 'VIEWER', // intentionally conservative — see note above
};

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[migrate] ERROR: MONGODB_URI is not set. Aborting.');
    process.exit(1);
  }

  console.log('[migrate] Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('[migrate] Connected.');

  // Use raw collection access so we can read the old `projectRole` field
  // regardless of what the current Mongoose schema says.
  const col = mongoose.connection.collection('projectmembers');

  // Find records that need migration:
  //   - projectRoles field does not exist, OR
  //   - projectRoles is an empty array
  const toMigrate = await col
    .find({
      $or: [
        { projectRoles: { $exists: false } },
        { projectRoles: { $size: 0 } },
      ],
    })
    .toArray();

  console.log(`[migrate] Found ${toMigrate.length} ProjectMember record(s) to migrate.`);

  let migrated = 0;
  let skipped = 0;

  for (const doc of toMigrate) {
    const oldRole = doc.projectRole; // read the legacy field
    const newRole = LEGACY_ROLE_MAP[oldRole] || 'VIEWER'; // default to VIEWER if unknown

    console.log(
      `[migrate]   ${doc._id} | old projectRole="${oldRole}" → new projectRoles=["${newRole}"]`
    );

    const result = await col.updateOne(
      {
        _id: doc._id,
        // Extra guard: only update if projectRoles is still empty (idempotency)
        $or: [{ projectRoles: { $exists: false } }, { projectRoles: { $size: 0 } }],
      },
      {
        $set: { projectRoles: [newRole] },
      }
    );

    if (result.modifiedCount === 1) {
      migrated++;
    } else {
      skipped++;
      console.log(`[migrate]   ↳ Skipped (already migrated or concurrent update)`);
    }
  }

  console.log(`[migrate] Done. Migrated: ${migrated}, Skipped: ${skipped}.`);

  if (migrated > 0) {
    console.log('[migrate] ⚠  IMPORTANT: The MEMBER role was mapped to VIEWER (safe default).');
    console.log('[migrate]    Please review members that were MEMBER and assign correct roles');
    console.log('[migrate]    (DEVELOPER, QA, DEVOPS, PR_REVIEWER) via the project members UI.');
  }

  await mongoose.disconnect();
  console.log('[migrate] Disconnected. Migration complete.');
}

migrate().catch((err) => {
  console.error('[migrate] Fatal error:', err);
  process.exit(1);
});
