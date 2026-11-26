"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] transition-colors cursor-pointer whitespace-nowrap ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={theme === "dark"}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span
        aria-hidden="true"
        className={`w-2 h-2 rounded-full ${isDark ? "bg-[var(--brand)]" : "bg-amber-600"}`}
      />
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
