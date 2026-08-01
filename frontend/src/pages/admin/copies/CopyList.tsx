import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { bookApi } from "../../../api/bookApi";
import type { BookCopy } from "../../../types/book";
import { Toolbar } from "../../../components/common/Toolbar";
import { Pagination } from "../../../components/common/Pagination";
import { EmptyState } from "../../../components/common/EmptyState";
import { Selector } from "../../../components/common/Selector";
import { CopyCreateModal } from "./CopyCreateModal";
import { CopyEditModal } from "./CopyEditModal";
import { errorMessage } from "../../../utils/format";
const label = (status: string) =>
  ({
    available: "Sẵn sàng",
    reserved: "Đã giữ",
    borrowed: "Đang mượn",
    damaged: "Hư hỏng",
    lost: "Thất lạc",
  })[status] || status;
export function CopyList() {
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [query, setQuery] = useState("");
  const [shelf, setShelf] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 0,
    total: 0,
    limit: 25,
  });
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<BookCopy | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const load = () =>
    bookApi
      .copies({
        q: query,
        page,
        limit: 25,
        ...(shelf ? { shelf } : {}),
        ...(status ? { status } : {}),
      })
      .then((response) => {
        setCopies(response.data.data);
        setPagination(response.data.pagination);
        setSelected([]);
      })
      .catch((error) =>
        toast.error(errorMessage(error, "Không thể tải quyển sách")),
      );
  useEffect(() => {
    load();
  }, [query, shelf, status, page]);
  const filter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };
  const remove = async (ids: number[]) => {
    if (
      !ids.length ||
      !window.confirm(`Xóa vĩnh viễn ${ids.length} quyển sách?`)
    )
      return;
    try {
      await bookApi.removeCopies(ids);
      toast.success(`Đã xóa ${ids.length} quyển sách`);
      load();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể xóa quyển đang được sử dụng"));
    }
  };
  const toggle = (id: number) =>
    setSelected((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  return (
    <>
      <Toolbar
        title="Quyển sách"
        count={pagination.total}
        search={query}
        onSearch={(value) => filter(setQuery, value)}
        action="Thêm quyển"
        onAction={() => setShow(true)}
        filters={
          <>
            <input
              placeholder="Kệ sách"
              value={shelf}
              onChange={(event) => filter(setShelf, event.target.value)}
            />
            <Selector
              value={status}
              onChange={(event) => filter(setStatus, event.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="available">Sẵn sàng</option>
              <option value="reserved">Đã giữ</option>
              <option value="borrowed">Đang mượn</option>
              <option value="lost">Thất lạc</option>
              <option value="damaged">Hư hỏng</option>
            </Selector>
          </>
        }
      />
      {selected.length > 0 && (
        <div className="selection-bar">
          <span>Đã chọn {selected.length} quyển sách</span>
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
                  checked={
                    copies.length > 0 && selected.length === copies.length
                  }
                  onChange={(event) =>
                    setSelected(
                      event.target.checked ? copies.map((copy) => copy.id) : [],
                    )
                  }
                />
              </th>
              <th>Mã quyển</th>
              <th>Tựa sách</th>
              <th>Kệ sách</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {copies.map((copy) => (
              <tr key={copy.id}>
                <td>
                  <input
                    aria-label={`Chọn ${copy.inventory_code}`}
                    type="checkbox"
                    checked={selected.includes(copy.id)}
                    onChange={() => toggle(copy.id)}
                  />
                </td>
                <td className="mono strong">{copy.inventory_code}</td>
                <td>{copy.title}</td>
                <td>{copy.shelf || "-"}</td>
                <td>
                  <span className={`status ${copy.status}`}>
                    {label(copy.status)}
                  </span>
                </td>
                <td>
                  <button
                    className="row-action"
                    onClick={() => setEditing(copy)}
                  >
                    Sửa
                  </button>
                  <button
                    className="row-action danger-text"
                    onClick={() => void remove([copy.id])}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!copies.length && (
          <EmptyState
            title="Không tìm thấy quyển sách"
            text="Hãy thay đổi bộ lọc hoặc thêm quyển mới."
          />
        )}
        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          onChange={setPage}
        />
      </section>
      {show && (
        <CopyCreateModal
          onClose={() => setShow(false)}
          onSaved={() => {
            setShow(false);
            load();
          }}
        />
      )}
      {editing && (
        <CopyEditModal
          copy={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}
