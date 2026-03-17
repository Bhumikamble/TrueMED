const ReportCard = ({ report }) => {
  return (
    <article className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-900">Patient: {report.patientId}</h3>
        <span className="rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-600">
          Lab {report.labId}
        </span>
      </div>
      <p className="mb-2 break-all text-sm text-slate-700">Hash: {report.reportHash}</p>
      <p className="mb-2 text-sm text-slate-600">Stored In Database: Yes</p>
      <p className="text-xs text-slate-500">Uploaded: {new Date(report.createdAt).toLocaleString()}</p>
    </article>
  );
};

export default ReportCard;
