import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Role-based dashboards
import PatientDashboard from "./pages/PatientDashboard";
import LabDashboard from "./pages/LabDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import AdminPanel from "./pages/AdminPanel";

// Report pages
import UploadReport from "./pages/UploadReport";
import VerifyReport from "./pages/VerifyReport";

// Lab pages
import LabReports from "./pages/LabReports";

// Additional pages
import MyReports from "./pages/MyReports";
import SharedReports from "./pages/SharedReports";
import ReportDetails from "./pages/ReportDetails";
import ConsentManagement from "./pages/ConsentManagement";
import AccessRequests from "./pages/AccessRequests";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

const App = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Dismiss all toasts when route changes (prevents stuck toasts)
  useEffect(() => {
    toast.dismiss();
  }, [location.pathname]);

  // Role-based dashboard redirect
  const getDashboardComponent = () => {
    if (!user) return <Navigate to="/login" />;
    
    switch (user.role) {
      case "patient":
        return <PatientDashboard />;
      case "lab":
        return <LabDashboard />;
      case "employer":
        return <EmployerDashboard />;
      case "admin":
        return <AdminPanel />;
      default:
        return <Navigate to="/" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="light"
        limit={3}
      />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyReport />} />

        {/* Role-based Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {getDashboardComponent()}
            </ProtectedRoute>
          }
        />

        {/* Patient Routes */}
        <Route
          path="/my-reports"
          element={
            <ProtectedRoute roles={["patient"]}>
              <MyReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shared-reports"
          element={
            <ProtectedRoute roles={["patient", "employer"]}>
              <SharedReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/consent-management"
          element={
            <ProtectedRoute roles={["patient"]}>
              <ConsentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/:reportId"
          element={
            <ProtectedRoute roles={["patient", "lab", "employer", "admin"]}>
              <ReportDetails />
            </ProtectedRoute>
          }
        />

        {/* Lab Routes */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute roles={["lab", "admin"]}>
              <UploadReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab-reports"
          element={
            <ProtectedRoute roles={["lab", "admin"]}>
              <LabReports />
            </ProtectedRoute>
          }
        />

        {/* Employer Routes */}
        <Route
          path="/access-requests"
          element={
            <ProtectedRoute roles={["employer"]}>
              <AccessRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verified-reports"
          element={
            <ProtectedRoute roles={["employer"]}>
              <SharedReports />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPanel section="users" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPanel section="reports" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPanel section="analytics" />
            </ProtectedRoute>
          }
        />

        {/* Common Routes for All Authenticated Users */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* 404 - Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;