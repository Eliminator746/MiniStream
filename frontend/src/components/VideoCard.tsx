import React from "react";
import { Video } from "../data/videos";

interface Props {
  video: Video;
}

const VideoCard: React.FC<Props> = ({ video }) => {
  return (
    <div className="flex flex-col gap-2 cursor-pointer">
      <img
        src={video.thumbnail}
        alt={video.title}
        className="rounded-lg w-full h-44 object-cover"
      />

      <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">
        {video.title}
      </h3>

      <p className="text-xs text-gray-600">{video.channel}</p>

      <p className="text-xs text-gray-500">
        {video.views} • {video.time}
      </p>
    </div>
  );
};

export default VideoCard;
