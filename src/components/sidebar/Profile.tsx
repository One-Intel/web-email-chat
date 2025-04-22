
import React, { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Image, Mail, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Profile = () => {
  const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(profile?.full_name || '');
  const [newStatus, setNewStatus] = useState(profile?.status_message || '');
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

  const handleProfileUpdate = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: newName,
        status_message: newStatus,
      });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) return <div>Loading profile...</div>;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar className="h-16 w-16 cursor-pointer" onClick={handleAvatarClick}>
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>{profile?.full_name?.[0]}</AvatarFallback>
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
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  placeholder="Set a status message"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleProfileUpdate}>
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-semibold">{profile?.full_name}</h2>
              <p className="text-sm text-gray-500">{profile?.status_message || "No status"}</p>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <User className="h-4 w-4 mr-1" />
                <span>User ID: {user?.id?.slice(0, 5)}</span>
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <Mail className="h-4 w-4 mr-1" />
                <span>{user?.email}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
