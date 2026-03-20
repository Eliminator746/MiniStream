import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUploadVideoMutation } from "@/features/apiSlice";
import { Upload as UploadIcon } from "lucide-react";

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadVideo, { isLoading }] = useUploadVideoMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handlePublish = async () => {
    setError("");
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!file) {
      setError("Please select a video file");
      return;
    }
    try {
      await uploadVideo({
        title: title.trim(),
        description: description.trim(),
        file,
      }).unwrap();
      navigate("/");
    } catch (err: any) {
      setError(err?.data?.detail || "Upload failed. Please try again.");
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="h-[calc(100vh-57px)] overflow-y-auto no-scrollbar">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Page heading */}
        <h1 className="text-2xl font-bold text-slate-900">Upload video</h1>
        <p className="text-sm text-slate-500 mt-1 mb-8">
          Share your video with the community
        </p>

        {/* File drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center py-14 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition group"
        >
          <div className="w-14 h-14 rounded-full bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center mb-4 transition">
            <UploadIcon
              size={24}
              className="text-slate-400 group-hover:text-teal-500 transition"
            />
          </div>
          {file ? (
            <div className="text-center">
              <p className="text-sm font-medium text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-400 mt-1">
                {(file.size / (1024 * 1024)).toFixed(1)} MB — Click to change
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                Select a file
              </p>
              <p className="text-xs text-slate-400 mt-1">MP4 up to 5 MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Details */}
        <div className="mt-8 flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Add a title that describes your video"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              placeholder="Tell viewers about your video"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-400 focus:bg-white resize-none transition"
            />
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={handlePublish}
            disabled={isLoading}
            className="px-6 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 disabled:opacity-50 transition"
          >
            {isLoading ? "Publishing..." : "Publish"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-6 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
