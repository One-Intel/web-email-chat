
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
      // First get chats where the current user is a participant
      const { data: chatIds, error: chatError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user?.id);

      if (chatError) throw chatError;
      
      if (!chatIds || chatIds.length === 0) {
        return [];
      }
      
      // Then get details for each chat
      const chatIdList = chatIds.map(c => c.chat_id);
      
      const { data, error } = await supabase
        .from("chats")
        .select(`
          id, 
          created_at
        `)
        .in("id", chatIdList)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      if (!data) return [];
      
      // For each chat, get the participants and latest message
      const enhancedChats = await Promise.all(data.map(async (chat) => {
        // Get participants
        const { data: participantsData, error: participantsError } = await supabase
          .from("chat_participants")
          .select(`
            user_id
          `)
          .eq("chat_id", chat.id)
          .neq("user_id", user?.id);
        
        if (participantsError) throw participantsError;
        
        // Get profiles for participants
        let participants = [];
        if (participantsData && participantsData.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select(`
              id,
              full_name,
              avatar_url
            `)
            .in("id", participantsData.map(p => p.user_id));
            
          if (profilesError) throw profilesError;
          participants = profilesData || [];
        }
        
        // Get latest message
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select(`
            content,
            created_at,
            sender_id
          `)
          .eq("chat_id", chat.id)
          .order("created_at", { ascending: false })
          .limit(1);
          
        if (messagesError) throw messagesError;
        
        return {
          ...chat,
          participants,
          latest_message: messagesData && messagesData[0]
        } as ChatWithDetails;
      }));
      
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
        // Access participant safely
        const participant = chat.participants?.[0] || null;
        
        return (
          <div
            key={chat.id}
            className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md cursor-pointer"
            onClick={() => onChatSelect(chat.id)}
          >
            <Avatar>
              <AvatarImage 
                src={participant?.avatar_url ?? undefined} 
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
