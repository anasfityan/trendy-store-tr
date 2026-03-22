import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeName = "light" | "dark";

interface ThemeStore {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
      toggle: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
    }),
    { name: "trendy-theme" }
  )
);
