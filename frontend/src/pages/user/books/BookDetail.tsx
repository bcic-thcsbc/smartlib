import { ArrowLeft, BookOpen, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { bookApi } from "../../../api/bookApi";
import { borrowApi } from "../../../api/borrowApi";
import { FieldLabel } from "../../../components/common/FieldLabel";
import { Modal } from "../../../components/common/Modal";
import { PageLoader } from "../../../components/common/PageLoader";
import type { Book } from "../../../types/book";
import { errorMessage, formatDate } from "../../../utils/format";

const date = (offset = 0) => {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return value.toISOString().slice(0, 10);
};

const nextDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const day = new Date(`${value}T00:00:00`);
  if (Number.isNaN(day.getTime())) return "";
  day.setDate(day.getDate() + 1);
  return day.toISOString().slice(0, 10);
};

const completeDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState<Book>();
  const [dialog, setDialog] = useState(false);
  const [start, setStart] = useState(date());
  const [due, setDue] = useState(date(7));
  const [availability, setAvailability] = useState<any>();
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id)
      bookApi.detail(Number(id)).then((response) => setBook(response.data));
  }, [id]);

  useEffect(() => {
    if (
      id &&
      dialog &&
      completeDate(start) &&
      completeDate(due) &&
      due > start
    ) {
      bookApi
        .availability(Number(id), start, due)
        .then((response) => setAvailability(response.data))
        .catch(() => setAvailability(undefined));
    } else {
      setAvailability(undefined);
    }
  }, [id, dialog, start, due]);

  if (!book) return <PageLoader />;

  const request = async () => {
    setSending(true);
    try {
      await borrowApi.createRequest(book.id, start, due);
      toast.success("Đã gửi yêu cầu đặt mượn");
      setDialog(false);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể tạo yêu cầu"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="book-detail">
      <Link className="back-link" to="/user/books">
        <ArrowLeft size={17} />
        Quay lại tựa sách
      </Link>
      <section className="book-detail-card">
        <div className="book-detail-cover">
          {book.cover_image ? (
            <img src={book.cover_image} alt={`Bìa ${book.title}`} />
          ) : (
            <>
              <BookOpen size={55} />
              <span>{book.category || "Thư viện"}</span>
            </>
          )}
        </div>
        <div className="book-detail-copy">
          <p className="eyebrow">Tựa sách</p>
          <h2>{book.title}</h2>
          <p className="muted">
            {book.author || "Chưa cập nhật tác giả"}
            {book.publisher ? ` · ${book.publisher}` : ""}
          </p>
          <div className="detail-description">
            <b>Thông tin sách</b>
            <p>{book.description || "Chưa có mô tả cho tựa sách này."}</p>
          </div>
          <button
            className="primary"
            type="button"
            onClick={() => setDialog(true)}
          >
            <CalendarDays size={17} />
            Xem lịch và đặt mượn
          </button>
        </div>
      </section>

      {dialog && (
        <Modal title="Đặt mượn theo lịch" onClose={() => setDialog(false)}>
          <div className="reservation-form">
            <p className="muted">{book.title}</p>
            <label>
              <FieldLabel required>Ngày muốn mượn</FieldLabel>
              <input
                type="date"
                min={date()}
                value={start}
                onChange={(event) => {
                  const value = event.target.value;
                  setStart(value);
                  if (
                    completeDate(value) &&
                    (!completeDate(due) || due <= value)
                  ) {
                    setDue(nextDate(value));
                  }
                }}
              />
            </label>
            <label>
              <FieldLabel required>Ngày muốn trả</FieldLabel>
              <input
                type="date"
                min={nextDate(start)}
                value={due}
                onChange={(event) => setDue(event.target.value)}
              />
            </label>
            {availability && (
              <div
                className={
                  availability.available ? "availability-ok" : "availability-no"
                }
              >
                {availability.available ? (
                  <>
                    <strong>
                      {availability.available_copy_count} quyển có thể mượn
                    </strong>
                    <span>Phù hợp đúng khoảng thời gian bạn đã chọn.</span>
                  </>
                ) : (
                  `Chưa có quyển phù hợp.${availability.next_available_date ? ` Ngày mượn gần nhất: ${formatDate(availability.next_available_date)}.` : ""}`
                )}
              </div>
            )}
            <div className="modal-actions">
              <button
                className="secondary"
                type="button"
                onClick={() => setDialog(false)}
              >
                Hủy
              </button>
              <button
                className="primary"
                type="button"
                disabled={!availability?.available || sending}
                onClick={() => void request()}
              >
                {sending ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
