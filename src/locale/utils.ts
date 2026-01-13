import { LOCALES, SupportedLang } from './locales';

/**
 * Normalizes a locale string to a supported language code.
 * e.g., 'en-US' -> 'en', 'zh-CN' -> 'zh'
 */
export function normalizeLocale(locale: string): SupportedLang {
  const lang = locale.split('-')[0].toLowerCase();

  if (lang in LOCALES) {
    return lang as SupportedLang;
  }

  return 'en';
}
