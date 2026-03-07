import React from "react";
import ProfileHeader from "../components/ProfileHeader";
import ProfileTabs from "../components/ProfileTabs";

const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <ProfileHeader />
      <ProfileTabs />
    </div>
  );
};

export default ProfilePage;
