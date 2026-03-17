import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { getAdminStatsApi, getUsersApi } from "../services/reportService";

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [statsResponse, usersResponse] = await Promise.all([getAdminStatsApi(), getUsersApi()]);
        setStats(statsResponse.data);
        setUsers(usersResponse.data.users);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load admin data");
      }
    };

    loadAdminData();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold text-brand-900">Admin Panel</h1>

      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="card text-center">
            <p className="text-sm text-slate-500">Total Users</p>
            <p className="text-3xl font-bold text-brand-800">{stats.totalUsers}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-500">Labs</p>
            <p className="text-3xl font-bold text-brand-800">{stats.totalLabs}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-500">Reports</p>
            <p className="text-3xl font-bold text-brand-800">{stats.totalReports}</p>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <h2 className="mb-4 text-xl font-semibold">Registered Users</h2>
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2">Lab ID</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b border-slate-100">
                <td className="py-2">{user.name}</td>
                <td className="py-2">{user.email}</td>
                <td className="py-2">{user.role}</td>
                <td className="py-2">{user.labId || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminPanel;
