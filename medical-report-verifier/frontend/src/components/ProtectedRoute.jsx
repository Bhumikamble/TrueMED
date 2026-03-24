import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, roles = [], redirectTo = null, requiredPermissions = [] }) => {
  const { user, loading, isAuthenticated, getDashboardPath } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (roles.length > 0 && !roles.includes(user.role)) {
    // Determine where to redirect based on user role
    let redirectPath = redirectTo;
    
    if (!redirectPath) {
      // Smart redirect based on role
      switch (user.role) {
        case "patient":
          redirectPath = "/dashboard";
          break;
        case "lab":
          redirectPath = "/dashboard";
          break;
        case "employer":
          redirectPath = "/dashboard";
          break;
        case "admin":
          redirectPath = "/admin";
          break;
        default:
          redirectPath = "/";
      }
    }
    
    return (
      <Navigate 
        to={redirectPath} 
        replace 
        state={{ 
          error: `Access denied. ${user.role} does not have permission to access this page.` 
        }} 
      />
    );
  }

  // Check if account is active
  if (user.isActive === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Account Disabled</h2>
          <p>Your account has been disabled. Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  // ============================================
  // EMAIL VERIFICATION - DISABLED FOR NOW
  // Uncomment this block when email verification is implemented
  // ============================================
  /*
  // Check if email is verified (if required)
  if (user.isVerified === false && user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-4 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Email Verification Required</h2>
          <p>Please verify your email address to access this page.</p>
          <button 
            onClick={async () => {
              try {
                // Add your resend verification API call here
                const response = await fetch('/api/auth/resend-verification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: user.email })
                });
                if (response.ok) {
                  alert("Verification email sent! Please check your inbox.");
                } else {
                  alert("Failed to send verification email. Please try again.");
                }
              } catch (error) {
                console.error("Error sending verification:", error);
                alert("Error sending verification email.");
              }
            }}
            className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Resend Verification Email
          </button>
        </div>
      </div>
    );
  }
  */

  // Check if user has required permissions for specific actions
  const hasPermission = (requiredPermissions) => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    
    // Admin has all permissions
    if (user.role === "admin") return true;
    
    // Check role-based permissions
    const rolePermissions = {
      patient: ["view_own_reports", "share_reports", "manage_consent"],
      lab: ["upload_reports", "view_own_reports", "verify_reports"],
      employer: ["verify_reports", "view_shared_reports", "request_access"],
      verifier: ["verify_reports", "view_reports"],
    };
    
    const userPermissions = rolePermissions[user.role] || [];
    return requiredPermissions.every(perm => userPermissions.includes(perm));
  };

  // Check permissions if specified
  if (requiredPermissions.length > 0 && !hasPermission(requiredPermissions)) {
    return (
      <Navigate 
        to={getDashboardPath()} 
        replace 
        state={{ error: "You don't have permission to perform this action." }} 
      />
    );
  }

  // All checks passed - render the protected content
  return children;
};

// Higher-order component for protecting routes with role checks
export const withRoleProtection = (Component, allowedRoles = [], requiredPermissions = []) => {
  return (props) => (
    <ProtectedRoute roles={allowedRoles} requiredPermissions={requiredPermissions}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Helper to get role-based dashboard redirect
export const getRoleBasedRedirect = (user) => {
  if (!user) return "/login";
  
  switch (user.role) {
    case "patient":
      return "/dashboard";
    case "lab":
      return "/dashboard";
    case "employer":
      return "/dashboard";
    case "admin":
      return "/admin";
    default:
      return "/";
  }
};

export default ProtectedRoute;