import { useState } from "react";
import toast from "react-hot-toast";
import { bookApi } from "../../../api/bookApi";
import { FieldLabel } from "../../../components/common/FieldLabel";
import { Modal } from "../../../components/common/Modal";
import { Selector } from "../../../components/common/Selector";
import type { BookCopy } from "../../../types/book";
import { errorMessage } from "../../../utils/format";

type CopyEditModalProps = {
  copy: BookCopy;
  onClose: () => void;
  onSaved: () => void;
};

export function CopyEditModal({ copy, onClose, onSaved }: CopyEditModalProps) {
  const [form, setForm] = useState({
    status: copy.status,
    shelf: copy.shelf || "",
  });
  const save = async () => {
    try {
      await bookApi.updateCopy(copy.id, form);
      toast.success("Đã cập nhật quyển sách");
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể cập nhật quyển sách"));
    }
  };

  return (
    <Modal title={`Chỉnh sửa ${copy.inventory_code}`} onClose={onClose}>
      <div className="form-grid">
        <label>
          <FieldLabel>Trạng thái vận hành</FieldLabel>
          <Selector
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value })
            }
          >
            <option value="available">Sẵn sàng</option>
            <option value="lost">Thất lạc</option>
            <option value="damaged">Hư hỏng</option>
          </Selector>
        </label>
        <label>
          <FieldLabel>Kệ sách</FieldLabel>
          <input
            value={form.shelf}
            onChange={(event) =>
              setForm({ ...form, shelf: event.target.value })
            }
          />
        </label>
      </div>
      <div className="modal-actions">
        <button className="secondary" type="button" onClick={onClose}>
          Hủy
        </button>
        <button className="primary" type="button" onClick={() => void save()}>
          Lưu thay đổi
        </button>
      </div>
    </Modal>
  );
}
