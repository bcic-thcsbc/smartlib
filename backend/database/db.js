const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const databasePath =
  process.env.DATABASE_PATH || path.join(__dirname, "..", "database.sqlite");
const db = new sqlite3.Database(databasePath);
db.configure("busyTimeout", 5000);

// SQLite is the production store for the single-server deployment.
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

function run(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    }),
  );
}
function get(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))),
  );
}
function all(sql, params = []) {
  return new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))),
  );
}
function exec(sql) {
  return new Promise((resolve, reject) =>
    db.exec(sql, (err) => (err ? reject(err) : resolve())),
  );
}
function transaction(work) {
  return run("BEGIN IMMEDIATE").then(async () => {
    try {
      const result = await work();
      await run("COMMIT");
      return result;
    } catch (error) {
      try {
        await run("ROLLBACK");
      } catch (_) {
        /* preserve original error */
      }
      throw error;
    }
  });
}
module.exports = { db, databasePath, run, get, all, exec, transaction };
