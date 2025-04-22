
import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageProps {
  content: string;
  timestamp: string;
  isOutgoing: boolean;
  status?: "sent" | "delivered" | "read";
}

const Message: React.FC<MessageProps> = ({
  content,
  timestamp,
  isOutgoing,
  status = "sent"
}) => {
  return (
    <div className={cn(
      "max-w-[70%] rounded-lg p-2 pb-1 relative",
      isOutgoing ? "ml-auto bg-webchat-light" : "mr-auto bg-white"
    )}>
      <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
      <div className="flex items-center justify-end gap-1 mt-1">
        <span className="text-[10px] text-gray-500">{timestamp}</span>
        
        {isOutgoing && (
          <div className="flex">
            {status === "read" ? (
              <div className="text-webchat-read">
                <Check className="h-3 w-3" />
                <Check className="h-3 w-3 -ml-1.5" />
              </div>
            ) : status === "delivered" ? (
              <div className="text-gray-500">
                <Check className="h-3 w-3" />
                <Check className="h-3 w-3 -ml-1.5" />
              </div>
            ) : (
              <Check className="h-3 w-3 text-gray-500" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
