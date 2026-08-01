import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { bookApi } from "../../../api/bookApi";
import type { Book } from "../../../types/book";
import { Toolbar } from "../../../components/common/Toolbar";
import { EmptyState } from "../../../components/common/EmptyState";
import { Pagination } from "../../../components/common/Pagination";
import { Selector } from "../../../components/common/Selector";
import { BookFormModal } from "./BookFormModal";
import { errorMessage } from "../../../utils/format";

export function BookList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [year, setYear] = useState("");
  const [availability, setAvailability] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 0,
    total: 0,
    limit: 25,
  });
  const [editing, setEditing] = useState<Book | null>(null);
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const load = () =>
    bookApi
      .list({
        q: query,
        page,
        limit: 25,
        ...(category ? { category } : {}),
        ...(year ? { publish_year: year } : {}),
        ...(availability ? { availability } : {}),
      })
      .then((response) => {
        setBooks(response.data.data);
        setPagination(response.data.pagination);
        setSelected([]);
      })
      .catch((error) =>
        toast.error(errorMessage(error, "Không thể tải tựa sách")),
      );
  useEffect(() => {
    load();
  }, [query, category, year, availability, page]);
  const filter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };
  const save = async (form: any) => {
    try {
      if (editing) await bookApi.update(editing.id, form);
      else
        await bookApi.create({ ...form, quantity: Number(form.quantity) || 1 });
      toast.success(
        editing ? "Đã cập nhật tựa sách" : "Đã tạo tựa sách và quyển mặc định",
      );
      setShow(false);
      setEditing(null);
      load();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể lưu tựa sách"));
    }
  };
  const remove = async (ids: number[]) => {
    if (
      !ids.length ||
      !window.confirm(
        `Xóa vĩnh viễn ${ids.length} tựa sách cùng dữ liệu liên quan?`,
      )
    )
      return;
    try {
      await bookApi.removeMany(ids);
      toast.success(`Đã xóa ${ids.length} tựa sách`);
      load();
    } catch (error) {
      toast.error(
        errorMessage(error, "Không thể xóa tựa sách đang được sử dụng"),
      );
    }
  };
  const toggle = (id: number) =>
    setSelected((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  return (
    <>
      <Toolbar
        title="Tựa sách"
        count={pagination.total}
        search={query}
        onSearch={(value) => filter(setQuery, value)}
        action="Thêm tựa sách"
        onAction={() => {
          setEditing(null);
          setShow(true);
        }}
        filters={
          <>
            <input
              placeholder="Thể loại"
              value={category}
              onChange={(event) => filter(setCategory, event.target.value)}
            />
            <input
              placeholder="Năm XB"
              inputMode="numeric"
              value={year}
              onChange={(event) => filter(setYear, event.target.value)}
            />
            <Selector
              value={availability}
              onChange={(event) => filter(setAvailability, event.target.value)}
            >
              <option value="">Tất cả khả dụng</option>
              <option value="available">Có quyển sẵn sàng</option>
              <option value="unavailable">Chưa có quyển sẵn sàng</option>
            </Selector>
          </>
        }
      />
      {selected.length > 0 && (
        <div className="selection-bar">
          <span>Đã chọn {selected.length} tựa sách</span>
          <button
            className="danger-button"
            onClick={() => void remove(selected)}
          >
            <Trash2 size={16} />
            Xóa đã chọn
          </button>
        </div>
      )}
      <section className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  aria-label="Chọn tất cả"
                  type="checkbox"
                  checked={books.length > 0 && selected.length === books.length}
                  onChange={(event) =>
                    setSelected(
                      event.target.checked ? books.map((book) => book.id) : [],
                    )
                  }
                />
              </th>
              <th>Tựa sách</th>
              <th>Thể loại</th>
              <th>Năm XB</th>
              <th>Số trang</th>
              <th>Tổng quyển</th>
              <th>Sẵn sàng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>
                  <input
                    aria-label={`Chọn ${book.title}`}
                    type="checkbox"
                    checked={selected.includes(book.id)}
                    onChange={() => toggle(book.id)}
                  />
                </td>
                <td>
                  <div className="book-cell">
                    <div className="book-cover">{book.title.slice(0, 1)}</div>
                    <div>
                      <strong>{book.title}</strong>
                      <span>{book.author || "Chưa cập nhật tác giả"}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="tag">{book.category || "Chung"}</span>
                </td>
                <td>{book.publish_year || 0}</td>
                <td>{book.page_count || 0}</td>
                <td>{book.total_quantity}</td>
                <td>{book.available_quantity}</td>
                <td>
                  <button
                    className="row-action"
                    onClick={() => {
                      setEditing(book);
                      setShow(true);
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    className="row-action danger-text"
                    onClick={() => void remove([book.id])}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!books.length && (
          <EmptyState
            title="Không tìm thấy tựa sách"
            text="Hãy thay đổi bộ lọc hoặc thêm tựa sách mới."
          />
        )}
        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          onChange={setPage}
        />
      </section>
      {show && (
        <BookFormModal
          initial={editing || undefined}
          onClose={() => {
            setShow(false);
            setEditing(null);
          }}
          onSave={save}
        />
      )}
    </>
  );
}
