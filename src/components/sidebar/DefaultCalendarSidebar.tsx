import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CalendarSidebarRenderProps, CalendarType } from '../../types';
import { ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen, Plus, Trash2, ArrowRight } from 'lucide-react';
import ContextMenu, {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuColorPicker,
} from '../common/ContextMenu';
import { getCalendarColorsForHex } from '../../core/calendarRegistry';
import { CreateCalendarDialog } from '../common/CreateCalendarDialog';
import { SketchPicker } from 'react-color';

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

const COLORS = [
  '#ea426b',
  '#f19a38',
  '#f7cf46',
  '#83d754',
  '#51aaf2',
  '#b672d0',
  '#957e5e',
];

const getCalendarInitials = (calendar: CalendarType): string => {
  if (calendar.icon) {
    return calendar.icon;
  }
  const name = calendar.name || calendar.id;
  return name.charAt(0).toUpperCase();
};

const MergeMenuItem = ({
  calendars,
  currentCalendarId,
  onMergeSelect
}: {
  calendars: CalendarType[],
  currentCalendarId: string,
  onMergeSelect: (targetId: string) => void
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setPosition({ x: rect.right, y: rect.top });
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  };

  useEffect(() => {
    const el = submenuRef.current;
    if (el) {
      const stopPropagation = (e: MouseEvent) => e.stopPropagation();
      el.addEventListener('mousedown', stopPropagation);
      return () => {
        el.removeEventListener('mousedown', stopPropagation);
      };
    }
  }, [isHovered]);

  const availableCalendars = calendars.filter(c => c.id !== currentCalendarId);

  if (availableCalendars.length === 0) return null;

  return (
    <>
      <div
        ref={itemRef}
        className="relative flex cursor-default select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-50"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span>Merge</span>
        <ChevronRight className="h-4 w-4" />
      </div>
      {isHovered && createPortal(
        <div
          ref={submenuRef}
          className="fixed z-60 min-w-48 overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md dark:border-slate-800 dark:bg-slate-950 animate-in fade-in-0 zoom-in-95 duration-100"
          style={{ top: position.y, left: position.x }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {availableCalendars.map(calendar => (
            <div
              key={calendar.id}
              className="flex items-center cursor-pointer rounded-sm px-2 py-1.5 text-sm text-slate-900 hover:bg-slate-100 dark:text-slate-50 dark:hover:bg-slate-800"
              onClick={(e) => {
                e.stopPropagation();
                onMergeSelect(calendar.id);
              }}
            >
              <div
                className="mr-2 h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: calendar.colors.lineColor }}
              />
              <span className="truncate">
                {calendar.name || calendar.id}
              </span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

const DefaultCalendarSidebar: React.FC<CalendarSidebarRenderProps> = ({
  app,
  calendars,
  toggleCalendarVisibility,
  isCollapsed,
  setCollapsed,
  renderCalendarContextMenu,
  createCalendarMode = 'inline',
  renderCreateCalendarDialog,
}) => {
  const currentDate = app.getCurrentDate();
  const visibleMonthDate = app.getVisibleMonth();
  const visibleYear = visibleMonthDate.getFullYear();
  const visibleMonthIndex = visibleMonthDate.getMonth();

  const [showCreateDialog, setShowCreateDialog] = useState(false);

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

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    calendarId: string;
  } | null>(null);

  const [customColorPicker, setCustomColorPicker] = useState<{
    x: number;
    y: number;
    calendarId: string;
    initialColor: string;
    currentColor: string;
  } | null>(null);

  // Merge Calendar State
  const [mergeState, setMergeState] = useState<{ sourceId: string; targetId: string } | null>(null);

  // Delete Calendar State
  const [deleteState, setDeleteState] = useState<{
    calendarId: string;
    step: 'initial' | 'confirm_delete';
  } | null>(null);
  const [showMergeDropdown, setShowMergeDropdown] = useState(false);

  const handleContextMenu = useCallback((e: React.MouseEvent, calendarId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      calendarId,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDeleteCalendar = useCallback(() => {
    if (contextMenu) {
      setDeleteState({ calendarId: contextMenu.calendarId, step: 'initial' });
      handleCloseContextMenu();
    }
  }, [contextMenu, handleCloseContextMenu]);

  const handleColorSelect = useCallback((color: string) => {
    if (contextMenu) {
      const { colors, darkColors } = getCalendarColorsForHex(color);
      app.updateCalendar(contextMenu.calendarId, {
        colors,
        darkColors
      });
      handleCloseContextMenu();
    }
  }, [app, contextMenu, handleCloseContextMenu]);

  const handleCustomColor = useCallback(() => {
    if (contextMenu) {
      const calendar = calendars.find(c => c.id === contextMenu.calendarId);
      if (calendar) {
        setCustomColorPicker({
          x: contextMenu.x,
          y: contextMenu.y,
          calendarId: contextMenu.calendarId,
          initialColor: calendar.colors.lineColor,
          currentColor: calendar.colors.lineColor,
        });
      }
      handleCloseContextMenu();
    }
  }, [contextMenu, calendars, handleCloseContextMenu]);

  const handleMergeSelect = useCallback((targetId: string) => {
    if (contextMenu) {
      setMergeState({
        sourceId: contextMenu.calendarId,
        targetId
      });
      handleCloseContextMenu();
    }
  }, [contextMenu, handleCloseContextMenu]);

  const handleMergeConfirm = useCallback(() => {
    if (mergeState) {
      const { sourceId, targetId } = mergeState;
      app.mergeCalendars(sourceId, targetId);
      setMergeState(null);
    }
  }, [app, mergeState]);

  const handleConfirmDelete = useCallback(() => {
    if (deleteState) {
      app.deleteCalendar(deleteState.calendarId);
      setDeleteState(null);
    }
  }, [app, deleteState]);

  const handleDeleteMergeSelect = useCallback((targetId: string) => {
    if (deleteState) {
      setMergeState({
        sourceId: deleteState.calendarId,
        targetId
      });
      setDeleteState(null);
      setShowMergeDropdown(false);
    }
  }, [deleteState]);

  const handleCreateCalendar = useCallback(() => {
    if (createCalendarMode === 'modal') {
      setShowCreateDialog(true);
      return;
    }

    // Inline mode
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const { colors, darkColors } = getCalendarColorsForHex(randomColor);
    const newId = generateUniKey();

    const newCalendar: CalendarType = {
      id: newId,
      name: 'Untitled',
      colors,
      darkColors,
      isVisible: true,
      isDefault: false,
    };

    app.createCalendar(newCalendar);
    setEditingCalendarId(newId);
    setEditingName('Untitled');

    // Defer focus to allow render
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 0);

  }, [app, createCalendarMode]);

  const sourceCalendarName = useMemo(() => {
    if (mergeState) {
      return calendars.find(c => c.id === mergeState.sourceId)?.name || 'Unknown';
    }
    return '';
  }, [mergeState, calendars]);

  const targetCalendarName = useMemo(() => {
    if (mergeState) {
      return calendars.find(c => c.id === mergeState.targetId)?.name || 'Unknown';
    }
    return '';
  }, [mergeState, calendars]);

  const deleteCalendarName = useMemo(() => {
    if (deleteState) {
      return calendars.find(c => c.id === deleteState.calendarId)?.name || 'Unknown';
    }
    return '';
  }, [deleteState, calendars]);

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
              onClick={handleCreateCalendar}
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
                    onContextMenu={(e) => handleContextMenu(e, calendar.id)}
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
                  onContextMenu={(e) => handleContextMenu(e, calendar.id)}
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
                      <span className="flex-1 truncate text-sm text-gray-700 group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-white">
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
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          className="w-64 p-2"
        >
          {renderCalendarContextMenu ? (
            renderCalendarContextMenu(
              calendars.find(c => c.id === contextMenu.calendarId)!,
              handleCloseContextMenu
            )
          ) : (
            <>
              <ContextMenuLabel>
                Calendar Options
              </ContextMenuLabel>
              <MergeMenuItem
                calendars={calendars}
                currentCalendarId={contextMenu.calendarId}
                onMergeSelect={handleMergeSelect}
              />
              <ContextMenuItem
                onClick={handleDeleteCalendar}
              >
                Delete
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuColorPicker
                selectedColor={
                  calendars.find(c => c.id === contextMenu.calendarId)?.colors.lineColor
                }
                onSelect={handleColorSelect}
                onCustomColor={handleCustomColor}
              />
            </>
          )}
        </ContextMenu>
      )}

      {showCreateDialog && (
        renderCreateCalendarDialog ? (
          renderCreateCalendarDialog({
            onClose: () => setShowCreateDialog(false),
            onCreate: (calendar) => {
              app.createCalendar(calendar);
              setShowCreateDialog(false);
            },
          })
        ) : (
          <CreateCalendarDialog
            onClose={() => setShowCreateDialog(false)}
            onCreate={(calendar) => {
              app.createCalendar(calendar);
              setShowCreateDialog(false);
            }}
          />
        )
      )}

      {mergeState && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Merge &quot;{sourceCalendarName}&quot; with &quot;{targetCalendarName}&quot;?
            </h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to merge &ldquo;{sourceCalendarName}&rdquo; with &quot;{targetCalendarName}&quot;? Doing so will move all the events from &quot;{sourceCalendarName}&quot; to &quot;{targetCalendarName}&quot; and &quot;{sourceCalendarName}&quot; will be deleted. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMergeState(null)}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMergeConfirm}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteState && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
            {deleteState.step === 'initial' ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete &quot;{deleteCalendarName}&quot;?
                </h2>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Do you want to delete &quot;{deleteCalendarName}&quot; or merge its events into another existing calendar?
                </p>
                <div className="mt-6 flex justify-between items-center">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMergeDropdown(!showMergeDropdown)}
                      className="flex items-center gap-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-700"
                    >
                      Merge
                    </button>
                    {showMergeDropdown && (
                      <div className="absolute left-0 top-full mt-1 min-w-full w-max rounded-md border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 z-10 max-h-60 overflow-y-auto">
                        {calendars
                          .filter(c => c.id !== deleteState.calendarId)
                          .map(calendar => (
                            <div
                              key={calendar.id}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700 cursor-pointer"
                              onClick={() => handleDeleteMergeSelect(calendar.id)}
                            >
                              <div
                                className="mr-2 h-3 w-3 rounded-sm shrink-0"
                                style={{ backgroundColor: calendar.colors.lineColor }}
                              />
                              <span className="whitespace-nowrap">{calendar.name || calendar.id}</span>
                            </div>
                          ))}
                      </div>
                    )}                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteState(null);
                        setShowMergeDropdown(false);
                      }}
                      className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteState({ ...deleteState, step: 'confirm_delete' })}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Are you sure you want to delete the calendar &ldquo;{deleteCalendarName}&rdquo;?
                </h2>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  If you delete this calendar, all events associated with the calendar will also be deleted.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteState(null);
                      setShowMergeDropdown(false);
                    }}
                    className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {customColorPicker && createPortal(
        <div
          className="fixed inset-0 z-50"
          onMouseDown={() => setCustomColorPicker(null)}
        >
          <div
            className="absolute rounded-md bg-white shadow-xl border border-gray-200 dark:bg-slate-800 dark:border-gray-700"
            style={{
              top: customColorPicker.y,
              left: customColorPicker.x
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <SketchPicker
              width='220px'
              color={customColorPicker.currentColor}
              onChange={(color) => {
                setCustomColorPicker(prev => prev ? { ...prev, currentColor: color.hex } : null);
              }}
              onChangeComplete={(color) => {
                const { colors, darkColors } = getCalendarColorsForHex(color.hex);
                app.updateCalendar(customColorPicker.calendarId, {
                  colors,
                  darkColors
                });
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DefaultCalendarSidebar;
