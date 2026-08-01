import { BookOpen, ClipboardList, CircleUserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
const links = [
  ["/user/dashboard", "Tra cứu", BookOpen],
  ["/user/my-borrow", "Đang mượn", ClipboardList],
  ["/user/profile", "Cá nhân", CircleUserRound],
] as const;
export function UserMobileNav() {
  return (
    <nav className="user-mobile-nav">
      {links.map(([to, label, Icon]) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            isActive ? "mobile-nav-link active" : "mobile-nav-link"
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
