import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { bookApi } from "../../../api/bookApi";
import { FieldLabel } from "../../../components/common/FieldLabel";
import { Modal } from "../../../components/common/Modal";
import { Selector } from "../../../components/common/Selector";
import type { Book } from "../../../types/book";
import { errorMessage } from "../../../utils/format";

type CopyCreateModalProps = {
  onClose: () => void;
  onSaved: () => void;
};

export function CopyCreateModal({ onClose, onSaved }: CopyCreateModalProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [shelf, setShelf] = useState("");

  useEffect(() => {
    bookApi
      .list({ limit: 100 })
      .then((response) => setBooks(response.data.data));
  }, []);

  const save = async () => {
    try {
      await bookApi.createCopies({
        book_id: Number(bookId),
        quantity: Number(quantity),
        shelf,
      });
      toast.success("Đã thêm quyển và sinh mã");
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error, "Không thể thêm quyển"));
    }
  };

  return (
    <Modal title="Thêm quyển sách" onClose={onClose}>
      <div className="form-grid">
        <label>
          <FieldLabel required>Tựa sách</FieldLabel>
          <Selector
            value={bookId}
            searchable
            searchPlaceholder="Tìm tựa sách"
            onChange={(event) => setBookId(event.target.value)}
          >
            <option value="">Chọn tựa sách</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </Selector>
        </label>
        <label>
          <FieldLabel required>Số quyển</FieldLabel>
          <input
            type="number"
            min="1"
            max="500"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <label className="form-wide">
          <FieldLabel>Kệ sách</FieldLabel>
          <input
            value={shelf}
            placeholder="Ví dụ: Kệ A1"
            onChange={(event) => setShelf(event.target.value)}
          />
        </label>
      </div>
      <div className="modal-actions">
        <button className="secondary" type="button" onClick={onClose}>
          Hủy
        </button>
        <button
          className="primary"
          type="button"
          disabled={!bookId || Number(quantity) < 1}
          onClick={() => void save()}
        >
          Thêm vào kho
        </button>
      </div>
    </Modal>
  );
}
