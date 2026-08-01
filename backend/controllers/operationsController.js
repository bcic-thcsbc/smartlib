const { all, get, run, transaction } = require("../database/db");
const { audit } = require("../utils/audit");

const page = (req) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const current = Math.max(Number(req.query.page) || 1, 1);
  return { limit, offset: (current - 1) * limit, current };
};

async function notifications(req, res) {
  const { limit, offset, current } = page(req);
  const count = await get(
    "SELECT COUNT(*) count FROM notifications WHERE user_id=?",
    [req.session.user.id],
  );
  const rows = await all(
    "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?",
    [req.session.user.id, limit, offset],
  );
  const unread = await get(
    "SELECT COUNT(*) count FROM notifications WHERE user_id=? AND read_at IS NULL",
    [req.session.user.id],
  );
  res.json({
    data: rows,
    unread: unread.count,
    pagination: {
      page: current,
      limit,
      total: count.count,
      pages: Math.ceil(count.count / limit),
    },
  });
}
async function readNotification(req, res) {
  const result = await run(
    "UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?",
    [req.params.id, req.session.user.id],
  );
  if (!result.changes)
    return res.status(404).json({ message: "Không tìm thấy thông báo." });
  res.json({ message: "Đã đánh dấu đã đọc." });
}

async function readAllNotifications(req, res) {
  await run(
    "UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL",
    [req.session.user.id],
  );
  res.json({ message: "Đã đánh dấu tất cả là đã đọc." });
}

async function settings(req, res) {
  const rows = await all(
    "SELECT * FROM circulation_policies ORDER BY user_type",
  );
  res.json(rows);
}
async function departments(req, res) {
  res.json(await all("SELECT id,name,active,sort_order FROM subject_departments WHERE active=1 ORDER BY sort_order,name"));
}
async function updateDepartments(req, res) {
  const names = [...new Set((Array.isArray(req.body) ? req.body : []).map((item) => String(item || "").trim()).filter(Boolean))];
  if (!names.length) {
    const error = new Error("Cần có ít nhất một tổ bộ môn.");
    error.status = 400;
    throw error;
  }
  await transaction(async () => {
    await run("UPDATE subject_departments SET active=0,updated_at=CURRENT_TIMESTAMP");
    for (const [index, name] of names.entries()) {
      await run("INSERT INTO subject_departments(name,active,sort_order) VALUES(?,1,?) ON CONFLICT(name) DO UPDATE SET active=1,sort_order=excluded.sort_order,updated_at=CURRENT_TIMESTAMP", [name, index]);
    }
  });
  await departments(req, res);
}
async function updateSettings(req, res) {
  const values = Array.isArray(req.body) ? req.body : [req.body];
  const result = await transaction(async () => {
    for (const item of values) {
      if (
        !["student", "teacher"].includes(item.user_type) ||
        Number(item.max_active_loans) < 1 ||
        Number(item.loan_days) < 1 ||
        Number(item.max_renewals) < 0 ||
        Number(item.renewal_days) < 1 ||
        Number(item.pickup_hours) < 1
      ) {
        const error = new Error("Chính sách không hợp lệ.");
        error.status = 400;
        throw error;
      }
      await run(
        "UPDATE circulation_policies SET max_active_loans=?,loan_days=?,max_renewals=?,renewal_days=?,pickup_hours=?,updated_at=CURRENT_TIMESTAMP WHERE user_type=?",
        [
          Number(item.max_active_loans),
          Number(item.loan_days),
          Number(item.max_renewals),
          Number(item.renewal_days),
          Number(item.pickup_hours),
          item.user_type,
        ],
      );
      await audit(
        req.session.user.id,
        "policy_update",
        "circulation_policy",
        null,
        null,
        item,
        req,
      );
    }
    return all("SELECT * FROM circulation_policies ORDER BY user_type");
  });
  res.json(result);
}
async function schoolSettings(req, res) {
  res.json(
    await get(
      "SELECT school_name,timezone,contact_email,inventory_code_prefix FROM school_settings WHERE id=1",
    ),
  );
}
async function updateSchoolSettings(req, res) {
  const prefix = String(req.body.inventory_code_prefix || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9-]{1,16}$/.test(prefix)) {
    const error = new Error(
      "Tiền tố mã quyển gồm 1-16 ký tự A-Z, số hoặc gạch ngang.",
    );
    error.status = 400;
    throw error;
  }
  await run(
    "UPDATE school_settings SET inventory_code_prefix=?,updated_at=CURRENT_TIMESTAMP WHERE id=1",
    [prefix],
  );
  res.json(
    await get(
      "SELECT school_name,timezone,contact_email,inventory_code_prefix FROM school_settings WHERE id=1",
    ),
  );
}

async function reports(req, res) {
  const from = req.query.from || "0000-01-01";
  const to = req.query.to || "9999-12-31";
  const rows = await all(
    `SELECT bo.title,COUNT(DISTINCT bi.id) total_loans,SUM(CASE WHEN bi.disposition='returned' THEN 1 ELSE 0 END) returned,
  SUM(CASE WHEN bi.disposition='borrowed' AND b.due_date<date('now') THEN 1 ELSE 0 END) overdue,
  SUM(CASE WHEN bi.disposition='lost' THEN 1 ELSE 0 END) lost,SUM(CASE WHEN bi.disposition='damaged' THEN 1 ELSE 0 END) damaged
  FROM borrow_items bi JOIN borrows b ON b.id=bi.borrow_id JOIN book_copies bc ON bc.id=bi.book_copy_id JOIN books bo ON bo.id=bc.book_id
  WHERE b.borrow_date BETWEEN ? AND ? GROUP BY bo.id,bo.title ORDER BY total_loans DESC`,
    [from, to],
  );
  if (req.query.format === "csv") {
    res
      .type("text/csv")
      .send(
        [
          "book,total_loans,returned,overdue,lost,damaged",
          ...rows.map((r) =>
            [r.title, r.total_loans, r.returned, r.overdue, r.lost, r.damaged]
              .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
              .join(","),
          ),
        ].join("\n"),
      );
    return;
  }
  const summaryQuery = [
    "SELECT COUNT(*) active_loans,",
    "(SELECT COUNT(*) FROM borrow_items",
    " WHERE disposition = 'borrowed'",
    " AND EXISTS(SELECT 1 FROM borrows bx WHERE bx.id = borrow_items.borrow_id AND bx.due_date < date('now'))) overdue_items,",
    "(SELECT COUNT(*) FROM copy_incidents WHERE status = 'open') open_incidents",
    "FROM borrows WHERE status IN ('active', 'overdue', 'partially_returned')",
  ].join(" ");
  const summary = await get(summaryQuery);
  res.json({ summary, rows, period: { from, to } });
}

async function auditLogs(req, res) {
  const { limit, offset, current } = page(req);
  const count = await get("SELECT COUNT(*) count FROM audit_logs");
  const rows = await all(
    `SELECT a.*,u.full_name,u.username FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  res.json({
    data: rows,
    pagination: {
      page: current,
      limit,
      total: count.count,
      pages: Math.ceil(count.count / limit),
    },
  });
}

module.exports = {
  notifications,
  readNotification,
  readAllNotifications,
  settings,
  updateSettings,
  departments,
  updateDepartments,
  schoolSettings,
  updateSchoolSettings,
  reports,
  auditLogs,
};
