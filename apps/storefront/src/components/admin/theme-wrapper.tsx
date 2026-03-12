"use client";

import { useState, createContext, useContext, ReactNode, useEffect } from "react";

interface ThemeContextType {
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => { },
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeWrapper({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sync from localStorage on mount
    const savedTheme = localStorage.getItem("apex-theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("apex-theme", newTheme);
  };

  // Apply/remove the 'dark' class on the <html> element
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Cleanup: restore dark class if needed or keep it? 
    // Usually admin theme is isolated. 
  }, [theme, mounted]);

  // Prevent flash by not rendering until mounted if needed, 
  // but here we just render children and let the effect sync.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

