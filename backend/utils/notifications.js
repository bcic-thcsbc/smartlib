const nodemailer = require("nodemailer");
const { all, run } = require("../database/db");
const { notify } = require("./audit");
const { formatDate } = require("./presentation");

function transporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

async function dispatchDueNotifications() {
  const loans =
    await all(`SELECT b.id,b.loan_code,b.due_date,u.id user_id,u.email FROM borrows b JOIN users u ON u.id=b.user_id
    WHERE b.status IN ('active','overdue','partially_returned') AND EXISTS(SELECT 1 FROM borrow_items WHERE borrow_id=b.id AND disposition='borrowed')
      AND b.due_date <= date('now','+3 days')`);
  for (const loan of loans) {
    const overdue = loan.due_date < new Date().toISOString().slice(0, 10);
    const type = overdue ? "loan_overdue" : "loan_due_soon";
    const key = `${type}:${loan.id}:${loan.due_date}`;
    await notify(
      loan.user_id,
      type,
      overdue ? "Phiếu mượn đã quá hạn" : "Sắp đến hạn trả sách",
      overdue
        ? `Phiếu ${loan.loan_code} đã quá hạn từ ${formatDate(loan.due_date)}.`
        : `Phiếu ${loan.loan_code} cần trả trước ngày ${formatDate(loan.due_date)}.`,
      "borrow",
      loan.id,
      key,
    );
    const row = await all(
      "SELECT id,email_sent_at FROM notifications WHERE dedupe_key=?",
      [key],
    );
    const mailer = transporter();
    if (mailer && loan.email && row[0] && !row[0].email_sent_at) {
      try {
        await mailer.sendMail({
          from: process.env.SMTP_FROM,
          to: loan.email,
          subject: overdue
            ? "SmartLib: Phiếu mượn quá hạn"
            : "SmartLib: Nhắc hạn trả sách",
          text: overdue
            ? `Phiếu ${loan.loan_code} đã quá hạn. Vui lòng liên hệ thư viện.`
            : `Phiếu ${loan.loan_code} đến hạn ${formatDate(loan.due_date)}.`,
        });
        await run(
          "UPDATE notifications SET email_sent_at=CURRENT_TIMESTAMP WHERE id=?",
          [row[0].id],
        );
      } catch (error) {
        console.error(
          JSON.stringify({
            event: "notification_email_failed",
            message: error.message,
            notification: row[0].id,
          }),
        );
      }
    }
  }
}

function startNotificationScheduler() {
  void dispatchDueNotifications();
  return setInterval(
    () => void dispatchDueNotifications(),
    60 * 60 * 1000,
  ).unref();
}
module.exports = { dispatchDueNotifications, startNotificationScheduler };
