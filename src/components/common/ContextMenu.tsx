import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, children }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    // Use mousedown to capture clicks outside immediately
    document.addEventListener('mousedown', handleClickOutside);
    
    // Also close on scroll or window resize
    const handleScrollOrResize = () => onClose();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [onClose]);

  // Ensure menu stays within viewport
  const style: React.CSSProperties = {
    top: y,
    left: x,
  };
  
  // Simple viewport adjustment logic could be added here if needed
  // For now rely on user providing reasonable x,y or allow CSS to handle basic constraints if possible,
  // but usually absolute positioning requires manual calculation for edge cases.

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-slate-800 py-1"
      style={style}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>,
    document.body
  );
};

export const ContextMenuItem: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
}> = ({ onClick, children, icon, danger }) => {
  return (
    <div
      className={`flex cursor-pointer items-center px-3 py-2 text-sm transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
      {children}
    </div>
  );
};

export const ContextMenuSeparator: React.FC = () => (
  <div className="my-1 h-px bg-gray-200 dark:bg-slate-700" />
);

export const ContextMenuLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
    {children}
  </div>
);

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#64748b', // slate
  '#71717a', // zinc
];

export const ContextMenuColorPicker: React.FC<{
  selectedColor?: string;
  onSelect: (color: string) => void;
}> = ({ selectedColor, onSelect }) => {
  return (
    <div className="grid grid-cols-5 gap-2 p-3">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`h-5 w-5 rounded-full border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 ${
            selectedColor?.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-slate-800' : ''
          }`}
          style={{ backgroundColor: color }}
          onClick={(e) => {
             e.stopPropagation();
             onSelect(color);
          }}
          title={color}
        />
      ))}
    </div>
  );
};

export default ContextMenu;
