const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const source = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.sqlite');
const targetDir = process.env.BACKUP_DIR || path.join(path.dirname(source), 'backups');
fs.mkdirSync(targetDir, { recursive: true });
const target = path.join(targetDir, `smartlib-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
const db = new sqlite3.Database(source);
db.run('PRAGMA wal_checkpoint(TRUNCATE)', error => {
  if (error) { console.error(error); process.exit(1); }
  fs.copyFileSync(source, target);
  const check = new sqlite3.Database(target);
  check.get('PRAGMA integrity_check', (checkError, row) => {
    check.close(); db.close();
    if (checkError || row.integrity_check !== 'ok') { console.error(checkError || row); process.exit(1); }
    console.log(JSON.stringify({ backup: target, integrity: 'ok' }));
  });
});
