import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { borrowApi } from "../../../api/borrowApi";
import type { Loan } from "../../../types/borrow";
import { Toolbar } from "../../../components/common/Toolbar";
import { EmptyState } from "../../../components/common/EmptyState";
import { errorMessage, formatDate } from "../../../utils/format";

export function MyBorrow() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const load = () => borrowApi.list().then((r) => setLoans(r.data.data));
  useEffect(() => {
    load();
  }, []);
  const renew = async (id: number) => {
    try {
      await borrowApi.renew(id);
      toast.success("Đã gia hạn phiếu mượn");
      load();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể gia hạn"));
    }
  };
  return (
    <>
      <Toolbar title="Sách tôi đang mượn" count={loans.length} />
      <section className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Sách</th>
              <th>Ngày mượn</th>
              <th>Hạn trả</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id}>
                <td>{loan.books}</td>
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
                  {["active", "partially_returned"].includes(loan.status) && (
                    <button
                      className="row-action"
                      onClick={() => renew(loan.id)}
                    >
                      Gia hạn
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loans.length && (
          <EmptyState
            title="Bạn chưa mượn sách nào"
            text="Lịch sử mượn sách sẽ được hiển thị tại đây."
          />
        )}
      </section>
    </>
  );
}
