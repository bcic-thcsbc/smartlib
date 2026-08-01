const test = require('node:test');
const assert = require('node:assert/strict');
const sqlite3 = require('sqlite3').verbose();

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('./database.sqlite');
    db.all(sql, params, (error, rows) => { db.close(); error ? reject(error) : resolve(rows); });
  });
}

test('production schema contains workflow tables and policies', async () => {
  const tables = await query("SELECT name FROM sqlite_master WHERE type='table'");
  const names = new Set(tables.map(row => row.name));
  for (const table of ['borrow_requests','borrow_items','circulation_policies','copy_incidents','notifications','audit_logs','sessions','schema_migrations']) assert.ok(names.has(table), table);
  const policies = await query('SELECT user_type,max_active_loans,loan_days FROM circulation_policies ORDER BY user_type');
  assert.deepEqual(policies, [{ user_type: 'student', max_active_loans: 2, loan_days: 14 }, { user_type: 'teacher', max_active_loans: 5, loan_days: 365 }]);
  const columns = await query("PRAGMA table_info(users)");
  assert.equal(columns.some((column) => column.name === 'date_of_birth'), false);
});

test('copy status supports reservation and retirement', async () => {
  const sql = (await query("SELECT sql FROM sqlite_master WHERE type='table' AND name='book_copies'"))[0].sql;
  assert.match(sql, /reserved/);
  assert.match(sql, /retired/);
});
