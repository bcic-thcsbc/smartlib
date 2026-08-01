const ExcelJS = require("exceljs");
const { all, run, transaction } = require("../database/db");
const { nextInventoryCode } = require("../utils/inventoryCode");

const columns = [
  ["title", "Tên tựa sách"],
  ["author", "Tác giả"],
  ["publisher", "Nhà xuất bản"],
  ["publish_year", "Năm XB"],
  ["category", "Thể loại"],
  ["description", "Mô tả"],
  ["page_count", "Số trang"],
  ["cover_image", "URL bìa"],
  ["copy_count", "Số quyển"],
  ["shelf", "Kệ"],
];

const text = (value) => String(value ?? "").trim();
const numeric = (value) => (text(value) === "" ? 0 : Number(text(value)));

function setup(sheet, name) {
  sheet.name = name;
  sheet.columns = columns.map(([key, header]) => ({
    key,
    header,
    width: Math.max(16, header.length + 5),
  }));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: { row: 1, column: columns.length } };

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1D4ED8" },
  };
  header.alignment = { vertical: "middle" };
}

async function template(req, res) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tựa sách");
  setup(sheet, "Tựa sách");
  sheet.addRow({
    title: "",
    author: "",
    publisher: "",
    publish_year: 0,
    category: "",
    description: "",
    page_count: 0,
    cover_image: "",
    copy_count: 1,
    shelf: "",
  });

  const buffer = await workbook.xlsx.writeBuffer();
  res.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.attachment("Tu_sach_template.xlsx");
  res.send(Buffer.from(buffer));
}

async function parse(buffer) {
  if (!buffer)
    throw Object.assign(new Error("Chưa chọn tệp Excel."), { status: 400 });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet)
    throw Object.assign(new Error("Tệp Excel không có worksheet."), {
      status: 400,
    });

  const headers = sheet.getRow(1).values.slice(1).map(text);
  const expected = columns.map(([, header]) => header);
  if (expected.some((header, index) => headers[index] !== header)) {
    throw Object.assign(new Error("Header không khớp template Tựa sách."), {
      status: 400,
    });
  }

  const rows = [];
  const errors = [];

  sheet.eachRow((row, index) => {
    if (index === 1) return;

    const item = { _row: index };
    let present = false;
    columns.forEach(([key], column) => {
      item[key] = text(row.getCell(column + 1).value);
      present ||= Boolean(item[key]);
    });
    if (!present) return;

    item.publish_year = numeric(item.publish_year);
    item.page_count = numeric(item.page_count);
    item.copy_count =
      text(item.copy_count) === "" ? 1 : numeric(item.copy_count);

    if (!item.title)
      errors.push({ row: index, message: "Tên tựa sách là bắt buộc." });
    for (const key of ["publish_year", "page_count"]) {
      if (!Number.isInteger(item[key]) || item[key] < 0) {
        const [, label] = columns.find(([column]) => column === key);
        errors.push({
          row: index,
          message: `${label} phải là số nguyên từ 0 trở lên.`,
        });
      }
    }
    if (!Number.isInteger(item.copy_count) || item.copy_count < 1) {
      errors.push({
        row: index,
        message: "Số quyển phải là số nguyên từ 1 trở lên.",
      });
    }

    rows.push(item);
  });

  return { rows, errors };
}

async function validate(req, res) {
  const result = await parse(req.file?.buffer);
  res.json({
    valid: result.errors.length === 0,
    preview: result.rows.slice(0, 50),
    errors: result.errors,
    total: result.rows.length,
    copy_total: result.rows.reduce((sum, row) => sum + row.copy_count, 0),
  });
}

async function commit(req, res) {
  const result = await parse(req.file?.buffer);
  if (result.errors.length) {
    return res
      .status(400)
      .json({ message: "Tệp còn lỗi.", valid: false, errors: result.errors });
  }

  await transaction(async () => {
    for (const row of result.rows) {
      const book = await run(
        "INSERT INTO books(title,author,publisher,publish_year,category,description,page_count,cover_image,total_quantity,available_quantity) VALUES(?,?,?,?,?,?,?,?,0,0)",
        [
          row.title,
          row.author || null,
          row.publisher || null,
          row.publish_year,
          row.category || null,
          row.description || null,
          row.page_count,
          row.cover_image || null,
        ],
      );

      for (let index = 0; index < row.copy_count; index += 1) {
        await run(
          "INSERT INTO book_copies(book_id,inventory_code,shelf) VALUES(?,?,?)",
          [book.id, await nextInventoryCode(book.id), row.shelf || null],
        );
      }

      await run(
        "UPDATE books SET total_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=? AND status<>'retired'),available_quantity=(SELECT COUNT(*) FROM book_copies WHERE book_id=? AND status='available') WHERE id=?",
        [book.id, book.id, book.id],
      );
    }
  });

  const copyTotal = result.rows.reduce((sum, row) => sum + row.copy_count, 0);
  res.status(201).json({
    message: `Đã import ${result.rows.length} tựa sách và ${copyTotal} quyển.`,
    total: result.rows.length,
  });
}

async function exportSheet(req, res) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Bao cao muon tra");
  const definition = [
    ["title", "Tựa sách"],
    ["total_loans", "Lượt mượn"],
    ["returned", "Đã trả"],
    ["overdue", "Quá hạn"],
    ["lost", "Mất"],
    ["damaged", "Hỏng"],
  ];
  sheet.columns = definition.map(([key, header]) => ({
    key,
    header,
    width: Math.max(15, header.length + 5),
  }));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: { row: 1, column: definition.length } };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1D4ED8" },
  };

  const reportQuery = [
    "SELECT bo.title, COUNT(DISTINCT bi.id) total_loans,",
    "SUM(CASE WHEN bi.disposition = 'returned' THEN 1 ELSE 0 END) returned,",
    "SUM(CASE WHEN bi.disposition = 'borrowed' AND b.due_date < date('now') THEN 1 ELSE 0 END) overdue,",
    "SUM(CASE WHEN bi.disposition = 'lost' THEN 1 ELSE 0 END) lost,",
    "SUM(CASE WHEN bi.disposition = 'damaged' THEN 1 ELSE 0 END) damaged",
    "FROM borrow_items bi",
    "JOIN borrows b ON b.id = bi.borrow_id",
    "JOIN book_copies bc ON bc.id = bi.book_copy_id",
    "JOIN books bo ON bo.id = bc.book_id",
    "GROUP BY bo.id, bo.title ORDER BY total_loans DESC",
  ].join(" ");
  const rows = await all(reportQuery);
  rows.forEach((row) => sheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  res.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.attachment(
    `Bao_cao_muon_tra_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
  res.send(Buffer.from(buffer));
}

module.exports = { template, validate, commit, exportSheet };
