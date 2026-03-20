import { useNavigate, useLocation, Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useLoginMutation } from "@/features/apiSlice";
import { setCredentials } from "@/features/authSlice";

function parseJwt(token: string): { sub: string; id: number } {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
  return JSON.parse(jsonPayload);
}

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState("");

  const { user: userInfo } = useAppSelector((state) => state.auth);

  const sp = new URLSearchParams(location.search);
  const redirect = sp.get("redirect") || "/";

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [userInfo, navigate, redirect]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    showPassword: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const togglePassword = () => {
    setFormData({
      ...formData,
      showPassword: !formData.showPassword,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login({
        email: formData.email,
        password: formData.password,
      }).unwrap();

      const payload = parseJwt(res.access_token);

      dispatch(
        setCredentials({
          user: { id: payload.id, name: payload.sub },
          token: res.access_token,
        }),
      );
    } catch (err: any) {
      setError(err?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left Section */}
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
            <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">
              Sign in to continue watching
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="bg-slate-50 px-4 py-3 rounded-xl text-sm outline-none border border-slate-200 focus:border-teal-400 transition"
            />

            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 px-4 focus-within:border-teal-400 transition">
              <input
                type={formData.showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="flex-1 py-3 bg-transparent outline-none text-sm"
              />

              <button
                type="button"
                onClick={togglePassword}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                {!formData.showPassword ? (
                  <FiEyeOff size={16} />
                ) : (
                  <FiEye size={16} />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}
          </form>
        </div>

        {/* Right Section */}
        <div className="bg-linear-to-br from-teal-500 to-emerald-600 flex flex-col items-center justify-center text-white px-10 py-12 space-y-5">
          <h2 className="text-3xl font-bold">New here?</h2>

          <p className="text-center text-white/80 text-sm max-w-xs leading-relaxed">
            Join MiniStream and discover amazing videos from creators around the
            world.
          </p>

          <Link
            to="/register"
            className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-8 py-2.5 rounded-xl text-sm font-medium hover:bg-white/30 transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
