import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getAdminStatsApi, getUsersApi, getAdminReportsApi, updateUserRoleApi, deleteUserApi, toggleUserStatusApi } from "../services/reportService";

const AdminPanel = ({ section = "dashboard" }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(section);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard" || activeTab === "analytics") {
        const statsResponse = await getAdminStatsApi();
        setStats(statsResponse.data);
      }
      
      if (activeTab === "users") {
        const usersResponse = await getUsersApi();
        setUsers(usersResponse.data.users || []);
      }
      
      if (activeTab === "reports") {
        const reportsResponse = await getAdminReportsApi();
        setReports(reportsResponse.data.reports || []);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast.error(error.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRoleApi(userId, newRole);
      toast.success("User role updated successfully");
      loadAdminData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await toggleUserStatusApi(userId);
      toast.success(`User ${currentStatus ? "disabled" : "enabled"} successfully`);
      loadAdminData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        await deleteUserApi(userId);
        toast.success("User deleted successfully");
        loadAdminData();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete user");
      }
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "lab":
        return "bg-green-100 text-green-800";
      case "employer":
        return "bg-purple-100 text-purple-800";
      case "patient":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers = users.filter(user => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return user.name?.toLowerCase().includes(searchLower) ||
             user.email?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage users, reports, and monitor system health</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`pb-4 px-1 transition ${
              activeTab === "dashboard"
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-4 px-1 transition ${
              activeTab === "users"
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`pb-4 px-1 transition ${
              activeTab === "reports"
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-4 px-1 transition ${
              activeTab === "analytics"
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && stats && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-blue-600">{stats.users?.total || 0}</p>
              <div className="mt-2 text-xs text-gray-400">
                <span>Patients: {stats.users?.patients || 0}</span>
                <span className="mx-2">|</span>
                <span>Labs: {stats.users?.labs || 0}</span>
                <span className="mx-2">|</span>
                <span>Employers: {stats.users?.employers || 0}</span>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
              <p className="text-gray-500 text-sm">Total Reports</p>
              <p className="text-3xl font-bold text-green-600">{stats.reports?.total || 0}</p>
              <p className="text-xs text-gray-400 mt-2">
                Verifications: {stats.reports?.verifications || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
              <p className="text-gray-500 text-sm">Blockchain Status</p>
              <p className="text-3xl font-bold text-green-600">✓ Active</p>
              <p className="text-xs text-gray-400 mt-2">Sepolia Testnet</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
              <p className="text-gray-500 text-sm">System Health</p>
              <p className="text-3xl font-bold text-green-600">Healthy</p>
              <p className="text-xs text-gray-400 mt-2">All systems operational</p>
            </div>
          </div>

          {/* Recent Reports Preview */}
          {stats.recentReports && stats.recentReports.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Recent Reports</h2>
              <div className="space-y-3">
                {stats.recentReports.map((report) => (
                  <div key={report._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Patient: {report.patientId}</p>
                      <p className="text-sm text-gray-500">Type: {report.reportType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</p>
                      <button
                        onClick={() => navigate(`/report/${report._id}`)}
                        className="text-blue-500 text-sm hover:underline"
                      >
                        View →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex flex-wrap gap-4 justify-between items-center">
            <h2 className="text-xl font-bold">Registered Users</h2>
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="patient">Patients</option>
                <option value="lab">Labs</option>
                <option value="employer">Employers</option>
                <option value="admin">Admins</option>
              </select>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-64 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr className="text-gray-600">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)} border-0 focus:ring-2`}
                        >
                          <option value="patient">Patient</option>
                          <option value="lab">Lab</option>
                          <option value="employer">Employer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{user.labId || user.patientId || user.employerId || "-"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isActive !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {user.isActive !== false ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleStatus(user._id, user.isActive !== false)}
                            className={`text-xs px-2 py-1 rounded ${user.isActive !== false ? "text-yellow-600 hover:text-yellow-800" : "text-green-600 hover:text-green-800"}`}
                          >
                            {user.isActive !== false ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t text-sm text-gray-500">
            Total: {filteredUsers.length} users
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">All Reports</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr className="text-gray-600">
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Report Type</th>
                  <th className="py-3 px-4">Report Hash</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verifications</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No reports found
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{report.patientId}</td>
                      <td className="py-3 px-4 capitalize">{report.reportType}</td>
                      <td className="py-3 px-4 font-mono text-xs">{report.reportHash?.substring(0, 16)}...</td>
                      <td className="py-3 px-4">{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {report.status || "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4">{report.verifiedCount || 0}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/report/${report._id}`)}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Reports by Type</h2>
              <div className="space-y-3">
                {stats.reportsByType?.map((type) => (
                  <div key={type._id} className="flex justify-between items-center">
                    <span className="capitalize">{type._id || "General"}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(type.count / stats.totalReports) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{type.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Reports by Month</h2>
              <div className="space-y-3">
                {stats.reportsByMonth?.slice(0, 6).map((month) => (
                  <div key={`${month._id.year}-${month._id.month}`} className="flex justify-between items-center">
                    <span>{new Date(month._id.year, month._id.month - 1).toLocaleString('default', { month: 'short' })} {month._id.year}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(month.count / Math.max(...stats.reportsByMonth.map(m => m.count)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{month.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">System Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Blockchain Network</p>
                <p className="font-medium">Sepolia Testnet</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contract Address</p>
                <p className="font-medium text-xs break-all">{process.env.REACT_APP_CONTRACT_ADDRESS || "0x1EA2cd..."}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Verification Method</p>
                <p className="font-medium">SHA-256 + Blockchain</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;