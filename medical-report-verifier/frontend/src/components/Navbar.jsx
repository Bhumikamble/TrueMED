import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const navLinkStyle = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-brand-100 text-brand-700" : "text-slate-700 hover:bg-slate-100"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-2xl font-bold text-brand-900">
          TrueMED
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" className={navLinkStyle}>
            Home
          </NavLink>
          <NavLink to="/upload" className={navLinkStyle}>
            Upload Report
          </NavLink>
          <NavLink to="/verify" className={navLinkStyle}>
            Verify Report
          </NavLink>
          <NavLink to="/dashboard" className={navLinkStyle}>
            Dashboard
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={navLinkStyle}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {user.role}
              </span>
              <button className="btn-secondary" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn-secondary" to="/login">
                Login
              </Link>
              <Link className="btn-primary" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
