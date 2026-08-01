const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, "..", "database.sqlite");
const backupDir = process.env.BACKUP_DIR || path.join(path.dirname(databasePath), "backups");
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, (error) => error ? reject(error) : resolve()));
}
function get(db, sql, params = []) {
  return new Promise((resolve, reject) => db.get(sql, params, (error, row) => error ? reject(error) : resolve(row)));
}

async function backup() {
  fs.mkdirSync(backupDir, { recursive: true });
  const target = path.join(backupDir, `smartlib-pre-catalog-reset-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`);
  const db = new sqlite3.Database(databasePath);
  await run(db, "PRAGMA wal_checkpoint(TRUNCATE)");
  db.close();
  fs.copyFileSync(databasePath, target);
  const check = new sqlite3.Database(target);
  const result = await get(check, "PRAGMA integrity_check");
  check.close();
  if (result.integrity_check !== "ok") throw new Error("Backup database integrity check failed.");
  return target;
}

async function removeManagedCovers() {
  const covers = path.resolve(uploadDir, "covers");
  if (!fs.existsSync(covers)) return 0;
  let removed = 0;
  for (const entry of await fs.promises.readdir(covers, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const target = path.resolve(covers, entry.name);
    if (!target.startsWith(`${covers}${path.sep}`)) throw new Error("Invalid cover path.");
    await fs.promises.unlink(target);
    removed += 1;
  }
  return removed;
}

async function main() {
  if (!fs.existsSync(databasePath)) throw new Error(`Database not found: ${databasePath}`);
  const backupPath = await backup();
  const db = new sqlite3.Database(databasePath);
  try {
    const before = await get(db, "SELECT COUNT(*) count FROM users");
    await run(db, "PRAGMA foreign_keys=ON");
    await run(db, "BEGIN IMMEDIATE");
    for (const table of ["reservation_slots", "copy_incidents", "borrow_items", "borrows", "borrow_requests", "book_copies", "books"])
      await run(db, `DELETE FROM ${table}`);
    await run(db, "DELETE FROM notifications WHERE entity_type IN ('book','book_copy','borrow','borrow_item','borrow_request','reservation','copy_incident')");
    await run(db, "DELETE FROM audit_logs WHERE entity_type IN ('book','book_copy','borrow','borrow_item','borrow_request','reservation','copy_incident')");
    await run(db, "DELETE FROM sqlite_sequence WHERE name IN ('books','book_copies','borrow_requests','reservation_slots','borrows','borrow_items','copy_incidents')");
    const after = await get(db, "SELECT COUNT(*) count FROM users");
    if (before.count !== after.count) throw new Error("User count changed during catalog reset.");
    await run(db, "COMMIT");
    const coversRemoved = await removeManagedCovers();
    console.log(JSON.stringify({ backup: backupPath, users: after.count, coversRemoved, message: "Catalog data removed." }));
  } catch (error) {
    try { await run(db, "ROLLBACK"); } catch (_) { /* no active transaction */ }
    throw error;
  } finally { db.close(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
