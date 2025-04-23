
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

      if (!existingChat || existingChat.length === 0) {
        const { data: newChat, error: chatError } = await supabase
          .from("chats")
          .insert({})
          .select()
          .single();
        if (chatError) throw chatError;
        chatId = newChat.id;

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

      queryClient.invalidateQueries({ queryKey: ["chats"] });
      navigate("/");
      return chatId;
    } catch (error: any) {
      toast.error("Failed to start chat: " + error.message);
    }
  };

  return startChat;
}
