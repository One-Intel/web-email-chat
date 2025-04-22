
import React, { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, MessageCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatListItem from "./ChatListItem";

// Mock data for chat list
const mockChats = [
  {
    id: "1",
    name: "John Doe",
    lastMessage: "Hey, how are you doing?",
    timestamp: "10:30 AM",
    unread: 2,
    avatar: "",
  },
  {
    id: "2",
    name: "Alice Smith",
    lastMessage: "Can you send me the files?",
    timestamp: "Yesterday",
    unread: 0,
    avatar: "",
  },
  {
    id: "3",
    name: "Team Project",
    lastMessage: "Bob: I'll handle the design part",
    timestamp: "Yesterday",
    unread: 0,
    avatar: "",
  },
  {
    id: "4",
    name: "Jane Wilson",
    lastMessage: "Thanks for your help!",
    timestamp: "Monday",
    unread: 0,
    avatar: "",
  }
];

interface SidebarProps {
  onChatSelect?: (chatId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onChatSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  
  const filteredChats = mockChats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r bg-white">
      {/* Header */}
      <div className="p-3 bg-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 bg-webchat-primary text-white">
            <MessageCircle size={20} />
          </Avatar>
          <h2 className="ml-3 font-semibold">WebChat</h2>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search or start a new chat"
            className="pl-10 bg-gray-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Separator />

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            onClick={() => onChatSelect && onChatSelect(chat.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
