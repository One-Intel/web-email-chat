
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ContactItemProps {
  contact: any;
  type: "contact" | "received" | "sent";
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onChatStart?: (userId: string) => void;
}

export const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  type,
  onAccept,
  onReject,
  onChatStart
}) => {
  const queryClient = useQueryClient();

  const handleChatStart = async () => {
    if (!onChatStart || !contact.profiles?.id) return;
    onChatStart(contact.profiles.id);
  };
  
  return (
    <div
      key={contact.id}
      className="flex items-center justify-between space-x-3 p-3 hover:bg-accent rounded-md"
    >
      <div 
        className="flex items-center space-x-3 flex-1 cursor-pointer" 
        onClick={handleChatStart}
      >
        <Avatar>
          <AvatarImage src={contact.profiles?.avatar_url ?? undefined} />
          <AvatarFallback>
            {contact.profiles?.full_name?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {contact.profiles?.full_name || "Unknown"}
          </p>
          
          {type === "received" && (
            <p className="text-xs text-emerald-500">
              Wants to connect with you
            </p>
          )}
          
          {type === "sent" && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3 text-yellow-500" />
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          )}
          
          {type === "contact" && (
            <p className="text-xs text-gray-500 truncate">
              {contact.profiles?.status_message || "Available"}
            </p>
          )}
        </div>
      </div>

      {type === "received" && (
        <div className="flex space-x-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-green-500"
            onClick={() => onAccept && onAccept(contact.id)}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500"
            onClick={() => onReject && onReject(contact.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {type === "sent" && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-red-500"
          onClick={() => onReject && onReject(contact.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
