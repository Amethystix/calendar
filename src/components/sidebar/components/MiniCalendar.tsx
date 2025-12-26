import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generateUniKey, weekDays } from '../../../utils/helpers';
import {
  miniCalendarDay,
  miniCalendarDayHeader,
  miniCalendarGrid,
  miniCalendarCurrentMonth,
  miniCalendarOtherMonth,
  miniCalendarToday,
  miniCalendarSelected,
} from '../../../styles/classNames';

interface MiniCalendarProps {
  visibleMonth: Date;
  currentDate: Date;
  onMonthChange: (offset: number) => void;
  onDateSelect: (date: Date) => void;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  visibleMonth,
  currentDate,
  onMonthChange,
  onDateSelect,
}) => {
  const todayKey = useMemo(() => new Date().toDateString(), []);
  const currentDateKey = currentDate.toDateString();

  const weekdayLabels = useMemo(() => weekDays.map(day => day.charAt(0)), []);

  const monthLabel = useMemo(
    () =>
      visibleMonth.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [visibleMonth]
  );

  const miniCalendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday as first day
    const totalCells = 42;
    const days: Array<{
      date: number;
      fullDate: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    for (let cell = 0; cell < totalCells; cell++) {
      const cellDate = new Date(year, month, cell - startOffset + 1);
      const cellDateString = cellDate.toDateString();
      days.push({
        date: cellDate.getDate(),
        fullDate: cellDate,
        isCurrentMonth: cellDate.getMonth() === month,
        isToday: cellDateString === todayKey,
        isSelected: cellDateString === currentDateKey,
      });
    }

    return days;
  }, [visibleMonth, currentDateKey, todayKey]);

  return (
    <div className="border-t border-gray-200 px-3 py-3 dark:border-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
          onClick={() => onMonthChange(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {monthLabel}
        </span>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
          onClick={() => onMonthChange(1)}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className={miniCalendarGrid}>
        {weekdayLabels.map(label => (
          <div key={generateUniKey()} className={`${miniCalendarDayHeader} text-gray-500 dark:text-gray-400`}>
            {label}
          </div>
        ))}
        {miniCalendarDays.map(day => (
          <button
            type="button"
            key={generateUniKey()}
            className={`
              ${miniCalendarDay}
              ${day.isCurrentMonth ? miniCalendarCurrentMonth : miniCalendarOtherMonth}
              ${day.isToday ? miniCalendarToday : ''}
              ${day.isSelected && !day.isToday ? miniCalendarSelected : ''}
            `}
            onClick={() => onDateSelect(day.fullDate)}
          >
            {day.date}
          </button>
        ))}
      </div>
    </div>
  );
};
