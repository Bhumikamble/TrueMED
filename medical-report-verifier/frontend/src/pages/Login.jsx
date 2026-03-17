import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(form);
      login(response.data.token, response.data.user);
      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <form className="card space-y-4" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold text-brand-900">Login</h1>
        <input className="input-field" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input className="input-field" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <button className="btn-primary w-full" type="submit">
          Sign In
        </button>
      </form>
    </section>
  );
};

export default Login;
