import { Bell, Menu, Moon, Plus, Search, Sun, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { operationsApi } from "../../api/operationsApi";
import { initials } from "../../utils/format";
const labels: Record<string, string> = {
  dashboard: "Tổng quan",
  users: "Thành viên",
  books: "Tựa sách",
  "book-copies": "Quyển sách",
  borrow: "Mượn trả",
  "borrow-requests": "Yêu cầu mượn",
  profile: "Hồ sơ",
  "my-borrow": "Sách đang mượn",
  "my-requests": "Yêu cầu mượn",
  notifications: "Thông báo",
  reports: "Báo cáo",
  settings: "Cài đặt",
  incidents: "Sự cố sách",
  imports: "Nhập dữ liệu",
  new: "Tạo phiếu mượn",
};
export function AppHeader({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>();
  const [menu, setMenu] = useState(false);
  const [theme, setTheme] = useState(
    localStorage.getItem("smartlib-theme") || "system",
  );
  const key = location.pathname.split("/").filter(Boolean).pop() || "dashboard";
  const librarian = user?.role === "admin";
  const books = results?.books || [];
  const copies = results?.copies || [];
  const users = results?.users || [];
  const loadUnread = useCallback(() => {
    if (!user) return;
    operationsApi
      .notifications()
      .then((response) => setUnread(response.data.unread))
      .catch(() => setUnread(0));
  }, [user]);
  useEffect(() => {
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    document.documentElement.dataset.theme = resolved;
    localStorage.setItem("smartlib-theme", theme);
  }, [theme]);
  useEffect(() => {
    loadUnread();
    window.addEventListener("smartlib:notifications-changed", loadUnread);
    return () =>
      window.removeEventListener("smartlib:notifications-changed", loadUnread);
  }, [loadUnread, location.pathname]);
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(undefined);
      return;
    }
    const id = setTimeout(
      () =>
        operationsApi
          .search(query)
          .then((response) => setResults(response.data))
          .catch(() => setResults(undefined)),
      300,
    );
    return () => clearTimeout(id);
  }, [query]);
  const resultCount = useMemo(
    () => books.length + copies.length + users.length,
    [books, copies, users],
  );
  const open = (path: string) => {
    setQuery("");
    setResults(undefined);
    setMenu(false);
    navigate(path);
  };
  return (
    <header className="topbar">
      <div className="header-context">
        <button
          className="icon-button menu-button"
          onClick={onMenu}
          aria-label="Mở menu"
        >
          <Menu size={21} />
        </button>
        <div className="breadcrumbs" aria-label="Bạn đang ở">
          <span>{librarian ? "Thủ thư" : "Độc giả"}</span>
          <b>/</b>
          <strong>{labels[key] || "SmartLib"}</strong>
        </div>
      </div>
      <div className="global-search">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm tựa sách, mã quyển, thành viên..."
          aria-label="Tìm kiếm toàn hệ thống"
        />
        {query && (
          <div className="search-results">
            {resultCount ? (
              <>
                {books.map((item: any) => (
                  <button
                    key={`book-${item.id}`}
                    onClick={() =>
                      open(
                        librarian
                          ? `/admin/books/${item.id}`
                          : `/user/book/${item.id}`,
                      )
                    }
                  >
                    <Search size={16} />
                    <span>
                      {item.title}
                      <small>{item.author || "Tựa sách"}</small>
                    </span>
                  </button>
                ))}
                {copies.map((item: any) => (
                  <button
                    key={`copy-${item.id}`}
                    onClick={() =>
                      open(
                        librarian
                          ? `/admin/book-copies/${item.id}`
                          : "/user/books",
                      )
                    }
                  >
                    <Search size={16} />
                    <span>
                      {item.inventory_code}
                      <small>{item.title}</small>
                    </span>
                  </button>
                ))}
                {librarian &&
                  users.map((item: any) => (
                    <button
                      key={`user-${item.id}`}
                      onClick={() => open("/admin/users")}
                    >
                      <UserRound size={16} />
                      <span>
                        {item.full_name}
                        <small>@{item.username}</small>
                      </span>
                    </button>
                  ))}
              </>
            ) : (
              <p>Không tìm thấy kết quả phù hợp.</p>
            )}
          </div>
        )}
      </div>
      <div className="top-actions">
        {librarian && (
          <button
            className="icon-button quick-action"
            onClick={() => open("/admin/borrow/new")}
            aria-label="Tạo phiếu mượn"
            title="Tạo phiếu mượn"
          >
            <Plus size={19} />
          </button>
        )}
        <button
          className="icon-button notification-button"
          onClick={() =>
            open(librarian ? "/admin/notifications" : "/user/notifications")
          }
          aria-label="Thông báo"
          title="Thông báo"
        >
          <Bell size={19} />
          {unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}
        </button>
        <button
          className="icon-button theme-action"
          onClick={() =>
            setTheme((value) => (value === "dark" ? "light" : "dark"))
          }
          aria-label="Đổi giao diện"
          title="Đổi giao diện"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          className="top-avatar"
          onClick={() => setMenu((value) => !value)}
          aria-label="Mở menu tài khoản"
        >
          {initials(user?.full_name)}
        </button>
        {menu && (
          <div className="account-menu">
            <strong>{user?.full_name}</strong>
            <span>@{user?.username}</span>
            <button
              onClick={() =>
                open(librarian ? "/admin/settings" : "/user/profile")
              }
            >
              Tài khoản và cài đặt
            </button>
            <button onClick={() => void logout()}>Đăng xuất</button>
          </div>
        )}
      </div>
    </header>
  );
}
