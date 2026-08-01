import { Route } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout";
import { Dashboard } from "../pages/admin/Dashboard";
import { UserList } from "../pages/admin/users/UserList";
import { BookList } from "../pages/admin/books/BookList";
import { CopyList } from "../pages/admin/copies/CopyList";
import { BorrowList } from "../pages/admin/borrow/BorrowList";
import { BorrowCreate } from "../pages/admin/borrow/BorrowCreate";
import { BorrowDetail } from "../pages/admin/borrow/BorrowDetail";
import { BorrowRequests } from "../pages/admin/borrow/BorrowRequests";
import { DashboardReport } from "../pages/admin/reports/DashboardReport";
import { Settings } from "../pages/admin/settings/Settings";
import { AdminBookDetail } from "../pages/admin/books/BookDetail";
import { AdminCopyDetail } from "../pages/admin/copies/CopyDetail";
import { SpreadsheetImport } from "../pages/admin/SpreadsheetImport";
import { Incidents } from "../pages/admin/Incidents";
import { AdminNotifications } from "../pages/admin/Notifications";
export function AdminRoutes() {
  return (
    <Route path="/admin" element={<AdminLayout />}>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="users" element={<UserList />} />
      <Route path="books" element={<BookList />} />
      <Route path="books/:id" element={<AdminBookDetail />} />
      <Route path="book-copies" element={<CopyList />} />
      <Route path="book-copies/:id" element={<AdminCopyDetail />} />
      <Route path="borrow" element={<BorrowList />} />
      <Route path="borrow/:id" element={<BorrowDetail />} />
      <Route path="borrow/new" element={<BorrowCreate />} />
      <Route path="borrow-requests" element={<BorrowRequests />} />
      <Route path="incidents" element={<Incidents />} />
      <Route path="reports" element={<DashboardReport />} />
      <Route path="imports" element={<SpreadsheetImport />} />
      <Route path="notifications" element={<AdminNotifications />} />
      <Route path="settings" element={<Settings />} />
    </Route>
  );
}
