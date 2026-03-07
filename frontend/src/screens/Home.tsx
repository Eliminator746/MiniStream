import React from "react";
import Header from "../components/Header";
import VideoCard from "../components/VideoCard";
import { videos } from "../data/videos";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="p-8 grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </main>
    </div>
  );
};

export default HomePage;
