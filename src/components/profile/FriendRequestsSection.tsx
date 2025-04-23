
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, MessageSquare } from "lucide-react";

interface FriendRequest {
  id: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  }
}

interface Props {
  title: string;
  requests: FriendRequest[];
  type: "sent" | "received";
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onMessage?: (userId: string) => void;
}

export const FriendRequestsSection: React.FC<Props> = ({
  title, requests, type, onAccept, onReject, onMessage
}) => (
  <div>
    <h3 className="text-md font-semibold mb-2">{title}</h3>
    <div className="space-y-2">
      {requests.length === 0 ? (
        <div className="text-muted-foreground text-sm py-4 text-center">No requests.</div>
      ) : (
        requests.map(item => (
          <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarImage src={item.profiles.avatar_url ?? undefined} alt={item.profiles.full_name} />
                <AvatarFallback>{item.profiles.full_name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{item.profiles.full_name}</span>
            </div>
            <div className="flex gap-1">
              {type === "received" && (
                <>
                  <Button size="icon" variant="ghost" onClick={() => onAccept?.(item.id)}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onReject?.(item.id)}>
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onMessage?.(item.profiles.id)}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </>
              )}
              {type === "sent" && (
                <Button size="icon" variant="ghost" onClick={() => onMessage?.(item.profiles.id)}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

export default FriendRequestsSection;
