
import React, { useState } from "react";
import { useContacts } from "@/hooks/useContacts";
import { Plus, Mail, Users, Search, UserPlus, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContactItem } from "./ContactItems";
import { FriendSearch } from "./FriendSearch";
import { useQueryClient } from "@tanstack/react-query";

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
  
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Add user by 6-digit code
  const onFindFriends = async (data: { userCode: string }) => {
    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);
    if (data.userCode.length !== 6 || isNaN(Number(data.userCode))) {
      setSearchLoading(false);
      setSearchError("Please enter a valid 6-digit user ID.");
      return;
    }
    // Search Supabase for this user_code
    const { data: foundUser, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("user_code", Number(data.userCode))
      .maybeSingle();
    setSearchLoading(false);
    if (error) {
      setSearchError("Error searching for user.");
      return;
    }
    if (!foundUser) {
      setSearchError("No user found with that User ID.");
      return;
    }
    if (foundUser.id === user?.id) {
      setSearchError("That's your User ID!");
      return;
    }
    setSearchResult(foundUser);
  };

  const handleAddFriend = async () => {
    if (!searchResult) return;
    try {
      await addContact.mutateAsync(searchResult.id);
      setSearchResult(null);
      toast.success("Friend request sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send friend request.");
    }
  };

  // Create a chat with a user (even if not yet a friend)
  const startChat = async (contactId: string) => {
    try {
      const { data: existingChat, error: checkError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user?.id)
        .filter('chat_id', 'in', (qb) => {
          qb.select('chat_id')
            .from('chat_participants')
            .eq('user_id', contactId);
        });

      if (checkError) throw checkError;
      
      let chatId;
      
      // If no existing chat, create one
      if (!existingChat || existingChat.length === 0) {
        // Create new chat
        const { data: newChat, error: chatError } = await supabase
          .from("chats")
          .insert({})
          .select()
          .single();
          
        if (chatError) throw chatError;
        
        chatId = newChat.id;
        
        // Add both users as participants
        const { error: participantError } = await supabase
          .from("chat_participants")
          .insert([
            { chat_id: chatId, user_id: user?.id },
            { chat_id: chatId, user_id: contactId }
          ]);
          
        if (participantError) throw participantError;
      } else {
        chatId = existingChat[0].chat_id;
      }
      
      // Invalidate chats cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      
      // TODO: Navigate to the chat (will be handled by parent component)
      return chatId;
    } catch (error: any) {
      toast.error("Failed to start chat: " + error.message);
    }
  };

  const pendingCount = (receivedRequests?.length || 0);

  if (isLoading) return <div>Loading contacts...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">Friend Requests</h2>
        <Tabs defaultValue={pendingCount > 0 ? "requests" : "contacts"}>
          <TabsList className="w-full flex">
            <TabsTrigger value="contacts" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1">
              <UserPlus className="h-4 w-4 mr-2" />
              Invites
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Requests */}
          <TabsContent value="requests" className="mt-2">
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
                      onAccept={(id) => acceptContactRequest.mutate(id)}
                      onReject={(id) => rejectContactRequest.mutate(id)}
                      onChatStart={(userId) => startChat(userId)}
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
                    onReject={(id) => rejectContactRequest.mutate(id)}
                    onChatStart={(userId) => startChat(userId)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Friends */}
          <TabsContent value="contacts" className="mt-2 space-y-2">
            {acceptedContacts?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No friends yet</p>
                <p className="text-sm mt-1">Start connecting with people using their User ID!</p>
              </div>
            )}
            <div className="space-y-1">
              {acceptedContacts?.map((contact) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  type="contact"
                  onChatStart={(userId) => startChat(userId)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <FriendSearch
        onSearch={onFindFriends}
        searchResult={searchResult}
        searchError={searchError}
        searchLoading={searchLoading}
        onAddFriend={handleAddFriend}
      />
    </div>
  );
};
