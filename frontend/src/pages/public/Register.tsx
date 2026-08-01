import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  School,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { FieldLabel } from "../../components/common/FieldLabel";
import { errorMessage } from "../../utils/format";

type UserType = "student" | "teacher";
type Form = {
  username: string;
  password: string;
  full_name: string;
  user_type: UserType;
  class_name: string;
  department: string;
  email: string;
  phone: string;
};

const empty: Form = {
  username: "",
  password: "",
  full_name: "",
  user_type: "student",
  class_name: "",
  department: "",
  email: "",
  phone: "",
};

export function Register() {
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(empty);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user)
      navigate(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard", {
        replace: true,
      });
  }, [user, navigate]);

  const detailKey = form.user_type === "student" ? "class_name" : "department";
  const detailLabel = form.user_type === "student" ? "Lớp học" : "Tổ bộ môn";
  const errors = useMemo(
    () => ({
      username: /^[a-zA-Z0-9._-]{3,64}$/.test(form.username)
        ? ""
        : "Tên đăng nhập gồm 3-64 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.",
      password:
        form.password.length >= 8 ? "" : "Mật khẩu cần ít nhất 8 ký tự.",
      full_name:
        form.full_name.trim().length >= 2 ? "" : "Nhập họ và tên đầy đủ.",
      class_name:
        form.user_type === "student" && form.class_name.trim()
          ? ""
          : form.user_type === "student"
            ? "Nhập lớp học."
            : "",
      department:
        form.user_type === "teacher" && form.department.trim()
          ? ""
          : form.user_type === "teacher"
            ? "Nhập tổ bộ môn."
            : "",
      email: /^\S+@\S+\.\S+$/.test(form.email) ? "" : "Nhập email hợp lệ.",
      phone: form.phone.trim().length >= 8 ? "" : "Nhập số điện thoại.",
    }),
    [form],
  );

  const update = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const invalid = (key: keyof typeof errors) =>
    submitted && Boolean(errors[key]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;

    setLoading(true);
    try {
      await register(form);
      toast.success("Đăng ký thành công");
      navigate("/user/dashboard", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, "Không thể tạo tài khoản"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-register">
        <Link to="/" className="auth-brand">
          <BookOpen size={22} />
          <span>SMARTLIB</span>
        </Link>
        <p className="eyebrow">Thư viện số Trường THCS Bình Chuẩn</p>
        <h1>Tạo tài khoản</h1>
        <p className="muted">
          Nhập đầy đủ thông tin của bạn để tạo tài khoản thư viện số.
        </p>
        {authLoading ? (
          <div className="auth-loading">Đang kiểm tra phiên đăng nhập...</div>
        ) : (
          <form onSubmit={submit} noValidate>
            <label>
              <FieldLabel required>Tên đăng nhập</FieldLabel>
              <input
                value={form.username}
                onChange={(event) => update("username", event.target.value)}
                autoComplete="username"
                aria-invalid={invalid("username")}
                required
              />
              {invalid("username") && (
                <small className="field-error">{errors.username}</small>
              )}
            </label>
            <label>
              <FieldLabel required>Mật khẩu</FieldLabel>
              <input
                type="password"
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                autoComplete="new-password"
                aria-invalid={invalid("password")}
                required
              />
              {invalid("password") && (
                <small className="field-error">{errors.password}</small>
              )}
            </label>
            <label>
              <FieldLabel required>Họ và tên</FieldLabel>
              <input
                value={form.full_name}
                onChange={(event) => update("full_name", event.target.value)}
                autoComplete="name"
                aria-invalid={invalid("full_name")}
                required
              />
              {invalid("full_name") && (
                <small className="field-error">{errors.full_name}</small>
              )}
            </label>
            <fieldset className="role-choice">
              <legend>
                <FieldLabel required>Vai trò</FieldLabel>
              </legend>
              <button
                type="button"
                onClick={() => update("user_type", "student")}
                className={
                  form.user_type === "student"
                    ? "role-option selected"
                    : "role-option"
                }
                aria-pressed={form.user_type === "student"}
              >
                <GraduationCap size={20} />
                <span>
                  <strong>Học sinh</strong>
                </span>
                <CheckCircle2 className="role-check" size={17} />
              </button>
              <button
                type="button"
                onClick={() => update("user_type", "teacher")}
                className={
                  form.user_type === "teacher"
                    ? "role-option selected"
                    : "role-option"
                }
                aria-pressed={form.user_type === "teacher"}
              >
                <School size={20} />
                <span>
                  <strong>Giáo viên</strong>
                </span>
                <CheckCircle2 className="role-check" size={17} />
              </button>
            </fieldset>
            <label>
              <FieldLabel required>{detailLabel}</FieldLabel>
              <input
                value={form[detailKey]}
                onChange={(event) => update(detailKey, event.target.value)}
                placeholder={
                  form.user_type === "student"
                    ? "Ví dụ: 7A1"
                    : "Ví dụ: Toán - Tin"
                }
                aria-invalid={invalid(detailKey)}
                required
              />
              {invalid(detailKey) && (
                <small className="field-error">{errors[detailKey]}</small>
              )}
            </label>
            <label>
              <FieldLabel required>Email</FieldLabel>
              <input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                autoComplete="email"
                aria-invalid={invalid("email")}
                required
              />
              {invalid("email") && (
                <small className="field-error">{errors.email}</small>
              )}
            </label>
            <label>
              <FieldLabel required>Số điện thoại</FieldLabel>
              <input
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={invalid("phone")}
                required
              />
              {invalid("phone") && (
                <small className="field-error">{errors.phone}</small>
              )}
            </label>
            <button className="primary wide" disabled={loading}>
              {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              <ArrowRight size={17} />
            </button>
          </form>
        )}
        <div className="auth-footer">
          <p>
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
          <Link to="/">Về trang chủ</Link>
        </div>
      </section>
    </main>
  );
}
