import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

export function Landing() {
  const { user, loading } = useAuth();
  const libraryPath =
    user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard";
  return (
    <main className="landing landing-simple">
      <header className="landing-header">
        <Link to="/" className="landing-brand">
          <span>
            <BookOpen size={21} />
          </span>
          SMARTLIB
        </Link>
        <nav>
          {loading ? (
            <span className="nav-loading">Đang kiểm tra phiên...</span>
          ) : user ? (
            <Link to={libraryPath}>Vào thư viện</Link>
          ) : (
            <>
              <Link to="/login">Đăng nhập</Link>
              <Link to="/register">Đăng ký</Link>
            </>
          )}
        </nav>
      </header>
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="hero-badge">
            <Sparkles size={16} /> Thư viện THCS Bình Chuẩn
          </div>
          <h1>
            Đọc nhiều hơn.
            <br />
            <span>Mượn sách dễ hơn.</span>
          </h1>
          <p>
            Tra cứu tựa sách, xem lịch phục vụ của từng quyển và gửi yêu cầu
            mượn theo thời gian bạn cần.
          </p>
          <div className="hero-actions">
            {!loading &&
              (user ? (
                <Link className="primary" to={libraryPath}>
                  Vào thư viện <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link className="primary" to="/login">
                    Đăng nhập <ArrowRight size={18} />
                  </Link>
                  <Link className="secondary" to="/register">
                    Tạo tài khoản
                  </Link>
                </>
              ))}
          </div>
        </div>
        <div className="hero-library-scene" aria-hidden="true">
          <div className="scene-shelf shelf-top">
            <i className="book-spine book-blue"></i>
            <i className="book-spine book-coral tall"></i>
            <i className="book-spine book-gold"></i>
            <i className="book-spine book-teal tall"></i>
            <i className="book-spine book-slate short"></i>
          </div>

          <div className="scene-shelf shelf-bottom">
            <i className="book-spine book-gold tall"></i>
            <i className="book-spine book-blue short"></i>
            <i className="book-spine book-teal"></i>
            <i className="book-spine book-coral"></i>
            <i className="book-spine book-slate tall"></i>
            <i className="book-spine book-blue"></i>
          </div>
        </div>
      </section>
    </main>
  );
}
