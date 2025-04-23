import React, { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

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

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value);
    document.documentElement.classList.toggle('dark', e.target.value === "dark");
    if (profile?.id) {
      updateProfile.mutate({ theme: e.target.value });
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      <div className="mb-6">
        <label htmlFor="theme" className="block font-medium mb-1">Theme</label>
        <select
          id="theme"
          className="p-2 border rounded w-full"
          value={theme}
          onChange={handleThemeChange}
        >
          {themes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SettingsPage;
