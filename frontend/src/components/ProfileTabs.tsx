import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetProfileQuery,
  useGetUserVideosQuery,
  useUpdateProfileMutation,
  useDeleteVideoMutation,
} from "@/features/apiSlice";
import type { UserVideo } from "@/features/types";

interface ProfileTabsProps {
  userId: number;
  readOnly?: boolean;
}

const VideoItem: React.FC<{
  video: UserVideo;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  readOnly?: boolean;
}> = ({ video, onDelete, isDeleting, readOnly = false }) => (
  <div className="group rounded-xl overflow-hidden bg-white border border-slate-100 hover:shadow-md transition-all duration-200">
    <Link to={`/video/${video.id}`}>
      <div className="aspect-video overflow-hidden bg-slate-200">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    </Link>
    <div className="p-3">
      <h3 className="text-sm font-semibold text-slate-800 line-clamp-2">
        {video.title}
      </h3>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-slate-400">{video.likes} likes</span>
        {!readOnly && (
          <button
            onClick={() => onDelete(video.id)}
            disabled={isDeleting}
            className="text-xs text-red-400 hover:text-red-500 disabled:opacity-50 transition"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  </div>
);

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  userId,
  readOnly = false,
}) => {
  const [tab, setTab] = useState<"videos" | "about">("videos");
  const { data: profile } = useGetProfileQuery(userId);
  const { data: videos, isLoading: videosLoading } =
    useGetUserVideosQuery(userId);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [deleteVideo, { isLoading: isDeleting }] = useDeleteVideoMutation();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAbout, setEditAbout] = useState("");

  const startEditing = () => {
    setEditName(profile?.username || "");
    setEditAbout(profile?.about || "");
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        username: editName,
        about: editAbout,
      }).unwrap();
      setEditing(false);
    } catch (err) {
      console.error("Profile update failed:", err);
    }
  };

  const handleDeleteVideo = async (videoId: number) => {
    try {
      await deleteVideo(videoId).unwrap();
    } catch (err) {
      console.error("Delete video failed:", err);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Tabs */}
      <div className="flex gap-8 px-8 bg-white border-b border-slate-100">
        <button
          onClick={() => setTab("videos")}
          className={`py-3.5 text-sm font-medium transition ${
            tab === "videos"
              ? "border-b-2 border-teal-500 text-teal-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Videos
        </button>

        <button
          onClick={() => setTab("about")}
          className={`py-3.5 text-sm font-medium transition ${
            tab === "about"
              ? "border-b-2 border-teal-500 text-teal-600"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          About
        </button>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {tab === "videos" && (
          <div>
            {videosLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : videos && videos.length > 0 ? (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {videos.map((video) => (
                  <VideoItem
                    key={video.id}
                    video={video}
                    onDelete={handleDeleteVideo}
                    isDeleting={isDeleting}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-12">
                No videos uploaded yet.
              </p>
            )}
          </div>
        )}

        {tab === "about" && (
          <div className="max-w-2xl">
            {editing ? (
              <div className="flex flex-col gap-4 bg-white rounded-xl border border-slate-100 p-6">
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Username
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 transition"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    About
                  </label>
                  <textarea
                    value={editAbout}
                    onChange={(e) => setEditAbout(e.target.value)}
                    rows={4}
                    className="w-full mt-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 resize-none transition"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-teal-500 text-white text-sm rounded-xl hover:bg-teal-600 disabled:opacity-50 transition"
                  >
                    {isUpdating ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-slate-800">About</h3>
                  {!readOnly && (
                    <button
                      onClick={startEditing}
                      className="text-sm text-teal-500 hover:text-teal-600 transition"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {profile?.about || "No description yet."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTabs;
