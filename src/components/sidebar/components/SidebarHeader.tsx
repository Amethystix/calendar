import React from 'react';
import { PanelRightClose, PanelRightOpen, Plus } from 'lucide-react';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onCollapseToggle: () => void;
  onAddCalendar: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  onCollapseToggle,
  onAddCalendar,
}) => {
  return (
    <div className="flex items-center px-2 py-2">
      <button
        type="button"
        aria-label={isCollapsed ? 'Expand calendar sidebar' : 'Collapse calendar sidebar'}
        className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-slate-800"
        onClick={onCollapseToggle}
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
            onClick={onAddCalendar}
          >
            <Plus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
};
