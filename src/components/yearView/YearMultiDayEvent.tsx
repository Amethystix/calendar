import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Event, EventDetailContentRenderer, EventDetailDialogRenderer, EventDetailPosition } from '@/types';
import { getEventBgColor, getEventTextColor, getSelectedBgColor, getLineColor } from '@/utils';
import { getEventIcon } from '@/components/monthView/util';
import { YearMultiDaySegment } from './utils';
import DefaultEventDetailPanel from '../common/DefaultEventDetailPanel';
import EventDetailPanelWithContent from '../common/EventDetailPanelWithContent';
import { CalendarApp } from '@/core';

interface YearMultiDayEventProps {
  segment: YearMultiDaySegment;
  columnsPerRow: number;
  isDragging: boolean;
  isSelected: boolean;
  onMoveStart?: (e: React.MouseEvent | React.TouchEvent, event: Event) => void;
  onEventSelect?: (eventId: string | null) => void;
  detailPanelEventId?: string | null;
  onDetailPanelToggle?: (eventId: string | null) => void;
  customDetailPanelContent?: EventDetailContentRenderer;
  customEventDetailDialog?: EventDetailDialogRenderer;
  app?: CalendarApp;
  calendarRef?: React.RefObject<HTMLDivElement>;
}

export const YearMultiDayEvent: React.FC<YearMultiDayEventProps> = ({
  segment,
  columnsPerRow,
  isDragging,
  isSelected,
  onMoveStart,
  onEventSelect,
  detailPanelEventId,
  onDetailPanelToggle,
  customDetailPanelContent,
  customEventDetailDialog,
  app,
  calendarRef,
}) => {
  const { event, startCellIndex, endCellIndex, visualRowIndex } = segment;
  
  const eventRef = useRef<HTMLDivElement>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const [detailPanelPosition, setDetailPanelPosition] = useState<EventDetailPosition | null>(null);

  const showDetailPanel = detailPanelEventId === event.id;
  
  const startPercent = (startCellIndex / columnsPerRow) * 100;
  const widthPercent = ((endCellIndex - startCellIndex + 1) / columnsPerRow) * 100;
  
  // Basic styling
  const calendarId = event.calendarId || 'blue';
  const bgColor = isSelected || isDragging ? getSelectedBgColor(calendarId) : getEventBgColor(calendarId);
  const textColor = isSelected || isDragging ? '#fff' : getEventTextColor(calendarId);
  const lineColor = getLineColor(calendarId);
  const isAllDay = !!event.allDay;
  const icon = isAllDay ? getEventIcon(event) : null;

  const EVENT_HEIGHT = 16;
  const ROW_SPACING = 18;
  const TOP_OFFSET = visualRowIndex * ROW_SPACING;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onEventSelect) {
      onEventSelect(event.id);
    }
    if (onMoveStart) {
      onMoveStart(e, event);
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
     if (onEventSelect) {
      onEventSelect(event.id);
    }
    if (onMoveStart) {
      onMoveStart(e, event);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = eventRef.current?.getBoundingClientRect();
    if (rect) {
      // Basic positioning logic - can be enhanced
      const panelHeight = 200; // estimated
      const panelWidth = 300; // estimated
      let top = rect.bottom + 10;
      let left = rect.left;
      
      // Adjust if off screen
      if (top + panelHeight > window.innerHeight) {
        top = rect.top - panelHeight - 10;
      }
      if (left + panelWidth > window.innerWidth) {
        left = window.innerWidth - panelWidth - 10;
      }

      setDetailPanelPosition({
        top,
        left,
        eventHeight: rect.height,
        eventMiddleY: rect.top + rect.height / 2,
      });
    }

    onDetailPanelToggle?.(event.id);
  };

  const renderDetailPanel = () => {
    if (!showDetailPanel || !calendarRef) return null;

    const handleClose = () => {
      onDetailPanelToggle?.(null);
      if (onEventSelect) onEventSelect(null);
    };

    if (customEventDetailDialog) {
      const DialogComponent = customEventDetailDialog;
      const dialogProps = {
        event,
        isOpen: showDetailPanel,
        isAllDay,
        onClose: handleClose,
        app: app!,
        onEventUpdate: (updated: Event) => app?.updateEvent(updated.id, updated),
        onEventDelete: (id: string) => app?.deleteEvent(id),
      };

      if (typeof window === 'undefined' || typeof document === 'undefined') return null;
      const portalTarget = document.body;
      if (!portalTarget) return null;

      return ReactDOM.createPortal(
        <DialogComponent {...dialogProps} />,
        portalTarget
      );
    }

    if (!detailPanelPosition) return null;

    if (customDetailPanelContent) {
      return (
        <EventDetailPanelWithContent
          event={event}
          position={detailPanelPosition}
          panelRef={detailPanelRef}
          isAllDay={isAllDay}
          onClose={handleClose}
          contentRenderer={customDetailPanelContent}
          onEventUpdate={(updated) => app?.updateEvent(updated.id, updated)}
          onEventDelete={(id) => app?.deleteEvent(id)}
          eventVisibility="visible"
          calendarRef={calendarRef}
          selectedEventElementRef={eventRef}
        />
      );
    }

    return (
      <DefaultEventDetailPanel
        event={event}
        position={detailPanelPosition}
        panelRef={detailPanelRef}
        isAllDay={isAllDay}
        onClose={handleClose}
        app={app}
        onEventUpdate={(updated) => app?.updateEvent(updated.id, updated)}
        onEventDelete={(id) => app?.deleteEvent(id)}
        eventVisibility="visible"
        calendarRef={calendarRef}
        selectedEventElementRef={eventRef}
      />
    );
  };

  return (
    <>
      <div
        ref={eventRef}
        className="absolute z-10 rounded text-xs px-1 overflow-hidden whitespace-nowrap cursor-pointer transition-colors"
        style={{
          left: `${startPercent}%`,
          top: `${TOP_OFFSET}px`,
          height: `${EVENT_HEIGHT}px`,
          backgroundColor: bgColor,
          color: textColor,
          marginLeft: '2px', // Slight gap
          width: `calc(${widthPercent}% - 4px)`, // Compensate for margins
          pointerEvents: isDragging ? 'none' : 'auto',
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        title={event.title}
      >
        <div className="w-full h-full flex items-center overflow-hidden gap-1">
          {!isAllDay && (
            <span
              style={{ backgroundColor: lineColor }}
              className="inline-block w-0.75 h-3 shrink-0 rounded-full"
            ></span>
          )}
          {isAllDay && icon && (
            <div className="shrink-0 flex items-center justify-center opacity-80 scale-75">
              {icon}
            </div>
          )}
          <span 
            className="w-full block font-medium"
            style={{
               maskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
               WebkitMaskImage: 'linear-gradient(to right, black 70%, transparent 100%)',
            }}
          >
            {event.title}
          </span>
        </div>
      </div>
      {renderDetailPanel()}
    </>
  );
};
