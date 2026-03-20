import React, { useState, useEffect, useRef, useCallback } from "react";
import VideoCard from "../components/VideoCard";
import { useGetVideosQuery } from "@/features/apiSlice";
import { VIDEOS_LIMIT } from "@/constants";
import type { Video } from "@/features/types";

const HomePage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isFetching } = useGetVideosQuery({
    page,
    limit: VIDEOS_LIMIT,
  });

  // Append new videos when data arrives
  useEffect(() => {
    if (data) {
      setAllVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v.id));
        const newVideos = data.videos.filter((v) => !existingIds.has(v.id));
        return [...prev, ...newVideos];
      });
      setHasMore(data.has_more);
    }
  }, [data]);

  // Infinite scroll with IntersectionObserver
  const lastVideoRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetching) return;
      if (observerRef.current) observerRef.current = null;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((p) => p + 1);
          }
        },
        { threshold: 0.1 },
      );

      if (node) {
        observer.observe(node);
        observerRef.current = node;
      }

      return () => observer.disconnect();
    },
    [isFetching, hasMore],
  );

  return (
    <div className="h-[calc(100vh-57px)] overflow-y-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Explore</h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover videos from creators
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {allVideos.map((video, index) => (
            <div
              key={video.id}
              ref={index === allVideos.length - 1 ? lastVideoRef : undefined}
            >
              <VideoCard video={video} />
            </div>
          ))}
        </div>

        {/* Loading States */}
        {(isLoading || isFetching) && (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && allVideos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <p className="text-lg font-medium">No videos yet</p>
            <p className="text-sm mt-1">Be the first to upload!</p>
          </div>
        )}

        {!hasMore && allVideos.length > 0 && (
          <p className="text-center text-sm text-slate-400 py-8">
            You've reached the end
          </p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
