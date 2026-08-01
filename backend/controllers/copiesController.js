const { all, get, run, transaction } = require("../database/db");
const { nextInventoryCode } = require("../utils/inventoryCode");
const paging = (req) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  return { limit, page, offset: (page - 1) * limit };
};
async function refresh(bookId) {
  await run(
    "UPDATE books SET total_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=?),available_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=? AND status='available') WHERE id=?",
    [bookId, bookId, bookId],
  );
}
async function purgeCopy(copyId) {
  const copy = await get("SELECT * FROM book_copies WHERE id=?", [copyId]);
  if (!copy) {
    const error = new Error("Không tìm thấy quyển sách.");
    error.status = 404;
    throw error;
  }
  const reservation = await get(
    "SELECT COUNT(*) count FROM reservation_slots WHERE (provisional_copy_id=? OR approved_copy_id=?) AND status IN ('pending','approved','ready_for_pickup','at_risk','checked_out')",
    [copy.id, copy.id],
  );
  if (["borrowed", "reserved"].includes(copy.status) || reservation.count) {
    const error = new Error(
      "Không thể xóa quyển đang mượn, được giữ hoặc có lịch đặt mượn.",
    );
    error.status = 409;
    throw error;
  }
  await run("DELETE FROM copy_incidents WHERE book_copy_id=?", [copy.id]);
  await run(
    "DELETE FROM reservation_slots WHERE provisional_copy_id=? OR approved_copy_id=?",
    [copy.id, copy.id],
  );
  await run(
    "UPDATE borrow_requests SET reserved_copy_id=NULL WHERE reserved_copy_id=?",
    [copy.id],
  );
  await run("DELETE FROM borrow_items WHERE book_copy_id=?", [copy.id]);
  await run(
    "DELETE FROM borrows WHERE id NOT IN (SELECT DISTINCT borrow_id FROM borrow_items)",
  );
  await run("DELETE FROM book_copies WHERE id=?", [copy.id]);
  await refresh(copy.book_id);
}
async function list(req, res) {
  const q = String(req.query.q || "").trim();
  const { limit, page, offset } = paging(req);
  const search = `%${q}%`;
  const where = ["(bc.inventory_code LIKE ? OR b.title LIKE ?)"];
  const params = [search, search];
  if (req.query.book_id) {
    where.push("bc.book_id=?");
    params.push(Number(req.query.book_id));
  }
  if (req.query.shelf) {
    where.push("bc.shelf=?");
    params.push(req.query.shelf);
  }
  if (req.query.status) {
    where.push("bc.status=?");
    params.push(req.query.status);
  }
  const clause = where.join(" AND ");
  const count = await get(
    `SELECT COUNT(*) count FROM book_copies bc JOIN books b ON b.id=bc.book_id WHERE ${clause}`,
    params,
  );
  const rows = await all(
    `SELECT bc.*,b.title FROM book_copies bc JOIN books b ON b.id=bc.book_id WHERE ${clause} ORDER BY bc.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  res.json({
    data: rows,
    pagination: {
      page,
      limit,
      total: count.count,
      pages: Math.ceil(count.count / limit),
    },
  });
}
async function create(req, res) {
  const { book_id, quantity = 1, shelf } = req.body;
  const book = await get("SELECT id FROM books WHERE id=?", [book_id]);
  if (!book)
    return res.status(404).json({ message: "Không tìm thấy tựa sách." });
  const amount = Number(quantity);
  if (!Number.isInteger(amount) || amount < 1 || amount > 500)
    return res.status(400).json({ message: "Số lượng phải từ 1 đến 500." });
  const result = await transaction(async () => {
    let first;
    for (let index = 0; index < amount; index += 1) {
      const row = await run(
        "INSERT INTO book_copies(book_id,inventory_code,shelf) VALUES(?,?,?)",
        [book_id, await nextInventoryCode(book_id), shelf || null],
      );
      first ||= row.id;
    }
    await refresh(book_id);
    return first;
  });
  res.status(201).json({ created: amount, first_id: result });
}
async function update(req, res) {
  const { status, shelf } = req.body;
  const old = await get("SELECT * FROM book_copies WHERE id=?", [
    req.params.id,
  ]);
  if (!old)
    return res.status(404).json({ message: "Không tìm thấy quyển sách." });
  if (["borrowed", "reserved"].includes(old.status) && status !== old.status)
    return res.status(409).json({
      message: "Không thể đổi trạng thái quyển đang được giữ hoặc mượn.",
    });
  if (
    !["available", "reserved", "borrowed", "lost", "damaged"].includes(status)
  )
    return res.status(400).json({ message: "Trạng thái không hợp lệ." });
  await run(
    "UPDATE book_copies SET status=?,shelf=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    [status, shelf || null, req.params.id],
  );
  await refresh(old.book_id);
  res.json(await get("SELECT * FROM book_copies WHERE id=?", [req.params.id]));
}
async function removeMany(req, res) {
  const ids = [
    ...new Set((req.body.ids || []).map(Number).filter(Number.isInteger)),
  ];
  if (!ids.length)
    return res
      .status(400)
      .json({ message: "Chọn ít nhất một quyển sách để xóa." });
  await transaction(async () => {
    for (const id of ids) await purgeCopy(id);
  });
  res.json({ deleted: ids.length });
}
async function remove(req, res) {
  req.body = { ids: [Number(req.params.id)] };
  return removeMany(req, res);
}
module.exports = { list, create, update, remove, removeMany };
