const { all, get } = require("../database/db");

async function bookAdminDetail(req, res) {
  const book = await get("SELECT * FROM books WHERE id=?", [req.params.id]);
  if (!book)
    return res.status(404).json({ message: "Không tìm thấy đầu sách." });
  const copies = await all(
    `SELECT bc.*,u.full_name holder_name,bo.loan_code,bo.due_date FROM book_copies bc
    LEFT JOIN borrow_items bi ON bi.book_copy_id=bc.id AND bi.disposition='borrowed'
    LEFT JOIN borrows bo ON bo.id=bi.borrow_id LEFT JOIN users u ON u.id=bo.user_id WHERE bc.book_id=? ORDER BY bc.inventory_code`,
    [book.id],
  );
  const history = await all(
    `SELECT bo.loan_code,bo.borrow_date,bo.due_date,bi.returned_at,bi.disposition,bc.inventory_code,u.full_name,u.username
    FROM borrow_items bi JOIN borrows bo ON bo.id=bi.borrow_id JOIN book_copies bc ON bc.id=bi.book_copy_id JOIN users u ON u.id=bo.user_id
    WHERE bc.book_id=? ORDER BY bo.id DESC LIMIT 50`,
    [book.id],
  );
  res.json({
    ...book,
    copies,
    history,
    borrowed_quantity: copies.filter((copy) => copy.status === "borrowed")
      .length,
  });
}

async function copyDetail(req, res) {
  const copy = await get(
    `SELECT bc.*,b.title,b.author,b.publisher FROM book_copies bc JOIN books b ON b.id=bc.book_id WHERE bc.id=?`,
    [req.params.id],
  );
  if (!copy)
    return res.status(404).json({ message: "Không tìm thấy bản sách." });
  const history = await all(
    `SELECT bo.loan_code,bo.borrow_date,bo.due_date,bi.returned_at,bi.disposition,bi.condition_out,bi.condition_in,bi.notes,u.full_name,u.username
    FROM borrow_items bi JOIN borrows bo ON bo.id=bi.borrow_id JOIN users u ON u.id=bo.user_id WHERE bi.book_copy_id=? ORDER BY bo.id DESC LIMIT 50`,
    [copy.id],
  );
  res.json({ ...copy, history });
}

async function globalSearch(req, res) {
  const query = String(req.query.q || "").trim();
  if (query.length < 2) return res.json({ books: [], copies: [], users: [] });
  const term = `%${query}%`;
  const books = await all(
    "SELECT id,title,author,available_quantity FROM books WHERE status='active' AND (title LIKE ? OR author LIKE ?) ORDER BY title LIMIT 8",
    [term, term],
  );
  const copies = await all(
    "SELECT bc.id,bc.inventory_code,bc.status,b.title FROM book_copies bc JOIN books b ON b.id=bc.book_id WHERE bc.inventory_code LIKE ? ORDER BY bc.inventory_code LIMIT 8",
    [term],
  );
  const users =
    req.session.user.role === "admin"
      ? await all(
          "SELECT id,username,full_name,user_type,class_name,department FROM users WHERE username LIKE ? OR full_name LIKE ? ORDER BY full_name LIMIT 8",
          [term, term],
        )
      : [];
  res.json({ books, copies, users });
}
module.exports = { bookAdminDetail, copyDetail, globalSearch };
