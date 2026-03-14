import { Link } from "react-router-dom";

const VideoCard = ({ video }) => {
  const thumbnailUrl = video.thumbnail
    ? `http://localhost:8000/thumbnails/${video.thumbnail}`
    : "/default-thumbnail.png";

  return (
    <Link to={`video/${video.id}`} className="flex flex-col cursor-pointer">
      <img
        src={thumbnailUrl}
        alt={video.title}
        className="rounded-lg w-full h-48 object-cover"
      />

      <h3 className="text-sm font-semibold mt-2">{video.title}</h3>

      <p className="text-xs text-gray-500">{video.uploader}</p>
    </Link>
  );
};

export default VideoCard;
