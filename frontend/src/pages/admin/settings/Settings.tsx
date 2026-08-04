import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { operationsApi, type Policy } from "../../../api/operationsApi";
import { Toolbar } from "../../../components/common/Toolbar";
import { FloatingInput } from "../../../components/common/FloatingInput";
import { FieldLabel } from "../../../components/common/FieldLabel";
import { PageError } from "../../../components/common/PageError";
import { PageLoader } from "../../../components/common/PageLoader";
import { errorMessage } from "../../../utils/format";

export function Settings() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentDraft, setDepartmentDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([operationsApi.policies(), operationsApi.departments()])
      .then(([policyResponse, departmentResponse]) => {
        setPolicies(policyResponse.data);
        setDepartments(departmentResponse.data.map((item) => item.name));
      })
      .catch((requestError) =>
        setError(errorMessage(requestError, "Không thể tải cài đặt.")),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const update = (index: number, key: keyof Policy, value: string) =>
    setPolicies((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: Number(value) } : item,
      ),
    );
  const addDepartment = () => {
    const value = departmentDraft.trim();
    if (!value || departments.includes(value)) return;
    setDepartments((items) => [...items, value]);
    setDepartmentDraft("");
  };
  const save = async () => {
    try {
      await Promise.all([
        operationsApi.updatePolicies(policies),
        operationsApi.updateDepartments(departments),
      ]);
      toast.success("Đã lưu cài đặt");
    } catch (error) {
      toast.error(errorMessage(error, "Không thể lưu cài đặt"));
    }
  };
  return (
    <section className="section-stack settings-page content-readable">
      <Toolbar
        eyebrow="Cài đặt vận hành"
        title="Chính sách và danh mục"
        description="Các thay đổi dưới đây được áp dụng ngay cho tài khoản và luồng mượn mới."
        actions={
          <button className="primary" onClick={() => void save()}>
            Lưu thay đổi
          </button>
        }
      />
      {loading ? (
        <PageLoader />
      ) : error ? (
        <PageError message={error} onRetry={() => void load()} />
      ) : (
        <>
          <section className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Lưu thông</p>
                <h3>Chính sách mượn trả</h3>
              </div>
            </div>
            <div className="policy-grid">
              {policies.map((policy, index) => (
                <article className="policy-row" key={policy.user_type}>
                  <header>
                    <span className="policy-badge">
                      {policy.user_type === "student" ? "HS" : "GV"}
                    </span>
                    <div>
                      <h3>
                        {policy.user_type === "student"
                          ? "Học sinh"
                          : "Giáo viên"}
                      </h3>
                      <p>
                        {policy.user_type === "student"
                          ? "Độc giả học sinh"
                          : "Độc giả giáo viên"}
                      </p>
                    </div>
                  </header>
                  <label>
                    <FieldLabel>Số quyển tối đa</FieldLabel>
                    <input
                      type="number"
                      min="1"
                      value={policy.max_active_loans}
                      onChange={(event) =>
                        update(index, "max_active_loans", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <FieldLabel>Số ngày mượn</FieldLabel>
                    <input
                      type="number"
                      min="1"
                      value={policy.loan_days}
                      onChange={(event) =>
                        update(index, "loan_days", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <FieldLabel>Số lần gia hạn</FieldLabel>
                    <input
                      type="number"
                      min="0"
                      value={policy.max_renewals}
                      onChange={(event) =>
                        update(index, "max_renewals", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <FieldLabel>Số ngày gia hạn</FieldLabel>
                    <input
                      type="number"
                      min="1"
                      value={policy.renewal_days}
                      onChange={(event) =>
                        update(index, "renewal_days", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    <FieldLabel>Giờ giữ sách</FieldLabel>
                    <input
                      type="number"
                      min="1"
                      value={policy.pickup_hours}
                      onChange={(event) =>
                        update(index, "pickup_hours", event.target.value)
                      }
                    />
                  </label>
                </article>
              ))}
            </div>
          </section>
          <section className="panel department-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Dữ liệu đăng ký</p>
                <h3>Tổ bộ môn</h3>
                <p className="muted">
                  Danh mục hiển thị cho giáo viên khi đăng ký và cập nhật hồ sơ.
                </p>
              </div>
            </div>
            <div className="department-composer">
              <FloatingInput
                label="Ví dụ: Âm nhạc - Mỹ thuật"
                value={departmentDraft}
                onChange={(event) => setDepartmentDraft(event.target.value)}
                onKeyDown={(event) =>
                  event.key === "Enter" &&
                  (event.preventDefault(), addDepartment())
                }
              />
              <button
                className="secondary"
                type="button"
                onClick={addDepartment}
              >
                <Plus size={17} />
                Thêm tổ
              </button>
            </div>
            <div className="department-chips">
              {departments.map((department) => (
                <span className="department-chip" key={department}>
                  {department}
                  <button
                    type="button"
                    onClick={() =>
                      setDepartments((items) =>
                        items.filter((item) => item !== department),
                      )
                    }
                    aria-label={`Xóa ${department}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
