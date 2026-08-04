import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

const shelfBooks = [
  "shelf-book-blue shelf-book-tall",
  "shelf-book-orange shelf-book-high",
  "shelf-book-gold shelf-book-medium",
  "shelf-book-teal shelf-book-tall",
  "shelf-book-slate shelf-book-short",
];

const lowerShelfBooks = [
  "shelf-book-gold shelf-book-high",
  "shelf-book-blue shelf-book-medium",
  "shelf-book-teal shelf-book-medium",
  "shelf-book-orange shelf-book-medium",
  "shelf-book-slate shelf-book-high",
  "shelf-book-blue shelf-book-high",
];

export function Landing() {
  const { user } = useAuth();
  const libraryPath =
    user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard";

  return (
    <main className="landing landing-simple">
      <section className="landing-hero">
        <div className="hero-copy">
          <p className="hero-school">
            <Sparkles size={17} aria-hidden="true" />
            Thư viện THCS Bình Chuẩn
          </p>
          <h1>
            <span>Đọc nhiều hơn.</span>
            <span>Mượn sách dễ hơn.</span>
          </h1>
          <p>
            Tra cứu tựa sách, xem lịch phục vụ của từng quyển và gửi yêu cầu
            mượn theo thời gian bạn cần.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link className="primary" to={libraryPath}>
                Truy cập thư viện <ArrowRight size={18} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link className="primary" to="/login">
                  Đăng nhập <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link className="secondary" to="/register">
                  Tạo tài khoản
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-library-scene" role="img" aria-label="Kệ sách">
          <div className="shelf-row">
            {shelfBooks.map((bookClass) => (
              <span className={`shelf-book ${bookClass}`} key={bookClass} />
            ))}
          </div>
          <div className="shelf-row">
            {lowerShelfBooks.map((bookClass) => (
              <span className={`shelf-book ${bookClass}`} key={bookClass} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
