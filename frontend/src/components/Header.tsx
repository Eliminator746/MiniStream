import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { logout } from "../features/authSlice";

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

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
    <header className="w-full bg-white shadow-sm px-8 py-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="border border-teal-500 text-teal-500 px-2 py-1 rounded text-sm font-bold">
          MS
        </div>
        <span className="text-gray-600 font-medium text-lg">MiniStream</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-8">
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-gray-100 px-5 py-2 rounded-full outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      {/* Profile */}
      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => setOpen(!open)}
          className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer hover:bg-gray-400 transition"
        >
          R
        </div>

        {open && (
          <div className="absolute right-0 mt-2 w-36 bg-white border rounded-md shadow-lg z-50">
            <button
              onClick={handleProfile}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm transition"
            >
              Profile
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-500 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
