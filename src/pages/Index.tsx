import React from "react";
import { Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";

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
        {/* Sidebar - shown/hidden on mobile */}
        {(showSidebar || !isMobile) && (
          <div className={`${isMobile ? "w-full" : "w-1/3"} max-w-sm`}>
            <Sidebar onChatSelect={handleChatSelect} />
          </div>
        )}

        {/* Chat window */}
        {(!showSidebar || !isMobile) && (
          <div className={`${isMobile ? "w-full" : "flex-1"}`}>
            <ChatWindow
              chatId={selectedChatId}
              className="h-full"
            />
          </div>
        )}

        {/* Mobile back button - only shown when viewing a chat on mobile */}
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
