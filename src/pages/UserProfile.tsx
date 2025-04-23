
import React from "react";
import WispaChat from "@/components/layout/WispaChat";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, UserPlus, Check, X, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useContacts } from "@/hooks/useContacts";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addContact, acceptedContacts, sentRequests, receivedRequests } = useContacts();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
  
  const isMyProfile = user?.id === id;
  
  // Check friendship status
  const friendshipStatus = React.useMemo(() => {
    if (!profile || !user) return null;
    
    const isFriend = acceptedContacts?.some(
      contact => contact.profiles?.id === profile.id
    );
    
    const hasSentRequest = sentRequests?.some(
      contact => contact.profiles?.id === profile.id
    );
    
    const hasReceivedRequest = receivedRequests?.some(
      contact => contact.profiles?.id === profile.id
    );
    
    if (isFriend) return "friend";
    if (hasSentRequest) return "sent";
    if (hasReceivedRequest) return "received";
    return "none";
  }, [profile, user, acceptedContacts, sentRequests, receivedRequests]);
  
  const handleStartChat = async () => {
    if (!profile || !user) return;
    
    try {
      // Check if a chat already exists
      const { data: existingChat, error: checkError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id)
        .filter('chat_id', 'in', (qb) => {
          qb.select('chat_id')
            .from('chat_participants')
            .eq('user_id', profile.id);
        });

      if (checkError) throw checkError;
      
      let chatId;
      
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
            { chat_id: chatId, user_id: user.id },
            { chat_id: chatId, user_id: profile.id }
          ]);
          
        if (participantError) throw participantError;
      } else {
        chatId = existingChat[0].chat_id;
      }
      
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      navigate("/"); // Go back to main page where chat window will be updated
      
    } catch (error: any) {
      toast.error("Failed to start chat: " + error.message);
    }
  };
  
  const handleAddFriend = async () => {
    if (!profile) return;
    
    try {
      await addContact.mutateAsync(profile.id);
      toast.success("Friend request sent!");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (error: any) {
      toast.error("Failed to send friend request: " + error.message);
    }
  };
  
  const handleAcceptRequest = async () => {
    if (!profile) return;
    
    try {
      const request = receivedRequests?.find(req => req.profiles?.id === profile.id);
      if (!request) return;
      
      const { error } = await supabase
        .from("contacts")
        .update({ status: "accepted" })
        .eq("id", request.id);
        
      if (error) throw error;
      
      toast.success("Friend request accepted!");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (error: any) {
      toast.error("Failed to accept request: " + error.message);
    }
  };
  
  const handleRejectRequest = async () => {
    if (!profile) return;
    
    try {
      const request = receivedRequests?.find(req => req.profiles?.id === profile.id);
      if (!request) return;
      
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", request.id);
        
      if (error) throw error;
      
      toast.success("Friend request rejected!");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (error: any) {
      toast.error("Failed to reject request: " + error.message);
    }
  };
  
  const handleCancelRequest = async () => {
    if (!profile) return;
    
    try {
      const request = sentRequests?.find(req => req.profiles?.id === profile.id);
      if (!request) return;
      
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", request.id);
        
      if (error) throw error;
      
      toast.success("Friend request canceled!");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (error: any) {
      toast.error("Failed to cancel request: " + error.message);
    }
  };

  return (
    <WispaChat>
      <div className="max-w-3xl mx-auto p-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          ) : profile ? (
            <div>
              {/* Cover photo/header */}
              <div className="h-32 bg-gradient-to-r from-webchat-primary to-blue-600" />
              
              {/* Profile info */}
              <div className="p-6 -mt-12 relative">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name?.[0] || <User />}
                  </AvatarFallback>
                </Avatar>
                
                <div className="mt-4">
                  <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                  
                  {profile.status_message && (
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      {profile.status_message}
                    </p>
                  )}
                  
                  <div className="text-sm text-gray-500 mt-2">
                    <p>
                      User ID: <span className="font-mono">{profile.user_code}</span>
                    </p>
                    
                    {profile.last_seen && (
                      <p>
                        Last seen: {formatDistanceToNow(new Date(profile.last_seen), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  
                  {!isMyProfile && (
                    <div className="mt-6 flex space-x-3">
                      <Button 
                        onClick={handleStartChat}
                        className="flex items-center space-x-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Message</span>
                      </Button>
                      
                      {friendshipStatus === 'none' && (
                        <Button 
                          variant="outline" 
                          onClick={handleAddFriend}
                          className="flex items-center space-x-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Add Friend</span>
                        </Button>
                      )}
                      
                      {friendshipStatus === 'sent' && (
                        <Button 
                          variant="outline" 
                          onClick={handleCancelRequest}
                          className="flex items-center space-x-2"
                        >
                          <Clock className="h-4 w-4" />
                          <span>Request Sent</span>
                        </Button>
                      )}
                      
                      {friendshipStatus === 'received' && (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={handleAcceptRequest}
                            className="flex items-center space-x-2"
                          >
                            <Check className="h-4 w-4" />
                            <span>Accept</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleRejectRequest}
                            className="flex items-center space-x-2 text-red-500 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                            <span>Reject</span>
                          </Button>
                        </div>
                      )}
                      
                      {friendshipStatus === 'friend' && (
                        <Button 
                          variant="outline" 
                          disabled
                          className="flex items-center space-x-2"
                        >
                          <Check className="h-4 w-4" />
                          <span>Friends</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">User not found</p>
              <Button 
                variant="ghost"
                className="mt-4"
                onClick={() => navigate("/")}
              >
                Return Home
              </Button>
            </div>
          )}
        </Card>
      </div>
    </WispaChat>
  );
};

export default UserProfile;
