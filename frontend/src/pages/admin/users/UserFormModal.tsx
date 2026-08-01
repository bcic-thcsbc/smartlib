import { CalendarDays, Mail, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import { FieldLabel } from "../../../components/common/FieldLabel";
import { Modal } from "../../../components/common/Modal";

type UserFormModalProps = {
  initial: any;
  onClose: () => void;
  onSave: (data: any) => void;
};

export function UserFormModal({
  initial,
  onClose,
  onSave,
}: UserFormModalProps) {
  const [form, setForm] = useState({
    gender: initial.gender || "",
    date_of_birth: initial.date_of_birth || "",
    phone: initial.phone || "",
    email: initial.email || "",
    class_name: initial.class_name || "",
    department: initial.department || "",
  });
  const librarian = initial.role === "admin";
  const typeLabel = librarian
    ? "Thủ thư"
    : initial.user_type === "student"
      ? "Độc giả · Học sinh"
      : "Độc giả · Giáo viên";
  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Modal title="Chỉnh sửa thành viên" onClose={onClose}>
      <section className="member-editor-head">
        <div className="member-editor-icon">
          <UserRound size={19} />
        </div>
        <div>
          <strong>{initial.full_name}</strong>
          <span>@{initial.username}</span>
          <small>{typeLabel}</small>
        </div>
      </section>
      <p className="identity-note">
        Tên đăng nhập, họ tên và vai trò được giữ nguyên sau khi tạo tài khoản.
      </p>
      <div className="form-grid">
        {!librarian && (
          <label>
            <FieldLabel>
              {initial.user_type === "student" ? "Lớp" : "Tổ bộ môn"}
            </FieldLabel>
            <input
              value={
                initial.user_type === "student"
                  ? form.class_name
                  : form.department
              }
              onChange={(event) =>
                update(
                  initial.user_type === "student" ? "class_name" : "department",
                  event.target.value,
                )
              }
            />
          </label>
        )}
        <label>
          <FieldLabel icon={Mail}>Email</FieldLabel>
          <input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </label>
        <label>
          <FieldLabel icon={Phone}>Số điện thoại</FieldLabel>
          <input
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
          />
        </label>
        <label>
          <FieldLabel>Giới tính</FieldLabel>
          <input
            value={form.gender}
            onChange={(event) => update("gender", event.target.value)}
          />
        </label>
        <label>
          <FieldLabel icon={CalendarDays}>Ngày sinh</FieldLabel>
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(event) => update("date_of_birth", event.target.value)}
          />
        </label>
      </div>
      <div className="modal-actions">
        <button className="secondary" type="button" onClick={onClose}>
          Hủy
        </button>
        <button className="primary" type="button" onClick={() => onSave(form)}>
          Lưu thay đổi
        </button>
      </div>
    </Modal>
  );
}
