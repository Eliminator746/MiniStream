import React, { useState } from "react";
import VideoCard from "./VideoCard";
import { videos } from "../data/videos";

const ProfileTabs: React.FC = () => {
  const [tab, setTab] = useState<"videos" | "about">("videos");

  return (
    <div className="flex flex-col">
      {/* Tabs */}
      <div className="flex gap-10 px-10 border-b bg-white">
        <button
          onClick={() => setTab("videos")}
          className={`py-4 text-sm font-medium ${
            tab === "videos" ? "border-b-2 border-black" : "text-gray-500"
          }`}
        >
          Videos
        </button>

        <button
          onClick={() => setTab("about")}
          className={`py-4 text-sm font-medium ${
            tab === "about" ? "border-b-2 border-black" : "text-gray-500"
          }`}
        >
          About
        </button>
      </div>

      {/* Content */}
      <div className="px-10 py-8 bg-gray-50">
        {tab === "videos" && (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {tab === "about" && (
          <div className="max-w-3xl text-gray-700 leading-relaxed">
            <h3 className="font-semibold mb-4">Description</h3>

            <p>
              If you're a millennial who wants to crush debt and live payment
              free, consider me your debt free millennial guide.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTabs;
