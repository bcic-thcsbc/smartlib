import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { borrowApi } from "../../../api/borrowApi";
import type { BorrowRequest } from "../../../types/borrow";
import { Toolbar } from "../../../components/common/Toolbar";
import { EmptyState } from "../../../components/common/EmptyState";
import {
  errorMessage,
  formatDate,
  formatDateTime,
} from "../../../utils/format";

export function MyRequests() {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const load = () =>
    borrowApi.requests().then((response) => setRequests(response.data.data));
  useEffect(() => {
    load();
  }, []);
  const cancel = async (id: number) => {
    try {
      await borrowApi.cancelRequest(id);
      toast.success("Đã hủy yêu cầu");
      load();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể hủy yêu cầu"));
    }
  };
  const status = (value: string) =>
    ({
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      fulfilled: "Đã nhận",
      rejected: "Từ chối",
      expired: "Hết hạn",
      cancelled: "Đã hủy",
    })[value] || value;
  return (
    <>
      <Toolbar title="Yêu cầu mượn sách" count={requests.length} />
      <section className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Tựa sách</th>
              <th>Lịch mượn</th>
              <th>Hạn nhận</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {requests.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.title}</strong>
                </td>
                <td>
                  {formatDate(item.desired_start_date)} →{" "}
                  {formatDate(item.planned_due_date)}
                </td>
                <td>
                  {item.pickup_deadline
                    ? formatDateTime(item.pickup_deadline)
                    : `Sẽ thông báo vào ${formatDate(item.desired_start_date)}`}
                </td>
                <td>
                  <span className={`status ${item.status}`}>
                    {status(item.status)}
                  </span>
                  {item.reason && (
                    <small className="muted">{item.reason}</small>
                  )}
                </td>
                <td>
                  {["pending", "approved"].includes(item.status) && (
                    <button
                      className="row-action danger-text"
                      onClick={() => void cancel(item.id)}
                    >
                      Hủy
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!requests.length && (
          <EmptyState
            title="Chưa có yêu cầu"
            text="Các yêu cầu mượn sách của bạn sẽ xuất hiện tại đây."
          />
        )}
      </section>
    </>
  );
}
