const { all, get } = require("../database/db");

function codePrefix(title) {
  const normalized = String(title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const tokens = normalized.match(/[A-Z]+|\d+/g) || [];
  const prefix = tokens
    .map((token) => (/^\d+$/.test(token) ? token : token[0]))
    .join("");
  return prefix.slice(0, 24) || "SACH";
}

async function nextInventoryCode(bookId) {
  const book = await get("SELECT title FROM books WHERE id=?", [bookId]);
  if (!book) {
    const error = new Error("Không tìm thấy tựa sách để sinh mã quyển.");
    error.status = 404;
    throw error;
  }
  const prefix = codePrefix(book.title);
  const rows = await all(
    "SELECT inventory_code FROM book_copies WHERE inventory_code LIKE ?",
    [`${prefix}-%`],
  );
  const highest = rows.reduce((max, row) => {
    const number = Number(String(row.inventory_code).slice(prefix.length + 1));
    return Number.isInteger(number) && number > max ? number : max;
  }, 0);
  return `${prefix}-${highest + 1}`;
}

module.exports = { codePrefix, nextInventoryCode };
