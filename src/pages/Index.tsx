
import React from "react";
import { Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";
import { Profile } from "@/components/sidebar/Profile";
import { Settings } from "@/components/sidebar/Settings";
import { ContactList } from "@/components/sidebar/ContactList";
import { ChatList } from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";

const Index = () => {
  const { user, loading } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex w-full h-full">
        {(showSidebar || !isMobile) && (
          <div className={`${isMobile ? "w-full" : "w-1/3"} max-w-sm border-r bg-background flex flex-col`}>
            <div className="p-4 border-b">
              <Profile />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <ChatList onChatSelect={handleChatSelect} />
              <ContactList />
            </div>
            <div className="p-4 border-t">
              <Settings />
            </div>
          </div>
        )}

        {(!showSidebar || !isMobile) && (
          <div className={`${isMobile ? "w-full" : "flex-1"}`}>
            <ChatWindow
              chatId={selectedChatId}
              className="h-full"
            />
          </div>
        )}

        {isMobile && selectedChatId && !showSidebar && (
          <button
            className="fixed top-3 left-3 z-10 p-2 rounded-full bg-gray-100"
            onClick={() => setShowSidebar(true)}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
