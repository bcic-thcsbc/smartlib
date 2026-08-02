import { Outlet } from "react-router-dom";
import { AppHeader } from "../components/header/AppHeader";
import { UserMobileNav } from "../components/sidebar/UserMobileNav";

export function UserLayout() {
  return (
    <div className="app-shell user-shell">
      <div className="workspace">
        <AppHeader />
        <main className="content">
          <Outlet />
        </main>
      </div>
      <UserMobileNav />
    </div>
  );
}
