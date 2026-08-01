import { Route } from "react-router-dom";
import { UserLayout } from "../layouts/UserLayout";
import { Dashboard } from "../pages/user/Dashboard";
import { BookList } from "../pages/user/books/BookList";
import { MyBorrow } from "../pages/user/borrow/MyBorrow";
import { Profile } from "../pages/user/profile/Profile";
import { ChangePassword } from "../pages/user/profile/ChangePassword";
import { BookDetail } from "../pages/user/books/BookDetail";
import { MyRequests } from "../pages/user/borrow/MyRequests";
import { Notifications } from "../pages/user/Notifications";
export function UserRoutes() {
  return (
    <Route path="/user" element={<UserLayout />}>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="books" element={<BookList />} />
      <Route path="book/:id" element={<BookDetail />} />
      <Route path="my-borrow" element={<MyBorrow />} />
      <Route path="my-requests" element={<MyRequests />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="profile" element={<Profile />} />
      <Route path="change-password" element={<ChangePassword />} />
    </Route>
  );
}
