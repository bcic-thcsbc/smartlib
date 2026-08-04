import { AlertTriangle, Eye, RotateCcw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { borrowApi } from "../../../api/borrowApi";
import type { Loan } from "../../../types/borrow";
import { Toolbar } from "../../../components/common/Toolbar";
import { EmptyState } from "../../../components/common/EmptyState";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { PageError } from "../../../components/common/PageError";
import { RowActionMenu } from "../../../components/common/RowActionMenu";
import { errorMessage, formatDate } from "../../../utils/format";

export function BorrowList() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pendingAction, setPendingAction] = useState<{
    type: "return" | "lost" | "damaged";
    loan: Loan;
    itemId: number;
  }>();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const load = useCallback(async () => {
    try {
      const response = await borrowApi.list();
      setLoans(response.data.data);
      setError(null);
    } catch (loadError) {
      setError(errorMessage(loadError, "Không thể tải phiếu mượn"));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const returnItem = async (loan: Loan, itemId: number) => {
    try {
      await borrowApi.returnItem(loan.id, itemId);
      toast.success("Đã ghi nhận trả sách");
      load();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể trả sách"));
    }
  };
  const incident = async (
    loan: Loan,
    itemId: number,
    type: "lost" | "damaged",
  ) => {
    try {
      if (type === "lost") await borrowApi.markLost(loan.id, itemId);
      else await borrowApi.markDamaged(loan.id, itemId);
      toast.success("Đã ghi nhận sự cố");
      load();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể ghi nhận sự cố"));
    }
  };
  return (
    <>
      <Toolbar
        title="Mượn trả"
        count={loans.length}
        action="Tạo phiếu mượn"
        onAction={() => navigate("/admin/borrow/new")}
      />
      {error && <PageError message={error} onRetry={() => void load()} />}
      {!error && (
        <section className="panel table-panel">
          <table>
            <thead>
              <tr>
                <th>Người mượn</th>
                <th>Sách / mã kho</th>
                <th>Ngày mượn</th>
                <th>Hạn trả</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>
                    <strong>{loan.full_name}</strong>
                    <small className="muted borrower-meta">
                      {loan.user_type === "teacher"
                        ? `Giáo viên${loan.department ? ` · ${loan.department}` : ""}`
                        : `Học sinh${loan.class_name ? ` · ${loan.class_name}` : ""}`}
                    </small>
                  </td>
                  <td>
                    {loan.items.map((item) => (
                      <div key={item.item_id} className="loan-item">
                        <span>{item.title}</span>
                        <small className="mono">{item.inventory_code}</small>
                        {item.disposition === "borrowed" && (
                          <RowActionMenu
                            label={`Thao tác cho ${item.inventory_code}`}
                            actions={[
                              {
                                label: "Ghi nhận trả",
                                icon: RotateCcw,
                                onSelect: () =>
                                  setPendingAction({
                                    type: "return",
                                    loan,
                                    itemId: item.item_id,
                                  }),
                              },
                              {
                                label: "Đánh dấu hỏng",
                                icon: AlertTriangle,
                                tone: "danger",
                                onSelect: () =>
                                  setPendingAction({
                                    type: "damaged",
                                    loan,
                                    itemId: item.item_id,
                                  }),
                              },
                              {
                                label: "Đánh dấu mất",
                                icon: XCircle,
                                tone: "danger",
                                onSelect: () =>
                                  setPendingAction({
                                    type: "lost",
                                    loan,
                                    itemId: item.item_id,
                                  }),
                              },
                            ]}
                          />
                        )}
                      </div>
                    ))}
                  </td>
                  <td>{formatDate(loan.borrow_date)}</td>
                  <td>{formatDate(loan.due_date)}</td>
                  <td>
                    <StatusBadge status={loan.status}>
                      {loan.status === "active"
                        ? "Đang mượn"
                        : loan.status === "overdue"
                          ? "Quá hạn"
                          : loan.status === "returned"
                            ? "Đã trả"
                            : "Trả một phần"}
                    </StatusBadge>
                  </td>
                  <td>
                    {loan.status !== "returned" && (
                      <RowActionMenu
                        label={`Thao tác cho phiếu mượn ${loan.id}`}
                        actions={[
                          {
                            label: "Chi tiết",
                            icon: Eye,
                            onSelect: () =>
                              navigate(`/admin/borrow/${loan.id}`),
                          },
                        ]}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loans.length && (
            <EmptyState
              title="Chưa có phiếu mượn"
              text="Các phiếu mượn mới sẽ hiển thị tại đây."
            />
          )}
        </section>
      )}
      {pendingAction && (
        <ConfirmDialog
          title={
            pendingAction.type === "return"
              ? "Xác nhận trả sách"
              : pendingAction.type === "lost"
                ? "Xác nhận mất sách"
                : "Xác nhận sách hỏng"
          }
          description={
            pendingAction.type === "return"
              ? "Xác nhận đã nhận lại bản sách này."
              : pendingAction.type === "lost"
                ? "Sự cố mất sách sẽ được ghi nhận."
                : "Sự cố hỏng sách sẽ được ghi nhận."
          }
          confirmLabel={
            pendingAction.type === "return" ? "Xác nhận trả" : "Xác nhận"
          }
          onClose={() => setPendingAction(undefined)}
          onConfirm={async () => {
            if (pendingAction.type === "return")
              await returnItem(pendingAction.loan, pendingAction.itemId);
            else
              await incident(
                pendingAction.loan,
                pendingAction.itemId,
                pendingAction.type,
              );
            setPendingAction(undefined);
          }}
        />
      )}
    </>
  );
}
