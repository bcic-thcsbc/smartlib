import { useState } from "react";
import toast from "react-hot-toast";
import { userApi } from "../../../api/userApi";
import { errorMessage } from "../../../utils/format";
import { Toolbar } from "../../../components/common/Toolbar";
export function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await userApi.changePassword({
        current_password: current,
        new_password: next,
      });
      toast.success("Đã cập nhật mật khẩu");
      setCurrent("");
      setNext("");
    } catch (error) {
      toast.error(errorMessage(error, "Không thể cập nhật mật khẩu"));
    }
  };
  return (
    <div className="section-stack profile-grid">
      <Toolbar title="Đổi mật khẩu" description="Dùng mật khẩu riêng tư và không dùng lại ở nơi khác." />
      <form className="panel profile-form" onSubmit={submit}>
        <div className="profile-heading">
          <div>
            <p className="eyebrow">Bảo mật tài khoản</p>
            <h3>Đổi mật khẩu</h3>
            <span className="muted">
              Hãy dùng mật khẩu riêng tư và không dùng lại ở nơi khác.
            </span>
          </div>
        </div>
        <label>
          Mật khẩu hiện tại
          <input
            type="password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <label>
          Mật khẩu mới
          <input
            type="password"
            minLength={8}
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>
        <button className="primary">Cập nhật mật khẩu</button>
      </form>
    </div>
  );
}
