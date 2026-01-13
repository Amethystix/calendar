import React, { useMemo } from 'react';
import { LocaleContext } from './LocaleContext';
import { t as translate } from './translator';
import { getWeekDaysLabels, getMonthLabels } from './intl';
import type { LocaleCode, LocaleMessages, TranslationKey, Locale } from './types';

export interface LocaleProviderProps {
  locale?: LocaleCode | Locale;
  messages?: LocaleMessages;
  children?: React.ReactNode;
}

export const LocaleProvider: React.FC<LocaleProviderProps> = ({
  locale = 'en-US',
  messages,
  children,
}) => {
  const resolvedLocale = useMemo(() => {
    if (typeof locale === 'string') {
      return { code: locale, messages: undefined };
    }
    return locale;
  }, [locale]);

  const value = useMemo(() => {
    const currentCode = resolvedLocale.code;

    return {
      locale: currentCode,
      t: (key: TranslationKey, vars?: Record<string, string>) => {
        // Resolve text: 1. Custom messages -> 2. Locale object messages -> 3. Global fallback
        let text = messages?.[key] ?? resolvedLocale.messages?.[key] ?? translate(key, currentCode);

        // 4. Replace variables if any
        if (vars) {
          Object.entries(vars).forEach(([k, v]) => {
            text = text.replace(new RegExp(`{${k}}`, 'g'), v);
          });
        }

        return text;
      },
      getWeekDaysLabels,
      getMonthLabels,
      isDefault: false,
    };
  }, [resolvedLocale, messages]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
};
