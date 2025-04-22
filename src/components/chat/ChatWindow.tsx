
import React, { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Image, MessageCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Message from "./Message";
import { cn } from "@/lib/utils";

// Mock data
const selectedChat = {
  id: "1",
  name: "John Doe",
  avatar: "",
  online: true,
  lastSeen: "today at 12:30 PM"
};

const mockMessages = [
  {
    id: "1",
    senderId: "other",
    content: "Hey there! How are you doing?",
    timestamp: "10:30 AM",
    status: "read"
  },
  {
    id: "2",
    senderId: "me",
    content: "I'm good! Just working on a new project. It's a WhatsApp clone using email registration instead of phone numbers.",
    timestamp: "10:32 AM",
    status: "read"
  },
  {
    id: "3",
    senderId: "other",
    content: "That sounds interesting! What technologies are you using?",
    timestamp: "10:33 AM",
    status: "read"
  },
  {
    id: "4",
    senderId: "me",
    content: "React for the frontend with TailwindCSS for styling. And Supabase for the backend - it handles authentication, database, and real-time functionality.",
    timestamp: "10:35 AM",
    status: "delivered"
  }
];

interface ChatWindowProps {
  chatId?: string;
  className?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, className }) => {
  const [newMessage, setNewMessage] = useState("");
  
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage);
      // Here we would send the message to the backend
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show placeholder if no chat is selected
  if (!chatId) {
    return (
      <div className={cn("flex-1 flex flex-col items-center justify-center bg-webchat-bg", className)}>
        <div className="text-center p-6 max-w-md">
          <div className="bg-webchat-primary rounded-full p-4 inline-flex mb-4">
            <MessageCircle size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">WebChat</h2>
          <p className="text-gray-600 mb-6">
            Send and receive messages without keeping your phone online.<br />
            Use WebChat on up to 4 linked devices and 1 phone.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Chat header */}
      <div className="p-3 bg-gray-100 flex items-center">
        <Avatar className="h-10 w-10 mr-3">
          {selectedChat.avatar ? (
            <img src={selectedChat.avatar} alt={selectedChat.name} />
          ) : (
            <div className="bg-webchat-primary text-white w-full h-full flex items-center justify-center">
              {selectedChat.name[0].toUpperCase()}
            </div>
          )}
        </Avatar>
        
        <div className="flex-1">
          <h3 className="font-medium">{selectedChat.name}</h3>
          <p className="text-xs text-gray-500">
            {selectedChat.online ? "Online" : `Last seen ${selectedChat.lastSeen}`}
          </p>
        </div>
      </div>
      
      <Separator />
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-webchat-bg">
        <div className="space-y-2">
          {mockMessages.map((message) => (
            <Message 
              key={message.id} 
              content={message.content}
              timestamp={message.timestamp}
              isOutgoing={message.senderId === "me"}
              status={message.status as "sent" | "delivered" | "read"}
            />
          ))}
        </div>
      </div>
      
      {/* Message input */}
      <div className="p-3 bg-gray-100">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Image className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message"
            className="flex-1"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button
            size="icon"
            className="rounded-full bg-webchat-primary hover:bg-webchat-secondary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
