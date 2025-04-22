import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

type ChatWithDetails = Database['public']['Tables']['chats']['Row'] & {
  participants: {
    id: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    };
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
      const { data: chatIds, error: chatError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user?.id);

      if (chatError) throw chatError;
      
      if (!chatIds || chatIds.length === 0) {
        return [];
      }
      
      const chatIdList = chatIds.map(c => c.chat_id);
      
      const { data, error } = await supabase
        .from("chats")
        .select(`
          id, 
          created_at,
          participants:chat_participants(
            user:profiles(
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .in("id", chatIdList)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      if (!data) return [];
      
      const enhancedChats = data.map(chat => {
        const otherParticipant = chat.participants
          ?.find(p => p.user.id !== user?.id)?.user;
        
        return {
          ...chat,
          participants: otherParticipant ? [otherParticipant] : []
        };
      });
      
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
      {chats?.map((chat) => {
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
