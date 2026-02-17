import React from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Подтверждение',
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
}) => {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onCancel,
    initialFocusSelector: '[data-cancel-button]',
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      <div
        ref={focusTrapRef}
        className="relative w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 z-10">
          <h2 id="confirm-modal-title" className="text-white font-semibold flex items-center gap-2">
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p id="confirm-modal-description" className="text-zinc-300 mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              data-cancel-button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 -z-10" onClick={onCancel} aria-hidden="true" />
    </div>
  );
};
