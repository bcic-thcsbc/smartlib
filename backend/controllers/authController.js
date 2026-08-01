const bcrypt = require("bcrypt");
const { get, run } = require("../database/db");
const {
  normalizeClassName,
  normalizePhone,
  validClassName,
  validGender,
  validPhone,
} = require("../utils/validation");

async function login(req, res) {
  const { username, password } = req.body;
  const user = await get("SELECT * FROM users WHERE username=? AND status=?", [username, "active"]);
  if (!user || !(await bcrypt.compare(password || "", user.password_hash)))
    return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng." });
  req.session.user = { id: user.id, role: user.role, user_type: user.user_type, full_name: user.full_name, username: user.username };
  res.json({ user: req.session.user });
}

function logout(req, res) {
  req.session.destroy(() => res.json({ message: "Đã đăng xuất." }));
}

function me(req, res) {
  res.json({ user: req.session.user || null });
}

async function register(req, res) {
  const { username, password, full_name, user_type, class_name, department, email, phone, gender } = req.body;
  if (
    !/^[a-zA-Z0-9._-]{3,64}$/.test(String(username || "")) ||
    !password || password.length < 8 || !String(full_name || "").trim() ||
    !["student", "teacher"].includes(user_type) || !String(email || "").match(/^\S+@\S+\.\S+$/) ||
    !validGender(gender) || !validPhone(phone)
  ) return res.status(400).json({ message: "Hãy hoàn thiện thông tin đăng ký bắt buộc." });
  if (user_type === "student" && !validClassName(class_name))
    return res.status(400).json({ message: "Lớp không hợp lệ." });
  if (user_type === "teacher" && !String(department || "").trim())
    return res.status(400).json({ message: "Giáo viên cần chọn tổ bộ môn." });
  const exists = await get("SELECT id FROM users WHERE username=?", [username]);
  if (exists) return res.status(409).json({ message: "Tên đăng nhập đã được sử dụng." });
  const password_hash = await bcrypt.hash(password, 10);
  const result = await run(
    `INSERT INTO users (username,password_hash,full_name,gender,phone,email,role,user_type,class_name,department,status)
     VALUES (?,?,?,?,?,?,'user',?,?,?,'active')`,
    [username, password_hash, full_name.trim(), gender, normalizePhone(phone), email.trim(), user_type,
      user_type === "student" ? normalizeClassName(class_name) : null,
      user_type === "teacher" ? department.trim() : null],
  );
  const user = { id: result.id, username, full_name: full_name.trim(), role: "user", user_type };
  req.session.user = user;
  res.status(201).json({ user });
}

module.exports = { login, register, logout, me };
