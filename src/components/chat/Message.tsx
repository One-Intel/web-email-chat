
import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageProps {
  content: string;
  timestamp: string;
  isOutgoing: boolean;
  status?: "sent" | "delivered" | "read";
  image?: string;
}

const Message: React.FC<MessageProps> = ({
  content,
  timestamp,
  isOutgoing,
  status = "sent",
  image
}) => {
  return (
    <div className={cn(
      "flex flex-col max-w-[75%]",
      isOutgoing ? "ml-auto items-end" : "mr-auto items-start"
    )}>
      <div className={cn(
        "rounded-2xl p-3 pb-2 relative",
        isOutgoing ? "chat-bubble-outgoing" : "chat-bubble-incoming"
      )}>
        {image && (
          <div className="mb-2 rounded-lg overflow-hidden">
            <img 
              src={image} 
              alt="Attachment" 
              className="max-w-full h-auto object-contain max-h-48"
            />
          </div>
        )}
        
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={cn(
            "text-[10px]",
            isOutgoing ? "text-white/70" : "text-gray-500"
          )}>{timestamp}</span>
          
          {isOutgoing && (
            <div className="flex">
              {status === "read" ? (
                <div className="text-white">
                  <Check className="h-3 w-3" />
                  <Check className="h-3 w-3 -ml-1.5" />
                </div>
              ) : status === "delivered" ? (
                <div className="text-white/70">
                  <Check className="h-3 w-3" />
                  <Check className="h-3 w-3 -ml-1.5" />
                </div>
              ) : (
                <Check className="h-3 w-3 text-white/70" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
