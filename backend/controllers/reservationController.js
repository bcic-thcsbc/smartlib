const { all, get, run, transaction } = require("../database/db");
const { audit, notify } = require("../utils/audit");
const { formatDate, formatDateTime } = require("../utils/presentation");
const bad = (status, message) => Object.assign(new Error(message), { status });
const dateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (date, days) => {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + Number(days));
  return value.toISOString().slice(0, 10);
};
const activeSlotStatuses = [
  "pending",
  "approved",
  "ready_for_pickup",
  "at_risk",
];

async function policyFor(type) {
  return get("SELECT * FROM circulation_policies WHERE user_type=?", [type]);
}

async function refreshBook(bookId) {
  await run(
    "UPDATE books SET total_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=? AND status <> 'retired'),available_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=? AND status='available'),updated_at=CURRENT_TIMESTAMP WHERE id=?",
    [bookId, bookId, bookId],
  );
}

async function closeReservationSlot(requestId, status) {
  const slot = await get("SELECT * FROM reservation_slots WHERE request_id=?", [
    requestId,
  ]);
  if (!slot) return null;

  if (
    ["checked_out", "completed", "cancelled", "expired"].includes(slot.status)
  ) {
    return slot;
  }

  if (slot.status === "ready_for_pickup" && slot.approved_copy_id) {
    await run(
      "UPDATE book_copies SET status='available',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='reserved'",
      [slot.approved_copy_id],
    );
  }

  await run(
    "UPDATE reservation_slots SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    [status, slot.id],
  );
  await refreshBook(slot.book_id);
  return { ...slot, status };
}
async function copyCandidates(bookId, start, end, excludeSlotId) {
  const copies = await all(
    "SELECT * FROM book_copies WHERE book_id=? AND status NOT IN ('lost','damaged','retired','reserved') ORDER BY inventory_code",
    [bookId],
  );
  const candidates = [];
  for (const copy of copies) {
    const loans = await all(
      `SELECT b.borrow_date start_date,COALESCE(bi.returned_at,b.due_date) end_date FROM borrow_items bi JOIN borrows b ON b.id=bi.borrow_id WHERE bi.book_copy_id=? AND bi.disposition='borrowed'`,
      [copy.id],
    );
    const slots = await all(
      `SELECT start_date,end_date FROM reservation_slots WHERE (? IS NULL OR id<>?) AND (provisional_copy_id=? OR approved_copy_id=?) AND status IN (${activeSlotStatuses.map(() => "?").join(",")})`,
      [
        excludeSlotId || null,
        excludeSlotId || null,
        copy.id,
        copy.id,
        ...activeSlotStatuses,
      ],
    );
    const conflicts = [...loans, ...slots].some(
      (item) => item.start_date <= end && item.end_date >= start,
    );
    if (!conflicts) candidates.push(copy);
  }
  return candidates;
}
async function earliestAvailability(bookId, start, end, days = 365) {
  for (let offset = 0; offset <= days; offset++) {
    const candidate = plusDays(start, offset);
    const duration = Math.max(
      1,
      Math.round(
        (new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) /
          86400000,
      ),
    );
    const copies = await copyCandidates(
      bookId,
      candidate,
      plusDays(candidate, duration),
    );
    if (copies.length) return candidate;
  }
  return null;
}
async function reservationWindow(user, start, end) {
  if (!dateOnly(start) || start < today() || !dateOnly(end) || end <= start)
    throw bad(400, "Khoảng ngày mượn và trả không hợp lệ.");
  const policy = await policyFor(user.user_type);
  if (!policy) throw bad(400, "Chưa có chính sách mượn cho tài khoản này.");
  if (end > plusDays(start, policy.loan_days))
    throw bad(
      400,
      `Ngày trả không được vượt quá ${policy.loan_days} ngày kể từ ngày mượn.`,
    );
  return policy;
}
async function availability(req, res) {
  const bookId = Number(req.params.id);
  const start = String(req.query.start_date || "");
  const end = String(req.query.desired_due_date || "");
  const user = await get("SELECT * FROM users WHERE id=? AND status='active'", [
    req.session.user.id,
  ]);
  if (!user) throw bad(403, "Tài khoản không hoạt động.");
  await reservationWindow(user, start, end);
  const book = await get(
    "SELECT id,title FROM books WHERE id=? AND status='active'",
    [bookId],
  );
  if (!book) throw bad(404, "Không tìm thấy tựa sách.");
  const candidates = await copyCandidates(bookId, start, end);
  const next = candidates.length
    ? start
    : await earliestAvailability(bookId, start, end);
  res.json({
    book_id: bookId,
    start_date: start,
    desired_due_date: end,
    available: candidates.length > 0,
    available_copy_count: candidates.length,
    next_available_date: next,
    max_due_date: plusDays(start, (await policyFor(user.user_type)).loan_days),
  });
}
async function createRequest(req, res) {
  const bookId = Number(req.body.book_id);
  const start = String(req.body.desired_start_date || "");
  const end = String(req.body.desired_due_date || "");
  const user = await get("SELECT * FROM users WHERE id=? AND status='active'", [
    req.session.user.id,
  ]);
  if (!user) throw bad(403, "Tài khoản không hoạt động.");
  await reservationWindow(user, start, end);
  const result = await transaction(async () => {
    const duplicate = await get(
      "SELECT id FROM borrow_requests WHERE user_id=? AND book_id=? AND status IN ('pending','approved')",
      [user.id, bookId],
    );
    if (duplicate)
      throw bad(409, "Bạn đã có yêu cầu đang xử lý cho tựa sách này.");
    const candidates = await copyCandidates(bookId, start, end);
    if (!candidates.length) {
      const next = await earliestAvailability(bookId, start, end);
      throw bad(
        409,
        `Không có quyển phù hợp. Ngày gần nhất có thể phục vụ: ${next ? formatDate(next) : "chưa xác định"}.`,
      );
    }
    const priority = (
      await get(
        "SELECT COALESCE(MAX(priority_position),0)+1 value FROM reservation_slots WHERE book_id=?",
        [bookId],
      )
    ).value;
    const request = await run(
      "INSERT INTO borrow_requests(user_id,book_id,status,notes,desired_start_date,planned_due_date) VALUES(?,?,'pending',?,?,?)",
      [user.id, bookId, req.body.notes || null, start, end],
    );
    const slot = await run(
      "INSERT INTO reservation_slots(request_id,book_id,provisional_copy_id,start_date,end_date,priority_position) VALUES(?,?,?,?,?,?)",
      [request.id, bookId, candidates[0].id, start, end, priority],
    );
    await audit(
      user.id,
      "reservation_create",
      "reservation_slot",
      slot.id,
      null,
      {
        request_id: request.id,
        book_id: bookId,
        start_date: start,
        end_date: end,
      },
      req,
    );
    return get("SELECT * FROM borrow_requests WHERE id=?", [request.id]);
  });
  res.status(201).json(result);
}
async function approve(req, res) {
  const result = await transaction(async () => {
    const slot = await get(
      `SELECT s.*,r.user_id,r.status request_status,u.user_type FROM reservation_slots s JOIN borrow_requests r ON r.id=s.request_id JOIN users u ON u.id=r.user_id WHERE r.id=?`,
      [req.params.id],
    );
    if (!slot) throw bad(404, "Không tìm thấy reservation.");
    if (slot.status !== "pending" || slot.request_status !== "pending")
      throw bad(409, "Reservation đã được xử lý.");
    const end = slot.end_date;
    await reservationWindow(
      { user_type: slot.user_type },
      slot.start_date,
      end,
    );
    const candidates = await copyCandidates(
      slot.book_id,
      slot.start_date,
      end,
      slot.id,
    );
    const copy = candidates[0];
    if (!copy) throw bad(409, "Không còn quyển phù hợp trong khoảng đặt mượn.");
    await run(
      "UPDATE reservation_slots SET approved_copy_id=?,status='approved',approved_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      [copy.id, req.session.user.id, slot.id],
    );
    await run(
      "UPDATE borrow_requests SET status='approved',reserved_copy_id=?,decision_at=CURRENT_TIMESTAMP,decided_by=? WHERE id=?",
      [copy.id, req.session.user.id, slot.request_id],
    );
    await notify(
      slot.user_id,
      "reservation_approved",
      "Đặt mượn đã được duyệt",
      `Thư viện đã tự chọn quyển ${copy.inventory_code} cho lịch mượn từ ${formatDate(slot.start_date)} đến ${formatDate(end)}.`,
      "borrow_request",
      slot.request_id,
    );
    return get("SELECT * FROM reservation_slots WHERE id=?", [slot.id]);
  });
  res.json(result);
}
async function advance() {
  const readyReservationsQuery = [
    "SELECT s.*, r.user_id, bc.status copy_status, u.user_type",
    "FROM reservation_slots s",
    "JOIN borrow_requests r ON r.id = s.request_id",
    "JOIN book_copies bc ON bc.id = s.approved_copy_id",
    "JOIN users u ON u.id = r.user_id",
    "WHERE s.status = 'approved' AND s.start_date <= date('now')",
  ].join(" ");
  const rows = await all(readyReservationsQuery);
  for (const slot of rows) {
    if (slot.copy_status === "available") {
      const policy = await policyFor(slot.user_type);
      const deadline = new Date(
        Date.now() + Number(policy.pickup_hours) * 3600000,
      )
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      const becameReady = await transaction(async () => {
        const lockedCopy = await run(
          "UPDATE book_copies SET status='reserved',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='available'",
          [slot.approved_copy_id],
        );
        if (!lockedCopy.changes) return false;
        const updatedSlot = await run(
          "UPDATE reservation_slots SET status='ready_for_pickup',hold_deadline=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='approved'",
          [deadline, slot.id],
        );
        if (!updatedSlot.changes) {
          await run(
            "UPDATE book_copies SET status='available',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='reserved'",
            [slot.approved_copy_id],
          );
          return false;
        }
        await run(
          "UPDATE borrow_requests SET pickup_deadline=? WHERE id=? AND status='approved'",
          [deadline, slot.request_id],
        );
        await refreshBook(slot.book_id);
        return true;
      });
      if (!becameReady) continue;
      await notify(
        slot.user_id,
        "reservation_ready",
        "Sách đã sẵn sàng để nhận",
        `Bạn có thể nhận sách trước ${formatDateTime(deadline)}.`,
        "borrow_request",
        slot.request_id,
      );
    } else {
      const updated = await run(
        "UPDATE reservation_slots SET status='at_risk',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='approved'",
        [slot.id],
      );
      if (!updated.changes) continue;
      await notify(
        slot.user_id,
        "reservation_at_risk",
        "Lịch mượn đang bị chậm",
        "Bản sách trước chưa được trả. Thư viện sẽ cập nhật thời điểm nhận sách.",
        "borrow_request",
        slot.request_id,
      );
    }
  }
}
async function list(req, res) {
  await advance();
  const reservationsQuery = [
    "SELECT s.*, r.status request_status, r.notes, u.full_name, u.username, b.title,",
    "pc.inventory_code provisional_code, ac.inventory_code approved_code",
    "FROM reservation_slots s",
    "JOIN borrow_requests r ON r.id = s.request_id",
    "JOIN users u ON u.id = r.user_id",
    "JOIN books b ON b.id = s.book_id",
    "JOIN book_copies pc ON pc.id = s.provisional_copy_id",
    "LEFT JOIN book_copies ac ON ac.id = s.approved_copy_id",
    "ORDER BY s.start_date, s.priority_position",
  ].join(" ");
  const rows = await all(reservationsQuery);
  res.json({ data: rows });
}
async function checkout(req, res) {
  await advance();
  const result = await transaction(async () => {
    const checkoutSlotQuery = [
      "SELECT s.*, r.user_id, bc.condition",
      "FROM reservation_slots s",
      "JOIN borrow_requests r ON r.id = s.request_id",
      "JOIN book_copies bc ON bc.id = s.approved_copy_id",
      "WHERE r.id = ?",
    ].join(" ");
    const slot = await get(checkoutSlotQuery, [req.params.id]);
    if (!slot) throw bad(404, "Không tìm thấy reservation.");
    if (
      slot.status !== "ready_for_pickup" ||
      slot.hold_deadline <
        new Date().toISOString().slice(0, 19).replace("T", " ")
    )
      throw bad(409, "Reservation chưa sẵn sàng hoặc đã hết hạn nhận sách.");
    const copy = await get(
      "SELECT * FROM book_copies WHERE id=? AND status='reserved'",
      [slot.approved_copy_id],
    );
    if (!copy) throw bad(409, "Book Copy không còn ở trạng thái chờ giao.");
    const loan = await run(
      "INSERT INTO borrows(user_id,borrow_date,due_date,status,created_by,request_id) VALUES(?,?,?,'active',?,?)",
      [
        slot.user_id,
        today(),
        slot.end_date,
        req.session.user.id,
        slot.request_id,
      ],
    );
    await run(
      "INSERT INTO borrow_items(borrow_id,book_copy_id,condition_out) VALUES(?,?,?)",
      [loan.id, copy.id, copy.condition],
    );
    await run(
      "UPDATE book_copies SET status='borrowed',updated_at=CURRENT_TIMESTAMP WHERE id=?",
      [copy.id],
    );
    await run(
      "UPDATE reservation_slots SET status='checked_out',updated_at=CURRENT_TIMESTAMP WHERE id=?",
      [slot.id],
    );
    await run(
      "UPDATE borrow_requests SET status='fulfilled',decision_at=CURRENT_TIMESTAMP WHERE id=?",
      [slot.request_id],
    );
    await run(
      "UPDATE books SET available_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=? AND status='available') WHERE id=?",
      [slot.book_id, slot.book_id],
    );
    return get("SELECT * FROM borrows WHERE id=?", [loan.id]);
  });
  res.status(201).json(result);
}
module.exports = {
  availability,
  createRequest,
  approve,
  list,
  advance,
  checkout,
  closeReservationSlot,
};
