import { Phone, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { operationsApi } from "../../../api/operationsApi";
import { FieldLabel } from "../../../components/common/FieldLabel";
import { Modal } from "../../../components/common/Modal";
import { Selector } from "../../../components/common/Selector";
import { normalizeClassName, validClassName, validPhone } from "../../../utils/validation";

export function UserFormModal({ initial, onClose, onSave }: { initial: any; onClose: () => void; onSave: (data: any) => void }) {
  const [departments, setDepartments] = useState<string[]>([]);
  const [form, setForm] = useState({ gender: initial.gender || "male", phone: initial.phone || "", email: initial.email || "", class_name: initial.class_name || "", department: initial.department || "" });
  useEffect(() => { operationsApi.departments().then((r) => setDepartments(r.data.map((item) => item.name))); }, []);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const librarian = initial.role === "admin";
  const valid = validPhone(form.phone) && (librarian || initial.user_type !== "student" || validClassName(form.class_name));
  return <Modal title="Chỉnh sửa thành viên" onClose={onClose}><section className="member-editor-head"><div className="member-editor-icon"><UserRound size={19} /></div><div><strong>{initial.full_name}</strong><span>@{initial.username}</span><small>{initial.role === "admin" ? "Thủ thư" : initial.user_type === "student" ? "Độc giả · Học sinh" : "Độc giả · Giáo viên"}</small></div></section><div className="form-grid">{!librarian && <label><FieldLabel>{initial.user_type === "student" ? "Lớp" : "Tổ bộ môn"}</FieldLabel>{initial.user_type === "student" ? <input value={form.class_name} onChange={(e) => update("class_name", normalizeClassName(e.target.value))} /> : <Selector value={form.department} onChange={(e) => update("department", e.target.value)}><option value="">Chọn tổ bộ môn</option>{departments.map((name) => <option key={name} value={name}>{name}</option>)}</Selector>}</label>}<label><FieldLabel>Email</FieldLabel><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></label><label><FieldLabel icon={Phone}>Số điện thoại</FieldLabel><input maxLength={10} value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))} />{form.phone && !validPhone(form.phone) && <small className="field-error">Số điện thoại không hợp lệ.</small>}</label><label><FieldLabel>Giới tính</FieldLabel><Selector value={form.gender} onChange={(e) => update("gender", e.target.value)}><option value="male">Nam</option><option value="female">Nữ</option></Selector></label></div><div className="modal-actions"><button className="secondary" type="button" onClick={onClose}>Hủy</button><button className="primary" type="button" disabled={!valid} onClick={() => onSave(form)}>Lưu thay đổi</button></div></Modal>;
}
