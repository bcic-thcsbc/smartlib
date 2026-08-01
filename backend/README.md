# SmartLib API

Run `npm start` after copying `.env.example` to `.env` and setting `SESSION_SECRET`.

The API applies SQLite migrations before serving requests. Back up the live database with `npm run backup`; the command checkpoints WAL, copies the database, and validates it with `PRAGMA integrity_check`.

Database files and diagrams:

- Live database: `backend/database.sqlite` (SQLite WAL sidecars may also exist as `database.sqlite-wal` and `database.sqlite-shm`).
- Schema-only SQL dump: `backend/schema.sql`.
- DBML diagram source: `backend/schema.dbml`.

For the single-server deployment, schedule `npm run backup` daily and retain backups outside the application directory.
