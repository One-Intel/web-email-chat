
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type ChatWithParticipants = {
  id: string;
  created_at: string;
  participants: {
    user_id: string;
    profiles: {
      id: string;
      full_name: string;
      avatar_url: string | null;
      status_message: string | null;
      last_seen: string | null;
    }
  }[];
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    is_deleted: boolean;
  }
};

export const useChats = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all chats for the current user
  const { data: chats, isLoading, error } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      if (!user) return [];

      // Get all chats where the current user is a participant
      const { data: chatParticipants, error: chatError } = await supabase
        .from("chat_participants")
        .select(`
          chat_id
        `)
        .eq("user_id", user.id);

      if (chatError) throw chatError;
      if (!chatParticipants || chatParticipants.length === 0) return [];

      // Get the actual chats with their participants
      const chatIds = chatParticipants.map(cp => cp.chat_id);
      
      // Updated query to fix the profiles relationship
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select(`
          id,
          created_at,
          participants:chat_participants(
            user_id,
            profiles:profiles!user_id(
              id,
              full_name,
              avatar_url,
              status_message,
              last_seen
            )
          )
        `)
        .in("id", chatIds);

      if (chatsError) throw chatsError;

      // Get the last message for each chat
      const chatsWithLastMessages: ChatWithParticipants[] = await Promise.all(
        (chatsData || []).map(async chat => {
          const { data: lastMessageData, error: lastMessageError } = await supabase
            .from("messages")
            .select("content, created_at, sender_id, is_deleted")
            .eq("chat_id", chat.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (lastMessageError && lastMessageError.code !== 'PGRST116') {
            console.error("Error fetching last message:", lastMessageError);
          }

          return {
            ...chat,
            last_message: lastMessageData || undefined
          } as ChatWithParticipants;
        })
      );

      return chatsWithLastMessages;
    },
    enabled: !!user,
  });

  const createChat = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error("User not authenticated");
      
      // Check if a chat already exists between these users
      const { data: existingChats, error: checkError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id)
        .in("chat_id", supabase
          .from("chat_participants")
          .select("chat_id")
          .eq("user_id", otherUserId)
        );

      if (checkError) throw checkError;
      
      if (existingChats && existingChats.length > 0) {
        // Chat already exists, return the chat ID
        return existingChats[0].chat_id;
      }
      
      // Create a new chat
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({})
        .select()
        .single();

      if (chatError) throw chatError;
      
      // Add both users as participants
      const { error: participantError } = await supabase
        .from("chat_participants")
        .insert([
          { chat_id: newChat.id, user_id: user.id },
          { chat_id: newChat.id, user_id: otherUserId }
        ]);

      if (participantError) throw participantError;
      
      return newChat.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error) => {
      toast.error("Failed to create chat: " + error.message);
    }
  });

  return {
    chats,
    isLoading,
    error,
    createChat
  };
};
