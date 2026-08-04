import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="confirm-dialog">
        <AlertTriangle size={22} aria-hidden="true" />
        <p>{description}</p>
      </div>
      <div className="modal-actions">
        <button className="secondary" type="button" onClick={onClose}>
          Hủy
        </button>
        <button
          className="danger-button"
          type="button"
          onClick={() => void onConfirm()}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
