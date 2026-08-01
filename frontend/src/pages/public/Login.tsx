import { ArrowRight, BookOpen } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { FieldLabel } from "../../components/common/FieldLabel";
import { errorMessage } from "../../utils/format";

export function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user)
      navigate(user.role === "admin" ? "/admin/dashboard" : "/user/dashboard", {
        replace: true,
      });
  }, [user, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const account = await login(username, password);
      toast.success("Đăng nhập thành công");
      const from = (location.state as { from?: { pathname?: string } })?.from
        ?.pathname;
      navigate(
        from ||
        (account.role === "admin" ? "/admin/dashboard" : "/user/dashboard"),
        { replace: true },
      );
    } catch (error) {
      toast.error(errorMessage(error, "Không thể đăng nhập"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          <BookOpen size={22} />
          <span>SMARTLIB</span>
        </Link>
        <p className="eyebrow">Thư viện số Trường THCS Bình Chuẩn</p>
        <h1>Đăng nhập</h1>
        <p className="muted">Dùng tài khoản thư viện số của bạn để tiếp tục.</p>
        {authLoading ? (
          <div className="auth-loading">Đang kiểm tra phiên đăng nhập...</div>
        ) : (
          <form onSubmit={submit}>
            <label>
              <FieldLabel required>Tên đăng nhập</FieldLabel>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
                autoFocus
              />
            </label>
            <label>
              <FieldLabel required>Mật khẩu</FieldLabel>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <button className="primary wide" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              <ArrowRight size={17} />
            </button>
          </form>
        )}
        <div className="auth-footer">
          <p>
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </p>
          <Link to="/">Về trang chủ</Link>
        </div>
      </section>
    </main>
  );
}
