import { ArrowRight, Bell, BookOpen, ClipboardList, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

const actions = [
  { to: "/user/books", icon: BookOpen, label: "Danh mục thư viện", title: "Tra cứu sách", text: "Tìm tựa sách và xem tình trạng sẵn sàng." },
  { to: "/user/my-requests", icon: Clock3, label: "Yêu cầu của tôi", title: "Theo dõi trạng thái", text: "Kiểm tra yêu cầu mượn đang chờ xử lý." },
  { to: "/user/notifications", icon: Bell, label: "Thông báo", title: "Cập nhật mới", text: "Xem nhắc hạn trả và phản hồi từ thư viện." },
];

export function Dashboard() {
  const { user } = useAuth();
  return <div className="user-dashboard section-stack">
    <section className="user-dashboard-hero panel">
      <div className="dashboard-book-mark"><BookOpen size={42} /></div>
      <div className="dashboard-hero-copy"><p className="eyebrow">Cổng thư viện</p><h2>Chào {user?.full_name}</h2><p>Tra cứu đầu sách, gửi yêu cầu mượn và theo dõi phiếu của bạn trong cùng một không gian.</p><div className="dashboard-hero-actions"><Link className="primary" to="/user/books"><BookOpen size={17} />Tìm sách</Link><Link className="secondary" to="/user/my-borrow"><ClipboardList size={17} />Sách đang mượn</Link></div></div>
      <div className="dashboard-hero-note"><span>Thư viện THCS Bình Chuẩn</span><strong>Phục vụ học tập mỗi ngày</strong></div>
    </section>
    <section className="user-action-grid" aria-label="Tác vụ thư viện">{actions.map((action) => { const Icon = action.icon; return <Link key={action.to} to={action.to} className="user-action-card"><div className="user-action-icon"><Icon size={20} /></div><div><span>{action.label}</span><strong>{action.title}</strong><p>{action.text}</p></div><ArrowRight className="user-action-arrow" size={18} /></Link>; })}</section>
  </div>;
}
