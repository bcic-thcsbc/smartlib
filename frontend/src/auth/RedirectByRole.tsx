import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
export function RedirectByRole() {
  const { user } = useAuth();
  return (
    <Navigate
      to={user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard"}
      replace
    />
  );
}
