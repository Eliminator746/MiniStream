import { useState } from "react";
import { useAddCommentMutation } from "@/features/apiSlice";
import { useAppSelector } from "@/store/hooks";

interface CommentFormProps {
  videoId: number;
}

const CommentForm: React.FC<CommentFormProps> = ({ videoId }) => {
  const [content, setContent] = useState("");
  const [addComment, { isLoading }] = useAddCommentMutation();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    try {
      await addComment({
        videoId,
        content: content.trim(),
      }).unwrap();

      setContent("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-sm text-slate-500">
        Please log in to comment
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        rows={2}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 resize-none transition"
      />

      <div className="flex justify-end gap-2 mt-2">
        {content.trim() && (
          <button
            type="button"
            onClick={() => setContent("")}
            className="px-4 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="px-4 py-1.5 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:bg-slate-300 disabled:text-slate-400 transition"
        >
          {isLoading ? "Posting..." : "Comment"}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
