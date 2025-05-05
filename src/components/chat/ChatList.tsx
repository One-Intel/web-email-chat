
import React from "react";
import { useChats } from "@/hooks/useChats";
import { MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import ChatListItem from "./ChatListItem";
import { format } from "date-fns";

interface ChatListProps {
  onChatSelect?: (chatId: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onChatSelect }) => {
  const { chats, isLoading, error } = useChats();
  const { user } = useAuth();

  if (isLoading) return <div className="p-3">Loading chats...</div>;
  if (error) return <div className="p-3 text-red-500">Error loading chats: {String(error)}</div>;

  console.log("Rendering chats:", chats);

  // Make sure chats is an array before mapping
  const processedChats = Array.isArray(chats) ? chats.map(chat => {
    // Find participants that aren't the current user
    const otherParticipants = chat.participants.filter(
      p => p.user_id !== user?.id
    );
    
    // Get the first other participant's profile, or use a default if none found
    const otherUser = otherParticipants.length > 0 
      ? otherParticipants[0].profiles 
      : null;
    
    return {
      id: chat.id,
      name: otherUser?.full_name || "Unknown User",
      lastMessage: chat.last_message?.content || "No messages yet",
      timestamp: chat.last_message?.created_at 
        ? format(new Date(chat.last_message.created_at), 'p')
        : format(new Date(chat.created_at), 'p'),
      unread: 0, // We'll implement this later
      avatar: otherUser?.avatar_url || "",
    };
  }) : [];

  console.log("Processed chats:", processedChats);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-2 flex items-center">
        <MessageSquare className="h-5 w-5 mr-2" />
        Chats
      </h2>

      {processedChats.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No chats yet</p>
          <p className="text-sm mt-1">Start chatting with friends using the contacts tab!</p>
        </div>
      ) : (
        <>
          <div className="space-y-1">
            {processedChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                onClick={() => onChatSelect && onChatSelect(chat.id)}
              />
            ))}
          </div>
          <Separator />
        </>
      )}
    </div>
  );
};

export default ChatList;
