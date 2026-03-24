import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      title: "Blockchain Anchoring",
      description: "Every report hash is permanently stored on the Ethereum Sepolia testnet, ensuring tamper-proof verification.",
      icon: "⛓️",
    },
    {
      title: "SHA-256 Hashing",
      description: "Each file generates a unique cryptographic fingerprint that changes if the file is modified.",
      icon: "🔐",
    },
    {
      title: "Role-Based Access",
      description: "Patients, Labs, and Employers each have dedicated dashboards with appropriate permissions.",
      icon: "👥",
    },
    {
      title: "Consent Management",
      description: "Patients control who can access their medical reports with time-limited sharing permissions.",
      icon: "📋",
    },
  ];

  const stats = [
    { value: "100%", label: "Tamper-Proof" },
    { value: "SHA-256", label: "Cryptographic Hash" },
    { value: "Sepolia", label: "Blockchain Network" },
    { value: "Real-time", label: "Verification" },
  ];

  const roles = [
    {
      name: "Patient",
      description: "View your medical reports, manage sharing permissions, and track verification history.",
      icon: "👤",
      color: "bg-blue-50 border-blue-200",
      link: "/register",
    },
    {
      name: "Lab/Hospital",
      description: "Upload medical reports, anchor them on blockchain, and manage uploaded records.",
      icon: "🏥",
      color: "bg-green-50 border-green-200",
      link: "/register",
    },
    {
      name: "Employer",
      description: "Verify shared medical reports, request access, and ensure document authenticity.",
      icon: "💼",
      color: "bg-purple-50 border-purple-200",
      link: "/register",
    },
    {
      name: "Admin",
      description: "Manage users, monitor system health, and oversee all reports.",
      icon: "⚙️",
      color: "bg-red-50 border-red-200",
      link: "/register",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700">
              <span className="mr-1">⚡</span> Tamper-proof medical trust layer
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Blockchain-Based
              <span className="text-blue-600"> Medical Report</span> Verifier
            </h1>
            <p className="mb-8 text-lg text-gray-600 max-w-xl">
              Upload medical reports, generate SHA-256 hashes, store files securely, and anchor report integrity on Ethereum for instant authenticity checks.
            </p>
            <div className="flex flex-wrap gap-4">
              {!user ? (
                <>
                  <Link to="/register" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-md">
                    Get Started
                  </Link>
                  <Link to="/verify" className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:border-blue-500 hover:text-blue-600 transition">
                    Verify a Report
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-md">
                    Go to Dashboard
                  </Link>
                  <Link to="/verify" className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:border-blue-500 hover:text-blue-600 transition">
                    Verify a Report
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-100">
                <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Simple, secure, and transparent process for medical report verification
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "01", title: "Upload Report", desc: "Lab uploads medical report with patient details", icon: "📄" },
            { step: "02", title: "Hash Generation", desc: "SHA-256 hash is computed from file content", icon: "🔒" },
            { step: "03", title: "Blockchain Anchor", desc: "Hash is permanently stored on Ethereum", icon: "⛓️" },
            { step: "04", title: "Instant Verify", desc: "Any user can verify authenticity instantly", icon: "✅" },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">{item.icon}</span>
              </div>
              <div className="text-sm text-blue-600 font-semibold mb-2">{item.step}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-6xl px-4 py-16 bg-gray-50 rounded-3xl my-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need for secure medical document verification
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-md p-6 flex gap-4 hover:shadow-lg transition">
              <div className="text-3xl">{feature.icon}</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Who Can Use TrueMED?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Designed for all stakeholders in the healthcare ecosystem
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {roles.map((role, idx) => (
            <div key={idx} className={`${role.color} rounded-xl border p-6 hover:shadow-lg transition`}>
              <div className="text-3xl mb-3">{role.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{role.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{role.description}</p>
              <Link to={role.link} className="text-blue-600 text-sm font-medium hover:underline">
                Register as {role.name} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Secure Medical Reports?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join TrueMED today and ensure the authenticity of medical documents with blockchain technology.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {!user ? (
              <>
                <Link to="/register" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
                  Create Free Account
                </Link>
                <Link to="/verify" className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition">
                  Verify a Report
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
                  Go to Dashboard
                </Link>
                {user.role === "lab" && (
                  <Link to="/upload" className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition">
                    Upload Report
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-gray-500 text-sm">
          <p>TrueMED - Blockchain Medical Report Verifier</p>
          <p className="mt-2">All reports are anchored on the Ethereum Sepolia testnet for tamper-proof verification</p>
          <p className="mt-4">© {new Date().getFullYear()} TrueMED. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;