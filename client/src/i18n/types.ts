import type ru from "./locales/ru";

export type TranslationKey = keyof typeof ru;
export type Translations = Record<TranslationKey, string>;
export type Locale = "ru" | "kk" | "en";

export interface LocaleInfo {
  code: Locale;
  label: string;
  flag: string;
}

export const LOCALES: LocaleInfo[] = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "kk", label: "Қазақша", flag: "🇰🇿" },
  { code: "en", label: "English", flag: "🇬🇧" },
];
