
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useStartChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const startChat = async (contactId: string) => {
    if (!user) {
      toast.error("You must be logged in to start a chat");
      return;
    }

    try {
      // First check if we have an existing friendship
      const { data: contactExists, error: contactError } = await supabase
        .from("contacts")
        .select("status")
        .or(`and(user_id.eq.${user.id},contact_id.eq.${contactId}),and(user_id.eq.${contactId},contact_id.eq.${user.id})`)
        .maybeSingle();

      if (contactError) {
        console.error("Error checking contact status:", contactError);
      }
        
      // If not friends or pending, create a contact request
      if (!contactExists) {
        const { error: addContactError } = await supabase
          .from("contacts")
          .insert({
            user_id: user.id,
            contact_id: contactId,
            status: "pending"
          });
        
        if (addContactError) {
          toast.error("Failed to send friend request");
          console.error("Error sending friend request:", addContactError);
          return;
        }
        
        toast.success("Friend request sent! Chat will be available once accepted.");
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        return;
      }
      
      // Only proceed to chat creation if the contact is accepted
      if (contactExists.status !== "accepted") {
        toast.info("Chat will be available once the contact request is accepted");
        return;
      }

      // Check if we already have a chat with this user
      const { data: existingChat, error: checkError } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id)
        .filter('chat_id', 'in', (qb) => {
          qb.select('chat_id')
            .from('chat_participants')
            .eq('user_id', contactId);
        });

      if (checkError) {
        toast.error("Error checking existing chat");
        console.error("Error checking existing chat:", checkError);
        return;
      }

      let chatId;

      if (!existingChat || existingChat.length === 0) {
        // Create a new chat
        const { data: newChat, error: chatError } = await supabase
          .from("chats")
          .insert({})
          .select()
          .single();
          
        if (chatError) {
          toast.error("Failed to create chat");
          console.error("Error creating chat:", chatError);
          return;
        }
        
        chatId = newChat.id;

        // Add both users as participants
        const { error: participantError } = await supabase
          .from("chat_participants")
          .insert([
            { chat_id: chatId, user_id: user.id },
            { chat_id: chatId, user_id: contactId }
          ]);
          
        if (participantError) {
          toast.error("Failed to add chat participants");
          console.error("Error adding chat participants:", participantError);
          return;
        }
      } else {
        chatId = existingChat[0].chat_id;
      }

      // Invalidate the chats query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      
      // Navigate to the chat
      navigate("/");
      return chatId;
    } catch (error: any) {
      toast.error("Failed to start chat: " + error.message);
      console.error("Error in startChat:", error);
    }
  };

  return startChat;
}
