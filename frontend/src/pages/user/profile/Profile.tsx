import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { operationsApi } from "../../../api/operationsApi";
import { userApi } from "../../../api/userApi";
import { FieldLabel } from "../../../components/common/FieldLabel";
import { PageLoader } from "../../../components/common/PageLoader";
import { Selector } from "../../../components/common/Selector";
import { errorMessage, initials } from "../../../utils/format";
import { normalizeClassName, validClassName, validPhone } from "../../../utils/validation";

export function Profile() {
  const [profile, setProfile] = useState<any>();
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    userApi.profile().then((response) => setProfile(response.data));
    operationsApi.departments().then((response) => setDepartments(response.data.map((item) => item.name)));
  }, []);

  if (!profile) return <PageLoader />;
  const update = (key: string, value: string) => setProfile({ ...profile, [key]: value });
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validPhone(profile.phone || "") || (profile.user_type === "student" && !validClassName(profile.class_name || ""))) {
      toast.error("Vui lòng kiểm tra lại thông tin.");
      return;
    }
    try {
      await userApi.updateProfile({ ...profile, class_name: normalizeClassName(profile.class_name || "") });
      toast.success("Đã cập nhật hồ sơ");
    } catch (error) {
      toast.error(errorMessage(error, "Không thể cập nhật hồ sơ"));
    }
  };

  return <section className="profile-grid">
    <form className="panel profile-form" onSubmit={save}>
      <header className="profile-heading">
        <div className="avatar large">{initials(profile.full_name)}</div>
        <div><p className="eyebrow">Thông tin cá nhân</p><h3>{profile.full_name}</h3><span className="muted">{profile.user_type === "student" ? "Học sinh" : "Giáo viên"}</span></div>
      </header>
      <div className="form-grid">
        <label><FieldLabel>Họ và tên</FieldLabel><input value={profile.full_name || ""} disabled /></label>
        <label><FieldLabel>Giới tính</FieldLabel><Selector value={profile.gender || "male"} onChange={(event) => update("gender", event.target.value)}><option value="male">Nam</option><option value="female">Nữ</option></Selector></label>
        <label><FieldLabel>Email</FieldLabel><input type="email" value={profile.email || ""} onChange={(event) => update("email", event.target.value)} /></label>
        <label><FieldLabel>Số điện thoại</FieldLabel><input maxLength={10} value={profile.phone || ""} onChange={(event) => update("phone", event.target.value.replace(/\D/g, ""))} />{profile.phone && !validPhone(profile.phone) && <small className="field-error">Số điện thoại không hợp lệ.</small>}</label>
        <label><FieldLabel>{profile.user_type === "student" ? "Lớp" : "Tổ bộ môn"}</FieldLabel>{profile.user_type === "student" ? <input value={profile.class_name || ""} onChange={(event) => update("class_name", normalizeClassName(event.target.value))} /> : <Selector value={profile.department || ""} onChange={(event) => update("department", event.target.value)}><option value="">Chọn tổ bộ môn</option>{departments.map((name) => <option key={name} value={name}>{name}</option>)}</Selector>}</label>
      </div>
      <div className="profile-actions"><button className="primary">Lưu thay đổi</button></div>
    </form>
  </section>;
}
