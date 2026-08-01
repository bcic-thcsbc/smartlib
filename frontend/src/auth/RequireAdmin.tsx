import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Link, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

export function RequireAdmin() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Outlet />;
  return (
    <main className="access-denied-page">
      <section className="access-denied-card">
        <div className="access-denied-icon">
          <ShieldAlert size={25} />
        </div>
        <p className="eyebrow">Khu vực vận hành</p>
        <h1>Tài khoản này chưa có quyền thủ thư.</h1>
        <p>
          SmartLib chỉ mở khu vực vận hành cho tài khoản có vai trò quản trị thư
          viện. Tài khoản thành viên vẫn có thể tra cứu và quản lý các yêu cầu
          mượn của mình.
        </p>
        <div className="access-denied-actions">
          <Link className="primary" to="/user/dashboard">
            Về cổng thư viện <ArrowLeft size={17} />
          </Link>
          <Link className="secondary" to="/">
            Trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
}
