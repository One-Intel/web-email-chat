
import React from "react";
import AppLayout from "./AppLayout";

interface WispaChatProps {
  children: React.ReactNode;
}

const WispaChat: React.FC<WispaChatProps> = ({ children }) => {
  return (
    <AppLayout className="bg-webchat-bg dark:bg-gray-900">
      {children}
    </AppLayout>
  );
};

export default WispaChat;
