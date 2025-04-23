
import React from "react";
import { ContactItem } from "./ContactItems";
import { Users } from "lucide-react";

interface Props {
  acceptedContacts: any[];
  onChatStart: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}

export const AcceptedContacts: React.FC<Props> = ({
  acceptedContacts,
  onChatStart,
  onViewProfile,
}) => (
  acceptedContacts?.length === 0 ? (
    <div className="text-center py-8 text-muted-foreground">
      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
      <p>No friends yet</p>
      <p className="text-sm mt-1">Start connecting with people using their User ID!</p>
    </div>
  ) : (
    <div className="space-y-1">
      {acceptedContacts.map((contact) => (
        <ContactItem
          key={contact.id}
          contact={contact}
          type="contact"
          onChatStart={onChatStart}
          onViewProfile={onViewProfile}
        />
      ))}
    </div>
  )
);
