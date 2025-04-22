
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'] & {
  contact: {
    id: string;
    email: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
      status_message: string | null;
      last_seen: string | null;
    };
  };
};

export const useContacts = () => {
  const queryClient = useQueryClient();

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          contact:contact_id (
            id,
            email,
            profiles (
              full_name,
              avatar_url,
              status_message,
              last_seen
            )
          )
        `)
        .eq("status", "accepted");

      if (error) throw error;
      return data as Contact[];
    },
  });

  const addContact = useMutation({
    mutationFn: async (email: string) => {
      const { data: userToAdd, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
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
