import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { operationsApi } from "../../api/operationsApi";
import { Toolbar } from "../../components/common/Toolbar";
import { errorMessage } from "../../utils/format";

type ImportPreview = { _row: number; title: string; author: string; publisher: string; publish_year: number; category: string; page_count: number; copy_count: number; shelf: string };
type ImportResult = { valid: boolean; preview: ImportPreview[]; errors: Array<{ row: number; message: string }>; total: number; copy_total: number };

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function WorkflowStep({ title, description, disabled, children }: { title: string; description: string; disabled?: boolean; children: React.ReactNode }) {
  return <section className={`import-step ${disabled ? "is-disabled" : ""}`} aria-disabled={disabled || undefined}><div><h2>{title}</h2><p>{description}</p>{children}</div></section>;
}

export function SpreadsheetImport() {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<ImportResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const download = async () => {
    try { const response = await operationsApi.downloadTemplate(); save(response.data, "Tu_sach_template.xlsx"); }
    catch (requestError) { setError(errorMessage(requestError, "Không thể tải template Excel.")); }
  };
  const inspect = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try { const response = await operationsApi.validateSpreadsheet(file); setResult(response.data); }
    catch (requestError) { setError(errorMessage(requestError, "Không thể đọc tệp Excel.")); setResult(undefined); }
    finally { setLoading(false); }
  };
  const commit = async () => {
    if (!file || !result?.valid) return;
    setLoading(true); setError("");
    try { const response = await operationsApi.importSpreadsheet(file); toast.success(response.data.message); setFile(undefined); setResult(undefined); }
    catch (requestError) { setError(errorMessage(requestError, "Không thể import dữ liệu.")); }
    finally { setLoading(false); }
  };

  return <div className="import-page section-stack">
    <Toolbar title="Nhập tựa sách từ Excel" description="Tải template, kiểm tra dữ liệu, rồi xác nhận trước khi hệ thống ghi thay đổi." actions={<button className="secondary" type="button" onClick={async () => { try { const response = await operationsApi.exportSpreadsheet(); save(response.data, `Bao_cao_muon_tra_${new Date().toISOString().slice(0, 10)}.xlsx`); } catch (requestError) { setError(errorMessage(requestError, "Không thể xuất báo cáo.")); } }}><Download size={17} aria-hidden="true" />Xuất báo cáo</button>} />
    {error && <div className="inline-error" role="alert"><span>{error}</span><button className="secondary" type="button" onClick={() => setError("")}>Đóng</button></div>}
    <div className="import-workflow">
      <WorkflowStep title="Template" description="Dùng đúng cấu trúc cột để hệ thống kiểm tra dữ liệu."><button className="secondary" type="button" onClick={() => void download()}><Download size={16} aria-hidden="true" />Tải template</button></WorkflowStep>
      <WorkflowStep title="Chọn file" description="Chọn một tệp .xlsx theo template vừa tải."><label className="file-drop"><FileSpreadsheet size={24} aria-hidden="true" /><strong>{file?.name || "Chọn tệp .xlsx"}</strong><input type="file" accept=".xlsx" onChange={(event) => { setFile(event.target.files?.[0]); setResult(undefined); setError(""); }} /></label></WorkflowStep>
      <WorkflowStep title="Validate" description="Kiểm tra tiêu đề, số trang, số quyển và dữ liệu bắt buộc." disabled={!file}><button className="secondary" type="button" disabled={!file || loading} onClick={() => void inspect()}><Upload size={16} aria-hidden="true" />{loading ? "Đang kiểm tra..." : "Kiểm tra tệp"}</button></WorkflowStep>
      <WorkflowStep title="Kết quả" description={result ? (result.valid ? `${result.total} tựa sách và ${result.copy_total} quyển đã sẵn sàng.` : `Phát hiện ${result.errors.length} lỗi cần sửa.`) : "Kết quả validation sẽ hiển thị ở đây."} disabled={!result}>{result ? <div className={result.valid ? "import-result success" : "import-result error"}>{result.valid ? <CheckCircle2 size={22} aria-hidden="true" /> : <AlertTriangle size={22} aria-hidden="true" />}<div><strong>{result.valid ? "Dữ liệu hợp lệ" : "Dữ liệu cần chỉnh sửa"}</strong>{!result.valid && <div className="preview-errors">{result.errors.map((item, index) => <div key={`${item.row}-${index}`}>Dòng {item.row}: {item.message}</div>)}</div>}</div></div> : null}</WorkflowStep>
      <WorkflowStep title="Commit" description="Chỉ ghi dữ liệu sau khi validation thành công." disabled={!result?.valid}><button className="primary" type="button" disabled={!result?.valid || loading} onClick={() => void commit()}><CheckCircle2 size={16} aria-hidden="true" />{loading ? "Đang import..." : `Import ${result?.total || 0} tựa sách`}</button></WorkflowStep>
    </div>
    {result?.valid && <section className="panel table-panel import-preview"><div className="panel-heading"><div><h2>Xem trước dữ liệu</h2><p className="muted">Hiển thị tối đa 50 dòng trước khi commit.</p></div></div><div className="table-scroll"><table><thead><tr><th>Dòng</th><th>Tựa sách</th><th>Tác giả</th><th>Năm XB</th><th>Thể loại</th><th>Số trang</th><th>Số quyển</th><th>Kệ</th></tr></thead><tbody>{result.preview.map((row) => <tr key={row._row}><td>{row._row}</td><td><strong>{row.title || "-"}</strong></td><td>{row.author || "-"}</td><td>{row.publish_year}</td><td>{row.category || "-"}</td><td>{row.page_count}</td><td>{row.copy_count}</td><td>{row.shelf || "-"}</td></tr>)}</tbody></table></div></section>}
  </div>;
}
