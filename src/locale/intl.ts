/**
 * Encapsulates Intl API calls for standard calendar terms.
 */
export function getIntlLabel(
  key: 'today' | 'day' | 'week' | 'month' | 'year',
  locale: string
): string | null {
  try {
    if (key === 'today') {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const parts = rtf.formatToParts(0, 'day');
      return parts.find(p => p.type === 'literal')?.value || null;
    }

    const dn = new Intl.DisplayNames([locale], { type: 'dateTimeField' });
    return dn.of(key) ?? null;
  } catch (e) {
    return null;
  }
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get localized weekday labels (Mon, Tue, etc.)
 */
export const getWeekDaysLabels = (locale: string, format: 'long' | 'short' | 'narrow' = 'short'): string[] => {
  const labels: string[] = [];
  // Use a known Monday to start (2024-01-01 was a Monday)
  const baseDate = new Date(2024, 0, 1);
  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    labels.push(date.toLocaleDateString(locale, { weekday: format }));
  }
  return labels;
};

/**
 * Get localized month labels
 */
export const getMonthLabels = (locale: string, format: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit' = 'long'): string[] => {
  const labels: string[] = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(2024, i, 1);
    labels.push(date.toLocaleDateString(locale, { month: format }));
  }
  return labels;
};
