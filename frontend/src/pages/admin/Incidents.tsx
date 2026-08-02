import { BadgeDollarSign, BookOpen, Check, HandCoins, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { operationsApi } from "../../api/operationsApi";
import { EmptyState } from "../../components/common/EmptyState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Selector } from "../../components/common/Selector";
import { Toolbar } from "../../components/common/Toolbar";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { PageError } from "../../components/common/PageError";
import { RowActionMenu } from "../../components/common/RowActionMenu";
import { errorMessage } from "../../utils/format";

type Incident = {
  id: number;
  full_name: string;
  username: string;
  title: string;
  inventory_code: string;
  type: "lost" | "damaged";
  amount?: number;
  description?: string;
  status: "open" | "resolved" | "waived";
};

const label = (status: string) =>
  ({ open: "Đang xử lý", resolved: "Đã giải quyết", waived: "Đã miễn" })[
    status
  ] || status;
const typeLabel = (type: string) =>
  type === "lost" ? "Mất sách" : "Sách hỏng";

export function Incidents() {
  const [items, setItems] = useState<Incident[]>([]);
  const [status, setStatus] = useState("open");
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ item: Incident; waive: boolean } | null>(null);

  const load = useCallback(() =>
    operationsApi
      .incidents(status)
      .then((response) => {
        setItems(response.data.data);
        setError(null);
      })
      .catch((loadError) =>
        setError(errorMessage(loadError, "Không thể tải sự cố sách")),
      ), [status]);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (item: Incident, waive = false) => {
    try {
      await operationsApi.resolveIncident(item.id, {
        status: waive ? "waived" : "resolved",
        amount: item.amount,
        description: item.description,
      });
      toast.success("Đã cập nhật sự cố");
      load();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể xử lý sự cố"));
    }
  };

  return (
    <>
      <Toolbar
        title="Sự cố sách"
        count={items.length}
        filters={
          <Selector
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Lọc trạng thái sự cố"
          >
            <option value="open">Đang xử lý</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="waived">Đã miễn</option>
          </Selector>
        }
      />
      {error && <PageError message={error} onRetry={() => void load()} />}
      {!error && (
      <section className="panel table-panel incidents-table">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Theo dõi bồi hoàn</p>
            <h3>Sự cố mất và hỏng</h3>
            <p className="muted">
              Xử lý từng sự cố theo hồ sơ; không làm thay đổi lịch sử lưu thông.
            </p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Thành viên</th>
              <th>Quyển sách</th>
              <th>Sự cố</th>
              <th>Bồi hoàn</th>
              <th>Trạng thái</th>
              <th aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="incident-cell">
                    <UserRound size={17} />
                    <div>
                      <strong>{item.full_name}</strong>
                      <small>Mã thành viên: {item.username}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="incident-cell">
                    <BookOpen size={17} />
                    <div>
                      <strong>{item.title}</strong>
                      <small className="mono">{item.inventory_code}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{typeLabel(item.type)}</strong>
                  {item.description && (
                    <small className="muted incident-note">
                      {item.description}
                    </small>
                  )}
                </td>
                <td>
                  <div className="incident-fee">
                    <BadgeDollarSign size={16} />
                    <span>
                      {item.amount
                        ? `${item.amount.toLocaleString("vi-VN")} đ`
                        : "Chưa ghi nhận"}
                    </span>
                  </div>
                </td>
                <td>
                  <StatusBadge status={item.status}>
                    {label(item.status)}
                  </StatusBadge>
                </td>
                <td>
                  {item.status === "open" && (
                    <RowActionMenu
                      label={`Thao tác cho sự cố ${item.inventory_code}`}
                      actions={[
                        { label: "Giải quyết", icon: Check, onSelect: () => setPendingAction({ item, waive: false }) },
                        { label: "Miễn bồi hoàn", icon: HandCoins, tone: "danger", onSelect: () => setPendingAction({ item, waive: true }) },
                      ]}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && (
          <EmptyState
            title="Không có sự cố phù hợp"
            text="Các sự cố mất hoặc hỏng sẽ hiển thị tại đây."
          />
        )}
      </section>
      )}
      {pendingAction && (
        <ConfirmDialog
          title={pendingAction.waive ? "Miễn bồi hoàn" : "Giải quyết sự cố"}
          description={pendingAction.waive ? `Miễn bồi hoàn cho ${pendingAction.item.inventory_code}? Thao tác này sẽ được lưu vào hồ sơ sự cố.` : `Xác nhận đã giải quyết sự cố của ${pendingAction.item.inventory_code}.`}
          confirmLabel={pendingAction.waive ? "Xác nhận miễn" : "Xác nhận giải quyết"}
          onClose={() => setPendingAction(null)}
          onConfirm={async () => {
            await resolve(pendingAction.item, pendingAction.waive);
            setPendingAction(null);
          }}
        />
      )}
    </>
  );
}
