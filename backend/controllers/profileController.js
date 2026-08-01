const bcrypt = require("bcrypt");
const { get, run } = require("../database/db");
const { normalizeClassName, normalizePhone, validClassName, validGender, validPhone } = require("../utils/validation");

async function getProfileData(req) {
  return get(
    "SELECT id,username,full_name,gender,phone,email,avatar,role,user_type,class_name,department,status FROM users WHERE id=?",
    [req.session.user.id],
  );
}

async function getProfile(req, res) { res.json(await getProfileData(req)); }

async function updateProfile(req, res) {
  const { gender, phone, email, class_name, department } = req.body;
  if (!validGender(gender) || !validPhone(phone))
    return res.status(400).json({ message: "Thông tin hồ sơ không hợp lệ." });
  if (req.session.user.user_type === "student" && !validClassName(class_name))
    return res.status(400).json({ message: "Lớp không hợp lệ." });
  if (req.session.user.user_type === "teacher" && !String(department || "").trim())
    return res.status(400).json({ message: "Giáo viên cần chọn tổ bộ môn." });
  await run(
    "UPDATE users SET gender=?,phone=?,email=?,class_name=?,department=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    [gender, normalizePhone(phone), email || null,
      req.session.user.user_type === "student" ? normalizeClassName(class_name) : null,
      req.session.user.user_type === "teacher" ? department.trim() : null,
      req.session.user.id],
  );
  res.json(await getProfileData(req));
}

async function changePassword(req, res) {
  const user = await get("SELECT password_hash FROM users WHERE id=?", [req.session.user.id]);
  if (!(await bcrypt.compare(req.body.current_password || "", user.password_hash)))
    return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });
  await run("UPDATE users SET password_hash=? WHERE id=?", [await bcrypt.hash(req.body.new_password, 10), req.session.user.id]);
  res.json({ message: "Đã cập nhật mật khẩu." });
}

module.exports = { getProfile, updateProfile, changePassword };
