import { Heart } from "lucide-react";
import { VideoMetadata } from "@/features/types";

interface VideoHeaderProps {
  video: VideoMetadata;
  liked: boolean;
  onLikeToggle: () => void;
  isLoadingLike: boolean;
}

const VideoHeader: React.FC<VideoHeaderProps> = ({
  video,
  liked,
  onLikeToggle,
  isLoadingLike,
}) => {
  return (
    <>
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>

      {/* Channel + Like */}
      <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow">
        {/* Uploader */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-linear-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {video.uploader.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <p className="font-semibold text-gray-900">{video.uploader.name}</p>
            <p className="text-xs text-gray-500">Channel Creator</p>
          </div>
        </div>

        {/* Like Button */}
        <button
          onClick={onLikeToggle}
          disabled={isLoadingLike}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
        >
          <Heart
            size={24}
            className={`transition ${
              liked ? "text-red-500 fill-red-500" : "text-gray-400"
            }`}
          />
          <span className="font-semibold text-gray-700">{video.likes}</span>
        </button>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="font-semibold text-sm text-gray-900 mb-2">
          Description
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {video.description || "No description provided"}
        </p>
      </div>
    </>
  );
};

export default VideoHeader;
