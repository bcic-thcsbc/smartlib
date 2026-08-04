import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Mars,
  Presentation,
  Venus,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { operationsApi } from "../../api/operationsApi";
import { useAuth } from "../../auth/useAuth";
import { FieldLabel } from "../../components/common/FieldLabel";
import { Selector } from "../../components/common/Selector";
import { errorMessage } from "../../utils/format";
import {
  normalizeClassName,
  validClassName,
  validPhone,
} from "../../utils/validation";

type UserType = "student" | "teacher";
type Form = {
  username: string;
  password: string;
  full_name: string;
  gender: "male" | "female";
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
  gender: "male",
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
  const [departments, setDepartments] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    operationsApi
      .departments()
      .then((response) =>
        setDepartments(response.data.map((item) => item.name)),
      );
  }, []);
  useEffect(() => {
    if (user)
      navigate(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard", {
        replace: true,
      });
  }, [user, navigate]);
  const errors = useMemo(
    () => ({
      username: /^[a-zA-Z0-9._-]{3,64}$/.test(form.username)
        ? ""
        : "Tên đăng nhập gồm 3-64 ký tự chữ, số hoặc dấu . _ -.",
      password:
        form.password.length >= 8 ? "" : "Mật khẩu cần ít nhất 8 ký tự.",
      full_name:
        form.full_name.trim().length >= 2 ? "" : "Nhập họ và tên đầy đủ.",
      class_name:
        form.user_type !== "student" || validClassName(form.class_name)
          ? ""
          : "Lớp sai định dạng.",
      department:
        form.user_type !== "teacher" || form.department
          ? ""
          : "Chọn tổ bộ môn.",
      email: /^\S+@\S+\.\S+$/.test(form.email) ? "" : "Nhập email hợp lệ.",
      phone: validPhone(form.phone) ? "" : "Số điện thoại không hợp lệ.",
    }),
    [form],
  );
  const update = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const invalid = (key: keyof typeof errors) =>
    (submitted ||
      (key === "phone" && form.phone.length > 0) ||
      (key === "class_name" && form.class_name.length > 0)) &&
    Boolean(errors[key]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    setLoading(true);
    try {
      await register({
        ...form,
        class_name: normalizeClassName(form.class_name),
      });
      toast.success("Đăng ký thành công");
      navigate("/user/dashboard", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, "Không thể tạo tài khoản"));
    } finally {
      setLoading(false);
    }
  };
  const roles = [
    ["student", "Học sinh", GraduationCap],
    ["teacher", "Giáo viên", Presentation],
  ] as const;
  const genders = [
    ["male", "Nam", Mars],
    ["female", "Nữ", Venus],
  ] as const;
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
          Thông tin này giúp thư viện phục vụ đúng đối tượng.
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
              />
              {invalid("full_name") && (
                <small className="field-error">{errors.full_name}</small>
              )}
            </label>
            <fieldset className="role-choice compact">
              <legend>
                <FieldLabel required>Vai trò</FieldLabel>
              </legend>
              {roles.map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update("user_type", value)}
                  className={
                    form.user_type === value
                      ? "role-option selected"
                      : "role-option"
                  }
                  aria-pressed={form.user_type === value}
                >
                  <Icon size={18} />
                  <strong>{label}</strong>
                  <CheckCircle2 className="role-check" size={16} />
                </button>
              ))}
            </fieldset>
            <fieldset className="role-choice compact">
              <legend>
                <FieldLabel required>Giới tính</FieldLabel>
              </legend>
              {genders.map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update("gender", value)}
                  className={
                    form.gender === value
                      ? "role-option selected"
                      : "role-option"
                  }
                  aria-pressed={form.gender === value}
                >
                  <Icon size={18} />
                  <strong>{label}</strong>
                  <CheckCircle2 className="role-check" size={16} />
                </button>
              ))}
            </fieldset>
            {form.user_type === "student" ? (
              <label>
                <FieldLabel required>Lớp</FieldLabel>
                <input
                  value={form.class_name}
                  onChange={(event) =>
                    update("class_name", normalizeClassName(event.target.value))
                  }
                  placeholder="Ví dụ: 7A1"
                  aria-invalid={invalid("class_name")}
                />
                {invalid("class_name") && (
                  <small className="field-error">{errors.class_name}</small>
                )}
              </label>
            ) : (
              <label>
                <FieldLabel required>Tổ bộ môn</FieldLabel>
                <Selector
                  value={form.department}
                  searchable
                  onChange={(event) => update("department", event.target.value)}
                >
                  <option value="">Chọn tổ bộ môn</option>
                  {departments.map((name) => (
                    <option value={name} key={name}>
                      {name}
                    </option>
                  ))}
                </Selector>
                {invalid("department") && (
                  <small className="field-error">{errors.department}</small>
                )}
              </label>
            )}
            <label>
              <FieldLabel required>Email</FieldLabel>
              <input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                autoComplete="email"
                aria-invalid={invalid("email")}
              />
              {invalid("email") && (
                <small className="field-error">{errors.email}</small>
              )}
            </label>
            <label>
              <FieldLabel required>Số điện thoại</FieldLabel>
              <input
                value={form.phone}
                maxLength={10}
                onChange={(event) =>
                  update("phone", event.target.value.replace(/\D/g, ""))
                }
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={invalid("phone")}
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
