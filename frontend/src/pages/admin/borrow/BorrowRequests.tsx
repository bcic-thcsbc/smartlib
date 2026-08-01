import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { borrowApi } from "../../../api/borrowApi";
import { EmptyState } from "../../../components/common/EmptyState";
import { Toolbar } from "../../../components/common/Toolbar";
import type { BorrowRequest } from "../../../types/borrow";
import { errorMessage, formatDate } from "../../../utils/format";

const statusLabel = (value: string) =>
  ({
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    fulfilled: "Đã giao",
    rejected: "Từ chối",
    cancelled: "Đã hủy",
  })[value] || value;

export function BorrowRequests() {
  const [items, setItems] = useState<BorrowRequest[]>([]);
  const load = () =>
    borrowApi.requests().then((response) => setItems(response.data.data));

  useEffect(() => {
    load();
  }, []);

  const act = async (id: number, action: "approve" | "reject" | "checkout") => {
    try {
      if (action === "approve") await borrowApi.approveRequest(id);
      if (action === "reject")
        await borrowApi.rejectRequest(
          id,
          "Thư viện chưa thể đáp ứng yêu cầu này.",
        );
      if (action === "checkout") await borrowApi.checkoutRequest(id);
      toast.success(
        action === "approve"
          ? "Đã duyệt và tự chọn quyển phù hợp"
          : action === "reject"
            ? "Đã từ chối yêu cầu và giải phóng lịch đặt"
            : "Đã xác nhận giao quyển sách",
      );
      load();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể cập nhật yêu cầu"));
    }
  };

  return (
    <>
      <Toolbar title="Yêu cầu mượn" count={items.length} />
      <section className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Người yêu cầu</th>
              <th>Tựa sách</th>
              <th>Lịch mượn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.full_name}</td>
                <td>
                  <strong>{item.title}</strong>
                  <small className="request-book-meta">
                    {item.author ? `Tác giả: ${item.author}` : "Tác giả chưa cập nhật"}
                    {item.publisher ? ` · NXB ${item.publisher}` : ""}
                    {item.category ? ` · ${item.category}` : ""}
                  </small>
                </td>
                <td>
                  {formatDate(
                    (item as any).desired_start_date || item.requested_at,
                  )}{" "}
                  → {formatDate((item as any).planned_due_date)}
                </td>
                <td>
                  <span className={`status ${item.status}`}>
                    {statusLabel(item.status)}
                  </span>
                </td>
                <td>
                  {item.status === "pending" && (
                    <>
                      <button
                        className="row-action"
                        onClick={() => void act(item.id, "approve")}
                      >
                        Duyệt tự động
                      </button>
                      <button
                        className="row-action danger-text"
                        onClick={() => void act(item.id, "reject")}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {item.status === "approved" &&
                    item.reservation_status === "ready_for_pickup" && (
                      <button
                        className="row-action"
                        onClick={() => void act(item.id, "checkout")}
                      >
                        Xác nhận giao
                      </button>
                    )}
                  {item.status === "approved" &&
                    item.reservation_status !== "ready_for_pickup" && (
                      <span className="muted">
                        Chờ ngày nhận {formatDate(item.desired_start_date)}
                      </span>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && (
          <EmptyState
            title="Không có yêu cầu"
            text="Yêu cầu mới của độc giả sẽ hiển thị tại đây."
          />
        )}
      </section>
    </>
  );
}
