import { ArrowLeft, BookOpen, ClipboardList, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { bookApi } from "../../../api/bookApi";
import type { AdminBookDetail } from "../../../types/book";
import { PageLoader } from "../../../components/common/PageLoader";
import { EmptyState } from "../../../components/common/EmptyState";
import { formatDate } from "../../../utils/format";

export function AdminBookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<AdminBookDetail>();
  useEffect(() => {
    if (id)
      bookApi
        .adminDetail(Number(id))
        .then((response) => setBook(response.data));
  }, [id]);
  if (!book) return <PageLoader />;
  const cover = book.cover_image?.startsWith("/")
    ? `${import.meta.env.VITE_API_ORIGIN || "http://localhost:4000"}${book.cover_image}`
    : book.cover_image;
  return (
    <div className="section-stack">
      <Link to="/admin/books" className="back-link">
        <ArrowLeft size={17} />
        Tựa sách
      </Link>
      <section className="panel detail-hero">
        <div className="detail-cover">
          {cover ? (
            <img src={cover} alt={`Bìa ${book.title}`} />
          ) : (
            <BookOpen size={48} />
          )}
        </div>
        <div className="detail-meta">
          <p className="eyebrow">Tựa sách</p>
          <h2>{book.title}</h2>
          <p className="muted">
            {book.author || "Chưa cập nhật tác giả"} ·{" "}
            {book.publisher || "Chưa cập nhật nhà xuất bản"} ·{" "}
            {book.publish_year || "--"}
          </p>
          <div className="detail-meta-grid">
            <div>
              <span>Thể loại</span>
              <strong>{book.category || "Chung"}</strong>
            </div>
            <div>
              <span>Số trang</span>
              <strong>{book.page_count || 0}</strong>
            </div>
            <div>
              <span>Đang mượn</span>
              <strong>
                {book.borrowed_quantity} / {book.total_quantity} quyển
              </strong>
            </div>
          </div>
          <p className="muted">
            {book.description || "Chưa có mô tả cho tựa sách này."}
          </p>
        </div>
      </section>
      <div className="status-grid">
        <div className="metric">
          <span>Tổng quyển</span>
          <strong>{book.total_quantity}</strong>
        </div>
        <div className="metric">
          <span>Sẵn sàng</span>
          <strong>{book.available_quantity}</strong>
        </div>
        <div className="metric">
          <span>Đang lưu thông</span>
          <strong>{book.borrowed_quantity}</strong>
        </div>
      </div>
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Kiểm kê</p>
            <h3>Danh sách quyển sách</h3>
          </div>
        </div>
        {book.copies.length ? (
          <table>
            <thead>
              <tr>
                <th>Mã quyển</th>
                <th>Kệ</th>
                <th>Trạng thái</th>
                <th>Người đang giữ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {book.copies.map((copy) => (
                <tr key={copy.id}>
                  <td className="mono strong">{copy.inventory_code}</td>
                  <td>{copy.shelf || "-"}</td>
                  <td>
                    <span className={`status ${copy.status}`}>
                      {copy.status}
                    </span>
                  </td>
                  <td>{copy.holder_name || "-"}</td>
                  <td>
                    <button
                      className="row-action"
                      onClick={() => navigate(`/admin/book-copies/${copy.id}`)}
                    >
                      <ExternalLink size={15} />
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            title="Chưa có quyển sách"
            text="Thêm hoặc import quyển sách để đưa tựa sách vào lưu thông."
          />
        )}
      </section>
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Lưu thông</p>
            <h3>Lịch sử mượn</h3>
          </div>
          <ClipboardList size={19} />
        </div>
        {book.history.length ? (
          <table>
            <thead>
              <tr>
                <th>Phiếu</th>
                <th>Thành viên</th>
                <th>Mã quyển</th>
                <th>Mượn</th>
                <th>Hạn trả</th>
                <th>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {book.history.map((row, index) => (
                <tr key={`${row.loan_code}-${index}`}>
                  <td className="mono">{row.loan_code}</td>
                  <td>
                    {row.full_name}
                    <small className="muted">@{row.username}</small>
                  </td>
                  <td className="mono">{row.inventory_code}</td>
                  <td>{formatDate(row.borrow_date)}</td>
                  <td>{formatDate(row.due_date)}</td>
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
            text="Lượt mượn đầu tiên sẽ xuất hiện tại đây."
          />
        )}
      </section>
    </div>
  );
}
