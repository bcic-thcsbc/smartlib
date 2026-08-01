import { Search, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { bookApi } from "../../../api/bookApi";
import { borrowApi } from "../../../api/borrowApi";
import { userApi } from "../../../api/userApi";
import { FieldLabel } from "../../../components/common/FieldLabel";
import { Selector } from "../../../components/common/Selector";
import type { BookCopy } from "../../../types/book";
import type { User } from "../../../types/user";
import { errorMessage } from "../../../utils/format";
import { normalizeClassName, validClassName, validPhone } from "../../../utils/validation";

type Mode = "existing" | "visitor";
const today = () => new Date().toISOString().slice(0, 10);
const defaultDue = () => { const date = new Date(); date.setDate(date.getDate() + 14); return date.toISOString().slice(0, 10); };

export function BorrowCreate() {
  const navigate = useNavigate(); const [mode, setMode] = useState<Mode>("existing");
  const [users, setUsers] = useState<User[]>([]); const [copies, setCopies] = useState<BookCopy[]>([]);
  const [userId, setUserId] = useState(""); const [copyId, setCopyId] = useState(""); const [due, setDue] = useState(defaultDue());
  const [query, setQuery] = useState(""); const [visitor, setVisitor] = useState<{ full_name: string; gender: "male" | "female"; class_name: string; email: string; phone: string }>({ full_name: "", gender: "male", class_name: "", email: "", phone: "" }); const [saving, setSaving] = useState(false);
  useEffect(() => { Promise.all([userApi.list({ limit: 100 }), bookApi.copies({ limit: 100, status: "available" })]).then(([u, c]) => { setUsers(u.data.data); setCopies(c.data.data); }); }, []);
  const filteredUsers = useMemo(() => users.filter((user) => user.role === "user" && user.status === "active" && `${user.full_name} ${user.username} ${user.class_name || user.department || ""}`.toLowerCase().includes(query.toLowerCase())), [users, query]);
  const visitorValid = visitor.full_name.trim().length >= 2 && validClassName(visitor.class_name) && /^\S+@\S+\.\S+$/.test(visitor.email) && validPhone(visitor.phone);
  const submit = async () => { if (!copyId || !due || (mode === "existing" && !userId) || (mode === "visitor" && !visitorValid)) return; setSaving(true); try {
    const response = await borrowApi.create({ user_id: mode === "existing" ? Number(userId) : undefined, visitor: mode === "visitor" ? { ...visitor, class_name: normalizeClassName(visitor.class_name) } : undefined, copy_ids: [Number(copyId)], due_date: due });
    if (response.data.created_visitor) toast.success(`Đã tạo tài khoản ${response.data.created_visitor.username}. Mật khẩu mặc định trùng tên đăng nhập.`); else toast.success("Đã tạo phiếu mượn"); navigate("/admin/borrow");
  } catch (error) { toast.error(errorMessage(error, "Không thể tạo phiếu mượn")); } finally { setSaving(false); } };
  return <section className="borrow-create section-stack"><header className="page-header"><div><p className="eyebrow">Lưu thông thư viện</p><h2>Tạo phiếu mượn</h2><p className="muted">Chọn người dùng hiện có hoặc ghi nhận độc giả vãng lai ngay tại quầy.</p></div></header>
    <div className="segmented" role="tablist"><button className={mode === "existing" ? "selected" : ""} onClick={() => setMode("existing")}><Users size={17} />Người dùng hiện có</button><button className={mode === "visitor" ? "selected" : ""} onClick={() => setMode("visitor")}><UserPlus size={17} />Độc giả vãng lai</button></div>
    <div className="borrow-workspace"><section className="panel"><div className="panel-heading"><div><p className="eyebrow">Người mượn</p><h3>{mode === "existing" ? "Tra cứu thành viên" : "Thông tin độc giả"}</h3></div></div>{mode === "existing" ? <><div className="search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm họ tên, username hoặc lớp" /></div><div className="borrow-user-list">{filteredUsers.map((user) => <button type="button" className={userId === String(user.id) ? "borrow-user selected" : "borrow-user"} key={user.id} onClick={() => setUserId(String(user.id))}><strong>{user.full_name}</strong><span>{user.class_name || user.department} · @{user.username}</span></button>)}</div></> : <div className="form-grid"><label><FieldLabel required>Họ và tên</FieldLabel><input value={visitor.full_name} onChange={(e) => setVisitor({ ...visitor, full_name: e.target.value })} /></label><label><FieldLabel required>Giới tính</FieldLabel><Selector value={visitor.gender} onChange={(e) => setVisitor({ ...visitor, gender: e.target.value as "male" | "female" })}><option value="male">Nam</option><option value="female">Nữ</option></Selector></label><label><FieldLabel required>Lớp</FieldLabel><input value={visitor.class_name} onChange={(e) => setVisitor({ ...visitor, class_name: normalizeClassName(e.target.value) })} placeholder="Ví dụ: 8A12" /></label><label><FieldLabel required>Email</FieldLabel><input type="email" value={visitor.email} onChange={(e) => setVisitor({ ...visitor, email: e.target.value })} /></label><label><FieldLabel required>Số điện thoại</FieldLabel><input inputMode="tel" maxLength={10} value={visitor.phone} onChange={(e) => setVisitor({ ...visitor, phone: e.target.value.replace(/\D/g, "") })} />{visitor.phone && !validPhone(visitor.phone) && <small className="field-error">Số điện thoại không hợp lệ.</small>}</label></div>}</section>
      <section className="panel"><div className="panel-heading"><div><p className="eyebrow">Bản sách</p><h3>Chọn sách khả dụng</h3></div></div><div className="form-grid"><label><FieldLabel required>Quyển sách</FieldLabel><Selector value={copyId} searchable searchPlaceholder="Tìm tựa sách hoặc mã quyển" onChange={(e) => setCopyId(e.target.value)}><option value="">Chọn quyển sách</option>{copies.map((copy) => <option key={copy.id} value={copy.id}>{copy.title} · {copy.inventory_code}</option>)}</Selector></label><label><FieldLabel required>Hạn trả</FieldLabel><input type="date" min={today()} value={due} onChange={(e) => setDue(e.target.value)} /></label></div><div className="modal-actions"><button className="secondary" type="button" onClick={() => navigate("/admin/borrow")}>Hủy</button><button className="primary" type="button" disabled={saving || !copyId || !due || (mode === "existing" ? !userId : !visitorValid)} onClick={() => void submit()}>{saving ? "Đang tạo..." : "Xác nhận mượn"}</button></div></section></div>
  </section>;
}
