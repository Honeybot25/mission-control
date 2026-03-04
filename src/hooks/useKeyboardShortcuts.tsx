"use client";

import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  // Cmd/Ctrl + K - Command palette / search
  useHotkeys("meta+k, ctrl+k", (e) => {
    e.preventDefault();
    // Focus search input if it exists
    const searchInput = document.querySelector('[data-search="true"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  });

  // Cmd/Ctrl + D - Toggle dark mode
  useHotkeys("meta+d, ctrl+d", (e) => {
    e.preventDefault();
    const themeToggle = document.querySelector('[aria-label*="theme" i]') as HTMLButtonElement;
    if (themeToggle) {
      themeToggle.click();
    }
  });

  // Cmd/Ctrl + R - Refresh page
  useHotkeys("meta+r, ctrl+r", (e) => {
    // Let default behavior handle this, but could add custom refresh logic
  });

  // / - Focus search
  useHotkeys("/", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      return;
    }
    e.preventDefault();
    const searchInput = document.querySelector('[data-search="true"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  });

  // g + d - Go to dashboard
  useHotkeys("g+d", (e) => {
    e.preventDefault();
    router.push("/dashboard");
  });

  // g + a - Go to activity
  useHotkeys("g+a", (e) => {
    e.preventDefault();
    router.push("/activity");
  });

  // g + t - Go to tasks
  useHotkeys("g+t", (e) => {
    e.preventDefault();
    router.push("/tasks");
  });

  // Escape - Close modals/drawers
  useHotkeys("escape", () => {
    const closeButtons = document.querySelectorAll('[data-close="true"]');
    closeButtons.forEach((btn) => {
      (btn as HTMLButtonElement).click();
    });
  });
}

export function KeyboardShortcutsHelp() {
  const shortcuts = [
    { key: "Cmd/Ctrl + K", description: "Focus search" },
    { key: "Cmd/Ctrl + D", description: "Toggle dark mode" },
    { key: "/", description: "Focus search" },
    { key: "G + D", description: "Go to Dashboard" },
    { key: "G + A", description: "Go to Activity" },
    { key: "G + T", description: "Go to Tasks" },
    { key: "Esc", description: "Close modals" },
  ];

  return (
    <div className="space-y-2">
      {shortcuts.map((shortcut) => (
        <div key={shortcut.key} className="flex justify-between text-sm">
          <span className="text-slate-400">{shortcut.description}</span>
          <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono text-slate-300">
            {shortcut.key}
          </kbd>
        </div>
      ))}
    </div>
  );
}
