import { Route, Routes } from "react-router-dom";
import { RequireAdmin } from "../auth/RequireAdmin";
import { RequireAuth } from "../auth/RequireAuth";
import { RedirectByRole } from "../auth/RedirectByRole";
import { AdminRoutes } from "./AdminRoutes";
import { UserRoutes } from "./UserRoutes";
import { PublicRoutes } from "./PublicRoutes";
export function AppRoutes() {
  return (
    <Routes>
      {PublicRoutes()}
      <Route element={<RequireAuth />}>
        <Route element={<RequireAdmin />}>{AdminRoutes()}</Route>
        {UserRoutes()}
        <Route path="/dashboard" element={<RedirectByRole />} />
      </Route>
    </Routes>
  );
}
