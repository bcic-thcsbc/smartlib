const { run } = require("../database/db");

async function audit() {}

async function notify(
  userId,
  type,
  title,
  body,
  entityType,
  entityId,
  dedupeKey,
) {
  if (!userId) return;
  await run(
    `INSERT OR IGNORE INTO notifications(user_id,type,title,body,entity_type,entity_id,dedupe_key)
    VALUES(?,?,?,?,?,?,?)`,
    [
      userId,
      type,
      title,
      body,
      entityType || null,
      entityId || null,
      dedupeKey || null,
    ],
  );
}

module.exports = { audit, notify };
