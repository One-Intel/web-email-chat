import React, { useState, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Image as ImageIcon, X, MessageCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Message from "./Message";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp'];

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
      toast.success("Message sent!");
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

      {/* Existing chat window code */}
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
            className="rounded-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
          >
            <ImageIcon className="h-5 w-5" />
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
