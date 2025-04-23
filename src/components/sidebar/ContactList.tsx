
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useContacts } from "@/hooks/useContacts";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { FriendSearch } from "./FriendSearch";
import { useNavigate } from "react-router-dom";
import { useStartChat } from "@/hooks/useStartChat";
import { useFriendSearch } from "@/hooks/useFriendSearch";
import { PendingRequests } from "./PendingRequests";
import { AcceptedContacts } from "./AcceptedContacts";

export const ContactList = () => {
  const { 
    acceptedContacts, 
    sentRequests, 
    receivedRequests, 
    isLoading, 
    addContact, 
    acceptContactRequest, 
    rejectContactRequest 
  } = useContacts();

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Custom startChat hook
  const startChat = useStartChat();

  // Custom friend search
  const { 
    onFindFriends, 
    friendSearchLoading, 
    friendSearchResult, 
    friendSearchError, 
    setFriendSearchResult,
    clearSearchResult
  } = useFriendSearch();

  const handleAddFriend = async () => {
    if (!friendSearchResult) return;
    try {
      await addContact.mutateAsync(friendSearchResult.id);
      clearSearchResult();
    } catch (err: any) {
      // Toast covered in useContacts
    }
  };

  const handleStartChatFromSearch = async (userId: string) => {
    await startChat(userId);
    clearSearchResult();
  };

  const viewUserProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const pendingCount = receivedRequests?.length || 0;

  if (isLoading) return <div className="p-4 text-center">Loading contacts...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">Friend Requests</h2>
        <Tabs defaultValue={pendingCount > 0 ? "requests" : "contacts"}>
          <TabsList className="w-full flex">
            <TabsTrigger value="contacts" className="flex-1">
              <span className="inline-flex items-center">
                <span className="mr-2"><i className="lucide lucide-users h-4 w-4" /></span>
                Friends
              </span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1">
              <span className="inline-flex items-center">
                <span className="mr-2"><i className="lucide lucide-user-plus h-4 w-4" /></span>
                Invites
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>
                )}
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="requests" className="mt-2">
            <PendingRequests
              receivedRequests={receivedRequests || []}
              sentRequests={sentRequests || []}
              acceptContact={(id) => acceptContactRequest.mutate(id)}
              rejectContact={(id) => rejectContactRequest.mutate(id)}
              onChatStart={startChat}
              onViewProfile={viewUserProfile}
            />
          </TabsContent>
          <TabsContent value="contacts" className="mt-2 space-y-2">
            <AcceptedContacts
              acceptedContacts={acceptedContacts || []}
              onChatStart={startChat}
              onViewProfile={viewUserProfile}
            />
          </TabsContent>
        </Tabs>
      </div>
      <FriendSearch
        onSearch={onFindFriends}
        searchResult={friendSearchResult}
        searchError={friendSearchError}
        searchLoading={friendSearchLoading}
        onAddFriend={handleAddFriend}
        onStartChat={handleStartChatFromSearch}
      />
    </div>
  );
};
