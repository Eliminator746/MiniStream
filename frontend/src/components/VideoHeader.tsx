import { Link } from "react-router-dom";
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
    <div className="flex flex-col gap-4">
      {/* Title */}
      <h1 className="text-xl font-bold text-slate-900 leading-tight">
        {video.title}
      </h1>

      {/* Channel + Like */}
      <div className="flex justify-between items-center bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        {/* Uploader */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {video.uploader.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <Link
              to={`/profile/${video.uploader.id}`}
              className="font-semibold text-sm text-slate-800 cursor-pointer hover:text-teal-600 hover:scale-105 inline-block transition-all duration-150"
            >
              {video.uploader.name}
            </Link>
            <p className="text-xs text-slate-400">Creator</p>
          </div>
        </div>

        {/* Like Button */}
        <button
          onClick={onLikeToggle}
          disabled={isLoadingLike}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-50 border border-slate-200 transition disabled:opacity-50"
        >
          <Heart
            size={20}
            className={`transition ${
              liked ? "text-red-500 fill-red-500" : "text-slate-400"
            }`}
          />
          <span className="text-sm font-semibold text-slate-700">
            {video.likes}
          </span>
        </button>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        <h3 className="font-semibold text-sm text-slate-800 mb-1.5">
          Description
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          {video.description || "No description provided"}
        </p>
      </div>
    </div>
  );
};

export default VideoHeader;
