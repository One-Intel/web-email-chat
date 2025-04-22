
import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AuthForm from "@/components/auth/AuthForm";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  
  // For demo purposes, let's set isAuthenticated to true
  // In a real app, this would be set after successful login/registration
  React.useEffect(() => {
    // Comment out the next line to see the login screen
    setIsAuthenticated(true);
  }, []);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <AuthForm />
      </div>
    );
  }

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
