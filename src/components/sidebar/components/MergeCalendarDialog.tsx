import React from 'react';

interface MergeCalendarDialogProps {
  sourceName: string;
  targetName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const MergeCalendarDialog: React.FC<MergeCalendarDialogProps> = ({
  sourceName,
  targetName,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Merge &quot;{sourceName}&quot; with &quot;{targetName}&quot;?
        </h2>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to merge &ldquo;{sourceName}&rdquo; with &quot;{targetName}&quot;? Doing so will move all the events from &quot;{sourceName}&quot; to &quot;{targetName}&quot; and &quot;{sourceName}&quot; will be deleted. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Merge
          </button>
        </div>
      </div>
    </div>
  );
};
