
import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn("min-h-screen w-full bg-gray-100", className)}>
      {children}
    </div>
  );
};

export default AppLayout;
