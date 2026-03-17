import { Link } from "react-router-dom";

const Home = () => {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">
            Tamper-proof medical trust layer
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
            Blockchain-Based Medical Report Verifier
          </h1>
          <p className="mb-8 max-w-xl text-lg text-slate-700">
            Upload medical reports, generate SHA-256 hashes, store files in MongoDB, and anchor report integrity on Ethereum for instant authenticity checks.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/upload" className="btn-primary">
              Upload Report
            </Link>
            <Link to="/verify" className="btn-secondary">
              Verify Report
            </Link>
          </div>
        </div>

        <div className="card border-brand-100">
          <h2 className="mb-4 text-2xl font-semibold text-brand-900">How Verification Works</h2>
          <ol className="space-y-3 text-slate-700">
            <li>1. Lab uploads a report file.</li>
            <li>2. Backend computes SHA-256 hash.</li>
            <li>3. File is stored in MongoDB.</li>
            <li>4. Hash + metadata stored on Ethereum contract.</li>
            <li>5. Verification recomputes hash and checks chain data.</li>
          </ol>
        </div>
      </div>
    </section>
  );
};

export default Home;
