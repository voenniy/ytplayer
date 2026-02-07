import { render, type RenderOptions } from "@testing-library/react";
import { useState, useMemo, useCallback, type ReactElement, type ReactNode } from "react";
import { I18nContext, createTranslate } from "@/i18n";
import type { Locale } from "@/i18n";

function TestI18nProvider({ children, locale = "ru" }: { children: ReactNode; locale?: Locale }) {
  const [loc, setLoc] = useState<Locale>(locale);
  const setLocale = useCallback((l: Locale) => setLoc(l), []);
  const t = useMemo(() => createTranslate(loc), [loc]);
  const value = useMemo(() => ({ locale: loc, setLocale, t }), [loc, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function Providers({ children }: { children: ReactNode }) {
  return <TestI18nProvider>{children}</TestI18nProvider>;
}

export function renderWithI18n(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: Providers, ...options });
}
