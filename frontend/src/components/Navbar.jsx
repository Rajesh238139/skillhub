import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-semibold transition-colors ${
        location.pathname === to ? "text-violet-600" : "text-ink/60 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-cream/80 border-b border-violet-100/70">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/courses" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-cta flex items-center justify-center text-white font-display font-bold text-sm">S</span>
          <span className="font-display font-bold text-lg tracking-tight">SkillHub</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6">
          {navLink("/courses", "Browse")}
          {user?.role === "student" && navLink("/my-learning", "My learning")}
          {user?.role === "instructor" && navLink("/instructor", "Instructor studio")}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden md:inline text-sm text-ink/60">
                Hey, <span className="font-semibold text-ink">{user.name.split(" ")[0]}</span>
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 capitalize">
                {user.role}
              </span>
              <button onClick={handleLogout} className="btn-secondary !px-4 !py-2 text-sm">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary !px-4 !py-2 text-sm">Log in</Link>
              <Link to="/register" className="btn-primary !px-4 !py-2 text-sm">Sign up free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
