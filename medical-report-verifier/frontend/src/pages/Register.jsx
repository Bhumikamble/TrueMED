import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { registerUser } from "../services/authService";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "verifier",
    labId: "",
  });

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(form);
      toast.success("Registration successful. Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <form className="card space-y-4" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold text-brand-900">Create Account</h1>
        <input className="input-field" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
        <input className="input-field" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input className="input-field" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <select className="input-field" name="role" value={form.role} onChange={handleChange}>
          <option value="verifier">Verifier</option>
          <option value="lab">Lab</option>
        </select>
        {form.role === "lab" && (
          <input className="input-field" name="labId" placeholder="Lab ID (optional)" value={form.labId} onChange={handleChange} />
        )}
        <button className="btn-primary w-full" type="submit">
          Register
        </button>
      </form>
    </section>
  );
};

export default Register;
