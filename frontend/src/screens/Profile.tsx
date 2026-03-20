import React from "react";
import { Navigate, useParams } from "react-router-dom";
import ProfileHeader from "../components/ProfileHeader";
import ProfileTabs from "../components/ProfileTabs";
import { useAppSelector } from "@/store/hooks";

const ProfilePage: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const { userId: paramId } = useParams();

  if (!user) return <Navigate to="/login" replace />;

  const profileId = paramId ? Number(paramId) : user.id;
  const isOwner = profileId === user.id;

  return (
    <div className="h-[calc(100vh-57px)] overflow-y-auto no-scrollbar bg-slate-50">
      <ProfileHeader userId={profileId} readOnly={!isOwner} />
      <ProfileTabs userId={profileId} readOnly={!isOwner} />
    </div>
  );
};

export default ProfilePage;
