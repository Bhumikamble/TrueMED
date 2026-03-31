import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { toast } from "react-toastify";

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
        { name: "Home", path: "/", icon: "🏠" },
        { name: "Features", path: "/#features", icon: "⭐" },
        { name: "How It Works", path: "/#how-it-works", icon: "📖" },
      ];
    }

    switch (user.role) {
      case "patient":
        return [
          { name: "Dashboard", path: "/dashboard", icon: "📊" },
          { name: "My Reports", path: "/my-reports", icon: "📄" },
          { name: "Shared", path: "/shared-reports", icon: "🔗" },
          { name: "Verify", path: "/verify", icon: "🔍" },
          { name: "QR Verify", path: "/verify-qr", icon: "📱" },
          { name: "Consent", path: "/consent-management", icon: "🔐" },
        ];
      
      case "lab":
        return [
          { name: "Dashboard", path: "/dashboard", icon: "📊" },
          { name: "Upload", path: "/upload", icon: "📤" },
          { name: "Reports", path: "/lab-reports", icon: "📋" },
          { name: "Verify", path: "/verify", icon: "🔍" },
          { name: "QR Verify", path: "/verify-qr", icon: "📱" },
        ];
      
      case "employer":
        return [
          { name: "Dashboard", path: "/dashboard", icon: "📊" },
          { name: "Shared", path: "/shared-reports", icon: "🔗" },
          { name: "Requests", path: "/access-requests", icon: "📨" },
          { name: "Verify", path: "/verify", icon: "🔍" },
          { name: "QR Verify", path: "/verify-qr", icon: "📱" },
        ];
      
      case "admin":
        return [
          { name: "Dashboard", path: "/dashboard", icon: "📊" },
          { name: "Users", path: "/admin/users", icon: "👥" },
          { name: "Reports", path: "/admin/reports", icon: "📄" },
          { name: "Analytics", path: "/admin/analytics", icon: "📈" },
          { name: "QR Verify", path: "/verify-qr", icon: "📱" },
        ];
      
      default:
        return [
          { name: "Home", path: "/", icon: "🏠" },
          { name: "Features", path: "/#features", icon: "⭐" },
          { name: "How It Works", path: "/#how-it-works", icon: "📖" },
        ];
    }
  };

  // Get role badge configuration
  const getRoleConfig = () => {
    if (!user) return null;
    const roleConfigs = {
      patient: { color: "bg-blue-100 text-blue-700", icon: "👤", label: "Patient" },
      lab: { color: "bg-green-100 text-green-700", icon: "🏥", label: "Lab" },
      employer: { color: "bg-purple-100 text-purple-700", icon: "💼", label: "Employer" },
      admin: { color: "bg-red-100 text-red-700", icon: "⚙️", label: "Admin" },
    };
    return roleConfigs[user.role];
  };

  const navLinks = getNavLinks();
  const roleConfig = getRoleConfig();

  // Scroll to section handler
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-white text-lg font-bold">TM</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  TrueMED
                </span>
                <span className="text-xs text-gray-500 hidden sm:block">Blockchain Medical Reports</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={(e) => {
                    if (link.path.startsWith('/#')) {
                      e.preventDefault();
                      const sectionId = link.path.replace('/#', '');
                      scrollToSection(e, sectionId);
                    }
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.name}</span>
                </NavLink>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Desktop User Section */}
                  <div className="hidden md:flex items-center gap-3">
                    {/* Role Badge */}
                    {roleConfig && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
                        <span>{roleConfig.icon}</span>
                        <span>{roleConfig.label}</span>
                      </span>
                    )}
                    
                    {/* User Avatar */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs font-medium">
                          {getDisplayName().charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{getDisplayName()}</span>
                    </div>

                    {/* Action Buttons */}
                    <NavLink
                      to="/profile"
                      className={({ isActive }) =>
                        `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          isActive
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:bg-gray-100"
                        }`
                      }
                    >
                      Profile
                    </NavLink>
                    <button
                      onClick={handleLogoutClick}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
                    >
                      Logout
                    </button>
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && user && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-4 py-3 space-y-1">
              {/* User Info in Mobile */}
              <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-base font-medium">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{getDisplayName()}</p>
                  {roleConfig && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleConfig.color}`}>
                      <span>{roleConfig.icon}</span>
                      <span>{roleConfig.label}</span>
                    </span>
                  )}
                </div>
              </div>
              
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.name}</span>
                </NavLink>
              ))}
              
              <div className="border-t border-gray-100 pt-2 mt-2">
                <NavLink
                  to="/profile"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-lg">👤</span>
                  <span>Profile</span>
                </NavLink>
                <NavLink
                  to="/settings"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-lg">⚙️</span>
                  <span>Settings</span>
                </NavLink>
                <button
                  onClick={() => {
                    handleLogoutClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <span className="text-lg">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 max-w-full shadow-2xl transform transition-all">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to logout from your account?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;