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

    // Always check for friendship first, insert if needed.
    const { data: contactExists } = await supabase
      .from("contacts")
      .select("status")
      .or(`and(user_id.eq.${user.id},contact_id.eq.${contactId}),and(user_id.eq.${contactId},contact_id.eq.${user.id})`)
      .maybeSingle();

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
        return;
      }
      toast.success("Friend request sent! Chat will be available once accepted.");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      return;
    }

    if (contactExists.status !== "accepted") {
      toast.info("Chat will be available once the contact request is accepted");
      return;
    }

    // Find existing chat or create new
    const { data: myChats } = await supabase
      .from("chat_participants")
      .select("chat_id")
      .eq("user_id", user.id);

    let chatId: string | null = null;
    if (myChats && myChats.length > 0) {
      const { data: mutualChats } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", contactId)
        .in("chat_id", myChats.map(m => m.chat_id));
      if (mutualChats && mutualChats.length > 0) {
        chatId = mutualChats[0].chat_id;
      }
    }
    if (!chatId) {
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({})
        .select()
        .single();
      if (chatError) {
        toast.error("Failed to create chat");
        return;
      }
      chatId = newChat.id;
      const { error: participantError } = await supabase
        .from("chat_participants")
        .insert([
          { chat_id: chatId, user_id: user.id },
          { chat_id: chatId, user_id: contactId }
        ]);
      if (participantError) {
        toast.error("Failed to add chat participants");
        return;
      }
    }
    queryClient.invalidateQueries({ queryKey: ["chats"] });
    navigate("/");
    return chatId;
  };

  return startChat;
}
