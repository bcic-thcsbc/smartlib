import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { operationsApi } from "../../../api/operationsApi";
import { Toolbar } from "../../../components/common/Toolbar";
import { FloatingInput } from "../../../components/common/FloatingInput";
import { PageError } from "../../../components/common/PageError";
import { PageLoader } from "../../../components/common/PageLoader";
import { errorMessage } from "../../../utils/format";

function VietnameseTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{row.title}</strong>
      <span>Tổng lượt mượn: {row.total_loans || 0}</span>
      <span>Đã trả: {row.returned || 0}</span>
      <span>Quá hạn: {row.overdue || 0}</span>
    </div>
  );
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DashboardReport() {
  const [report, setReport] = useState<any>();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    return operationsApi
      .report({ ...(from ? { from } : {}), ...(to ? { to } : {}) })
      .then((response) => {
        setReport(response.data);
        setError("");
      })
      .catch((requestError) =>
        setError(errorMessage(requestError, "Không thể tải báo cáo.")),
      )
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    operationsApi
      .report()
      .then((response) => setReport(response.data))
      .catch((requestError) =>
        setError(errorMessage(requestError, "Không thể tải báo cáo.")),
      )
      .finally(() => setLoading(false));
  }, []);
  const exportReport = async () => {
    const response = await operationsApi.exportSpreadsheet();
    save(
      response.data,
      `Borrow_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };
  return (
    <div className="section-stack">
      <Toolbar
        eyebrow="Phân tích thư viện"
        title="Báo cáo lưu thông"
        description="Theo dõi nhu cầu mượn, quá hạn, mất và hỏng theo thời gian."
        actions={
          <>
            <FloatingInput
              label="Từ ngày"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
            <FloatingInput
              label="Đến ngày"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
            <button className="secondary" onClick={() => void load()}>
              Áp dụng
            </button>
            <button className="primary" onClick={() => void exportReport()}>
              <Download size={17} />
              Xuất Excel
            </button>
          </>
        }
      />
      {loading && !report ? (
        <PageLoader />
      ) : error && !report ? (
        <PageError message={error} onRetry={load} />
      ) : (
        report && (
          <>
            <div className="status-grid">
              <div className="metric">
                <span>Phiếu đang mở</span>
                <strong>{report.summary.active_loans}</strong>
              </div>
              <div className="metric">
                <span>Quyển quá hạn</span>
                <strong>{report.summary.overdue_items}</strong>
              </div>
              <div className="metric">
                <span>Sự cố chưa xử lý</span>
                <strong>{report.summary.open_incidents}</strong>
              </div>
            </div>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Nhu cầu đọc</p>
                  <h3>Top tựa sách theo lượt mượn</h3>
                </div>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.rows.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" hide />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<VietnameseTooltip />} />
                    <Bar
                      dataKey="total_loans"
                      fill="var(--sl-brand)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="panel table-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Chi tiết</p>
                  <h3>Sách cần theo dõi</h3>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Tựa sách</th>
                    <th>Lượt mượn</th>
                    <th>Đã trả</th>
                    <th>Quá hạn</th>
                    <th>Mất</th>
                    <th>Hỏng</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row: any) => (
                    <tr key={row.title}>
                      <td>{row.title}</td>
                      <td>{row.total_loans}</td>
                      <td>{row.returned || 0}</td>
                      <td>{row.overdue || 0}</td>
                      <td>{row.lost || 0}</td>
                      <td>{row.damaged || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )
      )}
    </div>
  );
}
