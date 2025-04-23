
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
        // First, get all the user's chats directly
        const { data: chatParticipants, error: chatError } = await supabase
          .from("chat_participants")
          .select("chat_id")
          .eq("user_id", user.id);

        if (chatError) {
          console.error("Error fetching chat participants:", chatError);
          throw chatError;
        }
        
        if (!chatParticipants || chatParticipants.length === 0) {
          return [];
        }

        const chatIds = chatParticipants.map(cp => cp.chat_id);

        // Get the chat details
        const { data: chatsData, error: chatsError } = await supabase
          .from("chats")
          .select("id, created_at")
          .in("id", chatIds);

        if (chatsError) {
          console.error("Error fetching chats:", chatsError);
          throw chatsError;
        }
        
        if (!chatsData || chatsData.length === 0) {
          return [];
        }

        // For each chat, get the participants and the latest message
        const chatsWithDetails = await Promise.all(
          chatsData.map(async (chat) => {
            try {
              // Get participants for this chat
              const { data: participants, error: participantsError } = await supabase
                .from("chat_participants")
                .select("user_id")
                .eq("chat_id", chat.id);

              if (participantsError) {
                console.error("Error fetching participants:", participantsError);
                throw participantsError;
              }

              // Get profiles for each participant
              const participantsWithProfiles = await Promise.all(
                (participants || []).map(async (participant) => {
                  try {
                    const { data: profile, error: profileError } = await supabase
                      .from("profiles")
                      .select("id, full_name, avatar_url, status_message, last_seen")
                      .eq("id", participant.user_id)
                      .maybeSingle();

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
                      profiles: profile || {
                        id: participant.user_id,
                        full_name: "Unknown User",
                        avatar_url: null,
                        status_message: null,
                        last_seen: null
                      }
                    };
                  } catch (err) {
                    console.error("Error processing participant:", err);
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
                })
              );

              // Get last message for chat
              const { data: lastMessageData, error: messageError } = await supabase
                .from("messages")
                .select("content, created_at, sender_id, is_deleted")
                .eq("chat_id", chat.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              if (messageError) {
                console.error("Error fetching last message:", messageError);
              }

              return {
                ...chat,
                participants: participantsWithProfiles,
                last_message: lastMessageData || undefined,
              } as ChatWithParticipants;
            } catch (err) {
              console.error("Error processing chat:", err);
              return {
                ...chat,
                participants: [],
                last_message: undefined,
              } as ChatWithParticipants;
            }
          })
        );

        return chatsWithDetails;
      } catch (err) {
        console.error("Error in useChats:", err);
        toast.error("Failed to load chats");
        throw err;
      }
    },
    enabled: !!user,
  });

  const createChat = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error("User not authenticated");

      // Check if a chat already exists between these users
      const { data: myChats, error: myChatsError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id);

      if (myChatsError) throw myChatsError;

      let existingChatId: string | null = null;
      
      if (myChats && myChats.length > 0) {
        const { data: sharedChats, error: sharedError } = await supabase
          .from("chat_participants")
          .select("chat_id")
          .eq("user_id", otherUserId)
          .in("chat_id", myChats.map(c => c.chat_id));
          
        if (sharedError) throw sharedError;
        
        if (sharedChats && sharedChats.length > 0) {
          existingChatId = sharedChats[0].chat_id;
        }
      }

      if (existingChatId) return existingChatId;

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
    onError: (error: any) => {
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
