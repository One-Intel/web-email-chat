
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Database } from "@/integrations/supabase/types";

type ChatParticipant = {
  user: {
    id: string;
    email: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    };
  };
};

type Chat = Database['public']['Tables']['chats']['Row'] & {
  chat_participants: ChatParticipant[];
  messages: Database['public']['Tables']['messages']['Row'][];
};

export const ChatList = ({ onChatSelect }: { onChatSelect: (chatId: string) => void }) => {
  const { data: chats, isLoading } = useQuery<Chat[]>({
    queryKey: ["chats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chats")
        .select(`
          *,
          chat_participants!inner (
            user:user_id (
              id,
              email,
              profiles (
                full_name,
                avatar_url
              )
            )
          ),
          messages (
            content,
            created_at,
            sender_id
          )
        `)
        .order("created_at", { foreignTable: "messages", ascending: false });

      if (error) throw error;
      return data as Chat[];
    },
  });

  if (isLoading) return <div>Loading chats...</div>;

  return (
    <div className="space-y-2">
      {chats?.map((chat) => (
        <div
          key={chat.id}
          className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md cursor-pointer"
          onClick={() => onChatSelect(chat.id)}
        >
          <Avatar>
            <AvatarImage src={chat.chat_participants[0].user.profiles.avatar_url ?? undefined} />
            <AvatarFallback>
              {chat.chat_participants[0].user.profiles.full_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {chat.chat_participants[0].user.profiles.full_name}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {chat.messages[0]?.content || "No messages yet"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
