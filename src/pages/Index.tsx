
import React from "react";
import { Navigate } from "react-router-dom";
import WispaChat from "@/components/layout/WispaChat";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";

const Index = () => {
  const { user, loading } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(false);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-webchat-primary animate-pulse text-xl">Loading...</div>
    </div>
  );
  
  if (!user) return <Navigate to="/auth" replace />;

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleBackClick = () => {
    if (isMobile) {
      setShowChat(false);
    }
  };

  return (
    <WispaChat>
      {isMobile ? (
        <>
          {showChat && selectedChatId ? (
            <ChatWindow 
              chatId={selectedChatId} 
              className="h-full" 
              onBackClick={handleBackClick}
            />
          ) : (
            <ChatList onChatSelect={handleChatSelect} />
          )}
        </>
      ) : (
        <div className="flex h-full">
          <div className="w-1/3 border-r">
            <ChatList onChatSelect={handleChatSelect} />
          </div>
          <div className="flex-1">
            <ChatWindow 
              chatId={selectedChatId} 
              className="h-full"
            />
          </div>
        </div>
      )}
    </WispaChat>
  );
};

export default Index;
