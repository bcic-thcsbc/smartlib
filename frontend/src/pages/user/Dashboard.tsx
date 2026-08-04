import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { borrowApi } from "../../api/borrowApi";
import { EmptyState } from "../../components/common/EmptyState";
import { PageError } from "../../components/common/PageError";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useAuth } from "../../auth/useAuth";
import type { BorrowRequest, Loan } from "../../types/borrow";
import { errorMessage, formatDate } from "../../utils/format";

export function Dashboard() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([borrowApi.list(), borrowApi.requests()])
      .then(([loanResponse, requestResponse]) => {
        setLoans(loanResponse.data.data);
        setRequests(requestResponse.data.data);
      })
      .catch((requestError) =>
        setError(
          errorMessage(requestError, "Không thể tải tổng quan thư viện."),
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const activeLoans = loans.filter((loan) =>
    ["active", "partially_returned", "overdue"].includes(loan.status),
  );
  const pendingRequests = requests.filter(
    (request) => request.status === "pending",
  );
  const upcoming = [...activeLoans]
    .sort((left, right) => left.due_date.localeCompare(right.due_date))
    .slice(0, 4);
  const nearest = upcoming[0];

  if (error) return <PageError message={error} onRetry={load} />;

  return (
    <div className="user-dashboard section-stack">
      <section className="user-dashboard-hero panel">
        <div className="dashboard-book-mark">
          <BookOpen size={40} aria-hidden="true" />
        </div>
        <div className="dashboard-hero-copy">
          <h1>Chào {user?.full_name}</h1>
          <p>
            {nearest
              ? `Hạn trả gần nhất là ${formatDate(nearest.due_date)}.`
              : "Bạn chưa có sách đến hạn trả."}
          </p>
        </div>
        <Link className="secondary" to="/user/books">
          <Search size={17} aria-hidden="true" />
          Tìm sách
        </Link>
      </section>
      <section className="user-metric-grid" aria-label="Tóm tắt thư viện">
        <Link to="/user/my-borrow" className="user-metric">
          <ClipboardList size={20} aria-hidden="true" />
          <span>Đang mượn</span>
          <strong>{loading ? "-" : activeLoans.length}</strong>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <Link to="/user/my-requests" className="user-metric">
          <CalendarClock size={20} aria-hidden="true" />
          <span>Yêu cầu chờ xử lý</span>
          <strong>{loading ? "-" : pendingRequests.length}</strong>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>
      <section className="panel due-panel">
        <div className="panel-heading">
          <div>
            <h2>Sắp đến hạn</h2>
            <p className="muted">Các phiếu mượn cần theo dõi trước.</p>
          </div>
          <Link className="text-button" to="/user/my-borrow">
            Xem tất cả
          </Link>
        </div>
        {loading ? (
          <div className="due-skeleton">
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ) : upcoming.length ? (
          <div className="due-list">
            {upcoming.map((loan) => (
              <Link to="/user/my-borrow" className="due-row" key={loan.id}>
                <BookOpen size={18} aria-hidden="true" />
                <div>
                  <strong>{loan.books}</strong>
                  <span>Hạn trả {formatDate(loan.due_date)}</span>
                </div>
                <StatusBadge status={loan.status}>
                  {loan.status === "overdue" ? "Quá hạn" : "Đang mượn"}
                </StatusBadge>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có phiếu mượn nào"
            text="Khám phá danh mục để gửi yêu cầu mượn sách."
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
