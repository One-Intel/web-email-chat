
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

      try {
        // Get all chat IDs where current user is a participant
        const { data: chatParticipants, error: chatError } = await supabase
          .from("chat_participants")
          .select("chat_id")
          .eq("user_id", user.id);

        if (chatError) throw chatError;
        if (!chatParticipants || chatParticipants.length === 0) return [];

        const chatIds = chatParticipants.map(cp => cp.chat_id);

        // Get the chats 
        const { data: chatsData, error: chatsError } = await supabase
          .from("chats")
          .select(`
            id,
            created_at
          `)
          .in("id", chatIds);

        if (chatsError) throw chatsError;
        if (!chatsData) return [];

        // Process each chat to get participants and last message
        const chatsWithParticipants = await Promise.all(
          chatsData.map(async (chat) => {
            // Get participants for this chat
            const { data: participants, error: participantsError } = await supabase
              .from("chat_participants")
              .select("user_id")
              .eq("chat_id", chat.id);

            if (participantsError) throw participantsError;
            
            // For each participant, get their profile separately
            const participantsWithProfiles = await Promise.all(
              (participants || []).map(async (participant) => {
                const { data: profile, error: profileError } = await supabase
                  .from("profiles")
                  .select("id, full_name, avatar_url, status_message, last_seen")
                  .eq("id", participant.user_id)
                  .single();
                
                if (profileError) {
                  console.error("Error fetching profile:", profileError);
                  return {
                    user_id: participant.user_id,
                    profiles: {
                      id: participant.user_id,
                      full_name: "Unknown User",
                      avatar_url: null,
                      status_message: null,
                      last_seen: null
                    }
                  };
                }
                
                return {
                  user_id: participant.user_id,
                  profiles: profile
                };
              })
            );

            // Get last message for this chat
            const { data: lastMessageData, error: lastMessageError } = await supabase
              .from("messages")
              .select("content, created_at, sender_id, is_deleted")
              .eq("chat_id", chat.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lastMessageError) {
              console.error("Error fetching last message:", lastMessageError);
            }

            return {
              ...chat,
              participants: participantsWithProfiles,
              last_message: lastMessageData || undefined,
            } as ChatWithParticipants;
          })
        );

        return chatsWithParticipants;
      } catch (err) {
        console.error("Error in useChats:", err);
        throw err;
      }
    },
    enabled: !!user,
  });

  const createChat = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error("User not authenticated");
      
      // Check if a chat already exists between these users
      const { data: existingChatsData, error: checkError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id);

      if (checkError) throw checkError;
      
      // If we have chat IDs, check if any of them include the other user
      let existingChatId: string | null = null;
      
      if (existingChatsData && existingChatsData.length > 0) {
        const chatIds = existingChatsData.map(item => item.chat_id);
        
        // Find chats where other user is a participant
        const { data: otherUserChats, error: otherUserError } = await supabase
          .from("chat_participants")
          .select("chat_id")
          .eq("user_id", otherUserId)
          .in("chat_id", chatIds);
          
        if (otherUserError) throw otherUserError;
        
        if (otherUserChats && otherUserChats.length > 0) {
          existingChatId = otherUserChats[0].chat_id;
        }
      }
      
      // If found an existing chat, return its ID
      if (existingChatId) {
        return existingChatId;
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
