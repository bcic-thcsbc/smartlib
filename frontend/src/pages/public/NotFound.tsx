import { Link } from "react-router-dom";
export function NotFound() {
  return (
    <div className="login-card" style={{ margin: "15vh auto" }}>
      <p className="eyebrow">404</p>
      <h2>Không tìm thấy trang</h2>
      <p className="muted">
        Trang SmartLib bạn cần không tồn tại hoặc đã được di chuyển.
      </p>
      <Link className="primary wide" to="/">
        Về trang chủ
      </Link>
    </div>
  );
}
