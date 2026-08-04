import { BookOpen, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bookApi } from "../../../api/bookApi";
import { EmptyState } from "../../../components/common/EmptyState";
import { Selector } from "../../../components/common/Selector";
import { FieldLabel } from "../../../components/common/FieldLabel";
import { Toolbar } from "../../../components/common/Toolbar";
import type { Book } from "../../../types/book";
import { errorMessage } from "../../../utils/format";

function BookCover({ book }: { book: Book }) {
  return (
    <div className="catalog-cover">
      {book.cover_image ? (
        <img src={book.cover_image} alt={`Bìa ${book.title}`} />
      ) : (
        <div className="cover-fallback">
          <BookOpen size={34} aria-hidden="true" />
          <span>Chưa có bìa</span>
        </div>
      )}
    </div>
  );
}

function BookSkeleton() {
  return (
    <div className="catalog-card catalog-skeleton" aria-hidden="true">
      <div className="skeleton catalog-cover" />
    </div>
  );
}

export function BookList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    bookApi
      .list({ q: query, ...(availability ? { availability } : {}) })
      .then((response) => setBooks(response.data.data))
      .catch((requestError) =>
        setError(errorMessage(requestError, "Không thể tải danh mục sách.")),
      )
      .finally(() => setLoading(false));
  }, [availability, query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="section-stack">
      <Toolbar
        title="Tra cứu sách"
        count={books.length}
        search={query}
        onSearch={setQuery}
        filters={
          <label>
            <FieldLabel>Tình trạng</FieldLabel>
            <Selector
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              aria-label="Lọc theo tình trạng"
            >
              <option value="">Tất cả tình trạng</option>
              <option value="available">Có sẵn</option>
              <option value="unavailable">Đang hết</option>
            </Selector>
          </label>
        }
      />
      {error ? (
        <div className="inline-error">
          <span>{error}</span>
          <button className="secondary" onClick={load} type="button">
            <RotateCcw size={16} aria-hidden="true" />
            Thử lại
          </button>
        </div>
      ) : null}
      {loading ? (
        <div className="catalog-grid">
          {Array.from({ length: 10 }, (_, index) => (
            <BookSkeleton key={index} />
          ))}
        </div>
      ) : books.length ? (
        <div className="catalog-grid">
          {books.map((book) => (
            <Link
              to={`/user/book/${book.id}`}
              className="catalog-card"
              key={book.id}
              title={book.title}
              aria-label={`Mở sách ${book.title}`}
            >
              <BookCover book={book} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Không tìm thấy sách"
          text="Thử thay đổi từ khóa hoặc bộ lọc để xem danh mục khác."
          action={
            query || availability ? (
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setQuery("");
                  setAvailability("");
                }}
              >
                Xóa bộ lọc
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
