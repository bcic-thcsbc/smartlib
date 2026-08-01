import { BookOpen, ClipboardList, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
export function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="section-stack">
      <section className="panel detail-hero">
        <div className="detail-cover">
          <BookOpen size={56} />
        </div>
        <div className="detail-meta">
          <p className="eyebrow">Cổng thư viện</p>
          <h2>Chào {user?.full_name}</h2>
          <p className="muted">
            Tra cứu đầu sách, gửi yêu cầu mượn và theo dõi các phiếu của bạn tại
            một nơi.
          </p>
          <div className="page-actions">
            <Link className="primary" to="/user/books">
              <BookOpen size={17} />
              Tìm sách
            </Link>
            <Link className="secondary" to="/user/my-borrow">
              <ClipboardList size={17} />
              Sách đang mượn
            </Link>
          </div>
        </div>
      </section>
      <div className="status-grid">
        <Link className="metric" to="/user/books">
          <BookOpen size={21} />
          <span>Danh mục thư viện</span>
          <strong>Tra cứu sách</strong>
        </Link>
        <Link className="metric" to="/user/my-requests">
          <Clock3 size={21} />
          <span>Yêu cầu của tôi</span>
          <strong>Theo dõi trạng thái</strong>
        </Link>
        <Link className="metric" to="/user/notifications">
          <ClipboardList size={21} />
          <span>Thông báo</span>
          <strong>Cập nhật mới</strong>
        </Link>
      </div>
    </div>
  );
}
