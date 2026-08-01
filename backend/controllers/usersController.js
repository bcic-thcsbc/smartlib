const { all, get, run, transaction } = require("../database/db");
const { normalizeClassName, normalizePhone, validClassName, validGender, validPhone } = require("../utils/validation");

const paging = (req) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  return { limit, page, offset: (page - 1) * limit };
};

async function list(req, res) {
  const q = String(req.query.q || "").trim();
  const { limit, page, offset } = paging(req);
  const search = `%${q}%`;
  const where = ["(full_name LIKE ? OR username LIKE ?)"];
  const params = [search, search];
  if (req.query.user_type) { where.push("user_type=?"); params.push(req.query.user_type); }
  const clause = where.join(" AND ");
  const count = await get(`SELECT COUNT(*) count FROM users WHERE ${clause}`, params);
  const rows = await all(
    `SELECT id,username,full_name,gender,phone,email,role,user_type,class_name,department,status,created_at
     FROM users WHERE ${clause} ORDER BY full_name COLLATE NOCASE LIMIT ? OFFSET ?`, [...params, limit, offset],
  );
  res.json({ data: rows, pagination: { page, limit, total: count.count, pages: Math.ceil(count.count / limit) } });
}

async function update(req, res) {
  const user = await get("SELECT * FROM users WHERE id=?", [req.params.id]);
  if (!user) return res.status(404).json({ message: "Không tìm thấy thành viên." });
  const { gender, phone, email, class_name, department } = req.body;
  if (!validGender(gender) || !validPhone(phone))
    return res.status(400).json({ message: "Thông tin thành viên không hợp lệ." });
  if (user.role !== "admin" && user.user_type === "student" && !validClassName(class_name))
    return res.status(400).json({ message: "Lớp không hợp lệ." });
  if (user.role !== "admin" && user.user_type === "teacher" && !String(department || "").trim())
    return res.status(400).json({ message: "Giáo viên cần chọn tổ bộ môn." });
  await run(
    "UPDATE users SET gender=?,phone=?,email=?,class_name=?,department=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    [gender, normalizePhone(phone), email || null,
      user.user_type === "student" ? normalizeClassName(class_name) : null,
      user.user_type === "teacher" ? department.trim() : null, user.id],
  );
  res.json(await get("SELECT id,username,full_name,gender,phone,email,role,user_type,class_name,department,status FROM users WHERE id=?", [user.id]));
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (id === req.session.user.id) return res.status(400).json({ message: "Bạn không thể xóa tài khoản của mình." });
  const user = await get("SELECT id FROM users WHERE id=?", [id]);
  if (!user) return res.status(404).json({ message: "Không tìm thấy thành viên." });
  const active = await get("SELECT COUNT(*) count FROM borrow_items bi JOIN borrows b ON b.id=bi.borrow_id WHERE b.user_id=? AND bi.disposition='borrowed'", [id]);
  if (active.count) return res.status(400).json({ message: "Không thể xóa thành viên đang còn quyển mượn." });
  await transaction(async () => {
    await run("DELETE FROM sessions WHERE data LIKE ?", [`%\"id\":${id}%`]);
    await run("DELETE FROM notifications WHERE user_id=?", [id]);
    await run("DELETE FROM audit_logs WHERE actor_id=? OR (entity_type=? AND entity_id=?)", [id, "user", id]);
    await run("DELETE FROM users WHERE id=?", [id]);
  });
  res.json({ message: "Đã xóa thành viên." });
}

module.exports = { list, update, remove };
