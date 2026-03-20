import React, { useRef } from "react";
import {
  useGetProfileQuery,
  useUploadProfileImageMutation,
  useUploadCoverImageMutation,
} from "@/features/apiSlice";
import { Camera } from "lucide-react";

interface ProfileHeaderProps {
  userId: number;
  readOnly?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userId,
  readOnly = false,
}) => {
  const { data: profile, isLoading } = useGetProfileQuery(userId);
  const [uploadProfileImage] = useUploadProfileImageMutation();
  const [uploadCoverImage] = useUploadCoverImageMutation();

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleProfileImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadProfileImage(file).unwrap();
    } catch (err) {
      console.error("Profile image upload failed:", err);
    }
  };

  const handleCoverImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadCoverImage(file).unwrap();
    } catch (err) {
      console.error("Cover image upload failed:", err);
    }
  };

  if (isLoading) {
    return <div className="w-full h-48 bg-slate-200 animate-pulse" />;
  }

  if (!profile) {
    return <div className="p-8 text-slate-500">Profile not found</div>;
  }

  return (
    <div className="w-full flex flex-col">
      {/* Cover Image */}
      <div
        className={`relative w-full h-48 bg-linear-to-r from-teal-500 to-emerald-500 flex items-center justify-center text-white/50 text-lg font-medium ${!readOnly ? "cursor-pointer group" : ""}`}
        onClick={() => !readOnly && coverInputRef.current?.click()}
      >
        {profile.cover_image ? (
          <img
            src={profile.cover_image}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          !readOnly && "Click to add cover"
        )}
        {!readOnly && (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <Camera className="text-white" size={28} />
          </div>
        )}
        {!readOnly && (
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverImageChange}
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="flex items-center gap-5 px-8 py-5 bg-white border-b border-slate-100">
        <div
          className={`relative -mt-10 ${!readOnly ? "cursor-pointer group" : ""}`}
          onClick={() => !readOnly && profileInputRef.current?.click()}
        >
          {profile.profile_image ? (
            <img
              src={profile.profile_image}
              alt={profile.username}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-white"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}
          {!readOnly && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition rounded-full flex items-center justify-center">
              <Camera className="text-white" size={18} />
            </div>
          )}
          {!readOnly && (
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageChange}
            />
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">
            {profile.username}
          </h2>
          <p className="text-sm text-slate-500">
            {profile.subscribers.toLocaleString()} subscribers
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
