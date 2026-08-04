import { CheckCheck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { operationsApi, type Notification } from "../../api/operationsApi";
import { EmptyState } from "../../components/common/EmptyState";
import { Modal } from "../../components/common/Modal";
import { PageError } from "../../components/common/PageError";
import { Toolbar } from "../../components/common/Toolbar";
import {
  errorMessage,
  formatDateTime,
  formatEmbeddedDates,
} from "../../utils/format";

const notificationEvent = "smartlib:notifications-changed";

function notifyHeader() {
  window.dispatchEvent(new Event(notificationEvent));
}

export function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [selected, setSelected] = useState<Notification>();
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      operationsApi
        .notifications()
        .then((response) => {
          setItems(response.data.data);
          setError("");
        })
        .catch((requestError) =>
          setError(errorMessage(requestError, "Không thể tải thông báo.")),
        ),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (item: Notification) => {
    if (item.read_at) return;

    await operationsApi.readNotification(item.id);
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, read_at: new Date().toISOString() }
          : entry,
      ),
    );
    setSelected((current) =>
      current?.id === item.id
        ? { ...current, read_at: new Date().toISOString() }
        : current,
    );
    notifyHeader();
  };

  const open = async (item: Notification) => {
    setSelected(item);
    await markRead(item);
  };

  const markAllRead = async () => {
    await operationsApi.readAllNotifications();
    setItems((current) =>
      current.map((item) => ({
        ...item,
        read_at: item.read_at || new Date().toISOString(),
      })),
    );
    notifyHeader();
  };

  const unread = items.filter((item) => !item.read_at).length;

  return (
    <>
      <Toolbar title="Thông báo" count={items.length} />
      {error ? (
        <PageError message={error} onRetry={load} />
      ) : (
        <section className="panel notifications-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Hộp thư</p>
              <h3>
                {unread
                  ? `${unread} thông báo chưa đọc`
                  : "Bạn đã đọc tất cả thông báo"}
              </h3>
            </div>
            {unread > 0 && (
              <button
                className="secondary"
                type="button"
                onClick={() => void markAllRead()}
              >
                <CheckCheck size={16} />
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="activity-list">
            {items.map((item) => (
              <button
                className={`activity-row notification-row ${item.read_at ? "" : "unread"}`}
                key={item.id}
                type="button"
                onClick={() => void open(item)}
              >
                <div className="activity-icon">•</div>
                <div>
                  <strong>{item.title}</strong>
                  <span>{formatEmbeddedDates(item.body)}</span>
                </div>
                <time>{formatDateTime(item.created_at)}</time>
              </button>
            ))}
          </div>
          {!items.length && (
            <EmptyState
              title="Chưa có thông báo"
              text="Các cập nhật về yêu cầu và phiếu mượn sẽ hiển thị tại đây."
            />
          )}
        </section>
      )}
      {selected && (
        <Modal title="Thông báo" onClose={() => setSelected(undefined)}>
          <article className="notification-detail">
            <div className="notification-detail-heading">
              <div className="activity-icon">•</div>
              <div>
                <p className="eyebrow">{formatDateTime(selected.created_at)}</p>
                <h3>{selected.title}</h3>
              </div>
            </div>
            <p>{formatEmbeddedDates(selected.body)}</p>
          </article>
          <div className="modal-actions">
            <button
              className="primary"
              type="button"
              onClick={() => setSelected(undefined)}
            >
              <X size={16} />
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
