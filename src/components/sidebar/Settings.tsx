
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, Bell, BellOff, Check, CircleCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Settings = () => {
  const { setTheme, theme } = useTheme();
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    darkMode: theme === 'dark',
    messageNotifications: true,
    statusNotifications: true,
    readReceipts: true,
  });

  const toggleDarkMode = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    setSettings(prev => ({ ...prev, darkMode: checked }));
    updateUserSettings({ theme: newTheme });
  };

  const updateUserSettings = async (updates: Partial<{
    theme: string;
    message_notifications: boolean;
    status_notifications: boolean;
    read_receipts: boolean;
  }>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success("Settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));

    switch (key) {
      case 'messageNotifications':
        updateUserSettings({ message_notifications: newValue });
        break;
      case 'statusNotifications':
        updateUserSettings({ status_notifications: newValue });
        break;
      case 'readReceipts':
        updateUserSettings({ read_receipts: newValue });
        break;
    }
  };

  return (
    <div className="space-y-4 p-4 bg-background rounded-lg">
      <h2 className="text-xl font-bold mb-4">App Settings</h2>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          <span>Dark Mode</span>
        </div>
        <Switch 
          checked={settings.darkMode} 
          onCheckedChange={toggleDarkMode}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {settings.messageNotifications ? 
            <Bell className="h-5 w-5" /> : 
            <BellOff className="h-5 w-5 text-destructive" />
          }
          <span>Message Notifications</span>
        </div>
        <Switch 
          checked={settings.messageNotifications} 
          onCheckedChange={() => toggleSetting('messageNotifications')}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {settings.statusNotifications ? 
            <CircleCheck className="h-5 w-5" /> : 
            <Check className="h-5 w-5 text-destructive" />
          }
          <span>Status Notifications</span>
        </div>
        <Switch 
          checked={settings.statusNotifications} 
          onCheckedChange={() => toggleSetting('statusNotifications')}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {settings.readReceipts ? 
            <Check className="h-5 w-5" /> : 
            <Check className="h-5 w-5 text-destructive" />
          }
          <span>Read Receipts</span>
        </div>
        <Switch 
          checked={settings.readReceipts} 
          onCheckedChange={() => toggleSetting('readReceipts')}
        />
      </div>
    </div>
  );
};
