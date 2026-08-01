import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppHeader } from "../components/header/AppHeader";
import { AppSidebar } from "../components/sidebar/AppSidebar";
export function AdminLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell admin-shell">
      <AppSidebar open={open} onClose={() => setOpen(false)} />
      <div className="workspace">
        <AppHeader onMenu={() => setOpen(true)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
