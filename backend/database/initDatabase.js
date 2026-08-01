const { run, get, all, exec } = require("./db");

async function tableExists(name) {
  return Boolean(
    await get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [
      name,
    ]),
  );
}

async function createFreshSchema() {
  await exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL, gender TEXT, phone TEXT, email TEXT, avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')), user_type TEXT CHECK(user_type IN ('student','teacher')),
      class_name TEXT, department TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE books (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, isbn TEXT, author TEXT, publisher TEXT,
      publish_year INTEGER, category TEXT, description TEXT, cover_image TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
      total_quantity INTEGER NOT NULL DEFAULT 0, available_quantity INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE book_copies (
      id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER NOT NULL, inventory_code TEXT UNIQUE NOT NULL,
      condition TEXT NOT NULL DEFAULT 'Good', status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','reserved','borrowed','lost','damaged','retired')),
      shelf TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE RESTRICT
    );
    CREATE TABLE borrows (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, borrow_date TEXT NOT NULL, due_date TEXT NOT NULL,
      return_date TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','overdue','partially_returned','returned')),
      created_by INTEGER, request_id INTEGER, notes TEXT, renew_count INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(created_by) REFERENCES users(id), FOREIGN KEY(request_id) REFERENCES borrow_requests(id)
    );
    CREATE TABLE borrow_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, borrow_id INTEGER NOT NULL, book_copy_id INTEGER NOT NULL,
      returned_at TEXT, condition_out TEXT, condition_in TEXT, disposition TEXT NOT NULL DEFAULT 'borrowed' CHECK(disposition IN ('borrowed','returned','lost','damaged')),
      notes TEXT, FOREIGN KEY(borrow_id) REFERENCES borrows(id) ON DELETE CASCADE, FOREIGN KEY(book_copy_id) REFERENCES book_copies(id)
    );
  `);
}

async function migrateLegacyCore() {
  // The prototype schema has restrictive CHECK constraints and a globally unique
  // copy id in borrow_details. Rebuild those tables while preserving every row.
  await exec("PRAGMA foreign_keys = OFF");
  await run("ALTER TABLE book_copies RENAME TO book_copies_legacy_v1");
  await run("ALTER TABLE borrows RENAME TO borrows_legacy_v1");
  await run("ALTER TABLE borrow_details RENAME TO borrow_details_legacy_v1");
  await run(`CREATE TABLE book_copies (
    id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER NOT NULL, inventory_code TEXT UNIQUE NOT NULL,
    condition TEXT NOT NULL DEFAULT 'Good', status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','reserved','borrowed','lost','damaged','retired')),
    shelf TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE RESTRICT)`);
  await run(`CREATE TABLE borrows (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, borrow_date TEXT NOT NULL, due_date TEXT NOT NULL,
    return_date TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','overdue','partially_returned','returned')),
    created_by INTEGER, request_id INTEGER, notes TEXT, renew_count INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(created_by) REFERENCES users(id))`);
  await run(`CREATE TABLE borrow_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, borrow_id INTEGER NOT NULL, book_copy_id INTEGER NOT NULL,
    returned_at TEXT, condition_out TEXT, condition_in TEXT, disposition TEXT NOT NULL DEFAULT 'borrowed' CHECK(disposition IN ('borrowed','returned','lost','damaged')),
    notes TEXT, FOREIGN KEY(borrow_id) REFERENCES borrows(id) ON DELETE CASCADE, FOREIGN KEY(book_copy_id) REFERENCES book_copies(id))`);
  await run(`INSERT INTO book_copies (id,book_id,inventory_code,condition,status,shelf,created_at)
    SELECT id,book_id,inventory_code,COALESCE(condition,'Good'),status,shelf,created_at FROM book_copies_legacy_v1`);
  await run(`INSERT INTO borrows (id,user_id,borrow_date,due_date,return_date,status,created_by,created_at)
    SELECT id,user_id,borrow_date,due_date,return_date,
      CASE status WHEN 'borrowing' THEN 'active' WHEN 'late' THEN 'overdue' WHEN 'lost' THEN 'active' ELSE 'returned' END,
      created_by,COALESCE(borrow_date,CURRENT_TIMESTAMP) FROM borrows_legacy_v1`);
  await run(`INSERT INTO borrow_items (id,borrow_id,book_copy_id,returned_at,disposition)
    SELECT bd.id,bd.borrow_id,bd.book_copy_id,
      CASE WHEN br.status='returned' THEN COALESCE(br.return_date,CURRENT_TIMESTAMP) END,
      CASE WHEN br.status='returned' THEN 'returned' ELSE 'borrowed' END
    FROM borrow_details_legacy_v1 bd JOIN borrows_legacy_v1 br ON br.id=bd.borrow_id`);
  await run("DROP TABLE borrow_details_legacy_v1");
  await run("DROP TABLE book_copies_legacy_v1");
  await run("DROP TABLE borrows_legacy_v1");
  if (
    !(await get("SELECT 1 FROM pragma_table_info('books') WHERE name='status'"))
  ) {
    await run(
      "ALTER TABLE books ADD COLUMN status TEXT NOT NULL DEFAULT 'active'",
    );
  }
  if (
    !(await get(
      "SELECT 1 FROM pragma_table_info('borrows') WHERE name='renew_count'",
    ))
  ) {
    await run(
      "ALTER TABLE borrows ADD COLUMN renew_count INTEGER NOT NULL DEFAULT 0",
    );
  }
  await exec("PRAGMA foreign_keys = ON");
}

async function ensureSupplementalSchema() {
  await exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS borrow_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, book_id INTEGER NOT NULL, reserved_copy_id INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled','expired','fulfilled')),
      requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, decision_at TEXT, pickup_deadline TEXT, decided_by INTEGER,
      reason TEXT, notes TEXT, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(book_id) REFERENCES books(id),
      FOREIGN KEY(reserved_copy_id) REFERENCES book_copies(id), FOREIGN KEY(decided_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS circulation_policies (
      user_type TEXT PRIMARY KEY CHECK(user_type IN ('student','teacher')), max_active_loans INTEGER NOT NULL,
      loan_days INTEGER NOT NULL, max_renewals INTEGER NOT NULL DEFAULT 1, renewal_days INTEGER NOT NULL,
      pickup_hours INTEGER NOT NULL DEFAULT 48, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS copy_incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT, book_copy_id INTEGER NOT NULL, borrow_item_id INTEGER,
      user_id INTEGER NOT NULL, type TEXT NOT NULL CHECK(type IN ('lost','damaged')), severity TEXT,
      description TEXT, amount INTEGER, status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','waived')),
      resolved_at TEXT, resolved_by INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(book_copy_id) REFERENCES book_copies(id), FOREIGN KEY(borrow_item_id) REFERENCES borrow_items(id),
      FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(resolved_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL,
      body TEXT NOT NULL, entity_type TEXT, entity_id INTEGER, read_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id INTEGER, action TEXT NOT NULL, entity_type TEXT NOT NULL,
      entity_id INTEGER, before_json TEXT, after_json TEXT, ip_address TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(actor_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY, data TEXT NOT NULL, expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
    CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
    CREATE INDEX IF NOT EXISTS idx_copies_inventory ON book_copies(inventory_code);
    CREATE INDEX IF NOT EXISTS idx_copies_status_book ON book_copies(book_id,status);
    CREATE INDEX IF NOT EXISTS idx_borrows_user_status ON borrows(user_id,status);
    CREATE INDEX IF NOT EXISTS idx_borrows_due_status ON borrows(due_date,status);
    CREATE INDEX IF NOT EXISTS idx_borrow_items_borrow ON borrow_items(borrow_id,disposition);
    CREATE INDEX IF NOT EXISTS idx_requests_status_date ON borrow_requests(status,requested_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id,read_at,created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);
  await run(`INSERT OR IGNORE INTO circulation_policies (user_type,max_active_loans,loan_days,max_renewals,renewal_days,pickup_hours) VALUES
    ('student',2,14,1,7,48),('teacher',5,365,0,14,48)`);
  await run(
    "UPDATE books SET status='active' WHERE status IS NULL OR status='' ",
  );
}

async function columnExists(table, column) {
  const columns = await all(`PRAGMA table_info(${table})`);
  return columns.some((item) => item.name === column);
}

async function ensureProductionSchema() {
  if (!(await columnExists("borrows", "loan_code")))
    await run("ALTER TABLE borrows ADD COLUMN loan_code TEXT");
  if (!(await columnExists("notifications", "dedupe_key")))
    await run("ALTER TABLE notifications ADD COLUMN dedupe_key TEXT");
  if (!(await columnExists("notifications", "email_sent_at")))
    await run("ALTER TABLE notifications ADD COLUMN email_sent_at TEXT");
  await exec(`
    CREATE TABLE IF NOT EXISTS school_settings (
      id INTEGER PRIMARY KEY CHECK(id=1), school_name TEXT NOT NULL DEFAULT 'Trường THCS Bình Chuẩn',
      timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh', contact_email TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT OR IGNORE INTO school_settings(id) VALUES(1);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_borrows_loan_code ON borrows(loan_code) WHERE loan_code IS NOT NULL;
    CREATE TRIGGER IF NOT EXISTS trg_borrows_loan_code AFTER INSERT ON borrows
      WHEN NEW.loan_code IS NULL OR NEW.loan_code=''
      BEGIN UPDATE borrows SET loan_code=printf('PM-%06d', NEW.id) WHERE id=NEW.id; END;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe ON notifications(dedupe_key) WHERE dedupe_key IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_audit_actor_entity ON audit_logs(actor_id,entity_type,created_at);
    CREATE INDEX IF NOT EXISTS idx_incidents_status_user ON copy_incidents(status,user_id,created_at);
  `);
  const unnumbered = await all(
    "SELECT id FROM borrows WHERE loan_code IS NULL OR loan_code='' ORDER BY id",
  );
  for (const loan of unnumbered)
    await run("UPDATE borrows SET loan_code=? WHERE id=?", [
      `PM-${String(loan.id).padStart(6, "0")}`,
      loan.id,
    ]);
}

async function ensureReservationSchema() {
  if (!(await columnExists("borrow_requests", "desired_start_date")))
    await run("ALTER TABLE borrow_requests ADD COLUMN desired_start_date TEXT");
  if (!(await columnExists("borrow_requests", "planned_due_date")))
    await run("ALTER TABLE borrow_requests ADD COLUMN planned_due_date TEXT");
  await exec(`
    CREATE TABLE IF NOT EXISTS reservation_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER NOT NULL UNIQUE, book_id INTEGER NOT NULL,
      provisional_copy_id INTEGER NOT NULL, approved_copy_id INTEGER,
      start_date TEXT NOT NULL, end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','ready_for_pickup','at_risk','checked_out','completed','cancelled','expired')),
      hold_deadline TEXT, priority_position INTEGER NOT NULL, override_reason TEXT, approved_by INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(request_id) REFERENCES borrow_requests(id) ON DELETE CASCADE, FOREIGN KEY(book_id) REFERENCES books(id),
      FOREIGN KEY(provisional_copy_id) REFERENCES book_copies(id), FOREIGN KEY(approved_copy_id) REFERENCES book_copies(id),
      FOREIGN KEY(approved_by) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_reservation_book_window ON reservation_slots(book_id,start_date,end_date,status);
    CREATE INDEX IF NOT EXISTS idx_reservation_copy_window ON reservation_slots(provisional_copy_id,approved_copy_id,start_date,end_date,status);
  `);
}

async function ensureCatalogSchema() {
  if (!(await columnExists("books", "page_count")))
    await run(
      "ALTER TABLE books ADD COLUMN page_count INTEGER NOT NULL DEFAULT 0",
    );
  if (!(await columnExists("school_settings", "inventory_code_prefix")))
    await run(
      "ALTER TABLE school_settings ADD COLUMN inventory_code_prefix TEXT NOT NULL DEFAULT ''",
    );
}

async function ensurePeopleSchema() {
  if (await columnExists("users", "date_of_birth"))
    await run("ALTER TABLE users DROP COLUMN date_of_birth");
  await exec(`
    CREATE TABLE IF NOT EXISTS subject_departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const defaults = [
    "Toán - Tin", "Ngữ văn", "Tiếng Anh", "Khoa học tự nhiên",
    "Lịch sử - Địa lý", "Giáo dục công dân", "Công nghệ",
    "Giáo dục thể chất", "Nghệ thuật",
  ];
  for (const [index, name] of defaults.entries())
    await run("INSERT OR IGNORE INTO subject_departments(name,sort_order) VALUES(?,?)", [name, index]);
}

async function refreshBookSummaries() {
  await run(`UPDATE books
    SET total_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=books.id),
    available_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=books.id AND status='available'),
    updated_at=CURRENT_TIMESTAMP`);
}

async function initDatabase() {
  await exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000",
  );
  await exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );
  const hasUsers = await tableExists("users");
  const v1 = await get("SELECT version FROM schema_migrations WHERE version=1");
  if (!hasUsers) await createFreshSchema();
  else if (!v1) await migrateLegacyCore();
  if (!v1)
    await run("INSERT OR IGNORE INTO schema_migrations(version) VALUES (1)");
  const v2 = await get("SELECT version FROM schema_migrations WHERE version=2");
  if (!v2) {
    await ensureSupplementalSchema();
    await run("INSERT OR IGNORE INTO schema_migrations(version) VALUES (2)");
  } else await ensureSupplementalSchema();
  const v3 = await get("SELECT version FROM schema_migrations WHERE version=3");
  if (!v3) {
    await ensureProductionSchema();
    await run("INSERT OR IGNORE INTO schema_migrations(version) VALUES (3)");
  } else await ensureProductionSchema();
  const v4 = await get("SELECT version FROM schema_migrations WHERE version=4");
  if (!v4) {
    await ensureReservationSchema();
    await run("INSERT OR IGNORE INTO schema_migrations(version) VALUES (4)");
  } else await ensureReservationSchema();
  const v5 = await get("SELECT version FROM schema_migrations WHERE version=5");
  if (!v5) {
    await ensureCatalogSchema();
    await run("INSERT OR IGNORE INTO schema_migrations(version) VALUES (5)");
  } else await ensureCatalogSchema();
  const v6 = await get("SELECT version FROM schema_migrations WHERE version=6");
  if (!v6) {
    await ensurePeopleSchema();
    await run("UPDATE circulation_policies SET loan_days=365,max_renewals=0,pickup_hours=48,updated_at=CURRENT_TIMESTAMP WHERE user_type='teacher'");
    await run("INSERT OR IGNORE INTO schema_migrations(version) VALUES (6)");
  } else await ensurePeopleSchema();
  await refreshBookSummaries();
}

module.exports = initDatabase;
