
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile: currentUserProfile } = useProfile();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // If viewing own profile, use the current user profile
        if (currentUserProfile && id === currentUserProfile.id) {
          setProfile(currentUserProfile);
          setLoading(false);
          return;
        }
        
        // Fetch profile for another user
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching profile:", error);
          throw error;
        }
        
        if (!data) {
          throw new Error("User profile not found");
        }
        
        setProfile(data);
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.message || "Failed to load user profile");
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [id, currentUserProfile]);

  if (loading) {
    return (
      <div className="flex flex-col items-center mt-12">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-8 w-40 mt-4" />
        <Skeleton className="h-4 w-32 mt-2" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center mt-12 text-red-500">{error}</div>;
  }

  if (!profile) {
    return <div className="text-center mt-12">User profile not found.</div>;
  }

  return (
    <div className="flex flex-col items-center mt-12">
      <Card className="p-8 max-w-md w-full">
        <div className="flex flex-col items-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>{profile.full_name?.[0] || "?"}</AvatarFallback>
          </Avatar>
          
          <h2 className="text-2xl mt-4 font-semibold">{profile.full_name}</h2>
          
          <div className="mt-2 text-gray-600 dark:text-gray-400">
            {profile.status_message ?? "Available"}
          </div>
          
          <div className="mt-4 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">User Code:</span>
            <span className="font-mono ml-2">{profile.user_code?.toString().padStart(6, "0")}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;
