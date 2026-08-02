import { Link } from "react-router-dom";
export function NotFound() {
  return (
    <main className="not-found-page">
      <section className="login-card">
      <p className="eyebrow">404</p>
      <h2>Không tìm thấy trang</h2>
      <p className="muted">
        Trang SmartLib bạn cần không tồn tại hoặc đã được di chuyển.
      </p>
      <Link className="primary wide" to="/">
        Về trang chủ
      </Link>
      </section>
    </main>
  );
}
