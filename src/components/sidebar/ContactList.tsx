
import React, { useState } from "react";
import { useContacts } from "@/hooks/useContacts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Check, X, UserPlus, Clock, Users, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

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
  
  const { register, handleSubmit, reset } = useForm<{ userCode: string }>();
  const [isOpen, setIsOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { user } = useAuth();

  // Add user by 6-digit code (new logic)
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
                {receivedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between space-x-3 p-2 hover:bg-accent rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={request.profiles?.avatar_url ?? undefined} />
                        <AvatarFallback>
                          {request.profiles?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {request.profiles?.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Wants to connect with you
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-500"
                        onClick={() => acceptContactRequest.mutate(request.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500"
                        onClick={() => rejectContactRequest.mutate(request.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
              sentRequests?.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between space-x-3 p-2 hover:bg-accent rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={request.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {request.profiles?.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {request.profiles?.full_name || "Unknown"}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-yellow-500" />
                        <p className="text-xs text-gray-500">Pending</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500"
                    onClick={() => rejectContactRequest.mutate(request.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
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
            {acceptedContacts?.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md cursor-pointer"
              >
                <Avatar>
                  <AvatarImage src={contact.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {contact.profiles?.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {contact.profiles?.full_name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {contact.profiles?.status_message || "Available"}
                  </p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <Card className="p-3 space-y-2">
        <div className="flex items-center mb-2">
          <Search className="h-4 w-4 mr-2" />
          <span className="font-medium">
            Find Friends
          </span>
        </div>
        <form
          onSubmit={handleSubmit(onFindFriends)}
          className="flex space-x-2"
        >
          <Input
            {...register("userCode", { required: true, minLength: 6, maxLength: 6, pattern: /^[0-9]+$/ })}
            placeholder="Enter 6-digit User ID"
            maxLength={6}
            minLength={6}
            className="font-mono"
          />
          <Button type="submit" variant="default" disabled={searchLoading}>
            {searchLoading ? "..." : "Search"}
          </Button>
        </form>
        {searchError && (
          <p className="text-xs text-red-500">{searchError}</p>
        )}
        {searchResult && (
          <div className="flex items-center justify-between mt-2 bg-accent/50 p-2 rounded">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={searchResult.avatar_url || undefined} />
                <AvatarFallback>
                  {searchResult.full_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <span>{searchResult.full_name}</span>
            </div>
            <Button
              size="sm"
              onClick={handleAddFriend}
              variant="default"  // Changed from "success" to "default"
            >
              Add Friend
            </Button>
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Enter your friend's User ID to send a friend request.
        </p>
      </Card>
    </div>
  );
};
