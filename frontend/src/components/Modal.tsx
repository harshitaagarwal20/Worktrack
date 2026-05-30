import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
}

export default function Modal({ open, title, subtitle, onClose, children, panelClassName = 'max-w-3xl' }: Props) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:px-4 sm:py-6">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-10 w-full ${panelClassName} overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-7rem)] sm:max-h-[calc(100vh-10rem)] overflow-y-auto px-4 sm:px-5 py-4 sm:py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
