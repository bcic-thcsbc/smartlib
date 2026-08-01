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
async function ensureDeletable(bookId) {
  const active = await get(
    "SELECT COUNT(*) count FROM book_copies WHERE book_id=? AND status IN ('borrowed','reserved')",
    [bookId],
  );
  const reservation = await get(
    "SELECT COUNT(*) count FROM reservation_slots WHERE book_id=? AND status IN ('pending','approved','ready_for_pickup','at_risk','checked_out')",
    [bookId],
  );
  if (active.count || reservation.count) {
    const error = new Error(
      "Không thể xóa tựa sách khi còn quyển đang mượn, được giữ hoặc có lịch đặt mượn.",
    );
    error.status = 409;
    throw error;
  }
}
async function purgeBook(bookId) {
  await ensureDeletable(bookId);
  const copies = await all("SELECT id FROM book_copies WHERE book_id=?", [
    bookId,
  ]);
  for (const copy of copies) {
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
  }
  await run(
    "DELETE FROM borrows WHERE id NOT IN (SELECT DISTINCT borrow_id FROM borrow_items)",
  );
  await run(
    "UPDATE borrows SET request_id=NULL WHERE request_id IN (SELECT id FROM borrow_requests WHERE book_id=?)",
    [bookId],
  );
  await run("DELETE FROM borrow_requests WHERE book_id=?", [bookId]);
  await run("DELETE FROM book_copies WHERE book_id=?", [bookId]);
  await run("DELETE FROM books WHERE id=?", [bookId]);
}
async function list(req, res) {
  const q = String(req.query.q || "").trim();
  const { limit, page, offset } = paging(req);
  const search = `%${q}%`;
  const where = ["(b.title LIKE ? OR b.author LIKE ? OR b.publisher LIKE ?)"];
  const params = [search, search, search];
  if (req.query.category) {
    where.push("b.category=?");
    params.push(req.query.category);
  }
  if (req.query.publish_year !== undefined && req.query.publish_year !== "") {
    where.push("b.publish_year=?");
    params.push(Number(req.query.publish_year));
  }
  if (req.query.availability === "available")
    where.push("b.available_quantity>0");
  if (req.query.availability === "unavailable")
    where.push("b.available_quantity=0");
  const clause = where.join(" AND ");
  const count = await get(
    `SELECT COUNT(*) count FROM books b WHERE ${clause}`,
    params,
  );
  const rows = await all(
    `SELECT b.*,COUNT(bc.id) copy_count FROM books b LEFT JOIN book_copies bc ON bc.book_id=b.id WHERE ${clause} GROUP BY b.id ORDER BY b.id DESC LIMIT ? OFFSET ?`,
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
async function detail(req, res) {
  const book = await get(
    "SELECT b.*,COUNT(bc.id) copy_count FROM books b LEFT JOIN book_copies bc ON bc.book_id=b.id WHERE b.id=? GROUP BY b.id",
    [req.params.id],
  );
  if (!book)
    return res.status(404).json({ message: "Không tìm thấy tựa sách." });
  res.json(book);
}
async function create(req, res) {
  const {
    title,
    author,
    publisher,
    publish_year,
    category,
    description,
    page_count,
    cover_image,
    shelf,
  } = req.body;
  const quantity =
    req.body.quantity === undefined ? 1 : Number(req.body.quantity);
  if (!title?.trim())
    return res.status(400).json({ message: "Tên tựa sách là bắt buộc." });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500)
    return res.status(400).json({ message: "Số quyển phải từ 1 đến 500." });
  const after = await transaction(async () => {
    const row = await run(
      "INSERT INTO books(title,author,publisher,publish_year,category,description,page_count,cover_image,total_quantity,available_quantity) VALUES(?,?,?,?,?,?,?,?,0,0)",
      [
        title.trim(),
        author || null,
        publisher || null,
        Number(publish_year) || 0,
        category || null,
        description || null,
        Number(page_count) || 0,
        cover_image || null,
      ],
    );
    for (let index = 0; index < quantity; index += 1)
      await run(
        "INSERT INTO book_copies(book_id,inventory_code,shelf) VALUES(?,?,?)",
        [row.id, await nextInventoryCode(row.id), shelf || null],
      );
    await refresh(row.id);
    return get("SELECT * FROM books WHERE id=?", [row.id]);
  });
  res.status(201).json(after);
}
async function update(req, res) {
  const before = await get("SELECT * FROM books WHERE id=?", [req.params.id]);
  if (!before)
    return res.status(404).json({ message: "Không tìm thấy tựa sách." });
  const {
    title,
    author,
    publisher,
    publish_year,
    category,
    description,
    page_count,
    cover_image,
  } = req.body;
  if (!title?.trim())
    return res.status(400).json({ message: "Tên tựa sách là bắt buộc." });
  await run(
    "UPDATE books SET title=?,author=?,publisher=?,publish_year=?,category=?,description=?,page_count=?,cover_image=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    [
      title.trim(),
      author || null,
      publisher || null,
      Number(publish_year) || 0,
      category || null,
      description || null,
      Number(page_count) || 0,
      cover_image || null,
      req.params.id,
    ],
  );
  res.json(await get("SELECT * FROM books WHERE id=?", [req.params.id]));
}
async function removeMany(req, res) {
  const ids = [
    ...new Set((req.body.ids || []).map(Number).filter(Number.isInteger)),
  ];
  if (!ids.length)
    return res
      .status(400)
      .json({ message: "Chọn ít nhất một tựa sách để xóa." });
  await transaction(async () => {
    for (const id of ids) {
      const book = await get("SELECT id FROM books WHERE id=?", [id]);
      if (!book) {
        const error = new Error("Một tựa sách đã không còn tồn tại.");
        error.status = 404;
        throw error;
      }
      await purgeBook(id);
    }
  });
  res.json({ deleted: ids.length });
}
async function remove(req, res) {
  req.body = { ids: [Number(req.params.id)] };
  return removeMany(req, res);
}
module.exports = { list, detail, create, update, remove, removeMany };
