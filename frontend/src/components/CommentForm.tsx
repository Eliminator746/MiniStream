import { useState } from "react";
import { useAddCommentMutation } from "@/features/apiSlice";
import { useAppSelector } from "@/store/hooks";

interface CommentFormProps {
  videoId: number;
  onCommentAdded?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({
  videoId,
  onCommentAdded,
}) => {
  const [content, setContent] = useState("");
  const [addComment, { isLoading }] = useAddCommentMutation();
  const token = useAppSelector((state) => state.auth.token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || !token) return;

    try {
      await addComment({
        videoId,
        content: content.trim(),
        token,
      }).unwrap();

      setContent("");
      onCommentAdded?.();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  if (!token) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-sm text-blue-700">
        Please log in to comment
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg p-4 shadow mb-4"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      <div className="flex justify-end gap-2 mt-3">
        <button
          type="button"
          onClick={() => setContent("")}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!content.trim() || isLoading}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
        >
          {isLoading ? "Posting..." : "Post Comment"}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
