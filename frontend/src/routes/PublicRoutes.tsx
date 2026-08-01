import { Route } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { Login } from "../pages/public/Login";
import { Landing } from "../pages/public/Landing";
import { NotFound } from "../pages/public/NotFound";
import { Register } from "../pages/public/Register";
export function PublicRoutes() {
  return (
    <Route element={<AuthLayout />}>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  );
}
