'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { CircleAlert } from 'lucide-react';

function formatMessage(value) {
  if (value instanceof Error) return value.message;
  if (value && typeof value === 'object') {
    const message = value.message || value.error || value.detail;
    if (typeof message === 'string') return message;
    return JSON.stringify(value);
  }
  return value == null ? 'An unexpected response occurred.' : String(value);
}

export default function AppAlertProvider({ children }) {
  const [dialogs, setDialogs] = useState([]);

  const showAlert = useCallback((message) => {
    setDialogs((current) => [...current, { message: formatMessage(message), type: 'alert' }]);
  }, []);

  const showConfirm = useCallback((message) => new Promise((resolve) => {
    setDialogs((current) => [
      ...current,
      { message: String(message), type: 'confirm', resolve },
    ]);
  }), []);

  useLayoutEffect(() => {
    const nativeAlert = window.alert;
    const nativeConfirm = window.confirm;
    window.alert = showAlert;
    window.confirm = showConfirm;

    return () => {
      window.alert = nativeAlert;
      window.confirm = nativeConfirm;
    };
  }, [showAlert, showConfirm]);

  const closeDialog = useCallback((confirmed = false) => {
    const dialog = dialogs[0];
    if (!dialog) return;
    setDialogs((current) => current[0] === dialog ? current.slice(1) : current);
    if (dialog.type === 'confirm') dialog.resolve(confirmed);
  }, [dialogs]);

  useEffect(() => {
    if (dialogs[0]?.type !== 'confirm') return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeDialog(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogs, closeDialog]);

  const currentDialog = dialogs[0];

  return (
    <>
      {children}
      {currentDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <section
            role={currentDialog.type === 'confirm' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="app-dialog-title"
            aria-describedby="app-dialog-message"
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <CircleAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-400" />
              <div className="min-w-0 flex-1">
                <h2 id="app-dialog-title" className="text-lg font-semibold text-white">
                  {currentDialog.type === 'confirm' ? 'Please confirm' : 'Notice'}
                </h2>
                <p
                  id="app-dialog-message"
                  className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-300"
                >
                  {currentDialog.message}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                autoFocus={currentDialog.type !== 'confirm'}
                onClick={() => closeDialog(false)}
                className={`rounded-lg px-5 py-2 text-sm font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  currentDialog.type === 'confirm'
                    ? 'bg-slate-700 hover:bg-slate-600 focus:ring-slate-400'
                    : 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-400'
                }`}
              >
                {currentDialog.type === 'confirm' ? 'Cancel' : 'OK'}
              </button>
              {currentDialog.type === 'confirm' && (
                <button
                  type="button"
                  autoFocus
                  onClick={() => closeDialog(true)}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  Confirm
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
