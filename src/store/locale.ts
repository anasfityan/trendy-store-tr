import { create } from "zustand";

export type Locale = "ar" | "en";

const STORAGE_KEY = "trendy-locale";

function readSavedLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "en" ? "en" : "ar";
}

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>()((set) => ({
  locale: readSavedLocale(),
  setLocale: (locale) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, locale);
    }
    set({ locale });
  },
}));
