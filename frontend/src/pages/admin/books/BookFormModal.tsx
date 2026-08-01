import { useState } from "react";
import { FieldLabel } from "../../../components/common/FieldLabel";
import { Modal } from "../../../components/common/Modal";
import type { Book } from "../../../types/book";

const empty = {
  title: "",
  author: "",
  publisher: "",
  publish_year: 0,
  category: "",
  description: "",
  page_count: 0,
  cover_image: "",
  quantity: 1,
  shelf: "",
};

type BookFormModalProps = {
  initial?: Partial<Book>;
  onClose: () => void;
  onSave: (form: typeof empty) => void;
};

export function BookFormModal({
  initial,
  onClose,
  onSave,
}: BookFormModalProps) {
  const [form, setForm] = useState({ ...empty, ...initial });
  const creating = !initial?.id;

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Modal
      title={creating ? "Thêm tựa sách" : "Chỉnh sửa tựa sách"}
      onClose={onClose}
    >
      <div className="form-grid">
        <label>
          <FieldLabel required>Tên tựa sách</FieldLabel>
          <input
            value={form.title || ""}
            onChange={(event) => update("title", event.target.value)}
            required
          />
        </label>
        <label>
          <FieldLabel>Tác giả</FieldLabel>
          <input
            value={form.author || ""}
            onChange={(event) => update("author", event.target.value)}
          />
        </label>
        <label>
          <FieldLabel>Nhà xuất bản</FieldLabel>
          <input
            value={form.publisher || ""}
            onChange={(event) => update("publisher", event.target.value)}
          />
        </label>
        <label>
          <FieldLabel>Năm xuất bản</FieldLabel>
          <input
            type="number"
            min="0"
            value={form.publish_year || 0}
            onChange={(event) => update("publish_year", event.target.value)}
          />
        </label>
        <label>
          <FieldLabel>Thể loại</FieldLabel>
          <input
            value={form.category || ""}
            onChange={(event) => update("category", event.target.value)}
          />
        </label>
        <label>
          <FieldLabel>Số trang</FieldLabel>
          <input
            type="number"
            min="0"
            value={form.page_count || 0}
            onChange={(event) => update("page_count", event.target.value)}
          />
        </label>
        {creating && (
          <>
            <label>
              <FieldLabel required>Số quyển</FieldLabel>
              <input
                type="number"
                min="1"
                max="500"
                value={form.quantity}
                onChange={(event) => update("quantity", event.target.value)}
              />
            </label>
            <label>
              <FieldLabel>Kệ sách</FieldLabel>
              <input
                value={form.shelf || ""}
                placeholder="Ví dụ: Kệ A1"
                onChange={(event) => update("shelf", event.target.value)}
              />
            </label>
          </>
        )}
        <label className="form-wide">
          <FieldLabel>URL bìa</FieldLabel>
          <input
            value={form.cover_image || ""}
            onChange={(event) => update("cover_image", event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="form-wide">
          <FieldLabel>Mô tả</FieldLabel>
          <textarea
            value={form.description || ""}
            onChange={(event) => update("description", event.target.value)}
            rows={4}
          />
        </label>
      </div>
      <div className="modal-actions">
        <button className="secondary" type="button" onClick={onClose}>
          Hủy
        </button>
        <button
          className="primary"
          type="button"
          disabled={
            !String(form.title || "").trim() ||
            (creating && Number(form.quantity) < 1)
          }
          onClick={() => onSave(form)}
        >
          {creating ? "Tạo tựa sách" : "Lưu thay đổi"}
        </button>
      </div>
    </Modal>
  );
}
