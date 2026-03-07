import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="grid grid-cols-2 max-w-5xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Left Section */}
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
          <h1 className="text-4xl font-bold text-gray-800">
            Login to Your Account
          </h1>

          {/* Form */}
          <form className="flex flex-col gap-4 mt-4">
            <input
              type="email"
              placeholder="Email"
              className="bg-gray-100 px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-teal-400"
            />

            <div className="flex items-center bg-gray-100 rounded-full px-5">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="flex-1 py-3 bg-transparent outline-none"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500"
              >
                {!showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <button
              type="submit"
              className="mt-4 bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-full font-medium transition"
            >
              Sign In
            </button>
          </form>
        </div>

        {/* Right Section */}
        <div className="bg-linear-to-br from-teal-400 to-teal-600 flex flex-col items-center justify-center text-white px-12 py-10 space-y-6">
          <h2 className="text-4xl font-bold">New Here?</h2>

          <p className="text-center text-white/90 max-w-xs">
            Sign up and discover a great amount of new opportunities!
          </p>

          <button className="bg-white text-gray-700 px-10 py-3 rounded-full font-medium hover:bg-gray-100 transition">
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
