import React from "react";

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children }) {
  return <div className="mt-4">{children}</div>;
}

export function DialogHeader({ children }) {
  return <div className="border-b border-slate-200 dark:border-slate-700 pb-2">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{children}</h2>;
}

export function DialogFooter({ children }) {
  return <div className="mt-4 flex justify-end gap-2">{children}</div>;
}