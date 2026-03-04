"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { KeyboardShortcutsHelp } from "@/hooks/useKeyboardShortcuts";
import { 
  Settings, 
  Keyboard, 
  Bell, 
  Eye,
  RefreshCw,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "next-themes";

interface Preferences {
  notifications: boolean;
  soundEffects: boolean;
  autoRefresh: boolean;
  compactMode: boolean;
  showKeyboardShortcuts: boolean;
}

const defaultPreferences: Preferences = {
  notifications: true,
  soundEffects: false,
  autoRefresh: true,
  compactMode: false,
  showKeyboardShortcuts: true,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("mission-control-preferences");
    if (stored) {
      try {
        setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
      } catch (e) {
        console.error("Failed to parse preferences", e);
      }
    }
  }, []);

  const updatePreference = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    localStorage.setItem("mission-control-preferences", JSON.stringify(newPreferences));
  };

  return { preferences, updatePreference, mounted };
}

export function PreferencesPanel() {
  const { preferences, updatePreference, mounted } = usePreferences();
  const { theme, setTheme } = useTheme();

  if (!mounted) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Preferences
        </CardTitle>
        <CardDescription>
          Customize your Mission Control experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Appearance
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("light")}
              className="w-full"
            >
              <Sun className="h-4 w-4 mr-2" />
              Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("dark")}
              className="w-full"
            >
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("system")}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Auto
            </Button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Bell className="h-4 w-4" />
            Notifications
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="cursor-pointer">
                Enable notifications
              </Label>
              <Switch
                id="notifications"
                checked={preferences.notifications}
                onCheckedChange={(checked) => updatePreference("notifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-effects" className="cursor-pointer">
                Sound effects
              </Label>
              <Switch
                id="sound-effects"
                checked={preferences.soundEffects}
                onCheckedChange={(checked) => updatePreference("soundEffects", checked)}
              />
            </div>
          </div>
        </div>

        {/* Display Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Eye className="h-4 w-4" />
            Display
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-refresh" className="cursor-pointer flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Auto-refresh data
              </Label>
              <Switch
                id="auto-refresh"
                checked={preferences.autoRefresh}
                onCheckedChange={(checked) => updatePreference("autoRefresh", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="compact-mode" className="cursor-pointer">
                Compact mode
              </Label>
              <Switch
                id="compact-mode"
                checked={preferences.compactMode}
                onCheckedChange={(checked) => updatePreference("compactMode", checked)}
              />
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Keyboard className="h-4 w-4" />
            Keyboard Shortcuts
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-shortcuts" className="cursor-pointer">
              Show shortcut hints
            </Label>
            <Switch
              id="show-shortcuts"
              checked={preferences.showKeyboardShortcuts}
              onCheckedChange={(checked) => updatePreference("showKeyboardShortcuts", checked)}
            />
          </div>
          {preferences.showKeyboardShortcuts && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <KeyboardShortcutsHelp />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
