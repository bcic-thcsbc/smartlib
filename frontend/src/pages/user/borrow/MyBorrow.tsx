import { BookOpen, CalendarDays, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { borrowApi } from "../../../api/borrowApi";
import { EmptyState } from "../../../components/common/EmptyState";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { Toolbar } from "../../../components/common/Toolbar";
import type { Loan } from "../../../types/borrow";
import { errorMessage, formatDate } from "../../../utils/format";

const statusLabel = (status: string) =>
  status === "active"
    ? "Đang mượn"
    : status === "overdue"
      ? "Quá hạn"
      : status === "returned"
        ? "Đã trả"
        : "Trả một phần";

export function MyBorrow() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [error, setError] = useState("");
  const load = () =>
    borrowApi
      .list()
      .then((response) => {
        setLoans(response.data.data);
        setError("");
      })
      .catch((requestError) =>
        setError(errorMessage(requestError, "Không thể tải phiếu mượn.")),
      );
  useEffect(() => {
    load();
  }, []);

  const renew = async (id: number) => {
    try {
      await borrowApi.renew(id);
      toast.success("Đã gia hạn phiếu mượn");
      load();
    } catch (requestError) {
      toast.error(errorMessage(requestError, "Không thể gia hạn"));
    }
  };

  return (
    <div className="section-stack">
      <Toolbar title="Sách tôi đang mượn" count={loans.length} />
      {error && (
        <div className="inline-error">
          <span>{error}</span>
          <button className="secondary" type="button" onClick={load}>
            <RotateCcw size={16} aria-hidden="true" />
            Thử lại
          </button>
        </div>
      )}
      <section className="user-list-panel">
        {loans.length ? (
          <div className="user-loan-list">
            {loans.map((loan) => (
              <article
                className={`user-loan-row ${loan.status === "overdue" ? "is-overdue" : ""}`}
                key={loan.id}
              >
                <div className="book-row-cover">
                  <BookOpen size={22} aria-hidden="true" />
                </div>
                <div className="user-loan-copy">
                  <strong>{loan.books}</strong>
                  <span>
                    <CalendarDays size={15} aria-hidden="true" />
                    Hạn trả {formatDate(loan.due_date)}
                  </span>
                  {loan.status === "overdue" && (
                    <small>Phiếu đã quá hạn. Vui lòng liên hệ thư viện.</small>
                  )}
                </div>
                <div className="user-loan-actions">
                  <StatusBadge status={loan.status}>
                    {statusLabel(loan.status)}
                  </StatusBadge>
                  {["active", "partially_returned"].includes(loan.status) && (
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => void renew(loan.id)}
                    >
                      Gia hạn
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Bạn chưa mượn sách nào"
            text="Lịch sử mượn sách sẽ hiển thị tại đây."
            action={
              <Link className="primary" to="/user/books">
                Khám phá sách
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
