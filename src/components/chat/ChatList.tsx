
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

type ChatWithDetails = Database['public']['Tables']['chats']['Row'] & {
  participants: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  }[];
  latest_message?: {
    content: string | null;
    created_at: string | null;
    sender_id: string;
  };
};

export const ChatList = ({ onChatSelect }: { onChatSelect: (chatId: string) => void }) => {
  const { user } = useAuth();
  
  const { data: chats, isLoading } = useQuery<ChatWithDetails[]>({
    queryKey: ["chats"],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      // First get the chat IDs the user is part of
      const { data: chatParticipants, error: participantsError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id);

      if (participantsError) throw participantsError;
      if (!chatParticipants || chatParticipants.length === 0) {
        return [];
      }
      
      const chatIds = chatParticipants.map(cp => cp.chat_id);

      // Get all chats with these IDs
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select("id, created_at")
        .in("id", chatIds);
      
      if (chatsError) throw chatsError;
      if (!chatsData) return [];
      
      // For each chat, get the participants
      const enhancedChats: ChatWithDetails[] = [];
      
      for (const chat of chatsData) {
        // Get all participants for this chat
        const { data: participantsData, error: participantsQueryError } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("chat_id", chat.id);
          
        if (participantsQueryError) throw participantsQueryError;
        if (!participantsData) continue;
        
        // Get profile data for each participant (excluding the current user)
        const otherParticipantIds = participantsData
          .filter(p => p.user_id !== user.id)
          .map(p => p.user_id);
          
        if (otherParticipantIds.length === 0) continue;
        
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", otherParticipantIds);
          
        if (profilesError) throw profilesError;
        if (!profilesData) continue;
        
        // Get latest message for this chat
        const { data: latestMessage, error: messageError } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("chat_id", chat.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
          
        enhancedChats.push({
          ...chat,
          participants: profilesData,
          latest_message: messageError ? undefined : latestMessage
        });
      }
      
      return enhancedChats;
    },
    enabled: !!user,
  });

  if (isLoading) return <div>Loading chats...</div>;
  
  if (!chats || chats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No chats yet</p>
        <p className="text-sm">Start a conversation with a contact!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chats.map((chat) => {
        const participant = chat.participants?.[0];
        
        return (
          <div
            key={chat.id}
            className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md cursor-pointer"
            onClick={() => onChatSelect(chat.id)}
          >
            <Avatar>
              <AvatarImage 
                src={participant?.avatar_url || undefined} 
                alt={participant?.full_name || "Unknown"}
              />
              <AvatarFallback>
                {participant?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {participant?.full_name || "Unknown"}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {chat.latest_message?.content || "No messages yet"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
