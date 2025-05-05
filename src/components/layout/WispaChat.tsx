
import React from "react";
import AppLayout from "./AppLayout";

interface WispaChatProps {
  children: React.ReactNode;
}

const WispaChat: React.FC<WispaChatProps> = ({ children }) => {
  return (
    <AppLayout className="bg-background dark:bg-gray-900">
      <div className="app-container">
        {children}
      </div>
    </AppLayout>
  );
};

export default WispaChat;
