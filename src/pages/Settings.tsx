
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Bell, BellOff, CheckCircle, Users, LogOut, ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const settingLabelStyles = "flex items-center gap-2 text-base";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    darkMode: theme === "dark",
    messageNotifications: true,
    statusNotifications: true,
    readReceipts: true,
    onlineStatus: true,
  });

  // Load user settings from Supabase
  useEffect(() => {
    if (!user) return;
    async function fetchSettings() {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_settings")
        .select("message_notifications,status_notifications,read_receipts,theme,online_status")
        .eq("user_id", user.id)
        .single();
      if (error) {
        toast.error("Error loading settings");
        setLoading(false);
        return;
      }
      setSettings({
        darkMode: data.theme === "dark",
        messageNotifications: data.message_notifications,
        statusNotifications: data.status_notifications,
        readReceipts: data.read_receipts,
        onlineStatus: data.online_status,
      });
      setLoading(false);
    }
    fetchSettings();
  }, [user]);

  const updateUserSettings = async (updates: Partial<any>) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_settings")
      .update(updates)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to update settings");
      return false;
    }
    toast.success("Settings updated!");
    return true;
  };

  const handleToggle = (key: keyof typeof settings) => async (checked: boolean) => {
    let updates: Partial<any> = {};
    if (key === "darkMode") {
      setTheme(checked ? "dark" : "light");
      updates.theme = checked ? "dark" : "light";
    } else if (key === "messageNotifications") {
      updates.message_notifications = checked;
    } else if (key === "statusNotifications") {
      updates.status_notifications = checked;
    } else if (key === "readReceipts") {
      updates.read_receipts = checked;
    } else if (key === "onlineStatus") {
      updates.online_status = checked;
    }
    setSettings((prev) => ({ ...prev, [key]: checked }));
    await updateUserSettings(updates);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-webchat-bg dark:bg-webchat-dark">
        <span className="text-lg text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center bg-webchat-bg dark:bg-webchat-dark">
      {/* Top bar */}
      <div className="w-full flex items-center px-4 py-3 bg-webchat-primary dark:bg-webchat-dark shadow">
        <Button
          className="mr-2"
          size="icon"
          variant="ghost"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-xl font-semibold text-white dark:text-white flex-grow text-center">Settings</h1>
      </div>
      <div className="flex-1 w-full max-w-md px-2 sm:px-0 py-6 m-auto space-y-6">
        <div className="rounded-2xl bg-white dark:bg-[#1A1F2C] p-6 shadow-lg">
          <div className="flex justify-between items-center my-3">
            <span className={settingLabelStyles}>
              <Sun className="inline-block h-5 w-5 text-yellow-500 dark:hidden" />
              <Moon className="inline-block h-5 w-5 text-gray-200 hidden dark:block" />
              Dark Mode
            </span>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={handleToggle("darkMode")}
              aria-label="Toggle dark mode"
            />
          </div>
          <div className="flex justify-between items-center my-3">
            <span className={settingLabelStyles}>
              {settings.messageNotifications ? (
                <Bell className="h-5 w-5 text-green-500" />
              ) : (
                <BellOff className="h-5 w-5 text-red-400" />
              )}
              Message Notifications
            </span>
            <Switch
              checked={settings.messageNotifications}
              onCheckedChange={handleToggle("messageNotifications")}
              aria-label="Toggle message notifications"
            />
          </div>
          <div className="flex justify-between items-center my-3">
            <span className={settingLabelStyles}>
              <CheckCircle className={`h-5 w-5 ${settings.statusNotifications ? "text-green-500" : "text-red-400"}`} />
              Status Notifications
            </span>
            <Switch
              checked={settings.statusNotifications}
              onCheckedChange={handleToggle("statusNotifications")}
              aria-label="Toggle status notifications"
            />
          </div>
          <div className="flex justify-between items-center my-3">
            <span className={settingLabelStyles}>
              <CheckCircle className={`h-5 w-5 ${settings.readReceipts ? "text-green-500" : "text-red-400"}`} />
              Read Receipts
            </span>
            <Switch
              checked={settings.readReceipts}
              onCheckedChange={handleToggle("readReceipts")}
              aria-label="Toggle read receipts"
            />
          </div>
          <div className="flex justify-between items-center my-3">
            <span className={settingLabelStyles}>
              <Users className="h-5 w-5" />
              Online Status
            </span>
            <Switch
              checked={settings.onlineStatus}
              onCheckedChange={handleToggle("onlineStatus")}
              aria-label="Toggle online status"
            />
          </div>
        </div>
        <div className="pt-4 text-center text-xs text-muted-foreground opacity-80">
          WispaChat &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
