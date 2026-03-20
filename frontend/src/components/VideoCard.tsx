import { Link } from "react-router-dom";
import type { Video } from "@/features/types";

const VideoCard: React.FC<{ video: Video }> = ({ video }) => {
  return (
    <Link
      to={`/video/${video.id}`}
      className="group flex flex-col rounded-xl overflow-hidden bg-white border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-200 hover:scale-[1.02]"
    >
      {/* Thumbnail — 16:9 aspect ratio */}
      <div className="relative aspect-video overflow-hidden bg-slate-200">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
          {video.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1.5">{video.uploader}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {video.likes} {video.likes === 1 ? "like" : "likes"}
        </p>
      </div>
    </Link>
  );
};

export default VideoCard;
