import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

const Comment = ({ comment }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex justify-between items-start border-b pb-4 pt-3">
      {/* Comment content */}
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-sm text-gray-900">
          {comment.username}
        </span>

        <p className="text-sm text-gray-700">{comment.text}</p>
      </div>

      {/* Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="p-1 rounded-full hover:bg-gray-200 transition"
        >
          <MoreVertical size={18} />
        </button>

        {open && (
          <div className="absolute right-0 top-8 w-28 bg-white border rounded-md shadow-lg flex flex-col z-10">
            <button className="px-3 py-2 text-sm text-left hover:bg-gray-100">
              Edit
            </button>

            <button className="px-3 py-2 text-sm text-left text-red-500 hover:bg-gray-100">
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;
