
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  status_message?: string;
  last_seen: string;
  user_code: number; // 6-digit code
  theme?: string; // Add theme to the Profile interface
}

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        
        if (error) throw error;

        // Fetch user settings which contains theme
        const { data: settingsData, error: settingsError } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (settingsError) {
          console.error("Error fetching settings:", settingsError);
          // Return profile without theme if settings fetch fails
          return data as Profile;
        }

        // Combine profile with settings data
        return {
          ...(data as Profile),
          theme: settingsData?.theme || "light"
        };
      } catch (err) {
        console.error("Error fetching profile:", err);
        return null;
      }
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile> & { theme?: string }) => {
      const { theme, ...profileUpdates } = updates;
      
      // Update profile if there are profile updates
      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("id", user?.id);

        if (error) throw error;
      }

      // Update theme in user_settings if theme is provided
      if (theme !== undefined) {
        const { error } = await supabase
          .from("user_settings")
          .update({ theme })
          .eq("user_id", user?.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("User not authenticated");
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
    },
    onSuccess: () => {
      toast.success("Avatar updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to upload avatar: " + error.message);
    },
  });

  return {
    profile,
    isLoading,
    updateProfile,
    uploadAvatar,
  };
};
