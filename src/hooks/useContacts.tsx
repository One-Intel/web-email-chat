
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
  }
};

export const useContacts = () => {
  const queryClient = useQueryClient();
  
  // Get all accepted contacts
  const { data: acceptedContacts, isLoading: isLoadingAccepted } = useQuery<ContactWithProfile[]>({
    queryKey: ["contacts", "accepted"],
    queryFn: async () => {
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("User not authenticated");
      
      // Get contacts with joined profile data
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          profiles:contact_id(
            id,
            full_name,
            avatar_url,
            status_message,
            last_seen
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "accepted");

      if (error) throw error;
      return data as unknown as ContactWithProfile[];
    },
  });

  // Get pending contact requests (sent by current user)
  const { data: sentRequests, isLoading: isLoadingSent } = useQuery<ContactWithProfile[]>({
    queryKey: ["contacts", "sent"],
    queryFn: async () => {
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          profiles:contact_id(
            id,
            full_name,
            avatar_url,
            status_message,
            last_seen
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      return data as unknown as ContactWithProfile[];
    },
  });

  // Get received contact requests
  const { data: receivedRequests, isLoading: isLoadingReceived } = useQuery<ContactWithProfile[]>({
    queryKey: ["contacts", "received"],
    queryFn: async () => {
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          profiles:contact_id(
            id,
            full_name,
            avatar_url,
            status_message,
            last_seen
          )
        `)
        .eq("contact_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      return data as unknown as ContactWithProfile[];
    },
  });

  // Add a new contact
  const addContact = useMutation({
    mutationFn: async (contactId: string) => {
      // Get current user
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
