
import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn("flex h-screen w-full bg-webchat-bg", className)}>
      {children}
    </div>
  );
};

export default AppLayout;
