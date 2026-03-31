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
    {
      title: "QR Code Verification",
      description: "Generate and scan QR codes for instant report verification on any device.",
      icon: "📱",
    },
    {
      title: "Real-time Validation",
      description: "Verify report authenticity instantly with blockchain-powered checks.",
      icon: "⚡",
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
      color: "from-blue-50 to-blue-100 border-blue-200",
      textColor: "text-blue-700",
      link: "/register",
    },
    {
      name: "Lab/Hospital",
      description: "Upload medical reports, anchor them on blockchain, and manage uploaded records.",
      icon: "🏥",
      color: "from-green-50 to-green-100 border-green-200",
      textColor: "text-green-700",
      link: "/register",
    },
    {
      name: "Employer",
      description: "Verify shared medical reports, request access, and ensure document authenticity.",
      icon: "💼",
      color: "from-purple-50 to-purple-100 border-purple-200",
      textColor: "text-purple-700",
      link: "/register",
    },
    {
      name: "Admin",
      description: "Manage users, monitor system health, and oversee all reports.",
      icon: "⚙️",
      color: "from-red-50 to-red-100 border-red-200",
      textColor: "text-red-700",
      link: "/register",
    },
  ];

  const steps = [
    { step: "01", title: "Upload Report", desc: "Lab uploads medical report with patient details", icon: "📄" },
    { step: "02", title: "Hash Generation", desc: "SHA-256 hash is computed from file content", icon: "🔒" },
    { step: "03", title: "Blockchain Anchor", desc: "Hash is permanently stored on Ethereum", icon: "⛓️" },
    { step: "04", title: "Instant Verify", desc: "Any user can verify authenticity instantly", icon: "✅" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-grid-gray-900/[0.02] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-6 border border-blue-100">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-blue-700">⚡ Tamper-proof medical trust layer</span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Blockchain-Based
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"> Medical Report</span>
                <br />
                Verifier
              </h1>
              <p className="mb-8 text-lg text-gray-600 max-w-xl">
                Upload medical reports, generate SHA-256 hashes, store files securely, and anchor report integrity on Ethereum for instant authenticity checks.
              </p>
              <div className="flex flex-wrap gap-4">
                {!user ? (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition shadow-md hover:shadow-lg"
                    >
                      Get Started
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:border-blue-500 hover:text-blue-600 transition"
                    >
                      Sign In
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition shadow-md"
                  >
                    Go to Dashboard
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Added ID */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Simple Process</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Simple, secure, and transparent process for medical report verification
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{item.icon}</span>
              </div>
              <div className="text-sm font-bold text-blue-600 mb-2">{item.step}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid - Added ID */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 bg-gray-50/50 rounded-3xl my-8">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Key Features</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">Everything You Need</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive features for secure medical document verification
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-md p-6 flex gap-4 hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 group"
            >
              <div className="text-3xl group-hover:scale-110 transition-transform">{feature.icon}</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">For Everyone</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">Who Can Use TrueMED?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Designed for all stakeholders in the healthcare ecosystem
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {roles.map((role, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${role.color} rounded-xl border p-6 hover:shadow-xl transition-all hover:-translate-y-1`}
            >
              <div className="text-4xl mb-3">{role.icon}</div>
              <h3 className={`font-semibold ${role.textColor} mb-2`}>{role.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{role.description}</p>
              <Link to={role.link} className={`${role.textColor} text-sm font-medium hover:underline inline-flex items-center gap-1`}>
                Register as {role.name}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Secure Medical Reports?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join TrueMED today and ensure the authenticity of medical documents with blockchain technology.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition shadow-md"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-white text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition shadow-md"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">TM</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  TrueMED
                </span>
              </div>
              <p className="text-gray-500 text-sm max-w-md">
                Blockchain-based medical report verification system ensuring tamper-proof authenticity and real-time validation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-blue-600 transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-blue-600 transition">How It Works</a></li>
                <li><a href="#" className="hover:text-blue-600 transition">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-blue-600 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-600 transition">GDPR Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-400">
            <p>TrueMED - Blockchain Medical Report Verifier</p>
            <p className="mt-2">All reports are anchored on the Ethereum Sepolia testnet for tamper-proof verification</p>
            <p className="mt-4">© {new Date().getFullYear()} TrueMED. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;