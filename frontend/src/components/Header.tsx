import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../features/authSlice";
import { Upload } from "lucide-react";

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setOpen(false);
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    navigate("/profile");
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="bg-teal-500 text-white px-2 py-1 rounded-md text-sm font-bold tracking-wide group-hover:bg-teal-600 transition">
          MS
        </div>
        <span className="text-slate-800 font-semibold text-lg tracking-tight">
          MiniStream
        </span>
      </Link>

      {/* Search */}
      <div className="flex-1 max-w-lg mx-8">
        <input
          type="text"
          placeholder="Search videos..."
          className="w-full bg-slate-100 px-5 py-2 rounded-full text-sm outline-none border border-transparent focus:border-teal-400 focus:bg-white transition"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Upload button — only for authenticated users */}
        {isAuthenticated && (
          <Link
            to="/upload"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            <Upload size={18} />
            <span className="hidden sm:inline">Upload</span>
          </Link>
        )}

        {/* Profile */}
        {isAuthenticated && user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="w-9 h-9 bg-teal-500 text-white rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer hover:bg-teal-600 transition-colors ring-2 ring-transparent hover:ring-teal-200"
            >
              {user.name.charAt(0).toUpperCase()}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                <button
                  onClick={handleProfile}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 transition"
                >
                  Profile
                </button>
                <div className="border-t border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm text-red-500 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="bg-teal-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-teal-600 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
