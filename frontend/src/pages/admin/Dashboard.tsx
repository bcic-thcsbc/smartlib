import { AlertTriangle, ClipboardList, FileWarning } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { borrowApi } from "../../api/borrowApi";
import { dashboardApi } from "../../api/dashboardApi";
import { EmptyState } from "../../components/common/EmptyState";
import { PageError } from "../../components/common/PageError";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Toolbar } from "../../components/common/Toolbar";
import { MetricCard } from "../../components/statistic/MetricCard";
import type { DashboardData } from "../../types/api";
import type { BorrowRequest } from "../../types/borrow";
import { errorMessage, formatDate } from "../../utils/format";

const requestLabel = (status: string) => ({ pending: "Chờ duyệt", approved: "Đã duyệt", fulfilled: "Đã nhận", rejected: "Từ chối" }[status] || status);

export function Dashboard() {
  const [data, setData] = useState<DashboardData>();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = useCallback(() => {
    setError("");
    Promise.all([dashboardApi.summary(), borrowApi.requests({ status: "pending", limit: 5 })])
      .then(([dashboardResponse, requestResponse]) => { setData(dashboardResponse.data); setRequests(requestResponse.data.data); })
      .catch((requestError) => setError(errorMessage(requestError, "Không thể tải tổng quan thư viện.")));
  }, []);
  useEffect(() => { load(); }, [load]);

  const stats = data?.stats;
  if (error) return <PageError message={error} onRetry={load} />;
  return <div className="section-stack admin-dashboard">
    <Toolbar title="Tổng quan" description="Các việc cần xử lý trong ngày hôm nay." action="Tạo phiếu mượn" onAction={() => navigate("/admin/borrow/new")} />
    <section className="metric-grid" aria-label="Chỉ số thư viện">
      <MetricCard label="Yêu cầu chờ duyệt" value={stats?.pendingRequests || 0} detail="Cần phản hồi" onClick={() => navigate("/admin/borrow-requests")} />
      <MetricCard label="Phiếu quá hạn" value={stats?.overdueLoans || 0} detail="Cần theo dõi" onClick={() => navigate("/admin/borrow")} />
      <MetricCard label="Đang mượn" value={stats?.borrowedCopies || 0} detail="Bản sách đang lưu thông" onClick={() => navigate("/admin/borrow")} />
      <MetricCard label="Sự cố mở" value={stats?.openIncidents || 0} detail="Mất hoặc hỏng" onClick={() => navigate("/admin/incidents")} />
    </section>
    <section className="dashboard-grid">
      <section className="panel admin-request-panel">
        <div className="panel-heading"><div><h2>Yêu cầu cần xử lý</h2><p className="muted">Các yêu cầu mượn đang chờ thư viện phản hồi.</p></div><button className="text-button" type="button" onClick={() => navigate("/admin/borrow-requests")}>Xem tất cả</button></div>
        {requests.length ? <div className="activity-list">{requests.map((request) => <button className="activity-row request-row" type="button" key={request.id} onClick={() => navigate("/admin/borrow-requests")}><div className="activity-icon"><ClipboardList size={17} aria-hidden="true" /></div><div><strong>{request.title}</strong><span>{request.full_name || "Độc giả"}</span></div><StatusBadge status={request.status}>{requestLabel(request.status)}</StatusBadge></button>)}</div> : <EmptyState title="Không có yêu cầu đang chờ" text="Các yêu cầu mới sẽ xuất hiện tại đây." />}
      </section>
      <aside className="panel attention admin-reminders">
        <div className="panel-heading"><div><h2>Nhắc việc</h2><p className="muted">Các điểm cần chú ý.</p></div></div>
        <button className="reminder-row" type="button" onClick={() => navigate("/admin/borrow")}><AlertTriangle size={18} aria-hidden="true" /><span>Phiếu quá hạn</span><strong>{stats?.overdueLoans || 0}</strong></button>
        <button className="reminder-row" type="button" onClick={() => navigate("/admin/incidents")}><FileWarning size={18} aria-hidden="true" /><span>Sự cố sách</span><strong>{stats?.openIncidents || 0}</strong></button>
      </aside>
    </section>
    <section className="panel table-panel recent-borrow-panel"><div className="panel-heading"><div><h2>Hoạt động mượn gần đây</h2></div></div>{data?.recent?.length ? <table><thead><tr><th>Độc giả</th><th>Sách</th><th>Ngày mượn</th><th>Trạng thái</th></tr></thead><tbody>{data.recent.map((item) => <tr key={item.id}><td>{item.full_name}</td><td>{item.titles}</td><td>{formatDate(item.borrow_date)}</td><td><StatusBadge status={item.status}>{item.status === "overdue" ? "Quá hạn" : item.status === "active" ? "Đang mượn" : "Đã trả"}</StatusBadge></td></tr>)}</tbody></table> : <EmptyState title="Chưa có hoạt động mượn trả" text="Các phiếu mới sẽ xuất hiện tại đây." />}</section>
  </div>;
}
