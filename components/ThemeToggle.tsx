"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "auto";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("auto");

  useEffect(() => {
    const saved = (localStorage.getItem("baloot-theme") as Theme) || "auto";
    setTheme(saved);
    apply(saved);
  }, []);

  function apply(next: Theme) {
    const dark = next === "dark" || (next === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }

  function cycle() {
    const next: Theme = theme === "auto" ? "light" : theme === "light" ? "dark" : "auto";
    setTheme(next);
    localStorage.setItem("baloot-theme", next);
    apply(next);
  }

  return (
    <button className="iconButton" onClick={cycle} aria-label="تغيير المظهر" title="تغيير المظهر">
      {theme === "light" ? <Sun size={20} /> : theme === "dark" ? <Moon size={20} /> : <Monitor size={20} />}
    </button>
  );
}
