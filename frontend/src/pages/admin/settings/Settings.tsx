import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { operationsApi, type Policy } from "../../../api/operationsApi";
import { errorMessage } from "../../../utils/format";
export function Settings() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    operationsApi
      .policies()
      .then((response) => setPolicies(response.data))
      .finally(() => setLoading(false));
  }, []);
  const update = (index: number, key: keyof Policy, value: string) =>
    setPolicies((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: Number(value) } : item,
      ),
    );
  const save = async () => {
    try {
      await operationsApi.updatePolicies(policies);
      toast.success("Đã lưu cài đặt");
    } catch (error) {
      toast.error(errorMessage(error, "Không thể lưu cài đặt"));
    }
  };
  return (
    <section className="section-stack">
      <section className="panel settings-panel">
        <p className="eyebrow">Cài đặt</p>
        <h2>Chính sách mượn trả</h2>
        <p className="muted">
          Mã quyển được tự sinh theo tên tựa sách, ví dụ Tin Học 9 tạo TH9-1,
          TH9-2. Chính sách dưới đây áp dụng theo loại độc giả.
        </p>
        {loading ? (
          <p className="loading-line">Đang tải...</p>
        ) : (
          <>
            <div className="policy-grid">
              {policies.map((policy, index) => (
                <div className="policy-row" key={policy.user_type}>
                  <h3>
                    {policy.user_type === "student" ? "Học sinh" : "Giáo viên"}
                  </h3>
                  <label>
                    Số quyển tối đa
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
                    Số ngày mượn
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
                    Số lần gia hạn
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
                    Số ngày gia hạn
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
                    Giờ giữ sách
                    <input
                      type="number"
                      min="1"
                      value={policy.pickup_hours}
                      onChange={(event) =>
                        update(index, "pickup_hours", event.target.value)
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
            <button className="primary" onClick={() => void save()}>
              Lưu cài đặt
            </button>
          </>
        )}
      </section>
    </section>
  );
}
