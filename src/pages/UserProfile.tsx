import React from "react";
import { useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile, isLoading } = useProfile();

  // If viewing own profile, use profile hook, else fetch public profile
  // For brevity, just using current user for now
  // (Erroneous display was due to missing user detection)

  if (isLoading) return <div>Loading...</div>;
  if (!profile) return <div>No profile data.</div>;

  return (
    <div className="flex flex-col items-center mt-12">
      <Avatar className="h-20 w-20">
        <AvatarImage src={profile.avatar_url} />
        <AvatarFallback>{profile.full_name?.[0] || "?"}</AvatarFallback>
      </Avatar>
      <h2 className="text-2xl mt-4 font-semibold">{profile.full_name}</h2>
      <div className="mt-2 text-gray-600">
        {profile.status_message ?? "Available"}
      </div>
      <div className="mt-4">
        <span className="text-sm text-gray-400">User Code:</span>
        <span className="font-mono ml-2">{profile.user_code?.toString().padStart(6, "0")}</span>
      </div>
    </div>
  );
};

export default UserProfile;
