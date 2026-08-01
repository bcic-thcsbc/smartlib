import { BookOpen, Building2, CalendarDays, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bookApi } from "../../../api/bookApi";
import { Toolbar } from "../../../components/common/Toolbar";
import type { Book } from "../../../types/book";

function Cover({ book }: { book: Book }) {
  return <div className="catalog-cover">{book.cover_image ? <img src={book.cover_image} alt={`Bìa ${book.title}`} /> : <div className="cover-fallback"><BookOpen size={34} /><span>{book.category || "Thư viện"}</span></div>}<span className={book.available_quantity ? "book-status available" : "book-status unavailable"}>{book.available_quantity ? "Có sẵn" : "Đang hết"}</span></div>;
}
export function BookList() {
  const [books, setBooks] = useState<Book[]>([]); const [query, setQuery] = useState("");
  useEffect(() => { bookApi.list({ q: query }).then((response) => setBooks(response.data.data)); }, [query]);
  return <><Toolbar title="Tra cứu sách" count={books.length} search={query} onSearch={setQuery} /><div className="catalog-grid">{books.map((book) => <Link to={`/user/book/${book.id}`} className="catalog-card" key={book.id}><Cover book={book} /><div className="catalog-body"><h3>{book.title}</h3><p className="book-line"><UserRound size={15} />Tác giả: {book.author || "Chưa cập nhật"}</p><p className="book-line"><Building2 size={15} />NXB {book.publisher || "Chưa cập nhật"}</p><p className="book-line"><CalendarDays size={15} />Xuất bản năm {book.publish_year || "Chưa cập nhật"}</p><div className="catalog-foot"><span>{book.category || "Chưa phân loại"}</span><strong>{book.available_quantity}/{book.total_quantity} cuốn khả dụng</strong></div></div></Link>)}</div></>;
}
