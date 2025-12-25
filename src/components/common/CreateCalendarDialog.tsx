import React, { useState } from 'react';
import { getCalendarColorsForHex } from '../../core/calendarRegistry';
import { generateUniKey } from '../../utils/helpers';
import { CalendarType, CreateCalendarDialogProps } from '../../types';

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

export const CreateCalendarDialog: React.FC<CreateCalendarDialogProps> = ({
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[5]); // Default blue

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const { colors, darkColors } = getCalendarColorsForHex(selectedColor);
    
    const newCalendar: CalendarType = {
      id: generateUniKey(),
      name: name.trim(),
      colors,
      darkColors,
      isVisible: true,
      isDefault: false,
    };

    onCreate(newCalendar);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Create New Calendar
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
              Calendar Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:border-blue-400 dark:focus:border-blue-500 transition"
              placeholder="e.g. Work"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs text-gray-600 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-6 w-6 rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                    selectedColor === color ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
