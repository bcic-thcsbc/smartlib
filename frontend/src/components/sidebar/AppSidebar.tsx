import {
  Bell,
  BookOpen,
  Boxes,
  ChartNoAxesCombined,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  FileSpreadsheet,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { initials } from "../../utils/format";

const adminGroups = [
  {
    label: "Vận hành",
    links: [
      ["/admin/dashboard", "Tổng quan", LayoutDashboard],
      ["/admin/borrow-requests", "Yêu cầu mượn", ClipboardList],
      ["/admin/borrow", "Mượn trả", ClipboardList],
      ["/admin/incidents", "Sự cố sách", ShieldAlert],
    ],
  },
  {
    label: "Kho sách",
    links: [
      ["/admin/books", "Tựa sách", BookOpen],
      ["/admin/book-copies", "Quyển sách", Boxes],
      ["/admin/imports", "Nhập dữ liệu", FileSpreadsheet],
    ],
  },
  {
    label: "Thành viên và thiết lập",
    links: [
      ["/admin/users", "Thành viên", Users],
      ["/admin/reports", "Báo cáo", ChartNoAxesCombined],
      ["/admin/notifications", "Thông báo", Bell],
      ["/admin/settings", "Cài đặt", Settings],
    ],
  },
] as const;
const userGroups = [
  {
    label: "Không gian của bạn",
    links: [
      ["/user/dashboard", "Trang chủ", LayoutDashboard],
      ["/user/books", "Tìm sách", BookOpen],
      ["/user/my-requests", "Yêu cầu mượn", ClipboardList],
      ["/user/my-borrow", "Sách đang mượn", ClipboardList],
    ],
  },
  {
    label: "Tài khoản",
    links: [
      ["/user/notifications", "Thông báo", Bell],
      ["/user/profile", "Hồ sơ cá nhân", CircleUserRound],
    ],
  },
] as const;

export function AppSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const groups = user?.role === "admin" ? adminGroups : userGroups;
  const roleLabel = user?.role === "admin" ? "Thủ thư" : "Độc giả";
  return (
    <aside className={open ? "sidebar open" : "sidebar"}>
      <div className="sidebar-top">
        <NavLink to="/" onClick={onClose} className="brand-mark sidebar-brand">
          <BookOpen size={21} />
          <span>SMARTLIB</span>
        </NavLink>
        <button
          className="icon-button close-mobile"
          onClick={onClose}
          aria-label="Đóng menu"
        >
          <X size={19} />
        </button>
      </div>
      <div className="school-name">
        Trường THCS Bình Chuẩn
        <br />
        <span>
          {user?.role === "admin" ? "Không gian vận hành" : "Cổng thư viện"}
        </span>
      </div>
      <NavLink to="/" onClick={onClose} className="nav-item landing-link">
        <Home size={18} />
        <span>Trang chủ</span>
        <ChevronRight size={15} className="nav-chevron" />
      </NavLink>
      <nav>
        {groups.map((group) => (
          <section className="nav-group" key={group.label}>
            <p className="nav-group-label">{group.label}</p>
            {group.links.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <Icon size={18} />
                <span>{label}</span>
                <ChevronRight size={15} className="nav-chevron" />
              </NavLink>
            ))}
          </section>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="user-chip">
          <div className="avatar">{initials(user?.full_name)}</div>
          <div>
            <strong>{user?.full_name}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>
        <button className="nav-item logout" onClick={() => void logout()}>
          <LogOut size={17} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
