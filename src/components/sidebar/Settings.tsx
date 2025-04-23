
// We now show settings only on the settings page, not in the sidebar anymore.
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon } from "lucide-react";

export const Settings = () => {
  const navigate = useNavigate();
  return (
    <Button
      className="w-full flex items-center gap-2"
      variant="ghost"
      onClick={() => navigate("/settings")}
    >
      <SettingsIcon className="h-5 w-5" />
      <span>Settings</span>
    </Button>
  );
};
