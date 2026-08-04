import { BookOpen, CalendarDays, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { borrowApi } from "../../../api/borrowApi";
import { EmptyState } from "../../../components/common/EmptyState";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { PageError } from "../../../components/common/PageError";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { Toolbar } from "../../../components/common/Toolbar";
import type { BorrowRequest } from "../../../types/borrow";
import { errorMessage, formatDate } from "../../../utils/format";

const label = (status: string) =>
  ({
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    fulfilled: "Đã nhận",
    rejected: "Từ chối",
    expired: "Hết hạn",
    cancelled: "Đã hủy",
  })[status] || status;

export function MyRequests() {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [cancelTarget, setCancelTarget] = useState<BorrowRequest>();
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      borrowApi
        .requests()
        .then((response) => {
          setRequests(response.data.data);
          setError("");
        })
        .catch((requestError) =>
          setError(errorMessage(requestError, "Không thể tải yêu cầu mượn.")),
        ),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  const cancel = async (id: number) => {
    try {
      await borrowApi.cancelRequest(id);
      toast.success("Đã hủy yêu cầu");
      load();
    } catch (requestError) {
      toast.error(errorMessage(requestError, "Không thể hủy yêu cầu"));
    }
  };

  return (
    <div className="section-stack">
      <Toolbar title="Yêu cầu mượn sách" count={requests.length} />
      {error && <PageError message={error} onRetry={load} />}
      {!error && (
        <section className="user-list-panel">
          {requests.length ? (
            <div className="user-loan-list">
              {requests.map((request) => (
                <article className="user-loan-row" key={request.id}>
                  <div className="book-row-cover">
                    <BookOpen size={22} aria-hidden="true" />
                  </div>
                  <div className="user-loan-copy">
                    <strong>{request.title}</strong>
                    <span>
                      <CalendarDays size={15} aria-hidden="true" />
                      {request.desired_start_date
                        ? `${formatDate(request.desired_start_date)} - ${formatDate(request.planned_due_date || "")}`
                        : "Đang chờ lịch mượn"}
                    </span>
                    {request.reason && <small>{request.reason}</small>}
                  </div>
                  <div className="user-loan-actions">
                    <StatusBadge status={request.status}>
                      {label(request.status)}
                    </StatusBadge>
                    {["pending", "approved"].includes(request.status) && (
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => setCancelTarget(request)}
                      >
                        <X size={16} aria-hidden="true" />
                        Hủy yêu cầu
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có yêu cầu"
              text="Các yêu cầu mượn sách của bạn sẽ xuất hiện tại đây."
              action={
                <Link className="primary" to="/user/books">
                  Khám phá sách
                </Link>
              }
            />
          )}
        </section>
      )}
      {cancelTarget && (
        <ConfirmDialog
          title="Hủy yêu cầu mượn"
          description={`Yêu cầu mượn “${cancelTarget.title}” sẽ bị hủy.`}
          confirmLabel="Hủy yêu cầu"
          onClose={() => setCancelTarget(undefined)}
          onConfirm={async () => {
            await cancel(cancelTarget.id);
            setCancelTarget(undefined);
          }}
        />
      )}
    </div>
  );
}
