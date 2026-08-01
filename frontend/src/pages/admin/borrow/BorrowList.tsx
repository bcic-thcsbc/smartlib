import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { borrowApi } from "../../../api/borrowApi";
import type { Loan } from "../../../types/borrow";
import { Toolbar } from "../../../components/common/Toolbar";
import { EmptyState } from "../../../components/common/EmptyState";
import { errorMessage, formatDate } from "../../../utils/format";

export function BorrowList() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const navigate = useNavigate();
  const load = () => borrowApi.list().then((r) => setLoans(r.data.data));
  useEffect(() => {
    load();
  }, []);
  const returnItem = async (loan: Loan, itemId: number) => {
    if (!window.confirm("Xác nhận đã nhận lại bản sách này?")) return;
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
    if (
      !window.confirm(
        type === "lost"
          ? "Xác nhận mất bản sách?"
          : "Xác nhận bản sách bị hỏng?",
      )
    )
      return;
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
                        <div>
                          <button
                            className="row-action"
                            onClick={() => returnItem(loan, item.item_id)}
                          >
                            Trả
                          </button>
                          <button
                            className="row-action danger-text"
                            onClick={() =>
                              incident(loan, item.item_id, "damaged")
                            }
                          >
                            Hỏng
                          </button>
                          <button
                            className="row-action danger-text"
                            onClick={() => incident(loan, item.item_id, "lost")}
                          >
                            Mất
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </td>
                <td>{formatDate(loan.borrow_date)}</td>
                <td>{formatDate(loan.due_date)}</td>
                <td>
                  <span className={`status ${loan.status}`}>
                    {loan.status === "active"
                      ? "Đang mượn"
                      : loan.status === "overdue"
                        ? "Quá hạn"
                        : loan.status === "returned"
                          ? "Đã trả"
                          : "Trả một phần"}
                  </span>
                </td>
                <td>
                  {loan.status !== "returned" && (
                    <button
                      className="row-action"
                      onClick={() => navigate(`/admin/borrow/${loan.id}`)}
                    >
                      Chi tiết
                    </button>
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
    </>
  );
}
