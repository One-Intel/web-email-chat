
import React, { useState } from "react";
import { useContacts } from "@/hooks/useContacts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Check, X, UserPlus, Clock, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

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
  
  const { register, handleSubmit, reset } = useForm<{ userId: string }>();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const onSubmit = handleSubmit(async (data) => {
    await addContact.mutateAsync(data.userId);
    setIsOpen(false);
    reset();
  });

  const pendingCount = (receivedRequests?.length || 0);

  if (isLoading) return <div>Loading contacts...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Contacts</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Enter the user ID of the contact you want to add
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-gray-500" />
                <Input
                  {...register("userId", { required: true })}
                  placeholder="Enter user ID"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the user ID of the person you want to connect with. You can find this in their profile.
              </p>
              <Button type="submit" className="w-full">
                Send Request
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="contacts">
        <TabsList className="w-full">
          <TabsTrigger value="contacts" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1">
            <UserPlus className="h-4 w-4 mr-2" />
            Requests
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="contacts" className="mt-2 space-y-2">
          {acceptedContacts?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No contacts yet</p>
              <p className="text-sm mt-1">Start connecting with people!</p>
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
                <p className="text-sm text-gray-500 truncate">
                  {contact.profiles?.status_message || "Available"}
                </p>
              </div>
            </div>
          ))}
        </TabsContent>
        
        <TabsContent value="requests" className="mt-2">
          {receivedRequests && receivedRequests.length > 0 && (
            <>
              <h3 className="text-sm font-semibold flex items-center mb-2">
                <UserPlus className="h-4 w-4 mr-2" />
                Received Requests
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
            Sent Requests
          </h3>
          
          {sentRequests?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No pending requests</p>
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
      </Tabs>
    </div>
  );
};
