import { ArrowLeft, History, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { bookApi } from "../../../api/bookApi";
import type { CopyDetail as Copy } from "../../../types/book";
import { PageLoader } from "../../../components/common/PageLoader";
import { EmptyState } from "../../../components/common/EmptyState";
import { formatDate } from "../../../utils/format";

export function AdminCopyDetail() {
  const { id } = useParams();
  const [copy, setCopy] = useState<Copy>();
  useEffect(() => {
    if (id)
      bookApi.copyDetail(Number(id)).then((response) => setCopy(response.data));
  }, [id]);
  if (!copy) return <PageLoader />;
  return (
    <div className="section-stack">
      <Link to="/admin/book-copies" className="back-link">
        <ArrowLeft size={17} />
        Quyển sách
      </Link>
      <section className="panel detail-hero">
        <div className="detail-cover">
          <QrCode size={76} />
        </div>
        <div className="detail-meta">
          <p className="eyebrow">Quyển sách vật lý</p>
          <h2>{copy.title}</h2>
          <p className="muted">
            {copy.author || "Chưa có tác giả"} ·{" "}
            {copy.publisher || "Chưa có nhà xuất bản"}
          </p>
          <div className="copy-code">
            <span>Mã quyển / mã quét</span>
            <strong>{copy.inventory_code}</strong>
            <small>{`${location.origin}/copy/${copy.inventory_code}`}</small>
          </div>
          <div className="detail-meta-grid">
            <div>
              <span>Kệ sách</span>
              <strong>{copy.shelf || "Chưa xếp kệ"}</strong>
            </div>
            <div>
              <span>Trạng thái vận hành</span>
              <strong>{copy.status}</strong>
            </div>
          </div>
        </div>
      </section>
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Lưu thông</p>
            <h3>Lịch sử quyển sách</h3>
          </div>
          <History size={19} />
        </div>
        {copy.history.length ? (
          <table>
            <thead>
              <tr>
                <th>Phiếu</th>
                <th>Người mượn</th>
                <th>Ngày mượn</th>
                <th>Ngày trả</th>
                <th>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {copy.history.map((row, index) => (
                <tr key={`${row.loan_code}-${index}`}>
                  <td className="mono">{row.loan_code}</td>
                  <td>
                    {row.full_name}
                    <small className="muted">@{row.username}</small>
                  </td>
                  <td>{formatDate(row.borrow_date)}</td>
                  <td>{formatDate(row.returned_at)}</td>
                  <td>
                    <span className={`status ${row.disposition}`}>
                      {row.disposition}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            title="Chưa có lịch sử lưu thông"
            text="Lượt mượn của quyển sách này sẽ xuất hiện ở đây."
          />
        )}
      </section>
    </div>
  );
}
