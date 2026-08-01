const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const databasePath = path.join(
  os.tmpdir(),
  `smartlib-reservation-${process.pid}-${Date.now()}.sqlite`,
);
process.env.DATABASE_PATH = databasePath;

const initDatabase = require("../database/initDatabase");
const { db, get, run } = require("../database/db");
const borrow = require("../controllers/borrowController");
const reservations = require("../controllers/reservationController");

const date = (offset) => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
};

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}

async function requestFor(userId, bookId, start, end) {
  const res = response();
  await reservations.createRequest(
    {
      body: {
        book_id: bookId,
        desired_start_date: start,
        desired_due_date: end,
      },
      session: { user: { id: userId, role: "user" } },
    },
    res,
  );
  return res.body;
}

async function approve(requestId, adminId) {
  const res = response();
  await reservations.approve(
    {
      params: { id: requestId },
      session: { user: { id: adminId, role: "admin" } },
    },
    res,
  );
  return res.body;
}

test("reservation lifecycle releases capacity on cancel, reject, return, and expiry", async (t) => {
  t.after(async () => {
    await new Promise((resolve) => db.close(resolve));
    fs.rmSync(databasePath, { force: true });
    fs.rmSync(`${databasePath}-wal`, { force: true });
    fs.rmSync(`${databasePath}-shm`, { force: true });
  });

  await initDatabase();
  const admin = await run(
    "INSERT INTO users(username,password_hash,full_name,role,status) VALUES('admin','hash','Admin','admin','active')",
  );
  const student = await run(
    "INSERT INTO users(username,password_hash,full_name,role,user_type,class_name,status) VALUES('student','hash','Student','user','student','9A1','active')",
  );
  const secondStudent = await run(
    "INSERT INTO users(username,password_hash,full_name,role,user_type,class_name,status) VALUES('student-two','hash','Student Two','user','student','9A2','active')",
  );
  const book = await run(
    "INSERT INTO books(title,total_quantity,available_quantity) VALUES('Test Book',1,1)",
  );
  const copy = await run(
    "INSERT INTO book_copies(book_id,inventory_code,status) VALUES(?,?, 'available')",
    [book.id, "TEST-1"],
  );

  const tomorrow = date(1);
  const futureDue = date(8);
  const cancelled = await requestFor(student.id, book.id, tomorrow, futureDue);
  await approve(cancelled.id, admin.id);

  const cancelResponse = response();
  await borrow.cancelRequest(
    {
      params: { id: cancelled.id },
      session: { user: { id: student.id, role: "user" } },
    },
    cancelResponse,
  );
  assert.equal(cancelResponse.body.status, "cancelled");
  assert.equal(
    (
      await get("SELECT status FROM reservation_slots WHERE request_id=?", [
        cancelled.id,
      ])
    ).status,
    "cancelled",
  );
  assert.equal(
    (await get("SELECT status FROM book_copies WHERE id=?", [copy.id])).status,
    "available",
  );

  const rejected = await requestFor(
    secondStudent.id,
    book.id,
    tomorrow,
    futureDue,
  );
  const rejectResponse = response();
  await borrow.rejectRequest(
    {
      params: { id: rejected.id },
      body: { reason: "Không thể phục vụ lịch này." },
      session: { user: { id: admin.id, role: "admin" } },
    },
    rejectResponse,
  );
  assert.equal(rejectResponse.body.status, "rejected");
  assert.equal(
    (
      await get("SELECT status FROM reservation_slots WHERE request_id=?", [
        rejected.id,
      ])
    ).status,
    "cancelled",
  );

  const todayRequest = await requestFor(student.id, book.id, date(0), date(7));
  await approve(todayRequest.id, admin.id);
  await reservations.advance();
  assert.equal(
    (
      await get("SELECT status FROM reservation_slots WHERE request_id=?", [
        todayRequest.id,
      ])
    ).status,
    "ready_for_pickup",
  );
  assert.equal(
    (await get("SELECT status FROM book_copies WHERE id=?", [copy.id])).status,
    "reserved",
  );

  const checkoutResponse = response();
  await reservations.checkout(
    {
      params: { id: todayRequest.id },
      session: { user: { id: admin.id, role: "admin" } },
    },
    checkoutResponse,
  );
  const item = await get("SELECT id FROM borrow_items WHERE borrow_id=?", [
    checkoutResponse.body.id,
  ]);
  const returnResponse = response();
  await borrow.returnItem(
    {
      params: { id: checkoutResponse.body.id, itemId: item.id },
      body: {},
      session: { user: { id: admin.id, role: "admin" } },
    },
    returnResponse,
  );
  assert.equal(
    (
      await get("SELECT status FROM reservation_slots WHERE request_id=?", [
        todayRequest.id,
      ])
    ).status,
    "completed",
  );
  assert.equal(
    (await get("SELECT status FROM book_copies WHERE id=?", [copy.id])).status,
    "available",
  );

  const expiring = await requestFor(
    secondStudent.id,
    book.id,
    date(0),
    date(7),
  );
  await approve(expiring.id, admin.id);
  await reservations.advance();
  await run(
    "UPDATE borrow_requests SET pickup_deadline='2000-01-01 00:00:00' WHERE id=?",
    [expiring.id],
  );
  await borrow.expireRequests();
  assert.equal(
    (await get("SELECT status FROM borrow_requests WHERE id=?", [expiring.id]))
      .status,
    "expired",
  );
  assert.equal(
    (
      await get("SELECT status FROM reservation_slots WHERE request_id=?", [
        expiring.id,
      ])
    ).status,
    "expired",
  );
  assert.equal(
    (await get("SELECT status FROM book_copies WHERE id=?", [copy.id])).status,
    "available",
  );
});
