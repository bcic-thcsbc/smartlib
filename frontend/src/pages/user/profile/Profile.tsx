import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { userApi } from "../../../api/userApi";
import { PageLoader } from "../../../components/common/PageLoader";
import { errorMessage, initials } from "../../../utils/format";
export function Profile() {
  const [profile, setProfile] = useState<any>();
  useEffect(() => {
    userApi.profile().then((r) => setProfile(r.data));
  }, []);
  if (!profile) return <PageLoader />;
  const update = (key: string, value: string) =>
    setProfile({ ...profile, [key]: value });
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await userApi.updateProfile(profile);
      toast.success("Đã cập nhật hồ sơ");
    } catch (error) {
      toast.error(errorMessage(error, "Không thể cập nhật hồ sơ"));
    }
  };
  return (
    <section className="profile-grid">
      <form className="panel profile-form" onSubmit={save}>
        <div className="profile-heading">
          <div className="avatar large">{initials(profile.full_name)}</div>
          <div>
            <p className="eyebrow">Thông tin cá nhân</p>
            <h3>{profile.full_name}</h3>
            <span className="muted">
              {profile.user_type === "student" ? "Học sinh" : "Giáo viên"}
            </span>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Họ và tên
            <input
              value={profile.full_name || ""}
              onChange={(e) => update("full_name", e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              value={profile.email || ""}
              onChange={(e) => update("email", e.target.value)}
            />
          </label>
          <label>
            Số điện thoại
            <input
              value={profile.phone || ""}
              onChange={(e) => update("phone", e.target.value)}
            />
          </label>
          <label>
            {profile.user_type === "student" ? "Lớp" : "Tổ bộ môn"}
            <input
              value={profile.class_name || profile.department || ""}
              onChange={(e) =>
                update(
                  profile.user_type === "student" ? "class_name" : "department",
                  e.target.value,
                )
              }
            />
          </label>
        </div>
        <button className="primary">Lưu thay đổi</button>
      </form>
    </section>
  );
}
