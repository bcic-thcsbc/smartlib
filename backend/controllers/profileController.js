const bcrypt = require("bcrypt");
const { get, run } = require("../database/db");
async function getProfileData(req) {
  return get(
    "SELECT id,username,full_name,gender,date_of_birth,phone,email,avatar,role,user_type,class_name,department,status FROM users WHERE id=?",
    [req.session.user.id],
  );
}
async function getProfile(req, res) {
  res.json(await getProfileData(req));
}
async function updateProfile(req, res) {
  const { gender, date_of_birth, phone, email, class_name, department } =
    req.body;
  await run(
    "UPDATE users SET gender=?,date_of_birth=?,phone=?,email=?,class_name=?,department=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    [
      gender || null,
      date_of_birth || null,
      phone || null,
      email || null,
      req.session.user.user_type === "student" ? class_name : null,
      req.session.user.user_type === "teacher" ? department : null,
      req.session.user.id,
    ],
  );
  res.json(await getProfileData(req));
}
async function changePassword(req, res) {
  const user = await get("SELECT password_hash FROM users WHERE id=?", [
    req.session.user.id,
  ]);
  if (
    !(await bcrypt.compare(req.body.current_password || "", user.password_hash))
  )
    return res.status(400).json({ message: "Current password is incorrect." });
  await run("UPDATE users SET password_hash=? WHERE id=?", [
    await bcrypt.hash(req.body.new_password, 10),
    req.session.user.id,
  ]);
  res.json({ message: "Password updated." });
}
module.exports = { getProfile, updateProfile, changePassword };
