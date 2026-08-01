import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { bookApi } from "../../../api/bookApi";
import { borrowApi } from "../../../api/borrowApi";
import { userApi } from "../../../api/userApi";
import { FieldLabel } from "../../../components/common/FieldLabel";
import { Modal } from "../../../components/common/Modal";
import { Selector } from "../../../components/common/Selector";
import type { BookCopy } from "../../../types/book";
import type { User } from "../../../types/user";
import { errorMessage } from "../../../utils/format";

export function BorrowCreate() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [userId, setUserId] = useState("");
  const [copyId, setCopyId] = useState("");
  const [due, setDue] = useState("");

  useEffect(() => {
    Promise.all([
      userApi.list({ limit: 100 }),
      bookApi.copies({ limit: 100, status: "available" }),
    ]).then(([userResponse, copyResponse]) => {
      setUsers(userResponse.data.data);
      setCopies(copyResponse.data.data);
    });
  }, []);

  const submit = async () => {
    try {
      await borrowApi.create({
        user_id: Number(userId),
        copy_ids: [Number(copyId)],
        due_date: due,
      });
      toast.success("Đã tạo phiếu mượn");
      navigate("/admin/borrow");
    } catch (error) {
      toast.error(errorMessage(error, "Không thể tạo phiếu mượn"));
    }
  };

  return (
    <Modal title="Tạo phiếu mượn" onClose={() => navigate("/admin/borrow")}>
      <div className="form-grid">
        <label>
          <FieldLabel required>Người mượn</FieldLabel>
          <Selector
            value={userId}
            searchable
            searchPlaceholder="Tìm thành viên"
            onChange={(event) => setUserId(event.target.value)}
          >
            <option value="">Chọn thành viên</option>
            {users
              .filter(
                (user) => user.role === "user" && user.status === "active",
              )
              .map((user) => (
                <option value={user.id} key={user.id}>
                  {user.full_name} - {user.class_name || user.department}
                </option>
              ))}
          </Selector>
        </label>
        <label>
          <FieldLabel required>Quyển sách</FieldLabel>
          <Selector
            value={copyId}
            searchable
            searchPlaceholder="Tìm tựa sách hoặc mã quyển"
            onChange={(event) => setCopyId(event.target.value)}
          >
            <option value="">Chọn quyển sách sẵn sàng</option>
            {copies.map((copy) => (
              <option value={copy.id} key={copy.id}>
                {copy.title} - {copy.inventory_code}
              </option>
            ))}
          </Selector>
        </label>
        <label>
          <FieldLabel required>Hạn trả</FieldLabel>
          <input
            type="date"
            value={due}
            onChange={(event) => setDue(event.target.value)}
          />
        </label>
      </div>
      <div className="modal-actions">
        <button
          className="secondary"
          type="button"
          onClick={() => navigate("/admin/borrow")}
        >
          Hủy
        </button>
        <button
          className="primary"
          type="button"
          disabled={!userId || !copyId || !due}
          onClick={() => void submit()}
        >
          Xác nhận mượn
        </button>
      </div>
    </Modal>
  );
}
