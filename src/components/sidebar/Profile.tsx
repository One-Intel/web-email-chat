
import React from "react";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Image } from "lucide-react";

export const Profile = () => {
  const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadAvatar.mutateAsync(file);
    }
  };

  if (isLoading) return <div>Loading profile...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar className="h-16 w-16 cursor-pointer" onClick={handleAvatarClick}>
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>
              {profile?.full_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="ghost"
            className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary hover:bg-primary/90"
            onClick={handleAvatarClick}
          >
            <Image className="h-4 w-4 text-white" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div>
          <h2 className="font-semibold">{profile?.full_name}</h2>
          <p className="text-sm text-gray-500">{profile?.status_message || "No status"}</p>
        </div>
      </div>
    </div>
  );
};
