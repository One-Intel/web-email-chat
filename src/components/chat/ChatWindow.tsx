
import React, { useState, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  X, 
  MessageSquare, 
  ArrowLeft, 
  Phone, 
  Video,
  MoreVertical,
  Smile
} from "lucide-react";
import Message from "./Message";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp'];

// Mock data - this would be replaced with real data
const selectedChat = {
  id: "1",
  name: "Faza Dzikrulloh",
  avatar: "",
  online: true,
  isTyping: true,
  lastSeen: "today at 12:30 PM"
};

const mockMessages = [
  {
    id: "1",
    senderId: "other",
    content: "Hi adhitya please give me feedback about my new shot?",
    timestamp: "14:00",
    status: "read"
  },
  {
    id: "2",
    senderId: "me",
    content: "My pleasure, please send me the link or image",
    timestamp: "14:15",
    status: "read"
  },
  {
    id: "3",
    senderId: "other",
    content: "Here it is! hope you like it!",
    timestamp: "14:25",
    status: "read",
    image: "lovable-uploads/f760e0bc-3325-4d60-a839-a5878a350b54.png"
  },
  {
    id: "4",
    senderId: "me",
    content: "Great work! lets schedule it tomorrow",
    timestamp: "14:28",
    status: "delivered"
  }
];

interface ChatWindowProps {
  chatId?: string;
  className?: string;
  onBackClick?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, className, onBackClick }) => {
  const [newMessage, setNewMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 10MB limit");
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error("Unsupported file type");
        return;
      }
      setAttachedFile(file);
    }
  };

  const uploadAttachment = async () => {
    if (!attachedFile || !chatId || !user) return null;

    try {
      const fileExt = attachedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(fileName, attachedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(fileName);

      return { 
        url: publicUrl, 
        type: attachedFile.type 
      };
    } catch (error) {
      toast.error("Failed to upload attachment");
      console.error(error);
      return null;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachedFile) return;

    try {
      const attachment = attachedFile ? await uploadAttachment() : null;

      const { error } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: user?.id,
        content: newMessage,
        attachment_url: attachment?.url,
        attachment_type: attachment?.type,
      });

      if (error) throw error;

      setNewMessage("");
      setAttachedFile(null);
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Show welcome screen if no chat is selected
  if (!chatId) {
    return (
      <div className={cn("flex-1 flex flex-col items-center justify-center bg-background", className)}>
        <div className="onboarding-container">
          <div className="app-status-bar text-gray-400">
            <span>9:41</span>
            <div className="flex space-x-2">
              <span>●●●●</span>
              <span>▲</span>
            </div>
          </div>

          <div className="mt-6">
            <Button 
              variant="outline" 
              className="absolute right-4 top-20 rounded-full text-webchat-primary border-webchat-light px-6"
            >
              Skip
            </Button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="h-40 w-40 rounded-full bg-webchat-light flex items-center justify-center relative">
              <div className="h-28 w-28 rounded-full bg-webchat-primary flex items-center justify-center">
                <MessageSquare className="h-16 w-16 text-white" />
              </div>
            </div>

            <div className="space-y-2 max-w-xs mx-auto">
              <h1 className="text-2xl font-bold">Welcome to WebChat</h1>
              <p className="text-gray-500 text-sm">
                WebChat supports sending and receiving a variety of media: text, photos, videos, documents, and location, as well as voice calls.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <Button 
              className="w-full rounded-full bg-webchat-primary hover:bg-webchat-dark py-6 text-lg"
            >
              Let's Get Started
            </Button>
            <p className="mt-4 text-gray-500 text-sm">
              Already have account? <span className="text-webchat-primary font-medium">Login</span>
            </p>
          </div>

          <div className="h-1 w-24 bg-gray-300 rounded-full mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Chat header */}
      <div className="p-3 bg-background shadow-sm flex items-center border-b">
        <Button 
          variant="ghost" 
          size="icon"
          className="mr-1"
          onClick={onBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
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
          {selectedChat.isTyping ? (
            <p className="typing-indicator">Typing...</p>
          ) : (
            <p className="text-xs text-gray-500">
              {selectedChat.online ? "Online" : `Last seen ${selectedChat.lastSeen}`}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* File attachment preview */}
      {attachedFile && (
        <div className="bg-accent p-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {attachedFile.type.startsWith('image/') ? (
              <img 
                src={URL.createObjectURL(attachedFile)} 
                alt="Attachment preview" 
                className="h-10 w-10 object-cover rounded" 
              />
            ) : (
              <div className="h-10 w-10 bg-gray-200 flex items-center justify-center rounded">
                {attachedFile.name.split('.').pop()?.toUpperCase()}
              </div>
            )}
            <span>{attachedFile.name}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={removeAttachment}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-webchat-bg">
        <div className="space-y-4">
          {/* Date indicator */}
          <div className="flex justify-center my-2">
            <div className="bg-webchat-secondary text-webchat-primary text-xs px-3 py-1 rounded-full">
              Today
            </div>
          </div>
          
          {mockMessages.map((message) => (
            <Message 
              key={message.id} 
              content={message.content}
              timestamp={message.timestamp}
              isOutgoing={message.senderId === "me"}
              status={message.status as "sent" | "delivered" | "read"}
              image={message.image}
            />
          ))}
        </div>

        {/* Reaction buttons shown at bottom of chat */}
        <div className="reaction-container mt-8">
          <div className="reaction-button bg-gray-200">
            <span className="text-xl">👍</span>
          </div>
          <div className="reaction-button bg-red-500">
            <span className="text-xl">❤️</span>
          </div>
          <div className="reaction-button bg-orange-500">
            <span className="text-xl">🔥</span>
          </div>
          <div className="reaction-button bg-gray-200">
            <span className="text-xl">➕</span>
          </div>
        </div>
      </div>
      
      {/* Message input */}
      <div className="p-3 bg-background border-t">
        <div className="flex items-center space-x-2">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            onChange={handleFileUpload}
            accept={ALLOWED_FILE_TYPES.join(',')}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500"
          >
            <Smile className="h-6 w-6" />
          </Button>
          <div className="flex-1 relative">
            <Input
              placeholder="Type a message"
              className="rounded-full pl-4 pr-12 py-6 bg-gray-100 border-0"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>
          <Button
            size="icon"
            className="rounded-full bg-webchat-primary hover:bg-webchat-dark h-12 w-12"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && !attachedFile}
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
