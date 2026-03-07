import React from "react";

const ProfileHeader: React.FC = () => {
  return (
    <div className="w-full flex flex-col">
      {/* Cover Image */}
      <div className="w-full h-52 bg-orange-500 flex items-center justify-center text-white text-3xl font-bold">
        Cover Image
      </div>

      {/* Profile Info */}
      <div className="flex items-center gap-6 px-10 py-6 bg-white">
        <img
          src="https://randomuser.me/api/portraits/women/44.jpg"
          className="w-20 h-20 rounded-full"
        />

        <div>
          <h2 className="text-xl font-semibold">Debt Free Millennials</h2>

          <p className="text-sm text-gray-500">53.5K subscribers</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
