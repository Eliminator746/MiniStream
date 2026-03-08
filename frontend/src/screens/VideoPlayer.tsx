import { useParams } from "react-router-dom";

const VideoPage: React.FC = () => {
  const { id } = useParams();

  const videoUrl = `http://localhost:8000/video/${id}`;

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 p-8">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <video
          controls
          className="w-full max-h-[80vh] rounded-lg shadow-lg"
          src={videoUrl}
        />

        {/* Video metadata placeholder */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold">Video Title</h2>

          <p className="text-sm text-gray-500">Uploaded by Channel Name</p>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
