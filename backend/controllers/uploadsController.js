const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
async function uploadCover(req, res) {
  if (!req.file) return res.status(400).json({ message: "Chưa chọn ảnh bìa." });
  const extension = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  }[req.file.mimetype];
  if (!extension)
    return res
      .status(400)
      .json({ message: "Chỉ chấp nhận JPG, PNG hoặc WEBP." });
  const directory = path.join(
    process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads"),
    "covers",
  );
  await fs.promises.mkdir(directory, { recursive: true });
  const name = `${crypto.randomUUID()}${extension}`;
  await fs.promises.writeFile(path.join(directory, name), req.file.buffer);
  res.status(201).json({ url: `/uploads/covers/${name}` });
}
module.exports = { uploadCover };
