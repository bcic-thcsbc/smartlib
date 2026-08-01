import { ArrowLeft, BookOpen, CalendarDays, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { borrowApi } from "../../../api/borrowApi";
import { EmptyState } from "../../../components/common/EmptyState";
import { PageLoader } from "../../../components/common/PageLoader";
import type { Loan } from "../../../types/borrow";
import { formatDate, formatWeekday } from "../../../utils/format";

function statusLabel(status: string) {
  return (
    {
      active: "Đang mượn",
      overdue: "Quá hạn",
      returned: "Đã trả",
      partially_returned: "Trả một phần",
    }[status] || status
  );
}

export function BorrowDetail() {
  const { id } = useParams();
  const [loan, setLoan] = useState<Loan>();

  useEffect(() => {
    if (id)
      borrowApi.detail(Number(id)).then((response) => setLoan(response.data));
  }, [id]);

  if (!loan) return <PageLoader />;

  const memberContext =
    loan.user_type === "teacher" ? loan.department : loan.class_name;

  return (
    <div className="section-stack">
      <Link to="/admin/borrow" className="back-link">
        <ArrowLeft size={17} />
        Mượn trả
      </Link>
      <section className="panel loan-detail-hero">
        <div className="loan-detail-icon">
          <BookOpen size={30} />
        </div>
        <div className="loan-detail-heading">
          <p className="eyebrow">
            Phiếu mượn {loan.loan_code || `#${loan.id}`}
          </p>
          <h2>{loan.full_name}</h2>
          <p className="muted">
            <UserRound size={15} />
            {loan.user_type === "teacher" ? "Giáo viên" : "Học sinh"}
            {memberContext ? ` · ${memberContext}` : ""}
          </p>
        </div>
        <span className={`status ${loan.status}`}>
          {statusLabel(loan.status)}
        </span>
      </section>
      <section className="loan-detail-grid">
        <div className="panel loan-date-card">
          <CalendarDays size={18} />
          <span>Ngày mượn</span>
          <strong>{formatDate(loan.borrow_date)}</strong>
          <small>{formatWeekday(loan.borrow_date)}</small>
        </div>
        <div className="panel loan-date-card">
          <CalendarDays size={18} />
          <span>Hạn trả</span>
          <strong>{formatDate(loan.due_date)}</strong>
          <small>{formatWeekday(loan.due_date)}</small>
        </div>
      </section>
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Quyển sách</p>
            <h3>Chi tiết mượn trả</h3>
          </div>
        </div>
        {loan.items.length ? (
          <table>
            <thead>
              <tr>
                <th>Tựa sách</th>
                <th>Mã quyển</th>
                <th>Kết quả</th>
                <th>Ngày trả</th>
              </tr>
            </thead>
            <tbody>
              {loan.items.map((item) => (
                <tr key={item.item_id}>
                  <td>
                    <strong>{item.title}</strong>
                    <small className="muted">{item.author || ""}</small>
                  </td>
                  <td className="mono">{item.inventory_code}</td>
                  <td>
                    <span className={`status ${item.disposition}`}>
                      {item.disposition === "borrowed"
                        ? "Đang mượn"
                        : item.disposition === "returned"
                          ? "Đã trả"
                          : item.disposition === "lost"
                            ? "Mất"
                            : "Hỏng"}
                    </span>
                  </td>
                  <td>{formatDate(item.returned_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            title="Chưa có quyển sách"
            text="Phiếu mượn này chưa có dữ liệu quyển sách."
          />
        )}
      </section>
    </div>
  );
}
