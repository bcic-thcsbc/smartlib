import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bookApi } from "../../../api/bookApi";
import type { Book } from "../../../types/book";
import { Toolbar } from "../../../components/common/Toolbar";

export function BookList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    bookApi.list({ q: query }).then((response) => setBooks(response.data.data));
  }, [query]);
  return (
    <>
      <Toolbar
        title="Tra cứu sách"
        count={books.length}
        search={query}
        onSearch={setQuery}
      />
      <div className="catalog-grid">
        {books.map((book) => (
          <Link
            to={`/user/book/${book.id}`}
            className="catalog-card"
            key={book.id}
          >
            <div className="catalog-cover">
              <span>{book.category || "Thư viện"}</span>
            </div>
            <div className="catalog-body">
              <p className="eyebrow">
                {book.publisher || "Thư viện Bình Chuẩn"}
              </p>
              <h3>{book.title}</h3>
              <p className="muted">
                {book.author || "Thư viện trường học"} -{" "}
                {book.publish_year || "Chưa cập nhật"}
              </p>
              <div className="catalog-foot">
                <span
                  className={
                    book.available_quantity
                      ? "available-dot"
                      : "unavailable-dot"
                  }
                >
                  {book.available_quantity
                    ? `Còn ${book.available_quantity} bản`
                    : "Hiện chưa sẵn sàng"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
