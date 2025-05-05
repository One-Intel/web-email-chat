
import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
  isTyping?: boolean;
}

interface ChatListItemProps {
  chat: Chat;
  onClick?: () => void;
  isActive?: boolean;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ 
  chat, 
  onClick, 
  isActive = false 
}) => {
  return (
    <div 
      className={cn(
        "chat-list-item",
        isActive && "bg-webchat-hover"
      )}
      onClick={onClick}
    >
      <Avatar className="h-12 w-12 mr-3">
        {chat.avatar ? (
          <img src={chat.avatar} alt={chat.name} />
        ) : (
          <div className="bg-webchat-primary text-white w-full h-full flex items-center justify-center text-lg font-semibold">
            {chat.name[0].toUpperCase()}
          </div>
        )}
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-medium truncate">{chat.name}</h3>
          <span className="text-xs text-gray-500">{chat.timestamp}</span>
        </div>
        
        <div className="flex justify-between items-center">
          {chat.isTyping ? (
            <p className="typing-indicator">Typing...</p>
          ) : (
            <p className="text-sm text-gray-600 truncate flex items-center">
              {chat.unread === 0 && (
                <span className="flex mr-1 text-webchat-read">
                  <Check className="h-3 w-3" />
                  <Check className="h-3 w-3 -ml-1" />
                </span>
              )}
              {chat.lastMessage}
            </p>
          )}
          
          {chat.unread > 0 && (
            <span className="bg-webchat-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {chat.unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
