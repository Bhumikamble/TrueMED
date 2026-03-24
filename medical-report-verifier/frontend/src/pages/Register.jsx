import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    // Patient fields
    patientId: "",
    dateOfBirth: "",
    phoneNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    // Lab fields
    labId: "",
    hospitalName: "",
    licenseNumber: "",
    labPhone: "",
    labAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    // Employer fields
    employerId: "",
    companyName: "",
    department: "",
    position: "",
    companyPhone: "",
    companyAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    // Wallet
    walletAddress: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Handle nested objects (address fields)
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setForm((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password match
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password length
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Prepare user data based on role
      const userData = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };

      // Add role-specific fields
      if (form.role === "patient") {
        userData.patientId = form.patientId || undefined;
        userData.dateOfBirth = form.dateOfBirth || undefined;
        userData.phoneNumber = form.phoneNumber || undefined;
        if (form.address.street) userData.address = form.address;
      } else if (form.role === "lab") {
        userData.labId = form.labId || undefined;
        userData.hospitalName = form.hospitalName;
        userData.licenseNumber = form.licenseNumber || undefined;
        userData.labPhone = form.labPhone || undefined;
        if (form.labAddress.street) userData.labAddress = form.labAddress;
      } else if (form.role === "employer") {
        userData.employerId = form.employerId || undefined;
        userData.companyName = form.companyName;
        userData.department = form.department || undefined;
        userData.position = form.position || undefined;
        userData.companyPhone = form.companyPhone || undefined;
        if (form.companyAddress.street) userData.companyAddress = form.companyAddress;
      }

      // Add wallet address if provided
      if (form.walletAddress) {
        userData.walletAddress = form.walletAddress;
      }

      await register(userData);
      
      // Show success toast
      toast.success("Registration successful! Welcome aboard!", {
        autoClose: 2000,
        onClose: () => {
          // Navigate after toast closes
          navigate("/dashboard");
        }
      });
      
      // Don't navigate immediately - let toast handle it
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Registration failed";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  // Get role title for display
  const getRoleTitle = () => {
    switch (form.role) {
      case "patient":
        return "Patient Registration";
      case "lab":
        return "Lab/Hospital Registration";
      case "employer":
        return "Employer Registration";
      default:
        return "Create Account";
    }
  };

  // Get role description
  const getRoleDescription = () => {
    switch (form.role) {
      case "patient":
        return "Register as a patient to access and manage your medical reports";
      case "lab":
        return "Register as a lab/hospital to upload and verify medical reports";
      case "employer":
        return "Register as an employer to verify employee medical reports";
      default:
        return "Create your account to get started";
    }
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <form className="card space-y-6" onSubmit={handleSubmit}>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-900">{getRoleTitle()}</h1>
          <p className="text-gray-600 mt-2">{getRoleDescription()}</p>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Type <span className="text-red-500">*</span>
          </label>
          <select
            className="input-field"
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="patient">Patient - Access and manage your reports</option>
            <option value="lab">Lab/Hospital - Upload and verify reports</option>
            <option value="employer">Employer - Verify employee reports</option>
          </select>
        </div>

        {/* Basic Information */}
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                className="input-field"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                className="input-field"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                className="input-field"
                name="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                className="input-field"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Patient-specific fields */}
        {form.role === "patient" && (
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID (Optional)
                </label>
                <input
                  className="input-field"
                  name="patientId"
                  placeholder="e.g., PAT001"
                  value={form.patientId}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  className="input-field"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  className="input-field"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={form.phoneNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                className="input-field mb-2"
                name="address.street"
                placeholder="Street Address"
                value={form.address.street}
                onChange={handleChange}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input-field"
                  name="address.city"
                  placeholder="City"
                  value={form.address.city}
                  onChange={handleChange}
                />
                <input
                  className="input-field"
                  name="address.state"
                  placeholder="State"
                  value={form.address.state}
                  onChange={handleChange}
                />
                <input
                  className="input-field"
                  name="address.zipCode"
                  placeholder="ZIP Code"
                  value={form.address.zipCode}
                  onChange={handleChange}
                />
                <input
                  className="input-field"
                  name="address.country"
                  placeholder="Country"
                  value={form.address.country}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Lab-specific fields */}
        {form.role === "lab" && (
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-4">Laboratory Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital/Lab Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="input-field"
                  name="hospitalName"
                  placeholder="e.g., City Hospital"
                  value={form.hospitalName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lab ID (Optional)
                </label>
                <input
                  className="input-field"
                  name="labId"
                  placeholder="e.g., LAB001"
                  value={form.labId}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  className="input-field"
                  name="licenseNumber"
                  placeholder="Medical license number"
                  value={form.licenseNumber}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lab Phone
                </label>
                <input
                  className="input-field"
                  name="labPhone"
                  type="tel"
                  placeholder="Contact number"
                  value={form.labPhone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lab Address
              </label>
              <input
                className="input-field mb-2"
                name="labAddress.street"
                placeholder="Street Address"
                value={form.labAddress.street}
                onChange={handleChange}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input-field"
                  name="labAddress.city"
                  placeholder="City"
                  value={form.labAddress.city}
                  onChange={handleChange}
                />
                <input
                  className="input-field"
                  name="labAddress.state"
                  placeholder="State"
                  value={form.labAddress.state}
                  onChange={handleChange}
                />
                <input
                  className="input-field"
                  name="labAddress.zipCode"
                  placeholder="ZIP Code"
                  value={form.labAddress.zipCode}
                  onChange={handleChange}
                />
                <input
                  className="input-field"
                  name="labAddress.country"
                  placeholder="Country"
                  value={form.labAddress.country}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Employer-specific fields */}
        {form.role === "employer" && (
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-4">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="input-field"
                  name="companyName"
                  placeholder="e.g., ABC Corporation"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employer ID (Optional)
                </label>
                <input
                  className="input-field"
                  name="employerId"
                  placeholder="e.g., EMP001"
                  value={form.employerId}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  className="input-field"
                  name="department"
                  placeholder="e.g., HR, Medical Review"
                  value={form.department}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  className="input-field"
                  name="position"
                  placeholder="e.g., HR Manager"
                  value={form.position}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Phone
                </label>
                <input
                  className="input-field"
                  name="companyPhone"
                  type="tel"
                  placeholder="Contact number"
                  value={form.companyPhone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Address
              </label>
              <input
                className="input-field mb-2"
                name="companyAddress.street"
                placeholder="Street Address"
                value={form.companyAddress.street}
                onChange={handleChange}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input-field"
                  name="companyAddress.city"
                  placeholder="City"
                  value={form.companyAddress.city}
                  onChange={handleChange}
                />
                <input
                  className="input-field"
                  name="companyAddress.state"
                  placeholder="State"
                  value={form.companyAddress.state}
                  onChange={handleChange}
                />
                <input
                  className="input-field"
                  name="companyAddress.zipCode"
                  placeholder="ZIP Code"
                  value={form.companyAddress.zipCode}
                  onChange={handleChange}
                />
                <input
                  className="input-field"
                  name="companyAddress.country"
                  placeholder="Country"
                  value={form.companyAddress.country}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* Wallet Information (Optional for all) */}
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-4">Blockchain Wallet (Optional)</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wallet Address
            </label>
            <input
              className="input-field"
              name="walletAddress"
              placeholder="0x..."
              value={form.walletAddress}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              You can add your MetaMask wallet address to interact with the blockchain
            </p>
          </div>
        </div>

        <button
          className="btn-primary w-full"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 hover:underline">
            Sign in here
          </Link>
        </p>
      </form>
    </section>
  );
};

export default Register;