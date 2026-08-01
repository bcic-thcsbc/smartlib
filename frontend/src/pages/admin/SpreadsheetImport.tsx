import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { operationsApi } from "../../api/operationsApi";
import { errorMessage } from "../../utils/format";

type ImportPreview = {
  _row: number;
  title: string;
  author: string;
  publisher: string;
  publish_year: number;
  category: string;
  page_count: number;
  copy_count: number;
  shelf: string;
};

type ImportResult = {
  valid: boolean;
  preview: ImportPreview[];
  errors: Array<{ row: number; message: string }>;
  total: number;
  copy_total: number;
};

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function SpreadsheetImport() {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<ImportResult>();
  const [loading, setLoading] = useState(false);

  const download = async () => {
    const response = await operationsApi.downloadTemplate();
    save(response.data, "Tu_sach_template.xlsx");
  };

  const inspect = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const response = await operationsApi.validateSpreadsheet(file);
      setResult(response.data);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể đọc tệp Excel"));
    } finally {
      setLoading(false);
    }
  };

  const commit = async () => {
    if (!file || !result?.valid) return;

    setLoading(true);
    try {
      const response = await operationsApi.importSpreadsheet(file);
      toast.success(response.data.message);
      setFile(undefined);
      setResult(undefined);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể import dữ liệu"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dữ liệu thư viện</p>
          <h2>Nhập tựa sách từ Excel</h2>
          <p className="muted">
            Mỗi dòng tạo một tựa sách và ít nhất một quyển. Dữ liệu chỉ được ghi
            sau khi bạn đã xem trước và xác nhận.
          </p>
        </div>
        <div className="page-actions">
          <button
            className="secondary"
            type="button"
            onClick={() => void download()}
          >
            <Download size={17} />
            Tải template
          </button>
          <button
            className="secondary"
            type="button"
            onClick={async () => {
              const response = await operationsApi.exportSpreadsheet();
              save(
                response.data,
                `Bao_cao_muon_tra_${new Date().toISOString().slice(0, 10)}.xlsx`,
              );
            }}
          >
            <Download size={17} />
            Xuất báo cáo
          </button>
        </div>
      </header>

      <section className="import-workflow">
        <div className="import-step">
          <span>01</span>
          <div>
            <h3>Chọn tệp Excel</h3>
            <p>Template gồm thông tin tựa sách, số trang, số quyển và kệ.</p>
            <label className="file-drop">
              <FileSpreadsheet size={24} />
              <strong>{file?.name || "Chọn tệp .xlsx"}</strong>
              <input
                type="file"
                accept=".xlsx"
                onChange={(event) => {
                  setFile(event.target.files?.[0]);
                  setResult(undefined);
                }}
              />
            </label>
          </div>
        </div>
        <div className="import-step">
          <span>02</span>
          <div>
            <h3>Kiểm tra và xem trước</h3>
            <p>
              Ô số trang và năm xuất bản để trống được tính là 0; số quyển để
              trống mặc định là 1.
            </p>
            <button
              className="secondary"
              type="button"
              disabled={!file || loading}
              onClick={() => void inspect()}
            >
              <Upload size={16} />
              {loading ? "Đang kiểm tra..." : "Kiểm tra tệp"}
            </button>
          </div>
        </div>
        <div className="import-step">
          <span>03</span>
          <div>
            <h3>Xác nhận import</h3>
            <p>
              Toàn bộ thay đổi được ghi trong một transaction sau khi bạn đối
              chiếu bảng xem trước.
            </p>
            <button
              className="primary"
              type="button"
              disabled={!result?.valid || loading}
              onClick={() => void commit()}
            >
              <CheckCircle2 size={16} />
              Import {result?.total || 0} tựa sách
            </button>
          </div>
        </div>
      </section>

      {result && (
        <>
          <section
            className={
              result.valid ? "import-result success" : "import-result error"
            }
          >
            {result.valid ? (
              <CheckCircle2 size={22} />
            ) : (
              <AlertTriangle size={22} />
            )}
            <div>
              <strong>
                {result.valid
                  ? "Tệp sẵn sàng để bạn xác nhận import"
                  : "Tệp có lỗi cần sửa"}
              </strong>
              <p>
                {result.valid
                  ? `${result.total} tựa sách, ${result.copy_total} quyển sẽ được tạo.`
                  : `Phát hiện ${result.errors.length} lỗi. Chưa có dữ liệu nào được ghi.`}
              </p>
            </div>
            {!result.valid && (
              <div className="preview-errors">
                {result.errors.map((error, index) => (
                  <div key={`${error.row}-${index}`}>
                    Dòng {error.row}: {error.message}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel import-preview">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Xem trước</p>
                <h3>Dữ liệu sẽ được nhập</h3>
              </div>
              <span className="muted">Hiển thị tối đa 50 dòng</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Dòng</th>
                    <th>Tựa sách</th>
                    <th>Tác giả</th>
                    <th>Năm XB</th>
                    <th>Thể loại</th>
                    <th>Số trang</th>
                    <th>Số quyển</th>
                    <th>Kệ</th>
                  </tr>
                </thead>
                <tbody>
                  {result.preview.map((row) => (
                    <tr key={row._row}>
                      <td>{row._row}</td>
                      <td>
                        <strong>{row.title || "-"}</strong>
                      </td>
                      <td>{row.author || "-"}</td>
                      <td>{row.publish_year}</td>
                      <td>{row.category || "-"}</td>
                      <td>{row.page_count}</td>
                      <td>{row.copy_count}</td>
                      <td>{row.shelf || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
