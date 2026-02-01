import React from 'react';
import { useLocale } from '@/locale';

interface YearDayCellProps {
  date: Date;
  isToday: boolean;
  locale: string;
  onSelectDate: (date: Date) => void;
  moreCount?: number;
}

export const YearDayCell: React.FC<YearDayCellProps> = React.memo(({
  date,
  isToday,
  locale,
  onSelectDate,
  moreCount = 0,
}) => {
  const { t } = useLocale();
  const day = date.getDate();
  const isFirstDay = day === 1;
  const monthLabel = date.toLocaleDateString(locale, { month: 'short' }).toUpperCase();
  const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return (
    <div
      className={`
        relative flex flex-col border border-gray-100 dark:border-gray-800
        ${isFirstDay ? 'border-l-2 border-l-primary dark:border-l-primary' : ''}
        cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800
        overflow-hidden bg-white dark:bg-gray-900
      `}
      style={{ aspectRatio: '1/1' }}
      onClick={() => onSelectDate(date)}
      data-date={dateString}
    >
      <div className="flex items-center px-1 py-1 shrink-0 h-6">
        {isFirstDay && (
          <span className="text-[9px] font-bold text-primary-foreground bg-primary px-1 py-0.5 rounded-sm leading-none">
            {monthLabel}
          </span>
        )}
        <span
          className={`text-[10px] font-medium ml-auto ${isToday
            ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center'
            : 'text-gray-700 dark:text-gray-300'
            }`}
        >
          {day}
        </span>
      </div>

      {moreCount > 0 && (
        <div className="absolute bottom-0.5 left-1 pointer-events-none">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            +{moreCount} {t('more')}
          </span>
        </div>
      )}
    </div>
  );
});

YearDayCell.displayName = 'YearDayCell';
