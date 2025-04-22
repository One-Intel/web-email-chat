
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useContacts = () => {
  const queryClient = useQueryClient();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          contact:contact_id (
            id,
            email,
            profiles:profiles (
              full_name,
              avatar_url,
              status_message,
              last_seen
            )
          )
        `)
        .eq("status", "accepted");

      if (error) throw error;
      return data;
    },
  });

  const addContact = useMutation({
    mutationFn: async (email: string) => {
      const { data: userToAdd, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .single();

      if (userError) throw userError;

      const { error } = await supabase.from("contacts").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        contact_id: userToAdd.id,
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

  return {
    contacts,
    isLoading,
    addContact,
  };
};
