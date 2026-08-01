import { useEffect, useState } from "react";
import {
  BookOpen,
  Boxes,
  ClipboardList,
  ShieldCheck,
  Users,
  Clock3,
  TriangleAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dashboardApi } from "../../api/dashboardApi";
import type { DashboardData } from "../../types/api";
import { MetricCard } from "../../components/statistic/MetricCard";
import { EmptyState } from "../../components/common/EmptyState";
import { formatDate } from "../../utils/format";
export function Dashboard() {
  const [data, setData] = useState<DashboardData>();
  const navigate = useNavigate();
  useEffect(() => {
    dashboardApi.summary().then((response) => setData(response.data));
  }, []);
  const stats = data?.stats || {
    bookTitles: 0,
    totalCopies: 0,
    borrowedCopies: 0,
    availableCopies: 0,
    students: 0,
    teachers: 0,
    pendingRequests: 0,
    overdueLoans: 0,
    openIncidents: 0,
  };
  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">Tổng quan thư viện</p>
          <h2>Chào buổi sáng, thư viện đã sẵn sàng.</h2>
          <p className="muted">
            Theo dõi nhanh những hoạt động cần chú ý trong hôm nay.
          </p>
        </div>
        <button
          className="primary"
          onClick={() => navigate("/admin/borrow/new")}
        >
          Tạo phiếu mượn
        </button>
      </section>
      <div className="metric-grid">
        <MetricCard
          label="Tựa sách"
          value={stats.bookTitles}
          icon={BookOpen}
          color="blue"
          onClick={() => navigate("/admin/books")}
        />
        <MetricCard
          label="Tổng quyển"
          value={stats.totalCopies}
          icon={Boxes}
          color="green"
          onClick={() => navigate("/admin/book-copies")}
        />
        <MetricCard
          label="Đang mượn"
          value={stats.borrowedCopies}
          icon={ClipboardList}
          color="amber"
          onClick={() => navigate("/admin/borrow")}
        />
        <MetricCard
          label="Sẵn sàng"
          value={stats.availableCopies}
          icon={ShieldCheck}
          color="violet"
          onClick={() => navigate("/admin/book-copies")}
        />
        <MetricCard
          label="Chờ duyệt"
          value={stats.pendingRequests || 0}
          icon={Clock3}
          color="amber"
          onClick={() => navigate("/admin/borrow-requests")}
        />
        <MetricCard
          label="Phiếu quá hạn"
          value={stats.overdueLoans || 0}
          icon={TriangleAlert}
          color="amber"
          onClick={() => navigate("/admin/borrow")}
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Lưu thông</p>
              <h3>Hoạt động gần đây</h3>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("/admin/borrow")}
            >
              Xem tất cả
            </button>
          </div>
          {data?.recent?.length ? (
            <div className="activity-list">
              {data.recent.map((item) => (
                <div className="activity-row" key={item.id}>
                  <div className="activity-icon">
                    <ClipboardList size={17} />
                  </div>
                  <div>
                    <strong>{item.full_name}</strong>
                    <span>{item.titles}</span>
                  </div>
                  <div className={`status ${item.status}`}>
                    {item.status === "active"
                      ? "Đang mượn"
                      : item.status === "overdue"
                        ? "Quá hạn"
                        : item.status === "returned"
                          ? "Đã trả"
                          : "Trả một phần"}
                  </div>
                  <time>{formatDate(item.borrow_date)}</time>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có hoạt động mượn trả"
              text="Các phiếu mới sẽ hiển thị tại đây."
            />
          )}
        </section>
        <section className="panel attention">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Cộng đồng</p>
              <h3>Thành viên thư viện</h3>
            </div>
            <Users size={18} className="muted" />
          </div>
          <div className="member-split">
            <div>
              <strong>{stats.students}</strong>
              <span>Học sinh</span>
            </div>
            <div>
              <strong>{stats.teachers}</strong>
              <span>Giáo viên</span>
            </div>
          </div>
          <div className="mini-callout">
            <ShieldCheck size={16} />
            <span>{stats.openIncidents || 0} sự cố sách đang chờ xử lý.</span>
          </div>
        </section>
      </div>
    </>
  );
}
