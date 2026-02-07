import { createContext, useContext } from "react";
import ru from "./locales/ru";
import en from "./locales/en";
import kk from "./locales/kk";
import type { Locale, TranslationKey, Translations } from "./types";

export type { Locale, TranslationKey };
export { LOCALES } from "./types";
export type { LocaleInfo } from "./types";

const messages: Record<Locale, Translations> = { ru, en, kk };

const STORAGE_KEY = "musicplay-locale";

export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in messages) return saved as Locale;
  } catch {
    // localStorage unavailable (SSR, test env)
  }

  try {
    const browserLang = navigator.language.slice(0, 2);
    if (browserLang in messages) return browserLang as Locale;
  } catch {
    // navigator unavailable
  }

  return "ru";
}

export function saveLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable
  }
}

function pluralize(count: number, locale: Locale): "one" | "few" | "many" {
  if (locale === "en") {
    return count === 1 ? "one" : "many";
  }
  // Казахский не имеет множественных форм как русский
  if (locale === "kk") {
    return count === 1 ? "one" : "many";
  }
  // Русский: 1 трек, 2-4 трека, 5-20 треков, 21 трек...
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "one";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "few";
  return "many";
}

export function createTranslate(locale: Locale) {
  const dict = messages[locale];

  return function t(
    key: TranslationKey,
    params?: Record<string, string | number>
  ): string {
    let baseKey = key as string;
    let value: string | undefined;

    // Плюрализация: если ключ заканчивается на _one/_few/_many,
    // выбираем нужную форму по count
    if (
      params?.count !== undefined &&
      (dict as Record<string, string>)[`${baseKey}_one`]
    ) {
      const form = pluralize(Number(params.count), locale);
      value = (dict as Record<string, string>)[`${baseKey}_${form}`];
    }

    if (!value) {
      value = (dict as Record<string, string>)[baseKey];
    }

    if (!value) return baseKey;

    // Интерполяция: заменяем {{key}} на значение
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        String(params[k] ?? `{{${k}}}`)
      );
    }

    return value;
  };
}

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: ReturnType<typeof createTranslate>;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
