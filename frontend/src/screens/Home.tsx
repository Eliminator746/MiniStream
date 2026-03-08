import React from "react";
import Header from "../components/Header";
import VideoCard from "../components/VideoCard";
import { useGetVideosQuery } from "@/features/apiSlice";

const HomePage: React.FC = () => {
  const { data: videos, isLoading, error } = useGetVideosQuery();

  if (isLoading) {
    return <div className="p-8">Loading videos...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Failed to load videos</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="p-8 grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {videos?.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </main>
    </div>
  );
};

export default HomePage;
