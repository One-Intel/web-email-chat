
import React, { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const SettingsPage = () => {
  const { profile, updateProfile } = useProfile();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (profile?.theme) {
      setTheme(profile.theme);
      document.documentElement.classList.toggle('dark', profile.theme === "dark");
    }
  }, [profile]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === "dark");
    if (profile?.id) {
      updateProfile.mutate({ theme: newTheme });
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      <Card className="p-6">
        <div className="mb-6">
          <Label htmlFor="theme" className="block font-medium mb-2">Theme</Label>
          <Select
            value={theme}
            onValueChange={handleThemeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              {themes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
