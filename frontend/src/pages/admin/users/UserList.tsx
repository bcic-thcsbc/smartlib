import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { userApi } from "../../../api/userApi";
import type { User } from "../../../types/user";
import { Toolbar } from "../../../components/common/Toolbar";
import { Pagination } from "../../../components/common/Pagination";
import { Selector } from "../../../components/common/Selector";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { RowActionMenu } from "../../../components/common/RowActionMenu";
import { PageError } from "../../../components/common/PageError";
import { UserFormModal } from "./UserFormModal";
import { errorMessage, initials } from "../../../utils/format";
export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 0,
    total: 0,
    limit: 25,
  });
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() =>
    userApi
      .list({ q: query, page, limit: 25, ...(type ? { user_type: type } : {}) })
      .then((response) => {
        setUsers(response.data.data);
        setPagination(response.data.pagination);
        setError(null);
      })
      .catch((loadError) =>
        setError(errorMessage(loadError, "Không thể tải thành viên")),
      ), [page, query, type]);
  useEffect(() => {
    load();
  }, [load]);
  const save = async (form: any) => {
    if (!editing) return;
    try {
      await userApi.update(editing.id, form);
      toast.success("Đã cập nhật thành viên");
      setEditing(null);
      load();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể lưu thành viên"));
    }
  };
  const remove = async (user: User) => {
    try {
      await userApi.remove(user.id);
      toast.success("Đã xóa thành viên");
      load();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể xóa thành viên"));
    }
  };
  return (
    <>
      <Toolbar
        title="Thành viên"
        count={pagination.total}
        search={query}
        onSearch={(value) => {
          setQuery(value);
          setPage(1);
        }}
      />
      {error && <PageError message={error} onRetry={() => void load()} />}
      {!error && (
      <>
      <div className="list-filters">
        <Selector
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả thành viên</option>
          <option value="student">Học sinh</option>
          <option value="teacher">Giáo viên</option>
        </Selector>
      </div>
      <section className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Thành viên</th>
              <th>Vai trò</th>
              <th>Lớp / tổ bộ môn</th>
              <th>Liên hệ</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="book-cell">
                    <div className="avatar small">
                      {initials(user.full_name)}
                    </div>
                    <div>
                      <strong>{user.full_name}</strong>
                      <span>@{user.username}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="tag">
                    {user.role === "admin" ? "Thủ thư" : "Độc giả"}
                  </span>
                </td>
                <td>{user.class_name || user.department || "-"}</td>
                <td>{user.email || user.phone || "-"}</td>
                <td>
                  <RowActionMenu
                    label={`Thao tác cho ${user.full_name}`}
                    actions={[
                      { label: "Sửa", icon: Pencil, onSelect: () => setEditing(user) },
                      { label: "Xóa", icon: Trash2, tone: "danger", onSelect: () => setDeleting(user) },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={pagination.page}
          pages={pagination.pages}
          onChange={setPage}
        />
      </section>
      </>
      )}
      {editing && (
        <UserFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      {deleting && <ConfirmDialog title="Xóa thành viên" description={`Xóa vĩnh viễn ${deleting.full_name} cùng dữ liệu liên quan?`} confirmLabel="Xóa thành viên" onClose={() => setDeleting(null)} onConfirm={async () => { await remove(deleting); setDeleting(null); }} />}
    </>
  );
}
