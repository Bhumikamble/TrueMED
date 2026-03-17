import { useState } from "react";
import { toast } from "react-toastify";

import { verifyReportApi, getReportByHashApi } from "../services/reportService";

const VerifyReport = () => {
  const [reportFile, setReportFile] = useState(null);
  const [hashQuery, setHashQuery] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [hashResult, setHashResult] = useState(null);

  const verifyByFile = async (e) => {
    e.preventDefault();
    if (!reportFile) {
      toast.error("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("reportFile", reportFile);

    try {
      const response = await verifyReportApi(formData);
      setVerificationResult(response.data);
      toast.success("Verification completed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    }
  };

  const verifyByHash = async (e) => {
    e.preventDefault();
    try {
      const response = await getReportByHashApi(hashQuery);
      setHashResult(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Hash lookup failed");
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <form className="card space-y-4" onSubmit={verifyByFile}>
          <h1 className="text-xl font-bold text-brand-900">Verify by Report File</h1>
          <input className="input-field" type="file" onChange={(e) => setReportFile(e.target.files[0])} required />
          <button className="btn-primary" type="submit">
            Verify File
          </button>
        </form>

        <form className="card space-y-4" onSubmit={verifyByHash}>
          <h2 className="text-xl font-bold text-brand-900">Lookup by Hash</h2>
          <input className="input-field" placeholder="Enter SHA-256 hash" value={hashQuery} onChange={(e) => setHashQuery(e.target.value)} required />
          <button className="btn-secondary" type="submit">
            Search Hash
          </button>
        </form>
      </div>

      {verificationResult && (
        <article className="card mt-6 space-y-2">
          <h3 className="text-lg font-semibold">Verification Result</h3>
          <p className="break-all text-sm">Computed Hash: {verificationResult.reportHash}</p>
          <p className={verificationResult.isAuthentic ? "text-accent-600" : "text-red-600"}>
            {verificationResult.isAuthentic ? "Authentic Report" : "Tampered or Unknown Report"}
          </p>
          <p>
            Stored In Database: {verificationResult.fileStoredInDatabase ? "Yes" : "No"}
          </p>
          {verificationResult.fileStoredInDatabase && (
            <a
              className="text-brand-600 underline"
              href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/reports/report-file/${verificationResult.reportHash}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Stored File
            </a>
          )}
        </article>
      )}

      {hashResult && (
        <article className="card mt-6 space-y-2">
          <h3 className="text-lg font-semibold">Hash Lookup Result</h3>
          <p className="break-all text-sm">
            Hash: {hashResult.blockchainRecord?.reportHash || hashResult.databaseRecord?.reportHash || "N/A"}
          </p>
          <p>
            Patient ID: {hashResult.blockchainRecord?.patientId || hashResult.databaseRecord?.patientId || "N/A"}
          </p>
          <p>
            Lab ID: {hashResult.blockchainRecord?.labId || hashResult.databaseRecord?.labId || "N/A"}
          </p>
          <p>On-chain: {hashResult.blockchainRecord?.exists ? "Yes" : "No (Local mode)"}</p>
        </article>
      )}
    </section>
  );
};

export default VerifyReport;
