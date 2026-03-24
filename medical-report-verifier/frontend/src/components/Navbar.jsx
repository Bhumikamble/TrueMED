import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { toast } from "react-toastify";

const navLinkStyle = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-brand-100 text-brand-700" : "text-slate-700 hover:bg-slate-100"
  }`;

const Navbar = () => {
  const { user, logout, getDisplayName } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!", { autoClose: 2000 });
    navigate("/");
    setShowLogoutConfirm(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  // Get navigation links based on user role
  const getNavLinks = () => {
    if (!user) {
      return [
        { name: "Home", path: "/", show: true },
        { name: "Verify Report", path: "/verify", show: true },
      ];
    }

    switch (user.role) {
      case "patient":
        return [
          { name: "Home", path: "/", show: true },
          { name: "Dashboard", path: "/dashboard", show: true },
          { name: "My Reports", path: "/my-reports", show: true },
          { name: "Shared Reports", path: "/shared-reports", show: true },
          { name: "Verify Report", path: "/verify", show: true },
          { name: "Consent", path: "/consent-management", show: true },
        ];
      
      case "lab":
        return [
          { name: "Home", path: "/", show: true },
          { name: "Dashboard", path: "/dashboard", show: true },
          { name: "Upload Report", path: "/upload", show: true },
          { name: "My Reports", path: "/lab-reports", show: true },
          { name: "Verify Report", path: "/verify", show: true },
        ];
      
      case "employer":
        return [
          { name: "Home", path: "/", show: true },
          { name: "Dashboard", path: "/dashboard", show: true },
          { name: "Shared Reports", path: "/shared-reports", show: true },
          { name: "Access Requests", path: "/access-requests", show: true },
          { name: "Verify Report", path: "/verify", show: true },
        ];
      
      case "admin":
        return [
          { name: "Home", path: "/", show: true },
          { name: "Admin Panel", path: "/admin", show: true },
          { name: "Users", path: "/admin/users", show: true },
          { name: "Reports", path: "/admin/reports", show: true },
          { name: "Analytics", path: "/admin/analytics", show: true },
        ];
      
      default:
        return [
          { name: "Home", path: "/", show: true },
          { name: "Verify Report", path: "/verify", show: true },
        ];
    }
  };

  // Get role badge color
  const getRoleBadgeColor = () => {
    if (!user) return "bg-gray-100 text-gray-700";
    switch (user.role) {
      case "patient":
        return "bg-blue-100 text-blue-800";
      case "lab":
        return "bg-green-100 text-green-800";
      case "employer":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get role icon
  const getRoleIcon = () => {
    if (!user) return null;
    switch (user.role) {
      case "patient":
        return "👤";
      case "lab":
        return "🏥";
      case "employer":
        return "💼";
      case "admin":
        return "⚙️";
      default:
        return null;
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-brand-900">
            TrueMED
            <span className="ml-1 text-xs text-gray-500">Blockchain Medical Reports</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              link.show && (
                <NavLink key={link.path} to={link.path} className={navLinkStyle}>
                  {link.name}
                </NavLink>
              )
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Info */}
                <div className="hidden md:flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeColor()}`}>
                    {getRoleIcon()} {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <span className="text-sm text-gray-700">
                    {getDisplayName()}
                  </span>
                </div>

                {/* Profile Dropdown (Mobile) */}
                <div className="relative md:hidden">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1"
                  >
                    <span className="text-sm">{getDisplayName()}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isMobileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          handleLogoutClick();
                          setIsMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                  >
                    Profile
                  </Link>
                  <button
                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                    onClick={handleLogoutClick}
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link className="btn-secondary" to="/login">
                  Login
                </Link>
                <Link className="btn-primary" to="/register">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-2 space-y-1">
              {navLinks.map((link) => (
                link.show && (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive ? "bg-brand-100 text-brand-700" : "text-slate-700 hover:bg-slate-100"
                      }`
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </NavLink>
                )
              ))}
              {user && (
                <>
                  <hr className="my-2" />
                  <Link
                    to="/profile"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogoutClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-xl">
            <div className="text-center mb-4">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3>
              <p className="text-gray-600 mt-2">
                Are you sure you want to logout from your account?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;