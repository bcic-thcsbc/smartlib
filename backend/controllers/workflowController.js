const { all, get, run, transaction } = require("../database/db");
const { audit, notify } = require("../utils/audit");

const fail = (status, message) => Object.assign(new Error(message), { status });
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

async function refreshBook(bookId) {
  await run(
    `UPDATE books SET total_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=? AND status<>'retired'),
    available_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=? AND status='available'),updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    [bookId, bookId, bookId],
  );
}

async function approveWithCopy(req, res) {
  const result = await transaction(async () => {
    const request = await get(
      `SELECT r.*,u.status user_status,u.user_type,b.title FROM borrow_requests r
      JOIN users u ON u.id=r.user_id JOIN books b ON b.id=r.book_id WHERE r.id=?`,
      [req.params.id],
    );
    if (!request) throw fail(404, "Không tìm thấy yêu cầu mượn.");
    if (request.status !== "pending") throw fail(409, "Yêu cầu đã được xử lý.");
    if (request.user_status !== "active")
      throw fail(409, "Tài khoản người mượn không hoạt động.");
    const copyId = Number(req.body.copy_id);
    const copy = await get(
      "SELECT * FROM book_copies WHERE id=? AND book_id=? AND status='available'",
      [copyId, request.book_id],
    );
    if (!copy) throw fail(409, "Bản sách đã không còn sẵn sàng.");
    const policy = await get(
      "SELECT pickup_hours FROM circulation_policies WHERE user_type=?",
      [request.user_type],
    );
    const deadline = new Date(
      Date.now() + Number(policy?.pickup_hours || 48) * 3600000,
    )
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    await run(
      "UPDATE borrow_requests SET status='approved',reserved_copy_id=?,decision_at=CURRENT_TIMESTAMP,pickup_deadline=?,decided_by=? WHERE id=?",
      [copy.id, deadline, req.session.user.id, request.id],
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
      request.id,
      request,
      { status: "approved", reserved_copy_id: copy.id },
      req,
    );
    await notify(
      request.user_id,
      "request_approved",
      "Yêu cầu đã được duyệt",
      `Bạn có thể nhận “${request.title}” trước ${deadline}.`,
      "borrow_request",
      request.id,
    );
    return get("SELECT * FROM borrow_requests WHERE id=?", [request.id]);
  });
  res.json(result);
}

async function incidentList(req, res) {
  const values = [];
  const where = [];
  if (req.query.status) {
    where.push("i.status=?");
    values.push(req.query.status);
  }
  const rows = await all(
    `SELECT i.*,bc.inventory_code,b.title,u.full_name,u.username,resolver.full_name resolved_by_name
    FROM copy_incidents i JOIN book_copies bc ON bc.id=i.book_copy_id JOIN books b ON b.id=bc.book_id JOIN users u ON u.id=i.user_id
    LEFT JOIN users resolver ON resolver.id=i.resolved_by ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY i.id DESC`,
    values,
  );
  res.json({ data: rows });
}

async function resolveIncident(req, res) {
  const result = await transaction(async () => {
    const incident = await get("SELECT * FROM copy_incidents WHERE id=?", [
      req.params.id,
    ]);
    if (!incident) throw fail(404, "Không tìm thấy sự cố.");
    if (incident.status !== "open") throw fail(409, "Sự cố đã được xử lý.");
    const status = ["resolved", "waived"].includes(req.body.status)
      ? req.body.status
      : "resolved";
    await run(
      "UPDATE copy_incidents SET status=?,amount=?,description=?,resolved_at=CURRENT_TIMESTAMP,resolved_by=? WHERE id=?",
      [
        status,
        Number(req.body.amount) || null,
        req.body.description || incident.description,
        req.session.user.id,
        incident.id,
      ],
    );
    const after = await get("SELECT * FROM copy_incidents WHERE id=?", [
      incident.id,
    ]);
    await audit(
      req.session.user.id,
      "incident_resolve",
      "copy_incident",
      incident.id,
      incident,
      after,
      req,
    );
    await notify(
      incident.user_id,
      "incident_resolved",
      "Sự cố sách đã được xử lý",
      "Thư viện đã cập nhật kết quả xử lý sự cố sách của bạn.",
      "copy_incident",
      incident.id,
    );
    return after;
  });
  res.json(result);
}

module.exports = { approveWithCopy, incidentList, resolveIncident };
