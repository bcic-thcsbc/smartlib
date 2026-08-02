import { Bell, BookOpen, Menu } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { operationsApi } from "../../api/operationsApi";
import { useAuth } from "../../auth/useAuth";
import { initials } from "../../utils/format";

const labels: Record<string, string> = {
  dashboard: "Tổng quan", users: "Thành viên", books: "Tựa sách", "book-copies": "Quyển sách",
  borrow: "Mượn trả", "borrow-requests": "Yêu cầu mượn", profile: "Hồ sơ", "my-borrow": "Sách đang mượn",
  "my-requests": "Yêu cầu mượn", notifications: "Thông báo", reports: "Báo cáo", settings: "Cài đặt",
  incidents: "Sự cố sách", imports: "Nhập dữ liệu", new: "Tạo phiếu mượn",
};

const userLinks = [
  ["/user/dashboard", "Dashboard"], ["/user/books", "Sách"], ["/user/my-borrow", "Đang mượn"], ["/user/my-requests", "Yêu cầu"],
] as const;

export function AppHeader({ onMenu }: { onMenu?: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);
  const isAdmin = user?.role === "admin";
  const key = location.pathname.split("/").filter(Boolean).pop() || "dashboard";

  const loadUnread = useCallback(() => {
    if (!user) return;
    operationsApi.notifications().then((response) => setUnread(response.data.unread)).catch(() => setUnread(0));
  }, [user]);

  useEffect(() => {
    loadUnread();
    window.addEventListener("smartlib:notifications-changed", loadUnread);
    return () => window.removeEventListener("smartlib:notifications-changed", loadUnread);
  }, [loadUnread, location.pathname]);

  const open = (path: string) => {
    setAccountOpen(false);
    navigate(path);
  };

  return (
    <header className={`topbar ${isAdmin ? "admin-topbar" : "user-topbar"}`}>
      <div className="header-context">
        {isAdmin && onMenu && (
          <button className="icon-button menu-button" onClick={onMenu} aria-label="Mở menu" type="button">
            <Menu size={21} aria-hidden="true" />
          </button>
        )}
        {isAdmin ? (
          <div className="breadcrumbs" aria-label="Bạn đang ở">
            <span>Thủ thư</span><b>/</b><strong>{labels[key] || "SmartLib"}</strong>
          </div>
        ) : (
          <>
            <strong className="user-mobile-title">{labels[key] || "SmartLib"}</strong>
            <nav className="user-primary-nav" aria-label="Điều hướng chính">
              <Link className="user-header-brand" to="/user/dashboard"><BookOpen size={20} aria-hidden="true" /><span>SMARTLIB</span></Link>
              {userLinks.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
            </nav>
          </>
        )}
      </div>
      <div className="top-actions">
        <button className="icon-button notification-button" onClick={() => open(isAdmin ? "/admin/notifications" : "/user/notifications")} aria-label="Thông báo" title="Thông báo" type="button">
          <Bell size={19} aria-hidden="true" />
          {unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}
        </button>
        <button className="top-avatar" onClick={() => setAccountOpen((value) => !value)} aria-label="Mở menu tài khoản" type="button">
          {initials(user?.full_name)}
        </button>
        {accountOpen && (
          <div className="account-menu">
            <strong>{user?.full_name}</strong>
            <span>@{user?.username}</span>
            <button type="button" onClick={() => open(isAdmin ? "/admin/settings" : "/user/profile")}>Tài khoản và cài đặt</button>
            <button type="button" onClick={() => void logout()}>Đăng xuất</button>
          </div>
        )}
      </div>
    </header>
  );
}
