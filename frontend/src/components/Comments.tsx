import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import {
  useEditCommentMutation,
  useDeleteCommentMutation,
} from "@/features/apiSlice";
import type { Comment as CommentType } from "@/features/types";

interface CommentProps {
  comment: CommentType;
  videoId: number;
  currentUserName?: string;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  videoId,
  currentUserName,
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const menuRef = useRef<HTMLDivElement>(null);

  const [editComment, { isLoading: isEditing }] = useEditCommentMutation();
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();

  const isOwner = currentUserName === comment.user;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await editComment({
        commentId: comment.id,
        content: editContent.trim(),
        videoId,
      }).unwrap();
      setEditing(false);
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComment({ commentId: comment.id, videoId }).unwrap();
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setOpen(false);
  };

  const timeAgo = comment.timestamp
    ? new Date(comment.timestamp).toLocaleDateString()
    : "";

  return (
    <div className="flex gap-3 py-3.5 border-b border-slate-100 last:border-0">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
        {comment.user.charAt(0).toUpperCase()}
      </div>

      {/* Comment content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-800">
            {comment.user}
          </span>
          <span className="text-xs text-slate-400">{timeAgo}</span>
        </div>

        {editing ? (
          <div className="flex gap-2 mt-2">
            <input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-400 transition"
            />
            <button
              onClick={handleEdit}
              disabled={isEditing}
              className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-lg hover:bg-teal-600 disabled:opacity-50 transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditContent(comment.content);
              }}
              className="text-xs text-slate-500 px-2 py-1.5 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
            {comment.content}
          </p>
        )}
      </div>

      {/* Menu — only for comment owner */}
      {isOwner && !editing && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="p-1 rounded-full hover:bg-slate-100 transition"
          >
            <MoreVertical size={16} className="text-slate-400" />
          </button>

          {open && (
            <div className="absolute right-0 top-8 w-28 bg-white border border-slate-100 rounded-xl shadow-lg flex flex-col py-1 z-10">
              <button
                onClick={() => {
                  setEditing(true);
                  setOpen(false);
                }}
                className="px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 transition"
              >
                Edit
              </button>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-2 text-sm text-left text-red-500 hover:bg-red-50 disabled:opacity-50 transition"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Comment;
