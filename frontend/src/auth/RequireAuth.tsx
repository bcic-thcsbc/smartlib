import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="boot">Đang tải SmartLib...</div>;
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}
