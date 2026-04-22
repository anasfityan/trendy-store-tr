"use client";

import { useEffect } from "react";
import { useLocaleStore } from "@/store/locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);

  // Apply dir/lang to <html> on every locale change (and on first mount).
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return <>{children}</>;
}
