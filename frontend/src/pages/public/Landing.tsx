import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

const libraryImage = "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=85";

export function Landing() {
  const { user, loading } = useAuth();
  const libraryPath = user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard";

  return (
    <main className="landing landing-simple">
      <header className="landing-header">
        <Link to="/" className="landing-brand"><span><BookOpen size={21} aria-hidden="true" /></span>SMARTLIB</Link>
        <nav>{loading ? <span className="nav-loading">Đang kiểm tra phiên...</span> : user ? <Link to={libraryPath}>Truy cập thư viện số</Link> : <><Link to="/login">Đăng nhập</Link><Link to="/register">Đăng ký</Link></>}</nav>
      </header>
      <section className="landing-hero">
        <div className="hero-copy">
          <p className="hero-school">Thư viện số Trường THCS Bình Chuẩn</p>
          <h1>Thư viện số SmartLib</h1>
          <p>Tra cứu sách, gửi yêu cầu mượn và theo dõi phiếu mượn trong một không gian rõ ràng, dễ dùng.</p>
          <div className="hero-actions">
            {user ? <Link className="primary" to={libraryPath}>Truy cập thư viện <ArrowRight size={18} aria-hidden="true" /></Link> : <><Link className="primary" to="/login">Đăng nhập <ArrowRight size={18} aria-hidden="true" /></Link><Link className="secondary" to="/register">Tạo tài khoản</Link></>}
          </div>
        </div>
        <img className="hero-library-image" src={libraryImage} alt="Kệ sách trong thư viện" />
      </section>
    </main>
  );
}
