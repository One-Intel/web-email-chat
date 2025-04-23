
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContacts } from "@/hooks/useContacts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ChatWithDetails = Database['public']['Tables']['chats']['Row'] & {
  participants: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  }[];
  latest_message?: {
    content: string | null;
    created_at: string | null;
    sender_id: string;
  };
};

export const ChatList = ({ onChatSelect }: { onChatSelect: (chatId: string) => void }) => {
  const { user } = useAuth();
  const { acceptedContacts } = useContacts();
  
  const { data: chats, isLoading } = useQuery<ChatWithDetails[]>({
    queryKey: ["chats"],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      // First get the chat IDs the user is part of
      const { data: chatParticipants, error: participantsError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id);

      if (participantsError) throw participantsError;
      if (!chatParticipants || chatParticipants.length === 0) {
        return [];
      }
      
      const chatIds = chatParticipants.map(cp => cp.chat_id);

      // Get all chats with these IDs
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select("id, created_at")
        .in("id", chatIds);
      
      if (chatsError) throw chatsError;
      if (!chatsData) return [];
      
      // For each chat, get the participants
      const enhancedChats: ChatWithDetails[] = [];
      
      for (const chat of chatsData) {
        // Get all participants for this chat
        const { data: participantsData, error: participantsQueryError } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("chat_id", chat.id);
          
        if (participantsQueryError) throw participantsQueryError;
        if (!participantsData) continue;
        
        // Get profile data for each participant (excluding the current user)
        const otherParticipantIds = participantsData
          .filter(p => p.user_id !== user.id)
          .map(p => p.user_id);
          
        if (otherParticipantIds.length === 0) continue;
        
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", otherParticipantIds);
          
        if (profilesError) throw profilesError;
        if (!profilesData) continue;
        
        // Get latest message for this chat
        const { data: latestMessage, error: messageError } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("chat_id", chat.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
          
        enhancedChats.push({
          ...chat,
          participants: profilesData,
          latest_message: messageError ? undefined : latestMessage
        });
      }
      
      // Sort chats by latest message date
      return enhancedChats.sort((a, b) => {
        const dateA = a.latest_message?.created_at ? new Date(a.latest_message.created_at).getTime() : 0;
        const dateB = b.latest_message?.created_at ? new Date(b.latest_message.created_at).getTime() : 0;
        return dateB - dateA;
      });
    },
    enabled: !!user,
  });

  const startNewChat = async (contactId: string) => {
    try {
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user?.id)
        .filter('chat_id', 'in', (qb) => {
          qb.select('chat_id')
            .from('chat_participants')
            .eq('user_id', contactId);
        });
      
      if (existingChat && existingChat.length > 0) {
        // Chat already exists, select it
        onChatSelect(existingChat[0].chat_id);
        return;
      }
      
      // Create new chat
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({})
        .select()
        .single();
        
      if (chatError) throw chatError;
      
      const chatId = newChat.id;
      
      // Add both users as participants
      const { error: participantError } = await supabase
        .from("chat_participants")
        .insert([
          { chat_id: chatId, user_id: user?.id },
          { chat_id: chatId, user_id: contactId }
        ]);
        
      if (participantError) throw participantError;
      
      // Select the new chat
      onChatSelect(chatId);
    } catch (error: any) {
      console.error("Failed to start chat:", error);
    }
  };

  if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading chats...</div>;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-semibold">Chats</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Chat</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-72">
              {acceptedContacts?.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">
                  <p>Add friends to start chatting</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {acceptedContacts?.map((contact) => (
                    <div
                      key={contact.profiles?.id}
                      className="flex items-center p-2 hover:bg-accent rounded-md cursor-pointer"
                      onClick={() => {
                        if (contact.profiles?.id) {
                          startNewChat(contact.profiles.id);
                        }
                      }}
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={contact.profiles?.avatar_url ?? undefined} />
                        <AvatarFallback>
                          {contact.profiles?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{contact.profiles?.full_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className={cn("space-y-1", !chats || chats.length === 0 ? "hidden" : "")}>
        {chats?.map((chat) => {
          const participant = chat.participants?.[0];
          const lastMessageTime = chat.latest_message?.created_at 
            ? new Date(chat.latest_message.created_at)
            : null;
            
          // Format time as HH:MM or DD/MM if not today
          const formattedTime = lastMessageTime 
            ? lastMessageTime.toDateString() === new Date().toDateString()
              ? lastMessageTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
              : lastMessageTime.toLocaleDateString([], {day: '2-digit', month: '2-digit'})
            : '';
          
          return (
            <div
              key={chat.id}
              className="flex items-center space-x-3 p-3 hover:bg-accent rounded-md cursor-pointer"
              onClick={() => onChatSelect(chat.id)}
            >
              <Avatar>
                <AvatarImage 
                  src={participant?.avatar_url || undefined} 
                  alt={participant?.full_name || "Unknown"}
                />
                <AvatarFallback>
                  {participant?.full_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-medium truncate">
                    {participant?.full_name || "Unknown"}
                  </p>
                  {formattedTime && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formattedTime}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.latest_message?.content || "No messages yet"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {(!chats || chats.length === 0) && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No chats yet</p>
          <p className="text-sm mt-1">Start a conversation with a friend!</p>
        </div>
      )}
    </div>
  );
};
