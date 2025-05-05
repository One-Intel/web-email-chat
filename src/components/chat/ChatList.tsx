
import React from "react";
import { useChats } from "@/hooks/useChats";
import { MessageSquare, Search, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ChatListItem from "./ChatListItem";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface ChatListProps {
  onChatSelect?: (chatId: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onChatSelect }) => {
  const { chats, isLoading, error } = useChats();
  const { user } = useAuth();

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-webchat-primary animate-pulse">Loading chats...</div>
    </div>
  );
  
  if (error) return (
    <div className="p-3 text-red-500">Error loading chats: {String(error)}</div>
  );

  // Make sure chats is an array before mapping
  const processedChats = Array.isArray(chats) ? chats.map(chat => {
    // Ensure participants exists and is an array
    const chatParticipants = Array.isArray(chat.participants) ? chat.participants : [];
    
    // Find participants that aren't the current user
    const otherParticipants = chatParticipants.filter(
      p => p.user_id !== user?.id
    );
    
    // Get the first other participant's profile, or use a default if none found
    const otherUser = otherParticipants.length > 0 && otherParticipants[0].profiles 
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
      isTyping: Math.random() > 0.7, // Randomly show typing for demo
    };
  }) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="app-status-bar">
        <div className="text-xl font-bold text-webchat-primary">WEBCHAT</div>
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-500" />
          <Plus className="h-5 w-5 text-gray-500" />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-4 pt-2">
        <Tabs defaultValue="chat">
          <TabsList className="grid grid-cols-3 bg-background">
            <TabsTrigger 
              value="chat" 
              className="data-[state=active]:bg-webchat-secondary data-[state=active]:text-webchat-primary"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger 
              value="status" 
              className="data-[state=active]:bg-webchat-secondary data-[state=active]:text-webchat-primary"
            >
              Status
            </TabsTrigger>
            <TabsTrigger 
              value="calls" 
              className="data-[state=active]:bg-webchat-secondary data-[state=active]:text-webchat-primary"
            >
              Calls
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search or start a new chat"
            className="pl-10 bg-gray-100 rounded-full"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto pb-16">
        {processedChats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No chats yet</p>
            <p className="text-sm mt-1">Start chatting with friends!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {processedChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                onClick={() => onChatSelect && onChatSelect(chat.id)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Floating Action Button */}
      <div className="absolute right-4 bottom-4">
        <button className="h-14 w-14 rounded-full bg-webchat-primary text-white shadow-lg flex items-center justify-center">
          <MessageSquare className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatList;
