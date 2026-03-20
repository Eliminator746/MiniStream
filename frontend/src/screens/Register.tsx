import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "@/features/apiSlice";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(formData).unwrap();
      navigate("/login");
    } catch (err: any) {
      setError(err?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left Panel */}
        <div className="bg-linear-to-br from-teal-500 to-emerald-600 flex flex-col items-center justify-center text-white px-10 py-12 space-y-5">
          <h2 className="text-3xl font-bold">Welcome back!</h2>

          <p className="text-center text-white/80 text-sm max-w-xs leading-relaxed">
            Already have an account? Sign in to continue watching your favorite
            videos.
          </p>

          <Link
            to="/login"
            className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-8 py-2.5 rounded-xl text-sm font-medium hover:bg-white/30 transition"
          >
            Sign In
          </Link>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col justify-center px-10 py-12 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-teal-500 text-white px-2 py-1 rounded-md text-sm font-bold">
              MS
            </div>
            <span className="text-slate-800 font-semibold text-lg tracking-tight">
              MiniStream
            </span>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Create account
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Start your streaming journey
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="bg-slate-50 px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-teal-400 transition"
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="bg-slate-50 px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-teal-400 transition"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="bg-slate-50 px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-teal-400 transition"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>

            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
