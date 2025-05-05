
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type ContactWithProfile = Database['public']['Tables']['contacts']['Row'] & {
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    status_message: string | null;
    last_seen: string | null;
  } | null;
};

export const useContacts = () => {
  const queryClient = useQueryClient();
  
  // Get all accepted contacts
  const { data: acceptedContacts, isLoading: isLoadingAccepted } = useQuery({
    queryKey: ["contacts", "accepted"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      try {
        // Fetch both "forward" and "reverse" contacts
        const { data: direct, error: directError } = await supabase
          .from("contacts")
          .select(`
            *,
            profiles:contact_id (
              id, full_name, avatar_url, status_message, last_seen
            )
          `)
          .eq("user_id", user.id)
          .eq("status", "accepted");
        
        if (directError) {
          console.error("Error fetching direct contacts:", directError);
          return [];
        }

        const { data: reverse, error: reverseError } = await supabase
          .from("contacts")
          .select(`
            *,
            profiles:user_id (
              id, full_name, avatar_url, status_message, last_seen
            )
          `)
          .eq("contact_id", user.id)
          .eq("status", "accepted");
        
        if (reverseError) {
          console.error("Error fetching reverse contacts:", reverseError);
          return [];
        }

        const contacts = [...(direct || []), ...(reverse || [])];
        return contacts.filter(c => {
          // More comprehensive check to ensure profile exists and has valid ID
          if (!c.profiles || 
              typeof c.profiles !== 'object' || 
              c.profiles === null || 
              !('id' in c.profiles)) {
            return false;
          }
          
          // Now TypeScript knows c.profiles is not null and has an id property
          const profileId = c.profiles.id;
          return profileId !== null && profileId !== undefined && profileId !== user.id;
        });
      } catch (err) {
        console.error("Error fetching contacts:", err);
        return [];
      }
    },
  });

  // Get pending contact requests (sent by current user)
  const { data: sentRequests, isLoading: isLoadingSent } = useQuery({
    queryKey: ["contacts", "sent"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      try {
        const { data, error } = await supabase
          .from("contacts")
          .select(`
            *,
            profiles:contact_id (
              id, full_name, avatar_url, status_message, last_seen
            )
          `)
          .eq("user_id", user.id)
          .eq("status", "pending");
        
        if (error) {
          console.error("Error fetching sent requests:", error);
          return [];
        }
        
        return (data || []).filter(item => {
          // More comprehensive check to ensure profile exists and has valid ID
          if (!item.profiles || 
              typeof item.profiles !== 'object' || 
              item.profiles === null || 
              !('id' in item.profiles)) {
            return false;
          }
          
          // Now TypeScript knows item.profiles is not null and has an id property
          const profileId = item.profiles.id;
          return profileId !== null && profileId !== undefined;
        });
      } catch (err) {
        console.error("Error in sent requests:", err);
        return [];
      }
    },
  });

  // Get received contact requests (to current user)
  const { data: receivedRequests, isLoading: isLoadingReceived } = useQuery({
    queryKey: ["contacts", "received"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      try {
        const { data, error } = await supabase
          .from("contacts")
          .select(`
            *,
            profiles:user_id (
              id, full_name, avatar_url, status_message, last_seen
            )
          `)
          .eq("contact_id", user.id)
          .eq("status", "pending");
        
        if (error) {
          console.error("Error fetching received requests:", error);
          return [];
        }
        
        return (data || []).filter(item => {
          // More comprehensive check to ensure profile exists and has valid ID
          if (!item.profiles || 
              typeof item.profiles !== 'object' || 
              item.profiles === null || 
              !('id' in item.profiles)) {
            return false;
          }
          
          // Now TypeScript knows item.profiles is not null and has an id property
          const profileId = item.profiles.id;
          return profileId !== null && profileId !== undefined;
        });
      } catch (err) {
        console.error("Error in received requests:", err);
        return [];
      }
    },
  });

  // Add a new contact
  const addContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Check if contact request already exists
      const { data: existingContact, error: checkError } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .eq("contact_id", contactId);

      if (checkError) throw checkError;
      if (existingContact && existingContact.length > 0) {
        throw new Error("Contact request already exists");
      }

      // Create the contact request
      const { error } = await supabase.from("contacts").insert({
        user_id: user.id,
        contact_id: contactId,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact request sent!");
    },
    onError: (error) => {
      toast.error("Failed to add contact: " + error.message);
    },
  });

  // Accept a contact request
  const acceptContactRequest = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from("contacts")
        .update({ status: "accepted" })
        .eq("id", contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact request accepted!");
    },
    onError: (error) => {
      toast.error("Failed to accept contact: " + error.message);
    },
  });

  // Reject a contact request
  const rejectContactRequest = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact request rejected!");
    },
    onError: (error) => {
      toast.error("Failed to reject contact: " + error.message);
    },
  });

  return {
    acceptedContacts,
    sentRequests,
    receivedRequests,
    isLoading: isLoadingAccepted || isLoadingSent || isLoadingReceived,
    addContact,
    acceptContactRequest,
    rejectContactRequest,
  };
};
