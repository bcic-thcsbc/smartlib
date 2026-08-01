const { get, all, run } = require("../database/db");
async function summary(req, res) {
  await run(
    "UPDATE borrows SET status='overdue' WHERE status IN ('active','partially_returned') AND due_date<date('now') AND EXISTS(SELECT 1 FROM borrow_items WHERE borrow_id=borrows.id AND disposition='borrowed')",
  );
  const stats =
    await get(`SELECT (SELECT COUNT(*) FROM books WHERE status='active') bookTitles,
    (SELECT COUNT(*) FROM book_copies WHERE status<>'retired') totalCopies,
    (SELECT COUNT(*) FROM book_copies WHERE status='borrowed') borrowedCopies,
    (SELECT COUNT(*) FROM book_copies WHERE status='available') availableCopies,
    (SELECT COUNT(*) FROM book_copies WHERE status='reserved') reservedCopies,
    (SELECT COUNT(*) FROM users WHERE user_type='student' AND status='active') students,
    (SELECT COUNT(*) FROM users WHERE user_type='teacher' AND status='active') teachers,
    (SELECT COUNT(*) FROM borrow_requests WHERE status='pending') pendingRequests,
    (SELECT COUNT(*) FROM borrows WHERE status='overdue') overdueLoans,
    (SELECT COUNT(*) FROM copy_incidents WHERE status='open') openIncidents`);
  const recent =
    await all(`SELECT b.id,b.borrow_date,b.due_date,b.status,u.full_name,
    GROUP_CONCAT(bo.title, ', ') titles FROM borrows b JOIN users u ON u.id=b.user_id JOIN borrow_items bi ON bi.borrow_id=b.id
    JOIN book_copies bc ON bc.id=bi.book_copy_id JOIN books bo ON bo.id=bc.book_id GROUP BY b.id ORDER BY b.id DESC LIMIT 8`);
  const overdueQuery = [
    "SELECT b.id, b.due_date, u.full_name, GROUP_CONCAT(bo.title, ', ') titles",
    "FROM borrows b",
    "JOIN users u ON u.id = b.user_id",
    "JOIN borrow_items bi ON bi.borrow_id = b.id",
    "JOIN book_copies bc ON bc.id = bi.book_copy_id",
    "JOIN books bo ON bo.id = bc.book_id",
    "WHERE bi.disposition = 'borrowed' AND b.due_date < date('now')",
    "GROUP BY b.id ORDER BY b.due_date LIMIT 8",
  ].join(" ");
  const overdue = await all(overdueQuery);
  res.json({ stats, recent, overdue });
}
module.exports = { summary };
