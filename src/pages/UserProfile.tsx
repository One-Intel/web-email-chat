
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { useChats } from "@/hooks/useChats";

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    acceptedContacts,
    sentRequests,
    receivedRequests,
    acceptContactRequest,
    rejectContactRequest,
    isLoading: contactsLoading
  } = useContacts();
  const { createChat } = useChats();

  // Find the profile from contacts (or fallback to user)
  const isMyProfile = user?.id === id;
  const thisProfile = React.useMemo(() => {
    if (!id) return null;
    if (isMyProfile && user)
      return { id: user.id, full_name: user.user_metadata?.full_name, avatar_url: user.user_metadata?.avatar_url };
    
    // Look for the user in contacts or requests
    const allContacts = [
      ...(acceptedContacts ?? []), 
      ...(sentRequests ?? []), 
      ...(receivedRequests ?? [])
    ];
    
    const contact = allContacts.find(c => c.profiles?.id === id || c.contact_id === id);
    return contact?.profiles ?? null;
  }, [acceptedContacts, sentRequests, receivedRequests, user, id, isMyProfile]);

  // Filter requests that involve this user
  const relevantSentRequests = React.useMemo(() => {
    return (sentRequests || []).filter(r => r.contact_id === id);
  }, [sentRequests, id]);
  
  const relevantReceivedRequests = React.useMemo(() => {
    return (receivedRequests || []).filter(r => r.profiles?.id === id);
  }, [receivedRequests, id]);

  // Functions for requests
  const handleAccept = (requestId: string) => {
    acceptContactRequest.mutate(requestId);
  };
  
  const handleReject = (requestId: string) => {
    rejectContactRequest.mutate(requestId);
  };
  
  const handleStartChat = async () => {
    if (!id) return;
    try {
      const chatId = await createChat.mutateAsync(id);
      if (chatId) {
        navigate("/");
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  if (contactsLoading) {
    return (
      <div className="max-w-xl mx-auto pt-6 px-3">
        <p className="text-center py-8">Loading profile information...</p>
      </div>
    );
  }

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
        
        {/* Chat button */}
        {!isMyProfile && (
          <Button 
            className="mt-4"
            onClick={handleStartChat}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        )}
        
        {/* Friend request section */}
        <div className="w-full mt-8">
          {/* Received Requests */}
          {relevantReceivedRequests.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Friend Request Received</h2>
              {relevantReceivedRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span>This user wants to connect with you</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleAccept(request.id)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(request.id)}>
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Sent Requests */}
          {relevantSentRequests.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Friend Request Sent</h2>
              {relevantSentRequests.map(request => (
                <div key={request.id} className="p-3 bg-muted rounded-md">
                  <span>You sent a friend request to this user</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserProfilePage;
