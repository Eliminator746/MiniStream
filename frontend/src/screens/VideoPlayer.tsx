import { useParams } from "react-router-dom";
import { Heart, MoreVertical } from "lucide-react";
import { useState } from "react";
import Comment from "@/components/Comments";

interface CommentType {
  id: number;
  username: string;
  text: string;
}

const commentsMock: CommentType[] = [
  { id: 1, username: "rohan", text: "Great explanation!" },
  { id: 2, username: "tim", text: "This helped me a lot." },
];

const VideoPage: React.FC = () => {
  const { id } = useParams();

  const videoUrl = `http://localhost:8000/video/${id}`;

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(12);

  const toggleLike = () => {
    setLiked(!liked);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-8">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        {/* Video */}
        <video
          controls
          className="w-full max-h-[80vh] rounded-lg shadow-lg"
          src={videoUrl}
        />

        {/* Title */}
        <h1 className="text-xl font-semibold">
          This will save you years of wasted time while learning to code
        </h1>

        {/* Channel + Like */}
        <div className="flex justify-between items-center">
          {/* Uploader */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              U
            </div>

            <div>
              <p className="font-medium">Username</p>
              <p className="text-sm text-gray-500">Uploaded by</p>
            </div>
          </div>

          {/* Like button */}
          <div className="flex items-center gap-2">
            <Heart
              onClick={toggleLike}
              className={`cursor-pointer ${
                liked ? "text-red-500 fill-red-500" : "text-gray-500"
              }`}
            />
            <span className="text-sm">{likes}</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg p-4 shadow text-sm text-gray-700">
          In this video we explain some key concepts about coding and mistakes
          beginners often make while learning programming.
        </div>

        {/* Comments */}
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-lg">
            {commentsMock.length} Comments
          </h2>

          {commentsMock.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
