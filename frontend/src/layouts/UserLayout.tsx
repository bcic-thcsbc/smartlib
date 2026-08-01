import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppHeader } from "../components/header/AppHeader";
import { AppSidebar } from "../components/sidebar/AppSidebar";
import { UserMobileNav } from "../components/sidebar/UserMobileNav";
export function UserLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell user-shell">
      <AppSidebar open={open} onClose={() => setOpen(false)} />
      <div className="workspace">
        <AppHeader onMenu={() => setOpen(true)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
      <UserMobileNav />
    </div>
  );
}
