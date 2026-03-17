import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import ReportCard from "../components/ReportCard";
import { getMyReportsApi } from "../services/reportService";

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await getMyReportsApi();
        setReports(response.data.reports);
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not load reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold text-brand-900">Dashboard</h1>
      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="card">No reports uploaded yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reports.map((report) => (
            <ReportCard key={report._id} report={report} />
          ))}
        </div>
      )}
    </section>
  );
};

export default Dashboard;
