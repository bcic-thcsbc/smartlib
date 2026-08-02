import { BookOpen, CircleUserRound, ClipboardList, LayoutDashboard, ListChecks } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  ["/user/dashboard", "Trang chủ", LayoutDashboard],
  ["/user/books", "Sách", BookOpen],
  ["/user/my-borrow", "Mượn", ClipboardList],
  ["/user/my-requests", "Yêu cầu", ListChecks],
  ["/user/profile", "Tài khoản", CircleUserRound],
] as const;

export function UserMobileNav() {
  return (
    <nav className="user-mobile-nav" aria-label="Điều hướng chính">
      {links.map(([to, label, Icon]) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => isActive ? "mobile-nav-link active" : "mobile-nav-link"}
        >
          <Icon size={19} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
