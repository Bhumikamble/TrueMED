import { useState } from "react";
import { toast } from "react-toastify";

import { uploadReportApi } from "../services/reportService";

const UploadReport = () => {
  const [patientId, setPatientId] = useState("");
  const [reportFile, setReportFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reportFile) {
      toast.error("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("patientId", patientId);
    formData.append("reportFile", reportFile);

    try {
      const response = await uploadReportApi(formData);
      setResult(response.data);
      toast.success("Report uploaded successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <form className="card space-y-4" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold text-brand-900">Upload Medical Report</h1>
        <input className="input-field" placeholder="Patient ID" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
        <input className="input-field" type="file" onChange={(e) => setReportFile(e.target.files[0])} required />
        <button className="btn-primary" type="submit">
          Upload & Anchor on Blockchain
        </button>
      </form>

      {result && (
        <article className="card mt-6 space-y-2">
          <h2 className="text-xl font-semibold text-brand-900">Upload Result</h2>
          <p className="break-all text-sm">Hash: {result.report.reportHash}</p>
          <p>Tx Hash: {result.chainResult.txHash}</p>
          <p>Stored In Database: Yes</p>
        </article>
      )}
    </section>
  );
};

export default UploadReport;
