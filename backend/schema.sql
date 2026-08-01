-- SmartLib SQLite schema-only dump.
-- Source: backend/database.sqlite
-- This file intentionally excludes application data, sessions and sqlite_sequence.

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  isbn TEXT,
  author TEXT,
  publisher TEXT,
  publish_year INTEGER,
  category TEXT,
  description TEXT,
  cover_image TEXT,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT,
  date_of_birth TEXT,
  phone TEXT,
  email TEXT,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
  user_type TEXT CHECK(user_type IN ('student','teacher')),
  class_name TEXT,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE book_copies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  inventory_code TEXT UNIQUE NOT NULL,
  condition TEXT NOT NULL DEFAULT 'Good',
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','reserved','borrowed','lost','damaged','retired')),
  shelf TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE RESTRICT
);

CREATE TABLE circulation_policies (
  user_type TEXT PRIMARY KEY CHECK(user_type IN ('student','teacher')),
  max_active_loans INTEGER NOT NULL,
  loan_days INTEGER NOT NULL,
  max_renewals INTEGER NOT NULL DEFAULT 1,
  renewal_days INTEGER NOT NULL,
  pickup_hours INTEGER NOT NULL DEFAULT 48,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE borrow_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  reserved_copy_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled','expired','fulfilled')),
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decision_at TEXT,
  pickup_deadline TEXT,
  decided_by INTEGER,
  reason TEXT,
  notes TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(book_id) REFERENCES books(id),
  FOREIGN KEY(reserved_copy_id) REFERENCES book_copies(id),
  FOREIGN KEY(decided_by) REFERENCES users(id)
);

CREATE TABLE borrows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  borrow_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  return_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','overdue','partially_returned','returned')),
  created_by INTEGER,
  request_id INTEGER,
  notes TEXT,
  renew_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE TABLE borrow_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  borrow_id INTEGER NOT NULL,
  book_copy_id INTEGER NOT NULL,
  returned_at TEXT,
  condition_out TEXT,
  condition_in TEXT,
  disposition TEXT NOT NULL DEFAULT 'borrowed' CHECK(disposition IN ('borrowed','returned','lost','damaged')),
  notes TEXT,
  FOREIGN KEY(borrow_id) REFERENCES borrows(id) ON DELETE CASCADE,
  FOREIGN KEY(book_copy_id) REFERENCES book_copies(id)
);

CREATE TABLE copy_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_copy_id INTEGER NOT NULL,
  borrow_item_id INTEGER,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('lost','damaged')),
  severity TEXT,
  description TEXT,
  amount INTEGER,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','waived')),
  resolved_at TEXT,
  resolved_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(book_copy_id) REFERENCES book_copies(id),
  FOREIGN KEY(borrow_item_id) REFERENCES borrow_items(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(resolved_by) REFERENCES users(id)
);

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  before_json TEXT,
  after_json TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(actor_id) REFERENCES users(id)
);

CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_copies_inventory ON book_copies(inventory_code);
CREATE INDEX idx_copies_status_book ON book_copies(book_id,status);
CREATE INDEX idx_borrows_user_status ON borrows(user_id,status);
CREATE INDEX idx_borrows_due_status ON borrows(due_date,status);
CREATE INDEX idx_borrow_items_borrow ON borrow_items(borrow_id,disposition);
CREATE INDEX idx_requests_status_date ON borrow_requests(status,requested_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id,read_at,created_at);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
