
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import FriendRequestsSection from "@/components/profile/FriendRequestsSection";

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    acceptedContacts,
    sentRequests,
    receivedRequests,
    acceptContactRequest,
    rejectContactRequest
  } = useContacts();

  // Find the profile from contacts (or fallback to user)
  const isMyProfile = user?.id === id;
  const thisProfile = React.useMemo(() => {
    if (!id) return null;
    if (isMyProfile && user)
      return { id: user.id, full_name: user.user_metadata?.full_name, avatar_url: user.user_metadata?.avatar_url };
    const curr = [...(acceptedContacts ?? []), ...(sentRequests ?? []), ...(receivedRequests ?? [])]
      .find(c => c.profiles?.id === id);
    return curr?.profiles ?? null;
  }, [acceptedContacts, sentRequests, receivedRequests, user, id, isMyProfile]);

  // Functions for requests
  const handleAccept = (requestId: string) => acceptContactRequest.mutate(requestId);
  const handleReject = (requestId: string) => rejectContactRequest.mutate(requestId);
  const handleMessage = (recipientId: string) => {
    // You could navigate or trigger chat here
    navigate("/?startChatWith=" + recipientId);
  };

  return (
    <div className="max-w-xl mx-auto pt-6 px-3">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>
      <Card className="p-8 flex flex-col items-center">
        <Avatar className="h-24 w-24 mb-3">
          <AvatarImage src={thisProfile?.avatar_url ?? undefined} />
          <AvatarFallback>{thisProfile?.full_name?.[0]?.toUpperCase?.() || "U"}</AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold mb-2">{thisProfile?.full_name || "Unknown User"}</h1>
        <div className="flex flex-col w-full gap-4 mt-6">
          <FriendRequestsSection
            title="Friend Requests Received"
            requests={(receivedRequests || []).filter(r => r.profiles?.id === id)}
            type="received"
            onAccept={handleAccept}
            onReject={handleReject}
            onMessage={handleMessage}
          />
          <FriendRequestsSection
            title="Friend Requests Sent"
            requests={(sentRequests || []).filter(r => r.profiles?.id === id)}
            type="sent"
            onMessage={handleMessage}
          />
        </div>
        {/* We don't allow profile editing here */}
      </Card>
    </div>
  );
};
export default UserProfilePage;
