
import React from "react";
import { ContactItem } from "./ContactItems";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Clock } from "lucide-react";

interface Props {
  receivedRequests: any[];
  sentRequests: any[];
  acceptContact: (id: string) => void;
  rejectContact: (id: string) => void;
  onChatStart: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}

export const PendingRequests: React.FC<Props> = ({
  receivedRequests,
  sentRequests,
  acceptContact,
  rejectContact,
  onChatStart,
  onViewProfile
}) => (
  <div>
    {receivedRequests && receivedRequests.length > 0 && (
      <>
        <h3 className="text-sm font-semibold flex items-center mb-2">
          <UserPlus className="h-4 w-4 mr-2" />
          Received Invites
        </h3>
        <div className="space-y-1">
          {receivedRequests.map((request) => (
            <ContactItem
              key={request.id}
              contact={request}
              type="received"
              onAccept={acceptContact}
              onReject={rejectContact}
              onChatStart={onChatStart}
              onViewProfile={onViewProfile}
            />
          ))}
        </div>
        <Separator className="my-2" />
      </>
    )}
    <h3 className="text-sm font-semibold flex items-center mb-2">
      <Clock className="h-4 w-4 mr-2" />
      Sent Invites
    </h3>
    {sentRequests?.length === 0 ? (
      <div className="text-center py-4 text-muted-foreground">
        <p className="text-sm">No pending invites</p>
      </div>
    ) : (
      <div className="space-y-1">
        {sentRequests?.map((request) => (
          <ContactItem
            key={request.id}
            contact={request}
            type="sent"
            onReject={rejectContact}
            onChatStart={onChatStart}
            onViewProfile={onViewProfile}
          />
        ))}
      </div>
    )}
  </div>
);
