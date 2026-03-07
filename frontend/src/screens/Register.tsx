import React from "react";

const SignupPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="grid grid-cols-2 max-w-5xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Left Panel */}
        <div className="bg-linear-to-br from-teal-400 to-teal-600 flex flex-col items-center justify-center text-white px-12 py-10 space-y-6">
          <h2 className="text-4xl font-bold">Welcome Back!</h2>

          <p className="text-center text-white/90 max-w-xs">
            To keep connected with us please login with your personal info
          </p>

          <button className="bg-white text-gray-700 px-10 py-3 rounded-full font-medium hover:bg-gray-100 transition">
            Sign In
          </button>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col justify-center px-14 py-12 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="border border-teal-500 text-teal-500 px-2 py-1 rounded text-sm font-bold">
              MS
            </div>
            <span className="text-gray-600 font-medium text-lg">
              MiniStream
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-800">Create Account</h1>

          {/* Form */}
          <form className="flex flex-col gap-4 mt-4">
            <input
              type="text"
              placeholder="Full Name"
              className="bg-gray-100 px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-teal-400"
            />

            <input
              type="email"
              placeholder="Email"
              className="bg-gray-100 px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-teal-400"
            />

            <input
              type="password"
              placeholder="Password"
              className="bg-gray-100 px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-teal-400"
            />

            <button
              type="submit"
              className="mt-4 bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-full font-medium transition"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
