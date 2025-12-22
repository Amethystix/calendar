import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { CalendarSidebarRenderProps, CalendarType } from '../../types';
import { ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen, Plus } from 'lucide-react';

import {
  miniCalendarDay,
  miniCalendarDayHeader,
  miniCalendarGrid,
  miniCalendarCurrentMonth,
  miniCalendarOtherMonth,
  miniCalendarToday,
  miniCalendarSelected,
} from '../../styles/classNames';
import { generateUniKey, weekDays } from '../../utils/helpers';

const getCalendarInitials = (calendar: CalendarType): string => {
  if (calendar.icon) {
    return calendar.icon;
  }
  const name = calendar.name || calendar.id;
  return name.charAt(0).toUpperCase();
};

const DefaultCalendarSidebar: React.FC<CalendarSidebarRenderProps> = ({
  app,
  calendars,
  toggleCalendarVisibility,
  isCollapsed,
  setCollapsed,
}) => {
  const currentDate = app.getCurrentDate();
  const visibleMonthDate = app.getVisibleMonth();
  const visibleYear = visibleMonthDate.getFullYear();
  const visibleMonthIndex = visibleMonthDate.getMonth();

  // Rename state
  const [editingCalendarId, setEditingCalendarId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCalendarId, setDraggedCalendarId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'top' | 'bottom' } | null>(null);

  const handleDragStart = useCallback((calendar: CalendarType, e: React.DragEvent) => {
    // Prevent dragging when editing
    if (editingCalendarId) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    setDraggedCalendarId(calendar.id);

    // Store calendar data for drop handling
    const dragData = {
      calendarId: calendar.id,
      calendarName: calendar.name,
      calendarColors: calendar.colors,
      calendarIcon: calendar.icon,
    };
    e.dataTransfer.setData('application/x-dayflow-calendar', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  }, [editingCalendarId]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedCalendarId(null);
    setDropTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedCalendarId === targetId) {
      setDropTarget(null);
      return;
    }

    const targetIndex = calendars.findIndex(c => c.id === targetId);
    const isLast = targetIndex === calendars.length - 1;

    const rect = e.currentTarget.getBoundingClientRect();
    const isTopHalf = e.clientY < rect.top + rect.height / 2;

    if (isLast) {
      setDropTarget({
        id: targetId,
        position: isTopHalf ? 'top' : 'bottom',
      });
    } else {
      setDropTarget({
        id: targetId,
        position: 'top',
      });
    }
  }, [draggedCalendarId, calendars]);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((targetCalendar: CalendarType) => {
    if (!draggedCalendarId || !dropTarget) return;
    if (draggedCalendarId === targetCalendar.id) return;

    const fromIndex = calendars.findIndex(c => c.id === draggedCalendarId);
    let toIndex = calendars.findIndex(c => c.id === targetCalendar.id);

    // Adjust target index based on position
    if (dropTarget.position === 'bottom') {
      toIndex += 1;
    }

    // Adjust for removal of the item
    // If the target index is after the source index, we need to decrement it
    // because the item is removed first, shifting subsequent items up.
    // However, if we are dropping "after" (position bottom), we calculated the index
    // in the original array.
    // Let's use the logic derived earlier:
    // If insertionIndex > fromIndex, finalIndex = insertionIndex - 1
    if (toIndex > fromIndex) {
      toIndex -= 1;
    }

    if (fromIndex !== -1 && toIndex !== -1) {
      app.reorderCalendars(fromIndex, toIndex);
    }
    setDropTarget(null);
  }, [draggedCalendarId, dropTarget, calendars, app]);

  // Rename handlers
  const handleRenameStart = useCallback((calendar: CalendarType) => {
    setEditingCalendarId(calendar.id);
    setEditingName(calendar.name);
  }, []);

  const handleRenameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  }, []);

  const handleRenameSave = useCallback(() => {
    if (editingCalendarId && editingName.trim()) {
      const calendar = calendars.find(c => c.id === editingCalendarId);
      if (calendar && calendar.name !== editingName.trim()) {
        app.updateCalendar(editingCalendarId, { name: editingName.trim() });
      }
    }
    setEditingCalendarId(null);
    setEditingName('');
  }, [editingCalendarId, editingName, calendars, app]);

  const handleRenameCancel = useCallback(() => {
    setEditingCalendarId(null);
    setEditingName('');
  }, []);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSave();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  }, [handleRenameSave, handleRenameCancel]);

  useEffect(() => {
    if (editingCalendarId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCalendarId]);

  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    return new Date(visibleYear, visibleMonthIndex, 1);
  });

  useEffect(() => {
    setVisibleMonth(prev => {
      if (
        prev.getFullYear() === visibleYear &&
        prev.getMonth() === visibleMonthIndex
      ) {
        return prev;
      }
      return new Date(visibleYear, visibleMonthIndex, 1);
    });
  }, [visibleYear, visibleMonthIndex]);

  const todayKey = useMemo(() => new Date().toDateString(), []);
  const currentDateKey = currentDate.toDateString();

  const weekdayLabels = useMemo(() => weekDays.map(day => day.charAt(0)), []);

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

  const monthLabel = useMemo(
    () =>
      visibleMonth.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [visibleMonth]
  );

  const handleMonthChange = useCallback(
    (offset: number) => {
      setVisibleMonth(prev => {
        const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
        app.setVisibleMonth(next);
        return next;
      });
    },
    [app]
  );

  const handleDateSelect = useCallback(
    (date: Date) => {
      const nextDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      app.setCurrentDate(nextDate);
      setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    },
    [app]
  );

  return (
    <div className="flex h-full flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
      <div className="flex items-center px-2 py-2">
        <button
          type="button"
          aria-label={isCollapsed ? 'Expand calendar sidebar' : 'Collapse calendar sidebar'}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-slate-800"
          onClick={() => setCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <PanelRightClose className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <PanelRightOpen className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
        </button>
        {!isCollapsed && (
          <div className='flex flex-1 justify-between items-center'>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Calendars
            </span>
            <button
              className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <Plus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {!isCollapsed ? (
        <>
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            <ul className="space-y-1 relative">
              {calendars.map(calendar => {
                const isVisible = calendar.isVisible !== false;
                const calendarColor = calendar.colors?.lineColor || '#3b82f6';
                const showIcon = Boolean(calendar.icon);
                const isDropTarget = dropTarget?.id === calendar.id;

                return (
                  <li
                    key={calendar.id}
                    className="relative"
                    onDragOver={(e) => handleDragOver(e, calendar.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(calendar)}
                  >
                    {isDropTarget && dropTarget.position === 'top' && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10 pointer-events-none" />
                    )}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(calendar, e)}
                      onDragEnd={handleDragEnd}
                      className={`rounded transition ${draggedCalendarId === calendar.id ? 'opacity-50' : ''
                        }`}
                    >
                      <div
                        className="group flex items-center rounded px-2 py-2 transition hover:bg-gray-100 dark:hover:bg-slate-800"
                        title={calendar.name}
                      >
                        <input
                          type="checkbox"
                          className="calendar-checkbox cursor-pointer shrink-0"
                          style={{
                            '--checkbox-color': calendarColor,
                          } as React.CSSProperties}
                          checked={isVisible}
                          onChange={event =>
                            toggleCalendarVisibility(calendar.id, event.target.checked)
                          }
                        />
                        {showIcon && (
                          <span
                            className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center text-xs font-semibold text-white"
                            aria-hidden="true"
                          >
                            {getCalendarInitials(calendar)}
                          </span>
                        )}
                        {editingCalendarId === calendar.id ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingName}
                            onChange={handleRenameChange}
                            onBlur={handleRenameSave}
                            onKeyDown={handleRenameKeyDown}
                            className="ml-2 flex-1 min-w-0 h-5 rounded bg-white px-0 py-0 text-sm text-gray-900 focus:outline-none dark:bg-slate-700 dark:text-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            className="flex-1 truncate text-sm text-gray-700 group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-white ml-2"
                            onDoubleClick={() => handleRenameStart(calendar)}
                          >
                            {calendar.name || calendar.id}
                          </span>
                        )}
                      </div>
                    </div>
                    {isDropTarget && dropTarget.position === 'bottom' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10 pointer-events-none" />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="border-t border-gray-200 px-3 py-3 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                onClick={() => handleMonthChange(-1)}
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
                onClick={() => handleMonthChange(1)}
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
                  onClick={() => handleDateSelect(day.fullDate)}
                >
                  {day.date}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <ul className="space-y-1 relative">
            {calendars.map(calendar => {
              const isVisible = calendar.isVisible !== false;
              const calendarColor = calendar.colors?.lineColor || '#3b82f6';
              const showIcon = Boolean(calendar.icon);
              const isDropTarget = dropTarget?.id === calendar.id;

              return (
                <li
                  key={calendar.id}
                  className="relative"
                  onDragOver={(e) => handleDragOver(e, calendar.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(calendar)}
                >
                  {isDropTarget && dropTarget.position === 'top' && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10 pointer-events-none" />
                  )}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(calendar, e)}
                    onDragEnd={handleDragEnd}
                    className={`rounded transition ${draggedCalendarId === calendar.id ? 'opacity-50' : ''
                      }`}
                  >
                    <div
                      className="group flex items-center rounded px-2 py-2 transition hover:bg-gray-100 dark:hover:bg-slate-800"
                      title={calendar.name}
                    >
                      <input
                        type="checkbox"
                        className="calendar-checkbox cursor-pointer"
                        style={{
                          '--checkbox-color': calendarColor,
                        } as React.CSSProperties}
                        checked={isVisible}
                        onChange={event =>
                          toggleCalendarVisibility(calendar.id, event.target.checked)
                        }
                      />
                      {/* {showIcon && (
                        <span
                          className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: calendarColor }}
                          aria-hidden="true"
                        >
                          {getCalendarInitials(calendar)}
                        </span>
                      )} */}
                      <span className="flex-1 truncate text-sm text-gray-700 group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-white">
                        {/* {calendar.name || calendar.id} */}
                        &nbsp;
                      </span>
                    </div>
                  </div>
                  {isDropTarget && dropTarget.position === 'bottom' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10 pointer-events-none" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DefaultCalendarSidebar;
