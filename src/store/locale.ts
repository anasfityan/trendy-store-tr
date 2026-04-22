import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "ar" | "en";

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: "ar",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "trendy-locale" }
  )
);
