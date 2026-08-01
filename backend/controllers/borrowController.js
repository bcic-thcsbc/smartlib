const { all, get, run, transaction } = require("../database/db");
const { audit, notify } = require("../utils/audit");
const { advance, closeReservationSlot } = require("./reservationController");
const { formatDate } = require("../utils/presentation");

const bad = (status, message) => Object.assign(new Error(message), { status });
const dateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (date, days) => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + Number(days));
  return d.toISOString().slice(0, 10);
};
const plusHours = (hours) => {
  const d = new Date(Date.now() + Number(hours) * 3600000);
  return d.toISOString().slice(0, 19).replace("T", " ");
};
const page = (req) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const p = Math.max(Number(req.query.page) || 1, 1);
  return { limit, offset: (p - 1) * limit, page: p };
};

async function refreshBook(bookId) {
  await run(
    `UPDATE books SET total_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=? AND status <> 'retired'),
    available_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=? AND status='available'), updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    [bookId, bookId, bookId],
  );
}

async function expireRequests() {
  const expired = await all(
    `SELECT id,reserved_copy_id,user_id,book_id FROM borrow_requests WHERE status='approved' AND pickup_deadline < datetime('now')`,
  );
  if (!expired.length) return;
  await transaction(async () => {
    for (const request of expired) {
      await run(
        "UPDATE borrow_requests SET status='expired',decision_at=CURRENT_TIMESTAMP WHERE id=? AND status='approved'",
        [request.id],
      );
      const closedSlot = await closeReservationSlot(request.id, "expired");
      if (!closedSlot && request.reserved_copy_id) {
        const copy = await get(
          "SELECT book_id FROM book_copies WHERE id=? AND status='reserved'",
          [request.reserved_copy_id],
        );
        if (copy) {
          await run(
            "UPDATE book_copies SET status='available',updated_at=CURRENT_TIMESTAMP WHERE id=?",
            [request.reserved_copy_id],
          );
          await refreshBook(copy.book_id);
        }
      }
      await notify(
        request.user_id,
        "request_expired",
        "Yêu cầu mượn đã hết hạn",
        "Yêu cầu của bạn đã hết thời gian nhận sách.",
        "borrow_request",
        request.id,
      );
    }
  });
}

async function policyFor(userType) {
  return (
    (await get("SELECT * FROM circulation_policies WHERE user_type=?", [
      userType,
    ])) ||
    get("SELECT * FROM circulation_policies WHERE user_type=?", ["student"])
  );
}

async function openIncident(userId) {
  return Boolean(
    await get(
      "SELECT id FROM copy_incidents WHERE user_id=? AND status='open'",
      [userId],
    ),
  );
}

async function activeItemCount(userId) {
  const row = await get(
    "SELECT COUNT(*) count FROM borrow_items bi JOIN borrows b ON b.id=bi.borrow_id WHERE b.user_id=? AND bi.disposition='borrowed'",
    [userId],
  );
  return row.count;
}

async function enrichBorrow(row) {
  if (!row) return row;
  row.items = await all(
    `SELECT bi.id item_id,bi.book_copy_id,bi.disposition,bi.returned_at,bi.condition_out,bi.condition_in,bi.notes,
    bc.inventory_code,bc.status copy_status,bo.id book_id,bo.title,bo.author
    FROM borrow_items bi JOIN book_copies bc ON bc.id=bi.book_copy_id JOIN books bo ON bo.id=bc.book_id WHERE bi.borrow_id=? ORDER BY bi.id`,
    [row.id],
  );
  row.books = row.items
    .map((item) => `${item.title} · ${item.inventory_code}`)
    .join(", ");
  row.returned_count = row.items.filter(
    (item) => item.disposition !== "borrowed",
  ).length;
  return row;
}

async function list(req, res) {
  await expireRequests();
  await run(
    "UPDATE borrows SET status='overdue',updated_at=CURRENT_TIMESTAMP WHERE status IN ('active','partially_returned') AND due_date < date('now') AND EXISTS (SELECT 1 FROM borrow_items WHERE borrow_id=borrows.id AND disposition='borrowed')",
  );
  const { limit, offset, page: currentPage } = page(req);
  const admin = req.session.user.role === "admin";
  const params = [];
  const where = [];
  if (!admin) {
    where.push("b.user_id=?");
    params.push(req.session.user.id);
  }
  if (admin && req.query.user_id) {
    where.push("b.user_id=?");
    params.push(Number(req.query.user_id));
  }
  if (req.query.status) {
    where.push("b.status=?");
    params.push(req.query.status);
  }
  if (req.query.q) {
    where.push(
      "(u.full_name LIKE ? OR u.username LIKE ? OR EXISTS (SELECT 1 FROM borrow_items x JOIN book_copies y ON y.id=x.book_copy_id JOIN books z ON z.id=y.book_id WHERE x.borrow_id=b.id AND (z.title LIKE ? OR y.inventory_code LIKE ?)))",
    );
    const q = `%${String(req.query.q).trim()}%`;
    params.push(q, q, q, q);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const count = await get(
    `SELECT COUNT(*) count FROM borrows b JOIN users u ON u.id=b.user_id ${clause}`,
    params,
  );
  const rows = await all(
    `SELECT b.*,u.full_name,u.username,u.user_type,u.class_name,u.department FROM borrows b JOIN users u ON u.id=b.user_id ${clause} ORDER BY b.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  for (const row of rows) await enrichBorrow(row);
  res.json({
    data: rows,
    pagination: {
      page: currentPage,
      limit,
      total: count.count,
      pages: Math.ceil(count.count / limit),
    },
  });
}

async function detail(req, res) {
  const admin = req.session.user.role === "admin";
  const params = [Number(req.params.id)];
  const access = admin ? "" : " AND b.user_id=?";
  if (!admin) params.push(req.session.user.id);

  const row = await get(
    `SELECT b.*,u.full_name,u.username,u.user_type,u.class_name,u.department
     FROM borrows b JOIN users u ON u.id=b.user_id
     WHERE b.id=?${access}`,
    params,
  );
  if (!row) throw bad(404, "Không tìm thấy phiếu mượn.");

  res.json(await enrichBorrow(row));
}

async function validateCheckout(userId, copyIds, dueDate) {
  const user = await get("SELECT * FROM users WHERE id=? AND status='active'", [
    userId,
  ]);
  if (!user) throw bad(400, "Người mượn không tồn tại hoặc đã bị khóa.");
  if (
    !Array.isArray(copyIds) ||
    !copyIds.length ||
    copyIds.some((id) => !Number.isInteger(Number(id)))
  )
    throw bad(400, "Cần chọn ít nhất một bản sách.");
  if (!dateOnly(dueDate) || dueDate < today())
    throw bad(400, "Ngày hạn trả không hợp lệ.");
  const policy = await policyFor(user.user_type);
  if (await openIncident(userId))
    throw bad(409, "Tài khoản còn sự cố sách chưa xử lý.");
  const active = await activeItemCount(userId);
  if (active + copyIds.length > policy.max_active_loans)
    throw bad(
      409,
      `Người dùng chỉ được mượn tối đa ${policy.max_active_loans} bản sách.`,
    );
  const placeholders = copyIds.map(() => "?").join(",");
  const copies = await all(
    `SELECT * FROM book_copies WHERE id IN (${placeholders}) AND status='available'`,
    copyIds,
  );
  if (copies.length !== copyIds.length)
    throw bad(409, "Một hoặc nhiều bản sách không còn sẵn sàng.");
  return { user, copies };
}

async function create(req, res) {
  const { user_id, copy_ids, due_date } = req.body;
  const result = await transaction(async () => {
    const { user, copies } = await validateCheckout(
      Number(user_id),
      copy_ids.map(Number),
      due_date,
    );
    const loan = await run(
      "INSERT INTO borrows(user_id,borrow_date,due_date,status,created_by) VALUES(?,?,? ,'active',?)",
      [user.id, today(), due_date, req.session.user.id],
    );
    await run("UPDATE borrows SET loan_code=? WHERE id=?", [
      `PM-${String(loan.id).padStart(6, "0")}`,
      loan.id,
    ]);
    for (const copy of copies) {
      await run(
        "INSERT INTO borrow_items(borrow_id,book_copy_id,condition_out) VALUES(?,?,?)",
        [loan.id, copy.id, copy.condition],
      );
      await run(
        "UPDATE book_copies SET status='borrowed',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='available'",
        [copy.id],
      );
      await refreshBook(copy.book_id);
    }
    const after = await get("SELECT * FROM borrows WHERE id=?", [loan.id]);
    await audit(
      req.session.user.id,
      "checkout",
      "borrow",
      loan.id,
      null,
      after,
      req,
    );
    await notify(
      user.id,
      "borrow_created",
      "Đã ghi nhận mượn sách",
      `Bạn đã mượn ${copies.length} bản sách. Hạn trả: ${formatDate(due_date)}.`,
      "borrow",
      loan.id,
    );
    return after;
  });
  res.status(201).json(result);
}

async function requestList(req, res) {
  await advance();
  await expireRequests();
  const { limit, offset, page: currentPage } = page(req);
  const params = [];
  const where = [];
  if (req.session.user.role !== "admin") {
    where.push("r.user_id=?");
    params.push(req.session.user.id);
  }
  if (req.query.status) {
    where.push("r.status=?");
    params.push(req.query.status);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const count = await get(
    `SELECT COUNT(*) count FROM borrow_requests r ${clause}`,
    params,
  );
  const requestQuery = [
    "SELECT r.*, u.full_name, u.username, b.title, bc.inventory_code, rs.status reservation_status, rs.hold_deadline",
    "FROM borrow_requests r",
    "JOIN users u ON u.id = r.user_id",
    "JOIN books b ON b.id = r.book_id",
    "LEFT JOIN book_copies bc ON bc.id = r.reserved_copy_id",
    "LEFT JOIN reservation_slots rs ON rs.request_id = r.id",
    clause,
    "ORDER BY r.id DESC LIMIT ? OFFSET ?",
  ].join(" ");
  const rows = await all(requestQuery, [...params, limit, offset]);
  res.json({
    data: rows,
    pagination: {
      page: currentPage,
      limit,
      total: count.count,
      pages: Math.ceil(count.count / limit),
    },
  });
}

async function createRequest(req, res) {
  const bookId = Number(req.body.book_id);
  const userId = req.session.user.id;
  const result = await transaction(async () => {
    const user = await get(
      "SELECT * FROM users WHERE id=? AND status='active'",
      [userId],
    );
    const book = await get(
      "SELECT * FROM books WHERE id=? AND status='active'",
      [bookId],
    );
    if (!user || !book)
      throw bad(404, "Đầu sách hoặc tài khoản không tồn tại.");
    if (await openIncident(userId))
      throw bad(409, "Tài khoản còn sự cố sách chưa xử lý.");
    const duplicate = await get(
      "SELECT id FROM borrow_requests WHERE user_id=? AND book_id=? AND status IN ('pending','approved')",
      [userId, bookId],
    );
    if (duplicate)
      throw bad(409, "Bạn đã có yêu cầu đang xử lý cho đầu sách này.");
    const active = await activeItemCount(userId);
    const policy = await policyFor(user.user_type);
    if (active >= policy.max_active_loans)
      throw bad(409, "Bạn đã đạt giới hạn mượn sách.");
    const r = await run(
      "INSERT INTO borrow_requests(user_id,book_id,notes) VALUES(?,?,?)",
      [userId, bookId, req.body.notes || null],
    );
    await audit(
      userId,
      "request_create",
      "borrow_request",
      r.id,
      null,
      { id: r.id, book_id: bookId },
      req,
    );
    await notify(
      userId,
      "request_created",
      "Đã gửi yêu cầu mượn",
      `Yêu cầu mượn “${book.title}” đang chờ thủ thư duyệt.`,
      "borrow_request",
      r.id,
    );
    return get("SELECT * FROM borrow_requests WHERE id=?", [r.id]);
  });
  res.status(201).json(result);
}

async function approveRequest(req, res) {
  const result = await transaction(async () => {
    const r = await get(
      "SELECT r.*,u.user_type,u.status user_status,b.title FROM borrow_requests r JOIN users u ON u.id=r.user_id JOIN books b ON b.id=r.book_id WHERE r.id=?",
      [req.params.id],
    );
    if (!r) throw bad(404, "Không tìm thấy yêu cầu.");
    if (r.status !== "pending") throw bad(409, "Yêu cầu đã được xử lý.");
    if (r.user_status !== "active")
      throw bad(409, "Tài khoản người dùng đã bị khóa.");
    const copy = await get(
      "SELECT * FROM book_copies WHERE book_id=? AND status='available' ORDER BY id LIMIT 1",
      [r.book_id],
    );
    if (!copy) throw bad(409, "Đầu sách hiện không còn bản sẵn sàng.");
    const policy = await policyFor(r.user_type);
    const deadline = plusHours(policy.pickup_hours);
    await run(
      "UPDATE borrow_requests SET status='approved',reserved_copy_id=?,decision_at=CURRENT_TIMESTAMP,pickup_deadline=?,decided_by=? WHERE id=? AND status='pending'",
      [copy.id, deadline, req.session.user.id, r.id],
    );
    await run(
      "UPDATE book_copies SET status='reserved',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='available'",
      [copy.id],
    );
    await refreshBook(copy.book_id);
    await audit(
      req.session.user.id,
      "request_approve",
      "borrow_request",
      r.id,
      null,
      { status: "approved", reserved_copy_id: copy.id },
      req,
    );
    await notify(
      r.user_id,
      "request_approved",
      "Yêu cầu đã được duyệt",
      `Bạn có thể nhận “${r.title}” trước ${deadline}.`,
      "borrow_request",
      r.id,
    );
    return get("SELECT * FROM borrow_requests WHERE id=?", [r.id]);
  });
  res.json(result);
}

async function rejectRequest(req, res) {
  const result = await transaction(async () => {
    const r = await get("SELECT * FROM borrow_requests WHERE id=?", [
      req.params.id,
    ]);
    if (!r) throw bad(404, "Không tìm thấy yêu cầu.");
    if (!["pending", "approved"].includes(r.status))
      throw bad(409, "Yêu cầu đã kết thúc.");
    const closedSlot = await closeReservationSlot(r.id, "cancelled");
    if (!closedSlot && r.reserved_copy_id) {
      await run(
        "UPDATE book_copies SET status='available',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='reserved'",
        [r.reserved_copy_id],
      );
      await refreshBook(r.book_id);
    }
    await run(
      "UPDATE borrow_requests SET status='rejected',reason=?,decision_at=CURRENT_TIMESTAMP,decided_by=? WHERE id=?",
      [req.body.reason || "Từ chối bởi thủ thư", req.session.user.id, r.id],
    );
    await audit(
      req.session.user.id,
      "request_reject",
      "borrow_request",
      r.id,
      r,
      { status: "rejected" },
      req,
    );
    await notify(
      r.user_id,
      "request_rejected",
      "Yêu cầu bị từ chối",
      req.body.reason || "Thủ thư đã từ chối yêu cầu của bạn.",
      "borrow_request",
      r.id,
    );
    return get("SELECT * FROM borrow_requests WHERE id=?", [r.id]);
  });
  res.json(result);
}

async function cancelRequest(req, res) {
  const result = await transaction(async () => {
    const r = await get("SELECT * FROM borrow_requests WHERE id=?", [
      req.params.id,
    ]);
    if (!r) throw bad(404, "Không tìm thấy yêu cầu.");
    if (r.user_id !== req.session.user.id && req.session.user.role !== "admin")
      throw bad(403, "Bạn không có quyền hủy yêu cầu này.");
    if (!["pending", "approved"].includes(r.status))
      throw bad(409, "Yêu cầu đã kết thúc.");
    const closedSlot = await closeReservationSlot(r.id, "cancelled");
    if (!closedSlot && r.reserved_copy_id) {
      await run(
        "UPDATE book_copies SET status='available',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='reserved'",
        [r.reserved_copy_id],
      );
      await refreshBook(r.book_id);
    }
    await run(
      "UPDATE borrow_requests SET status='cancelled',decision_at=CURRENT_TIMESTAMP,decided_by=? WHERE id=?",
      [req.session.user.role === "admin" ? req.session.user.id : null, r.id],
    );
    await audit(
      req.session.user.id,
      "request_cancel",
      "borrow_request",
      r.id,
      r,
      { status: "cancelled" },
      req,
    );
    return get("SELECT * FROM borrow_requests WHERE id=?", [r.id]);
  });
  res.json(result);
}

async function checkoutRequest(req, res) {
  const result = await transaction(async () => {
    const r = await get(
      "SELECT r.*,bc.condition,bc.book_id,bc.status copy_status,u.user_type,u.status user_status FROM borrow_requests r JOIN book_copies bc ON bc.id=r.reserved_copy_id JOIN users u ON u.id=r.user_id WHERE r.id=?",
      [req.params.id],
    );
    if (!r)
      throw bad(404, "Không tìm thấy yêu cầu hoặc bản sách đã bị giải phóng.");
    if (r.status !== "approved" || r.copy_status !== "reserved")
      throw bad(409, "Yêu cầu chưa sẵn sàng để giao sách.");
    if (
      r.pickup_deadline &&
      r.pickup_deadline <
        new Date().toISOString().slice(0, 19).replace("T", " ")
    )
      throw bad(409, "Yêu cầu đã hết hạn nhận sách.");
    if (r.user_status !== "active")
      throw bad(409, "Tài khoản người dùng đã bị khóa.");
    const due =
      req.body.due_date ||
      plusDays(today(), (await policyFor(r.user_type)).loan_days);
    if (!dateOnly(due) || due < today())
      throw bad(400, "Ngày hạn trả không hợp lệ.");
    if (await openIncident(r.user_id))
      throw bad(409, "Tài khoản còn sự cố sách chưa xử lý.");
    const policy = await policyFor(r.user_type);
    if ((await activeItemCount(r.user_id)) >= policy.max_active_loans)
      throw bad(409, "Người dùng đã đạt giới hạn mượn sách.");
    const loan = await run(
      "INSERT INTO borrows(user_id,borrow_date,due_date,status,created_by,request_id) VALUES(?,?,?,'active',?,?)",
      [r.user_id, today(), due, req.session.user.id, r.id],
    );
    await run(
      "INSERT INTO borrow_items(borrow_id,book_copy_id,condition_out) VALUES(?,?,?)",
      [loan.id, r.reserved_copy_id, r.condition],
    );
    await run(
      "UPDATE book_copies SET status='borrowed',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='reserved'",
      [r.reserved_copy_id],
    );
    await run(
      "UPDATE borrow_requests SET status='fulfilled',decision_at=CURRENT_TIMESTAMP WHERE id=?",
      [r.id],
    );
    await refreshBook(r.book_id);
    await audit(
      req.session.user.id,
      "request_checkout",
      "borrow",
      loan.id,
      null,
      { request_id: r.id },
      req,
    );
    await notify(
      r.user_id,
      "borrow_created",
      "Đã giao sách",
      `Bạn đã nhận sách. Hạn trả: ${formatDate(due)}.`,
      "borrow",
      loan.id,
    );
    return get("SELECT * FROM borrows WHERE id=?", [loan.id]);
  });
  res.status(201).json(result);
}

async function updateItem(req, res, type) {
  const result = await transaction(async () => {
    const item = await get(
      `SELECT bi.*,b.user_id,b.status loan_status,b.due_date,bc.book_id,bc.condition current_condition FROM borrow_items bi JOIN borrows b ON b.id=bi.borrow_id JOIN book_copies bc ON bc.id=bi.book_copy_id WHERE bi.id=? AND bi.borrow_id=?`,
      [req.params.itemId, req.params.id],
    );
    if (!item) throw bad(404, "Không tìm thấy bản sách trong phiếu.");
    if (item.disposition !== "borrowed")
      throw bad(409, "Bản sách đã được xử lý.");
    const now = today();
    if (type === "return") {
      await run(
        "UPDATE borrow_items SET disposition='returned',returned_at=?,condition_in=?,notes=? WHERE id=?",
        [
          now,
          req.body.condition || item.current_condition,
          req.body.notes || null,
          item.id,
        ],
      );
      await run(
        "UPDATE book_copies SET status=?,condition=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        [
          req.body.condition === "Damaged" ? "damaged" : "available",
          req.body.condition || item.current_condition,
          item.book_copy_id,
        ],
      );
      if (req.body.condition === "Damaged")
        await run(
          "INSERT INTO copy_incidents(book_copy_id,borrow_item_id,user_id,type,severity,description) VALUES(?,?,?,?,?,?)",
          [
            item.book_copy_id,
            item.id,
            item.user_id,
            "damaged",
            req.body.severity || "medium",
            req.body.notes || "Sách bị hỏng khi trả",
          ],
        );
    } else {
      await run(
        "UPDATE borrow_items SET disposition=?,returned_at=?,notes=? WHERE id=?",
        [type, now, req.body.notes || null, item.id],
      );
      await run(
        "UPDATE book_copies SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        [type, item.book_copy_id],
      );
      await run(
        "INSERT INTO copy_incidents(book_copy_id,borrow_item_id,user_id,type,severity,description,amount) VALUES(?,?,?,?,?,?,?)",
        [
          item.book_copy_id,
          item.id,
          item.user_id,
          type,
          req.body.severity || "high",
          req.body.notes || null,
          req.body.amount || null,
        ],
      );
    }
    const pending = await get(
      "SELECT COUNT(*) count FROM borrow_items WHERE borrow_id=? AND disposition='borrowed'",
      [item.borrow_id],
    );
    const newStatus = pending.count
      ? item.due_date < today()
        ? "overdue"
        : "partially_returned"
      : "returned";
    await run(
      "UPDATE borrows SET status=?,return_date=CASE WHEN ?='returned' THEN COALESCE(return_date,?) ELSE return_date END,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      [newStatus, newStatus, now, item.borrow_id],
    );
    if (newStatus === "returned") {
      await run(
        "UPDATE reservation_slots SET status='completed',updated_at=CURRENT_TIMESTAMP WHERE request_id=(SELECT request_id FROM borrows WHERE id=?) AND status='checked_out'",
        [item.borrow_id],
      );
    }
    await refreshBook(item.book_id);
    const after = await get("SELECT * FROM borrow_items WHERE id=?", [item.id]);
    await audit(
      req.session.user.id,
      `item_${type}`,
      "borrow_item",
      item.id,
      item,
      after,
      req,
    );
    await notify(
      item.user_id,
      type === "return" ? "book_returned" : "book_incident",
      type === "return" ? "Đã ghi nhận trả sách" : "Cần xử lý sự cố sách",
      type === "return"
        ? "Thư viện đã ghi nhận bản sách được trả."
        : "Một bản sách trong phiếu của bạn được ghi nhận mất/hỏng.",
      "borrow",
      item.borrow_id,
    );
    return after;
  });
  res.json(result);
}

async function renew(req, res) {
  const result = await transaction(async () => {
    const loan = await get(
      "SELECT b.*,u.user_type,u.status user_status FROM borrows b JOIN users u ON u.id=b.user_id WHERE b.id=?",
      [req.params.id],
    );
    if (!loan) throw bad(404, "Không tìm thấy phiếu mượn.");
    if (
      loan.user_id !== req.session.user.id &&
      req.session.user.role !== "admin"
    )
      throw bad(403, "Bạn không có quyền gia hạn phiếu này.");
    if (
      !["active", "partially_returned"].includes(loan.status) ||
      loan.due_date < today()
    )
      throw bad(409, "Phiếu quá hạn hoặc không còn được gia hạn.");
    if (await openIncident(loan.user_id))
      throw bad(409, "Tài khoản còn sự cố chưa xử lý.");
    const policy = await policyFor(loan.user_type);
    if (loan.renew_count >= policy.max_renewals)
      throw bad(409, "Phiếu đã hết số lần gia hạn.");
    const pending = await get(
      "SELECT id FROM borrow_requests WHERE book_id IN (SELECT bc.book_id FROM borrow_items bi JOIN book_copies bc ON bc.id=bi.book_copy_id WHERE bi.borrow_id=? AND bi.disposition='borrowed') AND status='pending'",
      [loan.id],
    );
    if (pending) throw bad(409, "Đầu sách đang có người chờ mượn.");
    const due = plusDays(loan.due_date, policy.renewal_days);
    await run(
      "UPDATE borrows SET due_date=?,renew_count=renew_count+1,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      [due, loan.id],
    );
    await audit(
      req.session.user.id,
      "renew",
      "borrow",
      loan.id,
      loan,
      { ...loan, due_date: due },
      req,
    );
    return get("SELECT * FROM borrows WHERE id=?", [loan.id]);
  });
  res.json(result);
}

async function returnBorrow(req, res) {
  const items = await all(
    "SELECT id FROM borrow_items WHERE borrow_id=? AND disposition='borrowed'",
    [req.params.id],
  );
  if (!items.length)
    return res.status(409).json({ message: "Phiếu đã được xử lý." });
  for (const item of items)
    await updateItem(
      {
        ...req,
        params: { ...req.params, itemId: item.id },
        body: req.body || {},
      },
      { json: () => {}, status: () => ({ json: () => {} }) },
    );
  res.json({ message: "Đã ghi nhận trả sách." });
}

module.exports = {
  list,
  detail,
  create,
  requestList,
  createRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
  checkoutRequest,
  returnBorrow,
  returnItem: (req, res) => {
    req.body = req.body || {};
    return updateItem(req, res, "return");
  },
  markLost: (req, res) => {
    req.body = req.body || {};
    return updateItem(req, res, "lost");
  },
  markDamaged: (req, res) => {
    req.body = req.body || {};
    return updateItem(req, res, "damaged");
  },
  renew,
  expireRequests,
};
